import { prisma } from "@/lib/prisma";
import type { CreateExpenseInput } from "@/contracts/expense.contract";

const ARGENTINA_UTC_OFFSET_HOURS = 3;

function getArgentinaDayBoundsUTC(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(date).split("-").map(Number);

  const start = new Date(Date.UTC(year, month - 1, day, ARGENTINA_UTC_OFFSET_HOURS));
  const end = new Date(Date.UTC(year, month - 1, day + 1, ARGENTINA_UTC_OFFSET_HOURS) - 1);

  return { start, end };
}

function getArgentinaPeriodBoundsUTC(selectedMonth: string, months: number) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const safeMonths = Math.min(Math.max(Math.trunc(months), 1), 12);
  const start = new Date(
    Date.UTC(year, month - safeMonths, 1, ARGENTINA_UTC_OFFSET_HOURS)
  );
  const end = new Date(
    Date.UTC(year, month, 1, ARGENTINA_UTC_OFFSET_HOURS) - 1
  );

  return { start, end, months: safeMonths };
}

function getArgentinaDateRangeBoundsUTC(startDate: string, endDate: string) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const startOfStartDate = new Date(
    Date.UTC(startYear, startMonth - 1, startDay, ARGENTINA_UTC_OFFSET_HOURS)
  );
  const endOfStartDate = new Date(
    Date.UTC(startYear, startMonth - 1, startDay + 1, ARGENTINA_UTC_OFFSET_HOURS) - 1
  );
  const startOfEndDate = new Date(
    Date.UTC(endYear, endMonth - 1, endDay, ARGENTINA_UTC_OFFSET_HOURS)
  );
  const endOfEndDate = new Date(
    Date.UTC(endYear, endMonth - 1, endDay + 1, ARGENTINA_UTC_OFFSET_HOURS) - 1
  );

  if (startOfStartDate.getTime() > endOfEndDate.getTime()) {
    return {
      start: startOfEndDate,
      end: endOfStartDate,
      months: null,
      mode: "custom" as const,
    };
  }

  return { start: startOfStartDate, end: endOfEndDate, months: null, mode: "custom" as const };
}

type PremiumDashboardPeriodInput =
  | {
      mode: "preset";
      selectedMonth: string;
      months: number;
    }
  | {
      mode: "custom";
      startDate: string;
      endDate: string;
    };

function sumAmounts(values: number[]) {
  return values.reduce((total, current) => total + current, 0);
}

type BusinessBase = {
  id: string;
  name: string;
  slug: string | null;
  plan: "BASE" | "PREMIUM";
  category: "GENERAL" | "SALON" | "SPORTS" | "DENTAL" | "BEAUTY";
  tagline: string | null;
  _count: {
    staff: number;
    services: number;
    appointments: number;
  };
};

