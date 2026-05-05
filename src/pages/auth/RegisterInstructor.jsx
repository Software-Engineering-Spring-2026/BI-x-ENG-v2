import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import { getUsers, loginUser, saveUser, seedDemoUsers } from '../../data/authStorage'

function RegisterInstructor() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
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
    const isInstructorGucEmail =
      email.endsWith('@guc.edu.eg') && !email.endsWith('@student.guc.edu.eg')

    if (!isInstructorGucEmail) {
      setError('Please use a valid instructor GUC email (e.g. name@guc.edu.eg).')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    const users = getUsers()
    if (users.some((u) => u.email.toLowerCase() === email && u.role === 'instructor')) {
      setError('An instructor account with this email already exists.')
      return
    }

    saveUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email,
      password: form.password,
      profilePicture: form.profilePicture,
      role: 'instructor',
    })

    loginUser(email, form.password, 'instructor')
    setSuccess('Account created successfully. Redirecting to your dashboard...')
    setTimeout(() => navigate('/instructor'), 900)
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Register as Instructor</h1>
      <p className="mt-1 text-sm text-slate-600">
        Create your course instructor account for BI X ENG V2 ProjectHub.
      </p>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
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
          placeholder="Instructor GUC Email"
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
          Create Instructor Account
        </Button>
      </form>
    </div>
  )
}

export default RegisterInstructor
