'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, ExternalLink, Plus, X, Trash2, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order, OrderStatus, BillingStatus } from '@/types'

interface ClientOption {
  email: string
  name: string
  phone: string
}

const EMPTY_ORDER = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  address_line1: '',
  address_city: '',
  address_postal: '',
  items: [{ product_name: '', quantity: 1, unit_price: '' }] as { product_name: string; quantity: number; unit_price: string }[],
  shipping_cost: '',
  status: 'paid',
  notes: '',
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payé' },
  { value: 'processing', label: 'En cours' },
  { value: 'shipped', label: 'Expédié' },
  { value: 'delivered', label: 'Livré' },
  { value: 'cancelled', label: 'Annulé' },
]

const BILLING_BADGE: Record<BillingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'secondary' }> = {
  to_invoice: { label: 'À facturer', variant: 'warning' },
  invoiced: { label: 'Facturée', variant: 'default' },
  paid: { label: 'Payée', variant: 'success' },
}

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'secondary' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  paid: { label: 'Payé', variant: 'success' },
  processing: { label: 'En cours', variant: 'default' },
  shipped: { label: 'Expédié', variant: 'default' },
  delivered: { label: 'Livré', variant: 'success' },
  cancelled: { label: 'Annulé', variant: 'error' },
  refunded: { label: 'Remboursé', variant: 'secondary' },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_ORDER)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [showClientList, setShowClientList] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<Order | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  const filteredClients = clientSearch.length >= 1
    ? clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(clientSearch.toLowerCase())
      ).slice(0, 8)
    : []

  const selectClient = (c: ClientOption) => {
    setForm(f => ({ ...f, customer_name: c.name, customer_email: c.email, customer_phone: c.phone }))
    setClientSearch(c.name)
    setShowClientList(false)
  }

  const openModal = async () => {
    setForm(EMPTY_ORDER)
    setClientSearch('')
    setFormError('')
    setShowModal(true)
    // Charger la liste des clients
    const res = await fetch('/api/orders?limit=200')
    const data = await res.json()
    const map = new Map<string, ClientOption>()
    for (const o of data.data ?? []) {
      if (o.customer_email && !map.has(o.customer_email)) {
        map.set(o.customer_email, {
          email: o.customer_email,
          name: o.customer_name ?? '',
          phone: o.customer_phone ?? '',
        })
      }
    }
    setClients(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)))
  }

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.unit_price) || 0) * i.quantity, 0)
  const total = subtotal + (parseFloat(form.shipping_cost) || 0)

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_name: '', quantity: 1, unit_price: '' }] }))
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  const updateItem = (idx: number, field: string, value: string | number) =>
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }))

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        shipping_address: { line1: form.address_line1, city: form.address_city, postal_code: form.address_postal, country: 'FR' },
        items: form.items.filter(i => i.product_name).map(i => ({
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: parseFloat(i.unit_price) || 0,
        })),
        shipping_cost: parseFloat(form.shipping_cost) || 0,
        status: form.status,
        notes: form.notes,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setShowModal(false)
      setForm(EMPTY_ORDER)
      fetchOrders()
    } else {
      const d = await res.json()
      setFormError(d.error ?? 'Erreur lors de la création')
    }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/orders?${params}`)
    const data = await res.json()
    setOrders(data.data ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchOrders()
    if (selected?.id === orderId) setSelected((prev) => prev ? { ...prev, status } : null)
  }

  const loadOrderDetail = async (order: Order) => {
    setSelected(order)
    setSelectedDetail(null)
    setLoadingDetail(true)
    const res = await fetch(`/api/orders/${order.id}`)
    const d = await res.json()
    setSelectedDetail(d.data ?? null)
    setLoadingDetail(false)
  }

  const updateBillingStatus = async (orderId: string, billing_status: BillingStatus) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billing_status }),
    })
    fetchOrders()
    setSelectedDetail(prev => prev ? { ...prev, billing_status } : null)
  }

  const generateInvoice = async (orderId: string) => {
    setInvoiceLoading(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })
    const d = await res.json()
    setInvoiceLoading(false)
    if (res.ok && d.data?.id) {
      window.open(`/api/invoices/${d.data.id}/pdf`, '_blank')
      // Recharger le détail pour voir la facture
      if (selected) loadOrderDetail(selected)
      fetchOrders()
    } else {
      alert(d.error ?? 'Erreur lors de la génération')
    }
  }

  const filtered = orders.filter((o) =>
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email.toLowerCase().includes(search.toLowerCase()) ||
    o.id.includes(search)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Commandes</h1>
          <p className="text-zinc-500 mt-1">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle commande
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-white min-w-[180px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders list */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3" />
              <p>Aucune commande trouvée</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((order) => {
                  const badge = STATUS_BADGE[order.status] ?? { label: order.status, variant: 'secondary' as const }
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-zinc-50 cursor-pointer transition-colors ${selected?.id === order.id ? 'bg-amber-50' : ''}`}
                      onClick={() => loadOrderDetail(order)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-zinc-800">{order.customer_name}</p>
                        <p className="text-xs text-zinc-400 truncate max-w-[180px]">{order.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500 hidden md:table-cell">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {order.billing_status && order.billing_status !== 'to_invoice' && (
                            <Badge variant={BILLING_BADGE[order.billing_status as BillingStatus]?.variant ?? 'secondary'} className="text-[10px]">
                              {BILLING_BADGE[order.billing_status as BillingStatus]?.label}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#C9A84C] text-sm">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Order detail panel */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-300 py-12">
              <ShoppingBag className="w-12 h-12 mb-3" />
              <p className="text-sm text-zinc-400">Sélectionnez une commande</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (() => {
            const detail = selectedDetail ?? selected
            const invoice = (detail as any).invoices?.[0] ?? null
            return (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-semibold text-zinc-900">{detail.customer_name}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{detail.customer_email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={STATUS_BADGE[detail.status]?.variant ?? 'secondary'}>
                    {STATUS_BADGE[detail.status]?.label ?? detail.status}
                  </Badge>
                  <Badge variant={BILLING_BADGE[detail.billing_status as BillingStatus]?.variant ?? 'secondary'} className="text-[10px]">
                    {BILLING_BADGE[detail.billing_status as BillingStatus]?.label ?? detail.billing_status}
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-zinc-400 space-y-1">
                <p>Commande du {formatDate(detail.created_at)}</p>
                {detail.customer_phone && <p>Tél : {detail.customer_phone}</p>}
              </div>

              {/* Shipping address */}
              <div className="bg-zinc-50 rounded-lg p-3 text-sm text-zinc-600">
                <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">Livraison</p>
                <p>{detail.shipping_address.line1}</p>
                {detail.shipping_address.line2 && <p>{detail.shipping_address.line2}</p>}
                <p>{detail.shipping_address.postal_code} {detail.shipping_address.city}</p>
                <p>{detail.shipping_address.country}</p>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">Articles</p>
                <div className="space-y-1.5">
                  {(detail as any).order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-zinc-600">{item.product_name} × {item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Sous-total</span><span>{formatPrice(detail.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Livraison</span><span>{formatPrice(detail.shipping_cost)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#C9A84C]">
                  <span>Total</span><span>{formatPrice(detail.total)}</span>
                </div>
              </div>

              {/* Status update */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">Statut commande</p>
                <select
                  value={detail.status}
                  onChange={(e) => updateStatus(detail.id, e.target.value as OrderStatus)}
                  className="w-full h-9 px-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(STATUS_BADGE).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Billing */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase">Facturation</p>

                <select
                  value={detail.billing_status ?? 'to_invoice'}
                  onChange={(e) => updateBillingStatus(detail.id, e.target.value as BillingStatus)}
                  className="w-full h-9 px-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(BILLING_BADGE).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                {invoice ? (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500">Facture : <span className="font-semibold text-zinc-800">{invoice.invoice_number}</span></p>
                    <Button asChild variant="outline" size="sm" className="w-full gap-2">
                      <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-3.5 h-3.5" />
                        Voir / Imprimer la facture
                      </a>
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => generateInvoice(detail.id)}
                    disabled={invoiceLoading}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {invoiceLoading ? 'Génération...' : 'Générer la facture'}
                  </Button>
                )}

                {detail.billing_status !== 'paid' && (
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => updateBillingStatus(detail.id, 'paid')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marquer comme payée
                  </Button>
                )}
              </div>

              {detail.stripe_session_id && (
                <a
                  href={`https://dashboard.stripe.com/payments/${detail.stripe_payment_intent}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  Voir sur Stripe
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            )
          })()}
        </div>
      </div>

      {/* Modal Nouvelle commande */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="font-serif text-xl font-bold text-zinc-900">Nouvelle commande</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitOrder} className="p-6 space-y-6">
              {/* Sélection client */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Client</p>

                {/* Recherche client existant */}
                <div className="relative mb-3">
                  <Label htmlFor="o_client_search">Rechercher un client existant</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      id="o_client_search"
                      placeholder="Nom ou email..."
                      value={clientSearch}
                      onChange={e => { setClientSearch(e.target.value); setShowClientList(true) }}
                      onFocus={() => setShowClientList(true)}
                      className="pl-9"
                      autoComplete="off"
                    />
                  </div>
                  {showClientList && filteredClients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredClients.map(c => (
                        <button
                          key={c.email}
                          type="button"
                          onClick={() => selectClient(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                        >
                          <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                          <p className="text-xs text-zinc-400">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-xs text-zinc-400 mb-3 text-center">— ou saisir manuellement —</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="o_name">Nom complet *</Label>
                    <Input id="o_name" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="o_email">Email *</Label>
                    <Input id="o_email" type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="o_phone">Téléphone</Label>
                    <Input id="o_phone" type="tel" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Adresse de livraison */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Adresse de livraison</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <Label htmlFor="o_line1">Adresse</Label>
                    <Input id="o_line1" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} className="mt-1" placeholder="12 rue de la Paix" />
                  </div>
                  <div>
                    <Label htmlFor="o_postal">Code postal</Label>
                    <Input id="o_postal" value={form.address_postal} onChange={e => setForm(f => ({ ...f, address_postal: e.target.value }))} className="mt-1" placeholder="75001" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="o_city">Ville</Label>
                    <Input id="o_city" value={form.address_city} onChange={e => setForm(f => ({ ...f, address_city: e.target.value }))} className="mt-1" placeholder="Paris" />
                  </div>
                </div>
              </div>

              {/* Articles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Articles</p>
                  <button type="button" onClick={addItem} className="text-xs text-[#C9A84C] hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Ajouter un article
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <Input
                          placeholder="Nom du produit"
                          value={item.product_name}
                          onChange={e => updateItem(idx, 'product_name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Qté"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="Prix €"
                          value={item.unit_price}
                          onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-zinc-300 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frais + statut */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="o_shipping">Frais de port (€)</Label>
                  <Input id="o_shipping" type="number" step="0.01" min={0} value={form.shipping_cost} onChange={e => setForm(f => ({ ...f, shipping_cost: e.target.value }))} className="mt-1" placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="o_status">Statut</Label>
                  <select
                    id="o_status"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full h-10 px-3 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-white"
                  >
                    {STATUS_OPTIONS.filter(s => s.value).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="o_notes">Notes internes</Label>
                <textarea
                  id="o_notes"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Remarques, canal de vente..."
                />
              </div>

              {/* Total récap */}
              <div className="bg-zinc-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-zinc-500">
                  <span>Sous-total</span><span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Livraison</span><span>{(parseFloat(form.shipping_cost) || 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-[#C9A84C]">
                  <span>Total</span><span>{total.toFixed(2)} €</span>
                </div>
              </div>

              {formError && <p className="text-sm text-red-500 bg-red-50 rounded p-3">{formError}</p>}

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Enregistrement...' : 'Créer la commande'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
