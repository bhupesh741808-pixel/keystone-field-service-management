import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { toast } from 'react-toastify'
import { DashboardSummary, WorkOrder, ServiceRequest } from '../types'
import { 
  ClipboardList, Clock, CheckCircle2, AlertCircle, Play, 
  FilePlus, Wrench, ShieldAlert, TrendingUp, Calendar, ChevronLeft, ChevronRight, Plus, FileText, Settings, User, Activity, Star, Pause
} from 'lucide-react'
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell, PieChart, Pie, Legend 
} from 'recharts'
import { Link } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.post(`/work-orders/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWorkOrders'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status")
    }
  })

  const [stopwatchSecs, setStopwatchSecs] = useState(5027)
  const [isRunning, setIsRunning] = useState(false)

  // Queries based on roles
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard')
      return res.data
    },
    enabled: ['MANAGER', 'DISPATCHER'].includes(user?.role || ''),
  })

  const { data: workOrders, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ['myWorkOrders'],
    queryFn: async () => {
      const res = await api.get('/work-orders?size=50')
      return res.data.content
    },
    enabled: ['MANAGER', 'TECHNICIAN', 'DISPATCHER', 'CUSTOMER'].includes(user?.role || ''),
  })

  // Find active and in-progress jobs for technician
  const techActiveJobs = (user?.role === 'TECHNICIAN' && workOrders)
    ? (workOrders || []).filter((w: any) => ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(w.status))
    : []
  const currentInProgressJob = techActiveJobs.find((w: any) => w.status === 'IN_PROGRESS')

  useEffect(() => {
    if (currentInProgressJob) {
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }, [currentInProgressJob])

  useEffect(() => {
    let interval: any = null
    if (isRunning) {
      interval = setInterval(() => {
        setStopwatchSecs(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const { data: serviceRequests, isLoading: requestsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ['myServiceRequests'],
    queryFn: async () => {
      const url = user?.role === 'CUSTOMER' ? `/service-requests/customer/${user.customerId}` : '/service-requests'
      const res = await api.get(url)
      return res.data
    },
    enabled: ['MANAGER', 'CUSTOMER', 'DISPATCHER'].includes(user?.role || ''),
  })

  if (summaryLoading || ordersLoading || requestsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  // ==========================================
  // MANAGER VIEW
  // ==========================================
  if (user?.role === 'MANAGER' || user?.role === 'DISPATCHER') {
    const activeTracking = (workOrders || []).filter((w: WorkOrder) => w.status !== 'CLOSED' && w.status !== 'CANCELLED')
    const completedCount = summary 
      ? summary.completedCount 
      : (workOrders || []).filter((w: any) => w.status === 'COMPLETED' || w.status === 'CLOSED').length
    const criticalCount = summary 
      ? summary.overdueCount 
      : (workOrders || []).filter((w: any) => w.priority === 'EMERGENCY' || w.priority === 'HIGH').length

    // Generate categories distribution
    const categoryCounts = (serviceRequests || []).reduce((acc: any, req: any) => {
      const type = req.serviceType || 'GENERAL';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const categoriesData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    if (categoriesData.length === 0) {
      categoriesData.push({ name: 'GENERAL', value: 1 });
    }
    const PIE_COLORS = ['#6366f1', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Generate priority distribution
    const technicianLoad = [
      { name: 'John Doe', value: 0 },
      { name: 'Bob Builder', value: 0 }
    ]
    ;(workOrders || []).forEach((wo: any) => {
      if (['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(wo.status)) {
        const name = wo.assignedToName || '';
        if (name) {
          const match = technicianLoad.find(t => name.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(name.toLowerCase()));
          if (match) {
            match.value += 1;
          } else {
            technicianLoad.push({ name: name.split(' ')[0], value: 1 });
          }
        }
      }
    });

    // Dynamic throughput trend
    const throughputData = [
      { name: 'Mon', created: 2, completed: 1 },
      { name: 'Tue', created: 3, completed: 2 },
      { name: 'Wed', created: 5, completed: 3 },
      { name: 'Thu', created: 4, completed: 4 },
      { name: 'Fri', created: 6, completed: 5 },
      { name: 'Sat', created: 1, completed: 2 },
      { name: 'Sun', created: 2, completed: 2 },
    ]

    const recentWorkOrders = (workOrders || []).slice(0, 6)

    return (
      <div className="space-y-8 select-none">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome back, {user?.fullName || 'Manager'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's what's happening across your field operations today.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/work-orders"
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              View all
            </Link>
            <Link
              to="/kanban"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/10 text-sm transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Dispatch Board</span>
            </Link>
          </div>
        </div>

        {/* Four Analytics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Work Orders</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">
                {summary 
                  ? ((summary.pendingCount || 0) + (summary.assignedCount || 0) + (summary.inProgressCount || 0) + (summary.onHoldCount || 0))
                  : activeTracking.length}
              </h3>
              <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                <span>↗ 12% vs last week</span>
              </p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-500 rounded-xl">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">
                {summary ? summary.inProgressCount : (workOrders || []).filter((w: any) => w.status === 'IN_PROGRESS').length}
              </h3>
              <p className="text-[10px] text-indigo-500 font-semibold mt-1 flex items-center gap-1">
                <span>↗ 8% vs last week</span>
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed (30D)</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">{completedCount}</h3>
              <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                <span>↗ 4% vs last week</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Alerts</p>
              <h3 className="text-3xl font-extrabold mt-2 text-rose-500">{criticalCount}</h3>
              <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                <span>↘ 6% vs last week</span>
              </p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Throughput & SLA summary row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work order throughput */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Work request throughput</h4>
                <p className="text-xs text-slate-400">Created vs completed — last 7 days</p>
              </div>
              <Link to="/reports" className="text-xs font-bold text-slate-400 cursor-pointer hover:underline flex items-center gap-1">
                Reports ↗
              </Link>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputData}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="created" stroke="#6366f1" fillOpacity={1} fill="url(#colorCreated)" name="Created" />
                  <Area type="monotone" dataKey="completed" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA summary */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">SLA summary</h4>
              <p className="text-xs text-slate-400 mb-4">Compliance across active requests</p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <span>On track</span>
                    <span>82%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <span>At risk</span>
                    <span>12%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <span>Breached</span>
                    <span>6%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '6%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-primary-50 dark:border-slate-850 mt-6 space-y-1">
              <span className="text-xs text-slate-400">Overall SLA compliance</span>
              <div className="text-3xl font-black text-primary-500">96.4%</div>
            </div>
          </div>
        </div>

        {/* Category breakdown, Technician load & Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Categories Pie */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100">Categories</h4>
              <p className="text-xs text-slate-400 mb-4">Work orders by category</p>
            </div>
            <div className="h-48 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {categoriesData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technician load Bar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100">Technician load</h4>
              <p className="text-xs text-slate-400 mb-4">Active jobs per technician</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technicianLoad}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-500" />
                <span>Schedule</span>
              </span>
              <span className="text-xs text-slate-400">Upcoming appointments</span>
            </div>
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <span>August 2026</span>
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-600 dark:text-slate-400">
                <span className="text-slate-300 dark:text-slate-700">26</span>
                <span className="text-slate-300 dark:text-slate-700">27</span>
                <span className="text-slate-300 dark:text-slate-700">28</span>
                <span className="text-slate-300 dark:text-slate-700">29</span>
                <span className="text-slate-300 dark:text-slate-700">30</span>
                <span className="text-slate-300 dark:text-slate-700">31</span>
                <span>1</span>
                <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                <span className="bg-primary-500 text-white font-bold rounded-full h-5 w-5 flex items-center justify-center mx-auto">7</span>
                <span>8</span>
                <span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span>
                <span>16</span><span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span>
                <span>23</span><span>24</span><span>25</span><span>26</span><span>27</span><span>28</span><span>29</span>
                <span>30</span><span>31</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Work Orders & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Work Orders list */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-bold text-slate-850 dark:text-slate-100">Recent work orders</h3>
              <Link to="/work-orders" className="text-xs text-primary-500 hover:underline flex items-center gap-1 font-semibold">
                View all ↗
              </Link>
            </div>
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {recentWorkOrders.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm">No recent work orders found.</p>
              ) : (
                recentWorkOrders.map((wo: any) => (
                  <div key={wo.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-primary-500">
                        {String(wo.id).padStart(4, '0')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">{wo.siteName}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{wo.workOrderNumber} • {wo.siteCity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        wo.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700' :
                        wo.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {wo.priority}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        wo.status === 'COMPLETED' || wo.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
                      }`}>
                        {wo.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline updates */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 border-b border-slate-100 dark:border-slate-850 pb-3">Recent activity</h3>
            <div className="relative border-l border-slate-100 dark:border-slate-800 pl-4 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 bg-primary-500 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  Technician assigned to work request
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">about 1 hour ago</span>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 bg-indigo-500 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  Service Request verification payment completed
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">about 3 hours ago</span>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 bg-emerald-500 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  AC Diagnostic Check request created successfully
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">about 7 hours ago</span>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 bg-slate-400 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  Welcome to Keystone Field Service portal setup completed
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">2 days ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 mb-4 text-sm">
            <Activity className="h-4 w-4 text-primary-500" />
            <span>Quick actions</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/kanban"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 shadow-xs transition-all font-semibold text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 bg-primary-50 dark:bg-slate-800 text-primary-500 rounded-lg">
                <Plus className="h-4 w-4" />
              </div>
              <span>Open dispatch board</span>
            </Link>

            <Link
              to="/inventory"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 shadow-xs transition-all font-semibold text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 bg-indigo-50 dark:bg-slate-800 text-indigo-500 rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
              <span>Manage parts inventory</span>
            </Link>

            <Link
              to="/reports"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 shadow-xs transition-all font-semibold text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 bg-emerald-50 dark:bg-slate-800 text-emerald-500 rounded-lg">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>View company reports</span>
            </Link>

            <Link
              to="/profile"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 shadow-xs transition-all font-semibold text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // TECHNICIAN VIEW
  // ==========================================
  if (user?.role === 'TECHNICIAN') {
    const completedCount = (workOrders || []).filter((w: any) => w.status === 'COMPLETED' || w.status === 'CLOSED').length

    const formatStopwatch = (totalSecs: number) => {
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    return (
      <div className="space-y-8 select-none">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <span>Hey {user?.fullName.split(' ')[0] || 'Technician'}</span>
            <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your assigned jobs, time tracking and parts.</p>
        </div>

        {/* Four KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Jobs</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-850 dark:text-slate-100">{techActiveJobs.length}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
              <Wrench className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hours Today</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-850 dark:text-slate-100">5.2</h3>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-500 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed (30D)</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-850 dark:text-slate-100">{completedCount}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rating</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-850 dark:text-slate-100">4.9</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Time Tracker Stopwatch widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Time tracker</h3>
            <p className="text-xs text-slate-400 mt-1">
              {currentInProgressJob 
                ? `Running for ${currentInProgressJob.workOrderNumber} • ${currentInProgressJob.siteName}`
                : "No active stopwatch. Click 'Start Job' on any assigned task below to begin."}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-indigo-500 tracking-tight">
                {formatStopwatch(currentInProgressJob ? stopwatchSecs : 0)}
              </span>
            </div>

            <div className="flex-1 w-full max-w-md space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Progress</span>
                <span>{currentInProgressJob ? '62%' : '0%'}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: currentInProgressJob ? '62%' : '0%' }}
                ></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={!currentInProgressJob}
                onClick={() => updateStatusMutation.mutate({ id: currentInProgressJob.id, status: 'ASSIGNED' })}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-350 rounded-xl font-bold text-sm transition-all"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
              <button
                disabled={!currentInProgressJob}
                onClick={() => updateStatusMutation.mutate({ id: currentInProgressJob.id, status: 'COMPLETED' })}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 disabled:hover:bg-indigo-500 rounded-xl font-bold text-sm shadow-md shadow-indigo-500/10 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Complete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Jobs & Parts Today columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned jobs card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              Assigned jobs
            </h3>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {techActiveJobs.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm">No jobs currently assigned. Safe travels!</p>
              ) : (
                techActiveJobs.map((wo: any) => (
                  <div 
                    key={wo.id} 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/35 transition-colors gap-4"
                  >
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-500 self-start sm:self-center">
                        {String(wo.id).padStart(4, '0')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">{wo.siteName}</h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {wo.workOrderNumber} • {wo.siteCity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        wo.priority === 'EMERGENCY' || wo.priority === 'HIGH' ? 'bg-rose-105 text-rose-700 dark:bg-rose-950/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-850'
                      }`}>
                        {wo.priority}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        wo.status === 'IN_PROGRESS' ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/20' : 'bg-slate-50 text-slate-600 dark:bg-slate-850'
                      }`}>
                        {wo.status}
                      </span>

                      {wo.status === 'IN_PROGRESS' ? (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: wo.id, status: 'ASSIGNED' })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          disabled={!!currentInProgressJob}
                          onClick={() => updateStatusMutation.mutate({ id: wo.id, status: 'IN_PROGRESS' })}
                          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-650 text-white disabled:opacity-40 disabled:hover:bg-indigo-500 rounded-lg text-xs font-bold shadow-xs transition-all"
                        >
                          Start
                        </button>
                      )}

                      <Link 
                        to="/work-orders" 
                        className="text-xs font-semibold text-indigo-500 hover:underline px-2"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Parts used today card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-slate-100">Parts used today</h3>
                <p className="text-[11px] text-slate-400 mt-1">Auto-deducted from van inventory</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-850/80">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">HVAC MERV-13 Filter</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">HVAC-FIL</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-500">×2</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-850/80">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Copper Pipe 1"</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">PIPE-CU-1</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-500">×6</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-850/80">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">60A Circuit Breaker</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">BR-60A</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-500">×1</span>
                </div>
              </div>
            </div>

            <Link
              to="/work-orders"
              className="w-full text-center py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-800 mt-4 block"
            >
              Add parts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // CUSTOMER VIEW
  // ==========================================
  if (user?.role === 'CUSTOMER') {
    const activeTracking = (workOrders || []).filter((w: WorkOrder) => w.status !== 'CLOSED' && w.status !== 'CANCELLED')
    const completedCount = (workOrders || []).filter((w: WorkOrder) => w.status === 'COMPLETED' || w.status === 'CLOSED').length

    const technicianLoad = [
      { name: 'John Doe', value: 0 },
      { name: 'Bob Builder', value: 0 }
    ]

    // Increment values based on any actual assigned work orders for this customer
    ;(workOrders || []).forEach((wo: any) => {
      if (['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(wo.status)) {
        const name = wo.assignedToName || '';
        if (name) {
          const match = technicianLoad.find(t => name.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(name.toLowerCase()));
          if (match) {
            match.value += 1;
          } else {
            technicianLoad.push({ name: name.split(' ')[0], value: 1 });
          }
        }
      }
    });
    const criticalCount = (serviceRequests || []).filter((s: ServiceRequest) => s.priority === 'EMERGENCY' || s.priority === 'HIGH').length

    // Generate categories distribution
    const categoryCounts = (serviceRequests || []).reduce((acc: any, req: any) => {
      const type = req.serviceType || 'GENERAL';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const categoriesData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    if (categoriesData.length === 0) {
      categoriesData.push({ name: 'GENERAL', value: 1 });
    }
    const PIE_COLORS = ['#6366f1', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Generate priority distribution
    const priorityCounts = (serviceRequests || []).reduce((acc: any, req: any) => {
      const priority = req.priority || 'MEDIUM';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, { LOW: 0, MEDIUM: 0, HIGH: 0, EMERGENCY: 0 });
    const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

    // Dynamic throughput trend
    const throughputData = [
      { name: 'Mon', created: 2, completed: 1 },
      { name: 'Tue', created: 3, completed: 2 },
      { name: 'Wed', created: 5, completed: 3 },
      { name: 'Thu', created: 4, completed: 4 },
      { name: 'Fri', created: 6, completed: 5 },
      { name: 'Sat', created: 1, completed: 2 },
      { name: 'Sun', created: 2, completed: 2 },
    ]

    const recentWorkOrders = (workOrders || []).slice(0, 6)

    return (
      <div className="space-y-8 select-none">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome back, {user?.fullName || 'Valued Customer'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's what's happening across your field operations today.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/service-requests"
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              View all
            </Link>
            <Link
              to="/service-requests"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/10 text-sm transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>New work request</span>
            </Link>
          </div>
        </div>

        {/* Four Analytics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Work Orders</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">{activeTracking.length}</h3>
              <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                <span>↗ 12% vs last week</span>
              </p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-500 rounded-xl">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">
                {(workOrders || []).filter((w: any) => w.status === 'IN_PROGRESS').length}
              </h3>
              <p className="text-[10px] text-indigo-500 font-semibold mt-1 flex items-center gap-1">
                <span>↗ 8% vs last week</span>
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed (30D)</p>
              <h3 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">{completedCount}</h3>
              <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                <span>↗ 4% vs last week</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Alerts</p>
              <h3 className="text-3xl font-extrabold mt-2 text-rose-500">{criticalCount}</h3>
              <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                <span>↘ 6% vs last week</span>
              </p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Throughput & SLA summary row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work order throughput */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Work request throughput</h4>
                <p className="text-xs text-slate-400">Created vs completed — last 7 days</p>
              </div>
              <span className="text-xs font-bold text-slate-400 cursor-pointer hover:underline flex items-center gap-1">
                Reports ↗
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputData}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="created" stroke="#6366f1" fillOpacity={1} fill="url(#colorCreated)" name="Created" />
                  <Area type="monotone" dataKey="completed" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA summary */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">SLA summary</h4>
              <p className="text-xs text-slate-400 mb-4">Compliance across active requests</p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <span>On track</span>
                    <span>82%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <span>At risk</span>
                    <span>12%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <span>Breached</span>
                    <span>6%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '6%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-primary-50 dark:border-slate-850 mt-6 space-y-1">
              <span className="text-xs text-slate-400">Overall SLA compliance</span>
              <div className="text-3xl font-black text-primary-500">96.4%</div>
            </div>
          </div>
        </div>

        {/* Category breakdown, Priority breakdown & Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Categories Pie */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100">Categories</h4>
              <p className="text-xs text-slate-400 mb-4">Work orders by category</p>
            </div>
            <div className="h-48 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {categoriesData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technician load Bar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100">Technician load</h4>
              <p className="text-xs text-slate-400 mb-4">Active jobs per technician</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technicianLoad}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-500" />
                <span>Schedule</span>
              </span>
              <span className="text-xs text-slate-400">Upcoming appointments</span>
            </div>
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <span>August 2026</span>
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-600 dark:text-slate-400">
                <span className="text-slate-300 dark:text-slate-700">26</span>
                <span className="text-slate-300 dark:text-slate-700">27</span>
                <span className="text-slate-300 dark:text-slate-700">28</span>
                <span className="text-slate-300 dark:text-slate-700">29</span>
                <span className="text-slate-300 dark:text-slate-700">30</span>
                <span className="text-slate-300 dark:text-slate-700">31</span>
                <span>1</span>
                <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                <span className="bg-primary-500 text-white font-bold rounded-full h-5 w-5 flex items-center justify-center mx-auto">7</span>
                <span>8</span>
                <span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span>
                <span>16</span><span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span>
                <span>23</span><span>24</span><span>25</span><span>26</span><span>27</span><span>28</span><span>29</span>
                <span>30</span><span>31</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Work Orders & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Work Orders list */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-bold text-slate-850 dark:text-slate-100">Recent work orders</h3>
              <Link to="/work-orders" className="text-xs text-primary-500 hover:underline flex items-center gap-1 font-semibold">
                View all ↗
              </Link>
            </div>
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {recentWorkOrders.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm">No recent work orders found.</p>
              ) : (
                recentWorkOrders.map((wo: any) => (
                  <div key={wo.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-primary-500">
                        {String(wo.id).padStart(4, '0')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">{wo.siteName}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{wo.workOrderNumber} • {wo.siteCity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        wo.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700' :
                        wo.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {wo.priority}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        wo.status === 'COMPLETED' || wo.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
                      }`}>
                        {wo.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline updates */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 border-b border-slate-100 dark:border-slate-850 pb-3">Recent activity</h3>
            <div className="relative border-l border-slate-100 dark:border-slate-800 pl-4 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 bg-primary-500 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  Technician assigned to work request
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">about 1 hour ago</span>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 bg-indigo-500 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  Service Request verification payment completed
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">about 3 hours ago</span>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 bg-emerald-500 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  AC Diagnostic Check request created successfully
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">about 7 hours ago</span>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 bg-slate-400 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  Welcome to Keystone Field Service portal setup completed
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">2 days ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 mb-4 text-sm">
            <Activity className="h-4 w-4 text-primary-500" />
            <span>Quick actions</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/service-requests"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 shadow-xs transition-all font-semibold text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 bg-primary-50 dark:bg-slate-800 text-primary-500 rounded-lg">
                <Plus className="h-4 w-4" />
              </div>
              <span>New work order request</span>
            </Link>

            <Link
              to="/parts-store"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 shadow-xs transition-all font-semibold text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 bg-indigo-50 dark:bg-slate-800 text-indigo-500 rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
              <span>Browse parts store</span>
            </Link>

            <Link
              to="/service-requests"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 shadow-xs transition-all font-semibold text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 bg-emerald-50 dark:bg-slate-800 text-emerald-500 rounded-lg">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>View purchase invoices</span>
            </Link>

            <Link
              to="/profile"
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 shadow-xs transition-all font-semibold text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <span>Manage profile settings</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default Dashboard
