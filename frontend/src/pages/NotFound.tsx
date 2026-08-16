import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Home } from 'lucide-react'

interface NotFoundProps {
  isUnauthorized?: boolean;
}

const NotFound: React.FC<NotFoundProps> = ({ isUnauthorized = false }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-full text-rose-500 mb-6 animate-pulse">
        <AlertTriangle className="h-16 w-16" />
      </div>
      
      <h2 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
        {isUnauthorized ? '403 - Access Denied' : '404 - Page Not Found'}
      </h2>
      
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
        {isUnauthorized
          ? "You do not have the required permissions to access this screen. Please contact your administrator if you believe this is an error."
          : "The screen you are looking for does not exist, has been removed, or is temporarily unavailable."}
      </p>

      <Link
        to="/dashboard"
        className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-lg transition-all"
      >
        <Home className="h-5 w-5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  )
}

export default NotFound
