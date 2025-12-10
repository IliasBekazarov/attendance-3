import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return isAuthenticated ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  )
}

export default PrivateRoute
