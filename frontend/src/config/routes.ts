import type React from 'react'
import type { UserRole } from '../types'

import Customers from '../pages/Customers'
import Dashboard from '../pages/Dashboard'
import Inventory from '../pages/Inventory'
import KanbanBoard from '../pages/KanbanBoard'
import PartsStore from '../pages/PartsStore'
import Profile from '../pages/Profile'
import Reports from '../pages/Reports'
import ServiceRequests from '../pages/ServiceRequests'
import Settings from '../pages/Settings'
import Sites from '../pages/Sites'
import WorkOrders from '../pages/WorkOrders'

type AppRoute = {
  path: string
  title: string
  element: React.ComponentType
  allowedRoles?: UserRole[]
}

export const appRoutes: AppRoute[] = [
  { path: '/dashboard', title: 'Dashboard', element: Dashboard },
  { path: '/customers', title: 'Customers', element: Customers, allowedRoles: ['MANAGER', 'DISPATCHER'] },
  { path: '/sites', title: 'Sites', element: Sites, allowedRoles: ['MANAGER', 'DISPATCHER'] },
  { path: '/inventory', title: 'Inventory', element: Inventory, allowedRoles: ['MANAGER', 'DISPATCHER', 'TECHNICIAN'] },
  { path: '/parts-store', title: 'Parts Store', element: PartsStore, allowedRoles: ['CUSTOMER'] },
  { path: '/service-requests', title: 'Service Requests', element: ServiceRequests, allowedRoles: ['MANAGER', 'DISPATCHER', 'CUSTOMER'] },
  { path: '/work-orders', title: 'Work Orders', element: WorkOrders },
  { path: '/kanban', title: 'Dispatch Board', element: KanbanBoard, allowedRoles: ['MANAGER', 'DISPATCHER', 'TECHNICIAN'] },
  { path: '/reports', title: 'Reports', element: Reports, allowedRoles: ['MANAGER'] },
  { path: '/profile', title: 'Profile', element: Profile },
  { path: '/settings', title: 'Settings', element: Settings },
]

export const getRouteTitle = (pathname: string) => (
  appRoutes.find((route) => route.path === pathname)?.title || 'Keystone'
)
