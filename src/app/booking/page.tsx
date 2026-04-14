"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Business = {
  id: string;
  name: string;
  _count: {
    services: number;
    staff: number;
  };
};

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

type Slot = {
  start: string;
  end: string;
  availableStaff: {
    id: string;
    name: string;
  }[];
  bestStaffId: string | null;
};

type AppointmentResponse = {
  id: string;
  startTime: string;
  endTime: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  staff: {
    id: string;
    name: string;
  } | null;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
};

const EMPTY_CUSTOMER: CustomerForm = {
  name: "",
  email: "",
  phone: "",
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookingPage() {
  const [customer, setCustomer] = useState<CustomerForm>(EMPTY_CUSTOMER);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<AppointmentResponse | null>(null);

  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        setLoadingBusinesses(true);
        setCatalogError(null);

        const response = await fetch("/api/businesses");

        if (!response.ok) {
          throw new Error("Could not load businesses");
        }

        const data: Business[] = await response.json();
        setBusinesses(data);

        if (data[0]) {
          setSelectedBusinessId(data[0].id);
        }
      } catch (error) {
        console.error(error);
        setCatalogError("No se pudieron cargar los negocios.");
      } finally {
        setLoadingBusinesses(false);
      }
    }

    loadBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) {
      setServices([]);
      setSelectedServiceId("");
      return;
    }

    async function loadServices() {
      try {
        setLoadingServices(true);
        setCatalogError(null);
        setSelectedServiceId("");
        setSelectedSlotStart(null);
        setBookingResult(null);

        const response = await fetch(`/api/businesses/${selectedBusinessId}/services`);

        if (!response.ok) {
          throw new Error("Could not load services");
        }

        const data: Service[] = await response.json();
        setServices(data);

        if (data[0]) {
          setSelectedServiceId(data[0].id);
        }
      } catch (error) {
        console.error(error);
        setCatalogError("No se pudieron cargar los servicios.");
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, [selectedBusinessId]);

  useEffect(() => {
    if (!selectedBusinessId || !selectedServiceId || !selectedDate) {
      setSlots([]);
      return;
    }

    async function loadSlots() {
      try {
        setLoadingSlots(true);
        setSlotError(null);
        setSelectedSlotStart(null);
        setBookingResult(null);

        const params = new URLSearchParams({
          businessId: selectedBusinessId,
          serviceId: selectedServiceId,
          date: selectedDate,
        });

        const response = await fetch(`/api/availability?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Could not load availability");
        }

        const data: Slot[] = await response.json();
        setSlots(data);
      } catch (error) {
        console.error(error);
        setSlotError("No se pudieron cargar los horarios.");
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [selectedBusinessId, selectedServiceId, selectedDate]);

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId]
  );

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.start === selectedSlotStart) ?? null,
    [slots, selectedSlotStart]
  );

  const canContinueCustomer =
    customer.name.trim().length >= 2 &&
    (customer.email.trim().length > 0 || customer.phone.trim().length > 0);

  const stepItems = [
    {
      label: "Access",
      description: "Tus datos para continuar",
      complete: canContinueCustomer,
    },
    {
      label: "Business",
      description: "Elegí dónde reservar",
      complete: Boolean(selectedBusiness),
    },
    {
      label: "Service",
      description: "Seleccioná el servicio",
      complete: Boolean(selectedService),
    },
    {
      label: "Date",
      description: "Definí el día",
      complete: Boolean(selectedDate),
    },
    {
      label: "Slot",
      description: "Elegí el horario",
      complete: Boolean(selectedSlot),
    },
    {
      label: "Confirm",
      description: "Revisá y finalizá",
      complete: Boolean(bookingResult),
    },
  ];

  async function confirmBooking() {
    if (!selectedBusiness || !selectedService || !selectedSlot || !canContinueCustomer) {
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
          businessId: selectedBusiness.id,
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
        throw new Error(payload.error || "Could not create appointment");
      }

      setBookingResult(payload);
      setSelectedSlotStart(null);

      const params = new URLSearchParams({
        businessId: selectedBusiness.id,
        serviceId: selectedService.id,
        date: selectedDate,
      });

      const availabilityResponse = await fetch(`/api/availability?${params.toString()}`);

      if (availabilityResponse.ok) {
        const availabilityData: Slot[] = await availabilityResponse.json();
        setSlots(availabilityData);
      }
    } catch (error) {
      console.error(error);
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo confirmar la reserva."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.eyebrow}>Reservation Cloud</p>
          <h1 className={styles.title}>Booking flow listo para un SaaS real.</h1>
          <p className={styles.subtitle}>
            Elegí negocio, servicio, día y horario en una sola experiencia clara,
            rápida y preparada para crecer.
          </p>
        </div>

        <div className={styles.steps}>
          {stepItems.map((step, index) => (
            <div
              key={step.label}
              className={`${styles.stepCard} ${step.complete ? styles.stepCardDone : ""}`}
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Resumen</p>
          <dl className={styles.summaryList}>
            <div>
              <dt>Cliente</dt>
              <dd>{customer.name || "Pendiente"}</dd>
            </div>
            <div>
              <dt>Negocio</dt>
              <dd>{selectedBusiness?.name ?? "Pendiente"}</dd>
            </div>
            <div>
              <dt>Servicio</dt>
              <dd>{selectedService?.name ?? "Pendiente"}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{selectedSlot ? formatDate(selectedSlot.start) : selectedDate}</dd>
            </div>
            <div>
              <dt>Horario</dt>
              <dd>{selectedSlot ? formatTime(selectedSlot.start) : "Pendiente"}</dd>
            </div>
          </dl>
        </div>
      </aside>

      <main className={styles.content}>
        <section className={styles.heroCard}>
          <div>
            <p className={styles.eyebrow}>Customer flow</p>
            <h2>Reserva en menos de un minuto</h2>
          </div>

          <div className={styles.heroMeta}>
            <span>{businesses.length} negocios</span>
            <span>{services.length} servicios</span>
            <span>{slots.length} slots visibles</span>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Step 1</p>
                <h3>Tus datos</h3>
              </div>
              <span className={styles.badge}>Booking-ready</span>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Nombre completo</span>
                <input
                  value={customer.name}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Alex Morgan"
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
                  placeholder="alex@studio.com"
                />
              </label>

              <label className={styles.field}>
                <span>Phone opcional</span>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+49 151 23456789"
                />
              </label>
            </div>

            <p className={styles.helperText}>
              En este primer bloque dejamos resuelta la identidad del cliente para
              reservar. El login real con password puede montarse después sin rehacer
              el flujo.
            </p>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Step 2</p>
                <h3>Negocio y servicio</h3>
              </div>
            </div>

            {catalogError && <p className={styles.error}>{catalogError}</p>}

            <div className={styles.selectorSection}>
              <div className={styles.selectorHeader}>
                <h4>Elegí negocio</h4>
                {loadingBusinesses && <span className={styles.subtle}>Cargando...</span>}
              </div>

              <div className={styles.cardGrid}>
                {businesses.map((business) => (
                  <button
                    key={business.id}
                    type="button"
                    className={`${styles.choiceCard} ${
                      selectedBusinessId === business.id ? styles.choiceCardActive : ""
                    }`}
                    onClick={() => setSelectedBusinessId(business.id)}
                  >
                    <strong>{business.name}</strong>
                    <span>{business._count.services} servicios</span>
                    <span>{business._count.staff} profesionales</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.selectorSection}>
              <div className={styles.selectorHeader}>
                <h4>Elegí servicio</h4>
                {loadingServices && <span className={styles.subtle}>Actualizando...</span>}
              </div>

              <div className={styles.cardGrid}>
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={`${styles.choiceCard} ${
                      selectedServiceId === service.id ? styles.choiceCardActive : ""
                    }`}
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    <strong>{service.name}</strong>
                    <span>{service.duration} min</span>
                    <span>{formatCurrency(service.price)}</span>
                    <span>{service._count.staff} staff disponible</span>
                  </button>
                ))}
              </div>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Step 3</p>
                <h3>Fecha y disponibilidad</h3>
              </div>
              <input
                type="date"
                className={styles.dateInput}
                min={toInputDate(new Date())}
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            {slotError && <p className={styles.error}>{slotError}</p>}

            {selectedService && (
              <div className={styles.serviceHighlight}>
                <div>
                  <p className={styles.summaryLabel}>Servicio activo</p>
                  <strong>{selectedService.name}</strong>
                </div>
                <div className={styles.serviceMeta}>
                  <span>{selectedService.duration} min</span>
                  <span>{formatCurrency(selectedService.price)}</span>
                </div>
              </div>
            )}

            {loadingSlots ? (
              <p className={styles.subtle}>Buscando horarios disponibles...</p>
            ) : slots.length > 0 ? (
              <div className={styles.slotGrid}>
                {slots.map((slot) => {
                  const recommendedStaff = slot.availableStaff.find(
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
                      <span>{slot.availableStaff.length} staff disponible</span>
                      <span>
                        {recommendedStaff
                          ? `Recomendado: ${recommendedStaff.name}`
                          : "Asignación automática"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.subtle}>
                No hay horarios para este día. Probá otra fecha o servicio.
              </p>
            )}
          </article>

          <article className={`${styles.panel} ${styles.confirmPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Step 4</p>
                <h3>Confirmar reserva</h3>
              </div>
            </div>

            {submitError && <p className={styles.error}>{submitError}</p>}

            {bookingResult ? (
              <div className={styles.successCard}>
                <p className={styles.successEyebrow}>Reserva confirmada</p>
                <h4>
                  {bookingResult.service.name} con{" "}
                  {bookingResult.staff?.name ?? "staff asignado"}
                </h4>
                <p>
                  {formatDate(bookingResult.startTime)} a las{" "}
                  {formatTime(bookingResult.startTime)}
                </p>
                <p>
                  Confirmación para {bookingResult.customer.name}
                  {bookingResult.customer.email
                    ? ` · ${bookingResult.customer.email}`
                    : ""}
                </p>
              </div>
            ) : (
              <div className={styles.reviewCard}>
                <div>
                  <span>Cliente</span>
                  <strong>{customer.name || "Completa tus datos"}</strong>
                </div>
                <div>
                  <span>Negocio</span>
                  <strong>{selectedBusiness?.name ?? "Seleccioná un negocio"}</strong>
                </div>
                <div>
                  <span>Servicio</span>
                  <strong>{selectedService?.name ?? "Seleccioná un servicio"}</strong>
                </div>
                <div>
                  <span>Fecha</span>
                  <strong>{selectedSlot ? formatDate(selectedSlot.start) : "Elegí un slot"}</strong>
                </div>
                <div>
                  <span>Horario</span>
                  <strong>{selectedSlot ? formatTime(selectedSlot.start) : "Elegí un slot"}</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.confirmButton}
              disabled={
                !selectedBusiness ||
                !selectedService ||
                !selectedSlot ||
                !canContinueCustomer ||
                submitting ||
                Boolean(bookingResult)
              }
              onClick={confirmBooking}
            >
              {submitting ? "Confirmando..." : "Confirmar booking"}
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}
