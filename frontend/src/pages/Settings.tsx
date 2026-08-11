import React, { useState } from 'react'
import { Settings as SettingsIcon, Bell, Eye, Lock, HardDrive } from 'lucide-react'
import { toast } from 'react-toastify'

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true)
  const [density, setDensity] = useState('comfortable')
  const [developerMode, setDeveloperMode] = useState(false)

  const handleSave = () => {
    toast.success("Settings saved successfully!")
  }

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-8 shadow-sm">
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
          <SettingsIcon className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Application Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Configure your client visual and inbox options.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Toggle notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-slate-400" />
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Push Notifications</h4>
              <p className="text-xs text-slate-400 mt-0.5">Alert on assigned work orders or requests status updates</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
            className="w-10 h-5 bg-slate-200 rounded-full appearance-none cursor-pointer checked:bg-primary-500 relative before:content-[''] before:h-4 before:w-4 before:bg-white before:rounded-full before:absolute before:top-0.5 before:left-0.5 checked:before:left-5 before:transition-all"
          />
        </div>

        {/* Layout Density */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-slate-400" />
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Layout Density</h4>
              <p className="text-xs text-slate-400 mt-0.5">Control sizing of lists and dashboard cards</p>
            </div>
          </div>
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-100"
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="large">Spacious</option>
          </select>
        </div>

        {/* Offline Cache */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-5">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-slate-400" />
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Offline Caching</h4>
              <p className="text-xs text-slate-400 mt-0.5">Cache work orders for offline network reconnects</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={developerMode}
            onChange={() => setDeveloperMode(!developerMode)}
            className="w-10 h-5 bg-slate-200 rounded-full appearance-none cursor-pointer checked:bg-primary-500 relative before:content-[''] before:h-4 before:w-4 before:bg-white before:rounded-full before:absolute before:top-0.5 before:left-0.5 checked:before:left-5 before:transition-all"
          />
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary-500/10"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}

export default Settings
