import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { postId, content, media_urls, vk_token } = await req.json()

    console.log('Publishing to VK:', { postId, hasMedia: media_urls?.length > 0 })

    // Prepare attachments for media files
    let attachments = ''
    if (media_urls && media_urls.length > 0) {
      // For now, we'll just include the URLs as text since VK requires special handling for media
      // In a production app, you'd need to upload media to VK servers first
      const mediaText = media_urls.map(url => `\n📎 ${url}`).join('')
      content = content + mediaText
    }

    // Publish to VK wall
    const vkResponse = await fetch(`https://api.vk.ru/method/wall.post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: vk_token,
        v: '5.131',
        message: content,
        from_group: '0', // Post from user, not group
        attachments: attachments,
      }),
    })

    const vkData = await vkResponse.json()
    
    if (vkData.error) {
      console.error('VK API error:', vkData.error)
      throw new Error(`VK API error: ${vkData.error.error_msg}`)
    }

    console.log('Successfully published to VK:', vkData.response.post_id)

    // Update post in database with vk_post_id
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        vk_post_id: vkData.response.post_id.toString(),
        published_at: new Date().toISOString(),
        status: 'published'
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        vk_post_id: vkData.response.post_id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error publishing to VK:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to publish to VK' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})