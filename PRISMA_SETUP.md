# Prisma ORM Setup Guide

## ✅ What's Been Done

1. ✅ Installed Prisma and Prisma Client
2. ✅ Created `prisma/schema.prisma` with all your database models
3. ✅ Created `src/lib/prisma.ts` client singleton
4. ✅ Configured Prisma to work with your Supabase database

## 🔧 Complete Setup Instructions

### Step 1: Get Your Database Connection URL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kolxlgrgokgzphdwgdib
2. Click on **Project Settings** (gear icon)
3. Go to **Database** section
4. Find **Connection String** → Select **Direct Connection** (NOT Pooler)
5. Copy the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.kolxlgrgokgzphdwgdib.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 2: Update .env.local

Open `.env.local` and replace the placeholder:

```env
DATABASE_URL=postgresql://postgres:[YOUR-ACTUAL-PASSWORD]@db.kolxlgrgokgzphdwgdib.supabase.co:5432/postgres
```

**Note:** Use port `5432` for direct connection (NOT 6543)

### Step 3: Generate Prisma Client

Run this command to generate the Prisma Client:

```bash
npx prisma generate
```

This will create the Prisma Client in `src/generated/prisma/`

### Step 4: Introspect Your Database (Optional)

To verify Prisma can connect and see your database:

```bash
npx prisma db pull
```

This will update your schema with any tables that exist but aren't defined.

## 🚀 Using Prisma in Your Code

### Import Prisma Client

```typescript
import prisma from '@/lib/prisma'
```

### Example Queries

#### 1. Fetch All Active Members
```typescript
const activeMembers = await prisma.messMember.findMany({
  where: {
    is_active: true
  },
  include: {
    user: true,
    mess: true
  }
})
```

#### 2. Create a New Member
```typescript
const newMember = await prisma.messMember.create({
  data: {
    user_id: userId,
    mess_id: messId,
    subscription_type: 'full_month',
    joining_date: new Date(),
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    payment_status: 'pending'
  }
})
```

#### 3. Get Member with User Details
```typescript
const member = await prisma.messMember.findUnique({
  where: { id: memberId },
  include: {
    user: true,
    mess: true
  }
})
```

#### 4. Update Payment Status
```typescript
const updatedMember = await prisma.messMember.update({
  where: { id: memberId },
  data: {
    payment_status: 'success',
    is_active: true
  }
})
```

#### 5. Complex Query with Aggregation
```typescript
const stats = await prisma.messMember.groupBy({
  by: ['payment_status'],
  _count: true,
  where: {
    mess_id: messId,
    is_active: true
  }
})
```

#### 6. Transaction Example
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create payment
  const payment = await tx.payment.create({
    data: {
      user_id: userId,
      mess_id: messId,
      amount: 2600,
      phonepe_transaction_id: txnId,
      status: 'success',
      subscription_type: 'full_month'
    }
  })

  // Update member
  const member = await tx.messMember.update({
    where: { id: memberId },
    data: {
      payment_status: 'success',
      is_active: true
    }
  })

  return { payment, member }
})
```

## 📊 Prisma Studio - Visual Database Editor

Open a visual interface to browse and edit your database:

```bash
npx prisma studio
```

This opens at http://localhost:5555 where you can:
- View all tables
- Edit records
- Add new data
- Delete records
- All with a beautiful UI!

## 🔄 Migration Commands

### Pull Latest Schema from Database
```bash
npx prisma db pull
```

### Push Schema Changes to Database
```bash
npx prisma db push
```

**Warning:** Use `db push` carefully in production. It can cause data loss.

## 📝 Example: Rewrite Your Members API with Prisma

### Before (Supabase)
```typescript
const { data: membersData, error } = await supabase
  .from('mess_members')
  .select('*, users(*)')
  .eq('mess_id', messId)
```

### After (Prisma)
```typescript
const members = await prisma.messMember.findMany({
  where: { mess_id: messId },
  include: {
    user: true
  }
})
```

**Benefits:**
- ✅ Full TypeScript type safety
- ✅ Autocomplete for all fields
- ✅ No need to manually type responses
- ✅ Compile-time error checking
- ✅ Better IntelliSense

## 🎯 Quick Start - Test Prisma

Create `scripts/test-prisma.ts`:

```typescript
import prisma from '../src/lib/prisma'

async function main() {
  console.log('🔍 Testing Prisma connection...\n')

  // Count users
  const userCount = await prisma.user.count()
  console.log(`✅ Users: ${userCount}`)

  // Count messes
  const messCount = await prisma.mess.count()
  console.log(`✅ Messes: ${messCount}`)

  // Count active members
  const memberCount = await prisma.messMember.count({
    where: { is_active: true }
  })
  console.log(`✅ Active Members: ${memberCount}`)

  // Get first 3 members with details
  const members = await prisma.messMember.findMany({
    take: 3,
    include: {
      user: {
        select: {
          name: true,
          mobile_number: true
        }
      },
      mess: {
        select: {
          name: true
        }
      }
    }
  })

  console.log('\n📋 Sample Members:')
  members.forEach(m => {
    console.log(`  - ${m.user.name} @ ${m.mess.name} (${m.subscription_type})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run with:
```bash
npx tsx scripts/test-prisma.ts
```

## 🛠️ Useful Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from database
npx prisma db pull

# Push schema to database
npx prisma db push

# View Prisma version
npx prisma version
```

## 🔥 Advanced Features

### 1. Raw SQL Queries
```typescript
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE role = 'admin'
`
```

### 2. Execute Raw SQL
```typescript
await prisma.$executeRaw`
  UPDATE mess_members SET is_active = true WHERE expiry_date > NOW()
`
```

### 3. Middleware (Logging)
```typescript
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})
```

## 🎨 Type-Safe Queries

With Prisma, you get full type safety:

```typescript
// This will give TypeScript errors if fields don't exist
const member = await prisma.messMember.findUnique({
  where: { id: memberId },
  select: {
    id: true,
    user: {
      select: {
        name: true,
        mobile_number: true,
        photo_url: true
      }
    },
    subscription_type: true,
    expiry_date: true,
    is_active: true
  }
})

// TypeScript knows the exact shape of 'member'
if (member) {
  console.log(member.user.name) // ✅ Type-safe
  // console.log(member.user.password) // ❌ Error: Property doesn't exist
}
```

## 📚 Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma with Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Prisma Examples](https://github.com/prisma/prisma-examples)
- [Prisma Studio](https://www.prisma.io/studio)

## ✨ Benefits of Using Prisma

1. **Type Safety** - Catch errors at compile time
2. **Auto-completion** - IntelliSense for all queries
3. **Relations** - Easy to work with related data
4. **Migrations** - Version control for database schema
5. **Performance** - Optimized queries
6. **Developer Experience** - Much faster development
7. **Visual Tool** - Prisma Studio for data management
8. **Testing** - Easy to mock and test

## 🚨 Important Notes

1. **Keep Both Supabase and Prisma**: Use Supabase for Auth and Realtime, Prisma for queries
2. **Connection Pooling**: For production, use Supabase connection pooler
3. **RLS Policies**: Prisma bypasses RLS, so handle authorization in your code
4. **Migrations**: Be careful with migrations on existing Supabase databases

---

**Next Step:** Get your DATABASE_URL and run `npx prisma generate`! 🚀
