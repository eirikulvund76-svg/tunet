export default function CookiesPage() {
  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="display text-3xl mb-2 pt-4">Cookie-policy</h1>
      <p className="text-sm text-[var(--c-muted)] mb-8">Sist oppdatert: juli 2026</p>

      <div style={{ lineHeight: 1.7, color: 'var(--c-ink)' }}>
        <h2 className="display text-xl mb-2 mt-6">Kva er cookies?</h2>
        <p className="text-sm mb-4">
          Cookies er små tekstfiler som lagrast i nettlesaren din når du brukar Verten.
        </p>

        <h2 className="display text-xl mb-2 mt-6">Kva cookies brukar vi?</h2>
        <ul className="text-sm mb-4 pl-4" style={{ listStyle: 'disc' }}>
          <li className="mb-1"><strong>Innloggings-cookie</strong> — nødvendig for å halde deg innlogga (Supabase)</li>
          <li className="mb-1"><strong>Stripe-cookies</strong> — nødvendig for betalingshandtering</li>
        </ul>

        <p className="text-sm mb-4">
          Vi brukar ikkje marknadsføringscookies eller sporings-cookies frå tredjepartar.
        </p>

        <h2 className="display text-xl mb-2 mt-6">Kontakt</h2>
        <p className="text-sm">
          Spørsmål? Send e-post til <a href="mailto:hei@verten.no" style={{ color: 'var(--c-accent)' }}>hei@verten.no</a>
        </p>
      </div>
    </div>
  )
}
