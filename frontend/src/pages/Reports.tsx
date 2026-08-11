import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { FileDown, Printer, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'react-toastify'

const Reports: React.FC = () => {
  // Fetch Report Data
  const { data: report, isLoading } = useQuery<any>({
    queryKey: ['operationalReport'],
    queryFn: async () => {
      const res = await api.get('/reports')
      return res.data
    }
  })

  // Export CSV Helper
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.info("No data available to export.")
      return
    }

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(fieldName => {
          const value = row[fieldName]
          const escaped = ('' + (value ?? '')).replace(/"/g, '""')
          return `"${escaped}"`
        }).join(',')
      )
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`${filename} report downloaded successfully!`)
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading operations reports...</div>
  }

  return (
    <div className="space-y-8 print:p-0">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Operational & SLA Reports</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Export completed tickets, labor allocation, and stock depletion sheets.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => exportToCSV(report?.technicianPerformance, 'Technician_Performance')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-primary-500/10"
          >
            <FileDown className="h-4 w-4" />
            <span>Export Timesheets</span>
          </button>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Completed Services</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{report?.completedJobsCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Pending Backlog</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{report?.pendingJobsCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Overdue Tickets</span>
            <span className="text-2xl font-extrabold text-rose-500">{report?.overdueJobsCount}</span>
          </div>
        </div>
      </div>

      {/* Technician performance table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 print:border-slate-200">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            <span>Technician Resource allocation</span>
          </h3>
          <button
            onClick={() => exportToCSV(report?.technicianPerformance, 'Technician_KPI')}
            className="text-xs text-primary-500 hover:underline print:hidden"
          >
            Download CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Total hours logged</th>
                <th className="px-4 py-3">Jobs worked on</th>
                <th className="px-4 py-3">Jobs completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report?.technicianPerformance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">No timesheet records recorded yet.</td>
                </tr>
              ) : (
                report?.technicianPerformance.map((tech: any) => (
                  <tr key={tech.technicianId} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-3 font-semibold">{tech.technicianName}</td>
                    <td className="px-4 py-3">{tech.totalHoursLogged} hrs</td>
                    <td className="px-4 py-3">{tech.jobsWorkedOn}</td>
                    <td className="px-4 py-3 font-bold text-emerald-500">{tech.jobsCompleted}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Consumption Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 print:border-slate-200">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            <span>Warehouse Inventory consumption</span>
          </h3>
          <button
            onClick={() => exportToCSV(report?.inventoryConsumption, 'Inventory_Consumption')}
            className="text-xs text-primary-500 hover:underline print:hidden"
          >
            Download CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-3">Part Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Quantity consumed</th>
                <th className="px-4 py-3">Total valuation ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report?.inventoryConsumption.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">No parts consumption logged.</td>
                </tr>
              ) : (
                report?.inventoryConsumption.map((part: any) => (
                  <tr key={part.partId} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-3 font-semibold">{part.partName}</td>
                    <td className="px-4 py-3 font-mono">{part.sku}</td>
                    <td className="px-4 py-3">{part.quantityConsumed} units</td>
                    <td className="px-4 py-3 font-bold">${part.totalCost.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports
