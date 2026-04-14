import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav}>
          <div className={styles.brand}>
            <span className={styles.brandMark} />
            <div className={styles.brandText}>
              <strong>Reservation Cloud</strong>
              <span>Multi-tenant booking SaaS</span>
            </div>
          </div>

          <div className={styles.navActions}>
            <Link href="/booking" className={styles.ghostLink}>
              Open booking flow
            </Link>
            <Link href="/business/2-de-abril" className={styles.primaryLink}>
              Demo 2 de Abril
            </Link>
          </div>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <p className={styles.eyebrow}>Production-minded reservation stack</p>
            <h1 className={styles.headline}>Bookings that feel premium from day one.</h1>
            <p className={styles.subcopy}>
              Base multi-tenant para peluquerias, barberias, estetica, deporte y
              consultorios. Frontend dark mode, availability engine custom y arquitectura
              preparada para evolucionar sin sobrecarga innecesaria.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/booking" className={styles.primaryLink}>
                Probar booking
              </Link>
              <Link href="/business/2-de-abril" className={styles.ghostLink}>
                Ver demo deportiva
              </Link>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statCard}>
                <strong>Multi-tenant</strong>
                <span>Negocios, servicios, staff y clientes separados por tenant.</span>
              </div>
              <div className={styles.statCard}>
                <strong>Custom engine</strong>
                <span>Slots reales, staff recomendado y prevencion de conflictos.</span>
              </div>
              <div className={styles.statCard}>
                <strong>Templates</strong>
                <span>Salon premium y complejo deportivo sobre la misma codebase.</span>
              </div>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <p className={styles.panelLabel}>Now shipping</p>
            <div className={styles.panelCard}>
              <p className={styles.panelLabel}>Sports tenant</p>
              <h2>2 de Abril ya tiene pagina publica y panel interno</h2>
              <p>
                El tenant deportivo usa la misma arquitectura del SaaS, con branding
                propio, reservas de canchas y vista operativa para el complejo.
              </p>
            </div>

            <ul className={styles.panelList}>
              <li>Catalogo multi-tenant con slug, plan y branding base</li>
              <li>Booking publico por negocio sin pasar por el sistema madre</li>
              <li>Panel interno y premium fuera de la navegacion publica</li>
            </ul>
          </aside>
        </section>

        <section className={styles.features}>
          <article className={styles.featureCard}>
            <p className={styles.panelLabel}>Frontend</p>
            <h3>Experiencia por rubro</h3>
            <p>
              La barberia mantiene un look premium y 2 de Abril ya tiene una interfaz
              deportiva propia, sin duplicar proyecto ni romper la arquitectura central.
            </p>
          </article>

          <article className={styles.featureCard}>
            <p className={styles.panelLabel}>Backend</p>
            <h3>Planes listos para crecer</h3>
            <p>
              Cada negocio ya soporta `BASE` o `PREMIUM`, una buena base para que el
              system hub active recordatorios y automatizaciones mas adelante.
            </p>
          </article>

          <article className={styles.featureCard}>
            <p className={styles.panelLabel}>Next step</p>
            <h3>System hub privado</h3>
            <p>
              El siguiente bloque logico es tu panel madre para ver tenants, cambiar plan,
              activar premium y gestionar accesos internos por negocio.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
