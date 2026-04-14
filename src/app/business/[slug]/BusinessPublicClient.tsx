"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  businessId: string;
  _count: {
    staff: number;
  };
};

type StaffMember = {
  id: string;
  name: string;
};

type BusinessDetail = {
  id: string;
  name: string;
  slug: string | null;
  category: "GENERAL" | "SALON" | "SPORTS" | "DENTAL" | "BEAUTY";
  plan: "BASE" | "PREMIUM";
  tagline: string | null;
  description: string | null;
  staff: StaffMember[];
  services: Service[];
  _count: {
    staff: number;
    services: number;
    appointments: number;
  };
};

type Slot = {
  start: string;
  end: string;
  availableStaff: StaffMember[];
  bestStaffId: string | null;
};

type AppointmentResponse = {
  id: string;
  startTime: string;
  endTime: string;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
  staff: StaffMember | null;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
};

type SlotWindow = "all" | "afternoon" | "night";

const EMPTY_CUSTOMER: CustomerForm = {
  name: "",
  email: "",
  phone: "",
};

const SLOT_WINDOWS: Array<{ id: SlotWindow; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "afternoon", label: "Tarde" },
  { id: "night", label: "Noche" },
];

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function matchesSlotWindow(slot: Slot, slotWindow: SlotWindow) {
  if (slotWindow === "all") {
    return true;
  }

  const hour = new Date(slot.start).getHours();

  if (slotWindow === "afternoon") {
    return hour >= 12 && hour < 19;
  }

  return hour >= 19;
}

