# Solbakken Gardshus — Driftssystem

Production-ready web app for drift av Airbnb-gardshus. Bygd med Next.js 14, React, Tailwind CSS og Supabase.

---

## 🚀 Kom i gang på 10 minutt

### 1. Klon og installer

```bash
git clone <ditt-repo>
cd gardshus-airbnb
npm install
```

### 2. Opprett Supabase-prosjekt

1. Gå til [supabase.com](https://supabase.com) og logg inn
2. Klikk **New project** → Fyll inn namn, passord, region (West EU)
3. Vent til prosjektet er klart (~1 min)

### 3. Køyr database-skjemaet

1. Gå til **SQL Editor** i Supabase Dashboard
2. Lim inn heile innhaldet frå `supabase/migrations/001_initial_schema.sql`
3. Trykk **Run** — dette opprettar alle tabeller, visningar og seed-data

### 4. Konfigurer miljøvariablar

```bash
cp .env.local.example .env.local
```

Fyll inn verdiane frå **Project Settings → API** i Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 5. Start utviklingsserver

```bash
npm run dev
```

Opne [http://localhost:3000](http://localhost:3000) — appen startar på `/dashboard`.

---

## 📁 Prosjektstruktur

```
src/
├── app/
│   ├── layout.tsx          ← Root layout med font og nav
│   ├── globals.css         ← Design tokens og stilar
│   ├── dashboard/page.tsx  ← Oversikt: neste booking, lagerstatus, økonomi
│   ├── calendar/page.tsx   ← Månadskalender + booking-skjema
│   ├── turnover/page.tsx   ← Sjekkliste + skaderapport
│   ├── inventory/page.tsx  ← Lagerstyring med varsel
│   └── economy/page.tsx    ← Økonomi med trend og P&L per booking
├── components/
│   └── ui/
│       └── BottomNav.tsx   ← Mobil-navigasjon
├── lib/
│   └── supabase.ts         ← Alle database-funksjonar
└── types/
    └── database.ts         ← TypeScript-typar for alle tabeller
```

---

## 🗄️ Database-oversikt

| Tabell                  | Formål                              |
|-------------------------|-------------------------------------|
| `bookings`              | Alle bookingar med gjestinfo        |
| `turnover_tasks`        | Mal for turnover-oppgåver           |
| `turnovers`             | Kvar turnover-sesjon                |
| `turnover_task_log`     | Fullførte oppgåver per sesjon       |
| `inventory_items`       | Lagervarer med min/max-nivå         |
| `inventory_transactions`| Endringslogg for lager              |
| `damage_reports`        | Skaderapportar med bilete           |
| `economy_entries`       | Alle inntekter og utgifter          |

**Visningar (Views):**
- `booking_economics` — Berekna felt per booking (netter, bruttoinntekt)
- `monthly_economy` — Månadsvis samanstilling
- `booking_pnl` — Nettoresultat per booking
- `low_stock_items` — Varer under minstebeholdning

---

## 📱 Funksjonar

### Dashboard
- Neste booking med dagar-teller
- Dagens oppgåver (dynamiske basert på data)
- Lagervarslar for varer under minstebeholdning
- Månadsøkonomi (inntekt + netto)

### Kalender
- Månadsvisning med fargekoding: grøn=booka, gul=klargjerast
- Turnover-dag vert automatisk markert dagen før innsjekk
- Bookingskjema med automatisk P&L-kalkulasjon
- Automatisk oppretting av økonomi-poster ved ny booking

### Turnover-sjekkliste
- 9 standard oppgåver med estimert tid
- Live fremdriftsbar og tidsteller
- Lagrar til Supabase ved "Start sesjon"
- Skaderapport-modal med biletelasting

### Lager
- Visuell statusbar per vare (grøn/gul/raud)
- Kritisk-varsel øvst
- Rask oppdatering med forhåndsinnstilte tal
- Transaksjonslogg for historikk

### Økonomi
- Månadsvis netto med trend-diagram
- Inntekts- og utgiftslogg
- P&L per booking
- Støttar alle kategoriar: straum, forsikring, vedlikehald, forbruksvarer

---

## 🔒 Sikring (produksjon)

Legg til Row Level Security når du aktiverer Supabase Auth:

```sql
-- Køyr etter å ha laga brukar via Supabase Dashboard → Authentication
CREATE POLICY owner_all ON bookings
  FOR ALL USING (auth.uid() = 'din-brukar-uuid');
-- Gjenta for alle tabeller
```

---

## 🌐 Distribusjon til Vercel

```bash
npm install -g vercel
vercel deploy
# Legg inn miljøvariablar i Vercel Dashboard → Settings → Environment Variables
```

---

## 📷 Biletlagring (Supabase Storage)

Opprett bucket for skadebilete:

1. Supabase Dashboard → **Storage** → **New bucket**
2. Namn: `damage-images`
3. Public: **ja** (for enkel deling)

---

## Tips for iPhone-bruk

Legg til på heimeskjermen for app-oppleving:
1. Opne i Safari
2. Del-knapp → **Legg til på heimeskjerm**
3. Appen køyrer fullskjerm utan nettlesar-UI

---

*Bygd for norske Airbnb-eigarar 🇳🇴*
