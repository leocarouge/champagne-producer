'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Download, ShoppingBag, BedDouble, Mail, Phone, Plus, X, Edit2, Check, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice, formatDateShort } from '@/lib/utils'

interface ClientAddress {
  line1?: string
  line2?: string
  city?: string
  postal_code?: string
  country?: string
}

interface Client {
  email: string
  name: string
  phone?: string
  address?: ClientAddress
  orderCount: number
  bookingCount: number
  totalSpent: number
  lastActivity: string
  sources: ('boutique' | 'logement')[]
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)
  const [details, setDetails] = useState<{ orders: any[]; bookings: any[] }>({ orders: [], bookings: [] })
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [clientError, setClientError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', new_email: '', phone: '', addr_line1: '', addr_city: '', addr_postal: '', addr_country: 'France' })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  const startEdit = () => {
    if (!selected) return
    setEditForm({
      name: selected.name,
      new_email: selected.email,
      phone: selected.phone ?? '',
      addr_line1: selected.address?.line1 ?? '',
      addr_city: selected.address?.city ?? '',
      addr_postal: selected.address?.postal_code ?? '',
      addr_country: selected.address?.country ?? 'France',
    })
    setEditError('')
    setEditMode(true)
  }

  const saveEdit = async () => {
    if (!selected) return
    setEditError('')
    setEditSubmitting(true)
    const body: Record<string, unknown> = {
      email: selected.email,
      name: editForm.name,
      phone: editForm.phone,
      address: {
        line1: editForm.addr_line1,
        city: editForm.addr_city,
        postal_code: editForm.addr_postal,
        country: editForm.addr_country,
      },
    }
    if (editForm.new_email && editForm.new_email !== selected.email) {
      body.new_email = editForm.new_email
    }
    const res = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setEditSubmitting(false)
    if (res.ok) {
      setEditMode(false)
      const newEmail = (editForm.new_email && editForm.new_email !== selected.email) ? editForm.new_email : selected.email
      setSelected(s => s ? {
        ...s,
        email: newEmail,
        name: editForm.name,
        phone: editForm.phone,
        address: { line1: editForm.addr_line1, city: editForm.addr_city, postal_code: editForm.addr_postal, country: editForm.addr_country },
      } : null)
      fetchClients()
    } else {
      const d = await res.json()
      setEditError(d.error ?? 'Erreur lors de la mise à jour')
    }
  }

  const submitNewClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientError('')
    setSubmitting(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: newClient.name,
        customer_email: newClient.email,
        customer_phone: newClient.phone,
        items: [],
        shipping_cost: 0,
        status: 'pending',
        notes: newClient.notes || 'Contact enregistré manuellement',
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setShowModal(false)
      setNewClient({ name: '', email: '', phone: '', notes: '' })
      fetchClients()
    } else {
      const d = await res.json()
      setClientError(d.error ?? 'Erreur lors de la création')
    }
  }

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const [ordersRes, bookingsRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/bookings?admin=true'),
    ])
    const ordersData = await ordersRes.json()
    const bookingsData = await bookingsRes.json()

    const orders: any[] = ordersData.data ?? []
    const bookings: any[] = bookingsData.data ?? []

    const map = new Map<string, Client>()

    for (const o of orders) {
      const email = o.customer_email?.toLowerCase() ?? ''
      if (!email) continue
      const existing = map.get(email) ?? {
        email,
        name: o.customer_name ?? '',
        phone: o.customer_phone ?? '',
        address: o.shipping_address ?? undefined,
        orderCount: 0,
        bookingCount: 0,
        totalSpent: 0,
        lastActivity: o.created_at,
        sources: [] as ('boutique' | 'logement')[],
      }
      existing.orderCount += 1
      existing.totalSpent += Number(o.total ?? 0)
      if (!existing.sources.includes('boutique')) existing.sources.push('boutique')
      if (o.created_at > existing.lastActivity) {
        existing.lastActivity = o.created_at
        if (o.shipping_address) existing.address = o.shipping_address
      }
      map.set(email, existing)
    }

    for (const b of bookings) {
      const email = b.guest_email?.toLowerCase() ?? ''
      if (!email) continue
      const existing = map.get(email) ?? {
        email,
        name: b.guest_name ?? '',
        phone: b.guest_phone ?? '',
        orderCount: 0,
        bookingCount: 0,
        totalSpent: 0,
        lastActivity: b.created_at,
        sources: [] as ('boutique' | 'logement')[],
      }
      existing.bookingCount += 1
      existing.totalSpent += Number(b.total_price ?? 0)
      if (!existing.sources.includes('logement')) existing.sources.push('logement')
      if (b.created_at > existing.lastActivity) existing.lastActivity = b.created_at
      if (!existing.name && b.guest_name) existing.name = b.guest_name
      if (!existing.phone && b.guest_phone) existing.phone = b.guest_phone
      map.set(email, existing)
    }

    const sorted = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    )
    setClients(sorted)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const openClient = async (client: Client) => {
    setSelected(client)
    setLoadingDetails(true)
    const [ordersRes, bookingsRes] = await Promise.all([
      fetch(`/api/orders?email=${encodeURIComponent(client.email)}`),
      fetch(`/api/bookings?admin=true&email=${encodeURIComponent(client.email)}`),
    ])
    const o = await ordersRes.json()
    const b = await bookingsRes.json()
    setDetails({ orders: o.data ?? [], bookings: b.data ?? [] })
    setLoadingDetails(false)
  }

  const exportCSV = () => {
    const rows = [
      ['Nom', 'Email', 'Téléphone', 'Commandes', 'Réservations', 'Total dépensé', 'Dernière activité'],
      ...filtered.map((c) => [
        c.name,
        c.email,
        c.phone ?? '',
        c.orderCount,
        c.bookingCount,
        c.totalSpent.toFixed(2),
        formatDateShort(c.lastActivity),
      ]),
    ]
    const csv = rows.map((r) => r.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-carouge-cireddu-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? '').includes(q)
  })

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold text-zinc-900">Clients</h1>
            <p className="text-zinc-500 text-sm mt-1">{clients.length} client{clients.length > 1 ? 's' : ''} au total</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau client
            </Button>
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Rechercher par nom, email, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Clients boutique', value: clients.filter((c) => c.sources.includes('boutique')).length, icon: ShoppingBag },
            { label: 'Clients logement', value: clients.filter((c) => c.sources.includes('logement')).length, icon: BedDouble },
            { label: 'Clients mixtes', value: clients.filter((c) => c.sources.length > 1).length, icon: Mail },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-zinc-100 p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#C9A84C]" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Contact</th>
                  <th className="text-center px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Commandes</th>
                  <th className="text-center px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Séjours</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total CA</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((client) => (
                  <tr
                    key={client.email}
                    onClick={() => openClient(client)}
                    className={`cursor-pointer transition-colors hover:bg-zinc-50 ${selected?.email === client.email ? 'bg-[#C9A84C]/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] font-bold text-sm shrink-0">
                          {client.name.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{client.name || '—'}</p>
                          <div className="flex gap-1 mt-0.5">
                            {client.sources.includes('boutique') && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">Boutique</span>
                            )}
                            {client.sources.includes('logement') && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">Logement</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-700">{client.email}</p>
                      {client.phone && <p className="text-zinc-400 text-xs">{client.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${client.orderCount > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>{client.orderCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${client.bookingCount > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>{client.bookingCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#C9A84C]">
                      {formatPrice(client.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-xs">
                      {formatDateShort(client.lastActivity)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-zinc-400">
                      Aucun client trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 bg-white border-l border-zinc-100 p-6 overflow-auto shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-lg font-bold text-zinc-900">Fiche client</h2>
            <div className="flex items-center gap-2">
              {!editMode && (
                <button onClick={startEdit} className="text-zinc-400 hover:text-[#C9A84C] transition-colors" title="Modifier">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => { setSelected(null); setEditMode(false) }} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">×</button>
            </div>
          </div>

          {/* Identity */}
          <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] font-bold text-xl mx-auto mb-4">
            {(editMode ? editForm.name : selected.name).charAt(0).toUpperCase() || '?'}
          </div>

          {editMode ? (
            <div className="space-y-3 mb-5">
              <div>
                <Label htmlFor="edit_name" className="text-xs">Nom complet</Label>
                <Input id="edit_name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label htmlFor="edit_email" className="text-xs">Email</Label>
                <Input id="edit_email" type="email" value={editForm.new_email} onChange={e => setEditForm(f => ({ ...f, new_email: e.target.value }))} className="mt-1 h-8 text-sm" />
                {editForm.new_email !== selected.email && (
                  <p className="text-[10px] text-amber-600 mt-1">L&apos;email sera mis à jour sur toutes les commandes et réservations.</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit_phone" className="text-xs">Téléphone</Label>
                <Input id="edit_phone" type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 h-8 text-sm" placeholder="06 12 34 56 78" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 pt-1">Adresse postale</p>
              <div>
                <Label htmlFor="edit_line1" className="text-xs">Rue</Label>
                <Input id="edit_line1" value={editForm.addr_line1} onChange={e => setEditForm(f => ({ ...f, addr_line1: e.target.value }))} className="mt-1 h-8 text-sm" placeholder="1 rue des Vignes" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit_postal" className="text-xs">Code postal</Label>
                  <Input id="edit_postal" value={editForm.addr_postal} onChange={e => setEditForm(f => ({ ...f, addr_postal: e.target.value }))} className="mt-1 h-8 text-sm" placeholder="51000" />
                </div>
                <div>
                  <Label htmlFor="edit_city" className="text-xs">Ville</Label>
                  <Input id="edit_city" value={editForm.addr_city} onChange={e => setEditForm(f => ({ ...f, addr_city: e.target.value }))} className="mt-1 h-8 text-sm" placeholder="Reims" />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_country" className="text-xs">Pays</Label>
                <Input id="edit_country" value={editForm.addr_country} onChange={e => setEditForm(f => ({ ...f, addr_country: e.target.value }))} className="mt-1 h-8 text-sm" />
              </div>
              {editError && <p className="text-xs text-red-500 bg-red-50 rounded p-2">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setEditMode(false)}>Annuler</Button>
                <Button size="sm" className="flex-1 text-xs gap-1" onClick={saveEdit} disabled={editSubmitting}>
                  <Check className="w-3.5 h-3.5" />
                  {editSubmitting ? 'Enreg...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-center font-serif text-lg font-semibold text-zinc-900 mb-1">{selected.name || '—'}</p>
              <div className="space-y-2 mb-6">
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-zinc-600 hover:text-[#C9A84C] transition-colors">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-zinc-600 hover:text-[#C9A84C] transition-colors">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {selected.phone}
                  </a>
                )}
                {selected.address?.line1 && (
                  <div className="flex items-start gap-2 text-sm text-zinc-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {selected.address.line1}
                      {selected.address.city && `, ${selected.address.postal_code ?? ''} ${selected.address.city}`.trim()}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-zinc-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-zinc-900">{selected.orderCount}</p>
              <p className="text-xs text-zinc-500">Commande{selected.orderCount > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-zinc-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-zinc-900">{selected.bookingCount}</p>
              <p className="text-xs text-zinc-500">Séjour{selected.bookingCount > 1 ? 's' : ''}</p>
            </div>
            <div className="col-span-2 bg-[#C9A84C]/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-[#C9A84C]">{formatPrice(selected.totalSpent)}</p>
              <p className="text-xs text-zinc-500">Chiffre d&apos;affaires total</p>
            </div>
          </div>

          {loadingDetails ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Orders */}
              {details.orders.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Commandes boutique</p>
                  <div className="space-y-2">
                    {details.orders.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between text-sm bg-zinc-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="font-medium text-zinc-800">#{o.id.slice(0, 8)}</p>
                          <p className="text-xs text-zinc-400">{formatDateShort(o.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-zinc-900">{formatPrice(o.total)}</p>
                          <p className="text-xs text-zinc-400">{o.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookings */}
              {details.bookings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Séjours logement</p>
                  <div className="space-y-2">
                    {details.bookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between text-sm bg-zinc-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="font-medium text-zinc-800">{formatDateShort(b.check_in)}</p>
                          <p className="text-xs text-zinc-400">→ {formatDateShort(b.check_out)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-zinc-900">{formatPrice(b.total_price)}</p>
                          <p className="text-xs text-zinc-400">{b.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full mt-5 gap-2"
          >
            <a href={`mailto:${selected.email}`}>
              <Mail className="w-4 h-4" />
              Envoyer un email
            </a>
          </Button>
        </div>
      )}

      {/* Modal Nouveau client */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="font-serif text-xl font-bold text-zinc-900">Nouveau client</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitNewClient} className="p-6 space-y-4">
              <div>
                <Label htmlFor="c_name">Nom complet *</Label>
                <Input id="c_name" value={newClient.name} onChange={e => setNewClient(f => ({ ...f, name: e.target.value }))} required className="mt-1" placeholder="Jean Dupont" />
              </div>
              <div>
                <Label htmlFor="c_email">Email *</Label>
                <Input id="c_email" type="email" value={newClient.email} onChange={e => setNewClient(f => ({ ...f, email: e.target.value }))} required className="mt-1" placeholder="jean@exemple.fr" />
              </div>
              <div>
                <Label htmlFor="c_phone">Téléphone</Label>
                <Input id="c_phone" type="tel" value={newClient.phone} onChange={e => setNewClient(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="06 12 34 56 78" />
              </div>
              <div>
                <Label htmlFor="c_notes">Notes</Label>
                <textarea
                  id="c_notes"
                  value={newClient.notes}
                  onChange={e => setNewClient(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Remarques..."
                />
              </div>
              {clientError && <p className="text-sm text-red-500 bg-red-50 rounded p-3">{clientError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Enregistrement...' : 'Ajouter le client'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
