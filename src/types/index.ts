export type UserRole = 'user' | 'admin'

export type SubscriptionType = 'full_month' | 'half_month' | 'single_morning' | 'single_evening' | 'double_time'

export type PaymentStatus = 'success' | 'due' | 'pending' | 'failed'

export type User = {
  id: string
  name: string
  email: string
  mobile_number: string
  parent_mobile: string
  photo_url?: string
  role: UserRole
  mess_id?: string
  created_at: string
  updated_at: string
}

export type MessMember = {
  id: string
  user_id: string
  mess_id: string
  subscription_type: SubscriptionType
  payment_status: PaymentStatus
  joining_date: string
  expiry_date: string
  is_active: boolean
  created_at: string
  updated_at: string
  user?: User
}

export type Mess = {
  id: string
  name: string
  description?: string
  admin_id: string
  pricing: {
    full_month: number
    half_month: number
    single_morning: number
    single_evening: number
    double_time: number
  }
  is_active: boolean
  created_at: string
  updated_at: string
  admin?: User
}

export type MessAdmin = {
  id: string
  mess_id: string
  user_id: string
  assigned_by: string
  is_active: boolean
  created_at: string
  updated_at: string
  user?: User
  mess?: Mess
}

export type Payment = {
  id: string
  user_id: string
  mess_id: string
  amount: number
  razorpay_order_id: string
  razorpay_payment_id?: string
  status: PaymentStatus
  subscription_type: SubscriptionType
  created_at: string
  updated_at: string
}

export type Enquiry = {
  id: string
  user_id: string
  mess_id: string
  message: string
  status: 'pending' | 'responded' | 'closed'
  created_at: string
  updated_at: string
}