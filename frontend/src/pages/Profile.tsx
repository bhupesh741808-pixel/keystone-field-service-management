import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User } from 'lucide-react'
import api from '../services/api'
import { toast } from 'react-toastify'

const Profile: React.FC = () => {
  const { user, login } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName) {
      toast.error("Full name is required")
      return
    }
    setUpdating(true)
    try {
      const res = await api.put(`/users/${user?.id}`, {
        fullName,
        phone,
        active: true
      })
      // Update session localStorage
      const updatedUser = { ...user, fullName: res.data.fullName, phone: res.data.phone } as any
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success("Profile updated successfully!")
    } catch (err) {
      toast.error("Failed to update profile")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-8 shadow-sm">
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
        <div className="h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-500 flex items-center justify-center">
          <User className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Profile Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Update your identity and contact info.</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
          <input
            type="text"
            value={user?.email}
            disabled
            className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 rounded-xl text-sm text-slate-500 dark:text-slate-400 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Access Role</label>
          <input
            type="text"
            value={user?.role}
            disabled
            className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 rounded-xl text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
            placeholder="+1 (555) 010-0000"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={updating}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary-500/10"
          >
            {updating ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Profile
