// Example API route using Prisma ORM
// This shows how much easier and type-safe Prisma is compared to raw Supabase queries

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Fetch all members with their user and mess details
    // This is fully type-safe and auto-completed!
    const members = await prisma.messMember.findMany({
      where: {
        is_active: true,
        // Filter expired members
        expiry_date: {
          gte: new Date()
        }
      },
      include: {
        // Load user details
        user: {
          select: {
            id: true,
            name: true,
            mobile_number: true,
            photo_url: true,
            role: true
          }
        },
        // Load mess details
        mess: {
          select: {
            id: true,
            name: true,
            pricing: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Calculate some stats
    const stats = {
      totalActiveMembers: members.length,
      bySubscriptionType: await prisma.messMember.groupBy({
        by: ['subscription_type'],
        _count: true,
        where: { is_active: true }
      }),
      byPaymentStatus: await prisma.messMember.groupBy({
        by: ['payment_status'],
        _count: true,
        where: { is_active: true }
      })
    };

    return res.status(200).json({
      success: true,
      data: {
        members,
        stats
      }
    });

  } catch (error: any) {
    console.error('Prisma error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Database error'
    });
  }
}
