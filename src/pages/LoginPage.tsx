import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, ChefHat } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'

const loginSchema = z.object({
  email:    z.string().email('אימייל לא תקין'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const { login } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try { await login(data.email, data.password) }
    catch { /* handled in AuthContext */ }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f6ff] via-[#e8f0fb] to-[#ddeaf8] py-12 px-4" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#3985b9] flex items-center justify-center shadow-lg">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Dishly Admin</h1>
          <p className="mt-2 text-gray-500 text-sm">מערכת ניהול תוכן — אוכל ביתי אמיתי</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#3985b9]/10 p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                אימייל
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="admin@dishly.co.il"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3985b9]/30 focus:border-[#3985b9] transition-all',
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                סיסמה
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full px-4 py-3 pl-11 rounded-xl border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3985b9]/30 focus:border-[#3985b9] transition-all',
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  )}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-bold text-sm transition-all shadow-md',
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#3985b9] hover:bg-[#2d6f9a] hover:shadow-lg active:scale-[0.98]'
              )}
            >
              <LogIn className="h-4 w-4" />
              {isLoading ? 'מתחבר...' : 'כניסה למערכת'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            Dishly CMS v1.0 · צריך עזרה? פנה למנהל המערכת
          </p>
        </div>
      </div>
    </div>
  )
}
