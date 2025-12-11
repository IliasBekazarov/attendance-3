import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import LeaveRequests from './pages/LeaveRequests'
import MarkAttendance from './pages/MarkAttendance'
import ReportsPage from './pages/ReportsPage'
import PrivateRoute from './components/PrivateRoute'
import RoleRoute from './components/RoleRoute'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/leave-requests" element={<LeaveRequests />} />
              <Route path="/mark-attendance" element={<MarkAttendance />} />
              
              {/* Admin/Manager Only Routes */}
              <Route 
                path="/reports" 
                element={
                  <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                    <ReportsPage />
                  </RoleRoute>
                } 
              />
            </Route>
            
            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
