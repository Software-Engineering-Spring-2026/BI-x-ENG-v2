import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import {
  findUserByEmail,
  loginUser,
  saveUser,
  seedDemoUsers,
} from '../../data/authStorage'

function RegisterEmployer() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    address: '',
    contactInfo: '',
    companyLogo: '',
    taxCertificate: '',
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

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    const email = form.email.trim().toLowerCase()

    if (email.endsWith('@guc.edu.eg') || email.endsWith('@student.guc.edu.eg')) {
      setError('Employers must register using an external company email, not a GUC email address.')
      return
    }

    const existingUser = findUserByEmail(email)
    if (existingUser && existingUser.role === 'employer') {
      setError('An employer account with this email already exists.')
      return
    }

    saveUser({
      companyName: form.companyName.trim(),
      email,
      password: form.password,
      bio: form.bio.trim(),
      address: form.address.trim(),
      contactInfo: form.contactInfo.trim(),
      companyLogo: form.companyLogo,
      taxCertificate: form.taxCertificate,
      role: 'employer',
      status: 'pending verification',
    })

    loginUser(email, form.password, 'employer')
    setSuccess('Your company account is pending administrator verification.')
    setTimeout(() => navigate('/employer'), 900)
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Register as Employer</h1>
      <p className="mt-1 text-sm text-slate-600">
        Join BI X ENG V2 ProjectHub to discover top GUC talent.
      </p>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <input
          name="companyName"
          value={form.companyName}
          onChange={handleChange}
          required
          placeholder="Company Name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
          required
          placeholder="Company Email (External)"
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
        <input
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Company Biography"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="contactInfo"
          value={form.contactInfo}
          onChange={handleChange}
          placeholder="Contact Info"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Company Logo (mock upload)
          </span>
          <input
            name="companyLogo"
            type="file"
            accept="image/*"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                companyLogo: event.target.files?.[0]?.name ?? '',
              }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Tax Certificate (PDF)
          </span>
          <input
            name="taxCertificate"
            type="file"
            accept=".pdf"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                taxCertificate: event.target.files?.[0]?.name ?? '',
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
          Create Employer Account
        </Button>
      </form>
    </div>
  )
}

export default RegisterEmployer