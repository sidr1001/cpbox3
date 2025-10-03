import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Button = { text: string; url: string }

function buildReplyMarkup(buttons?: Button[]) {
  if (!buttons || !Array.isArray(buttons) || buttons.length === 0) return undefined
  return {
    inline_keyboard: [buttons.map(b => ({ text: b.text, url: b.url }))]
  }
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
}

function isVideo(url: string) {
  return /\.(mp4|mov|m4v|webm)$/i.test(url)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { postId, content, media_urls, telegram_token, telegram_chat_id, buttons } = await req.json()

    console.log('Publishing to Telegram:', { postId, chat_id: telegram_chat_id, media_count: media_urls?.length || 0 })

    const media: string[] = Array.isArray(media_urls) ? media_urls.filter(Boolean) : []

    let telegramData: any
    let messageId: string | number | undefined

    if (media.length === 0) {
      // Only text
      const res = await fetch(`https://api.telegram.org/bot${telegram_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegram_chat_id,
          text: content,
          parse_mode: 'HTML',
          reply_markup: buildReplyMarkup(buttons)
        }),
      })
      telegramData = await res.json()
      if (!telegramData.ok) throw new Error(`Telegram API error: ${telegramData.description}`)
      messageId = telegramData.result.message_id
    } else if (media.length === 1) {
      // Single media with caption and optional buttons
      const url = media[0]
      const endpoint = isVideo(url) ? 'sendVideo' : 'sendPhoto'
      const payload: any = {
        chat_id: telegram_chat_id,
        caption: content || undefined,
        parse_mode: 'HTML',
        reply_markup: buildReplyMarkup(buttons)
      }
      if (endpoint === 'sendVideo') payload.video = url; else payload.photo = url

      const res = await fetch(`https://api.telegram.org/bot${telegram_token}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      telegramData = await res.json()
      if (!telegramData.ok) throw new Error(`Telegram API error: ${telegramData.description}`)
      messageId = telegramData.result.message_id
    } else {
      // Multiple media: use media group, caption only on first item
      const group = media.map((url, idx) => ({
        type: isVideo(url) ? 'video' : (isImage(url) ? 'photo' : 'photo'),
        media: url,
        caption: idx === 0 ? content : undefined,
        parse_mode: idx === 0 ? 'HTML' : undefined,
      }))

      const res = await fetch(`https://api.telegram.org/bot${telegram_token}/sendMediaGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegram_chat_id, media: group }),
      })
      telegramData = await res.json()
      if (!telegramData.ok) throw new Error(`Telegram API error: ${telegramData.description}`)
      // sendMediaGroup returns array of messages
      messageId = telegramData.result?.[0]?.message_id

      // Buttons are not supported on media groups directly — attach to the first message via editMessageReplyMarkup
      if (buttons && buttons.length > 0 && messageId) {
        await fetch(`https://api.telegram.org/bot${telegram_token}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegram_chat_id,
            message_id: messageId,
            reply_markup: buildReplyMarkup(buttons)
          })
        })
      }
    }

    console.log('Successfully published to Telegram:', messageId)

    // Update post in database with telegram_message_id
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        telegram_message_id: messageId?.toString() ?? null,
        published_at: new Date().toISOString(),
        status: 'published'
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, telegram_message_id: messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Error publishing to Telegram:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to publish to Telegram' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})