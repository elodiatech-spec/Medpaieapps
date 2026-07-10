import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  FileText,
  Building2,
  Receipt,
  LogOut,
  Stethoscope,
  IdCard,
  MessageCircle,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../lib/database.types'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  // Rubriques secondaires : visibles dans la barre latérale (desktop) mais
  // pas dans la barre du bas (mobile), pour garder la navigation mobile
  // lisible malgré le nombre croissant de fonctionnalités.
  mobile?: boolean
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { to: '/', label: 'Cabinets', icon: Building2, end: true },
    { to: '/factures', label: 'Factures', icon: Receipt },
  ],
  employer: [
    { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
    { to: '/variables', label: 'Variables', icon: ClipboardList },
    { to: '/conges', label: 'Congés', icon: CalendarDays },
    { to: '/messagerie', label: 'Messagerie', icon: MessageCircle },
    { to: '/documents', label: 'Documents', icon: FileText, mobile: false },
    { to: '/statistiques', label: 'Statistiques', icon: BarChart3, mobile: false },
  ],
  employee: [
    { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
    { to: '/variables', label: 'Variables', icon: ClipboardList },
    { to: '/conges', label: 'Congés', icon: CalendarDays },
    { to: '/messagerie', label: 'Messagerie', icon: MessageCircle },
    { to: '/documents', label: 'Documents', icon: FileText, mobile: false },
    { to: '/dossier', label: 'Mon dossier', icon: IdCard, mobile: false },
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur Elodiatech',
  employer: 'Médecin employeur',
  employee: 'Assistante médicale',
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  if (!profile) return null

  const navItems = NAV_BY_ROLE[profile.role]
  const mobileNavItems = navItems.filter((item) => item.mobile !== false)

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 md:flex">
        <div className="mb-8 flex items-center gap-2 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Stethoscope size={18} />
          </div>
          <span className="text-lg font-semibold text-slate-900">MedPaie</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <p className="truncate text-sm font-medium text-slate-800">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="truncate text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
          <button
            onClick={() => signOut()}
            className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Header (mobile) */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Stethoscope size={16} />
          </div>
          <span className="font-semibold text-slate-900">MedPaie</span>
        </div>
        <button onClick={() => signOut()} className="text-slate-500">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav (mobile) — rubriques principales uniquement */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                isActive ? 'text-brand-700' : 'text-slate-500'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
