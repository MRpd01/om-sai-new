import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return res.status(500).json({ error: 'Server not configured' })

  const authHeader = req.headers.authorization || ''
  const token = (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader) || ''
  if (!token) return res.status(401).json({ error: 'Missing access token' })

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  try {
    // Verify token and get calling user
  const { data: userData, error: userError } = await adminSupabase.auth.getUser(token as string)
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })

    const callerId = userData.user.id

    // Check caller role in users table
    const { data: callerProfile, error: profileError } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', callerId)
      .maybeSingle()

    if (profileError) return res.status(500).json({ error: 'Failed to fetch caller profile' })

    if (!callerProfile || callerProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Only mess owners (admin) can create admins' })
    }

    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Missing email' })

    // generate a temporary password
    const tempPass = 'Tmp' + Math.random().toString(36).slice(2, 10) + 'A1!'

    // create new auth user
    const createRes = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPass,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    })

    if (createRes.error) return res.status(500).json({ error: createRes.error.message })

    const newUser = createRes.data.user

    // upsert profile
    const { error: upsertErr } = await adminSupabase.from('users').upsert([
      {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.user_metadata?.full_name || '',
        phone: newUser.user_metadata?.phone || '',
        role: 'admin',
        avatar_url: null,
        language: 'mr'
      }
    ], { onConflict: 'id' })

    if (upsertErr) return res.status(500).json({ error: upsertErr.message })

    return res.status(200).json({ success: true, id: newUser.id, email: newUser.email })
  } catch (err: any) {
    console.error('create-admin-by-owner error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
