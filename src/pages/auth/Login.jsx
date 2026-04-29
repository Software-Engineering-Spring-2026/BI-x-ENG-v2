import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import {
  findUserByEmail,
  loginUser,
  seedDemoUsers,
} from '../../data/authStorage'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const roleRoutes = {
    student: '/student',
    instructor: '/instructor',
    employer: '/employer',
    admin: '/admin',
  }

  const ADMIN_EMAIL = 'admin@guc.edu.eg'
  const ADMIN_PASSWORD = 'password123'

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const normalizedEmail = email.trim().toLowerCase()

    
    if (role === 'admin') {
      if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setSuccess('Login successful. Redirecting to admin dashboard...')
        navigate(roleRoutes.admin)
      } else {
        setError('Invalid administrator credentials. Please check your assigned GUC email and password.')
      }
      return 
    }

    
    seedDemoUsers()
    const existingUser = findUserByEmail(normalizedEmail)

    if (!existingUser) {
      setError('No account found for this email. Please register first.')
      return
    }

    const loggedInUser = loginUser(normalizedEmail, password, role)

    if (!loggedInUser) {
      setError('Invalid credentials or role mismatch. Please check your login details.')
      return
    }

    setSuccess(`Login successful. Redirecting to ${role} dashboard...`)
    navigate(roleRoutes[role])
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-1 text-sm text-slate-600">
        Demo login for role-based dashboard navigation.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            placeholder="name@guc.edu.eg"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            placeholder="••••••••"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
          >
            <option value="student">Student</option>
            <option value="instructor">Course Instructor</option>
            <option value="employer">Employer</option>
            <option value="admin">Administrator</option>
          </select>
        </label>

        <Button type="submit" className="w-full">
          Login
        </Button>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        {success && <p className="text-sm font-medium text-emerald-700">{success}</p>}
      </form>

      <div className="mt-6 border-t border-slate-200 pt-4">
        {/* MS2 Req 4.0: Update (change) my forgotten password using an OTP */}
        <Link to="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-900">
          Forgot password?
        </Link>
        <p className="mt-4 text-sm font-medium text-slate-700">New to BI X ENG V2 ProjectHub?</p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <Link
            to="/register-student"
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            Create Student Account
          </Link>
          <Link
            to="/register-employer"
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            Register Company
          </Link>
          {/* Note: No admin registration link provided as per MS2 Requirement 2 ("Admin will NOT REGISTER") */}
        </div>
      </div>
    </div>
  )
}

export default Login