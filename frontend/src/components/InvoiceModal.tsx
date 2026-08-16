import React from 'react'
import { X, Printer, Shield, Download } from 'lucide-react'

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: {
    id: number;
    customerName?: string;
    partName: string;
    partSku: string;
    quantity: number;
    amount: number;
    status: string;
    createdAt: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  } | null;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, purchase }) => {
  if (!isOpen || !purchase) return null

  const handlePrint = () => {
    window.print()
  }

  const invoiceNumber = `KEY-INV-${String(purchase.id).padStart(6, '0')}`
  const invoiceDate = new Date(purchase.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  // 1 USD = 80 INR
  const unitPriceUSD = purchase.amount / purchase.quantity
  const unitPriceINR = unitPriceUSD * 80
  const totalINR = purchase.amount * 80

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
      {/* Dynamic Print Stylesheet injected inline */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible !important;
          }
          #print-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in my-8">
        {/* Modal Toolbar */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 no-print">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
            <Shield className="h-5 w-5 text-primary-500" />
            <span>Invoice Viewer</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-500/10"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div id="print-invoice-area" className="p-8 md:p-12 bg-white text-slate-800 space-y-8 select-text">
          {/* Logo & Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary-600">
                <Shield className="h-8 w-8 text-primary-500" />
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">KEYSTONE</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Keystone Field Service Management Ltd.<br />
                100 Innovation Corporate Boulevard, Suite 500<br />
                Bangalore, KA 560001, India<br />
                support@keystonefsm.com
              </p>
            </div>
            <div className="md:text-right space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {purchase.partSku.startsWith('SRV-') ? 'SERVICE INVOICE' : 'INVOICE'}
              </h1>
              <p className="text-sm font-mono text-slate-500">{invoiceNumber}</p>
              <div className="pt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  purchase.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {purchase.status === 'SUCCESS' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed To</h4>
              <p className="font-bold text-slate-900 text-base">{purchase.customerName || 'Keystone Customer'}</p>
              <p className="text-xs text-slate-500 leading-normal">
                Enterprise Client ID: #{purchase.customerName ? purchase.customerName.replace(/\s+/g, '-').toLowerCase() : 'cust-id'}<br />
                Account Email: billing@acme.com
              </p>
            </div>
            <div className="md:text-right space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Details</h4>
              <p className="text-slate-700"><span className="text-slate-400">Date Issued:</span> <span className="font-semibold">{invoiceDate}</span></p>
              <p className="text-slate-700"><span className="text-slate-400">Payment Gateway:</span> <span className="font-semibold">Razorpay Checkout</span></p>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">
                    {purchase.partSku.startsWith('SRV-') ? 'Service Details' : 'Item Description'}
                  </th>
                  <th className="py-3 px-4 text-center">
                    {purchase.partSku.startsWith('SRV-') ? 'Rate' : 'Unit Price'}
                  </th>
                  <th className="py-3 px-4 text-center">
                    {purchase.partSku.startsWith('SRV-') ? 'Quantity' : 'Qty'}
                  </th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                <tr>
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-900">{purchase.partName}</span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{purchase.partSku}</span>
                  </td>
                  <td className="py-4 px-4 text-center font-mono">
                    ₹{unitPriceINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4 text-center font-semibold">
                    {purchase.quantity}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono">
                    ₹{totalINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculation */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-4">
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 w-full md:max-w-md text-xs">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction References</h4>
              {purchase.razorpayOrderId && (
                <p className="text-slate-600 font-mono"><span className="text-slate-400">Order ID:</span> {purchase.razorpayOrderId}</p>
              )}
              {purchase.razorpayPaymentId && (
                <p className="text-slate-600 font-mono"><span className="text-slate-400">Payment ID:</span> {purchase.razorpayPaymentId}</p>
              )}
              <p className="text-[10px] text-slate-400 leading-normal pt-1">
                This receipt is system-generated to confirm digital transaction authorization. No physical signature is required.
              </p>
            </div>
            
            <div className="w-full md:w-64 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{totalINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (0%):</span>
                <span className="font-mono">₹0.00</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-3 text-base font-extrabold text-slate-900">
                <span>Total Paid:</span>
                <span className="font-mono">₹{totalINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[10px] text-slate-400 text-right font-medium">
                ({purchase.amount.toFixed(2)} USD equivalent)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceModal
