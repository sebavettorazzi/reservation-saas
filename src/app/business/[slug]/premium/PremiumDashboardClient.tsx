"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type PremiumMetric = {
  monthlyRevenue: number;
  todayRevenue: number;
  monthlyExpenseTotal: number;
  todayExpenseTotal: number;
  netRevenue: number;
  averageTicket: number;
  reservationsThisMonth: number;
  reservationsToday: number;
  averageReservationsPerCourt: number;
  topService: {
    serviceId: string;
    name: string;
    revenue: number;
    reservations: number;
  } | null;
  topCourt: {
    staffId: string;
    name: string;
    reservations: number;
    revenue: number;
  } | null;
};

type PremiumPayload = {
  business: {
    id: string;
    name: string;
    slug: string | null;
    plan: "BASE" | "PREMIUM";
    category: "GENERAL" | "SALON" | "SPORTS" | "DENTAL" | "BEAUTY";
    tagline: string | null;
    _count: {
      staff: number;
      services: number;
      appointments: number;
    };
  };
  premiumUnlocked: boolean;
  metrics: PremiumMetric | null;
  revenueByService: Array<{
    serviceId: string;
    name: string;
    revenue: number;
    reservations: number;
  }>;
  revenueByCourt: Array<{
    staffId: string;
    name: string;
    reservations: number;
    revenue: number;
  }>;
  recentExpenses: Array<{
    id: string;
    title: string;
    category: string | null;
    amount: number;
    notes: string | null;
    expenseDate: string;
    createdAt: string;
  }>;
  expenseByCategory: Array<{
    category: string;
    total: number;
    count: number;
  }>;
};

type ExpenseForm = {
  title: string;
  category: string;
  amount: string;
  expenseDate: string;
  notes: string;
};