export default function BusinessPublicClient({ slug }: { slug: string }) {
  const [customer, setCustomer] = useState<CustomerForm>(EMPTY_CUSTOMER);
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<AppointmentResponse | null>(null);
  const [slotWindow, setSlotWindow] = useState<SlotWindow>("all");
  const [visibleSlotCount, setVisibleSlotCount] = useState(8);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBusiness() {
      try {
        setLoadingBusiness(true);
        setError(null);

        const response = await fetch(`/api/businesses/slug/${encodeURIComponent(slug)}`);

        if (!response.ok) {
          throw new Error("Could not load business");
        }

        const payload: BusinessDetail = await response.json();
        setBusiness(payload);

        if (payload.services[0]) {
          setSelectedServiceId(payload.services[0].id);
        }
      } catch (loadError) {
        console.error(loadError);
        setError("No se pudo cargar este sistema.");
      } finally {
        setLoadingBusiness(false);
      }
    }

    loadBusiness();
  }, [slug]);

  useEffect(() => {
    if (!business || !selectedServiceId || !selectedDate) {
      setSlots([]);
      return;
    }

    const currentBusiness = business;

    async function loadSlots() {
      try {
        setLoadingSlots(true);
        setSlotError(null);
        setSelectedSlotStart(null);
        setBookingResult(null);

        const params = new URLSearchParams({
          businessId: currentBusiness.id,
          serviceId: selectedServiceId,
          date: selectedDate,
        });

        const response = await fetch(`/api/availability?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Could not load availability");
        }

        const payload: Slot[] = await response.json();
        setSlots(payload);
      } catch (loadError) {
        console.error(loadError);
        setSlotError("No se pudieron cargar los horarios disponibles.");
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [business, selectedDate, selectedServiceId]);

  useEffect(() => {
    setVisibleSlotCount(8);
  }, [selectedDate, selectedServiceId, slotWindow]);

  const selectedService = useMemo(
    () => business?.services.find((service) => service.id === selectedServiceId) ?? null,
    [business, selectedServiceId]
  );

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.start === selectedSlotStart) ?? null,
    [selectedSlotStart, slots]
  );

  const filteredSlots = useMemo(
    () => slots.filter((slot) => matchesSlotWindow(slot, slotWindow)),
    [slotWindow, slots]
  );

  const visibleSlots = useMemo(
    () => filteredSlots.slice(0, visibleSlotCount),
    [filteredSlots, visibleSlotCount]
  );

  const selectedCourtName = useMemo(() => {
    if (!selectedSlot) {
      return "Se asigna al confirmar";
    }

    const recommendedCourt = selectedSlot.availableStaff.find(
      (staff) => staff.id === selectedSlot.bestStaffId
    );

    return recommendedCourt?.name ?? "Asignacion automatica";
  }, [selectedSlot]);

  const readyToBook =
    customer.name.trim().length >= 2 &&
    (customer.email.trim().length > 0 || customer.phone.trim().length > 0) &&
    Boolean(selectedService) &&
    Boolean(selectedSlot) &&
    Boolean(business);

  async function refreshAvailability() {
    if (!business || !selectedServiceId) {
      return;
    }

    const params = new URLSearchParams({
      businessId: business.id,
      serviceId: selectedServiceId,
      date: selectedDate,
    });

    const response = await fetch(`/api/availability?${params.toString()}`);

    if (response.ok) {
      const payload: Slot[] = await response.json();
      setSlots(payload);
    }
  }

  async function confirmBooking() {
    if (!business || !selectedService || !selectedSlot || !readyToBook) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService.id,
          staffId: selectedSlot.bestStaffId,
          start: selectedSlot.start,
          end: selectedSlot.end,
          customer: {
            name: customer.name.trim(),
            email: customer.email.trim() || undefined,
            phone: customer.phone.trim() || undefined,
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo crear la reserva");
      }

      setBookingResult(payload);
      setSelectedSlotStart(null);
      await refreshAvailability();
    } catch (bookingError) {
      console.error(bookingError);
      setSubmitError(
        bookingError instanceof Error
          ? bookingError.message
          : "No se pudo confirmar la reserva."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingBusiness) {
    return <div className={styles.loadingPage}>Cargando sistema...</div>;
  }

  if (error || !business) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.errorState}>
          <h1>Sistema no disponible</h1>
          <p>{error ?? "No encontramos este negocio."}</p>
          <Link href="/" className={styles.secondaryLink}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Complejo deportivo</p>
          <h1>{business.name}</h1>
          <p className={styles.lead}>
            {business.tagline ??
              "Reserva tu cancha en pocos pasos y recibe la confirmacion al instante."}
          </p>
          <p className={styles.description}>
            {business.description ??
              "Sistema online para ver horarios disponibles y reservar sin llamadas ni mensajes."}
          </p>

          <div className={styles.heroMeta}>
            <span>{business._count.staff} canchas activas</span>
            <span>{business._count.services} tipos de reserva</span>
            <span>Reservas directas online</span>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <p className={styles.panelLabel}>Identidad del complejo</p>
          <h2>2 de Abril</h2>
          <p>
            El nombre honra la memoria de Malvinas y la historia personal del fundador del
            complejo. La experiencia publica queda enfocada solo en elegir cancha, horario
            y confirmar la reserva.
          </p>
        </div>
      </header>

      <main className={styles.layout}>
        <section className={styles.infoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Canchas</p>
                <h3>Disponibilidad del complejo</h3>
              </div>
              <span className={styles.planBadge}>{business.staff.length} recursos</span>
            </div>

            <div className={styles.compactCourtGrid}>
              {business.staff.map((court) => (
                <div key={court.id} className={styles.compactCourtCard}>
                  <strong>{court.name}</strong>
                  <span>Asignacion automatica por disponibilidad real.</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Tipos de reserva</p>
                <h3>Elegi tu cancha</h3>
              </div>
            </div>

            <div className={styles.serviceGrid}>
              {business.services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={`${styles.serviceCard} ${
                    selectedServiceId === service.id ? styles.serviceCardActive : ""
                  }`}
                  onClick={() => setSelectedServiceId(service.id)}
                >
                  <strong>{service.name}</strong>
                  <span>{service.description ?? "Reserva lista para confirmar."}</span>
                  <div className={styles.serviceMeta}>
                    <span>{service.duration} min</span>
                    <span>{formatCurrency(service.price)}</span>
                    <span>{service._count.staff} cancha/s</span>
                  </div>
                </button>
              ))}
            </div>
          </article>
        </section>

        <aside className={styles.bookingPanel}>
          <div className={styles.bookingCard}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Reserva online</p>
                <h3>Tomar un turno</h3>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Nombre y apellido</span>
                <input
                  value={customer.name}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nombre del responsable"
                />
              </label>

              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="equipo@correo.com"
                />
              </label>

              <label className={styles.field}>
                <span>Telefono</span>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+54 11 5555 0000"
                />
              </label>

              <label className={styles.field}>
                <span>Fecha</span>
                <input
                  type="date"
                  min={toInputDate(new Date())}
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </label>
            </div>

            {slotError && <p className={styles.error}>{slotError}</p>}

            <div className={styles.slotSection}>
              <div className={styles.selectorRow}>
                <h4>Horarios disponibles</h4>
                {loadingSlots && <span className={styles.subtle}>Buscando...</span>}
              </div>

              <div className={styles.slotToolbar}>
                <div className={styles.filterRow}>
                  {SLOT_WINDOWS.map((window) => (
                    <button
                      key={window.id}
                      type="button"
                      className={`${styles.filterChip} ${
                        slotWindow === window.id ? styles.filterChipActive : ""
                      }`}
                      onClick={() => setSlotWindow(window.id)}
                    >
                      {window.label}
                    </button>
                  ))}
                </div>
                <span className={styles.subtle}>{filteredSlots.length} horarios visibles</span>
              </div>

              {loadingSlots ? (
                <p className={styles.subtle}>Consultando disponibilidad real...</p>
              ) : filteredSlots.length > 0 ? (
                <>
                  <div className={styles.slotGrid}>
                    {visibleSlots.map((slot) => {
                      const recommendedCourt = slot.availableStaff.find(
                        (staff) => staff.id === slot.bestStaffId
                      );

                      return (
                        <button
                          key={slot.start}
                          type="button"
                          className={`${styles.slotCard} ${
                            selectedSlotStart === slot.start ? styles.slotCardActive : ""
                          }`}
                          onClick={() => setSelectedSlotStart(slot.start)}
                        >
                          <strong>{formatTime(slot.start)}</strong>
                          <span>{slot.availableStaff.length} canchas libres</span>
                          <span>
                            {recommendedCourt
                              ? `Sugerida: ${recommendedCourt.name}`
                              : "Asignacion automatica"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {filteredSlots.length > visibleSlots.length && (
                    <button
                      type="button"
                      className={styles.moreButton}
                      onClick={() => setVisibleSlotCount((current) => current + 8)}
                    >
                      Ver mas horarios
                    </button>
                  )}
                </>
              ) : (
                <p className={styles.subtle}>
                  No hay turnos para la franja elegida. Proba otra fecha u otro bloque horario.
                </p>
              )}
            </div>

            {submitError && <p className={styles.error}>{submitError}</p>}

            {bookingResult ? (
              <div className={styles.successCard}>
                <p className={styles.panelEyebrow}>Reserva confirmada</p>
                <h4>{bookingResult.service.name}</h4>
                <p>
                  {formatDate(bookingResult.startTime)} a las{" "}
                  {formatTime(bookingResult.startTime)}
                </p>
                <p>
                  Cancha asignada: {bookingResult.staff?.name ?? "Asignacion automatica"}
                </p>
              </div>
            ) : (
              <div className={styles.summaryCard}>
                <div>
                  <span>Servicio</span>
                  <strong>{selectedService?.name ?? "Selecciona una opcion"}</strong>
                </div>
                <div>
                  <span>Horario</span>
                  <strong>{selectedSlot ? formatTime(selectedSlot.start) : "Sin elegir"}</strong>
                </div>
                <div>
                  <span>Cancha</span>
                  <strong>{selectedCourtName}</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.confirmButton}
              disabled={!readyToBook || submitting || Boolean(bookingResult)}
              onClick={confirmBooking}
            >
              {submitting ? "Confirmando..." : "Confirmar reserva"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
