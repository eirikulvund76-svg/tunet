'use client'
// src/app/inventory/page.tsx
import { useState, useEffect } from 'react'
import { getInventory, updateInventoryQty } from '@/lib/supabase'
import type { InventoryItem } from '@/types/database'

function stockLevel(item: InventoryItem): 'ok' | 'low' | 'crit' {
  if (item.current_qty <= item.min_qty) return 'crit'
  if (item.current_qty <= item.min_qty * 1.5) return 'low'
  return 'ok'
}

const CATEGORY_LABELS: Record<string, string> = {
  consumable: 'Forbruksvarer',
  cleaning:   'Reingjering',
  textile:    'Tekstilar',
  equipment:  'Utstyr'
}

export default function InventoryPage() {
  const [items, setItems]       = useState<InventoryItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [newQty, setNewQty]     = useState(0)
  const [saving, setSaving]     = useState(false)

  const load = () => getInventory().then(i => { setItems(i); setLoading(false) })
  useEffect(() => { load() }, [])

  function openEdit(item: InventoryItem) {
    setSelected(item)
    setNewQty(item.current_qty)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    await updateInventoryQty(selected.id, newQty, 'Manuell oppdatering')
    setSaving(false)
    setSelected(null)
    load()
  }

  const lowItems   = items.filter(i => stockLevel(i) !== 'ok')
  const categories = [...new Set(items.map(i => i.category))]

  if (loading) return <div className="p-4"><div className="card animate-pulse h-60" /></div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 pt-2">
        <h1 className="display text-3xl">Lager</h1>
        <button onClick={() => setSelected({ id:'', name:'', category:'consumable', unit:'stk', current_qty:0, min_qty:3, max_qty:20, notes:null, updated_at:'' })}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--c-border)] text-xl">+</button>
      </div>

      {lowItems.length > 0 && (
        <div className="card mb-3" style={{ background: 'var(--c-red-lt)', borderColor: 'var(--c-red)' }}>
          <div className="text-sm font-medium text-[var(--c-red)] mb-1.5">
            ⚠ {lowItems.length} vare{lowItems.length > 1 ? 'r' : ''} under minstebeholdning
          </div>
          <div className="text-xs text-[var(--c-red)]">
            {lowItems.map(i => `${i.name} (${i.current_qty} ${i.unit})`).join(' · ')}
          </div>
        </div>
      )}

      {categories.map(cat => {
        const catItems = items.filter(i => i.category === cat)
        return (
          <div key={cat}>
            <p className="section-lbl">{CATEGORY_LABELS[cat] ?? cat}</p>
            <div className="card mb-2">
              {catItems.map((item, i) => {
                const level = stockLevel(item)
                const pct   = Math.min(100, Math.round(item.current_qty / item.max_qty * 100))
                return (
                  <div key={item.id}
                    className={`flex items-center gap-3 py-2.5 cursor-pointer
                      ${i < catItems.length - 1 ? 'border-b border-[var(--c-border)]' : ''}`}
                    onClick={() => openEdit(item)}
                  >
                    <div className="w-28 text-sm flex-shrink-0">{item.name}</div>
                    <div className="inv-bar flex-1">
                      <div className={`inv-bar-fill inv-${level}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={`w-16 text-right text-sm font-medium flex-shrink-0
                      ${level==='crit'?'text-[var(--c-red)]':level==='low'?'text-[var(--c-amber)]':'text-[var(--c-text)]'}`}>
                      {item.current_qty} {item.unit}
                    </div>
                    {level !== 'ok' && (
                      <span className={`badge ${level==='crit'?'badge-red':'badge-amber'}`}>
                        {level==='crit'?'Kritisk':'Låg'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Edit modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setSelected(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">
              {selected.id ? `Oppdater: ${selected.name}` : 'Ny vare'}
            </h2>

            {selected.id && (
              <div className="card mb-4" style={{ background: 'var(--c-bg)' }}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--c-muted)]">Minstebeholdning</span>
                  <span>{selected.min_qty} {selected.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--c-muted)]">Maksimum</span>
                  <span>{selected.max_qty} {selected.unit}</span>
                </div>
              </div>
            )}

            <label className="block mb-4">
              <span className="field-label">Antal {selected.unit}</span>
              <input type="number" className="field-input text-xl" min={0} max={selected.max_qty || 100}
                value={newQty} onChange={e => setNewQty(+e.target.value)} />
            </label>

            <div className="flex gap-2 mb-2">
              {[5, 10, 20].map(n => (
                <button key={n} onClick={() => setNewQty(n)} className="btn btn-secondary flex-1 py-2 text-sm">
                  Sett {n}
                </button>
              ))}
            </div>

            <button className="btn btn-primary mb-2 mt-2" onClick={handleSave} disabled={saving}>
              {saving ? 'Lagrar...' : 'Lagre'}
            </button>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}
