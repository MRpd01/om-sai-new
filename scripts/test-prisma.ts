import prisma from '../src/lib/prisma'

async function testPrismaConnection() {
  console.log('\n🔍 Testing Prisma Connection...\n')
  console.log('─'.repeat(50))

  try {
    // Test 1: Count users
    console.log('\n📝 Test: Count Users')
    const userCount = await prisma.user.count()
    console.log(`   ✅ Found ${userCount} users`)

    // Test 2: Count messes
    console.log('\n📝 Test: Count Messes')
    const messCount = await prisma.mess.count()
    console.log(`   ✅ Found ${messCount} messes`)

    // Test 3: Count active members
    console.log('\n📝 Test: Count Active Members')
    const memberCount = await prisma.messMember.count({
      where: { is_active: true }
    })
    console.log(`   ✅ Found ${memberCount} active members`)

    // Test 4: Count all payments
    console.log('\n📝 Test: Count Payments')
    const paymentCount = await prisma.payment.count()
    console.log(`   ✅ Found ${paymentCount} payments`)

    // Test 5: Get sample data with relations
    console.log('\n📝 Test: Fetch Members with Relations')
    const members = await prisma.messMember.findMany({
      take: 3,
      include: {
        user: {
          select: {
            name: true,
            mobile_number: true,
            role: true
          }
        },
        mess: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    if (members.length > 0) {
      console.log(`   ✅ Found ${members.length} members with details:`)
      members.forEach((m, i) => {
        console.log(`      ${i + 1}. ${m.user.name} @ ${m.mess.name}`)
        console.log(`         Plan: ${m.subscription_type}`)
        console.log(`         Status: ${m.is_active ? 'Active' : 'Inactive'}`)
        console.log(`         Payment: ${m.payment_status}`)
      })
    } else {
      console.log('   ℹ️ No members found')
    }

    // Test 6: Database statistics
    console.log('\n📊 Database Statistics:')
    console.log(`   - Users: ${userCount}`)
    console.log(`   - Messes: ${messCount}`)
    console.log(`   - Active Members: ${memberCount}`)
    console.log(`   - Total Payments: ${paymentCount}`)

    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    })
    console.log(`   - Admins: ${adminCount}`)

    const pendingRequests = await prisma.subscriptionRequest.count({
      where: { status: 'pending' }
    })
    console.log(`   - Pending Requests: ${pendingRequests}`)

    console.log('\n' + '─'.repeat(50))
    console.log('\n✅ All tests passed! Prisma is working correctly.\n')
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error('\nFull error:', error)
    
    if (error.message?.includes('Can\'t reach database server')) {
      console.error('\n💡 Troubleshooting:')
      console.error('   1. Check your DATABASE_URL in .env.local')
      console.error('   2. Get the correct URL from Supabase Dashboard:')
      console.error('      Project Settings → Database → Connection String (Direct)')
      console.error('   3. Make sure to use port 5432 (not 6543)')
      console.error('   4. Replace [YOUR-PASSWORD] with actual password')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaConnection()
