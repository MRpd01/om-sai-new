# MessMate - Mess Management Platform

A comprehensive Next.js-based mess management platform with multi-language support, role-based authentication, and integrated payment solutions.

## 🚀 Features

### Core Functionality
- **Role-based Authentication**: Support for Users and Admins
- **Multi-language Support**: English, Hindi, and Marathi
- **Payment Integration**: Razorpay for seamless transactions
- **Smart Notifications**: WhatsApp and Email alerts
- **Subscription Management**: Flexible meal plans and renewals

### User Roles

#### **User (Mess Member)**
- View mess menu and information
- Submit enquiry forms to mess owners
- Make online payments with automatic registration
- View-only profile with subscription details
- Track payment status and expiry dates

#### **Admin (Mess Owner)**
- Add and manage mess members
- Set subscription pricing for different meal plans
- Force register users without payment
- View and update user details (limited)
- Receive payment and expiry notifications
- Mark offline/manual payments



### Subscription Types
- **Full Month**: Complete monthly meal plan
- **Half Month**: 15-day meal plan
- **Single Time**: Morning OR Evening meals
- **Double Time**: Morning AND Evening meals

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS with custom food-themed design
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security
- **Payments**: Razorpay integration
- **Notifications**: Resend (Email) + WhatsApp Cloud API
- **Deployment**: Vercel

## 🎨 Design Features

- **Aesthetic Food Theme**: Warm orange/amber color palette
- **Responsive Design**: Mobile-first approach
- **Glass Effects**: Modern UI with backdrop blur effects
- **Floating Animations**: Engaging micro-interactions
- **Multi-language UI**: Seamless language switching

## 📦 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Razorpay account (for payments)
- Resend account (for emails)
- WhatsApp Business API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mess-management-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Razorpay
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Resend
   RESEND_API_KEY=your_resend_api_key
   
   # WhatsApp
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
   
   # Admin
   ADMIN_EMAIL=admin@messmate.com
   ```

4. **Set up the database**
   - Run the SQL schema in `supabase/schema.sql` in your Supabase SQL editor
   - This will create all necessary tables, types, and policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Development Server

The development server is now running at [http://localhost:3000](http://localhost:3000)

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## 📊 Admin Access

The Admin dashboard provides:
- Member management
- Payment tracking
- Menu planning
- Notifications

Built with ❤️ for modern mess management

## 📦 Pushing to GitHub & Deploying to Vercel

1. Initialize a git repo (if not already):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

2. Deploy on Vercel:

- Go to https://vercel.com/new and import your GitHub repository.
- In the Vercel dashboard, add environment variables (Settings → Environment Variables) matching `.env.example` (do not commit secrets to the repo).
- Trigger a deploy; Vercel will build and host the app automatically.

3. If you need server-side secrets (Razorpay, Supabase service role), add them as Environment Variables in Vercel and use serverless API routes to access them.

If you want, I can prepare a small serverless API route (under `src/pages/api/`) to create Razorpay orders using your server-side secrets safely.