const EMPTY_EXPENSE_FORM: ExpenseForm = {
  title: "",
  category: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

function monthToIsoDate(monthValue: string) {
  return `${monthValue}-01T00:00:00.000Z`;
}

function toMonthInput(date: Date) {
  return date.toISOString().slice(0, 7);
}

async function fetchPremiumDashboard(slug: string, selectedMonth: string) {
  const params = new URLSearchParams({
    date: monthToIsoDate(selectedMonth),
  });

  const response = await fetch(
    `/api/businesses/slug/${encodeURIComponent(slug)}/premium?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar el modulo premium");
  }

  return (await response.json()) as PremiumPayload;
}

export default function PremiumDashboardClient({ slug }: { slug: string }) {
  const [selectedMonth, setSelectedMonth] = useState(toMonthInput(new Date()));
  const [dashboard, setDashboard] = useState<PremiumPayload | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(EMPTY_EXPENSE_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const payload = await fetchPremiumDashboard(slug, selectedMonth);
        setDashboard(payload);
      } catch (loadError) {
        console.error(loadError);
        setError("No se pudo cargar el modulo premium.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [selectedMonth, slug]);

  const maxServiceRevenue = useMemo(
    () =>
      dashboard?.revenueByService.reduce(
        (currentMax, service) => Math.max(currentMax, service.revenue),
        0
      ) ?? 0,
    [dashboard]
  );

  const maxCourtRevenue = useMemo(
    () =>
      dashboard?.revenueByCourt.reduce(
        (currentMax, court) => Math.max(currentMax, court.revenue),
        0
      ) ?? 0,
    [dashboard]
  );

  const maxExpenseCategory = useMemo(
    () =>
      dashboard?.expenseByCategory.reduce(
        (currentMax, category) => Math.max(currentMax, category.total),
        0
      ) ?? 0,
    [dashboard]
  );

  async function submitExpense() {
    const amount = Number(expenseForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setExpenseError("Ingresa un monto valido para registrar el gasto.");
      return;
    }

    try {
      setSubmitting(true);
      setExpenseError(null);
      setFeedback(null);

      const response = await fetch(
        `/api/businesses/slug/${encodeURIComponent(slug)}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: expenseForm.title,
            category: expenseForm.category || undefined,
            amount,
            expenseDate: new Date(`${expenseForm.expenseDate}T12:00:00.000Z`).toISOString(),
            notes: expenseForm.notes || undefined,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo registrar el gasto");
      }

      setExpenseForm({
        ...EMPTY_EXPENSE_FORM,
        expenseDate: expenseForm.expenseDate,
      });
      setFeedback("Gasto registrado correctamente.");
      const refreshedPayload = await fetchPremiumDashboard(slug, selectedMonth);
      setDashboard(refreshedPayload);
    } catch (submitError) {
      console.error(submitError);
      setExpenseError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo registrar el gasto."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className={styles.loadingPage}>Cargando modulo premium...</div>;
  }

  if (error || !dashboard) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.errorState}>
          <h1>Modulo premium no disponible</h1>
          <p>{error ?? "No se encontro este negocio."}</p>
          <Link href="/" className={styles.secondaryLink}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboard.premiumUnlocked || !dashboard.metrics) {
    return (
      <div className={styles.page}>
        <div className={styles.lockedShell}>
          <p className={styles.eyebrow}>Premium module</p>
          <h1>Activa PREMIUM para ver finanzas y gastos</h1>
          <p className={styles.lead}>
            Este negocio hoy esta en plan base. Al pasar a premium se habilitan metricas,
            ingresos, egresos, recordatorios y reportes.
          </p>
          <Link
            href={`/business/${dashboard.business.slug ?? slug}/dashboard`}
            className={styles.primaryLink}
          >
            Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  const metrics = dashboard.metrics;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Premium analytics</p>
          <h1>{dashboard.business.name}</h1>
          <p className={styles.lead}>
            Ingresos, gastos y rendimiento operativo del complejo en un solo dashboard.
          </p>
        </div>

        <div className={styles.heroActions}>
          <label className={styles.monthPicker}>
            <span>Mes</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </label>
          <Link
            href={`/business/${dashboard.business.slug ?? slug}/dashboard`}
            className={styles.secondaryLink}
          >
            Volver al panel
          </Link>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span>Ingresos del mes</span>
          <strong>{formatCurrency(metrics.monthlyRevenue)}</strong>
          <p>{metrics.reservationsThisMonth} reservas confirmadas.</p>
        </article>

        <article className={styles.statCard}>
          <span>Gastos del mes</span>
          <strong>{formatCurrency(metrics.monthlyExpenseTotal)}</strong>
          <p>{dashboard.recentExpenses.length} gastos recientes registrados.</p>
        </article>

        <article className={styles.statCard}>
          <span>Neto del mes</span>
          <strong>{formatCurrency(metrics.netRevenue)}</strong>
          <p>Ingresos menos egresos del periodo.</p>
        </article>

        <article className={styles.statCard}>
          <span>Ticket promedio</span>
          <strong>{formatCurrency(metrics.averageTicket)}</strong>
          <p>Valor promedio por reserva.</p>
        </article>

        <article className={styles.statCard}>
          <span>Ingresos de hoy</span>
          <strong>{formatCurrency(metrics.todayRevenue)}</strong>
          <p>{metrics.reservationsToday} reservas para hoy.</p>
        </article>

        <article className={styles.statCard}>
          <span>Gastos de hoy</span>
          <strong>{formatCurrency(metrics.todayExpenseTotal)}</strong>
          <p>
            Promedio de {metrics.averageReservationsPerCourt.toFixed(1)} reservas por cancha.
          </p>
        </article>
      </section>

      <main className={styles.layout}>
        <section className={styles.mainPanel}>
          <div className={styles.highlightGrid}>
            <div className={styles.highlightCard}>
              <span>Servicio top</span>
              <strong>{metrics.topService?.name ?? "Sin datos"}</strong>
              <p>
                {metrics.topService
                  ? `${metrics.topService.reservations} reservas · ${formatCurrency(
                      metrics.topService.revenue
                    )}`
                  : "Todavia no hay suficientes datos en el periodo."}
              </p>
            </div>

            <div className={styles.highlightCard}>
              <span>Cancha top</span>
              <strong>{metrics.topCourt?.name ?? "Sin datos"}</strong>
              <p>
                {metrics.topCourt
                  ? `${metrics.topCourt.reservations} reservas · ${formatCurrency(
                      metrics.topCourt.revenue
                    )}`
                  : "Todavia no hay suficientes datos en el periodo."}
              </p>
            </div>
          </div>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Ingresos</p>
                <h2>Rendimiento por servicio</h2>
              </div>
            </div>

            <div className={styles.metricList}>
              {dashboard.revenueByService.length > 0 ? (
                dashboard.revenueByService.map((service) => (
                  <div key={service.serviceId} className={styles.metricRow}>
                    <div className={styles.metricCopy}>
                      <strong>{service.name}</strong>
                      <span>{service.reservations} reservas</span>
                    </div>
                    <div className={styles.metricBarShell}>
                      <div
                        className={styles.metricBar}
                        style={{
                          width: `${
                            maxServiceRevenue > 0
                              ? Math.max((service.revenue / maxServiceRevenue) * 100, 12)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className={styles.metricAmount}>
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                ))
              ) : (
                <p className={styles.subtle}>Aun no hay ingresos registrados en este mes.</p>
              )}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Operacion</p>
                <h2>Rendimiento por cancha</h2>
              </div>
            </div>

            <div className={styles.metricList}>
              {dashboard.revenueByCourt.length > 0 ? (
                dashboard.revenueByCourt.map((court) => (
                  <div key={court.staffId} className={styles.metricRow}>
                    <div className={styles.metricCopy}>
                      <strong>{court.name}</strong>
                      <span>{court.reservations} reservas</span>
                    </div>
                    <div className={styles.metricBarShell}>
                      <div
                        className={styles.metricBarBlue}
                        style={{
                          width: `${
                            maxCourtRevenue > 0
                              ? Math.max((court.revenue / maxCourtRevenue) * 100, 12)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className={styles.metricAmount}>
                      {formatCurrency(court.revenue)}
                    </span>
                  </div>
                ))
              ) : (
                <p className={styles.subtle}>Aun no hay uso suficiente para este periodo.</p>
              )}
            </div>
          </section>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.sideCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Gastos</p>
                <h2>Registrar egreso</h2>
              </div>
            </div>

            {expenseError && <p className={styles.error}>{expenseError}</p>}
            {feedback && <p className={styles.feedback}>{feedback}</p>}

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Titulo</span>
                <input
                  value={expenseForm.title}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Ej. Mantenimiento de luces"
                />
              </label>

              <label className={styles.field}>
                <span>Categoria</span>
                <input
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  placeholder="Infraestructura"
                />
              </label>

              <label className={styles.field}>
                <span>Monto</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="12000"
                />
              </label>

              <label className={styles.field}>
                <span>Fecha</span>
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      expenseDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Notas</span>
                <textarea
                  value={expenseForm.notes}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Detalle opcional del gasto"
                />
              </label>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              disabled={submitting}
              onClick={submitExpense}
            >
              {submitting ? "Guardando..." : "Guardar gasto"}
            </button>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Categorias</p>
                <h2>Distribucion de egresos</h2>
              </div>
            </div>

            <div className={styles.metricList}>
              {dashboard.expenseByCategory.length > 0 ? (
                dashboard.expenseByCategory.map((category) => (
                  <div key={category.category} className={styles.metricRowCompact}>
                    <div className={styles.metricCopy}>
                      <strong>{category.category}</strong>
                      <span>{category.count} gasto/s</span>
                    </div>
                    <div className={styles.metricBarShell}>
                      <div
                        className={styles.metricBarRed}
                        style={{
                          width: `${
                            maxExpenseCategory > 0
                              ? Math.max((category.total / maxExpenseCategory) * 100, 12)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className={styles.metricAmount}>
                      {formatCurrency(category.total)}
                    </span>
                  </div>
                ))
              ) : (
                <p className={styles.subtle}>Todavia no hay gastos registrados en este mes.</p>
              )}
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Ultimos movimientos</p>
                <h2>Gastos recientes</h2>
              </div>
            </div>

            <div className={styles.expenseList}>
              {dashboard.recentExpenses.length > 0 ? (
                dashboard.recentExpenses.map((expense) => (
                  <div key={expense.id} className={styles.expenseCard}>
                    <div>
                      <strong>{expense.title}</strong>
                      <span>
                        {expense.category ?? "General"} · {formatShortDate(expense.expenseDate)}
                      </span>
                    </div>
                    <strong>{formatCurrency(expense.amount)}</strong>
                    {expense.notes && <p>{expense.notes}</p>}
                  </div>
                ))
              ) : (
                <p className={styles.subtle}>Sin gastos cargados en este periodo.</p>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
