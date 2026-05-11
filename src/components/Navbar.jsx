import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Button from './Button'
import { getCurrentUser, logoutUser } from '../data/authStorage'

const navLinks = [
  { to: '/explore-projects', label: 'Explore Projects' },
  { to: '/explore-portfolios', label: 'Explore Portfolios' },
]

function Navbar() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentUser = getCurrentUser()

  const handleLogout = () => {
    logoutUser()
    setMobileOpen(false)
    navigate('/login')
  }

  const dashboardPathByRole = {
    student: '/student',
    instructor: '/instructor',
    employer: '/employer',
    admin: '/admin',
  }

  const roleLabelByRole = {
    student: 'Student',
    instructor: 'Course Instructor',
    employer: 'Employer',
    admin: 'Administrator',
  }

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          BI X ENG V2 <span className="text-blue-700">ProjectHub</span>
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-slate-700 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
        <nav className="hidden items-center gap-2 whitespace-nowrap md:flex lg:gap-3">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {!currentUser ? (
            <>
              <NavLink
                to="/register-student"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                  }`
                }
              >
                Register Student
              </NavLink>
              <NavLink
                to="/register-instructor"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                  }`
                }
              >
                Register Instructor
              </NavLink>
              <NavLink
                to="/register-employer"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                  }`
                }
              >
                Register Employer
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`
                }
              >
                Login
              </NavLink>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                {roleLabelByRole[currentUser.role] ?? currentUser.role}
              </span>
              <NavLink
                to={dashboardPathByRole[currentUser.role] ?? '/'}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-blue-700"
              >
                Dashboard
              </NavLink>
              <Button variant="muted" className="px-3 py-2" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </nav>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {!currentUser ? (
              <>
                <NavLink
                  to="/register-student"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-blue-700"
                >
                  Register Student
                </NavLink>
                <NavLink
                  to="/register-instructor"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-blue-700"
                >
                  Register Instructor
                </NavLink>
                <NavLink
                  to="/register-employer"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-blue-700"
                >
                  Register Employer
                </NavLink>
                <NavLink
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Login
                </NavLink>
              </>
            ) : (
              <>
                <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                  {roleLabelByRole[currentUser.role] ?? currentUser.role}
                </span>
                <NavLink
                  to={dashboardPathByRole[currentUser.role] ?? '/'}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-blue-700"
                >
                  Dashboard
                </NavLink>
                <Button variant="muted" className="px-3 py-2" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar
