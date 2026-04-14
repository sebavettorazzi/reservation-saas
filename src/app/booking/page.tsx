"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Slot = {
  start: string;
  end: string;
  availableStaff: {
    id: string;
    name: string;
  }[];
  bestStaffId: string | null;
};

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState("2026-04-13");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 IDs del seed (luego vendrán de URL)
  const businessId = "8075c3f6-e71a-4042-a480-ba5d1fafa86c";
  const serviceId = "e366c10c-53ad-4285-982f-8cdada962ee0";
  const customerId = "915cdf2c-98e6-460b-95d1-8aac79149886";

  // =========================
  // FETCH AVAILABILITY
  // =========================

  async function fetchSlots() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/availability?businessId=${businessId}&serviceId=${serviceId}&date=${selectedDate}`
      );

      if (!res.ok) throw new Error("Error fetching slots");

      const data = await res.json();
      setSlots(data);
    } catch (err) {
      setError("No se pudieron cargar los horarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  // =========================
  // FORMAT TIME (UTC → LOCAL)
  // =========================

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // =========================
  // CONFIRM BOOKING
  // =========================

  async function confirmBooking() {
    if (!selectedSlot) return;

    const slot = slots.find((s) => s.start === selectedSlot);
    if (!slot) return;

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          serviceId,
          customerId,
          staffId: slot.bestStaffId, // 🔥 importante
          start: slot.start,
          end: slot.end,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error al reservar");
        return;
      }

      alert("Reserva confirmada 🎉");

      // reset selección
      setSelectedSlot(null);

      // 🔥 refrescar availability
      await fetchSlots();

    } catch (err) {
      alert("Error al reservar");
    }
  }

  // =========================
  // UI
  // =========================

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <h2>Reservar</h2>

        <div className={styles.filter}>
          <label>Servicio</label>
          <select>
            <option>Corte</option>
          </select>
        </div>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Selecciona horario</h1>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.date}
          />
        </header>

        {/* STATES */}
        {loading && <p>Cargando horarios...</p>}
        {error && <p>{error}</p>}

        {/* SLOTS */}
        {!loading && !error && (
          <div className={styles.slots}>
            {slots.map((slot) => {
              const time = formatTime(slot.start);

              return (
                <button
                  key={slot.start}
                  className={`${styles.slot} ${
                    selectedSlot === slot.start ? styles.active : ""
                  }`}
                  onClick={() => setSelectedSlot(slot.start)}
                >
                  <div>{time}</div>

                  {/* 👇 mostramos staff disponible */}
                  <small className={styles.staff}>
                    {slot.availableStaff.length} disponibles
                  </small>
                </button>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        {selectedSlot && (
          <div className={styles.footer}>
            <span>
              Turno: {formatTime(selectedSlot)}
            </span>

            <button className={styles.confirm} onClick={confirmBooking}>
              Confirmar
            </button>
          </div>
        )}
      </main>
    </div>
  );
}