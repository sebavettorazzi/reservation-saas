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
            <Link href="/api/businesses" className={styles.primaryLink}>
              View catalog API
            </Link>
          </div>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <p className={styles.eyebrow}>Production-minded reservation stack</p>
            <h1 className={styles.headline}>Bookings that feel premium from day one.</h1>
            <p className={styles.subcopy}>
              Base multi-tenant para peluquerías, barberías, estética, deporte y
              consultorios. Frontend dark mode, availability engine custom y arquitectura
              preparada para evolucionar sin sobrecarga innecesaria.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/booking" className={styles.primaryLink}>
                Probar booking
              </Link>
              <Link href="/api/availability" className={styles.ghostLink}>
                API availability
              </Link>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statCard}>
                <strong>Multi-tenant</strong>
                <span>Negocios, servicios, staff y clientes separados por tenant.</span>
              </div>
              <div className={styles.statCard}>
                <strong>Custom engine</strong>
                <span>Slots reales, staff recomendado y prevención de conflictos.</span>
              </div>
              <div className={styles.statCard}>
                <strong>App Router</strong>
                <span>Frontend y API routes alineados con la estructura actual.</span>
              </div>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <p className={styles.panelLabel}>Now shipping</p>
            <div className={styles.panelCard}>
              <p className={styles.panelLabel}>Booking flow</p>
              <h2>Negocio, servicio, fecha, slot y confirmación conectados</h2>
              <p>
                La base pública ya no depende de IDs hardcodeados del seed y queda lista
                para sumar auth de clientes sin rehacer pantallas.
              </p>
            </div>

            <ul className={styles.panelList}>
              <li>Catálogo público de negocios y servicios</li>
              <li>Reserva validada contra disponibilidad real</li>
              <li>UI dark mode con CSS Modules por página</li>
            </ul>
          </aside>
        </section>

        <section className={styles.features}>
          <article className={styles.featureCard}>
            <p className={styles.panelLabel}>Frontend</p>
            <h3>Experiencia clara</h3>
            <p>
              Interfaz compacta, moderna y preparada para móvil, con foco en legibilidad,
              velocidad y una sensación más premium que un CRUD genérico.
            </p>
          </article>

          <article className={styles.featureCard}>
            <p className={styles.panelLabel}>Backend</p>
            <h3>Validación sin duplicación</h3>
            <p>
              El endpoint de creación reutiliza el availability engine para comprobar que
              el slot sigue vivo antes de confirmar la cita.
            </p>
          </article>

          <article className={styles.featureCard}>
            <p className={styles.panelLabel}>Next step</p>
            <h3>Customer auth real</h3>
            <p>
              El siguiente bloque lógico es añadir autenticación de clientes y proteger
              el system hub privado para administración y testing interno.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
