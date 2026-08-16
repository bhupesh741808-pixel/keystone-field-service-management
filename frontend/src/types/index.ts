export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: 'MANAGER' | 'DISPATCHER' | 'TECHNICIAN' | 'CUSTOMER';
  active: boolean;
  customerId?: number;
}

export interface Customer {
  id: number;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface Site {
  id: number;
  customerId: number;
  siteName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Technician {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  employeeCode: string;
  specialization: string;
  availability: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
}

export interface Part {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

export interface ServiceRequest {
  id: number;
  customerId?: number;
  customerName?: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'NEW' | 'REVIEWED' | 'REJECTED' | 'WORK_ORDER_CREATED' | 'CANCELLED';
  serviceType?: string;
  amount?: number;
  paymentStatus?: 'UNPAID' | 'PAID';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

export interface WorkOrder {
  id: number;
  workOrderNumber: string;
  requestId?: number;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  siteAddress: string;
  siteCity: string;
  assignedToId?: number;
  assignedToName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  slaDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeLog {
  id: number;
  workOrderId: number;
  technicianId: number;
  technicianName: string;
  minutes: number;
  notes?: string;
  loggedAt: string;
}

export interface PartUsage {
  id: number;
  workOrderId: number;
  partId: number;
  partName: string;
  partSku: string;
  quantity: number;
  price: number;
}

export interface Attachment {
  id: number;
  workOrderId: number;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export interface StatusHistory {
  id: number;
  workOrderId: number;
  previousStatus?: string;
  currentStatus: string;
  changedBy: string;
  changedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  totalWorkOrders: number;
  pendingCount: number;
  assignedCount: number;
  inProgressCount: number;
  onHoldCount: number;
  completedCount: number;
  closedCount: number;
  overdueCount: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  monthlyRequests: Record<string, number>;
}
