import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { WorkOrder } from '../types'
import { Clipboard, User, MapPin, Calendar } from 'lucide-react'
import { toast } from 'react-toastify'

const COLUMNS = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED']

const KanbanBoard: React.FC = () => {
  const queryClient = useQueryClient()
  const [draggingWOId, setDraggingWOId] = useState<number | null>(null)

  // Fetch Work Orders
  const { data: workOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ['workOrdersKanban'],
    queryFn: async () => {
      const res = await api.get('/work-orders?size=100')
      return res.data.content
    }
  })

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return api.post(`/work-orders/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrdersKanban'] })
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      toast.success('Work order status updated!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Illegal state transition'
      toast.error(msg)
    }
  })

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingWOId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    if (draggingWOId !== null) {
      updateStatusMutation.mutate({ id: draggingWOId, status })
      setDraggingWOId(null)
    }
  }

  const getOrdersInColumn = (status: string) => {
    return workOrders.filter(wo => wo.status === status)
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Work Order Kanban Board</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Drag and drop cards across columns to update task scheduling. Strict business validations apply.</p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">Loading Kanban...</div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-stretch select-none">
          {COLUMNS.map(col => {
            const colOrders = getOrdersInColumn(col)
            return (
              <div
                key={col}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
                className="flex flex-col bg-slate-100 dark:bg-slate-900 w-80 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-850/50 flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-xs text-slate-500 dark:text-slate-400 tracking-wider">{col}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {colOrders.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {colOrders.length === 0 ? (
                    <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-center p-6 min-h-[120px]">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Drop tasks here</span>
                    </div>
                  ) : (
                    colOrders.map(wo => (
                      <div
                        key={wo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, wo.id)}
                        className={`bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 hover:shadow-md cursor-grab active:cursor-grabbing transition-shadow ${
                          wo.priority === 'EMERGENCY' ? 'border-l-4 border-l-rose-500' : 
                          wo.priority === 'HIGH' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-primary-500'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">{wo.workOrderNumber}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            wo.priority === 'EMERGENCY' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-900'
                          }`}>
                            {wo.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2 truncate">{wo.customerName}</h4>
                        
                        <div className="mt-3 space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">{wo.siteName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate font-semibold">{wo.assignedToName || 'Unassigned'}</span>
                          </div>
                          {wo.slaDueDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>Due: {new Date(wo.slaDueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default KanbanBoard
