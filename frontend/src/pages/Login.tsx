import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Mail, Lock } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormInputs = z.infer<typeof loginSchema>

const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (e) {
      // Errors handled by context notification toast
    }
  }

  const handleQuickLogin = (email: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', 'KeystoneFSM_Pass2026_Secure!', { shouldValidate: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-primary-400 font-extrabold text-3xl mb-2">
            <Shield className="h-10 w-10 animate-pulse" />
            <span>KEYSTONE</span>
          </div>
          <h2 className="text-xl font-medium text-slate-300">Field Service Management</h2>
          <p className="mt-2 text-sm text-slate-400">Sign in to manage and dispatch operational requests</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:underline">
              Register here
            </Link>
          </p>
        </div>

        {/* Quick Demo Login */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Quick Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickLogin('customer@keystone.com')}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-950 text-slate-300 rounded-lg border border-slate-700 text-left transition-colors truncate"
            >
              <span className="font-bold block text-primary-400">Customer</span>
              customer@keystone.com
            </button>
            <button
              onClick={() => handleQuickLogin('manager@keystone.com')}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-950 text-slate-300 rounded-lg border border-slate-700 text-left transition-colors truncate"
            >
              <span className="font-bold block text-emerald-400">Manager</span>
              manager@keystone.com
            </button>
            <button
              onClick={() => handleQuickLogin('dispatcher@keystone.com')}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-950 text-slate-300 rounded-lg border border-slate-700 text-left transition-colors truncate"
            >
              <span className="font-bold block text-sky-400">Dispatcher</span>
              dispatcher@keystone.com
            </button>
            <button
              onClick={() => handleQuickLogin('technician@keystone.com')}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-950 text-slate-300 rounded-lg border border-slate-700 text-left transition-colors truncate"
            >
              <span className="font-bold block text-amber-400">Technician</span>
              technician@keystone.com
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
