import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Notification } from '../types'
import { 
  Shield, Menu, X, Sun, Moon, Bell, LogOut, LayoutDashboard, 
  Users, MapPin, Package, FileText, ClipboardList, Trello, 
  BarChart3, Settings, User as UserIcon, ShoppingBag 
} from 'lucide-react'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
      const countRes = await api.get('/notifications/unread-count')
      setUnreadCount(countRes.data)
    } catch (e) {
      console.error("Failed to fetch notifications")
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [user])

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setUnreadCount(0)
      fetchNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Sidebar Links based on Role
  const getNavLinks = () => {
    const role = user?.role
    const links = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['MANAGER', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER'] },
      { name: 'Customers', path: '/customers', icon: Users, roles: ['MANAGER', 'DISPATCHER'] },
      { name: 'Sites', path: '/sites', icon: MapPin, roles: ['MANAGER', 'DISPATCHER'] },
      { name: 'Inventory / Parts', path: '/inventory', icon: Package, roles: ['MANAGER', 'DISPATCHER', 'TECHNICIAN'] },
      { name: 'Parts Store', path: '/parts-store', icon: ShoppingBag, roles: ['CUSTOMER'] },
      { name: 'Service Requests', path: '/service-requests', icon: FileText, roles: ['MANAGER', 'DISPATCHER', 'CUSTOMER'] },
      { name: 'Work Orders', path: '/work-orders', icon: ClipboardList, roles: ['MANAGER', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER'] },
      { name: 'Kanban Board', path: '/kanban', icon: Trello, roles: ['MANAGER', 'DISPATCHER', 'TECHNICIAN'] },
      { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['MANAGER'] },
    ]
    return links.filter(link => link.roles.includes(role || ''))
  }

  const navLinks = getNavLinks()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 transform lg:translate-x-0 transition-transform duration-300 ease-in-out lg:static lg:flex lg:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary-400">
            <Shield className="h-6 w-6" />
            <span>KEYSTONE</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${active ? 'bg-primary-500 text-white font-semibold shadow-lg shadow-primary-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800/50">
            <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white uppercase">
              {user?.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate">{user?.fullName}</h4>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header/TopBar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
              {location.pathname.substring(1).split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button onClick={markAllRead} className="text-xs text-primary-500 hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto division-y division-slate-200 dark:division-slate-800">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.readStatus ? 'bg-primary-50/30 dark:bg-primary-950/10' : ''}`}>
                          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">{n.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <Link to="/profile" className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-slate-500" />
              </div>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
