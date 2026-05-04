import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import projectsSeed from '../../data/projects'
import studentsSeed from '../../data/students'
import { getCurrentUser, getUsers, logoutUser, saveUser } from '../../data/authStorage'

const ADMIN_STATE_KEY = 'guc_projecthub_admin_state'

function isGucEmail(email) {
  const normalized = email.trim().toLowerCase()
  return /^[^\s@]+@(?:[a-z0-9-]+\.)*guc\.edu\.eg$/i.test(normalized)
}

function deriveNamePartsFromEmail(email) {
  const local = email.trim().split('@')[0].toLowerCase()
  const segments = local.split(/[._-]+/).filter(Boolean)
  if (segments.length === 0) {
    return { firstName: 'Admin', lastName: 'User' }
  }
  const capitalize = (s) => (s.charAt(0).toUpperCase() + s.slice(1))
  const firstName = capitalize(segments[0])
  const lastName = segments.slice(1).map(capitalize).join(' ') || 'Admin'
  return { firstName, lastName }
}

const defaultAdminState = {
  courses: [
    { id: 'c1', code: 'CSEN701', name: 'Advanced Software Engineering' },
    { id: 'c2', code: 'DMET601', name: 'Data Mining and Analytics' },
    { id: 'c3', code: 'NETW402', name: 'Computer Networks' },
  ],
  instructors: [
    {
      id: 'i1',
      fullName: 'Dr. Nora Samir',
      email: 'nora.samir@guc.edu.eg',
      department: 'Computer Science',
      bio: 'Researcher in scalable software systems.',
      linkedCourseCodes: ['CSEN701'],
    },
    {
      id: 'i2',
      fullName: 'Dr. Karim Fathy',
      email: 'karim.fathy@guc.edu.eg',
      department: 'Data Science',
      bio: 'Applied machine learning and data systems.',
      linkedCourseCodes: ['DMET601'],
    },
    {
      id: 'i3',
      fullName: 'Dr. Hana Mostafa',
      email: 'hana.mostafa@guc.edu.eg',
      department: 'Networks',
      bio: 'Distributed systems and network protocols.',
      linkedCourseCodes: ['NETW402'],
    },
  ],
  employers: [
    {
      id: 'e1',
      companyName: 'TechNova LLC',
      industry: 'Software',
      companyEmail: 'hr@technova.com',
      phone: '+20-111-100-1001',
      address: 'Smart Village, Cairo',
      status: 'pending',
      documents: [
        { id: 'd1', name: 'Commercial Register.txt', content: 'Commercial register document for TechNova LLC.' },
        { id: 'd2', name: 'Tax Card.txt', content: 'Tax card document for TechNova LLC.' },
      ],
    },
    {
      id: 'e2',
      companyName: 'Nile Health Systems',
      industry: 'HealthTech',
      companyEmail: 'talent@nilehealth.io',
      phone: '+20-111-100-2002',
      address: 'New Cairo',
      status: 'pending',
      documents: [
        { id: 'd3', name: 'Company Profile.txt', content: 'Company profile and incorporation details.' },
      ],
    },
  ],
  notifications: [
    { id: 'n1', title: 'Link request', message: 'Dr. Nora Samir requested linking to CSEN701.', read: false, createdAt: '2026-04-26' },
    { id: 'n2', title: 'Unlink request', message: 'Dr. Karim Fathy requested unlinking from DMET601.', read: false, createdAt: '2026-04-28' },
    { id: 'n3', title: 'Appeal received', message: 'Student Mariam Adel appealed project flag P2.', read: true, createdAt: '2026-05-01' },
  ],
  linkRequests: [
    { id: 'lr1', instructorId: 'i1', courseCode: 'CSEN701', type: 'link', status: 'pending' },
    { id: 'lr2', instructorId: 'i2', courseCode: 'DMET601', type: 'unlink', status: 'pending' },
  ],
  appeals: [
    { id: 'a1', studentName: 'Mariam Adel', projectId: '2', reason: 'Independent work evidence attached', status: 'pending' },
    { id: 'a2', studentName: 'Nour Hassan', projectId: '3', reason: 'Similarity threshold is false positive', status: 'pending' },
  ],
  internshipStats: [
    { period: '2024-Q1', interns: 4, offered: 6 },
    { period: '2024-Q2', interns: 6, offered: 8 },
    { period: '2024-Q3', interns: 7, offered: 9 },
    { period: '2024-Q4', interns: 8, offered: 10 },
    { period: '2025-Q1', interns: 10, offered: 12 },
  ],
}

