'use server';

import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AnalyticsData {
  summary: {
    totalKits: number;
    totalRevenue: number;
    avgProcessingDays: number;
    conversionRate: number;
    activeKits: number;
    pendingPayments: number;
  };
  kitsByMonth: Array<{ month: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  kitsByStatus: Array<{ status: string; count: number }>;
  topCustomers: Array<{ name: string; email: string; kitCount: number; totalValue: number }>;
}

export async function getAnalytics(): Promise<ActionResult<AnalyticsData>> {
  try {
    await requireAdmin();

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalKits,
      activeKits,
      completedKits,
      totalRevenue,
      pendingPayments,
      kitsWithTimestamps,
      kitsByStatusRaw,
      recentPayments,
      customers,
    ] = await Promise.all([
      prisma.kit.count(),
      prisma.kit.count({
        where: { status: { in: ['PENDING', 'SHIPPED', 'EVALUATING', 'OFFER_SENT'] } },
      }),
      prisma.kit.count({
        where: { status: { in: ['PAID', 'RETURNED'] } },
      }),
      prisma.payment.aggregate({
        where: { status: { in: ['SENT', 'COMPLETED'] } },
        _sum: { amount: true },
      }),
      prisma.payment.count({
        where: { status: 'PENDING' },
      }),
      prisma.kit.findMany({
        where: {
          receivedAt: { not: null },
          completedAt: { not: null },
        },
        select: { receivedAt: true, completedAt: true },
      }),
      prisma.kit.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.payment.findMany({
        where: {
          status: { in: ['SENT', 'COMPLETED'] },
          createdAt: { gte: sixMonthsAgo },
        },
        select: { amount: true, createdAt: true },
      }),
      prisma.customer.findMany({
        include: {
          kits: { select: { id: true } },
          payments: {
            where: { status: { in: ['SENT', 'COMPLETED'] } },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Calculate avg processing time
    let avgProcessingDays = 0;
    if (kitsWithTimestamps.length > 0) {
      const totalDays = kitsWithTimestamps.reduce((sum, kit) => {
        const diff = (kit.completedAt!.getTime() - kit.receivedAt!.getTime()) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      avgProcessingDays = Math.round((totalDays / kitsWithTimestamps.length) * 10) / 10;
    }

    // Conversion rate (kits that reached PAID vs total completed evaluations)
    const evaluatedKits = await prisma.kit.count({
      where: { status: { in: ['OFFER_SENT', 'ACCEPTED', 'DECLINED', 'PAID', 'RETURNED'] } },
    });
    const paidKits = await prisma.kit.count({ where: { status: 'PAID' } });
    const conversionRate = evaluatedKits > 0 ? Math.round((paidKits / evaluatedKits) * 100) : 0;

    // Kits by month (last 6 months)
    const kitsByMonth: Array<{ month: string; count: number }> = [];
    const revenueByMonth: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const count = await prisma.kit.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
      });
      kitsByMonth.push({ month: label, count });

      const monthRevenue = recentPayments
        .filter((p) => p.createdAt >= monthStart && p.createdAt <= monthEnd)
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      revenueByMonth.push({ month: label, revenue: Math.round(monthRevenue * 100) / 100 });
    }

    // Kits by status
    const kitsByStatus = kitsByStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    // Top customers
    const topCustomers = customers
      .map((c) => ({
        name: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email,
        kitCount: c.kits.length,
        totalValue: c.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
      }))
      .filter((c) => c.kitCount > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    return {
      success: true,
      data: {
        summary: {
          totalKits,
          totalRevenue: parseFloat(totalRevenue._sum.amount?.toString() || '0'),
          avgProcessingDays,
          conversionRate,
          activeKits,
          pendingPayments,
        },
        kitsByMonth,
        revenueByMonth,
        kitsByStatus,
        topCustomers,
      },
    };
  } catch (error: any) {
    console.error('Error getting analytics:', error);
    return {
      success: false,
      error: error.message || 'Failed to get analytics',
    };
  }
}
