import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import { findUserByEmail, loginUser, saveUser, seedDemoUsers } from '../../data/authStorage'

function RegisterStudent() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    role: 'student',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePicture: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    seedDemoUsers()

    const email = form.email.trim().toLowerCase()
    const validDomain = email.endsWith('@guc.edu.eg') || email.endsWith('@student.guc.edu.eg')

    if (!validDomain) {
      setError('Please use a valid GUC email ending with @student.guc.edu.eg or @guc.edu.eg.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    const existingUser = findUserByEmail(email)
    if (existingUser) {
      setError('An account with this email already exists.')
      return
    }

    saveUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email,
      password: form.password,
      profilePicture: form.profilePicture,
      role: form.role,
    })

    loginUser(email, form.password, form.role)
    setSuccess('Account created successfully. Redirecting to your dashboard...')
    const targetRoute = form.role === 'instructor' ? '/instructor' : '/student'
    setTimeout(() => navigate(targetRoute), 900)
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Register as Student</h1>
      <p className="mt-1 text-sm text-slate-600">
        Register as a Student or Course Instructor for BI X ENG V2 ProjectHub.
      </p>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Account Role</span>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
          >
            <option value="student">Student</option>
            <option value="instructor">Course Instructor</option>
          </select>
        </label>
        <input
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          required
          placeholder="First Name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          required
          placeholder="Last Name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
          required
          placeholder="GUC Email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          name="password"
          value={form.password}
          onChange={handleChange}
          type="password"
          required
          placeholder="Password"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          type="password"
          required
          placeholder="Confirm Password"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Profile Picture (mock upload)
          </span>
          <input
            name="profilePicture"
            type="file"
            accept="image/*"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                profilePicture: event.target.files?.[0]?.name ?? '',
              }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm font-medium text-red-600 sm:col-span-2">{error}</p>}
        {success && (
          <p className="text-sm font-medium text-emerald-700 sm:col-span-2">{success}</p>
        )}
        <Button type="submit" className="sm:col-span-2">
          Create Student Account
        </Button>
      </form>
    </div>
  )
}

export default RegisterStudent
