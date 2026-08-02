export default function PersonvernPage() {
  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="display text-3xl mb-2 pt-4">Personvernerklæring</h1>
      <p className="text-sm text-[var(--c-muted)] mb-8">Sist oppdatert: juli 2026</p>

      <div className="prose" style={{ lineHeight: 1.7, color: 'var(--c-ink)' }}>

        <h2 className="display text-xl mb-2 mt-6">1. Kven vi er</h2>
        <p className="text-sm mb-4">
          Verten er eit driftsystem for norske Airbnb-vertar. Vi behandlar personopplysningar i samsvar med GDPR og norsk personvernlovgiving.
        </p>

        <h2 className="display text-xl mb-2 mt-6">2. Kva data vi samlar inn</h2>
        <p className="text-sm mb-2">Vi samlar inn følgjande opplysningar:</p>
        <ul className="text-sm mb-4 pl-4" style={{ listStyle: 'disc' }}>
          <li className="mb-1">E-postadresse og passord (kryptert) ved registrering</li>
          <li className="mb-1">Husnamn og adresse du legg inn</li>
          <li className="mb-1">Bookingdata frå Airbnb iCal-synkronisering</li>
          <li className="mb-1">Lager- og økonomidata du registrerer</li>
          <li className="mb-1">Betalingsinformasjon via Stripe (vi lagrar ikkje kortnummer)</li>
        </ul>

        <h2 className="display text-xl mb-2 mt-6">3. Korleis vi brukar data</h2>
        <ul className="text-sm mb-4 pl-4" style={{ listStyle: 'disc' }}>
          <li className="mb-1">For å levere tenesta Verten</li>
          <li className="mb-1">For å handtere abonnement og betaling</li>
          <li className="mb-1">For å sende viktige e-postar om tenesta</li>
          <li className="mb-1">For å feilsøke og forbetra tenesta</li>
        </ul>

        <h2 className="display text-xl mb-2 mt-6">4. Tredjeparts tenester</h2>
        <ul className="text-sm mb-4 pl-4" style={{ listStyle: 'disc' }}>
          <li className="mb-1"><strong>Supabase</strong> — databaselagring (EU)</li>
          <li className="mb-1"><strong>Stripe</strong> — betalingshandtering</li>
          <li className="mb-1"><strong>Vercel</strong> — hosting</li>
          <li className="mb-1"><strong>Airbnb iCal</strong> — kalendersynkronisering</li>
        </ul>

        <h2 className="display text-xl mb-2 mt-6">5. Dine rettar</h2>
        <p className="text-sm mb-4">
          Du har rett til innsyn, retting og sletting av dine data. Ta kontakt på <a href="mailto:hei@verten.no" style={{ color: 'var(--c-accent)' }}>hei@verten.no</a> for å utøve dine rettar.
        </p>

        <h2 className="display text-xl mb-2 mt-6">6. Kontakt</h2>
        <p className="text-sm mb-4">
          Spørsmål om personvern kan rettast til <a href="mailto:hei@verten.no" style={{ color: 'var(--c-accent)' }}>hei@verten.no</a>.
        </p>
      </div>
    </div>
  )
}
