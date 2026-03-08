'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SETTINGS_FIELDS: { key: string; label: string; hint?: string; textarea?: boolean }[] = [
  { key: 'hero_title', label: 'Titre principal (hero)', hint: 'Ex : Champagne Carouge-Cireddu' },
  { key: 'hero_subtitle', label: 'Sous-titre (hero)', hint: 'Ex : Champagne de Vigneron · Flavigny · Marne' },
  { key: 'hero_description', label: 'Description (hero)', textarea: true },
  { key: 'boutique_title', label: 'Titre page Boutique', hint: 'Ex : Notre Sélection' },
  { key: 'boutique_subtitle', label: 'Sous-titre page Boutique', textarea: true },
  { key: 'chambres_title', label: 'Titre page Logement', hint: 'Ex : Nos Chambres' },
  { key: 'chambres_subtitle', label: 'Sous-titre page Logement', textarea: true },
  { key: 'contact_email', label: 'Email de contact', hint: 'Ex : contact@champagne-carouge.fr' },
  { key: 'contact_phone', label: 'Téléphone de contact', hint: 'Ex : +33 3 26 XX XX XX' },
  { key: 'contact_address', label: 'Adresse', hint: 'Ex : 1 route des Vignes, Flavigny' },
  { key: 'footer_text', label: 'Texte pied de page', textarea: true },
]

const DEFAULTS: Record<string, string> = {
  hero_title: 'Champagne Carouge-Cireddu',
  hero_subtitle: 'Flavigny · Marne',
  hero_description: "Champagnes artisanaux élaborés à Flavigny, dans la Marne. Découvrez notre Sélection et notre Rosé — de la vigne à la bouteille, un savoir-faire familial authentique.",
  boutique_title: 'Notre Sélection',
  boutique_subtitle: '',
  chambres_title: 'Logement entier',
  chambres_subtitle: 'Séjournez dans notre logement au cœur du vignoble. 2 nuits minimum — idéal pour un week-end au champagne.',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  footer_text: '',
}

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/settings')
    const data = await res.json()
    setValues({ ...DEFAULTS, ...(data.data ?? {}) })
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setError('')
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur lors de la sauvegarde.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Paramètres du site</h1>
          <p className="text-zinc-500 mt-1">Textes et informations affichés sur le site</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6 space-y-6">
          {SETTINGS_FIELDS.map((field) => (
            <div key={field.key}>
              <Label className="font-medium text-zinc-700">{field.label}</Label>
              {field.hint && <p className="text-xs text-zinc-400 mt-0.5 mb-1">{field.hint}</p>}
              {field.textarea ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              ) : (
                <Input
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="mt-1"
                />
              )}
            </div>
          ))}

          {error && <p className="text-sm text-red-500 bg-red-50 rounded p-3">{error}</p>}

          <div className="pt-2 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-2 items-start">
          <Settings className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Comment utiliser ces paramètres ?</p>
            <p className="text-xs text-amber-700 mt-1">
              Les textes enregistrés ici remplacent les textes par défaut sur les pages du site.
              Laissez un champ vide pour conserver le texte par défaut.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
