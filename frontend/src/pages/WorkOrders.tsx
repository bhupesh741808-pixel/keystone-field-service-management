import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { WorkOrder, TimeLog, PartUsage, Attachment, StatusHistory, Part } from '../types'
import { 
  Search, Clipboard, Calendar, Clock, Wrench, FilePlus, 
  MapPin, Eye, CheckCircle, RefreshCw, X, Play, Pause, Save 
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'

interface TimeLogInput {
  minutes: string;
  notes: string;
}

interface PartUsageInput {
  partId: string;
  quantity: string;
}

const WorkOrders: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)

  // Sub-sections loaders
  const [showLogTime, setShowLogTime] = useState(false)
  const [showLogParts, setShowLogParts] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const { register: registerTime, handleSubmit: handleSubmitTime, reset: resetTime } = useForm<TimeLogInput>()
  const { register: registerPart, handleSubmit: handleSubmitPart, reset: resetPart } = useForm<PartUsageInput>()

  const isTechnician = user?.role === 'TECHNICIAN'
  const isManager = user?.role === 'MANAGER'
  const isStaff = ['MANAGER', 'DISPATCHER'].includes(user?.role || '')

  // Fetch Work Orders
  const { data: woData, isLoading } = useQuery<any>({
    queryKey: ['workOrders', statusFilter, searchTerm],
    queryFn: async () => {
      const res = await api.get('/work-orders', {
        params: {
          status: statusFilter || undefined,
          search: searchTerm || undefined,
          size: 100
        }
      })
      return res.data.content
    }
  })

  // Fetch Details sub-queries
  const { data: timeLogs = [] } = useQuery<TimeLog[]>({
    queryKey: ['timeLogs', selectedWO?.id],
    queryFn: async () => {
      const res = await api.get(`/work-orders/${selectedWO?.id}/timelogs`)
      return res.data
    },
    enabled: !!selectedWO?.id
  })

  const { data: partsUsed = [] } = useQuery<PartUsage[]>({
    queryKey: ['partsUsed', selectedWO?.id],
    queryFn: async () => {
      const res = await api.get(`/work-orders/${selectedWO?.id}/parts`)
      return res.data
    },
    enabled: !!selectedWO?.id
  })

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['attachments', selectedWO?.id],
    queryFn: async () => {
      const res = await api.get(`/work-orders/${selectedWO?.id}/attachments`)
      return res.data
    },
    enabled: !!selectedWO?.id
  })

  const { data: statusHistory = [] } = useQuery<StatusHistory[]>({
    queryKey: ['statusHistory', selectedWO?.id],
    queryFn: async () => {
      const res = await api.get(`/work-orders/${selectedWO?.id}/history`)
      return res.data
    },
    enabled: !!selectedWO?.id
  })

  // Fetch Inventory for dropdown
  const { data: inventory = [] } = useQuery<Part[]>({
    queryKey: ['parts'],
    queryFn: async () => {
      const res = await api.get('/parts')
      return res.data
    },
    enabled: showLogParts
  })

  // Update status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return api.post(`/work-orders/${id}/status`, { status })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      queryClient.invalidateQueries({ queryKey: ['statusHistory', selectedWO?.id] })
      setSelectedWO(res.data)
      toast.success('Status updated successfully!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Illegal state transition'
      toast.error(msg)
    }
  })

  // Log Time Mutation
  const logTimeMutation = useMutation({
    mutationFn: async (log: any) => {
      return api.post(`/work-orders/${selectedWO?.id}/timelog`, log)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs', selectedWO?.id] })
      toast.success('Hours logged successfully!')
      setShowLogTime(false)
      resetTime()
    }
  })

  // Log Part Mutation
  const logPartMutation = useMutation({
    mutationFn: async (usage: any) => {
      return api.post(`/work-orders/${selectedWO?.id}/parts`, usage)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partsUsed', selectedWO?.id] })
      toast.success('Parts registered successfully!')
      setShowLogParts(false)
      resetPart()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to log parts usage'
      toast.error(msg)
    }
  })

  const handleStatusChange = (status: string) => {
    if (!selectedWO) return
    updateStatusMutation.mutate({ id: selectedWO.id, status })
  }

  const handleLogTime = (data: TimeLogInput) => {
    logTimeMutation.mutate({
      minutes: parseInt(data.minutes),
      notes: data.notes
    })
  }

  const handleLogPart = (data: PartUsageInput) => {
    logPartMutation.mutate({
      partId: parseInt(data.partId),
      quantity: parseInt(data.quantity)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedWO) return
    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post(`/work-orders/${selectedWO.id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      queryClient.invalidateQueries({ queryKey: ['attachments', selectedWO.id] })
      toast.success('File uploaded successfully!')
    } catch (err) {
      toast.error('File upload failed')
    } finally {
      setUploadingFile(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search work order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-48 text-slate-800 dark:text-slate-100"
        >
          <option value="">All Statuses</option>
          <option value="NEW">NEW</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="ON_HOLD">ON HOLD</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CLOSED">CLOSED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Grid of Work Orders */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading work orders...</div>
      ) : (woData || []).length === 0 ? (
        <div className="p-8 text-center text-slate-400">No work orders match the filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(woData || []).map((wo: WorkOrder) => (
            <div key={wo.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 tracking-wider font-mono">{wo.workOrderNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    wo.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    wo.status === 'CLOSED' ? 'bg-slate-200 text-slate-700' :
                    wo.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {wo.status}
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 mt-2 truncate">{wo.customerName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary-500" />
                  <span>{wo.siteName} - {wo.siteCity}</span>
                </p>
                <div className="mt-4 flex gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Due: {wo.slaDueDate ? new Date(wo.slaDueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[100px]">{wo.assignedToName || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedWO(wo)}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>Open Job Card</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal/Drawer */}
      {selectedWO && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-screen overflow-y-auto flex flex-col p-6 shadow-2xl border-l border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-400 tracking-wider font-mono">{selectedWO.workOrderNumber}</span>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 mt-1">{selectedWO.customerName}</h3>
              </div>
              <button onClick={() => setSelectedWO(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-6 py-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Priority</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedWO.priority}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Status</span>
                  <span className="font-semibold text-primary-500">{selectedWO.status}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Technician</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedWO.assignedToName || 'Hold/Unassigned'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">SLA Due Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedWO.slaDueDate ? new Date(selectedWO.slaDueDate).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Status Actions (Technician & Managers) */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">Job Control Console</h4>
                <div className="flex flex-wrap gap-2">
                  {/* Technician start/stop */}
                  {isTechnician && selectedWO.status === 'ASSIGNED' && (
                    <button onClick={() => handleStatusChange('IN_PROGRESS')} className="flex items-center gap-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors">
                      <Play className="h-4 w-4" /> Start Work
                    </button>
                  )}
                  {isTechnician && selectedWO.status === 'IN_PROGRESS' && (
                    <>
                      <button onClick={() => handleStatusChange('ON_HOLD')} className="flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        <Pause className="h-4 w-4" /> Place On Hold
                      </button>
                      <button onClick={() => handleStatusChange('COMPLETED')} className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors">
                        <CheckCircle className="h-4 w-4" /> Complete Job
                      </button>
                    </>
                  )}
                  {isTechnician && selectedWO.status === 'ON_HOLD' && (
                    <button onClick={() => handleStatusChange('IN_PROGRESS')} className="flex items-center gap-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors">
                      <Play className="h-4 w-4" /> Resume Work
                    </button>
                  )}
                  {/* Manager close out */}
                  {isManager && selectedWO.status === 'COMPLETED' && (
                    <button onClick={() => handleStatusChange('CLOSED')} className="flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors">
                      <CheckCircle className="h-4 w-4" /> Approve & Close Ticket
                    </button>
                  )}
                  {/* Dispatcher/Manager Cancel */}
                  {isStaff && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(selectedWO.status) && (
                    <button onClick={() => handleStatusChange('CANCELLED')} className="flex items-center gap-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors">
                      <X className="h-4 w-4" /> Cancel Job
                    </button>
                  )}
                </div>
              </div>

              {/* Time Logging */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Labour Time Logs</h4>
                  {(isTechnician || isManager) && (
                    <button onClick={() => setShowLogTime(!showLogTime)} className="text-xs text-primary-500 hover:underline">
                      Log Hours
                    </button>
                  )}
                </div>

                {showLogTime && (
                  <form onSubmit={handleSubmitTime(handleLogTime)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400">Duration (Minutes)</label>
                        <input type="number" {...registerTime('minutes')} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400">Task Notes</label>
                        <input type="text" {...registerTime('notes')} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
                      </div>
                    </div>
                    <button type="submit" className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded text-xs font-semibold transition-colors">
                      Save Log
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {timeLogs.length === 0 ? <p className="text-xs text-slate-400">No labor hours recorded.</p> : timeLogs.map(log => (
                    <div key={log.id} className="flex justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{log.technicianName}</span>
                        <p className="text-slate-400 mt-0.5">{log.notes || 'Routine repairs'}</p>
                      </div>
                      <span className="font-bold text-slate-600 dark:text-slate-400">{log.minutes} mins</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spare Parts Consumed */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Inventory Parts Consumed</h4>
                  {(isTechnician || isManager) && (
                    <button onClick={() => setShowLogParts(!showLogParts)} className="text-xs text-primary-500 hover:underline">
                      Add Parts
                    </button>
                  )}
                </div>

                {showLogParts && (
                  <form onSubmit={handleSubmitPart(handleLogPart)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400">Select Part</label>
                        <select {...registerPart('partId')} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          <option value="">Choose Part...</option>
                          {inventory.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400">Quantity Consumed</label>
                        <input type="number" {...registerPart('quantity')} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
                      </div>
                    </div>
                    <button type="submit" className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded text-xs font-semibold transition-colors">
                      Register Consumed
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {partsUsed.length === 0 ? <p className="text-xs text-slate-400">No replacement parts logged.</p> : partsUsed.map(use => (
                    <div key={use.id} className="flex justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{use.partName}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">SKU: {use.partSku} @ ${use.price.toFixed(2)}/unit</p>
                      </div>
                      <span className="font-bold text-slate-600 dark:text-slate-400">Qty: {use.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo Attachments */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Job Site Photos & Invoices</h4>
                  <label className="text-xs text-primary-500 hover:underline cursor-pointer">
                    {uploadingFile ? 'Uploading...' : 'Upload File'}
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {attachments.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-3">No photos uploaded for this job card.</p>
                  ) : (
                    attachments.map(att => (
                      <div key={att.id} className="p-2 border border-slate-200/50 rounded-lg flex flex-col items-center bg-slate-50 dark:bg-slate-800/40 justify-center text-center">
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full">{att.fileName}</span>
                        <span className="text-[8px] text-slate-400 mt-1">{new Date(att.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status History Logs */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">State Transition Log</h4>
                <div className="space-y-3 border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
                  {statusHistory.map(hist => (
                    <div key={hist.id} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary-500"></div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {hist.previousStatus ? `${hist.previousStatus} ➜ ` : 'CREATED as '} {hist.currentStatus}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">By: {hist.changedBy} on {new Date(hist.changedAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkOrders
