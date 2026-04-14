import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Edit, ExternalLink, Store } from 'lucide-react'
import { api } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PUBLIC_SITE_URL } from '@/config/site'

type VendorRow = {
  id: string
  display_name: string
  public_token: string
  logo_url?: string | null
  hero_image_url?: string | null
  categories?: string[]
  updated_at?: string
}

export default function VendorsListPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-admin', search],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('limit', '500')
      if (search.trim()) params.set('search', search.trim())
      const res = await api.get(`/vendor-admin?${params}`)
      return res.data as {
        success: boolean
        data: VendorRow[]
        pagination: { total: number }
      }
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-8 h-8 text-rose-500" />
            ספקים — דפי נחיתה
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            ניהול תוכן דף הנחיתה הציבורי (כמו בממשק הספק). הקישור הציבורי הוא באתר השיווקי.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="חיפוש לפי שם או טוקן..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <span className="text-sm text-gray-500 self-center">
          {data?.pagination?.total != null ? `${data.pagination.total} ספקים` : null}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">ספק</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">קטגוריות</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">עודכן</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-40">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((v) => {
                const publicUrl = `${PUBLIC_SITE_URL}/book/vendor/${encodeURIComponent(v.public_token)}`
                return (
                  <tr key={v.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                          {v.logo_url || v.hero_image_url ? (
                            <img src={v.logo_url || v.hero_image_url || ''} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                              {v.display_name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{v.display_name}</p>
                          <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">{v.public_token}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {(v.categories || []).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {v.updated_at ? new Date(v.updated_at).toLocaleString('he-IL') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/vendors/${v.id}/edit`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100"
                        >
                          <Edit className="w-4 h-4" />
                          עריכה
                        </Link>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 p-2 text-gray-500 hover:text-[#2563EB]"
                          title="תצוגה ציבורית"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-center text-gray-500 py-12 text-sm">לא נמצאו ספקים או שאין התאמה לחיפוש.</p>
          )}
        </div>
      )}
    </div>
  )
}
