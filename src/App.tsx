import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Offers from './pages/Offers'
import Legal from './pages/Legal'
import Account from './pages/Account'
import Help from './pages/Help'
import Overview from './pages/cabinet/Overview'
import Variables from './pages/cabinet/Variables'
import Leaves from './pages/cabinet/Leaves'
import Documents from './pages/cabinet/Documents'
import MyFile from './pages/cabinet/MyFile'
import Messaging from './pages/cabinet/Messaging'
import Stats from './pages/cabinet/Stats'
import AdminHome from './pages/admin/AdminHome'
import AdminStats from './pages/admin/AdminStats'
import Employees from './pages/admin/Employees'
import PayrollManagement from './pages/admin/PayrollManagement'
import CabinetDetail from './pages/admin/CabinetDetail'
import CabinetEdit from './pages/admin/CabinetEdit'
import CabinetMessaging from './pages/admin/CabinetMessaging'
import Portals from './pages/admin/Portals'
import MemberFile from './pages/admin/MemberFile'
import Invoices from './pages/admin/Invoices'
import NotFound from './pages/NotFound'

function RoleHome() {
  const { profile } = useAuth()
  if (profile?.role === 'admin') return <AdminHome />
  return <Overview />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Signup />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
          <Route path="/offres" element={<Offers />} />
          <Route path="/mentions-legales" element={<Legal />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RoleHome />} />
            <Route path="/mon-compte" element={<Account />} />
            <Route path="/aide" element={<Help />} />

            <Route
              path="/variables"
              element={
                <ProtectedRoute allow={['employer', 'employee']}>
                  <Variables />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conges"
              element={
                <ProtectedRoute allow={['employer', 'employee']}>
                  <Leaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute allow={['employer', 'employee']}>
                  <Documents />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dossier"
              element={
                <ProtectedRoute allow={['employee']}>
                  <MyFile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messagerie"
              element={
                <ProtectedRoute allow={['employer', 'employee']}>
                  <Messaging />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistiques"
              element={
                <ProtectedRoute allow={['employer']}>
                  <Stats />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cabinets/:id"
              element={
                <ProtectedRoute allow={['admin']}>
                  <CabinetDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cabinets/:id/modifier"
              element={
                <ProtectedRoute allow={['admin']}>
                  <CabinetEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cabinets/:id/portails"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Portals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cabinets/:id/messagerie"
              element={
                <ProtectedRoute allow={['admin']}>
                  <CabinetMessaging />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cabinets/:id/membres/:memberId"
              element={
                <ProtectedRoute allow={['admin']}>
                  <MemberFile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/factures"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chiffres"
              element={
                <ProtectedRoute allow={['admin']}>
                  <AdminStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salaries"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestion-paie"
              element={
                <ProtectedRoute allow={['admin']}>
                  <PayrollManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
