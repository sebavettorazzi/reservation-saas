"use client";

import { useEffect, useState } from "react";

export type AvailabilitySlot = {
  start: string;
  end: string;
  availableStaff: {
    id: string;
    name: string;
  }[];
  bestStaffId: string | null;
};

type Params = {
  businessId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
};

export function useAvailability({ businessId, serviceId, date }: Params) {
  const [data, setData] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId || !serviceId || !date) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/availability?businessId=${businessId}&serviceId=${serviceId}&date=${date}`
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error loading availability");
        }

        const json = await res.json();
        setData(json);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Error loading availability"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId, serviceId, date]);

  return { data, loading, error };
}