export async function getBusinessPremiumDashboardBySlug(
  slug: string,
  periodInput: PremiumDashboardPeriodInput
) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      category: true,
      tagline: true,
      _count: {
        select: {
          staff: true,
          services: true,
          appointments: true,
        },
      },
    },
  });

  if (!business) {
    return null;
  }

  if (business.plan !== "PREMIUM") {
    return {
      business,
      premiumUnlocked: false,
      metrics: null,
      revenueByService: [],
      revenueByCourt: [],
      recentExpenses: [],
      expenseByCategory: [],
      recentNotifications: [],
    };
  }

  const period =
    periodInput.mode === "custom"
      ? getArgentinaDateRangeBoundsUTC(periodInput.startDate, periodInput.endDate)
      : {
          ...getArgentinaPeriodBoundsUTC(periodInput.selectedMonth, periodInput.months),
          mode: "preset" as const,
        };
  const { start: periodStart, end: periodEnd } = period;
  const { start: todayStart, end: todayEnd } = getArgentinaDayBoundsUTC(new Date());

  const [periodAppointments, periodExpenses, recentNotifications] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId: business.id,
        status: "CONFIRMED",
        startTime: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.expense.findMany({
      where: {
        businessId: business.id,
        expenseDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.notification.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        recipient: true,
        body: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        createdAt: true,
      },
    }),
  ]);

  const todayAppointments = periodAppointments.filter((appointment) => {
    const startTime = appointment.startTime.getTime();
    return startTime >= todayStart.getTime() && startTime <= todayEnd.getTime();
  });

  const todayExpenses = periodExpenses.filter((expense) => {
    const expenseTime = expense.expenseDate.getTime();
    return expenseTime >= todayStart.getTime() && expenseTime <= todayEnd.getTime();
  });

  const monthlyRevenue = sumAmounts(
    periodAppointments.map((appointment) => appointment.priceSnapshot)
  );
  const todayRevenue = sumAmounts(
    todayAppointments.map((appointment) => appointment.priceSnapshot)
  );
  const monthlyExpenseTotal = sumAmounts(
    periodExpenses.map((expense) => expense.amount)
  );
  const todayExpenseTotal = sumAmounts(todayExpenses.map((expense) => expense.amount));
  const netRevenue = monthlyRevenue - monthlyExpenseTotal;
  const averageTicket =
    periodAppointments.length > 0 ? monthlyRevenue / periodAppointments.length : 0;

  const revenueByServiceMap = new Map<
    string,
    { serviceId: string; name: string; revenue: number; reservations: number }
  >();
  const revenueByCourtMap = new Map<
    string,
    { staffId: string; name: string; reservations: number; revenue: number }
  >();
  const expenseByCategoryMap = new Map<
    string,
    { category: string; total: number; count: number }
  >();

  for (const appointment of periodAppointments) {
    const serviceEntry = revenueByServiceMap.get(appointment.service.id) ?? {
      serviceId: appointment.service.id,
      name: appointment.service.name,
      revenue: 0,
      reservations: 0,
    };

    serviceEntry.revenue += appointment.priceSnapshot;
    serviceEntry.reservations += 1;
    revenueByServiceMap.set(appointment.service.id, serviceEntry);

    if (appointment.staff) {
      const courtEntry = revenueByCourtMap.get(appointment.staff.id) ?? {
        staffId: appointment.staff.id,
        name: appointment.staff.name,
        reservations: 0,
        revenue: 0,
      };

      courtEntry.reservations += 1;
      courtEntry.revenue += appointment.priceSnapshot;
      revenueByCourtMap.set(appointment.staff.id, courtEntry);
    }
  }

  for (const expense of periodExpenses) {
    const category = expense.category?.trim() || "General";
    const expenseEntry = expenseByCategoryMap.get(category) ?? {
      category,
      total: 0,
      count: 0,
    };

    expenseEntry.total += expense.amount;
    expenseEntry.count += 1;
    expenseByCategoryMap.set(category, expenseEntry);
  }

  const revenueByService = Array.from(revenueByServiceMap.values()).sort(
    (left, right) => right.revenue - left.revenue
  );

  const revenueByCourt = Array.from(revenueByCourtMap.values()).sort(
    (left, right) => right.revenue - left.revenue
  );

  const expenseByCategory = Array.from(expenseByCategoryMap.values()).sort(
    (left, right) => right.total - left.total
  );

  return {
    business,
    premiumUnlocked: true,
    period: {
      start: periodStart,
      end: periodEnd,
      months: period.months,
      mode: period.mode,
    },
    metrics: {
      monthlyRevenue,
      todayRevenue,
      monthlyExpenseTotal,
      todayExpenseTotal,
      netRevenue,
      averageTicket,
      reservationsThisMonth: periodAppointments.length,
      reservationsToday: todayAppointments.length,
      averageReservationsPerCourt:
        business._count.staff > 0 ? periodAppointments.length / business._count.staff : 0,
      topService: revenueByService[0] ?? null,
      topCourt: revenueByCourt[0] ?? null,
    },
    revenueByService,
    revenueByCourt,
    recentExpenses: periodExpenses.slice(0, 12),
    expenseByCategory,
    recentNotifications,
  };
}

export type CreateBusinessExpenseResult =
  | { status: "business_not_found" }
  | { status: "premium_required"; business: BusinessBase }
  | {
      status: "ok";
      expense: {
        id: string;
        title: string;
        category: string | null;
        amount: number;
        notes: string | null;
        expenseDate: Date;
        createdAt: Date;
      };
    };

export async function createBusinessExpenseBySlug(
  slug: string,
  input: CreateExpenseInput
): Promise<CreateBusinessExpenseResult> {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      category: true,
      tagline: true,
      _count: {
        select: {
          staff: true,
          services: true,
          appointments: true,
        },
      },
    },
  });

  if (!business) {
    return { status: "business_not_found" };
  }

  if (business.plan !== "PREMIUM") {
    return {
      status: "premium_required",
      business,
    };
  }

  const expense = await prisma.expense.create({
    data: {
      businessId: business.id,
      title: input.title,
      category: input.category,
      amount: input.amount,
      notes: input.notes,
      expenseDate: new Date(input.expenseDate),
    },
    select: {
      id: true,
      title: true,
      category: true,
      amount: true,
      notes: true,
      expenseDate: true,
      createdAt: true,
    },
  });

  return {
    status: "ok",
    expense,
  };
}
