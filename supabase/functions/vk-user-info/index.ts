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
    const { vk_token } = await req.json()

    if (!vk_token) {
      throw new Error('VK token is required')
    }

    // Get user info
    const userResponse = await fetch(`https://api.vk.ru/method/users.get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: vk_token,
        v: '5.131',
        fields: 'id,first_name,last_name,photo_100,screen_name',
      }),
    })

    const userData = await userResponse.json()
    
    if (userData.error) {
      throw new Error(`VK API error: ${userData.error.error_msg}`)
    }

    // Get user groups (where user is admin or editor)
    const groupsResponse = await fetch(`https://api.vk.ru/method/groups.get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: vk_token,
        v: '5.131',
        extended: '1',
        filter: 'admin,editor',
        fields: 'id,name,screen_name,photo_100,type,is_admin,admin_level',
      }),
    })

    const groupsData = await groupsResponse.json()
    
    if (groupsData.error) {
      throw new Error(`VK API error: ${groupsData.error.error_msg}`)
    }

    // Get user pages (personal page)
    const pagesResponse = await fetch(`https://api.vk.ru/method/account.getInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: vk_token,
        v: '5.131',
      }),
    })

    const pagesData = await pagesResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        user: userData.response?.[0] || null,
        groups: groupsData.response?.items || [],
        pages: pagesData.response || null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error getting VK user info:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to get VK user info' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})