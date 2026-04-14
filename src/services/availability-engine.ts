import { prisma } from "../lib/prisma";

type Slot = {
  start: Date;
  end: Date;
  availableStaff: {
    id: string;
    name: string;
  }[];
  bestStaffId: string | null;
};

type AppointmentInterval = {
  staffId: string | null;
  startTime: Date;
  endTime: Date;
};

// =========================
// TIME HELPERS
// =========================

function getDayBoundsUTC(date: Date) {
  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0
  ));

  const end = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23, 59, 59, 999
  ));

  return { start, end };
}

// =========================
// SLOT GENERATOR
// =========================

function generateTimeSlots(
  date: Date,
  duration: number,
  openHour = 7,
  closeHour = 22
) {
  const slots: { start: Date; end: Date }[] = [];

  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    openHour,
    0,
    0
  ));

  const endDay = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    closeHour,
    0,
    0
  ));

  while (start < endDay) {
    const end = new Date(start);
    end.setUTCMinutes(end.getUTCMinutes() + duration);

    slots.push({ start: new Date(start), end });

    start.setUTCMinutes(start.getUTCMinutes() + 30);
  }

  return slots;
}

// =========================
// BUILD BUSY MAP (LEVEL 3 CORE)
// =========================

function buildBusyMap(appointments: AppointmentInterval[]) {
  const map = new Map<string, { start: Date; end: Date }[]>();

  for (const a of appointments) {
    if (!a.staffId) continue;

    if (!map.has(a.staffId)) {
      map.set(a.staffId, []);
    }

    map.get(a.staffId)!.push({
      start: a.startTime,
      end: a.endTime,
    });
  }

  return map;
}

// =========================
// CONFLICT CHECK O(1-ish)
// =========================

function isStaffBusy(
  staffId: string,
  slot: { start: Date; end: Date },
  busyMap: Map<string, { start: Date; end: Date }[]>
) {
  const intervals = busyMap.get(staffId);
  if (!intervals) return false;

  for (const i of intervals) {
    const overlap =
      i.start < slot.end &&
      i.end > slot.start;

    if (overlap) return true;
  }

  return false;
}

// =========================
// ENGINE
// =========================

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  date: Date
): Promise<Slot[]> {

  // 1. Service + staff
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      staff: { include: { staff: true } },
    },
  });

  if (!service) throw new Error("Service not found");

  const staff = service.staff.map((s) => s.staff);

  // 2. Day bounds
  const { start, end } = getDayBoundsUTC(date);

  // 3. Appointments (only once)
  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      startTime: {
        gte: start,
        lt: end,
      },
    },
  });

  // 4. BUILD INDEX (🔥 KEY OPTIMIZATION)
  const busyMap = buildBusyMap(appointments);

  // 5. Slots
  const slots = generateTimeSlots(date, service.duration);

  const result: Slot[] = [];

  for (const slot of slots) {

    const availableStaff = [];

    for (const s of staff) {
      if (!isStaffBusy(s.id, slot, busyMap)) {
        availableStaff.push({
          id: s.id,
          name: s.name,
        });
      }
    }

    if (availableStaff.length === 0) continue;

    result.push({
      start: slot.start,
      end: slot.end,
      availableStaff,
      bestStaffId: availableStaff[0]?.id ?? null,
    });
  }

  return result;
}
