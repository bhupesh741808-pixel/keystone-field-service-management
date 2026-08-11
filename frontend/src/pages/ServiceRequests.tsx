import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { ServiceRequest, Customer, Site } from '../types'
import { Plus, Search, Check, AlertCircle, X, ArrowRight, CreditCard, CheckCircle2, Printer } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import InvoiceModal from '../components/InvoiceModal'

interface RequestFormInput {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  serviceType: string;
  customerId?: string; // Prefilled for customers, selected for dispatchers
}

interface ApproveFormInput {
  siteId: string;
  assignedToId?: string;
  slaDueDate?: string;
}

const ServiceRequests: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Prefill/Workorder conversion modal states
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [invoicePurchase, setInvoicePurchase] = useState<any | null>(null)

  const handleViewInvoice = (req: ServiceRequest) => {
    setInvoicePurchase({
      id: req.id,
      customerName: req.customerName || user?.fullName || 'Keystone Customer',
      partName: `${req.title} [${req.priority} PRIORITY]`,
      partSku: `SRV-${req.serviceType || 'GENERAL'}`,
      quantity: 1,
      amount: req.amount || 1000.00,
      status: req.paymentStatus === 'PAID' ? 'SUCCESS' : 'PENDING',
      createdAt: req.createdAt,
      razorpayOrderId: req.razorpayOrderId,
      razorpayPaymentId: req.razorpayPaymentId
    })
    setIsInvoiceOpen(true)
  }

  const isCustomer = user?.role === 'CUSTOMER'
  const isStaff = ['MANAGER', 'DISPATCHER'].includes(user?.role || '')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RequestFormInput>({
    defaultValues: {
      serviceType: 'GENERAL',
      priority: 'LOW'
    }
  })
  const { register: registerApprove, handleSubmit: handleSubmitApprove, reset: resetApprove } = useForm<ApproveFormInput>()

  // Fetch Service Requests
  const { data: requests = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ['serviceRequests'],
    queryFn: async () => {
      const url = isCustomer ? `/service-requests/customer/${user?.customerId}` : '/service-requests'
      const res = await api.get(url)
      return res.data
    }
  })

  // Customers for Dispatchers raising requests on behalf of customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers')
      return res.data
    },
    enabled: isStaff
  })

  // Sites for selected request's customer
  const { data: requestSites = [] } = useQuery<Site[]>({
    queryKey: ['requestSites', selectedReq?.customerId],
    queryFn: async () => {
      const res = await api.get(`/sites/customer/${selectedReq?.customerId}`)
      return res.data
    },
    enabled: !!selectedReq?.customerId && isApproveModalOpen
  })

  // Technicians for assignment dropdown
  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ['technicians'],
    queryFn: async () => {
      const res = await api.get('/users')
      return res.data.filter((u: any) => u.role === 'TECHNICIAN' && u.active)
    },
    enabled: isStaff
  })

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async (req: ServiceRequest) => {
    if (!req.razorpayOrderId) {
      toast.error('Payment order details not found')
      return
    }

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      toast.error('Failed to load payment gateway')
      return
    }

    const amountInPaise = req.priority === 'LOW' ? 50000 :
                          req.priority === 'MEDIUM' ? 100000 :
                          req.priority === 'HIGH' ? 150000 : 200000;

    const options = {
      key: 'rzp_test_SlyBOZGo80GDoa',
      amount: amountInPaise,
      currency: 'INR',
      name: 'Keystone FSM Service Fee',
      description: `Service Request: ${req.title}`,
      order_id: req.razorpayOrderId,
      handler: async function (response: any) {
        try {
          await api.post('/service-requests/verify', {
            serviceRequestId: req.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          })
          
          toast.success('Payment successful! Request auto-assigned to technician.')
          queryClient.invalidateQueries({ queryKey: ['serviceRequests'] })
          queryClient.invalidateQueries({ queryKey: ['myWorkOrders'] })
        } catch (err: any) {
          toast.error('Payment signature verification failed')
        }
      },
      prefill: {
        name: user?.fullName,
        email: user?.email,
        contact: user?.phone || '555-0100'
      },
      theme: {
        color: '#0ea5e9'
      }
    }

    const rzpay = new (window as any).Razorpay(options)
    rzpay.open()
  }

  // Create Service Request
  const createRequestMutation = useMutation({
    mutationFn: async (newReq: any) => {
      return api.post('/service-requests', newReq)
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] })
      closeModal()
      
      const created = res.data
      if (isCustomer && created.razorpayOrderId) {
        toast.info('Initiating payment checkout...')
        handlePayment(created)
      } else {
        toast.success('Service request raised successfully!')
      }
    }
  })

  // Create Work Order from Approved Request
  const createWorkOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/work-orders', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] })
      queryClient.invalidateQueries({ queryKey: ['myWorkOrders'] })
      toast.success('Service request approved & Work Order created!')
      closeApproveModal()
    }
  })

  const openModal = () => {
    reset()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    reset()
  }

  const openApproveModal = (req: ServiceRequest) => {
    setSelectedReq(req)
    resetApprove()
    setIsApproveModalOpen(true)
  }

  const closeApproveModal = () => {
    setIsApproveModalOpen(false)
    setSelectedReq(null)
    resetApprove()
  }

  const onSubmit = (data: RequestFormInput) => {
    const payload = {
      ...data,
      customerId: isCustomer ? user?.customerId : (data.customerId ? parseInt(data.customerId) : null)
    }
    createRequestMutation.mutate(payload)
  }

  const onSubmitApprove = (data: ApproveFormInput) => {
    if (!selectedReq) return

    const payload = {
      requestId: selectedReq.id,
      customerId: selectedReq.customerId,
      siteId: parseInt(data.siteId),
      assignedToId: data.assignedToId ? parseInt(data.assignedToId) : null,
      priority: selectedReq.priority,
      slaDueDate: data.slaDueDate || null
    }

    createWorkOrderMutation.mutate(payload)
  }

  const filtered = requests.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.customerName && r.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search request title or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/10 text-sm transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Raise Service Request</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No service requests filed.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-850 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Title & Details</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Filed</th>
                  {(isStaff || isCustomer) && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">{req.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm truncate">{req.description || 'No description provided'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{req.customerName || 'Self Registration'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400">
                        {req.serviceType || 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-semibold text-primary-500">{req.status}</div>
                      {req.paymentStatus && (
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                          req.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}>
                          {req.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                    {isStaff && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {req.status === 'NEW' ? (
                            <button
                              onClick={() => openApproveModal(req)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              <span>Approve</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Processed</span>
                          )}
                          {req.paymentStatus === 'PAID' && (
                            <button
                              onClick={() => handleViewInvoice(req)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Invoice</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    {isCustomer && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {req.paymentStatus === 'UNPAID' ? (
                            <button
                              onClick={() => handlePayment(req)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Pay Now</span>
                            </button>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Auto-Assigned</span>
                              </span>
                              <button
                                onClick={() => handleViewInvoice(req)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Invoice</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-850">
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Raise Service Request</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {isStaff && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Customer Account</label>
                  <select
                    {...register('customerId', { required: 'Please select a customer account' })}
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                  {errors.customerId && <p className="text-xs text-rose-500 mt-1">{errors.customerId.message}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Request Title</label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Server AC blowing hot air"
                />
                {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Detailed Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Provide zones, equipment types, or detail code..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Service Priority</label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="LOW">LOW - General Maintenance</option>
                  <option value="MEDIUM">MEDIUM - Repair scheduled</option>
                  <option value="HIGH">HIGH - Operation impact</option>
                  <option value="EMERGENCY">EMERGENCY - Action required immediately</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Service Type</label>
                <select
                  {...register('serviceType', { required: 'Service Type is required' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="GENERAL">General Maintenance</option>
                  <option value="HVAC">HVAC / Heating & Cooling</option>
                  <option value="PLUMBING">Plumbing & Water</option>
                  <option value="ELECTRICAL">Electrical & Power</option>
                  <option value="IT">IT & Network Infrastructure</option>
                  <option value="CARPENTRY">Carpentry & Woodwork</option>
                  <option value="CLEANING">Cleaning & Janitorial</option>
                  <option value="PEST_CONTROL">Pest Control</option>
                  <option value="SECURITY">Security & Access Control</option>
                  <option value="FIRE_SAFETY">Fire & Alarm Systems</option>
                  <option value="APPLIANCE">Appliance & Equipment Repair</option>
                  <option value="LANDSCAPING">Landscaping & Grounds</option>
                  <option value="PAINTING">Painting & Drywall</option>
                  <option value="ELEVATOR">Elevator & Escalator</option>
                  <option value="ROOFING">Roofing & Exterior</option>
                  <option value="LOCKSMITH">Locksmith & Keying</option>
                  <option value="FURNITURE">Furniture & Office Moving</option>
                  <option value="WASTE_MANAGEMENT">Waste & Recycling</option>
                  <option value="TELECOM">Telecommunications & AV</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert/Approve to Workorder Modal */}
      {isApproveModalOpen && selectedReq && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-850">
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Approve & Dispatch Work Order</h3>
              <button onClick={closeApproveModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitApprove(onSubmitApprove)} className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Request</span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">{selectedReq.title}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Type: <span className="font-semibold text-sky-500">{selectedReq.serviceType || 'GENERAL'}</span> | Priority: <span className="font-semibold text-rose-500">{selectedReq.priority}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Select Customer Site Location</label>
                <select
                  {...registerApprove('siteId', { required: 'Please select a site location' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Site...</option>
                  {requestSites.map(s => (
                    <option key={s.id} value={s.id}>{s.siteName} ({s.address})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Assign Dispatch Technician (Optional)</label>
                <select
                  {...registerApprove('assignedToId')}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Hold in Queue (Unassigned)</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} (Tech)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">SLA Due Date (Optional)</label>
                <input
                  type="datetime-local"
                  {...registerApprove('slaDueDate')}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeApproveModal}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        purchase={invoicePurchase}
      />
    </div>
  )
}

export default ServiceRequests
