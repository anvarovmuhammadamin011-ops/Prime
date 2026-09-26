import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { ClubProvider } from './club/ClubContext.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Bookings from './pages/user/Bookings.jsx'
import AdminBookings from './pages/admin/Bookings.jsx'
import AdminComputers from './pages/admin/Computers.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminSettings from './pages/admin/Settings.jsx'
import AdminUsers from './pages/admin/Users.jsx'

function RouteLoading() {
  return <div className="route-loading" role="status">Tekshirilmoqda...</div>
}

function UserOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <RouteLoading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'user') return <Navigate to="/admin" replace />
  return children
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <RouteLoading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'user') return <Navigate to="/" replace />
  return children
}

function Routed() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
         element={
           loading ? (
             <RouteLoading />
           ) : user ? (
             <Navigate to={user.role === 'user' ? '/' : '/admin'} replace />
           ) : (
             <Login />
           )
         }
      />
      <Route
        element={
          <UserOnly>
            <Layout />
          </UserOnly>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AdminLayout />
          </AdminOnly>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="pcs" element={<AdminComputers />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route
        path="*"
         element={
           loading ? (
             <RouteLoading />
           ) : (
             <Navigate
               to={user ? (user.role === 'user' ? '/' : '/admin') : '/login'}
               replace
             />
           )
         }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ClubProvider>
        <HashRouter>
          <Routed />
        </HashRouter>
      </ClubProvider>
    </AuthProvider>
  )
}
