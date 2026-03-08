'use client'

import { useState, useEffect, useCallback } from 'react'
import { BedDouble, Calendar, RefreshCw, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Booking, BookingStatus, Room } from '@/types'

const STATUS_BADGE: Record<BookingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'secondary' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  confirmed: { label: 'Confirmée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'error' },
  completed: { label: 'Terminée', variant: 'secondary' },
}

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct', airbnb: 'Airbnb', booking: 'Booking.com', other: 'Autre',
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  // Airbnb sync state
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncUrl, setSyncUrl] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ created: number; skipped: number } | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/bookings?${params}`)
    const data = await res.json()
    setBookings(data.data ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    fetchBookings()
    fetch('/api/rooms').then((r) => r.json()).then((d) => setRoom(d.data?.[0] ?? null))
  }, [fetchBookings])

  const cancelBooking = async (id: string) => {
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    fetchBookings()
    if (selected?.id === id) setSelected(null)
  }

  const syncAirbnb = async () => {
    if (!room || !syncUrl) return
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch('/api/calendar/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: room.id, icalUrl: syncUrl }),
    })
    const data = await res.json()
    setSyncResult(data)
    setSyncing(false)
    fetchBookings()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Réservations</h1>
          <p className="text-zinc-500 mt-1">{bookings.length} réservation{bookings.length > 1 ? 's' : ''} · Logement complet</p>
        </div>
        <div className="flex gap-2">
          {room && (
            <Button
              onClick={() => window.open(`/api/calendar/export?roomId=${room.id}`, '_blank')}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export iCal
            </Button>
          )}
          <Button onClick={() => setSyncOpen(true)} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync Airbnb
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-white"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_BADGE).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bookings list */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <BedDouble className="w-10 h-10 mx-auto mb-3" />
              <p>Aucune réservation trouvée</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Dates</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase hidden lg:table-cell">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {bookings.map((booking) => {
                  const badge = STATUS_BADGE[booking.status]
                  return (
                    <tr
                      key={booking.id}
                      className={`hover:bg-zinc-50 cursor-pointer transition-colors ${selected?.id === booking.id ? 'bg-amber-50' : ''}`}
                      onClick={() => setSelected(booking)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-zinc-800">{booking.guest_name}</p>
                        <p className="text-xs text-zinc-400">{SOURCE_LABELS[booking.source] ?? booking.source}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        <p>{formatDate(booking.check_in)}</p>
                        <p className="text-zinc-400">→ {formatDate(booking.check_out)}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge variant={badge?.variant ?? 'secondary'}>{badge?.label ?? booking.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#C9A84C] text-sm">
                        {formatPrice(booking.total_price)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-300 py-12">
              <Calendar className="w-12 h-12 mb-3" />
              <p className="text-sm text-zinc-400">Sélectionnez une réservation</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-semibold text-zinc-900">{selected.guest_name}</h3>
                  <p className="text-xs text-zinc-400">{selected.guest_email}</p>
                </div>
                <Badge variant={STATUS_BADGE[selected.status]?.variant ?? 'secondary'}>
                  {STATUS_BADGE[selected.status]?.label}
                </Badge>
              </div>

              <div className="bg-zinc-50 rounded-lg p-3 space-y-1.5 text-sm">
                {[
                  ['Arrivée', formatDate(selected.check_in)],
                  ['Départ', formatDate(selected.check_out)],
                  ['Nuits', String(selected.nights)],
                  ['Source', SOURCE_LABELS[selected.source] ?? selected.source],
                  ['Téléphone', selected.guest_phone ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-zinc-400 text-xs">{label}</span>
                    <span className="text-zinc-700 font-medium text-xs text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">Notes</p>
                  <p>{selected.notes}</p>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between font-bold text-[#C9A84C]">
                <span>Total</span>
                <span>{formatPrice(selected.total_price)}</span>
              </div>

              {selected.status !== 'cancelled' && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => cancelBooking(selected.id)}
                >
                  <X className="w-3.5 h-3.5" />
                  Annuler la réservation
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Airbnb sync modal */}
      {syncOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-xl font-bold">Synchronisation Airbnb</h3>
              <button onClick={() => { setSyncOpen(false); setSyncResult(null) }} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>URL du calendrier Airbnb (.ics)</Label>
                <Input
                  type="url"
                  placeholder="https://www.airbnb.fr/calendar/ical/..."
                  value={syncUrl}
                  onChange={(e) => setSyncUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Disponible dans Airbnb → Paramètres → Disponibilités → Synchroniser les calendriers
                </p>
              </div>

              {syncResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  <p className="font-semibold mb-1">Synchronisation terminée</p>
                  <p>{syncResult.created} réservation{syncResult.created !== 1 ? 's' : ''} importée{syncResult.created !== 1 ? 's' : ''}</p>
                  <p>{syncResult.skipped} ignorée{syncResult.skipped !== 1 ? 's' : ''} (déjà existantes)</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setSyncOpen(false); setSyncResult(null) }}>
                  Fermer
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={syncAirbnb}
                  disabled={syncing || !syncUrl || !room}
                >
                  {syncing ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Synchronisation...</>
                  ) : (
                    <><RefreshCw className="w-3.5 h-3.5" /> Synchroniser</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
