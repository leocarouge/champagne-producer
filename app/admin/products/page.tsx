'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import type { Product, ProductCategory } from '@/types'

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'brut', label: 'Brut' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'blanc-de-blancs', label: 'Blanc de Blancs' },
  { value: 'millésime', label: 'Millésimé' },
  { value: 'prestige', label: 'Prestige' },
  { value: 'autre', label: 'Autre' },
]

const emptyForm = {
  name: '', slug: '', description: '', price: 0, stock: 0,
  image_url: '', category: 'brut' as ProductCategory, featured: false, active: true,
  label: '', assemblage: '', vins_reserve: '', region: '', accord_mets: '',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/products?admin=true')
    const data = await res.json()
    setProducts(data.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, slug: p.slug, description: p.description,
      price: p.price, stock: p.stock, image_url: p.image_url ?? '',
      category: p.category, featured: p.featured, active: p.active,
      label: p.label ?? '', assemblage: p.assemblage ?? '',
      vins_reserve: p.vins_reserve ?? '', region: p.region ?? '', accord_mets: p.accord_mets ?? '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        image_url: form.image_url || null,
        label: form.label || null,
        assemblage: form.assemblage || null,
        vins_reserve: form.vins_reserve || null,
        region: form.region || null,
        accord_mets: form.accord_mets || null,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setShowForm(false)
      fetchProducts()
    } else {
      const d = await res.json()
      setFormError(typeof d.error === 'string' ? d.error : 'Erreur lors de la sauvegarde.')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    if (!res.ok) {
      const d = await res.json()
      alert(`Erreur suppression : ${d.error ?? 'Impossible de supprimer ce produit.'}`)
    }
    fetchProducts()
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Produits</h1>
          <p className="text-zinc-500 mt-1">{products.length} produit{products.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau produit
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <Package className="w-10 h-10 mx-auto mb-3" />
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Produit</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Catégorie</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Prix</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Stock</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-12 rounded overflow-hidden bg-zinc-100 shrink-0">
                        {product.image_url && (
                          <Image src={product.image_url} alt="" fill className="object-cover" sizes="40px" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 text-sm">{product.name}</p>
                        <p className="text-xs text-zinc-400">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <Badge variant="secondary">{product.category}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-[#C9A84C] text-sm">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-sm font-medium ${product.stock < 5 ? 'text-orange-500' : 'text-zinc-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex gap-2">
                      {product.active ? (
                        <Badge variant="success">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                      {product.featured && <Badge variant="default">Vedette</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(product)} className="p-1.5 text-zinc-400 hover:text-[#C9A84C] hover:bg-amber-50 rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(product.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-serif text-lg font-bold mb-2">Supprimer le produit ?</h3>
            <p className="text-zinc-500 text-sm mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
              <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-xl w-full shadow-xl my-4">
            <h3 className="font-serif text-xl font-bold mb-6">
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Description *</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Prix (€) *</Label>
                  <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} required className="mt-1" />
                </div>
                <div>
                  <Label>Stock *</Label>
                  <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })} required className="mt-1" />
                </div>
                <div>
                  <Label>Catégorie *</Label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>URL de l&apos;image</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="mt-1" placeholder="https://..." />
              </div>
              <div>
                <Label>Badge (ex : Premier Cru)</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="mt-1" placeholder="Premier Cru" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] pt-1">Fiche technique</p>
              <div>
                <Label>Assemblage</Label>
                <Input value={form.assemblage} onChange={(e) => setForm({ ...form, assemblage: e.target.value })} className="mt-1" placeholder="55% Chardonnay · 25% Pinot Noir…" />
              </div>
              <div>
                <Label>Vins de réserve</Label>
                <Input value={form.vins_reserve} onChange={(e) => setForm({ ...form, vins_reserve: e.target.value })} className="mt-1" placeholder="57% de vins de réserve" />
              </div>
              <div>
                <Label>Région</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="mt-1" placeholder="Côte des Blancs · Montagne de Reims…" />
              </div>
              <div>
                <Label>Accords mets</Label>
                <Input value={form.accord_mets} onChange={(e) => setForm({ ...form, accord_mets: e.target.value })} className="mt-1" placeholder="Gambas grillées, fruits de mer…" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded border-zinc-300" />
                  <span className="text-sm">Coup de cœur</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-zinc-300" />
                  <span className="text-sm">Actif</span>
                </label>
              </div>
              {formError && <p className="text-sm text-red-500 bg-red-50 rounded p-3">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Annuler</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
