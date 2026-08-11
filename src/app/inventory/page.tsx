'use client'
import { useState, useEffect } from 'react'
import { getInventory, updateInventoryQty, supabase } from '@/lib/supabase'
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

const CATEGORY_ORDER = ['consumable', 'cleaning', 'textile', 'equipment']

export default function InventoryPage() {
  const [items, setItems]       = useState<InventoryItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [newQty, setNewQty]     = useState(0)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [showNewItem, setShowNewItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: 'consumable', unit: 'stk', current_qty: 0, min_qty: 3, max_qty: 20 })

  const load = () => getInventory().then(i => { setItems(i); setLoading(false) })
  useEffect(() => { load() }, [])

  function openEdit(item: InventoryItem) {
    setSelected(item)
    setNewQty(item.current_qty)
    setError('')
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      await updateInventoryQty(selected.id, newQty, 'Manuell oppdatering')
      setSelected(null)
      load()
    } catch {
      setError('Noko gjekk gale. Prøv igjen.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddItem() {
    if (!newItem.name) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await supabase.from('inventory_items').insert({
        ...newItem,
        user_id: session.user.id,
        notes: null
      })
      setShowNewItem(false)
      setNewItem({ name: '', category: 'consumable', unit: 'stk', current_qty: 0, min_qty: 3, max_qty: 20 })
      load()
    } catch {
      setError('Kunne ikkje leggje til vare. Prøv igjen.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Slett denne vara?')) return
    await supabase.from('inventory_items').delete().eq('id', id)
    setSelected(null)
    load()
  }

  const lowItems   = items.filter(i => stockLevel(i) !== 'ok')
  const categories = CATEGORY_ORDER.filter(c => items.some(i => i.category === c))

  if (loading) return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 pt-2">
        <h1 className="display text-3xl">Lager</h1>
      </div>
      {[1,2,3].map(i => <div key={i} className="card animate-pulse h-32 mb-3" />)}
    </div>
  )

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-4 pt-2">
        <h1 className="display text-3xl">Lager</h1>
        <button
          onClick={() => setShowNewItem(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--c-border)] text-xl"
        >+</button>
      </div>

      {lowItems.length > 0 && (
        <div className="card mb-4" style={{ background: 'var(--c-amber-lt)', borderColor: 'var(--c-amber)' }}>
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--c-amber)' }}>
            ⚠ {lowItems.length} vare{lowItems.length > 1 ? 'r' : ''} treng påfyll
          </div>
          {lowItems.map(i => (
            <div key={i.id}
              className="flex justify-between items-center py-1.5 border-b border-[var(--c-border)] last:border-0 cursor-pointer"
              onClick={() => openEdit(i)}
            >
              <span className="text-sm" style={{ color: 'var(--c-amber)' }}>{i.name}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--c-amber)' }}>
                {i.current_qty} / {i.min_qty} {i.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-sm mb-2" style={{ color: 'var(--c-muted)' }}>Ingen lagervarer enno</p>
          <button className="btn btn-primary mt-2" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setShowNewItem(true)}>
            Legg til første vare
          </button>
        </div>
      )}

      {categories.map(cat => {
        const catItems = items.filter(i => i.category === cat)
        return (
          <div key={cat}>
            <p className="section-lbl">{CATEGORY_LABELS[cat] ?? cat}</p>
            <div className="card mb-3">
              {catItems.map((item, i) => {
                const level = stockLevel(item)
                const pct   = Math.min(100, Math.round(item.current_qty / Math.max(item.max_qty, 1) * 100))
                return (
                  <div key={item.id}
                    className={`flex items-center gap-3 py-2.5 cursor-pointer active:opacity-70
                      ${i < catItems.length - 1 ? 'border-b border-[var(--c-border)]' : ''}`}
                    onClick={() => openEdit(item)}
                  >
                    <div className="w-28 text-sm flex-shrink-0">{item.name}</div>
                    <div className="inv-bar flex-1">
                      <div className={`inv-bar-fill inv-${level}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={`w-16 text-right text-sm font-medium flex-shrink-0
                      ${level==='crit'?'text-[var(--c-red)]':level==='low'?'text-[var(--c-amber)]':''}`}>
                      {item.current_qty} {item.unit}
                    </div>
                    {level !== 'ok' && (
                      <span className={`badge ${level==='crit'?'badge-red':'badge-amber'}`}>
                        {level==='crit'?'Tomt':'Låg'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Rediger vare modal */}
      {selected && selected.id && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setSelected(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-1">{selected.name}</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--c-muted)' }}>
              Min: {selected.min_qty} · Maks: {selected.max_qty} {selected.unit}
            </p>

            {error && (
              <div className="mb-3 p-3 rounded-lg text-sm" style={{ background: 'var(--c-red-lt)', color: 'var(--c-red)' }}>
                {error}
              </div>
            )}

            <label className="block mb-3">
              <span className="field-label">Antal {selected.unit}</span>
              <input type="number" className="field-input text-xl" min={0} max={selected.max_qty || 100}
                value={newQty} onChange={e => setNewQty(+e.target.value)} />
            </label>

            <div className="flex gap-2 mb-4">
              {[selected.min_qty, Math.round(selected.max_qty / 2), selected.max_qty].map(n => (
                <button key={n} onClick={() => setNewQty(n)} className="btn btn-secondary flex-1 py-2 text-sm">
                  {n}
                </button>
              ))}
            </div>

            <button className="btn btn-primary mb-2" onClick={handleSave} disabled={saving}>
              {saving ? 'Lagrar...' : 'Lagre'}
            </button>
            <button className="btn btn-secondary mb-2" onClick={() => setSelected(null)}>Avbryt</button>
            <button
              className="w-full py-2.5 rounded-xl text-sm font-medium mt-1"
              style={{ color: 'var(--c-red)', border: '1px solid var(--c-red)', background: 'transparent' }}
              onClick={() => handleDelete(selected.id)}
            >
              Slett vare
            </button>
          </div>
        </div>
      )}

      {/* Ny vare modal */}
      {showNewItem && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowNewItem(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="display text-xl mb-4">Ny lagervare</h2>

            <label className="block mb-3">
              <span className="field-label">Namn</span>
              <input type="text" className="field-input" value={newItem.name}
                onChange={e => setNewItem(p => ({...p, name: e.target.value}))}
                placeholder="T.d. Toalettpapir" autoFocus />
            </label>

            <label className="block mb-3">
              <span className="field-label">Kategori</span>
              <select className="field-input" value={newItem.category}
                onChange={e => setNewItem(p => ({...p, category: e.target.value}))}>
                <option value="consumable">Forbruksvarer</option>
                <option value="cleaning">Reingjering</option>
                <option value="textile">Tekstilar</option>
                <option value="equipment">Utstyr</option>
              </select>
            </label>

            <label className="block mb-3">
              <span className="field-label">Eining</span>
              <select className="field-input" value={newItem.unit}
                onChange={e => setNewItem(p => ({...p, unit: e.target.value}))}>
                <option value="stk">stk</option>
                <option value="rull">rull</option>
                <option value="flaske">flaske</option>
                <option value="pakke">pakke</option>
                <option value="sett">sett</option>
                <option value="liter">liter</option>
              </select>
            </label>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <label className="block">
                <span className="field-label">Antal no</span>
                <input type="number" className="field-input" min={0} value={newItem.current_qty}
                  onChange={e => setNewItem(p => ({...p, current_qty: +e.target.value}))} />
              </label>
              <label className="block">
                <span className="field-label">Minimum</span>
                <input type="number" className="field-input" min={0} value={newItem.min_qty}
                  onChange={e => setNewItem(p => ({...p, min_qty: +e.target.value}))} />
              </label>
              <label className="block">
                <span className="field-label">Maksimum</span>
                <input type="number" className="field-input" min={0} value={newItem.max_qty}
                  onChange={e => setNewItem(p => ({...p, max_qty: +e.target.value}))} />
              </label>
            </div>

            <button className="btn btn-primary mb-2" onClick={handleAddItem} disabled={saving || !newItem.name}>
              {saving ? 'Lagrar...' : 'Legg til vare'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowNewItem(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}
