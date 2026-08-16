import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Sites from './pages/Sites'
import Inventory from './pages/Inventory'
import ServiceRequests from './pages/ServiceRequests'
import WorkOrders from './pages/WorkOrders'
import KanbanBoard from './pages/KanbanBoard'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

import PartsStore from './pages/PartsStore'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure Application Routes wrapped in Layout shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'DISPATCHER']}>
                <Layout>
                  <Customers />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sites"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'DISPATCHER']}>
                <Layout>
                  <Sites />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'DISPATCHER', 'TECHNICIAN']}>
                <Layout>
                  <Inventory />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parts-store"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <Layout>
                  <PartsStore />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/service-requests"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'DISPATCHER', 'CUSTOMER']}>
                <Layout>
                  <ServiceRequests />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/work-orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <WorkOrders />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/kanban"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'DISPATCHER', 'TECHNICIAN']}>
                <Layout>
                  <KanbanBoard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 Route */}
          <Route path="/unauthorized" element={<NotFound isUnauthorized />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
