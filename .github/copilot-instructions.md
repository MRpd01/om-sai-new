# Mess Management Platform - Copilot Instructions

This is a Next.js mess management platform with TypeScript, Tailwind CSS, Supabase authentication and database, PhonePe business payment gateway, multi-language support (English, Hindi, Marathi), role-based authentication (User, Admin), responsive design, email notifications with Resend, and WhatsApp integration.

## Progress Tracking

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - Requirements are clear from user specifications
- [x] Scaffold the Project - Next.js project created successfully
- [x] Customize the Project - Added UI components, landing page, types, authentication, i18n setup
- [x] Install Required Extensions - No additional extensions needed
- [x] Compile the Project - Project builds successfully
- [x] Create and Run Task - Development server running at http://localhost:3000
- [x] Launch the Project - Available at http://localhost:3000
- [x] Ensure Documentation is Complete - README.md updated with comprehensive documentation
- [x] Implement Real Supabase Authentication - Real Supabase Auth implemented with session management

## Project Specifications

### Roles
- **User (Mess Member)**: View menu, submit enquiry, make payments, view profile, manage subscription
- **Admin (Mess Owner)**: Manage users, set pricing, handle member onboarding, menu management, view analytics

*Note: No super admin role - each mess operates independently with its own admin/owner*

### Key Features
- Multi-language support (English, Hindi, Marathi)
- PhonePe business account payment integration
- WhatsApp + Email notifications
- Role-based authentication (User/Admin only)
- Subscription management
- Menu planning and management
- Member profile management
- Aesthetic food/mess themed design
- Mobile-first responsive design

### Tech Stack
- Frontend: Next.js 14+ with TypeScript
- Styling: Tailwind CSS
- Database & Auth: Supabase
- Payments: PhonePe Business Account
- Notifications: Resend + WhatsApp API
- Deployment: Vercel