"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type StaffMember = {
  id: string;
  name: string;
};

type ServiceSummary = {
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

type BusinessDetail = {
  id: string;
  name: string;
  slug: string | null;
  category: "GENERAL" | "SALON" | "SPORTS" | "DENTAL" | "BEAUTY";
  plan: "BASE" | "PREMIUM";
  tagline: string | null;
  description: string | null;
  staff: StaffMember[];
  services: ServiceSummary[];
  _count: {
    staff: number;
    services: number;
    appointments: number;
  };
};

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
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
  staff: StaffMember | null;
};

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

export default function BusinessDashboardClient({ slug }: { slug: string }) {
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [serviceFeedback, setServiceFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBusiness() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/businesses/slug/${encodeURIComponent(slug)}`);

        if (!response.ok) {
          throw new Error("Could not load business");
        }

        const payload: BusinessDetail = await response.json();
        setBusiness(payload);
        setPriceDrafts(
          Object.fromEntries(
            payload.services.map((service) => [service.id, String(service.price)])
          )
        );
      } catch (loadError) {
        console.error(loadError);
        setError("No se pudo cargar el panel interno.");
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, [slug]);

  useEffect(() => {
    async function loadAppointments() {
      try {
        setLoadingAppointments(true);

        const params = new URLSearchParams({
          date: selectedDate,
        });

        const response = await fetch(
          `/api/businesses/slug/${encodeURIComponent(slug)}/appointments?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Could not load appointments");
        }

        const payload: {
          appointments: Appointment[];
        } = await response.json();

        setAppointments(payload.appointments);
      } catch (loadError) {
        console.error(loadError);
        setError("No se pudieron cargar las reservas.");
      } finally {
        setLoadingAppointments(false);
      }
    }

    loadAppointments();
  }, [selectedDate, slug]);

  const reservedCourts = useMemo(
    () => new Set(appointments.map((appointment) => appointment.staff?.id).filter(Boolean)).size,
    [appointments]
  );

  const estimatedRevenue = useMemo(
    () => appointments.reduce((total, appointment) => total + appointment.service.price, 0),
    [appointments]
  );

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return appointments.find((appointment) => new Date(appointment.startTime).getTime() >= now);
  }, [appointments]);

  async function saveServicePrice(serviceId: string) {
    const rawPrice = priceDrafts[serviceId];
    const price = Number(rawPrice);

    if (!Number.isFinite(price) || price <= 0) {
      setServiceFeedback("Ingresa un precio valido antes de guardar.");
      return;
    }

    try {
      setSavingServiceId(serviceId);
      setServiceFeedback(null);

      const response = await fetch(
        `/api/businesses/slug/${encodeURIComponent(slug)}/services/${serviceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ price }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo actualizar el precio");
      }

      setBusiness((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          services: current.services.map((service) =>
            service.id === payload.id
              ? {
                  ...service,
                  price: payload.price,
                }
              : service
          ),
        };
      });

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.service.id === payload.id
            ? {
                ...appointment,
                service: {
                  ...appointment.service,
                  price: payload.price,
                },
              }
            : appointment
        )
      );

      setPriceDrafts((current) => ({
        ...current,
        [payload.id]: String(payload.price),
      }));
      setServiceFeedback("Precio actualizado correctamente.");
    } catch (saveError) {
      console.error(saveError);
      setServiceFeedback(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el precio."
      );
    } finally {
      setSavingServiceId(null);
    }
  }

  if (loading) {
    return <div className={styles.loadingPage}>Cargando panel...</div>;
  }

  if (error || !business) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.errorState}>
          <h1>Panel no disponible</h1>
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
        <div>
          <p className={styles.eyebrow}>Gestion interna</p>
          <h1>{business.name}</h1>
          <p className={styles.lead}>
            Vista operativa del complejo para controlar reservas, clientes, precios y
            ocupacion por cancha.
          </p>
        </div>

        <div className={styles.heroActions}>
          <label className={styles.datePicker}>
            <span>Fecha</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <Link href={`/business/${business.slug ?? slug}`} className={styles.secondaryLink}>
            Ver pagina publica
          </Link>
          <Link href={`/business/${business.slug ?? slug}/premium`} className={styles.primaryLink}>
            Modulo premium
          </Link>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span>Plan actual</span>
          <strong>{business.plan}</strong>
          <p>
            {business.plan === "PREMIUM"
              ? "Finanzas, gastos y tablero avanzado disponibles."
              : "Base activa. El upgrade premium habilita analitica y gastos."}
          </p>
        </article>

        <article className={styles.statCard}>
          <span>Reservas del dia</span>
          <strong>{appointments.length}</strong>
          <p>{formatInputDate(selectedDate)}</p>
        </article>

        <article className={styles.statCard}>
          <span>Canchas ocupadas</span>
          <strong>
            {reservedCourts}/{business.staff.length}
          </strong>
          <p>Uso visible en la jornada seleccionada.</p>
        </article>

        <article className={styles.statCard}>
          <span>Facturacion estimada</span>
          <strong>{formatCurrency(estimatedRevenue)}</strong>
          <p>Calculada con las reservas confirmadas del dia.</p>
        </article>
      </section>

      <main className={styles.layout}>
        <section className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Agenda</p>
              <h2>Reservas del dia</h2>
            </div>
            {loadingAppointments && <span className={styles.subtle}>Actualizando...</span>}
          </div>

          {nextAppointment ? (
            <div className={styles.nextCard}>
              <span>Proxima reserva</span>
              <strong>
                {formatTime(nextAppointment.startTime)} -{" "}
                {nextAppointment.staff?.name ?? "Sin cancha"}
              </strong>
              <p>
                {nextAppointment.customer.name} · {nextAppointment.service.name}
              </p>
            </div>
          ) : (
            <div className={styles.nextCard}>
              <span>Proxima reserva</span>
              <strong>Sin reservas pendientes para esta fecha</strong>
              <p>La agenda esta libre en la fecha seleccionada.</p>
            </div>
          )}

          <div className={styles.reservationList}>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <article key={appointment.id} className={styles.reservationCard}>
                  <div className={styles.reservationTime}>
                    <strong>{formatTime(appointment.startTime)}</strong>
                    <span>{formatTime(appointment.endTime)}</span>
                  </div>

                  <div className={styles.reservationBody}>
                    <h3>{appointment.staff?.name ?? "Cancha por definir"}</h3>
                    <p>{appointment.service.name}</p>
                    <div className={styles.metaRow}>
                      <span>{appointment.customer.name}</span>
                      <span>
                        {appointment.customer.phone ??
                          appointment.customer.email ??
                          "Sin contacto"}
                      </span>
                      <span>{formatCurrency(appointment.service.price)}</span>
                    </div>
                  </div>

                  <div className={styles.contactCard}>
                    <span>Contacto</span>
                    <strong>{appointment.customer.name}</strong>
                    <p>{appointment.customer.email ?? "Sin email"}</p>
                    <p>{appointment.customer.phone ?? "Sin telefono"}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className={styles.emptyState}>
                <h3>Sin reservas para esta fecha</h3>
                <p>Puedes usar esta vista para controlar turnos, clientes y ocupacion.</p>
              </div>
            )}
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.sideCard}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Precios</p>
                <h2>Editar valores</h2>
              </div>
            </div>

            {serviceFeedback && <p className={styles.feedback}>{serviceFeedback}</p>}

            <div className={styles.serviceEditorList}>
              {business.services.map((service) => (
                <div key={service.id} className={styles.serviceEditorCard}>
                  <div className={styles.serviceEditorHeader}>
                    <div>
                      <strong>{service.name}</strong>
                      <span>{service.duration} min</span>
                    </div>
                    <span>{service._count.staff} cancha/s</span>
                  </div>

                  <label className={styles.priceField}>
                    <span>Precio</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={priceDrafts[service.id] ?? ""}
                      onChange={(event) =>
                        setPriceDrafts((current) => ({
                          ...current,
                          [service.id]: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.saveButton}
                    disabled={savingServiceId === service.id}
                    onClick={() => saveServicePrice(service.id)}
                  >
                    {savingServiceId === service.id ? "Guardando..." : "Guardar precio"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
