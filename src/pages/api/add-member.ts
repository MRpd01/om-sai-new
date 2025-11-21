import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * Generate password in format: [FirstName 2 letters][Surname 2 letters][Last 2 digits of mobile]@123
 * Example: John Doe with mobile 9876543210 -> JoDo10@123
 */
function generateMemberPassword(fullName: string, mobileNumber: string): string {
  // Split name into parts
  const nameParts = fullName.trim().split(/\s+/)
  
  // Get first name (first 2 letters, uppercase)
  const firstName = nameParts[0] || ''
  const firstTwo = firstName.substring(0, 2).toUpperCase()
  
  // Get surname (first 2 letters, uppercase) - use last part of name
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName
  const surnameTwo = surname.substring(0, 2).toUpperCase()
  
  // Get last 2 digits of mobile number
  const cleanMobile = mobileNumber.replace(/\D/g, '') // Remove non-digits
  const lastTwo = cleanMobile.slice(-2)
  
  // Construct password: [First2][Surname2][Mobile2]@123
  const password = `${firstTwo}${surnameTwo}${lastTwo}@123`
  
  return password
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase configuration')
    return res.status(500).json({ error: 'Server not configured' })
  }

  const authHeader = req.headers.authorization || ''
  const token = (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader) || ''
  if (!token) return res.status(401).json({ error: 'Missing access token' })

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  try {
    console.log('Starting add member process...')
    
    // Verify token and get calling user
    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token as string)
    if (userError || !userData?.user) {
      console.error('Token verification failed:', userError)
      return res.status(401).json({ error: 'Invalid token' })
    }

    const callerId = userData.user.id
    console.log('Caller verified:', callerId)

    // Check caller role and mess_id in users table
    const { data: callerProfile, error: profileError } = await adminSupabase
      .from('users')
      .select('role,mess_id')
      .eq('id', callerId)
      .maybeSingle()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return res.status(500).json({ error: 'Failed to fetch caller profile: ' + profileError.message })
    }

    if (!callerProfile || callerProfile.role !== 'admin') {
      console.error('Unauthorized access attempt')
      return res.status(403).json({ error: 'Only mess owners (admin) can add members' })
    }

    console.log('Admin verified, mess_id:', callerProfile.mess_id)

    const { name, email, phone, parent_mobile, plan, photoBase64, paymentAmount, paymentType, totalAmountDue } = req.body
    if (!email || !name || !phone) return res.status(400).json({ error: 'Missing required fields' })

    console.log('Adding member:', name, email, phone)

    const amountPaid = Number(paymentAmount) || 0
    const totalDue = Number(totalAmountDue)
    
    if (!totalDue || totalDue <= 0) {
      return res.status(400).json({ error: 'Invalid total amount due. Please specify the plan amount.' })
    }
    
    // Determine payment status based on amount
    let paymentStatus: 'success' | 'due' | 'pending' = 'due'
    if (amountPaid === 0) {
      paymentStatus = 'due'
    } else if (amountPaid < totalDue) {
      paymentStatus = 'pending' // Advance payment
    } else {
      paymentStatus = 'success' // Full payment
    }

    // Generate password using member's name and mobile number
    // Format: [FirstName2][Surname2][LastMobile2]@123
    const tempPass = generateMemberPassword(name, phone)
    console.log('Generated password for member')

    // create new auth user
    console.log('Creating auth user...')
    const createRes = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPass,
      email_confirm: true,
      user_metadata: { role: 'user', full_name: name, phone }
    })

    if (createRes.error) {
      console.error('Auth user creation failed:', createRes.error)
      return res.status(500).json({ error: 'Failed to create user: ' + createRes.error.message })
    }

    const newUser = (createRes as any).data?.user || (createRes as any).user
    console.log('Auth user created:', newUser.id)

    // Handle photo upload if provided
    let photoUrl = null
    if (photoBase64) {
      try {
        console.log('Uploading photo to storage...')
        // Extract base64 data (remove data:image/...;base64, prefix)
        const base64Data = photoBase64.includes('base64,') 
          ? photoBase64.split('base64,')[1] 
          : photoBase64
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64')
        
        // Generate unique filename
        const fileExt = 'jpg' // Default to jpg
        const fileName = `${newUser.id}-${Date.now()}.${fileExt}`
        const filePath = `member-photos/${fileName}`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
          .from('member-photos')
          .upload(filePath, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          })
        
        if (uploadError) {
          console.error('Photo upload error:', uploadError)
          // Don't fail the entire operation if photo upload fails
        } else {
          // Get public URL
          const { data: urlData } = adminSupabase.storage
            .from('member-photos')
            .getPublicUrl(filePath)
          
          photoUrl = urlData.publicUrl
          console.log('Photo uploaded successfully:', photoUrl)
        }
      } catch (photoError) {
        console.error('Photo processing error:', photoError)
        // Don't fail the entire operation if photo processing fails
      }
    }

    console.log('Upserting user profile...')
    // upsert profile (users table only has: name, mobile_number, parent_mobile, photo_url, role, mess_id, is_active)
    const { error: upsertErr } = await adminSupabase.from('users').upsert([
      {
        id: newUser.id,
        name: name,
        mobile_number: phone,
        parent_mobile: parent_mobile || null,
        photo_url: photoUrl,
        role: 'user',
        mess_id: callerProfile.mess_id || null,
        is_active: true
      }
    ], { onConflict: 'id' })

    if (upsertErr) {
      console.error('Profile upsert failed:', upsertErr)
      return res.status(500).json({ error: 'Failed to create profile: ' + upsertErr.message })
    }

    console.log('Profile created successfully')

    // create membership record (30 days)
    const joining_date = new Date().toISOString().split('T')[0]
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)
    const expiry_date = expiry.toISOString().split('T')[0]

    console.log('Creating membership record...')
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

    if (mmErr) {
      console.error('Membership creation failed:', mmErr)
      return res.status(500).json({ error: 'Failed to create membership: ' + mmErr.message })
    }

    console.log('Membership created successfully')

    // If payment was made, create a payment record
    if (amountPaid > 0) {
      console.log('Creating payment record...')
      const transactionId = `TXN-${Date.now()}-${newUser.id.substring(0, 8)}`
      const { error: paymentErr } = await adminSupabase.from('payments').insert([{
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
      
      if (paymentErr) {
        console.error('Payment record creation failed:', paymentErr)
        // Don't fail the entire operation if payment record fails
      } else {
        console.log('Payment record created successfully')
      }
    }

    console.log('Member added successfully!')
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
    return res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown error') })
  }
}
