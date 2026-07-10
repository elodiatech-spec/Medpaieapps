import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/cabinet/Overview'
import Variables from './pages/cabinet/Variables'
import Leaves from './pages/cabinet/Leaves'
import Documents from './pages/cabinet/Documents'
import MyFile from './pages/cabinet/MyFile'
import AdminHome from './pages/admin/AdminHome'
import CabinetDetail from './pages/admin/CabinetDetail'
import Invoices from './pages/admin/Invoices'

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
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RoleHome />} />

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
              path="/cabinets/:id"
              element={
                <ProtectedRoute allow={['admin']}>
                  <CabinetDetail />
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
