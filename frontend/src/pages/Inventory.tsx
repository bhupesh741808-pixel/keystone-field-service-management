import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Part } from '../types'
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Printer } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import InvoiceModal from '../components/InvoiceModal'

interface PartFormInput {
  name: string;
  sku: string;
  price: string;
  quantity: string;
}

const Inventory: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'purchases'>('stock')
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [invoicePurchase, setInvoicePurchase] = useState<any | null>(null)

  const handleViewInvoice = (sale: any) => {
    setInvoicePurchase(sale)
    setIsInvoiceOpen(true)
  }

  const isManager = user?.role === 'MANAGER'

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PartFormInput>()

  // Fetch Parts
  const { data: parts = [], isLoading } = useQuery<Part[]>({
    queryKey: ['parts'],
    queryFn: async () => {
      const res = await api.get('/parts')
      return res.data
    }
  })

  // Fetch Customer Sales/Purchases
  const { data: sales = [], isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ['allPurchases'],
    queryFn: async () => {
      const res = await api.get('/payments/all')
      return res.data
    },
    enabled: activeTab === 'purchases'
  })

  // Create
  const createMutation = useMutation({
    mutationFn: async (newPart: any) => {
      return api.post('/parts', newPart)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      toast.success('Part added to inventory!')
      closeModal()
    }
  })

  // Update
  const updateMutation = useMutation({
    mutationFn: async (updated: any) => {
      return api.put(`/parts/${updated.id}`, updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      toast.success('Part updated successfully!')
      closeModal()
    }
  })

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/parts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      toast.success('Part deleted from inventory!')
    }
  })

  const openModal = (part?: Part) => {
    if (part) {
      setSelectedPart(part)
      setValue('name', part.name)
      setValue('sku', part.sku)
      setValue('price', part.price.toString())
      setValue('quantity', part.quantity.toString())
    } else {
      setSelectedPart(null)
      reset()
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPart(null)
    reset()
  }

  const onSubmit = (data: PartFormInput) => {
    const payload = {
      name: data.name,
      sku: data.sku,
      price: parseFloat(data.price),
      quantity: parseInt(data.quantity),
    }

    if (selectedPart) {
      updateMutation.mutate({ ...payload, id: selectedPart.id })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      deleteMutation.mutate(id)
    }
  }

  const filtered = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'stock' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Inventory Stock
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'purchases' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Customer Purchases
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search part name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {isManager && (
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/10 text-sm transition-all animate-fade-in"
              >
                <Plus className="h-5 w-5" />
                <span>Add Part</span>
              </button>
            )}
          </div>

          {/* Grid of Parts */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading inventory...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No parts in stock matching search.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((part) => {
                const lowStock = part.quantity <= 15
                return (
                  <div key={part.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between shadow-sm relative">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-xs font-bold text-slate-400 tracking-wider font-mono">{part.sku}</span>
                        {lowStock && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Low Stock</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 mt-2">{part.name}</h4>
                      <p className="text-2xl font-extrabold text-slate-850 dark:text-slate-200 mt-4">${part.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className={`text-xs font-semibold ${lowStock ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        Stock: {part.quantity} units
                      </span>
                      
                      {isManager && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(part)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(part.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* Customer Purchases log */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
          {salesLoading ? (
            <div className="p-8 text-center text-slate-500">Loading purchase records...</div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No customer purchases found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Part Info</th>
                    <th className="py-4 px-6">Qty</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                        {sale.customerName}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{sale.partName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{sale.partSku}</div>
                      </td>
                      <td className="py-4 px-6 font-medium">{sale.quantity} units</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-850 dark:text-slate-200">
                          ₹{(sale.amount * 80).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">(${sale.amount.toFixed(2)} USD)</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sale.status === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' :
                          sale.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                          'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 no-print">
                        <button
                          onClick={() => handleViewInvoice(sale)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Part Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-850">
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {selectedPart ? 'Modify Part Record' : 'Add New Inventory Part'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Part Name</label>
                <input
                  type="text"
                  {...register('name', { required: 'Part name is required' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Copper Wire 14 AWG"
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">SKU Code</label>
                <input
                  type="text"
                  {...register('sku', { required: 'SKU is required' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. ELEC-WIR-14"
                />
                {errors.sku && <p className="text-xs text-rose-500 mt-1">{errors.sku.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { required: 'Price is required' })}
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    {...register('quantity', { required: 'Quantity is required' })}
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.quantity && <p className="text-xs text-rose-500 mt-1">{errors.quantity.message}</p>}
                </div>
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
                  {selectedPart ? 'Save Changes' : 'Create'}
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

export default Inventory
