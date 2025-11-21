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
      .select('role, sub_role')
      .eq('id', callerId)
      .maybeSingle()

    if (profileError) return res.status(500).json({ error: 'Failed to fetch caller profile' })

    if (!callerProfile || callerProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Only mess owners (admin) can create admins' })
    }

    // Only owners can create sub-admins
    if (callerProfile.sub_role === 'sub_admin') {
      return res.status(403).json({ error: 'Sub-admins cannot create other admins' })
    }

    const { email, password, name, phone } = req.body
    if (!email) return res.status(400).json({ error: 'Missing email' })
    if (!password) return res.status(400).json({ error: 'Missing password' })

    // Use provided password or generate a temporary one
    const adminPassword = password || 'Tmp' + Math.random().toString(36).slice(2, 10) + 'A1!'

    // create new auth user
    const createRes = await adminSupabase.auth.admin.createUser({
      email,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'admin', full_name: name || email.split('@')[0], phone: phone || '' }
    })

    if (createRes.error) return res.status(500).json({ error: createRes.error.message })

    const newUser = createRes.data.user

    // Get the mess_id of the calling admin
    const { data: callerMessData } = await adminSupabase
      .from('users')
      .select('mess_id')
      .eq('id', callerId)
      .single()

    const messId = callerMessData?.mess_id || null

    // upsert profile - match actual users table schema
    // Sub-admins created by owner are read-only
    const { error: upsertErr } = await adminSupabase.from('users').upsert([
      {
        id: newUser.id,
        name: name || email.split('@')[0],
        mobile_number: phone || '0000000000',
        parent_mobile: null,
        photo_url: null,
        role: 'admin',
        sub_role: 'sub_admin', // Mark as sub-admin (read-only)
        created_by: callerId, // Track who created this admin
        mess_id: messId,
        is_active: true
      }
    ], { onConflict: 'id' })

    if (upsertErr) return res.status(500).json({ error: upsertErr.message })

    return res.status(200).json({ 
      success: true, 
      id: newUser.id, 
      email: newUser.email,
      tempPassword: adminPassword 
    })
  } catch (err: any) {
    console.error('create-admin-by-owner error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
