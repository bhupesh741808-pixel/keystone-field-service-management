import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Site, Customer } from '../types'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

interface SiteFormInput {
  customerId: string;
  siteName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const Sites: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SiteFormInput>()

  // Get Sites
  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await api.get('/sites')
      return res.data
    }
  })

  // Get Customers for Dropdown
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers')
      return res.data
    }
  })

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newSite: any) => {
      return api.post('/sites', newSite)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Site added successfully!')
      closeModal()
    }
  })

  // Edit Mutation
  const updateMutation = useMutation({
    mutationFn: async (updated: any) => {
      return api.put(`/sites/${updated.id}`, updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Site updated successfully!')
      closeModal()
    }
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/sites/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Site deleted successfully!')
    }
  })

  const openModal = (site?: Site) => {
    if (site) {
      setSelectedSite(site)
      setValue('customerId', site.customerId.toString())
      setValue('siteName', site.siteName)
      setValue('address', site.address)
      setValue('city', site.city)
      setValue('state', site.state)
      setValue('pincode', site.pincode)
    } else {
      setSelectedSite(null)
      reset()
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedSite(null)
    reset()
  }

  const onSubmit = (data: SiteFormInput) => {
    const payload = {
      ...data,
      customerId: parseInt(data.customerId),
    }

    if (selectedSite) {
      updateMutation.mutate({ ...payload, id: selectedSite.id })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      deleteMutation.mutate(id)
    }
  }

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId)
    return customer ? customer.companyName : `Customer ID: ${customerId}`
  }

  const filtered = sites.filter(s => 
    s.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(s.customerId).toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search site, city, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/10 text-sm transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Add Site</span>
        </button>
      </div>

      {/* Sites list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading sites...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No sites configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-850 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Site Name</th>
                  <th className="px-6 py-4">Customer Account</th>
                  <th className="px-6 py-4">Full Address</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Pincode</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((site) => (
                  <tr key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{site.siteName}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{getCustomerName(site.customerId)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{site.address}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{site.city}, {site.state}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{site.pincode}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(site)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(site.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Site Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-850">
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {selectedSite ? 'Edit Site Location' : 'Configure New Site'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Customer Account</label>
                <select
                  {...register('customerId', { required: 'Please select a customer' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="">Select Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
                {errors.customerId && <p className="text-xs text-rose-500 mt-1">{errors.customerId.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Site Name</label>
                <input
                  type="text"
                  {...register('siteName', { required: 'Site name is required' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Acme HQ"
                />
                {errors.siteName && <p className="text-xs text-rose-500 mt-1">{errors.siteName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Street Address</label>
                <input
                  type="text"
                  {...register('address', { required: 'Address is required' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="123 Facility Lane"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    {...register('city', { required: 'City is required' })}
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    {...register('state', { required: 'State is required' })}
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pincode</label>
                <input
                  type="text"
                  {...register('pincode', { required: 'Pincode is required' })}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
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
                  {selectedSite ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sites