const projectDefaults = projectsSeed.map((project, index) => ({
  ...project,
  courseCode: index === 1 ? 'DMET601' : index === 2 ? 'NETW402' : 'CSEN701',
  instructorId: index === 1 ? 'i2' : index === 2 ? 'i3' : 'i1',
  createdAt: index === 1 ? '2025-10-18' : index === 2 ? '2026-02-10' : '2026-03-03',
  rating: index === 1 ? 4.1 : index === 2 ? 4.7 : 4.5,
  status: 'active',
  flagged: false,
}))

const portfolioDefaults = studentsSeed.map((student, index) => ({
  ...student,
  email: `${student.name.toLowerCase().replace(/\s+/g, '.')}@student.guc.edu.eg`,
  projectsCount: index === 1 ? 3 : index === 2 ? 4 : 2,
}))

function readAdminState() {
  const raw = localStorage.getItem(ADMIN_STATE_KEY)
  if (!raw) {
    localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(defaultAdminState))
    return defaultAdminState
  }

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(defaultAdminState))
    return defaultAdminState
  }
}

function saveAdminState(state) {
  localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(state))
}

function updateUserStatus(email, isActive) {
  const users = getUsers()
  const updatedUsers = users.map((user) =>
    user.email.toLowerCase() === email.toLowerCase() ? { ...user, isActive } : user,
  )
  localStorage.setItem('guc_projecthub_users', JSON.stringify(updatedUsers))
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('statistics')
  const [adminState, setAdminState] = useState(defaultAdminState)
  const [platformUsers, setPlatformUsers] = useState([])
  const [projects, setProjects] = useState(projectDefaults)
  const [portfolios] = useState(portfolioDefaults)

  const [selectedInstructorId, setSelectedInstructorId] = useState(null)
  const [selectedEmployerId, setSelectedEmployerId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(projectDefaults[0]?.id ?? null)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(portfolioDefaults[0]?.id ?? null)

  const [instructorSearch, setInstructorSearch] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const [projectCourseFilter, setProjectCourseFilter] = useState('')
  const [projectInstructorFilter, setProjectInstructorFilter] = useState('')
  const [projectDateFilter, setProjectDateFilter] = useState('')
  const [projectSortBy, setProjectSortBy] = useState('createdAt')
  const [portfolioSearch, setPortfolioSearch] = useState('')
  const [portfolioMajorFilter, setPortfolioMajorFilter] = useState('')
  const [portfolioSkillFilter, setPortfolioSkillFilter] = useState('')
  const [portfolioSortBy, setPortfolioSortBy] = useState('projectsCount')

  const [courseForm, setCourseForm] = useState({ id: null, code: '', name: '' })
  const [adminAccountForm, setAdminAccountForm] = useState({ email: '', password: '' })
  const [adminAccountError, setAdminAccountError] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login')
      return
    }

    setAdminState(readAdminState())
    setPlatformUsers(
      getUsers().map((user, index) => ({
        ...user,
        id: `${user.email}-${user.role}-${index}`,
        isActive: user.isActive ?? true,
        fullName:
          user.companyName ||
          `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
          user.username ||
          'Unnamed User',
      })),
    )
  }, [navigate])

  useEffect(() => {
    if (!selectedEmployerId && adminState.employers.length > 0) {
      setSelectedEmployerId(adminState.employers[0].id)
    }
  }, [adminState.employers, selectedEmployerId])

  useEffect(() => {
    saveAdminState(adminState)
  }, [adminState])

  const coursesByCode = useMemo(
    () => Object.fromEntries(adminState.courses.map((course) => [course.code, course])),
    [adminState.courses],
  )

  const instructorsFiltered = useMemo(() => {
    if (!instructorSearch.trim()) {
      return adminState.instructors
    }

    const query = instructorSearch.trim().toLowerCase()
    return adminState.instructors.filter((instructor) => {
      const linkedCourseNames = instructor.linkedCourseCodes
        .map((code) => coursesByCode[code]?.name ?? code)
        .join(' ')
        .toLowerCase()
      return (
        instructor.fullName.toLowerCase().includes(query) ||
        instructor.linkedCourseCodes.join(' ').toLowerCase().includes(query) ||
        linkedCourseNames.includes(query)
      )
    })
  }, [adminState.instructors, coursesByCode, instructorSearch])

  const projectResults = useMemo(() => {
    return [...projects]
      .filter((project) => {
        if (projectSearch.trim() && !project.title.toLowerCase().includes(projectSearch.toLowerCase())) {
          return false
        }
        if (projectCourseFilter && project.courseCode !== projectCourseFilter) {
          return false
        }
        if (projectInstructorFilter && project.instructorId !== projectInstructorFilter) {
          return false
        }
        if (projectDateFilter && project.createdAt !== projectDateFilter) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (projectSortBy === 'rating') {
          return b.rating - a.rating
        }
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  }, [
    projects,
    projectSearch,
    projectCourseFilter,
    projectInstructorFilter,
    projectDateFilter,
    projectSortBy,
  ])

  const portfolioResults = useMemo(() => {
    return [...portfolios]
      .filter((portfolio) => {
        const query = portfolioSearch.trim().toLowerCase()
        const bySearch =
          !query ||
          portfolio.name.toLowerCase().includes(query) ||
          portfolio.email.toLowerCase().includes(query)
        const byMajor = !portfolioMajorFilter || portfolio.major === portfolioMajorFilter
        const bySkill =
          !portfolioSkillFilter ||
          portfolio.skills.some((skill) => skill.toLowerCase() === portfolioSkillFilter.toLowerCase())
        return bySearch && byMajor && bySkill
      })
      .sort((a, b) => (portfolioSortBy === 'projectsCount' ? b.projectsCount - a.projectsCount : 0))
  }, [portfolios, portfolioSearch, portfolioMajorFilter, portfolioSkillFilter, portfolioSortBy])

  const selectedInstructor = adminState.instructors.find((item) => item.id === selectedInstructorId)
  const selectedEmployer = adminState.employers.find((item) => item.id === selectedEmployerId)
  const selectedProject = projects.find((item) => item.id === selectedProjectId)
  const selectedPortfolio = portfolioResults.find((item) => item.id === selectedPortfolioId)

  const activeProjectCount = projects.filter((project) => project.status === 'active').length
  const flaggedProjects = projects.filter((project) => project.flagged)

  const platformUsageStats = {
    totalUsers: platformUsers.length,
    totalEmployers: platformUsers.filter((user) => user.role === 'employer').length,
    totalStudents: platformUsers.filter((user) => user.role === 'student').length,
    totalInstructors: platformUsers.filter((user) => user.role === 'instructor').length,
    totalProjects: projects.length,
    totalCourses: adminState.courses.length,
  }

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const updateNotificationRead = (id, read) => {
    setAdminState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) =>
        notification.id === id ? { ...notification, read } : notification,
      ),
    }))
  }

  const markAllNotifications = (read) => {
    setAdminState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) => ({ ...notification, read })),
    }))
  }

  const handleCompanyStatus = (companyId, status) => {
    setAdminState((prev) => ({
      ...prev,
      employers: prev.employers.map((company) => (company.id === companyId ? { ...company, status } : company)),
      notifications: [
        {
          id: `n${Date.now()}`,
          title: 'Company application update',
          message: `${prev.employers.find((company) => company.id === companyId)?.companyName} was ${status}.`,
          read: false,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.notifications,
      ],
    }))
  }

  const handleDocumentDownload = (document) => {
    const blob = new Blob([document.content], { type: 'text/plain;charset=utf-8' })
    const blobUrl = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = blobUrl
    anchor.download = document.name
    anchor.click()
    URL.revokeObjectURL(blobUrl)
  }

  const handleCreateAdmin = (event) => {
    event.preventDefault()
    setAdminAccountError('')
    const email = adminAccountForm.email.trim().toLowerCase()
    const password = adminAccountForm.password

    if (!email || !password) {
      setAdminAccountError('GUC email and password are required.')
      return
    }

    if (!isGucEmail(email)) {
      setAdminAccountError('Use a GUC email address (for example name@guc.edu.eg or name@student.guc.edu.eg).')
      return
    }

    const users = getUsers()
    if (users.some((user) => user.email.toLowerCase() === email && user.role === 'admin')) {
      setAdminAccountError('An administrator account already exists for this email.')
      return
    }

    const { firstName, lastName } = deriveNamePartsFromEmail(email)
    const fullName = `${firstName} ${lastName}`.trim()
    const newAdmin = {
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      isActive: true,
    }

    saveUser(newAdmin)
    setPlatformUsers((prev) => [
      ...prev,
      {
        ...newAdmin,
        id: `${newAdmin.email}-admin-${Date.now()}`,
        fullName,
      },
    ])
    setAdminAccountForm({ email: '', password: '' })
  }

  const toggleUserStatus = (user) => {
    const nextIsActive = !(user.isActive ?? true)
    setPlatformUsers((prev) =>
      prev.map((entry) =>
        entry.id === user.id ? { ...entry, isActive: nextIsActive } : entry,
      ),
    )
    updateUserStatus(user.email, nextIsActive)
  }

  const handleCourseSubmit = (event) => {
    event.preventDefault()
    if (!courseForm.code.trim() || !courseForm.name.trim()) {
      return
    }

    if (courseForm.id) {
      setAdminState((prev) => ({
        ...prev,
        courses: prev.courses.map((course) => (course.id === courseForm.id ? { ...course, ...courseForm } : course)),
      }))
    } else {
      setAdminState((prev) => ({
        ...prev,
        courses: [...prev.courses, { id: `c${Date.now()}`, code: courseForm.code.trim(), name: courseForm.name.trim() }],
      }))
    }

    setCourseForm({ id: null, code: '', name: '' })
  }

  const deleteCourse = (courseId) => {
    setAdminState((prev) => ({
      ...prev,
      courses: prev.courses.filter((course) => course.id !== courseId),
    }))
  }

  const handleLinkRequest = (requestId, status) => {
    setAdminState((prev) => ({
      ...prev,
      linkRequests: prev.linkRequests.map((request) =>
        request.id === requestId ? { ...request, status } : request,
      ),
      notifications: [
        {
          id: `n${Date.now()}`,
          title: 'Linking request decision',
          message: `A course ${prev.linkRequests.find((request) => request.id === requestId)?.type} request was ${status}.`,
          read: false,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.notifications,
      ],
    }))
  }

  const toggleProjectStatus = (projectId) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, status: project.status === 'active' ? 'inactive' : 'active' }
          : project,
      ),
    )
  }

  const toggleProjectFlag = (projectId) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, flagged: !project.flagged } : project,
      ),
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-blue-700">Admin Portal</h1>
            <p className="text-xs text-slate-500 mt-2">Admin requirements directory</p>
          </div>
          <nav className="mt-2 flex flex-col gap-1 px-4 text-sm font-medium">
            <TabButton id="statistics" current={activeTab} set={setActiveTab} label="Platform Statistics" />
            <TabButton id="approvals" current={activeTab} set={setActiveTab} label="Employer Approvals" />
            <TabButton id="users" current={activeTab} set={setActiveTab} label="User Management" />
            <TabButton id="projects" current={activeTab} set={setActiveTab} label="Projects and Portfolios" />
            <TabButton id="courses" current={activeTab} set={setActiveTab} label="Courses and Instructors" />
            <TabButton id="notifications" current={activeTab} set={setActiveTab} label="Notifications and Appeals" />
            <TabButton id="adminAccounts" current={activeTab} set={setActiveTab} label="Admin Accounts" />
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
          >
            Change Forgotten Password (OTP)
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mt-1"
          >
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {activeTab === 'statistics' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Platform Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total Users" value={platformUsageStats.totalUsers} desc={`Students: ${platformUsageStats.totalStudents} | Employers: ${platformUsageStats.totalEmployers} | Instructors: ${platformUsageStats.totalInstructors}`} />
              <StatCard title="Total Projects" value={platformUsageStats.totalProjects} desc={`Active projects: ${activeProjectCount}`} />
              <StatCard title="Total Courses" value={platformUsageStats.totalCourses} desc="Courses currently in catalog" />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg">Internship Statistics Over Time</h3>
              <p className="text-sm text-slate-500 mb-4">Students who completed internships vs internships offered.</p>
              <div className="space-y-2">
                {adminState.internshipStats.map((entry) => (
                  <div key={entry.period} className="flex items-center justify-between border border-slate-100 rounded-md px-3 py-2">
                    <span className="text-sm font-medium">{entry.period}</span>
                    <span className="text-sm text-slate-600">Interns: {entry.interns} | Offered: {entry.offered}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'approvals' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Employer Approvals</h2>
            <p className="text-sm text-slate-600">
              Select any employer from the left table to view company details, inspect uploaded documents, and download files.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminState.employers.map((company) => (
                      <tr
                        key={company.id}
                        className={`border-b border-slate-100 ${selectedEmployerId === company.id ? 'bg-blue-50' : ''}`}
                      >
                        <td className="p-4">{company.companyName}</td>
                        <td className="p-4 capitalize">{company.status}</td>
                        <td className="p-4">
                          <button
                            onClick={() => setSelectedEmployerId(company.id)}
                            className="text-blue-700 hover:underline"
                          >
                            View profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                {selectedEmployer ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Company Details & Uploaded Documents</h3>
                    <p className="text-sm font-medium text-slate-800">{selectedEmployer.companyName}</p>
                    <p className="text-sm text-slate-600">{selectedEmployer.industry} | {selectedEmployer.address}</p>
                    <p className="text-sm text-slate-600">{selectedEmployer.companyEmail} | {selectedEmployer.phone}</p>
                    <p className="text-sm font-medium capitalize">Current status: {selectedEmployer.status}</p>
                    <div className="pt-2">
                      <h4 className="font-medium mb-2">Uploaded documents (View / Download)</h4>
                      {selectedEmployer.documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between border border-slate-100 rounded-md p-2 mb-2">
                          <span className="text-sm">{document.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.alert(document.content)}
                              className="text-blue-700 text-sm hover:underline"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDocumentDownload(document)}
                              className="text-blue-700 text-sm hover:underline"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleCompanyStatus(selectedEmployer.id, 'accepted')} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Accept</button>
                      <button onClick={() => handleCompanyStatus(selectedEmployer.id, 'rejected')} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Reject</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select a company to view details and documents.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4">Full name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Account status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {platformUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100">
                      <td className="p-4">{user.fullName}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4 capitalize">{user.role}</td>
                      <td className="p-4">{user.isActive ? 'Active' : 'Deactivated'}</td>
                      <td className="p-4">
                        <button onClick={() => toggleUserStatus(user)} className="text-sm text-blue-700 hover:underline">
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'projects' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Projects and Portfolios</h2>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold">Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search by project title" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
                <select value={projectCourseFilter} onChange={(event) => setProjectCourseFilter(event.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option value="">All courses</option>
                  {adminState.courses.map((course) => <option key={course.id} value={course.code}>{course.code}</option>)}
                </select>
                <select value={projectInstructorFilter} onChange={(event) => setProjectInstructorFilter(event.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option value="">All instructors</option>
                  {adminState.instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.fullName}</option>)}
                </select>
                <input type="date" value={projectDateFilter} onChange={(event) => setProjectDateFilter(event.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
                <select value={projectSortBy} onChange={(event) => setProjectSortBy(event.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option value="createdAt">Sort by creation date</option>
                  <option value="rating">Sort by rating</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Title</th>
                        <th className="p-3">Created</th>
                        <th className="p-3">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectResults.map((project) => (
                        <tr key={project.id} className="border-b border-slate-100">
                          <td className="p-3">
                            <button onClick={() => setSelectedProjectId(project.id)} className="text-blue-700 hover:underline">
                              {project.title}
                            </button>
                          </td>
                          <td className="p-3">{project.createdAt}</td>
                          <td className="p-3">{project.rating.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border border-slate-200 rounded-md p-4">
                  {selectedProject ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold">{selectedProject.title}</h4>
                      <p className="text-sm text-slate-600">{selectedProject.summary}</p>
                      <p className="text-sm">Course: {selectedProject.courseCode}</p>
                      <p className="text-sm">Instructor: {adminState.instructors.find((instructor) => instructor.id === selectedProject.instructorId)?.fullName}</p>
                      <p className="text-sm">Status: {selectedProject.status} | Flagged: {selectedProject.flagged ? 'Yes' : 'No'}</p>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => toggleProjectStatus(selectedProject.id)} className="text-sm px-3 py-1 border border-slate-300 rounded-md">
                          {selectedProject.status === 'active' ? 'Deactivate' : 'Activate'} project
                        </button>
                        <button onClick={() => toggleProjectFlag(selectedProject.id)} className="text-sm px-3 py-1 border border-red-300 text-red-700 rounded-md">
                          {selectedProject.flagged ? 'Unflag' : 'Flag'} inappropriate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Select a project from results to view details.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold">Portfolios</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input value={portfolioSearch} onChange={(event) => setPortfolioSearch(event.target.value)} placeholder="Search by student name or email" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
                <select value={portfolioMajorFilter} onChange={(event) => setPortfolioMajorFilter(event.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option value="">All majors</option>
                  {[...new Set(portfolios.map((portfolio) => portfolio.major))].map((major) => <option key={major} value={major}>{major}</option>)}
                </select>
                <select value={portfolioSkillFilter} onChange={(event) => setPortfolioSkillFilter(event.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option value="">All skills</option>
                  {[...new Set(portfolios.flatMap((portfolio) => portfolio.skills))].map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                </select>
                <select value={portfolioSortBy} onChange={(event) => setPortfolioSortBy(event.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option value="projectsCount">Sort by number of projects</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3">Major</th>
                        <th className="p-3">Projects</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioResults.map((portfolio) => (
                        <tr key={portfolio.id} className="border-b border-slate-100">
                          <td className="p-3">
                            <button onClick={() => setSelectedPortfolioId(portfolio.id)} className="text-blue-700 hover:underline">{portfolio.name}</button>
                          </td>
                          <td className="p-3">{portfolio.major}</td>
                          <td className="p-3">{portfolio.projectsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border border-slate-200 rounded-md p-4">
                  {selectedPortfolio ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold">{selectedPortfolio.name}</h4>
                      <p className="text-sm text-slate-600">{selectedPortfolio.email}</p>
                      <p className="text-sm">Major: {selectedPortfolio.major}</p>
                      <p className="text-sm">Skills: {selectedPortfolio.skills.join(', ')}</p>
                      <p className="text-sm">Projects on portfolio: {selectedPortfolio.projectsCount}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Select a portfolio to view full details.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-red-700 mb-3">Flagged Projects</h3>
              {flaggedProjects.length ? (
                <ul className="space-y-2">
                  {flaggedProjects.map((project) => (
                    <li key={project.id} className="border border-red-100 bg-red-50 rounded-md p-3 text-sm">
                      {project.title} ({project.courseCode}) - {project.student}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No flagged projects currently.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'courses' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Courses and Instructors</h2>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-3">Course CRUD</h3>
              <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleCourseSubmit}>
                <input value={courseForm.code} onChange={(event) => setCourseForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="Course code" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
                <input value={courseForm.name} onChange={(event) => setCourseForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Course name" className="border border-slate-300 rounded-md px-3 py-2 text-sm" />
                <button type="submit" className="bg-blue-700 text-white rounded-md px-3 py-2 text-sm">
                  {courseForm.id ? 'Update course' : 'Create course'}
                </button>
              </form>
              <div className="mt-4 border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Course code</th>
                      <th className="p-3">Course name</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminState.courses.map((course) => (
                      <tr key={course.id} className="border-b border-slate-100">
                        <td className="p-3">{course.code}</td>
                        <td className="p-3">{course.name}</td>
                        <td className="p-3 flex gap-3">
                          <button onClick={() => setCourseForm(course)} className="text-blue-700 hover:underline">Edit</button>
                          <button onClick={() => deleteCourse(course.id)} className="text-red-700 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-3">Search Instructors by Name or Course</h3>
                <input value={instructorSearch} onChange={(event) => setInstructorSearch(event.target.value)} placeholder="Instructor name / course code / course name" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mb-3" />
                <ul className="space-y-2">
                  {instructorsFiltered.map((instructor) => (
                    <li key={instructor.id} className="border border-slate-100 rounded-md p-3">
                      <button onClick={() => setSelectedInstructorId(instructor.id)} className="font-medium text-blue-700 hover:underline">
                        {instructor.fullName}
                      </button>
                      <p className="text-xs text-slate-500 mt-1">{instructor.email}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                {selectedInstructor ? (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{selectedInstructor.fullName}</h3>
                    <p className="text-sm text-slate-600">{selectedInstructor.email}</p>
                    <p className="text-sm">Department: {selectedInstructor.department}</p>
                    <p className="text-sm">Bio: {selectedInstructor.bio}</p>
                    <div>
                      <p className="text-sm font-medium">Linked courses</p>
                      <ul className="text-sm list-disc pl-6">
                        {selectedInstructor.linkedCourseCodes.map((code) => (
                          <li key={code}>{code} - {coursesByCode[code]?.name ?? 'Course removed'}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select an instructor to view profile details and linked courses.</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-3">Link and Unlink Requests</h3>
              <ul className="space-y-2">
                {adminState.linkRequests.map((request) => {
                  const instructor = adminState.instructors.find((item) => item.id === request.instructorId)
                  return (
                    <li key={request.id} className="border border-slate-100 rounded-md p-3 flex items-center justify-between">
                      <span className="text-sm">
                        {instructor?.fullName} requested to {request.type} {request.courseCode} ({request.status})
                      </span>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleLinkRequest(request.id, 'accepted')} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded">Accept</button>
                          <button onClick={() => handleLinkRequest(request.id, 'rejected')} className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded">Reject</button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Notifications and Appeals</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex gap-3">
                  <button onClick={() => markAllNotifications(true)} className="text-sm text-blue-700 hover:underline">Mark all read</button>
                  <button onClick={() => markAllNotifications(false)} className="text-sm text-blue-700 hover:underline">Mark all unread</button>
                </div>
              </div>
              <ul className="space-y-2">
                {adminState.notifications.map((notification) => (
                  <li key={notification.id} className={`border rounded-md p-3 ${notification.read ? 'border-slate-200 bg-slate-50' : 'border-blue-100 bg-blue-50'}`}>
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-sm text-slate-700">{notification.message}</p>
                    <p className="text-xs text-slate-500">{notification.createdAt}</p>
                    <button onClick={() => updateNotificationRead(notification.id, !notification.read)} className="mt-1 text-xs text-blue-700 hover:underline">
                      Mark as {notification.read ? 'unread' : 'read'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-3">Student Appeals</h3>
              <ul className="space-y-2">
                {adminState.appeals.map((appeal) => (
                  <li key={appeal.id} className="border border-slate-100 rounded-md p-3 text-sm">
                    <p><span className="font-medium">Student:</span> {appeal.studentName}</p>
                    <p><span className="font-medium">Project ID:</span> {appeal.projectId}</p>
                    <p><span className="font-medium">Reason:</span> {appeal.reason}</p>
                    <p><span className="font-medium">Status:</span> {appeal.status}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {activeTab === 'adminAccounts' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Accounts</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-3">Create Admin Account (GUC email + password)</h3>
              <p className="text-sm text-slate-600 mb-3">
                Only verified GUC email domains are accepted (including @guc.edu.eg and subdomains such as @student.guc.edu.eg).
              </p>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreateAdmin}>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-slate-600">GUC email</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={adminAccountForm.email}
                    onChange={(event) => {
                      setAdminAccountError('')
                      setAdminAccountForm((prev) => ({ ...prev, email: event.target.value }))
                    }}
                    placeholder="name@guc.edu.eg"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Password</span>
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={adminAccountForm.password}
                    onChange={(event) => {
                      setAdminAccountError('')
                      setAdminAccountForm((prev) => ({ ...prev, password: event.target.value }))
                    }}
                    placeholder="Password"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  />
                </label>
                {adminAccountError && <p className="md:col-span-2 text-sm font-medium text-red-600">{adminAccountError}</p>}
                <button type="submit" className="md:col-span-2 w-fit bg-blue-700 text-white px-4 py-2 rounded-md">Create Admin</button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function TabButton({ id, current, set, label }) {
  const isActive = current === id
  return (
    <button
      onClick={() => set(id)}
      className={`text-left px-4 py-2 rounded-lg transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
}

function StatCard({ title, value, desc }) {
  return (
    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
  )
}

export default AdminDashboard