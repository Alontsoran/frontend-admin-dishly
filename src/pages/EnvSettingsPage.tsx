import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2, Save, RefreshCw, AlertTriangle } from 'lucide-react'
import { api } from '@/services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface EnvFieldDef {
  key: string
  label: string
  sensitive: boolean
  placeholder?: string
  hint?: string
}

function extractString(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object' && val !== null && 'value' in val) {
    const inner = (val as { value: unknown }).value
    if (typeof inner === 'string') return inner
    if (typeof inner === 'object' && inner !== null && 'value' in inner) {
      const v = (inner as { value: unknown }).value
      if (typeof v === 'string') return v
    }
  }
  return ''
}

export default function EnvSettingsPage() {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})
  const [original, setOriginal] = useState<Record<string, string>>({})

  const { data: defs = [], isLoading: loadingMeta } = useQuery<EnvFieldDef[]>({
    queryKey: ['backend-env-meta'],
    queryFn: async () => {
      const res = await api.get('/settings/backend-env/meta')
      return res.data.data
    },
  })

  const { data: groupData, isLoading: loadingGroup } = useQuery({
    queryKey: ['settings-group', 'backend_env'],
    queryFn: async () => {
      const res = await api.get('/settings/group/backend_env')
      return res.data.data as Record<string, unknown>
    },
    enabled: defs.length > 0,
  })

  useEffect(() => {
    if (!defs.length || groupData === undefined) return
    const next: Record<string, string> = {}
    for (const d of defs) {
      next[d.key] = extractString(groupData[d.key])
    }
    setValues(next)
    setOriginal({ ...next })
  }, [defs, groupData])

  const reloadMutation = useMutation({
    mutationFn: () => api.post('/settings/runtime/reload'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-group'] })
      toast.success('השרת טען מחדש הגדרות מהמסד')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה ברענון')
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const settings = defs.map((d) => ({
        key: d.key,
        value: { value: values[d.key] ?? '' },
        groupName: 'backend_env',
      }))
      await api.put('/settings/bulk', { settings })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-group'] })
      setOriginal({ ...values })
      toast.success('נשמר — השרת טען מחדש את משתני הריצה מהמסד')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה בשמירה')
    },
  })

  const loading = loadingMeta || (defs.length > 0 && loadingGroup)
  const hasChanges = JSON.stringify(values) !== JSON.stringify(original)

  if (loading && !defs.length) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8 flex items-start gap-3">
        <div className="rounded-xl bg-amber-100 p-3">
          <KeyRound className="h-7 w-7 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">משתני שרת ומפתחות API</h1>
          <p className="text-gray-600 mt-1 text-sm">
            הערכים נשמרים בטבלת <code className="bg-gray-100 px-1 rounded">settings</code> (קבוצה{' '}
            <code className="bg-gray-100 px-1 rounded">backend_env</code>) ודורסים את{' '}
            <code className="bg-gray-100 px-1 rounded">.env</code> בזמן ריצה.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 flex flex-wrap items-start justify-between gap-3 text-sm text-amber-900">
        <div className="flex gap-3 min-w-0">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>חשוב:</strong> חיבור ראשון ל-Supabase חייב עדיין להיות ב־<code>.env</code> (
            <code>SUPABASE_URL</code> + <code>SUPABASE_SERVICE_ROLE_KEY</code>). אחרי מכן אפשר לנהל מפתחות
            גם כאן. אל תשתף מסך עם מפתחות רגישים.
          </div>
        </div>
        <button
          type="button"
          onClick={() => reloadMutation.mutate()}
          disabled={reloadMutation.isPending}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-lg hover:bg-amber-100 text-amber-900 whitespace-nowrap"
        >
          {reloadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          טען מחדש מהמסד
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 divide-y divide-gray-100">
        {defs.map((d) => (
          <div key={d.key} className="p-4 sm:p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-1">{d.label}</label>
            <div className="text-xs text-gray-500 font-mono mb-2">{d.key}</div>
            <input
              type={d.sensitive ? 'password' : 'text'}
              autoComplete="off"
              spellCheck={false}
              dir="ltr"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
              placeholder={d.placeholder}
              value={values[d.key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [d.key]: e.target.value }))}
            />
            {d.hint && <p className="text-xs text-gray-500 mt-1">{d.hint}</p>}
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור והחל על השרת
          </button>
          <button
            type="button"
            onClick={() => setValues({ ...original })}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            בטל שינויים
          </button>
        </div>
      )}
    </div>
  )
}
