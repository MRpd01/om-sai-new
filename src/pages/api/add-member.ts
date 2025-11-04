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

    // Check caller role and mess_id in users table
    const { data: callerProfile, error: profileError } = await adminSupabase
      .from('users')
      .select('role,mess_id')
      .eq('id', callerId)
      .maybeSingle()

    if (profileError) return res.status(500).json({ error: 'Failed to fetch caller profile' })

    if (!callerProfile || callerProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Only mess owners (admin) can add members' })
    }

    const { name, email, phone, plan, photoBase64, paymentAmount, paymentType, totalAmountDue } = req.body
    if (!email || !name || !phone) return res.status(400).json({ error: 'Missing required fields' })

    const amountPaid = Number(paymentAmount) || 0
    const totalDue = Number(totalAmountDue) || 2600
    
    // Determine payment status based on amount
    let paymentStatus: 'success' | 'due' | 'pending' = 'due'
    if (amountPaid === 0) {
      paymentStatus = 'due'
    } else if (amountPaid < totalDue) {
      paymentStatus = 'pending' // Advance payment
    } else {
      paymentStatus = 'success' // Full payment
    }

    // generate a temporary password
    const tempPass = 'Tmp' + Math.random().toString(36).slice(2, 10) + 'A1!'

    // create new auth user
    const createRes = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPass,
      email_confirm: true,
      user_metadata: { role: 'user', full_name: name, phone }
    })

    if (createRes.error) return res.status(500).json({ error: createRes.error.message })

  const newUser = (createRes as any).data?.user || (createRes as any).user

    // Upload photo to Supabase Storage if provided
    let photoUrl = null
    if (photoBase64) {
      try {
        // Convert base64 to buffer
        const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        
        // Generate unique filename
        const fileName = `${newUser.id}-${Date.now()}.jpg`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
          .from('member-photos')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: true
          })
        
        if (uploadError) {
          console.error('Photo upload error:', uploadError)
        } else {
          // Get public URL
          const { data: urlData } = adminSupabase.storage
            .from('member-photos')
            .getPublicUrl(fileName)
          photoUrl = urlData.publicUrl
        }
      } catch (photoError) {
        console.error('Error processing photo:', photoError)
      }
    }

    // upsert profile
    const { error: upsertErr } = await adminSupabase.from('users').upsert([
      {
        id: newUser.id,
        name: name,
        email: email,
        mobile_number: phone,
        parent_mobile: null,
        photo_url: photoUrl,
        role: 'user',
        mess_id: callerProfile.mess_id || null,
        is_active: true
      }
  ], { onConflict: 'id' })

    if (upsertErr) return res.status(500).json({ error: upsertErr.message })

    // create membership record (30 days)
    const joining_date = new Date().toISOString().split('T')[0]
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)
    const expiry_date = expiry.toISOString().split('T')[0]

    const { error: mmErr } = await adminSupabase.from('mess_members').insert([{
      user_id: newUser.id,
      mess_id: callerProfile.mess_id || null,
      subscription_type: plan || 'full_month',
      payment_status: paymentStatus,
      joining_date,
      expiry_date,
      is_active: paymentStatus === 'success',
      advance_payment: amountPaid < totalDue ? amountPaid : 0,
      total_amount_due: totalDue,
      payment_type: paymentType || 'full'
    }])

    if (mmErr) return res.status(500).json({ error: mmErr.message })

    // If payment was made, create a payment record
    if (amountPaid > 0) {
      const transactionId = `TXN-${Date.now()}-${newUser.id.substring(0, 8)}`
      await adminSupabase.from('payments').insert([{
        user_id: newUser.id,
        mess_id: callerProfile.mess_id || null,
        amount: amountPaid,
        phonepe_transaction_id: transactionId,
        phonepe_merchant_transaction_id: transactionId,
        status: paymentStatus,
        subscription_type: plan || 'full_month',
        is_advance: amountPaid < totalDue,
        remaining_amount: totalDue - amountPaid
      }])
    }

    return res.status(200).json({ 
      success: true, 
      id: newUser.id, 
      email: newUser.email, 
      tempPassword: tempPass,
      paymentStatus: paymentStatus,
      amountPaid: amountPaid,
      remainingAmount: totalDue - amountPaid
    })
  } catch (err: any) {
    console.error('add-member error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
