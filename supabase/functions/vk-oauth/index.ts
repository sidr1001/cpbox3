import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let action = url.searchParams.get('action')
    const code = url.searchParams.get('code')

    // Also support action passed in POST body (when using supabase.functions.invoke)
    if (!action && req.method === 'POST') {
      try {
        const body = await req.json()
        action = body?.action
      } catch (_) {
        // ignore
      }
    }

    // If no action but we have a code, it's a callback from VK OAuth
    if (!action && code) {
      action = 'callback'
    }

    if (action === 'get_auth_url') {
      const clientId = Deno.env.get('VK_CLIENT_ID') || ''
      // NOTE: This Supabase Edge Function is deprecated in favor of backend route /api/vk/oauth/callback
      // Old redirect URIs commented below are left for reference. Migrate to your backend.
      // const redirectUri = encodeURIComponent('https://yourdomain.com/api/vk/oauth/callback')
      const redirectUri = encodeURIComponent('https://asjhequnposexawqaels.supabase.co/functions/v1/vk-oauth')
      const scope = 'photos,audio,video,docs,notes,pages,status,offers,questions,wall,groups,email,notifications,stats,ads,offline,docs,pages,stats,notifications'

      // Capture the origin of the app to redirect back correctly (works in preview and prod)
      const reqOrigin = req.headers.get('origin') || ''
      const appOrigin = reqOrigin || (Deno.env.get('APP_ORIGIN') || 'https://asjhequnposexawqaels-lovableproject.lovable.app')
      const state = encodeURIComponent(appOrigin)

      const authUrl = `https://oauth.vk.ru/authorize?client_id=${clientId}&display=popup&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&v=5.131&state=${state}`

      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      // Determine app origin: prefer VK state, then request origin, then env default
      const state = url.searchParams.get('state')
      let appOrigin = Deno.env.get('APP_ORIGIN') || 'https://asjhequnposexawqaels-lovableproject.lovable.app'
      if (state) {
        try { appOrigin = decodeURIComponent(state) } catch (_) { /* ignore */ }
      } else {
        const reqOrigin = req.headers.get('origin')
        if (reqOrigin) appOrigin = reqOrigin
      }

      if (error) {
        return Response.redirect(
          `${appOrigin}/settings#vk_error=${encodeURIComponent(error)}`,
          302
        )
      }

      if (!code) {
        return Response.redirect(
          `${appOrigin}/settings#vk_error=${encodeURIComponent('No authorization code received')}`,
          302
        )
      }

      // Exchange code for access token
	  const clientId = Deno.env.get('VK_CLIENT_ID') || ''
	  const clientSecret = Deno.env.get('VK_CLIENT_SECRET') || ''
	  const redirectUri = 'https://asjhequnposexawqaels.supabase.co/functions/v1/vk-oauth'

	  const tokenResponse = await fetch('https://oauth.vk.ru/access_token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
		  client_id: clientId,
		  client_secret: clientSecret,
		  redirect_uri: redirectUri,
		  code: code,
		}),
	  })

      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        return Response.redirect(
          `${appOrigin}/settings#vk_error=${encodeURIComponent(tokenData.error_description || 'VK authentication failed')}`,
          302
        )
      }

      // Return success with token
      return Response.redirect(
        `${appOrigin}/settings#vk_success=1&access_token=${tokenData.access_token}&user_id=${tokenData.user_id}`,
        302
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )

  } catch (error) {
    console.error('VK OAuth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})