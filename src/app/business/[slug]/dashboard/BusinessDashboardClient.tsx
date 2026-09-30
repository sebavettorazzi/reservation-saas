"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type StaffMember = {
  id: string;
  name: string;
};

type CourtSchedule = {
  id: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  slotInterval: number;
  isOpen: boolean;
};

type Court = StaffMember & { schedules: CourtSchedule[] };
type DashboardTab = "appointments" | "settings";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const STATUS_LABELS = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
} as const;

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
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
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

type AppointmentStatusFilter = "ALL" | Appointment["status"];

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

function addDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));

  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Cordoba",
  });
}

function toTimeInput(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function fromTimeInput(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export default function BusinessDashboardClient({
  slug,
  activeTab: controlledTab,
  onTabChange,
  hideTabs = false,
}: {
  slug: string;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  hideTabs?: boolean;
}) {
  const [localActiveTab, setLocalActiveTab] = useState<DashboardTab>("appointments");
  const activeTab = controlledTab ?? localActiveTab;

  function selectTab(tab: DashboardTab) {
    if (onTabChange) {
      onTabChange(tab);
      return;
    }

    setLocalActiveTab(tab);
  }
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>("ALL");
  const [courtFilter, setCourtFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [serviceFeedback, setServiceFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [savingCourtId, setSavingCourtId] = useState<string | null>(null);
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

  useEffect(() => {
    fetch(`/api/businesses/slug/${encodeURIComponent(slug)}/schedules`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setCourts)
      .catch(() => setError("No se pudieron cargar los horarios de las canchas."));
  }, [slug]);

  const activeAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "CANCELLED"),
    [appointments]
  );

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesStatus = statusFilter === "ALL" || appointment.status === statusFilter;
        const matchesCourt = courtFilter === "ALL" || appointment.staff?.id === courtFilter;
        const matchesService = serviceFilter === "ALL" || appointment.service.id === serviceFilter;

        return matchesStatus && matchesCourt && matchesService;
      }),
    [appointments, courtFilter, serviceFilter, statusFilter]
  );

  const appointmentSummary = useMemo(
    () => ({
      confirmed: appointments.filter((appointment) => appointment.status === "CONFIRMED").length,
      pending: appointments.filter((appointment) => appointment.status === "PENDING").length,
      cancelled: appointments.filter((appointment) => appointment.status === "CANCELLED").length,
    }),
    [appointments]
  );

  const reservedCourts = useMemo(
    () => new Set(activeAppointments.map((appointment) => appointment.staff?.id).filter(Boolean)).size,
    [activeAppointments]
  );

  const estimatedRevenue = useMemo(
    () =>
      appointments.reduce(
        (total, appointment) =>
          appointment.status === "CONFIRMED" ? total + appointment.service.price : total,
        0
      ),
    [appointments]
  );

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return activeAppointments.find((appointment) => new Date(appointment.startTime).getTime() >= now);
  }, [activeAppointments]);

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

  function updateSchedule(staffId: string, weekday: number, patch: Partial<CourtSchedule>) {
    setCourts((current) => current.map((court) => court.id !== staffId ? court : {
      ...court,
      schedules: court.schedules.map((schedule) => schedule.weekday === weekday ? { ...schedule, ...patch } : schedule),
    }));
  }

  async function saveCourtSchedules(court: Court) {
    try {
      setSavingCourtId(court.id);
      const response = await fetch(`/api/businesses/slug/${encodeURIComponent(slug)}/schedules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: court.schedules.map((schedule) => ({
          staffId: court.id,
          weekday: schedule.weekday,
          startMinute: schedule.startMinute,
          endMinute: schedule.endMinute,
          slotInterval: schedule.slotInterval,
          isOpen: schedule.isOpen,
        })) }),
      });
      if (!response.ok) throw new Error();
      setServiceFeedback(`Horarios de ${court.name} actualizados.`);
    } catch {
      setServiceFeedback("No se pudieron guardar los horarios.");
    } finally {
      setSavingCourtId(null);
    }
  }

  async function updateAppointmentStatus(appointmentId: string, status: "CONFIRMED" | "CANCELLED") {
    const response = await fetch(`/api/businesses/slug/${encodeURIComponent(slug)}/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status } : appointment
        )
      );
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
          <strong>{activeAppointments.length}</strong>
          <p>{appointmentSummary.confirmed} confirmadas · {appointmentSummary.pending} pendientes</p>
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
          <p>No incluye turnos cancelados ni pendientes.</p>
        </article>
      </section>

      {!hideTabs && <nav className={styles.tabs} aria-label="Secciones del panel">
        <button
          type="button"
          className={activeTab === "appointments" ? styles.tabActive : styles.tab}
          onClick={() => selectTab("appointments")}
        >
          Turnos
        </button>
        <button
          type="button"
          className={activeTab === "settings" ? styles.tabActive : styles.tab}
          onClick={() => selectTab("settings")}
        >
          Configuración
        </button>
      </nav>}

      <main className={`${styles.layout} ${activeTab === "appointments" ? styles.appointmentsLayout : styles.settingsLayout}`}>
        {activeTab === "appointments" && <section className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Agenda</p>
              <h2>Reservas del dia</h2>
              <span className={styles.subtle}>{formatInputDate(selectedDate)}</span>
            </div>
            {loadingAppointments && <span className={styles.subtle}>Actualizando...</span>}
          </div>

          <div className={styles.appointmentToolbar}>
            <div className={styles.quickDates} aria-label="Navegacion de fechas">
              <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                Anterior
              </button>
              <button type="button" onClick={() => setSelectedDate(toInputDate(new Date()))}>
                Hoy
              </button>
              <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                Siguiente
              </button>
            </div>

            <label>
              <span>Estado</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as AppointmentStatusFilter)}
              >
                <option value="ALL">Todos</option>
                <option value="CONFIRMED">Confirmados</option>
                <option value="PENDING">Pendientes</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </label>

            <label>
              <span>Cancha</span>
              <select value={courtFilter} onChange={(event) => setCourtFilter(event.target.value)}>
                <option value="ALL">Todas</option>
                {business.staff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Servicio</span>
              <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
                <option value="ALL">Todos</option>
                {business.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.statusStrip}>
            <span>Confirmadas: {appointmentSummary.confirmed}</span>
            <span>Pendientes: {appointmentSummary.pending}</span>
            <span>Canceladas: {appointmentSummary.cancelled}</span>
            <span>Mostrando: {filteredAppointments.length}</span>
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
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className={`${styles.reservationCard} ${
                    appointment.status === "CANCELLED" ? styles.reservationCardCancelled : ""
                  }`}
                >
                  <div className={styles.reservationTime}>
                    <strong>{formatTime(appointment.startTime)}</strong>
                    <span>{formatTime(appointment.endTime)}</span>
                  </div>

                  <div className={styles.reservationBody}>
                    <div className={styles.reservationTitleRow}>
                      <h3>{appointment.staff?.name ?? "Cancha por definir"}</h3>
                      <span className={`${styles.statusBadge} ${styles[`status${appointment.status}`]}`}>
                        {STATUS_LABELS[appointment.status]}
                      </span>
                    </div>
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
                    <p>{appointment.customer.phone ?? "Sin telefono"}</p>
                    {appointment.status !== "CONFIRMED" && appointment.status !== "CANCELLED" && (
                      <button type="button" className={styles.saveButton} onClick={() => updateAppointmentStatus(appointment.id, "CONFIRMED")}>Confirmar</button>
                    )}
                    {appointment.status !== "CANCELLED" && (
                      <button type="button" className={styles.cancelButton} onClick={() => updateAppointmentStatus(appointment.id, "CANCELLED")}>Cancelar</button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className={styles.emptyState}>
                <h3>Sin reservas para estos filtros</h3>
                <p>Cambia la fecha, cancha, servicio o estado para ampliar la busqueda.</p>
              </div>
            )}
          </div>
        </section>}

        {activeTab === "settings" && <aside className={styles.sidePanel}>
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
          <div className={styles.sideCard}>
            <div className={styles.panelHeader}><div><p className={styles.panelEyebrow}>Horarios</p><h2>Canchas</h2></div></div>
            {courts.map((court) => (
              <div key={court.id} className={styles.serviceEditorCard}>
                <div className={styles.serviceEditorHeader}><strong>{court.name}</strong></div>
                {court.schedules.map((schedule) => (
                  <div key={schedule.weekday} className={styles.scheduleRow}>
                    <span>{WEEKDAYS[schedule.weekday]}</span>
                    <input type="checkbox" checked={schedule.isOpen} onChange={(event) => updateSchedule(court.id, schedule.weekday, { isOpen: event.target.checked })} />
                    <input type="time" value={toTimeInput(schedule.startMinute)} disabled={!schedule.isOpen} onChange={(event) => updateSchedule(court.id, schedule.weekday, { startMinute: fromTimeInput(event.target.value) })} />
                    <input type="time" value={toTimeInput(schedule.endMinute)} disabled={!schedule.isOpen} onChange={(event) => updateSchedule(court.id, schedule.weekday, { endMinute: fromTimeInput(event.target.value) })} />
                  </div>
                ))}
                <button type="button" className={styles.saveButton} disabled={savingCourtId === court.id} onClick={() => saveCourtSchedules(court)}>{savingCourtId === court.id ? "Guardando..." : "Guardar horarios"}</button>
              </div>
            ))}
          </div>
        </aside>}
      </main>
    </div>
  );
}
