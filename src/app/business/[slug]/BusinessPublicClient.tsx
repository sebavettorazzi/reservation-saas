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
  phone: string;
};

type BookingStep = "date" | "court" | "slots" | "details" | "confirm";
type SlotWindow = "all" | "afternoon" | "night";

const EMPTY_CUSTOMER: CustomerForm = {
  name: "",
  phone: "",
};

const SLOT_WINDOWS: Array<{ id: SlotWindow; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "afternoon", label: "Tarde" },
  { id: "night", label: "Noche" },
];

const STEP_LABELS: Record<BookingStep, string> = {
  date: "Fecha",
  court: "Cancha",
  slots: "Horario",
  details: "Datos",
  confirm: "Confirmar",
};

const STEP_ORDER: BookingStep[] = ["date", "court", "slots", "details", "confirm"];
const REQUEST_TIMEOUT_MS = 8000;

function toInputDate(date: Date) {
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Cordoba",
  });
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
    timeZone: "America/Argentina/Cordoba",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Argentina/Cordoba",
  });
}

function formatInputDate(value: string) {
  return formatDate(`${value}T12:00:00-03:00`);
}

function matchesSlotWindow(slot: Slot, slotWindow: SlotWindow) {
  if (slotWindow === "all") {
    return true;
  }

  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Argentina/Cordoba",
    }).format(new Date(slot.start))
  );

  if (slotWindow === "afternoon") {
    return hour >= 12 && hour < 19;
  }

  return hour >= 19;
}

export default function BusinessPublicClient({ slug }: { slug: string }) {
  const [bookingStarted, setBookingStarted] = useState(false);
  const [step, setStep] = useState<BookingStep>("date");
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
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        setLoadingBusiness(true);
        setError(null);

        const response = await fetch(`/api/businesses/slug/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });

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
        window.clearTimeout(timeoutId);
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
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

        const response = await fetch(`/api/availability?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not load availability");
        }

        const payload: Slot[] = await response.json();
        setSlots(payload);
      } catch (loadError) {
        console.error(loadError);
        setSlotError("No se pudieron cargar los horarios disponibles.");
      } finally {
        window.clearTimeout(timeoutId);
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
    customer.phone.trim().length >= 7 &&
    Boolean(selectedService) &&
    Boolean(selectedSlot) &&
    Boolean(business);

  function goToStep(nextStep: BookingStep) {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
            phone: customer.phone.trim(),
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

  if (!bookingStarted) {
    return (
      <main className={styles.startPage}>
        <section className={styles.startHero}>
          <p className={styles.eyebrow}>Complejo deportivo</p>
          <h1>{business.name}</h1>
          <p>
            {business.tagline ??
              "Reserva tu cancha en pocos pasos y confirma el turno online."}
          </p>
          <button
            type="button"
            className={styles.startButton}
            onClick={() => {
              setBookingStarted(true);
              goToStep("date");
            }}
          >
            Reservar turno
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.flowPage}>
      <section className={styles.flowShell}>
        <header className={styles.flowHeader}>
          <div>
            <p className={styles.eyebrow}>{business.name}</p>
            <h1>{STEP_LABELS[step]}</h1>
          </div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setBookingStarted(false)}
          >
            Inicio
          </button>
        </header>

        <div className={styles.stepRail}>
          {STEP_ORDER.map((item) => (
            <span key={item} className={item === step ? styles.stepActive : ""}>
              {STEP_LABELS[item]}
            </span>
          ))}
        </div>

        {step === "date" && (
          <section className={styles.stepCard}>
            <p className={styles.panelEyebrow}>Paso 1</p>
            <h2>Elegir fecha</h2>
            <label className={styles.field}>
              <span>Fecha del turno</span>
              <input
                type="date"
                min={toInputDate(new Date())}
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <div className={styles.stepActions}>
              <button type="button" className={styles.confirmButton} onClick={() => goToStep("court")}>
                Continuar
              </button>
            </div>
          </section>
        )}

        {step === "court" && (
          <section className={styles.stepCard}>
            <p className={styles.panelEyebrow}>Paso 2</p>
            <h2>Elegir cancha</h2>
            <p className={styles.stepHint}>
              Fecha seleccionada: {formatInputDate(selectedDate)}
            </p>
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
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.stepActions}>
              <button type="button" className={styles.backButton} onClick={() => goToStep("date")}>
                Volver
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                disabled={!selectedService}
                onClick={() => goToStep("slots")}
              >
                Ver horarios
              </button>
            </div>
          </section>
        )}

        {step === "slots" && (
          <section className={styles.stepCard}>
            <p className={styles.panelEyebrow}>Paso 3</p>
            <h2>Elegir horario</h2>
            <p className={styles.stepHint}>
              {selectedService?.name} · {formatInputDate(selectedDate)}
            </p>
            {slotError && <p className={styles.error}>{slotError}</p>}
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
              {loadingSlots && <span className={styles.subtle}>Buscando...</span>}
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
                        <span>
                          {recommendedCourt
                            ? recommendedCourt.name
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
                No hay turnos para la franja elegida. Proba otra fecha u otro horario.
              </p>
            )}

            <div className={styles.stepActions}>
              <button type="button" className={styles.backButton} onClick={() => goToStep("court")}>
                Volver
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                disabled={!selectedSlot}
                onClick={() => goToStep("details")}
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {step === "details" && (
          <section className={styles.stepCard}>
            <p className={styles.panelEyebrow}>Paso 4</p>
            <h2>Tus datos</h2>
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
            </div>

            <div className={styles.stepActions}>
              <button type="button" className={styles.backButton} onClick={() => goToStep("slots")}>
                Volver
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                disabled={customer.name.trim().length < 2 || customer.phone.trim().length < 7}
                onClick={() => goToStep("confirm")}
              >
                Revisar reserva
              </button>
            </div>
          </section>
        )}

        {step === "confirm" && (
          <section className={styles.stepCard}>
            <p className={styles.panelEyebrow}>Paso 5</p>
            <h2>Confirmar reserva</h2>
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
                  <span>Fecha</span>
                  <strong>{formatInputDate(selectedDate)}</strong>
                </div>
                <div>
                  <span>Cancha</span>
                  <strong>{selectedService?.name ?? "Sin elegir"}</strong>
                </div>
                <div>
                  <span>Horario</span>
                  <strong>{selectedSlot ? formatTime(selectedSlot.start) : "Sin elegir"}</strong>
                </div>
                <div>
                  <span>Asignacion</span>
                  <strong>{selectedCourtName}</strong>
                </div>
                <div>
                  <span>Responsable</span>
                  <strong>{customer.name}</strong>
                </div>
                <div>
                  <span>Telefono</span>
                  <strong>{customer.phone}</strong>
                </div>
              </div>
            )}

            {submitError && <p className={styles.error}>{submitError}</p>}

            <div className={styles.stepActions}>
              <button type="button" className={styles.backButton} onClick={() => goToStep("details")}>
                Volver
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                disabled={!readyToBook || submitting || Boolean(bookingResult)}
                onClick={confirmBooking}
              >
                {submitting ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
