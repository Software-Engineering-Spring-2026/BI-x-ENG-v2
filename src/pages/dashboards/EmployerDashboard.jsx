import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../../data/authStorage'
import Button from '../../components/Button'

function EmployerDashboard() {
  const user = getCurrentUser()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">
          {user?.companyName || 'Employer'} Dashboard
        </h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>

      {/* Nav cards */}
      <div className="max-w-5xl mx-auto mt-10 px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <Link to="/employer/profile"
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-3">🏢</div>
          <h2 className="text-lg font-semibold text-slate-800">Company Profile</h2>
          <p className="text-sm text-slate-500 mt-1">Edit bio, address and contact info</p>
        </Link>

        <Link to="/employer/location"
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-3">📍</div>
          <h2 className="text-lg font-semibold text-slate-800">Company Location</h2>
          <p className="text-sm text-slate-500 mt-1">Set your location on Google Maps</p>
        </Link>

        <Link to="/employer/internships"
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-3">💼</div>
          <h2 className="text-lg font-semibold text-slate-800">Internships</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your internship listings</p>
        </Link>

        <Link to="/employer/applications"
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-slate-800">Applications</h2>
          <p className="text-sm text-slate-500 mt-1">Review student applications</p>
        </Link>

        <Link to="/employer/messages"
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-3">💬</div>
          <h2 className="text-lg font-semibold text-slate-800">Messages</h2>
          <p className="text-sm text-slate-500 mt-1">Chat with students and instructors</p>
        </Link>

        <Link to="/employer/stats"
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-3">📊</div>
          <h2 className="text-lg font-semibold text-slate-800">Statistics</h2>
          <p className="text-sm text-slate-500 mt-1">View internship and hiring stats</p>
        </Link>

      </div>
    </div>
  )
}

export default EmployerDashboard
