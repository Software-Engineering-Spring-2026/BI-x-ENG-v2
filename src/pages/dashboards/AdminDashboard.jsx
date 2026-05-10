import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getUsers, logoutUser, saveUser } from '../../data/authStorage'

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_STATE_KEY = 'guc_projecthub_admin_state'

const LS = {
  get: (k, fb) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb }
  },
}

function isGucEmail(email) {
  return /^[^\s@]+@guc\.edu\.eg$/i.test(email.trim().toLowerCase())
}

function deriveNamePartsFromEmail(email) {
  const local = email.trim().split('@')[0].toLowerCase()
  const segs = local.split(/[._-]+/).filter(Boolean)
  if (!segs.length) return { firstName: 'Admin', lastName: 'User' }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
  return { firstName: cap(segs[0]), lastName: segs.slice(1).map(cap).join(' ') || 'Admin' }
}

function updateUserStatusInStorage(email, isActive) {
  localStorage.setItem(
    'guc_projecthub_users',
    JSON.stringify(getUsers().map((u) => u.email.toLowerCase() === email.toLowerCase() ? { ...u, isActive } : u)),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin-persisted state (only admin-managed decisions live here)
// ─────────────────────────────────────────────────────────────────────────────

const defaultAdminState = {
  courses: [
    { id: 'c1', code: 'CSEN701', name: 'Advanced Software Engineering' },
    { id: 'c2', code: 'DMET601', name: 'Data Mining and Analytics' },
    { id: 'c3', code: 'NETW402', name: 'Computer Networks' },
  ],
  notifications: [
    { id: 'n1', title: 'Link request', message: 'Dr. Nora Samir requested linking to CSEN701.', read: false, createdAt: '2026-04-26' },
    { id: 'n2', title: 'Unlink request', message: 'Dr. Karim Fathy requested unlinking from DMET601.', read: false, createdAt: '2026-04-28' },
    { id: 'n3', title: 'Appeal received', message: 'Student Mariam Adel appealed a project flag.', read: true, createdAt: '2026-05-01' },
  ],
  notificationsEnabled: true,
  linkRequests: [
    // Added Dummy Data for Link/Unlink requests
    { id: 'lr1', instructorName: 'Dr. Nora Samir', instructorEmail: 'nora.samir@guc.edu.eg', courseCode: 'CSEN701', type: 'link', status: 'pending', createdAt: '2026-04-26' },
    { id: 'lr2', instructorName: 'Dr. Karim Fathy', instructorEmail: 'karim.fathy@guc.edu.eg', courseCode: 'DMET601', type: 'unlink', status: 'pending', createdAt: '2026-04-28' },
    { id: 'lr3', instructorName: 'Eng. Youssef', instructorEmail: 'youssef@guc.edu.eg', courseCode: 'CSEN701', type: 'link', status: 'pending', createdAt: '2026-05-05' },
  ],
  appeals: [
    { id: 'a1', studentName: 'Mariam Adel', studentEmail: 'mariam.adel@student.guc.edu.eg', projectId: '2', projectTitle: 'AI Chatbot', reason: 'Independent work evidence attached.', status: 'pending', createdAt: '2026-05-01' },
    { id: 'a2', studentName: 'Nour Hassan', studentEmail: 'nour.hassan@student.guc.edu.eg', projectId: '3', projectTitle: 'Network Simulator', reason: 'Similarity threshold is a false positive.', status: 'pending', createdAt: '2026-05-03' },
  ],
  internshipStats: [
    { period: '2024-Q1', interns: 4, offered: 6 },
    { period: '2024-Q2', interns: 6, offered: 8 },
    { period: '2024-Q3', interns: 7, offered: 9 },
    { period: '2024-Q4', interns: 8, offered: 10 },
    { period: '2025-Q1', interns: 10, offered: 12 },
  ],
  employerStatuses: {},
  
  projectOverrides: {},
}

function readAdminState() {
  try {
    const raw = localStorage.getItem(ADMIN_STATE_KEY)
    if (!raw) { localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(defaultAdminState)); return defaultAdminState }
    const parsed = JSON.parse(raw)
    return {
      ...defaultAdminState,
      ...parsed,
      employerStatuses: parsed.employerStatuses || {},
      projectOverrides: parsed.projectOverrides || {},
      notificationsEnabled: parsed.notificationsEnabled ?? true,
      linkRequests: parsed.linkRequests?.length ? parsed.linkRequests : defaultAdminState.linkRequests,
    }
  } catch { return defaultAdminState }
}

function saveAdminState(state) {
  localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(state))
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic data builders
// ─────────────────────────────────────────────────────────────────────────────

function buildInstructors(platformUsers) {
  return platformUsers.filter((u) => u.role === 'instructor').map((u) => {
    const profile = LS.get('instructor_profile_' + u.email, {})
    const linkedCourses = LS.get('instructor_courses_' + u.email, [])
    const fn = profile.firstName || u.firstName || ''
    const ln = profile.lastName  || u.lastName  || ''
    return {
      id: u.email,
      fullName: `${fn} ${ln}`.trim() || u.email,
      email: u.email,
      department: profile.department || u.department || '',
      bio: profile.bio || '',
      research: profile.research || '',
      education: profile.education || '',
      linkedCourseCodes: Array.isArray(linkedCourses) ? linkedCourses : [],
      isActive: u.isActive ?? true,
    }
  })
}

function buildEmployers(platformUsers, employerStatuses) {
  const builtEmployers = platformUsers.filter((u) => u.role === 'employer').map((u) => {
    const empId = u.email.toLowerCase()
    const profile = LS.get(`guc_emp_profile_${empId}`, {})
    const internships = LS.get(`emp_interns_${empId}`, [])
    const documents = []
    if (profile.taxCertificate) {
      documents.push({ id: `tax_${empId}`, name: profile.taxCertificateName || 'Tax Certificate', content: profile.taxCertificate, isImage: profile.taxCertificate.startsWith('data:image') })
    }
    if (profile.logo && profile.logo.startsWith('data:')) {
      documents.push({ id: `logo_${empId}`, name: 'Company Logo', content: profile.logo, isImage: true })
    }
    return {
      id: empId,
      companyName: u.companyName || profile.companyName || u.email,
      industry: u.industry || profile.industry || '',
      companyEmail: u.email,
      phone: profile.phone || u.phone || '',
      address: profile.address || u.address || '',
      bio: profile.bio || '',
      website: profile.website || '',
      mapLocationAddress: profile.mapLocationAddress || '',
      isVerified: profile.isVerified || false,
      documents,
      internshipsOffered: internships.length,
      internshipsList: internships,
      studentsHired: internships.reduce((s, i) => s + (Array.isArray(i.applicants) ? i.applicants.filter((a) => a.status === 'Accepted').length : 0), 0),
      status: employerStatuses[empId] ?? 'pending',
      isActive: u.isActive ?? true,
    }
  })

  // Added Dummy Data for an Employer to test UI rendering of documents & contact info
  if (!builtEmployers.some(e => e.id === 'demo_employer_hq')) {
    builtEmployers.unshift({
      id: 'demo_employer_hq',
      companyName: 'Maadihood Tech Solutions',
      industry: 'Software Engineering',
      companyEmail: 'contact@maadihoodtech.com',
      phone: '+20 123 456 7890',
      address: 'Building 7, Open Community Tech Park, Cairo',
      bio: 'We are an innovative tech hub representing an open and integrated community rather than a closed bubble, building solutions for the future.',
      website: 'https://maadihoodtech.com',
      mapLocationAddress: 'Maadi, Cairo Governorate, Egypt',
      isVerified: true,
      documents: [
        { id: 'logo_demo', name: 'Company Logo.png', content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBoMIwwAAAABJRU5ErkJggg==', isImage: true },
        { id: 'tax_demo', name: 'Tax_Certificate_2026.txt', content: 'Official Tax Certificate\n\nCompany: Maadihood Tech Solutions\nStatus: Verified and Active\nYear: 2026', isImage: false }
      ],
      internshipsOffered: 12,
      internshipsList: [],
      studentsHired: 4,
      status: employerStatuses['demo_employer_hq'] ?? 'pending',
      isActive: true,
    })
  }

  return builtEmployers
}

function buildProjects(projectOverrides) {
  return LS.get('student_projects', []).map((p) => {
    const ov = projectOverrides[p.id] || {}
    return {
      ...p,
      courseCode: p.courseCode || p.course || '',
      instructorId: p.instructorId || p.instructorEmail || '',
      createdAt: p.createdAt || new Date().toISOString().slice(0, 10),
      rating: typeof p.rating === 'number' ? p.rating : typeof p.averageRating === 'number' ? p.averageRating : 0,
      status: ov.status ?? (p.status || 'active'),
      flagged: ov.flagged ?? (p.flagged || false),
      flagReason: ov.flagReason ?? (p.flagReason || ''),
    }
  })
}

function buildPortfolios(platformUsers, projects) {
  return platformUsers.filter((u) => u.role === 'student').map((u) => {
    const profile = LS.get('student_profile_' + u.email, {})
    const fn = profile.firstName || u.firstName || ''
    const ln = profile.lastName  || u.lastName  || ''
    const fullName = `${fn} ${ln}`.trim() || u.email
    const sp = projects.filter((p) => p.ownerEmail === u.email || p.owner === fullName || p.owner === u.email)
    return {
      id: u.email,
      name: fullName,
      email: u.email,
      major: profile.major || u.major || '',
      skills: Array.isArray(profile.skills) ? profile.skills : Array.isArray(u.skills) ? u.skills : [],
      projectsCount: sp.length,
      projects: sp,
      gpa: profile.gpa || u.gpa || null,
      isActive: u.isActive ?? true,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG icons
// ─────────────────────────────────────────────────────────────────────────────

const IC = {
  bell:     'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  flag:     'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  x:        'M18 6L6 18M6 6l12 12',
  check:    'M20 6L9 17l-5-5',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6',
  refresh:  'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
}
const Ico = ({ d, size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [adminState, setAdminState] = useState(() => readAdminState())
  const [platformUsers, setPlatformUsers] = useState([])
  const [projects, setProjects] = useState([])

  // Navigation
  const [activeTab, setActiveTab] = useState('statistics')
  const [userMgmtTab, setUserMgmtTab] = useState('students')

  // Filters
  const [projectSearch, setProjectSearch] = useState('')
  const [projectCourseFilter, setProjectCourseFilter] = useState('')
  const [projectFlagFilter, setProjectFlagFilter] = useState('all')
  const [projectSortBy, setProjectSortBy] = useState('createdAt')
  const [portfolioSearch, setPortfolioSearch] = useState('')
  const [portfolioMajorFilter, setPortfolioMajorFilter] = useState('')
  const [portfolioSkillFilter, setPortfolioSkillFilter] = useState('')
  const [portfolioSortBy, setPortfolioSortBy] = useState('projectsCount')
  const [userSearch, setUserSearch] = useState('')

  // Modals
  const [viewDocModal, setViewDocModal] = useState(null)
  const [flagModal, setFlagModal] = useState(null)
  const [flagReason, setFlagReason] = useState('')

  // Forms
  const [courseForm, setCourseForm] = useState({ id: null, code: '', name: '' })
  const [adminAccountForm, setAdminAccountForm] = useState({ email: '', password: '' })
  const [adminAccountError, setAdminAccountError] = useState('')
  const [adminAccountSuccess, setAdminAccountSuccess] = useState('')

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  const refreshUsers = useCallback(() => {
    setPlatformUsers(
      getUsers().map((user, i) => ({
        ...user,
        id: `${user.email}-${user.role}-${i}`,
        isActive: user.isActive ?? true,
        fullName: user.companyName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || 'Unnamed User',
      })),
    )
  }, [])

  const refreshProjects = useCallback((overrides) => {
    setProjects(buildProjects(overrides ?? adminState.projectOverrides))
  }, [adminState.projectOverrides])

  const syncExternalLinkRequests = useCallback(() => {
    const external = LS.get('guc_link_requests', [])
    if (!external.length) return
    setAdminState((prev) => {
      if (!prev.notificationsEnabled) return prev
      const existingIds = new Set(prev.linkRequests.map((r) => r.id))
      const newReqs = external.filter((r) => !existingIds.has(r.id))
      if (!newReqs.length) return prev
      const notifs = newReqs.map((r) => ({
        id: `n_lr_${r.id}`, title: `${r.type === 'link' ? 'Link' : 'Unlink'} request`,
        message: `${r.instructorName || r.instructorEmail} requested to ${r.type} course ${r.courseCode}.`,
        read: false, createdAt: new Date().toISOString().slice(0, 10),
      }))
      return { ...prev, linkRequests: [...prev.linkRequests, ...newReqs], notifications: [...notifs, ...prev.notifications] }
    })
  }, [])

  useEffect(() => {
    const cu = getCurrentUser()
    if (!cu || cu.role !== 'admin') { navigate('/login'); return }
    refreshUsers()
    setProjects(buildProjects(adminState.projectOverrides))
    syncExternalLinkRequests()
  }, [navigate, refreshUsers, syncExternalLinkRequests]) // eslint-disable-line

  useEffect(() => { saveAdminState(adminState) }, [adminState])

  // ── Derived data ──────────────────────────────────────────────────────────

  const instructors = useMemo(() => buildInstructors(platformUsers), [platformUsers])
  const employers   = useMemo(() => buildEmployers(platformUsers, adminState.employerStatuses), [platformUsers, adminState.employerStatuses])
  const portfolios  = useMemo(() => buildPortfolios(platformUsers, projects), [platformUsers, projects])
  const coursesByCode = useMemo(() => Object.fromEntries(adminState.courses.map((c) => [c.code, c])), [adminState.courses])

  const projectResults = useMemo(() => {
    return [...projects]
      .filter((p) => {
        if (projectSearch.trim() && !p.title?.toLowerCase().includes(projectSearch.toLowerCase())) return false
        if (projectCourseFilter && p.courseCode !== projectCourseFilter) return false
        if (projectFlagFilter === 'flagged' && !p.flagged) return false
        if (projectFlagFilter === 'inactive' && p.status !== 'inactive') return false
        return true
      })
      .sort((a, b) => projectSortBy === 'rating' ? b.rating - a.rating : new Date(b.createdAt) - new Date(a.createdAt))
  }, [projects, projectSearch, projectCourseFilter, projectFlagFilter, projectSortBy])

  const portfolioResults = useMemo(() => {
    return [...portfolios]
      .filter((p) => {
        const q = portfolioSearch.trim().toLowerCase()
        return (!q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)) &&
          (!portfolioMajorFilter || p.major === portfolioMajorFilter) &&
          (!portfolioSkillFilter || p.skills.some((s) => s.toLowerCase() === portfolioSkillFilter.toLowerCase()))
      })
      .sort((a, b) => portfolioSortBy === 'projectsCount' ? b.projectsCount - a.projectsCount : 0)
  }, [portfolios, portfolioSearch, portfolioMajorFilter, portfolioSkillFilter, portfolioSortBy])

  const filteredUsersByRole = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return platformUsers.filter((u) => {
      if (userMgmtTab === 'students'    && u.role !== 'student')    return false
      if (userMgmtTab === 'instructors' && u.role !== 'instructor') return false
      if (userMgmtTab === 'employers'   && u.role !== 'employer')   return false
      if (q && !u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [platformUsers, userMgmtTab, userSearch])

  const flaggedProjects = projects.filter((p) => p.flagged)
  const activeProjectCount = projects.filter((p) => p.status === 'active').length
  const unreadCount = adminState.notifications.filter((n) => !n.read).length
  const allRead = unreadCount === 0

  const platformUsageStats = {
    totalUsers: platformUsers.length,
    totalEmployers:   platformUsers.filter((u) => u.role === 'employer').length,
    totalStudents:    platformUsers.filter((u) => u.role === 'student').length,
    totalInstructors: platformUsers.filter((u) => u.role === 'instructor').length,
    totalProjects: projects.length,
    totalCourses: adminState.courses.length,
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogout = () => { logoutUser(); navigate('/login') }

  const updateNotificationRead = (id, read) =>
    setAdminState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => n.id === id ? { ...n, read } : n) }))
  const markAllNotifications = (read) =>
    setAdminState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => ({ ...n, read })) }))
  const toggleNotificationsEnabled = () =>
    setAdminState((prev) => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))

  const handleCompanyStatus = (employerId, status) => {
    const emp = employers.find((e) => e.id === employerId)
    setAdminState((prev) => {
      const notif = prev.notificationsEnabled ? [{ id: `n${Date.now()}`, title: 'Company application update', message: `${emp?.companyName || employerId} application was ${status}.`, read: false, createdAt: new Date().toISOString().slice(0, 10) }] : []
      return { ...prev, employerStatuses: { ...prev.employerStatuses, [employerId]: status }, notifications: [...notif, ...prev.notifications] }
    })
  }

  const handleDocumentDownload = (doc) => {
    const a = window.document.createElement('a')
    if (doc.isImage) { a.href = doc.content; a.download = doc.name }
    else {
      const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' })
      a.href = URL.createObjectURL(blob); a.download = doc.name
      a.addEventListener('click', () => URL.revokeObjectURL(a.href), { once: true })
    }
    a.click()
  }

  const handleCreateAdmin = (e) => {
    e.preventDefault(); setAdminAccountError(''); setAdminAccountSuccess('')
    const email = adminAccountForm.email.trim().toLowerCase()
    const { password } = adminAccountForm
    if (!email || !password) { setAdminAccountError('GUC email and password are required.'); return }
    if (!isGucEmail(email)) { setAdminAccountError('Use a GUC email (e.g. name@guc.edu.eg).'); return }
    if (getUsers().some((u) => u.email.toLowerCase() === email && u.role === 'admin')) { setAdminAccountError('An admin account already exists for this email.'); return }
    const { firstName, lastName } = deriveNamePartsFromEmail(email)
    saveUser({ firstName, lastName, email, password, role: 'admin', isActive: true })
    refreshUsers()
    setAdminAccountForm({ email: '', password: '' })
    setAdminAccountSuccess(`Admin account created for ${email}.`)
    window.setTimeout(() => setAdminAccountSuccess(''), 5000)
  }

  const toggleUserStatus = (user) => {
    const next = !(user.isActive ?? true)
    setPlatformUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: next } : u))
    updateUserStatusInStorage(user.email, next)
  }

  const handleCourseSubmit = (e) => {
    e.preventDefault()
    if (!courseForm.code.trim() || !courseForm.name.trim()) return
    
    if (courseForm.id) {
      setAdminState((prev) => ({ 
        ...prev, 
        courses: prev.courses.map((c) => c.id === courseForm.id ? { ...c, code: courseForm.code.trim(), name: courseForm.name.trim() } : c) 
      }))
    } else {
      setAdminState((prev) => ({ 
        ...prev, 
        courses: [...prev.courses, { id: `c${Date.now()}`, code: courseForm.code.trim(), name: courseForm.name.trim() }] 
      }))
    }
    setCourseForm({ id: null, code: '', name: '' })
  }
  
  const deleteCourse = (id) => setAdminState((prev) => ({ ...prev, courses: prev.courses.filter((c) => c.id !== id) }))

  const handleLinkRequest = (requestId, status) => {
    setAdminState((prev) => {
      const req = prev.linkRequests.find((r) => r.id === requestId)
      const notif = prev.notificationsEnabled ? [{ id: `n${Date.now()}`, title: 'Linking request decision', message: `${req?.instructorName || req?.instructorEmail || 'An instructor'}'s ${req?.type} request for ${req?.courseCode} was ${status}.`, read: false, createdAt: new Date().toISOString().slice(0, 10) }] : []
      return { ...prev, linkRequests: prev.linkRequests.map((r) => r.id === requestId ? { ...r, status } : r), notifications: [...notif, ...prev.notifications] }
    })
  }

  const openFlagModal = (project) => { setFlagModal({ projectId: project.id, title: project.title }); setFlagReason('') }
  const confirmFlag = () => {
    if (!flagReason.trim()) return
    const { projectId, title } = flagModal
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, flagged: true, flagReason: flagReason.trim() } : p))
    setAdminState((prev) => {
      const curr = prev.projectOverrides[projectId] || {}
      const notif = prev.notificationsEnabled ? [{ id: `n${Date.now()}`, title: 'Project flagged', message: `"${title}" was flagged: ${flagReason.trim()}`, read: false, createdAt: new Date().toISOString().slice(0, 10) }] : []
      return { ...prev, projectOverrides: { ...prev.projectOverrides, [projectId]: { ...curr, flagged: true, flagReason: flagReason.trim() } }, notifications: [...notif, ...prev.notifications] }
    })
    setFlagModal(null); setFlagReason('')
  }
  const unflagProject = (projectId) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, flagged: false, flagReason: '' } : p))
    setAdminState((prev) => {
      const curr = prev.projectOverrides[projectId] || {}
      return { ...prev, projectOverrides: { ...prev.projectOverrides, [projectId]: { ...curr, flagged: false, flagReason: '' } } }
    })
  }
  const toggleProjectStatus = (projectId) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p))
    setAdminState((prev) => {
      const curr = prev.projectOverrides[projectId] || {}
      const cur = curr.status ?? projects.find((p) => p.id === projectId)?.status ?? 'active'
      return { ...prev, projectOverrides: { ...prev.projectOverrides, [projectId]: { ...curr, status: cur === 'active' ? 'inactive' : 'active' } } }
    })
  }

  const handleAppealDecision = (appealId, status) => {
    setAdminState((prev) => {
      const appeal = prev.appeals.find((a) => a.id === appealId)
      const notif = prev.notificationsEnabled ? [{ id: `n${Date.now()}`, title: 'Appeal decision', message: `Appeal from ${appeal?.studentName || 'student'} for "${appeal?.projectTitle || 'project'}" was ${status}.`, read: false, createdAt: new Date().toISOString().slice(0, 10) }] : []
      return { ...prev, appeals: prev.appeals.map((a) => a.id === appealId ? { ...a, status } : a), notifications: [...notif, ...prev.notifications] }
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div>
          {/* Header with notification bell */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-blue-700">Admin Portal</h1>
              <p className="text-xs text-slate-400 mt-0.5">GUC ProjectHub</p>
            </div>
            {/* Bell icon — red dot when unread, disappears when all read or disabled */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-700 transition-colors"
              title={allRead || !adminState.notificationsEnabled ? 'No unread notifications' : `${unreadCount} unread notifications`}
            >
              <Ico d={IC.bell} size={19} />
              {!allRead && adminState.notificationsEnabled && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
          </div>

          <nav className="mt-2 flex flex-col gap-0.5 px-3 pb-4 text-sm">
            <NavBtn id="statistics"    activeTab={activeTab} setActiveTab={setActiveTab} label="Platform Statistics" />
            <NavBtn id="approvals"     activeTab={activeTab} setActiveTab={setActiveTab} label="Employer Approvals"
              badge={employers.filter(e => e.status === 'pending').length} />
            <NavBtn id="users"         activeTab={activeTab} setActiveTab={setActiveTab} label="User Management" />
            <NavBtn id="projects"      activeTab={activeTab} setActiveTab={setActiveTab} label="Projects & Portfolios"
              badge={flaggedProjects.length || 0} badgeColor="red" />
            <NavBtn id="courses"       activeTab={activeTab} setActiveTab={setActiveTab} label="Courses" />
            <NavBtn id="notifications" activeTab={activeTab} setActiveTab={setActiveTab} label="Notifications & Appeals"
              badge={adminState.notificationsEnabled ? unreadCount : 0} />
            <NavBtn id="adminAccounts" activeTab={activeTab} setActiveTab={setActiveTab} label="Admin Accounts" />
          </nav>
        </div>

        <div className="p-3 border-t border-slate-200 space-y-1">
          <button onClick={() => { refreshUsers(); refreshProjects(); syncExternalLinkRequests() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-md">
            <Ico d={IC.refresh} size={12} /> Refresh data
          </button>
          <button onClick={() => navigate('/forgot-password')}
            className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-md">
            Change Password (OTP)
          </button>
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-md">
            Log Out
          </button>
        </div>
      </aside>

      {/* ══ Main Content ══════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ─── PLATFORM STATISTICS ─────────────────────────────────────────── */}
        {activeTab === 'statistics' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Platform Statistics</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <StatCard title="Total Users" value={platformUsageStats.totalUsers}
                desc={`Students: ${platformUsageStats.totalStudents} · Employers: ${platformUsageStats.totalEmployers} · Instructors: ${platformUsageStats.totalInstructors}`} />
              <StatCard title="Total Projects" value={platformUsageStats.totalProjects}
                desc={`Active: ${activeProjectCount} · Flagged: ${flaggedProjects.length}`} />
              <StatCard title="Total Courses" value={platformUsageStats.totalCourses}
                desc="Courses currently in the catalog" />
            </div>

            {/* Platform-wide internship history */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-1">Platform Internship History</h3>
              <p className="text-sm text-slate-500 mb-4">Completed internships vs. offered — aggregated across all companies.</p>
              <div className="space-y-2">
                {adminState.internshipStats.map((entry) => {
                  const pct = entry.offered > 0 ? Math.round((entry.interns / entry.offered) * 100) : 0
                  return (
                    <div key={entry.period} className="grid grid-cols-3 items-center gap-4 border border-slate-100 rounded-md px-4 py-2.5">
                      <span className="text-sm font-medium">{entry.period}</span>
                      <span className="text-sm text-slate-600">Completed: <strong>{entry.interns}</strong> · Offered: <strong>{entry.offered}</strong></span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Per-company internship stats */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Internship Statistics by Company</h3>
              {employers.length === 0 ? (
                <EmptyBox msg="No employer companies registered yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Company</th>
                        <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Industry</th>
                        <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Offered</th>
                        <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Hired</th>
                        <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Conversion</th>
                        <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employers.map((emp) => {
                        const conv = emp.internshipsOffered > 0 ? Math.round((emp.studentsHired / emp.internshipsOffered) * 100) : 0
                        return (
                          <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 font-medium">{emp.companyName}</td>
                            <td className="p-3 text-slate-500">{emp.industry || '—'}</td>
                            <td className="p-3 text-center font-semibold text-blue-700">{emp.internshipsOffered}</td>
                            <td className="p-3 text-center font-semibold text-green-700">{emp.studentsHired}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-100 rounded-full h-1.5">
                                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${conv}%` }} />
                                </div>
                                <span className="text-xs text-slate-400">{conv}%</span>
                              </div>
                            </td>
                            <td className="p-3"><StatusBadge status={emp.status} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td className="p-3 font-semibold" colSpan={2}>Totals</td>
                        <td className="p-3 text-center font-bold text-blue-700">{employers.reduce((s, e) => s + e.internshipsOffered, 0)}</td>
                        <td className="p-3 text-center font-bold text-green-700">{employers.reduce((s, e) => s + e.studentsHired, 0)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── EMPLOYER APPROVALS ──────────────────────────────────────────── */}
        {activeTab === 'approvals' && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Employer Approvals</h2>
            <p className="text-sm text-slate-500">All registered companies — review all details and documents, then accept or reject directly.</p>

            {employers.length === 0 ? (
              <EmptyBox msg="No employers have registered yet." />
            ) : (
              <div className="space-y-5">
                {employers.map((emp) => (
                  <div key={emp.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Card header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-slate-800 text-base">{emp.companyName}</p>
                          <p className="text-xs text-slate-500">{emp.industry || 'Industry not specified'}</p>
                        </div>
                        <StatusBadge status={emp.status} />
                        {!emp.isActive && <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Account inactive</span>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleCompanyStatus(emp.id, 'accepted')} disabled={emp.status === 'accepted'}
                          className="text-sm bg-green-600 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 font-medium">
                          ✓ Accept
                        </button>
                        <button onClick={() => handleCompanyStatus(emp.id, 'rejected')} disabled={emp.status === 'rejected'}
                          className="text-sm bg-red-600 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 font-medium">
                          ✕ Reject
                        </button>
                        {emp.status !== 'pending' && (
                          <button onClick={() => handleCompanyStatus(emp.id, 'pending')}
                            className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card body — all info visible without clicking */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: contact & profile */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact &amp; Profile</h4>
                        <InfoRow label="Email"   value={emp.companyEmail} />
                        <InfoRow label="Phone"   value={emp.phone || '—'} />
                        <InfoRow label="Address" value={emp.address || '—'} />
                        <InfoRow label="Website" value={emp.website ? (
                          <a href={emp.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{emp.website}</a>
                        ) : '—'} />
                        {emp.mapLocationAddress && <InfoRow label="Location" value={emp.mapLocationAddress} />}
                        {emp.bio && (
                          <div>
                            <p className="text-xs text-slate-400 font-medium mb-0.5">Bio</p>
                            <p className="text-sm text-slate-700">{emp.bio}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: internship stats + documents */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Internship Activity</h4>
                          <div className="flex gap-3">
                            <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                              <p className="text-2xl font-bold text-blue-700">{emp.internshipsOffered}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Positions offered</p>
                            </div>
                            <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                              <p className="text-2xl font-bold text-green-700">{emp.studentsHired}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Students hired</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Uploaded Documents</h4>
                          {emp.documents.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
                          ) : (
                            <ul className="space-y-2">
                              {emp.documents.map((doc) => (
                                <li key={doc.id} className="flex items-center justify-between border border-slate-100 rounded-md px-3 py-2 bg-slate-50">
                                  <span className="text-sm text-slate-700 truncate max-w-[160px]">{doc.name}</span>
                                  <div className="flex gap-3 shrink-0">
                                    <button onClick={() => setViewDocModal(doc)}
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                      <Ico d={IC.eye} size={11} /> View
                                    </button>
                                    <button onClick={() => handleDocumentDownload(doc)}
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                      <Ico d={IC.download} size={11} /> Download
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── USER MANAGEMENT ─────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">User Management</h2>
              <button onClick={refreshUsers}
                className="flex items-center gap-1.5 text-sm text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                <Ico d={IC.refresh} size={12} /> Refresh
              </button>
            </div>

            {/* Role sub-tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              {[
                { id: 'students',    label: `Students (${platformUsers.filter(u => u.role === 'student').length})` },
                { id: 'instructors', label: `Instructors (${platformUsers.filter(u => u.role === 'instructor').length})` },
                { id: 'employers',   label: `Employers (${platformUsers.filter(u => u.role === 'employer').length})` },
              ].map((tab) => (
                <button key={tab.id} onClick={() => { setUserMgmtTab(tab.id); setUserSearch('') }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    userMgmtTab === tab.id ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:text-slate-800'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              placeholder={`Search ${userMgmtTab} by name or email…`}
              className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm" />

            {/* Students */}
            {userMgmtTab === 'students' && (
              <UserTable users={filteredUsersByRole} onToggle={toggleUserStatus}
                columns={[
                  { label: 'Full name',  render: (u) => u.fullName },
                  { label: 'Email',      render: (u) => <span className="text-slate-500">{u.email}</span> },
                  { label: 'Major',      render: (u) => portfolios.find(p => p.id === u.email)?.major || '—' },
                  { label: 'Projects',   render: (u) => portfolios.find(p => p.id === u.email)?.projectsCount ?? 0 },
                ]}
              />
            )}

            {/* Instructors */}
            {userMgmtTab === 'instructors' && (
              <div className="space-y-4">
                <UserTable users={filteredUsersByRole} onToggle={toggleUserStatus}
                  columns={[
                    { label: 'Full name',       render: (u) => u.fullName },
                    { label: 'Email',           render: (u) => <span className="text-slate-500">{u.email}</span> },
                    { label: 'Department',      render: (u) => instructors.find(i => i.id === u.email)?.department || '—' },
                    { label: 'Linked courses',  render: (u) => {
                        const inst = instructors.find(i => i.id === u.email)
                        return inst?.linkedCourseCodes.length ? inst.linkedCourseCodes.join(', ') : '—'
                      }
                    },
                  ]}
                />
                {instructors.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold mb-4 text-slate-700">Instructor Profiles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {instructors
                        .filter(i => !userSearch.trim() || i.fullName.toLowerCase().includes(userSearch.toLowerCase()) || i.email.toLowerCase().includes(userSearch.toLowerCase()))
                        .map((inst) => (
                          <div key={inst.id} className="border border-slate-100 rounded-lg p-4 space-y-2">
                            <div>
                              <p className="font-semibold text-slate-800">{inst.fullName}</p>
                              <p className="text-xs text-slate-500">{inst.email}</p>
                            </div>
                            {inst.department && <InfoRow label="Dept" value={inst.department} />}
                            {inst.bio && <InfoRow label="Bio" value={inst.bio} />}
                            {inst.research && <InfoRow label="Research" value={inst.research} />}
                            {inst.education && <InfoRow label="Education" value={inst.education} />}
                            <div>
                              <p className="text-xs text-slate-400 font-medium mb-1">Linked courses</p>
                              {inst.linkedCourseCodes.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {inst.linkedCourseCodes.map((code) => (
                                    <span key={code} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                      {code}{coursesByCode[code] ? ` – ${coursesByCode[code].name}` : ''}
                                    </span>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-400 italic">None linked.</p>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Employers */}
            {userMgmtTab === 'employers' && (
              <UserTable users={filteredUsersByRole} onToggle={toggleUserStatus}
                columns={[
                  { label: 'Company',  render: (u) => u.companyName || u.fullName },
                  { label: 'Email',    render: (u) => <span className="text-slate-500">{u.email}</span> },
                  { label: 'Industry', render: (u) => u.industry || '—' },
                  { label: 'Approval', render: (u) => <StatusBadge status={adminState.employerStatuses[u.email.toLowerCase()] ?? 'pending'} /> },
                ]}
              />
            )}
          </section>
        )}

        {/* ─── PROJECTS & PORTFOLIOS ───────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Projects &amp; Portfolios</h2>

            {/* Projects section */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">All Projects</h3>
                <button onClick={() => refreshProjects()} className="text-xs text-blue-700 hover:underline flex items-center gap-1">
                  <Ico d={IC.refresh} size={11} /> Refresh
                </button>
              </div>

              {/* Filters row — search + course + sort + flag filter buttons all together */}
              <div className="flex flex-wrap gap-2 items-center">
                <input value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search by project title…"
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[180px]" />

                <select value={projectCourseFilter} onChange={(e) => setProjectCourseFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="">All courses</option>
                  {[...new Set([...adminState.courses.map(c => c.code), ...projects.map(p => p.courseCode).filter(Boolean)])].map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>

                <select value={projectSortBy} onChange={(e) => setProjectSortBy(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="createdAt">Newest first</option>
                  <option value="rating">Highest rating</option>
                </select>

                {/* Flag filter buttons — inline at top */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
                  {[
                    { id: 'all',      label: 'All' },
                    { id: 'flagged',  label: 'Flagged', count: flaggedProjects.length, dot: true },
                    { id: 'inactive', label: 'Inactive' },
                  ].map((f) => (
                    <button key={f.id} onClick={() => setProjectFlagFilter(f.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        projectFlagFilter === f.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                      }`}>
                      {f.dot && f.count > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                      {f.label}
                      {f.count > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 leading-4">{f.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project cards — all listed */}
              {projects.length === 0 ? (
                <EmptyBox msg="No student projects found. Projects created via the student dashboard appear here automatically." />
              ) : projectResults.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No projects match the current filters.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {projectResults.map((p) => (
                    <div key={p.id}
                      className={`relative border rounded-xl p-4 space-y-2.5 transition-shadow hover:shadow-md ${
                        p.flagged ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'
                      }`}>
                      {/* Red dot indicator for flagged projects */}
                      {p.flagged && (
                        <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                          title={`Flagged: ${p.flagReason}`} />
                      )}

                      <div className="pr-5">
                        <p className="font-semibold text-slate-800 leading-snug">{p.title || '(untitled)'}</p>
                        {p.summary && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{p.summary}</p>}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {p.courseCode && <Tag color="blue">{p.courseCode}</Tag>}
                        {p.rating > 0  && <Tag color="yellow">★ {p.rating.toFixed(1)}</Tag>}
                        <Tag color={p.status === 'active' ? 'green' : 'slate'}>{p.status}</Tag>
                        {p.flagged     && <Tag color="red">Flagged</Tag>}
                      </div>

                      <div className="text-xs text-slate-400 space-y-0.5">
                        {p.owner      && <p>Owner: {p.owner}</p>}
                        {p.createdAt  && <p>Created: {p.createdAt}</p>}
                        {p.flagged && p.flagReason && (
                          <p className="text-red-500 font-medium">Reason: {p.flagReason}</p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button onClick={() => toggleProjectStatus(p.id)}
                          className="flex-1 text-xs border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 text-slate-600">
                          {p.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        {p.flagged ? (
                          <button onClick={() => unflagProject(p.id)}
                            className="flex-1 text-xs border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 text-slate-600">
                            Unflag
                          </button>
                        ) : (
                          <button onClick={() => openFlagModal(p)}
                            className="flex-1 text-xs border border-red-200 rounded-lg py-1.5 hover:bg-red-50 text-red-600 flex items-center justify-center gap-1">
                            <Ico d={IC.flag} size={11} /> Flag
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Portfolios section */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg">Student Portfolios</h3>
              <div className="flex flex-wrap gap-2">
                <input value={portfolioSearch} onChange={(e) => setPortfolioSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px]" />
                <select value={portfolioMajorFilter} onChange={(e) => setPortfolioMajorFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="">All majors</option>
                  {[...new Set(portfolios.map(p => p.major).filter(Boolean))].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={portfolioSkillFilter} onChange={(e) => setPortfolioSkillFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="">All skills</option>
                  {[...new Set(portfolios.flatMap(p => p.skills))].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={portfolioSortBy} onChange={(e) => setPortfolioSortBy(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="projectsCount">Most projects first</option>
                </select>
              </div>

              {portfolios.length === 0 ? (
                <EmptyBox msg="No student accounts found." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {portfolioResults.map((p) => (
                    <div key={p.id} className="border border-slate-200 bg-white rounded-xl p-4 space-y-2 hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.major && <Tag color="blue">{p.major}</Tag>}
                        <Tag color="slate">{p.projectsCount} project{p.projectsCount !== 1 ? 's' : ''}</Tag>
                        {p.gpa && <Tag color="yellow">GPA {p.gpa}</Tag>}
                      </div>
                      {p.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.skills.slice(0, 5).map((s) => (
                            <span key={s} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                          {p.skills.length > 5 && <span className="text-xs text-slate-400">+{p.skills.length - 5}</span>}
                        </div>
                      )}
                      {p.projects.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 font-medium mb-1">Projects</p>
                          <ul className="space-y-0.5">
                            {p.projects.slice(0, 3).map((proj) => (
                              <li key={proj.id} className="text-xs text-slate-600 flex items-center gap-1">
                                {proj.flagged && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                                {proj.title}
                              </li>
                            ))}
                            {p.projects.length > 3 && <li className="text-xs text-slate-400">+{p.projects.length - 3} more</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── COURSES ─────────────────────────────────────────────────────── */}
        {activeTab === 'courses' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Courses</h2>

            {/* New/Edit Course form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">{courseForm.id ? 'Edit Course' : 'New Course'}</h3>
              <form className="flex flex-wrap gap-3 items-end" onSubmit={handleCourseSubmit}>
                <label className="flex flex-col gap-1 flex-1 min-w-[140px]">
                  <span className="text-xs font-medium text-slate-600">Course code</span>
                  <input value={courseForm.code} onChange={(e) => setCourseForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="e.g. CSEN701"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </label>
                <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
                  <span className="text-xs font-medium text-slate-600">Course name</span>
                  <input value={courseForm.name} onChange={(e) => setCourseForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Advanced Software Engineering"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-800">
                    {courseForm.id ? 'Update' : 'Add Course'}
                  </button>
                  {courseForm.id && (
                    <button type="button" onClick={() => setCourseForm({ id: null, code: '', name: '' })}
                      className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 text-sm hover:bg-slate-50">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Course list */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-sm text-slate-700">All Courses ({adminState.courses.length})</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Code</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Name</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Linked instructors</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminState.courses.map((c) => {
                    const linked = instructors.filter(i => i.linkedCourseCodes.includes(c.code))
                    return (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-mono font-semibold text-slate-700">{c.code}</td>
                        <td className="p-4">{c.name}</td>
                        <td className="p-4 text-xs text-slate-500">{linked.length ? linked.map(i => i.fullName).join(', ') : <span className="italic">None</span>}</td>
                        <td className="p-4 flex gap-3">
                          <button onClick={() => setCourseForm(c)} className="text-blue-600 hover:underline text-xs">Edit</button>
                          <button onClick={() => deleteCourse(c.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                        </td>
                      </tr>
                    )
                  })}
                  {adminState.courses.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-slate-400 text-sm">No courses yet. Add one above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Link/Unlink requests */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-3">
                Link / Unlink Requests
                <span className="ml-2 text-sm text-slate-400 font-normal">
                  ({adminState.linkRequests.filter(r => r.status === 'pending').length} pending)
                </span>
              </h3>
              {adminState.linkRequests.length === 0 ? (
                <p className="text-sm text-slate-400">No linking requests received.</p>
              ) : (
                <ul className="space-y-2">
                  {adminState.linkRequests.map((req) => (
                    <li key={req.id} className="border border-slate-100 rounded-md p-3 flex items-center justify-between">
                      <span className="text-sm">
                        <strong>{req.instructorName || req.instructorEmail}</strong> · {req.type} <strong>{req.courseCode}</strong>
                        <span className="ml-2 text-slate-400 text-xs">({req.status})</span>
                      </span>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleLinkRequest(req.id, 'accepted')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">Accept</button>
                          <button onClick={() => handleLinkRequest(req.id, 'rejected')} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">Reject</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ─── NOTIFICATIONS & APPEALS ─────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Notifications &amp; Appeals</h2>

            {/* Notifications */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">Notifications</h3>
                  {!allRead && adminState.notificationsEnabled && (
                    <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-semibold">{unreadCount} unread</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Global on/off toggle */}
                  <button onClick={toggleNotificationsEnabled}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      adminState.notificationsEnabled
                        ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                        : 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${adminState.notificationsEnabled ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {adminState.notificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}
                  </button>
                  <button onClick={() => markAllNotifications(true)} className="text-sm text-blue-700 hover:underline">Mark all read</button>
                  <button onClick={() => markAllNotifications(false)} className="text-sm text-blue-700 hover:underline">Mark all unread</button>
                </div>
              </div>

              {adminState.notifications.length === 0 ? (
                <p className="text-sm text-slate-400">No notifications yet.</p>
              ) : (
                <ul className="space-y-2">
                  {adminState.notifications.map((n) => (
                    <li key={n.id}
                      className={`flex items-start justify-between gap-4 border rounded-lg px-4 py-3 ${
                        n.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50'
                      }`}>
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-slate-300' : 'bg-blue-500'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{n.title}</p>
                          <p className="text-sm text-slate-600">{n.message}</p>
                        </div>
                      </div>
                      {/* Always filled — date + toggle, never empty */}
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className="text-xs text-slate-400 whitespace-nowrap">{n.createdAt}</span>
                        <button onClick={() => updateNotificationRead(n.id, !n.read)}
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                          {n.read ? 'Mark unread' : 'Mark read'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Student Appeals — with accept/reject */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
              <h3 className="font-semibold">Student Appeals</h3>
              {adminState.appeals.length === 0 ? (
                <p className="text-sm text-slate-400">No appeals submitted.</p>
              ) : (
                <ul className="space-y-3">
                  {adminState.appeals.map((appeal) => {
                    const project = projects.find((p) => p.id === appeal.projectId)
                    return (
                      <li key={appeal.id} className="border border-slate-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-800">{appeal.studentName}</p>
                            <p className="text-xs text-slate-500">{appeal.studentEmail}</p>
                          </div>
                          <StatusBadge status={appeal.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <InfoRow label="Project"   value={appeal.projectTitle || project?.title || `ID ${appeal.projectId}`} />
                          <InfoRow label="Submitted" value={appeal.createdAt || '—'} />
                          {project?.flagReason && <InfoRow label="Flag reason" value={project.flagReason} />}
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">Appeal reason</p>
                          <p className="text-sm text-slate-700">{appeal.reason}</p>
                        </div>

                        {appeal.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleAppealDecision(appeal.id, 'accepted')}
                              className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-700">
                              <Ico d={IC.check} size={13} /> Accept Appeal
                            </button>
                            <button onClick={() => handleAppealDecision(appeal.id, 'rejected')}
                              className="flex items-center gap-1.5 bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-700">
                              <Ico d={IC.x} size={13} /> Reject Appeal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-500">Decision: <strong className="capitalize">{appeal.status}</strong></p>
                            <button onClick={() => handleAppealDecision(appeal.id, 'pending')} className="text-xs text-blue-600 hover:underline">Reopen</button>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ─── ADMIN ACCOUNTS ──────────────────────────────────────────────── */}
        {activeTab === 'adminAccounts' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Accounts</h2>

            {/* Create form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-1">New Admin Account</h3>
              <p className="text-sm text-slate-500 mb-4">Only verified GUC email domains are accepted (e.g. @guc.edu.eg).</p>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreateAdmin}>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs font-medium text-slate-600">GUC email</span>
                  <input required type="email" autoComplete="email"
                    value={adminAccountForm.email}
                    onChange={(e) => { setAdminAccountError(''); setAdminAccountForm(p => ({ ...p, email: e.target.value })) }}
                    placeholder="name@guc.edu.eg"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs font-medium text-slate-600">Password</span>
                  <input required type="password" autoComplete="new-password"
                    value={adminAccountForm.password}
                    onChange={(e) => { setAdminAccountError(''); setAdminAccountForm(p => ({ ...p, password: e.target.value })) }}
                    placeholder="Password"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </label>
                {adminAccountError   && <p className="md:col-span-2 text-sm text-red-600 font-medium">{adminAccountError}</p>}
                {adminAccountSuccess && <p className="md:col-span-2 text-sm text-emerald-600 font-medium">{adminAccountSuccess}</p>}
                <button type="submit" className="md:col-span-2 w-fit bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">
                  Create Admin
                </button>
              </form>
            </div>

            {/* All admin accounts — same style as course list */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-sm text-slate-700">
                  All Admin Accounts ({platformUsers.filter(u => u.role === 'admin').length})
                </h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Name</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Email</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {platformUsers.filter(u => u.role === 'admin').map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium">{user.fullName}</td>
                      <td className="p-4 text-slate-500">{user.email}</td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => toggleUserStatus(user)} className="text-sm text-blue-600 hover:underline">
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {platformUsers.filter(u => u.role === 'admin').length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-slate-400 text-sm">No admin accounts found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* ══ Document Viewer Modal ════════════════════════════════════════════ */}
      {viewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewDocModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
              <h3 className="font-semibold text-slate-800">{viewDocModal.name}</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => handleDocumentDownload(viewDocModal)}
                  className="flex items-center gap-1.5 text-sm text-blue-700 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">
                  <Ico d={IC.download} size={13} /> Download
                </button>
                <button onClick={() => setViewDocModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
              </div>
            </div>
            <div className="overflow-auto p-5 flex-1">
              {viewDocModal.isImage ? (
                <img src={viewDocModal.content} alt={viewDocModal.name} className="max-w-full rounded-lg mx-auto" />
              ) : (
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-4 leading-relaxed">
                  {viewDocModal.content}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Flag with Reason Modal ═══════════════════════════════════════════ */}
      {flagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setFlagModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Ico d={IC.flag} size={16} className="text-red-500" /> Flag Project
              </h3>
              <button onClick={() => setFlagModal(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <p className="text-sm text-slate-600">
              You are flagging: <strong>"{flagModal.title}"</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for flagging <span className="text-red-500">*</span>
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
                placeholder="Describe the violation (e.g. plagiarism, inappropriate content, academic dishonesty…)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none resize-none"
              />
              {!flagReason.trim() && (
                <p className="text-xs text-red-500 mt-1">A reason is required before flagging.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={confirmFlag} disabled={!flagReason.trim()}
                className="flex-1 bg-red-600 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700">
                Confirm Flag
              </button>
              <button onClick={() => setFlagModal(null)}
                className="flex-1 border border-slate-300 text-slate-600 rounded-lg px-4 py-2 text-sm hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable components
// ─────────────────────────────────────────────────────────────────────────────

function NavBtn({ id, activeTab, setActiveTab, label, badge, badgeColor = 'blue' }) {
  const isActive = activeTab === id
  const badgeClass = badgeColor === 'red' ? 'bg-red-500' : 'bg-blue-600'
  return (
    <button onClick={() => setActiveTab(id)}
      className={`relative w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
      }`}>
      {label}
      {badge > 0 && (
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${badgeClass} text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold`}>
          {badge}
        </span>
      )}
    </button>
  )
}

function StatCard({ title, value, desc }) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: 'bg-yellow-100 text-yellow-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', active: 'bg-green-100 text-green-700', inactive: 'bg-slate-100 text-slate-500' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  )
}

function Tag({ children, color = 'slate' }) {
  const map = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', yellow: 'bg-yellow-50 text-yellow-700', slate: 'bg-slate-100 text-slate-500' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[color] ?? map.slate}`}>
      {children}
    </span>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-xs font-medium text-slate-400 w-20 shrink-0 pt-0.5 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-700 flex-1">{value}</span>
    </div>
  )
}

function EmptyBox({ msg }) {
  return (
    <div className="border border-dashed border-slate-200 rounded-xl py-12 text-center text-sm text-slate-400">
      {msg}
    </div>
  )
}

function UserTable({ users, onToggle, columns }) {
  if (!users.length) return <EmptyBox msg="No users found." />
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th key={col.label} className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{col.label}</th>
            ))}
            <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map((col) => (
                <td key={col.label} className="p-4">{col.render(user)}</td>
              ))}
              <td className="p-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-4">
                <button onClick={() => onToggle(user)} className="text-sm text-blue-600 hover:underline">
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function TabButton({ id, current, set, label, badge }) {
  const isActive = current === id
  return (
    <button
      onClick={() => set(id)}
      className={`relative text-left px-4 py-2 rounded-lg transition-colors text-sm ${
        isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 text-white text-xs px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </button>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 w-24 shrink-0 text-xs font-medium uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-slate-800 text-sm">{value}</span>
    </div>
  )
}

function RoleBadge({ role }) {
  const map = {
    admin:      'bg-purple-100 text-purple-700',
    instructor: 'bg-blue-100 text-blue-700',
    student:    'bg-teal-100 text-teal-700',
    employer:   'bg-orange-100 text-orange-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[role] ?? 'bg-slate-100 text-slate-500'}`}
    >
      {role}
    </span>
  )
}