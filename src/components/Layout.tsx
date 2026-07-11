import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  FileText,
  Building2,
  Receipt,
  LogOut,
  IdCard,
  MessageCircle,
  BarChart3,
  Settings,
  HelpCircle,
  Users,
  Banknote,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAdminAlerts } from '../hooks/useAdminAlerts'
import type { Role } from '../lib/database.types'
import Logo from './Logo'
import PoweredByElodiatech from './PoweredByElodiatech'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  // Rubriques secondaires : visibles dans la barre latérale (desktop) mais
  // pas dans la barre du bas (mobile), pour garder la navigation mobile
  // lisible malgré le nombre croissant de fonctionnalités.
  mobile?: boolean
  // Nom de la clé sous laquelle afficher une pastille de compte (voir useAdminAlerts).
  badge?: 'admin-alerts'
  // Lien externe (ouvert dans un nouvel onglet) plutôt qu'une route interne.
  external?: boolean
}

// Assistant réglementaire (convention collective, paie) — agent IA créé par
// Elodiatech, hébergé sur Gemini. Un lien de partage Gemini ne peut pas être
// affiché en cadre intégré dans MedPaie (Google bloque volontairement
// l'iframe sur ses pages, pour des raisons de sécurité) : il s'ouvre donc
// dans un nouvel onglet.
const AI_ASSISTANT_URL = 'https://share.gemini.google/BfuyM4LuisIo'

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { to: '/', label: 'Cabinets', icon: Building2, end: true, badge: 'admin-alerts' },
    { to: '/salaries', label: 'Salariés & médecins', icon: Users },
    { to: '/gestion-paie', label: 'Gestion de paie', icon: Banknote },
    { to: '/chiffres', label: 'Statistiques', icon: BarChart3, mobile: false },
    { to: '/factures', label: 'Factures', icon: Receipt, mobile: false },
    { to: AI_ASSISTANT_URL, label: 'Assistant IA', icon: Sparkles, mobile: false, external: true },
  ],
  employer: [
    { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
    { to: '/variables', label: 'Variables', icon: ClipboardList },
    { to: '/conges', label: 'Congés', icon: CalendarDays },
    { to: '/messagerie', label: 'Messagerie', icon: MessageCircle },
    { to: '/documents', label: 'Documents', icon: FileText, mobile: false },
    { to: '/equipe', label: 'Mon équipe', icon: Users, mobile: false },
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

function AdminAlertBadge({ className = '' }: { className?: string }) {
  const { total } = useAdminAlerts()
  if (total === 0) return null
  return (
    <span
      className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white ${className}`}
    >
      {total}
    </span>
  )
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
    <div className="flex min-h-svh flex-col bg-slate-200 md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 shadow-[2px_0_16px_-8px_rgba(15,23,42,0.15)] md:flex">
        <div className="mb-8 flex items-center gap-2 px-1">
          <Logo size={36} />
          <span className="text-lg font-semibold text-slate-900">MedPaie</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <item.icon size={18} />
                {item.label}
                <ExternalLink size={13} className="ml-auto text-slate-400" />
              </a>
            ) : (
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
                {item.badge === 'admin-alerts' && <AdminAlertBadge className="ml-auto" />}
              </NavLink>
            ),
          )}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <p className="truncate text-sm font-medium text-slate-800">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="truncate text-xs text-slate-600">{ROLE_LABELS[profile.role]}</p>
          <Link
            to="/aide"
            className="mt-3 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <HelpCircle size={16} />
            Aide
          </Link>
          <Link
            to="/mon-compte"
            className="mt-2 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <Settings size={16} />
            Mon compte
          </Link>
          <button
            onClick={() => signOut()}
            className="mt-2 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
          <PoweredByElodiatech className="mt-4" />
          <Link
            to="/mentions-legales"
            className="mt-2 block text-center text-[11px] text-slate-300 hover:text-slate-600"
          >
            Mentions légales
          </Link>
        </div>
      </aside>

      {/* Header (mobile) */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-[0_2px_12px_-6px_rgba(15,23,42,0.2)] md:hidden">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-semibold text-slate-900">MedPaie</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/aide" className="text-slate-600">
            <HelpCircle size={20} />
          </Link>
          <Link to="/mon-compte" className="text-slate-600">
            <Settings size={20} />
          </Link>
          <button onClick={() => signOut()} className="text-slate-600">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav (mobile) — rubriques principales uniquement */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white shadow-[0_-2px_16px_-6px_rgba(15,23,42,0.2)] md:hidden">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                isActive ? 'text-brand-700' : 'text-slate-600'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
            {item.badge === 'admin-alerts' && (
              <AdminAlertBadge className="absolute right-6 top-1 h-4 min-w-4 px-1 text-[10px]" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
