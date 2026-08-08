export default function KontaktPage() {
  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h1 className="display text-3xl mb-2 pt-4">Kontakt oss</h1>
      <p className="text-sm text-[var(--c-muted)] mb-8">
        Vi svarar vanlegvis innan éin arbeidsdag.
      </p>

      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-1">
          <span style={{ fontSize: '24px' }}>✉️</span>
          <div>
            <div className="font-medium text-sm">E-post</div>
            <a href="mailto:hei@verten.no" style={{ color: 'var(--c-accent)', fontSize: '14px' }}>
              hei@verten.no
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="text-sm font-medium mb-1">Treng du hjelp raskt?</p>
        <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
          Send oss ein e-post med ei skildring av problemet, kva side det gjeld og evt. skjermbilete. Så hjelper vi deg så snart vi kan.
        </p>
      </div>
    </div>
  )
}
