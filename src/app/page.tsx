import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D5A27; --green-lt: #EEF3ED; --green-mid: #4a7c43;
          --cream: #FAF8F4; --ink: #1A1A18; --muted: #6B6B65; --border: #E2DED6;
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: var(--cream); color: var(--ink); }
        .logo { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--green); letter-spacing: -0.5px; }
        nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; background: rgba(250,248,244,0.95);
          backdrop-filter: blur(8px); border-bottom: 1px solid var(--border);
        }
        .nav-links { display: flex; align-items: center; gap: 20px; }
        .nav-link { font-size: 13px; color: var(--muted); text-decoration: none; }
        .nav-cta {
          background: var(--green); color: #fff; border: none; border-radius: 10px;
          padding: 10px 22px; font-size: 14px; font-weight: 600; text-decoration: none;
          transition: background 0.15s;
        }
        .nav-cta:hover { background: var(--green-mid); }
        .hero { padding: 72px 24px 56px; max-width: 600px; margin: 0 auto; text-align: center; }
        .eyebrow {
          display: inline-block; font-size: 11px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase; color: var(--green);
          background: var(--green-lt); padding: 6px 14px; border-radius: 100px; margin-bottom: 24px;
        }
        h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 8vw, 56px); line-height: 1.1;
          letter-spacing: -1px; margin-bottom: 18px;
        }
        h1 em { color: var(--green); font-style: normal; }
        .hero-sub { font-size: 17px; line-height: 1.6; color: var(--muted); margin-bottom: 36px; max-width: 480px; margin-left: auto; margin-right: auto; }
        .btn-primary {
          display: inline-block; background: var(--green); color: #fff;
          border-radius: 12px; padding: 16px 36px; font-size: 16px; font-weight: 600;
          text-decoration: none; transition: background 0.15s, transform 0.1s;
        }
        .btn-primary:hover { background: var(--green-mid); transform: translateY(-1px); }
        .hero-note { font-size: 12px; color: var(--muted); margin-top: 12px; }
        .mockup {
          max-width: 340px; margin: 48px auto 0;
          background: #fff; border-radius: 20px;
          border: 1px solid var(--border); box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .mockup-bar { background: var(--green); padding: 16px 20px; color: #fff; }
        .mockup-bar-title { font-family: 'Playfair Display', serif; font-size: 18px; }
        .mockup-bar-sub { font-size: 11px; opacity: 0.7; margin-top: 2px; }
        .mockup-body { padding: 14px; }
        .mockup-card { background: var(--cream); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; border: 1px solid var(--border); }
        .mockup-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 4px; }
        .mockup-val { font-size: 20px; font-weight: 700; color: var(--green); }
        .mockup-sub { font-size: 11px; color: var(--muted); }
        .mockup-booking { background: var(--green-lt); border-radius: 8px; padding: 10px; border-left: 3px solid var(--green); }
        .mockup-booking-name { font-weight: 600; font-size: 13px; }
        .mockup-booking-date { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .mockup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .features { padding: 64px 24px; max-width: 600px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--green); margin-bottom: 10px; }
        h2 { font-family: 'Playfair Display', serif; font-size: clamp(26px, 5vw, 36px); line-height: 1.2; margin-bottom: 36px; }
        .feature-list { display: flex; flex-direction: column; gap: 16px; }
        .feature { display: flex; gap: 16px; align-items: flex-start; padding: 20px; background: #fff; border-radius: 16px; border: 1px solid var(--border); }
        .feature-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--green-lt); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .feature-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
        .feature-desc { font-size: 13px; color: var(--muted); line-height: 1.5; }
        .pricing { padding: 64px 24px; max-width: 400px; margin: 0 auto; text-align: center; }
        .pricing-sub { color: var(--muted); font-size: 15px; margin-bottom: 32px; }
        .price-card { background: #fff; border: 2px solid var(--green); border-radius: 20px; padding: 32px 24px; }
        .price-tag { font-family: 'Playfair Display', serif; font-size: 52px; color: var(--green); line-height: 1; }
        .price-tag span { font-size: 20px; vertical-align: super; }
        .price-tag small { font-family: 'Inter', sans-serif; font-size: 16px; color: var(--muted); }
        .price-trial { font-size: 13px; color: var(--muted); margin: 8px 0 24px; }
        .price-features { text-align: left; margin-bottom: 28px; }
        .price-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; padding: 8px 0; border-bottom: 1px solid var(--border); }
        .price-feature:last-child { border-bottom: none; }
        .check { color: var(--green); }
        footer { padding: 40px 24px 32px; border-top: 1px solid var(--border); }
        .footer-inner { max-width: 600px; margin: 0 auto; }
        .footer-links { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
        .footer-link { font-size: 13px; color: var(--muted); text-decoration: none; }
        .footer-link:hover { color: var(--green); }
        .footer-copy { font-size: 12px; color: var(--muted); }
      `}</style>

      <nav>
        <div className="logo">Verten</div>
        <div className="nav-links">
          <Link href="#pris" className="nav-link">Pris</Link>
          <Link href="/kontakt" className="nav-link">Kontakt</Link>
          <Link href="/login" className="nav-cta">Kom i gang</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">For norske Airbnb-vertar</div>
        <h1>Drift huset ditt <em>utan</em> rotet</h1>
        <p className="hero-sub">Verten samlar kalender, turnover, lager og økonomi på éin stad — synkronisert automatisk med Airbnb.</p>
        <Link href="/login" className="btn-primary">Start 30 dagar gratis</Link>
        <p className="hero-note">Ingen kredittkort nødvendig · Ingen binding</p>

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
            { icon: '📅', title: 'Kalender synkronisert med Airbnb', desc: 'Bookingane kjem automatisk inn frå Airbnb kvar natt. Legg til eigne eller kanseller med eit trykk.' },
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

      <section className="pricing" id="pris">
        <div className="section-label">Pris</div>
        <h2>Enkelt og føreseieleg</h2>
        <p className="pricing-sub">Prøv gratis i 30 dagar. Ingen binding.</p>
        <div className="price-card">
          <div className="price-tag"><span>kr</span> 99 <small>/mnd</small></div>
          <div className="price-trial">30 dagar gratis — ingen kredittkort</div>
          <div className="price-features">
            {['Airbnb kalender-sync','Automatisk nattleg oppdatering','Turnover-sjekkliste','Lager og varslar','Økonomioversikt','Ubegrensa bookingar'].map(f => (
              <div key={f} className="price-feature"><span className="check">✓</span> {f}</div>
            ))}
          </div>
          <Link href="/login" className="btn-primary" style={{display:'block',textAlign:'center'}}>
            Start gratis i dag
          </Link>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-links">
            <Link href="/personvern" className="footer-link">Personvern</Link>
            <Link href="/vilkaar" className="footer-link">Brukarvilkår</Link>
            <Link href="/cookies" className="footer-link">Cookies</Link>
            <Link href="/kontakt" className="footer-link">Kontakt</Link>
            <Link href="/login" className="footer-link">Logg inn</Link>
          </div>
          <p className="footer-copy">© 2026 Verten · Laga for norske Airbnb-vertar</p>
        </div>
      </footer>
    </>
  )
}
