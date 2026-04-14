import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Save,
  ExternalLink,
  Upload,
  Trash2,
  Store,
} from 'lucide-react'
import { api } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PUBLIC_SITE_URL } from '@/config/site'
import { VENDOR_CATEGORY_OPTIONS } from '@/config/vendorCategories'

type Profile = Record<string, unknown> & {
  id: string
  display_name: string
  public_token: string
  description?: string | null
  landing_template?: string
  categories?: string[]
  hero_image_url?: string | null
  logo_url?: string | null
  gallery_urls?: string[]
  phone_public?: string | null
  address_line?: string | null
  promo_banner?: string | null
  social_facebook?: string | null
  social_instagram?: string | null
  social_twitter?: string | null
  social_tiktok?: string | null
  social_whatsapp?: string | null
  social_waze?: string | null
  services_json?: unknown
  reviews_json?: unknown
  booking_rules?: unknown
}

function jsonPretty(v: unknown, empty: string): string {
  try {
    if (v === undefined || v === null) return empty
    return JSON.stringify(v, null, 2)
  } catch {
    return empty
  }
}

export default function VendorEditorPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Partial<Profile>>({})
  const [servicesText, setServicesText] = useState('[]')
  const [reviewsText, setReviewsText] = useState('[]')
  const [bookingText, setBookingText] = useState('{}')

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendor-admin', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/vendor-admin/${id}`)
      return res.data.data as Profile
    },
  })

  useEffect(() => {
    if (!data) return
    setForm(data)
    setServicesText(jsonPretty(data.services_json, '[]'))
    setReviewsText(jsonPretty(data.reviews_json, '[]'))
    setBookingText(jsonPretty(data.booking_rules, '{}'))
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      let services_json: unknown = []
      let reviews_json: unknown = []
      let booking_rules: unknown = {}
      try {
        services_json = JSON.parse(servicesText || '[]')
      } catch {
        throw new Error('שירותים — JSON לא תקין')
      }
      try {
        reviews_json = JSON.parse(reviewsText || '[]')
      } catch {
        throw new Error('ביקורות — JSON לא תקין')
      }
      try {
        booking_rules = JSON.parse(bookingText || '{}')
      } catch {
        throw new Error('כללי קביעת פגישה — JSON לא תקין')
      }
      const body = {
        display_name: form.display_name,
        description: form.description ?? null,
        landing_template: form.landing_template,
        categories: form.categories ?? [],
        phone_public: form.phone_public ?? null,
        address_line: form.address_line ?? null,
        promo_banner: form.promo_banner ?? null,
        social_facebook: form.social_facebook ?? null,
        social_instagram: form.social_instagram ?? null,
        social_twitter: form.social_twitter ?? null,
        social_tiktok: form.social_tiktok ?? null,
        social_whatsapp: form.social_whatsapp ?? null,
        social_waze: form.social_waze ?? null,
        gallery_urls: form.gallery_urls ?? [],
        services_json,
        reviews_json,
        booking_rules,
      }
      const res = await api.patch(`/vendor-admin/${id}`, body)
      return res.data.data as Profile
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['vendor-admin', id], updated)
      queryClient.invalidateQueries({ queryKey: ['vendor-admin'] })
      setForm(updated)
      toast.success('נשמר')
    },
    onError: (e: Error) => toast.error(e.message || 'שגיאה בשמירה'),
  })

  const toggleCategory = (cid: string) => {
    const cur = new Set(form.categories || [])
    if (cur.has(cid)) cur.delete(cid)
    else cur.add(cid)
    setForm((f) => ({ ...f, categories: [...cur] }))
  }

  const upload = useCallback(
    async (kind: 'hero' | 'logo' | 'gallery', file: File) => {
      if (!id) return
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', kind)
      const res = await api.post(`/vendor-admin/${id}/landing/upload`, fd)
      const profile = res.data.profile as Profile
      queryClient.setQueryData(['vendor-admin', id], profile)
      setForm(profile)
      toast.success('הקובץ הועלה')
    },
    [id, queryClient]
  )

  const removeGallery = async (url: string) => {
    if (!id) return
    await api.post(`/vendor-admin/${id}/landing/gallery/remove`, { url })
    const res = await api.get(`/vendor-admin/${id}`)
    const profile = res.data.data as Profile
    queryClient.setQueryData(['vendor-admin', id], profile)
    setForm(profile)
    toast.success('הוסר מהגלריה')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    saveMutation.mutate()
  }

  if (!id) return null

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-600">
        לא ניתן לטעון את הספק
        <Link to="/vendors" className="block mt-4 text-[#2563EB]">
          חזרה לרשימה
        </Link>
      </div>
    )
  }

  const publicUrl = `${PUBLIC_SITE_URL}/book/vendor/${encodeURIComponent(form.public_token || data.public_token)}`

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <Link
            to="/vendors"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            כל הספקים
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
            <Store className="w-8 h-8 text-rose-500 shrink-0" />
            {form.display_name || data.display_name}
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">{form.public_token}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4" />
            תצוגה באתר
          </a>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-10">
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטים כלליים</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם לתצוגה</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.display_name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px]"
                value={typeof form.description === 'string' ? form.description : ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תבנית דף</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={(form.landing_template as string) || 'modern'}
                onChange={(e) => setForm((f) => ({ ...f, landing_template: e.target.value }))}
              >
                <option value="modern">modern</option>
                <option value="minimal">minimal</option>
                <option value="rose">rose</option>
              </select>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">קטגוריות</p>
              <div className="flex flex-wrap gap-2">
                {VENDOR_CATEGORY_OPTIONS.map((c) => {
                  const on = (form.categories || []).includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        on
                          ? 'bg-rose-100 border-rose-300 text-rose-900'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">תמונות</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Hero</p>
              {form.hero_image_url ? (
                <img src={form.hero_image_url} alt="" className="w-full max-h-40 object-cover rounded-lg border mb-2" />
              ) : (
                <p className="text-xs text-gray-400 mb-2">אין תמונה</p>
              )}
              <label className="inline-flex items-center gap-2 text-sm text-[#2563EB] cursor-pointer">
                <Upload className="w-4 h-4" />
                העלאת Hero
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void upload('hero', f)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">לוגו</p>
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className="w-24 h-24 object-cover rounded-xl border mb-2" />
              ) : (
                <p className="text-xs text-gray-400 mb-2">אין לוגו</p>
              )}
              <label className="inline-flex items-center gap-2 text-sm text-[#2563EB] cursor-pointer">
                <Upload className="w-4 h-4" />
                העלאת לוגו
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void upload('logo', f)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">גלריה</p>
            <label className="inline-flex items-center gap-2 text-sm text-[#2563EB] cursor-pointer mb-3">
              <Upload className="w-4 h-4" />
              הוספת תמונה לגלריה
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void upload('gallery', f)
                  e.target.value = ''
                }}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(form.gallery_urls || []).map((u) => (
                <div key={u} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => void removeGallery(u)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    aria-label="הסר"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי קשר ומבצע</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון ציבורי</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                dir="ltr"
                value={typeof form.phone_public === 'string' ? form.phone_public : ''}
                onChange={(e) => setForm((f) => ({ ...f, phone_public: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">כתובת (שורה אחת)</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={typeof form.address_line === 'string' ? form.address_line : ''}
                onChange={(e) => setForm((f) => ({ ...f, address_line: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">באנר מבצע / הדגשה</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[60px]"
                value={typeof form.promo_banner === 'string' ? form.promo_banner : ''}
                onChange={(e) => setForm((f) => ({ ...f, promo_banner: e.target.value }))}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">רשתות חברתיות</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(
              [
                ['social_whatsapp', 'WhatsApp'],
                ['social_instagram', 'Instagram'],
                ['social_facebook', 'Facebook'],
                ['social_twitter', 'X / Twitter'],
                ['social_tiktok', 'TikTok'],
                ['social_waze', 'Waze'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  dir="ltr"
                  value={typeof form[key] === 'string' ? (form[key] as string) : ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">שירותים (JSON)</h2>
          <p className="text-xs text-gray-500 mb-2">מערך אובייקטים: title, price_ils, description</p>
          <textarea
            className="w-full font-mono text-xs border rounded-lg px-3 py-2 min-h-[140px]"
            dir="ltr"
            value={servicesText}
            onChange={(e) => setServicesText(e.target.value)}
          />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">ביקורות (JSON)</h2>
          <textarea
            className="w-full font-mono text-xs border rounded-lg px-3 py-2 min-h-[120px]"
            dir="ltr"
            value={reviewsText}
            onChange={(e) => setReviewsText(e.target.value)}
          />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">כללי קביעת פגישה (JSON)</h2>
          <p className="text-xs text-gray-500 mb-2">weekdays (0–6), start, end, slotMinutes</p>
          <textarea
            className="w-full font-mono text-xs border rounded-lg px-3 py-2 min-h-[100px]"
            dir="ltr"
            value={bookingText}
            onChange={(e) => setBookingText(e.target.value)}
          />
        </section>

        <div className="sticky bottom-4 flex justify-end">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-l from-rose-500 to-pink-600 text-white font-semibold shadow-lg disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? 'שומר…' : 'שמירה'}
          </button>
        </div>
      </form>
    </div>
  )
}
