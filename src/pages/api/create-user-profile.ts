import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const profileData = req.body;

    console.log('📝 Creating user profile via API:', {
      userId: profileData.id,
      email: profileData.email,
      role: profileData.role
    });

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', profileData.id)
      .single();

    if (existingUser) {
      console.log('ℹ️ User profile already exists');
      return res.status(200).json({ 
        success: true, 
        message: 'User profile already exists' 
      });
    }

    // Get default mess for auto-assignment
    const { data: defaultMess } = await supabase
      .from('messes')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    // Ensure mess_id is set
    if (defaultMess && !profileData.mess_id) {
      profileData.mess_id = defaultMess.id;
      console.log('✅ Auto-assigned to default mess:', defaultMess.id);
    }

    // Insert user profile (service role bypasses RLS)
    const { data, error } = await supabase
      .from('users')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user profile:', error);
      return res.status(500).json({ 
        error: 'Failed to create user profile',
        details: error.message 
      });
    }

    console.log('✅ User profile created successfully:', data);
    return res.status(200).json({ 
      success: true, 
      data 
    });

  } catch (error: any) {
    console.error('❌ Exception in create-user-profile:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message 
    });
  }
}
