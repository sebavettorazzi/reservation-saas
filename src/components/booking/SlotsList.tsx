"use client";

import { useEffect, useState } from "react";
import SlotButton from "./SlotButton";

type Slot = {
  start: string;
  end: string;
  availableStaff: {
    id: string;
    name: string;
  }[];
  bestStaffId: string | null;
};

export default function SlotsList({
  date,
  staffId,
  businessId,
  serviceId,
}: any) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);

      const res = await fetch(
        `/api/availability?businessId=${businessId}&serviceId=${serviceId}&date=${date.toISOString()}`
      );

      const data = await res.json();

      setSlots(data);
      setLoading(false);
    }

    fetchSlots();
  }, [date]);

  const filtered = slots.filter((slot) => {
    if (!staffId) return true;
    return slot.availableStaff.some((s) => s.id === staffId);
  });

  if (loading) {
    return <p className="text-gray-500">Cargando horarios...</p>;
  }

  return (
    <div className="space-y-6">

      <h2 className="text-lg font-semibold">
        Horarios disponibles
      </h2>

      <div className="grid grid-cols-4 gap-4">
        {filtered.map((slot, i) => (
          <SlotButton key={i} slot={slot} />
        ))}
      </div>

    </div>
  );
}