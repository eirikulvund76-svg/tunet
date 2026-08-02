export default function VilkaarPage() {
  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="display text-3xl mb-2 pt-4">Brukarvilkår</h1>
      <p className="text-sm text-[var(--c-muted)] mb-8">Sist oppdatert: juli 2026</p>

      <div style={{ lineHeight: 1.7, color: 'var(--c-ink)' }}>

        <h2 className="display text-xl mb-2 mt-6">1. Om tenesta</h2>
        <p className="text-sm mb-4">
          Verten er eit driftsystem for Airbnb-vertar. Tenesta er tilgjengeleg via abonnement med 30 dagars gratis prøveperiode.
        </p>

        <h2 className="display text-xl mb-2 mt-6">2. Abonnement og betaling</h2>
        <ul className="text-sm mb-4 pl-4" style={{ listStyle: 'disc' }}>
          <li className="mb-1">Prøveperioden er 30 dagar og krev ikkje kredittkort</li>
          <li className="mb-1">Etter prøveperioden belastast 99 kr/mnd</li>
          <li className="mb-1">Du kan avbestille når som helst</li>
          <li className="mb-1">Betaling handterast av Stripe</li>
        </ul>

        <h2 className="display text-xl mb-2 mt-6">3. Bruk av tenesta</h2>
        <p className="text-sm mb-4">
          Tenesta er berre for lovleg bruk. Du er ansvarleg for data du legg inn. Vi er ikkje ansvarleg for feil i kalendersynkronisering eller tap av data.
        </p>

        <h2 className="display text-xl mb-2 mt-6">4. Oppseiing</h2>
        <p className="text-sm mb-4">
          Du kan seie opp abonnementet når som helst. Tilgangen vert oppretthalden til slutten av betalingsperioden.
        </p>

        <h2 className="display text-xl mb-2 mt-6">5. Kontakt</h2>
        <p className="text-sm mb-4">
          <a href="mailto:hei@verten.no" style={{ color: 'var(--c-accent)' }}>hei@verten.no</a>
        </p>
      </div>
    </div>
  )
}
