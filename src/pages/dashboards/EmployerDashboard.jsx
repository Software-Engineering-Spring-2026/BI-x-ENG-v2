import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import {
  getCurrentUser,
  getEmployerRecord,
  logoutUser,
  updateEmployerRecord,
} from '../../data/authStorage'
import EmployerProfile from './EmployerProfile'
import EmployerLocation from './EmployerLocation'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Company Profile' },
  { id: 'location', label: 'Company Location' },
]

function formatStatus(status) {
  if (!status || typeof status !== 'string') return 'Unknown'
  return status
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function isFilled(value) {
  if (value === undefined || value === null) return false
  return String(value).trim().length > 0
}

function profileCompletionPercent(employer) {
  const phone = employer.phone ?? employer.contactInfo
  const fields = [employer.bio, employer.address, phone, employer.website]
  const done = fields.filter((f) => isFilled(f)).length
  return Math.round((done / fields.length) * 100)
}

function EmployerOverview({ employer, onNavigate }) {
  const completion = profileCompletionPercent(employer)
  const locationSet = isFilled(employer.mapLocationAddress)
  const logoSet = isFilled(employer.companyLogo)
  const taxSet = isFilled(employer.taxCertificate)

  const cards = [
    {
      key: 'profile',
      title: 'Profile completion',
      value: `${completion}%`,
      hint: completion >= 100 ? 'Profile looks complete.' : 'Finish your company profile.',
      tab: 'profile',
    },
    {
      key: 'location',
      title: 'Location on map',
      value: locationSet ? 'Set' : 'Not set',
      hint: locationSet ? 'Visitors can see your map pin.' : 'Add an address under Company Location.',
      tab: 'location',
    },
    {
      key: 'logo',
      title: 'Company logo',
      value: logoSet ? 'Uploaded' : 'Not set',
      hint: logoSet ? 'Logo on file from registration.' : 'Upload a logo when you edit registration data (mock).',
      tab: 'profile',
    },
    {
      key: 'tax',
      title: 'Tax certificate',
      value: taxSet ? 'On file' : 'Not set',
      hint: taxSet ? 'Document attached at signup.' : 'Add certificate via registration flow.',
      tab: 'profile',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
        <p className="mt-1 text-sm text-slate-600">
          Account summary and quick links to complete your employer presence.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white shadow-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Company</p>
        <h3 className="mt-2 text-2xl font-bold">{employer.companyName || 'Company'}</h3>
        <div className="mt-4 flex flex-col gap-2 text-sm text-blue-100 sm:flex-row sm:flex-wrap sm:gap-6">
          <div>
            <span className="text-blue-200/90">Email</span>
            <p className="font-medium text-white">{employer.email}</p>
          </div>
          <div>
            <span className="text-blue-200/90">Status</span>
            <p className="font-medium text-white">{formatStatus(employer.status)}</p>
          </div>
        </div>
        {employer.status?.toLowerCase().includes('pending') && (
          <p className="mt-4 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-50">
            Your account is awaiting administrator verification. You can still update your profile and
            location in the meantime.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => onNavigate(card.tab)}
            className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.title}</p>
            <p className="mt-2 text-2xl font-bold text-blue-800">{card.value}</p>
            <p className="mt-2 text-sm text-slate-600">{card.hint}</p>
            <span className="mt-3 inline-block text-xs font-semibold text-blue-700">Open section →</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-3 text-sm text-slate-600">
          This area is only available to signed-in employer accounts. Please log in with an employer
          account or return to the home page.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/login">
            <Button>Go to login</Button>
          </Link>
          <Link to="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function EmployerDashboard() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [tab, setTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [employer, setEmployer] = useState(null)

  const refreshEmployer = useCallback(() => {
    if (!currentUser?.email) {
      setEmployer(null)
      return
    }
    setEmployer(getEmployerRecord(currentUser.email))
  }, [currentUser?.email])

  useEffect(() => {
    refreshEmployer()
  }, [refreshEmployer])

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
    }
  }, [currentUser, navigate])

  const applyEmployerPatch = useCallback(
    (patch) => {
      if (!currentUser?.email) return
      const updated = updateEmployerRecord(currentUser.email, patch)
      if (updated) {
        setEmployer(updated)
      }
    },
    [currentUser?.email],
  )

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const companyInitial = useMemo(() => {
    const name = employer?.companyName || 'C'
    return name.charAt(0).toUpperCase()
  }, [employer?.companyName])

  if (!currentUser) {
    return null
  }

  if (currentUser.role !== 'employer') {
    return <AccessDenied />
  }

  if (!employer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Employer record not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            We could not load your company profile from storage. Try logging out and back in.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button type="button" onClick={() => navigate('/login')}>
              Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const NavInner = () => (
    <>
      <div className="mb-6 px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Employer hub</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-lg font-bold text-white">
            {companyInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{employer.companyName}</p>
            <p className="truncate text-xs text-slate-500">{employer.email}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id)
              setSidebarOpen(false)
            }}
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              tab === item.id
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700"
        >
          Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <NavInner />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="presentation"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-slate-900/50" />
          <aside
            className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-xl"
            role="dialog"
            aria-label="Employer menu"
            onClick={(e) => e.stopPropagation()}
          >
            <NavInner />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            onClick={() => setSidebarOpen(true)}
          >
            Menu
          </button>
          <span className="font-semibold text-slate-900">Employer</span>
        </header>

        <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tab === item.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-5xl">
            {tab === 'overview' && (
              <EmployerOverview employer={employer} onNavigate={setTab} />
            )}
            {tab === 'profile' && (
              <EmployerProfile employer={employer} onSaved={applyEmployerPatch} />
            )}
            {tab === 'location' && (
              <EmployerLocation employer={employer} onSaved={applyEmployerPatch} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
