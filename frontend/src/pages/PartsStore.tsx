import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Part } from '../types'
import { ShoppingBag, Search, CreditCard, Clock, CheckCircle2, AlertCircle, Printer } from 'lucide-react'
import { toast } from 'react-toastify'
import InvoiceModal from '../components/InvoiceModal'

interface PurchaseRecord {
  id: number;
  partName: string;
  partSku: string;
  quantity: number;
  amount: number;
  status: string;
  createdAt: string;
}

const PartsStore: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [invoicePurchase, setInvoicePurchase] = useState<any | null>(null)

  const handleViewInvoice = (record: any) => {
    setInvoicePurchase({
      ...record,
      customerName: user?.fullName
    })
    setIsInvoiceOpen(true)
  }

  // Fetch Parts
  const { data: parts = [], isLoading: partsLoading } = useQuery<Part[]>({
    queryKey: ['parts'],
    queryFn: async () => {
      const res = await api.get('/parts')
      return res.data
    }
  })

  // Fetch Purchase History
  const { data: history = [], isLoading: historyLoading } = useQuery<PurchaseRecord[]>({
    queryKey: ['purchaseHistory'],
    queryFn: async () => {
      const res = await api.get('/payments/history')
      return res.data
    }
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

  const handleBuy = async (part: Part) => {
    const qty = quantities[part.id] || 1
    if (qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    if (qty > part.quantity) {
      toast.error('Insufficient stock available')
      return
    }

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      toast.error('Failed to load payment gateway')
      return
    }

    try {
      const orderRes = await api.post('/payments/order', { partId: part.id, quantity: qty })
      const { orderId, purchaseId, amount, keyId } = orderRes.data

      const options = {
        key: keyId,
        amount: Math.round(amount * 80 * 100), // convert to INR paise (approx conversion rate 1 USD = 80 INR)
        currency: 'INR',
        name: 'Keystone FSM Parts',
        description: `Order of ${qty}x ${part.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              purchaseId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
            if (verifyRes.data.status === 'SUCCESS') {
              toast.success('Purchase successful! Inventory stock updated.')
              queryClient.invalidateQueries({ queryKey: ['parts'] })
              queryClient.invalidateQueries({ queryKey: ['purchaseHistory'] })
              setQuantities(prev => ({ ...prev, [part.id]: 1 }))
            } else {
              toast.error('Payment signature verification failed')
            }
          } catch (err: any) {
            toast.error('Verification request failed')
          }
        },
        prefill: {
          name: user?.fullName,
          email: user?.email,
          contact: user?.phone || '555-0100'
        },
        notes: {
          customer_id: user?.customerId || 'N/A',
          part_id: part.id
        },
        theme: {
          color: '#0ea5e9'
        }
      }

      const rzpay = new (window as any).Razorpay(options)
      rzpay.open()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to place order'
      toast.error(msg)
    }
  }

  const handleQtyChange = (partId: number, val: string, max: number) => {
    let num = parseInt(val)
    if (isNaN(num)) num = 1
    if (num < 1) num = 1
    if (num > max) num = max
    setQuantities(prev => ({ ...prev, [partId]: num }))
  }

  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary-500" />
          <span>Parts & Equipment Store</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Purchase facilities maintenance equipment and parts directly. Secure payments via Razorpay.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Search parts by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Grid of Store Items */}
      {partsLoading ? (
        <div className="p-8 text-center text-slate-500">Loading store...</div>
      ) : filteredParts.length === 0 ? (
        <div className="p-8 text-center text-slate-400">No items available in the store.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParts.map(part => {
            const qty = quantities[part.id] || 1
            const outOfStock = part.quantity <= 0
            const inrPrice = part.price * 80 // 1 USD = 80 INR
            return (
              <div
                key={part.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {outOfStock && (
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl">
                    Out of Stock
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-slate-400 tracking-wider font-mono">{part.sku}</span>
                  <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 mt-2">{part.name}</h4>
                  
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                      ₹{inrPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-slate-400">
                      (approx. ${part.price.toFixed(2)} USD)
                    </span>
                  </div>
                  
                  <p className={`text-xs mt-1 font-medium ${part.quantity <= 15 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {outOfStock ? 'Unavailable' : `${part.quantity} units remaining in stock`}
                  </p>
                </div>

                {!outOfStock && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <div className="w-20">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        max={part.quantity}
                        value={qty}
                        onChange={(e) => handleQtyChange(part.id, e.target.value, part.quantity)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-center text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleBuy(part)}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg text-xs transition-colors self-end h-[38px] shadow-md shadow-primary-500/10"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Purchase History */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-indigo-500" />
          <span>Purchase History</span>
        </h3>

        {historyLoading ? (
          <div className="p-4 text-center text-slate-500 text-sm">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-sm">
            You haven't made any purchases yet.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Part Info</th>
                    <th className="py-4 px-6">Quantity</th>
                    <th className="py-4 px-6">Amount Paid</th>
                    <th className="py-4 px-6">Purchase Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-350">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{record.partName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{record.partSku}</div>
                      </td>
                      <td className="py-4 px-6 font-medium">{record.quantity} units</td>
                      <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-200">
                        ₹{(record.amount * 80).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          record.status === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' :
                          record.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                          'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                        }`}>
                          {record.status === 'SUCCESS' ? <CheckCircle2 className="h-3 w-3" /> :
                           record.status === 'PENDING' ? <Clock className="h-3 w-3" /> :
                           <AlertCircle className="h-3 w-3" />}
                          <span>{record.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 no-print">
                        <button
                          onClick={() => handleViewInvoice(record)}
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
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        purchase={invoicePurchase}
      />
    </div>
  )
}

export default PartsStore
