import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { HallProvider } from './hall/HallContext.jsx'
import { ClubProvider } from './club/ClubContext.jsx'
import { TournamentProvider } from './tournament/TournamentContext.jsx'
import Layout from './components/Layout.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import SuperAdminLayout from './components/SuperAdminLayout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Map from './pages/Map.jsx'
import Profile from './pages/Profile.jsx'
import Tournaments from './pages/user/Tournaments.jsx'
import TournamentDetail from './pages/user/TournamentDetail.jsx'
import TeamDetail from './pages/user/TeamDetail.jsx'
import JoinTeam from './pages/user/JoinTeam.jsx'
import TournamentBracket from './pages/user/TournamentBracket.jsx'
import TournamentWinners from './pages/user/TournamentWinners.jsx'
import MyTeams from './pages/user/MyTeams.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminComputers from './pages/admin/Computers.jsx'
import AdminBar from './pages/admin/Bar.jsx'
import AdminBookings from './pages/admin/Bookings.jsx'
import AdminTournaments from './pages/admin/Tournaments.jsx'
import CreateTournament from './pages/admin/CreateTournament.jsx'
import TournamentControl from './pages/admin/TournamentControl.jsx'
import SuperDashboard from './pages/superadmin/Dashboard.jsx'
import SuperFinance from './pages/superadmin/Finance.jsx'
import SuperStaff from './pages/superadmin/Staff.jsx'
import SuperPromotions from './pages/superadmin/Promotions.jsx'
import SuperPricing from './pages/superadmin/Pricing.jsx'
import SuperTournaments from './pages/superadmin/Tournaments.jsx'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function UserOnly({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'user') return <Navigate to={`/${user.role === 'superadmin' ? 'superadmin' : 'admin'}`} replace />
  return children
}

function AdminOnly({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'user') return <Navigate to="/" replace />
  if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />
  return children
}

function SuperOnly({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'superadmin') return <Navigate to={user.role === 'user' ? '/' : '/admin'} replace />
  return children
}

function Routed() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={user.role === 'user' ? '/' : user.role === 'superadmin' ? '/superadmin' : '/admin'}
              replace
            />
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
        <Route path="/map" element={<Map />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/tournaments/:id/bracket" element={<TournamentBracket />} />
        <Route path="/tournaments/:id/winners" element={<TournamentWinners />} />
        <Route path="/tournaments/team/:teamId" element={<TeamDetail />} />
        <Route path="/join-team/:teamId" element={<JoinTeam />} />
        <Route path="/my-teams" element={<MyTeams />} />
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
        <Route path="computers" element={<AdminComputers />} />
        <Route path="bar" element={<AdminBar />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="tournaments" element={<AdminTournaments />} />
        <Route path="tournaments/create" element={<CreateTournament />} />
        <Route path="tournaments/:id/control" element={<TournamentControl />} />
      </Route>
      <Route
        path="/superadmin"
        element={
          <SuperOnly>
            <SuperAdminLayout />
          </SuperOnly>
        }
      >
        <Route index element={<SuperDashboard />} />
        <Route path="finance" element={<SuperFinance />} />
        <Route path="staff" element={<SuperStaff />} />
        <Route path="promotions" element={<SuperPromotions />} />
        <Route path="pricing" element={<SuperPricing />} />
        <Route path="tournaments" element={<SuperTournaments />} />
      </Route>
      <Route
        path="*"
        element={
          <Navigate to={user ? (user.role === 'user' ? '/' : user.role === 'superadmin' ? '/superadmin' : '/admin') : '/login'} replace />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HallProvider>
        <ClubProvider>
          <TournamentProvider>
            <HashRouter>
              <Routed />
            </HashRouter>
          </TournamentProvider>
        </ClubProvider>
      </HallProvider>
    </AuthProvider>
  )
}
