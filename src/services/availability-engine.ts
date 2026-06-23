import { prisma } from "../lib/prisma";

type Slot = {
  start: Date;
  end: Date;
  availableStaff: { id: string; name: string }[];
  bestStaffId: string | null;
};

type DateParts = { year: number; month: number; day: number };

const ARGENTINA_UTC_OFFSET_HOURS = 3;

function getArgentinaDateParts(value: Date | string): DateParts {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return { year, month, day };
  }

  const date = typeof value === "string" ? new Date(value) : value;
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(formatted.find((part) => part.type === "year")?.value),
    month: Number(formatted.find((part) => part.type === "month")?.value),
    day: Number(formatted.find((part) => part.type === "day")?.value),
  };
}

function argentinaDateAt(parts: DateParts, minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour + ARGENTINA_UTC_OFFSET_HOURS, minute));
}

function getArgentinaDayBounds(parts: DateParts) {
  return {
    start: argentinaDateAt(parts, 0),
    end: argentinaDateAt({ ...parts, day: parts.day + 1 }, 0),
  };
}

function getWeekday(parts: DateParts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12)).getUTCDay();
}

function staffIsBusy(
  staffId: string,
  slot: { start: Date; end: Date },
  appointments: Array<{ staffId: string | null; startTime: Date; endTime: Date }>
) {
  return appointments.some(
    (appointment) =>
      appointment.staffId === staffId &&
      appointment.startTime < slot.end &&
      appointment.endTime > slot.start
  );
}

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  date: Date | string
): Promise<Slot[]> {
  const parts = getArgentinaDateParts(date);
  const weekday = getWeekday(parts);
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId },
    include: {
      staff: {
        include: {
          staff: {
            include: { schedules: { where: { weekday } } },
          },
        },
      },
    },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  const { start, end } = getArgentinaDayBounds(parts);
  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      status: { not: "CANCELLED" },
      startTime: { gte: start, lt: end },
    },
    select: { staffId: true, startTime: true, endTime: true },
  });
  const slots = new Map<string, Slot>();

  for (const staffService of service.staff) {
    const staff = staffService.staff;
    const schedule = staff.schedules[0];

    if (!schedule?.isOpen) {
      continue;
    }

    for (
      let minute = schedule.startMinute;
      minute + service.duration <= schedule.endMinute;
      minute += schedule.slotInterval
    ) {
      const slot = {
        start: argentinaDateAt(parts, minute),
        end: argentinaDateAt(parts, minute + service.duration),
      };

      if (staffIsBusy(staff.id, slot, appointments)) {
        continue;
      }

      const key = slot.start.toISOString();
      const current = slots.get(key) ?? {
        ...slot,
        availableStaff: [],
        bestStaffId: null,
      };
      current.availableStaff.push({ id: staff.id, name: staff.name });
      current.bestStaffId ??= staff.id;
      slots.set(key, current);
    }
  }

  return Array.from(slots.values()).sort(
    (left, right) => left.start.getTime() - right.start.getTime()
  );
}
