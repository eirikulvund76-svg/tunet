import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D5A27; --green-lt: #EEF3ED; --green-mid: #4a7c43;
          --cream: #FAF8F4; --ink: #1A1A18; --muted: #6B6B65; --border: #E2DED6;
        }
        body { font-family: 'Inter', sans-serif; background: var(--cream); color: var(--ink); }
        .logo { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--green); }
        nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; background: rgba(250,248,244,0.92);
          backdrop-filter: blur(8px); border-bottom: 1px solid var(--border);
        }
        .nav-cta {
          background: var(--green); color: #fff; border: none; border-radius: 8px;
          padding: 10px 20px; font-size: 14px; font-weight: 600; text-decoration: none;
        }
        .hero { padding: 72px 24px 48px; max-width: 640px; margin: 0 auto; text-align: center; }
        .eyebrow {
          display: inline-block; font-size: 12px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase; color: var(--green);
          background: var(--green-lt); padding: 6px 14px; border-radius: 100px; margin-bottom: 24px;
        }
        h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(34px, 8vw, 54px); line-height: 1.1;
          letter-spacing: -1px; margin-bottom: 18px;
        }
        h1 em { color: var(--green); font-style: normal; }
        .hero-sub { font-size: 16px; line-height: 1.6; color: var(--muted); margin-bottom: 32px; }
        .btn-primary {
          display: block; background: var(--green); color: #fff;
          border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 600;
          text-decoration: none; text-align: center; max-width: 320px; margin: 0 auto;
        }
        .hero-note { font-size: 12px; color: var(--muted); margin-top: 10px; }
        .mockup {
          max-width: 340px; margin: 40px auto 0;
          background: #fff; border-radius: 20px;
          border: 1px solid var(--border); box-shadow: 0 16px 48px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .mockup-bar { background: var(--green); padding: 14px 18px; color: #fff; }
        .mockup-bar-title { font-family: 'Playfair Display', serif; font-size: 18px; }
        .mockup-bar-sub { font-size: 11px; opacity: 0.7; }
        .mockup-body { padding: 14px; }
        .mockup-card {
          background: var(--cream); border-radius: 10px;
          padding: 12px 14px; margin-bottom: 10px; border: 1px solid var(--border);
        }
        .mockup-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 4px; }
        .mockup-val { font-size: 20px; font-weight: 700; color: var(--green); }
        .mockup-sub { font-size: 11px; color: var(--muted); }
        .mockup-booking { background: var(--green-lt); border-radius: 8px; padding: 10px; border-left: 3px solid var(--green); }
        .mockup-booking-name { font-weight: 600; font-size: 13px; }
        .mockup-booking-date { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .mockup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .features { padding: 56px 24px; max-width: 640px; margin: 0 auto; }
        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--green); margin-bottom: 10px;
        }
        h2 { font-family: 'Playfair Display', serif; font-size: clamp(24px, 5vw, 34px); line-height: 1.2; margin-bottom: 32px; }
        .feature-list { display: flex; flex-direction: column; gap: 16px; }
        .feature {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 18px; background: #fff; border-radius: 14px; border: 1px solid var(--border);
        }
        .feature-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--green-lt); display: flex; align-items: center;
          justify-content: center; font-size: 18px; flex-shrink: 0;
        }
        .feature-title { font-weight: 600; font-size: 14px; margin-bottom: 3px; }
        .feature-desc { font-size: 13px; color: var(--muted); line-height: 1.5; }
        .pricing { padding: 56px 24px; max-width: 380px; margin: 0 auto; text-align: center; }
        .pricing-sub { color: var(--muted); font-size: 14px; margin-bottom: 28px; }
        .price-card { background: #fff; border: 2px solid var(--green); border-radius: 18px; padding: 28px 22px; }
        .price-tag { font-family: 'Playfair Display', serif; font-size: 48px; color: var(--green); line-height: 1; }
        .price-tag span { font-size: 18px; vertical-align: super; }
        .price-tag small { font-family: 'Inter', sans-serif; font-size: 15px; color: var(--muted); }
        .price-trial { font-size: 12px; color: var(--muted); margin: 8px 0 22px; }
        .price-features { text-align: left; margin-bottom: 24px; }
        .price-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 7px 0; border-bottom: 1px solid var(--border); }
        .price-feature:last-child { border-bottom: none; }
        .check { color: var(--green); }
        footer { padding: 28px 24px; text-align: center; border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; }
        footer a { color: var(--green); text-decoration: none; }
      `}</style>

      <nav>
        <div className="logo">Verten</div>
        <Link href="/login" className="nav-cta">Start gratis</Link>
      </nav>

      <section className="hero">
        <div className="eyebrow">For norske Airbnb-vertar</div>
        <h1>Drift huset ditt <em>utan</em> rotet</h1>
        <p className="hero-sub">Verten samlar kalender, turnover, lager og økonomi på éin stad — synkronisert direkte med Airbnb.</p>
        <Link href="/login" className="btn-primary">Start 30 dagar gratis</Link>
        <p className="hero-note">Ingen kredittkort nødvendig</p>

        <div className="mockup">
          <div className="mockup-bar">
            <div className="mockup-bar-title">Solbakken</div>
            <div className="mockup-bar-sub">Gardshus · Voss</div>
          </div>
          <div className="mockup-body">
            <div className="mockup-card">
              <div className="mockup-label">Neste booking</div>
              <div className="mockup-booking">
                <div className="mockup-booking-name">Familie Hansen</div>
                <div className="mockup-booking-date">12. – 16. august · 4 netter</div>
              </div>
            </div>
            <div className="mockup-grid">
              <div className="mockup-card" style={{marginBottom:0}}>
                <div className="mockup-label">Inntekt</div>
                <div className="mockup-val">18 400</div>
                <div className="mockup-sub">kr denne mnd</div>
              </div>
              <div className="mockup-card" style={{marginBottom:0}}>
                <div className="mockup-label">Netto</div>
                <div className="mockup-val">16 200</div>
                <div className="mockup-sub">kr</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-label">Kva du får</div>
        <h2>Alt du treng, ingenting du ikkje treng</h2>
        <div className="feature-list">
          {[
            { icon: '📅', title: 'Kalender synkronisert med Airbnb', desc: 'Bookingane kjem automatisk inn frå Airbnb. Legg til eigne eller kanseller med eit trykk.' },
            { icon: '✅', title: 'Turnover-sjekkliste', desc: 'Gå gjennom reingjering og klargjering steg for steg. Tilpass oppgåvene til ditt hus.' },
            { icon: '📦', title: 'Lagervarslar', desc: 'Få varsel når forbruksvarer er i ferd med å gå tomt — aldri meir tomme senger.' },
            { icon: '💰', title: 'Økonomi på éin stad', desc: 'Sjå inntekter frå kvar booking og registrer utgifter. Alltid oversikt over kva du tener.' },
          ].map(f => (
            <div key={f.title} className="feature">
              <div className="feature-icon">{f.icon}</div>
              <div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing">
        <div className="section-label">Pris</div>
        <h2>Enkelt og føreseieleg</h2>
        <p className="pricing-sub">Prøv gratis i 30 dagar. Ingen binding.</p>
        <div className="price-card">
          <div className="price-tag"><span>kr</span> 99 <small>/mnd</small></div>
          <div className="price-trial">30 dagar gratis — ingen kredittkort</div>
          <div className="price-features">
            {['Airbnb kalender-sync','Turnover-sjekkliste','Lager og varslar','Økonomioversikt','Ubegrensa bookingar'].map(f => (
              <div key={f} className="price-feature"><span className="check">✓</span> {f}</div>
            ))}
          </div>
          <Link href="/login" className="btn-primary">Start gratis i dag</Link>
        </div>
      </section>

      <footer>
        <p style={{marginBottom:6}}>© 2026 Verten · Laga for norske Airbnb-vertar</p>
        <p><Link href="/login" style={{color:'var(--green)'}}>Logg inn</Link></p>
      </footer>
    </>
  )
}
