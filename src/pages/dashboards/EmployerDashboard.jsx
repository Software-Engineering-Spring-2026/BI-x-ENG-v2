import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, getEmployerProfile, saveEmployerProfile } from '../../data/authStorage'
import Button from '../../components/Button'
import projectsData from '../../data/projects'
import studentsData from '../../data/students'

function EmployerDashboard() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const empId = user?.email.toLowerCase() || 'default'

  const storageKeys = {
    internships: `emp_interns_${empId}`,
    favorites: `emp_favs_${empId}`,
    messages: `emp_msgs_${empId}`,
    notifications: `emp_notifs_${empId}`
  }

  const defaultLogo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="20" fill="%231d4ed8"/><text x="60" y="70" text-anchor="middle" font-size="34" font-family="Arial" font-weight="700" fill="white">DC</text></svg>'
  const defaultAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="60" fill="%23dbeafe"/><circle cx="60" cy="45" r="22" fill="%231e40af"/><path d="M24 108c7-28 65-28 72 0" fill="%231e40af"/></svg>'

  const [activeTab, setActiveTab] = useState('profile')
  const [notification, setNotification] = useState({ show: false, message: '' })
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showNotifPanel, setShowNotifPanel] = useState(false)

  const [userNotifications, setUserNotifications] = useState(() => {
    const saved = localStorage.getItem(storageKeys.notifications)
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "New application received for Business Analyst role", read: false, time: "2 mins ago" }
    ]
  })

  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    bio: 'Technology employer offering students real internship experience in software engineering, data analysis, business operations, and product development. Our internships focus on mentorship, practical delivery, teamwork, and preparing students for real workplace expectations.',
    address: 'New Cairo, Cairo, Egypt',
    phone: '01012345678',
    website: 'https://demo-company.example.com',
    logo: defaultLogo,
    profilePicture: defaultAvatar,
    taxCertificate: '',
    taxCertificateName: '',
    mapLocation: 'German University in Cairo',
    isVerified: false,
    researchInterests: 'Student mentoring, software delivery, data-driven products, workplace readiness.',
    education: 'Registered GUC employer partner with internship mentoring and technical supervision experience.'
  })

  const [mapAddress, setMapAddress] = useState('')
  const [mapSrc, setMapSrc] = useState('')

  const [instructors] = useState([
    {
      id: 1,
      name: "Dr. Slim Abdennadher",
      email: "slim.abdennadher@guc.edu.eg",
      bio: "Professor of Computer Science with experience in logic programming, artificial intelligence, constraint solving, and academic project supervision.",
      researchInterests: "AI, Logic Programming, Constraint Programming",
      education: "Ph.D. Technical University of Munich",
      courses: ["Bachelor Project", "Theory of Computation"],
      photo: defaultAvatar
    },
    {
      id: 2,
      name: "Dr. Milad Ghantous",
      email: "milad.ghantous@guc.edu.eg",
      bio: "Database systems instructor focused on scalable software systems, data modeling, backend design, and mentoring student software projects.",
      researchInterests: "DBMS, Data Engineering, Distributed Systems",
      education: "Ph.D. Computer Science",
      courses: ["Bachelor Project", "Database Systems"],
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="60" fill="%23dcfce7"/><circle cx="60" cy="45" r="22" fill="%23166534"/><path d="M24 108c7-28 65-28 72 0" fill="%23166534"/></svg>'
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInstructor, setSelectedInstructor] = useState(null)

  const [internSearch, setInternSearch] = useState('')
  const [internships, setInternships] = useState(() => {
    const saved = localStorage.getItem(storageKeys.internships)
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        title: 'Business Analyst Intern',
        details: 'Gather requirements, interview users, document workflows, prepare dashboards, and support product planning.',
        skills: 'Communication, Agile, Documentation, Excel',
        duration: '3 Months',
        programmingLanguages: 'SQL',
        status: 'Hiring',
        deadline: '2026-06-15',
        isArchived: false,
        applicants: [
          { id: 101, name: 'Laila Hassan', email: 'laila@guc.edu.eg', status: 'Nominated', contributionScore: 92 },
          { id: 102, name: 'Ahmed Ali', email: 'ahmed@guc.edu.eg', status: 'Accepted', contributionScore: 88 },
          { id: 103, name: 'Carim Mansour', email: 'carim@guc.edu.eg', status: 'Rejected', contributionScore: 74 }
        ]
      },
      {
        id: 2,
        title: 'Frontend Engineering Intern',
        details: 'Build responsive React interfaces, connect APIs, improve dashboard flows, and document reusable UI components.',
        skills: 'React, UI, Git, API Integration',
        duration: '10 Weeks',
        programmingLanguages: 'JavaScript, TypeScript',
        status: 'Hiring',
        deadline: '2026-07-01',
        isArchived: false,
        applicants: [
          { id: 104, name: 'Nour Adel', email: 'nour@guc.edu.eg', status: 'Accepted', contributionScore: 96 },
          { id: 105, name: 'Youssef Samir', email: 'youssef@guc.edu.eg', status: 'Nominated', contributionScore: 81 }
        ]
      }
    ]
  })

  const initialInternState = { title: '', details: '', skills: '', duration: '', programmingLanguages: '', deadline: '', status: 'Hiring' }
  const [showInternForm, setShowInternForm] = useState(false)
  const [isEditingIntern, setIsEditingIntern] = useState(null)
  const [internForm, setInternForm] = useState(initialInternState)
  const [selectedInternship, setSelectedInternship] = useState(null)
  const [applicantSort, setApplicantSort] = useState('default')

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(storageKeys.favorites)
    return saved ? JSON.parse(saved) : {
      projects: [projectsData[0]?.id, projectsData[1]?.id].filter(Boolean),
      portfolios: [studentsData[0]?.id].filter(Boolean)
    }
  })

  const [selectedProject, setSelectedProject] = useState(null)

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKeys.messages)
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        sender: "Ahmed Ali",
        receiver: user?.companyName || "Demo Company",
        role: "Student",
        text: "Hello, I have a question regarding the BA internship.",
        date: "2026-05-08",
        read: false
      }
    ]
  })

  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageForm, setMessageForm] = useState({ receiver: '', text: '' })

  useEffect(() => localStorage.setItem(storageKeys.internships, JSON.stringify(internships)), [internships, storageKeys.internships])
  useEffect(() => localStorage.setItem(storageKeys.favorites, JSON.stringify(favorites)), [favorites, storageKeys.favorites])
  useEffect(() => localStorage.setItem(storageKeys.messages, JSON.stringify(messages)), [messages, storageKeys.messages])
  useEffect(() => localStorage.setItem(storageKeys.notifications, JSON.stringify(userNotifications)), [userNotifications, storageKeys.notifications])

  useEffect(() => {
    if (!user) return
    const profile = getEmployerProfile(user.email)
    if (profile) {
      const mergedProfile = { ...profileForm, ...profile }
      setProfileForm(mergedProfile)
      if (mergedProfile.mapLocation) {
        setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(mergedProfile.mapLocation)}&output=embed`)
      }
    } else if (profileForm.mapLocation) {
      setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(profileForm.mapLocation)}&output=embed`)
    }
  }, [user])

  const showSuccess = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: '' }), 5000)
  }

  const toggleAllNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    showSuccess(notificationsEnabled ? "All notifications turned off." : "Notifications enabled.")
  }

  const markAsRead = (id) => setUserNotifications(userNotifications.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => {
    setUserNotifications(userNotifications.map(n => ({ ...n, read: true })))
    showSuccess("All notifications marked as read.")
  }
  const markAllUnread = () => {
    setUserNotifications(userNotifications.map(n => ({ ...n, read: false })))
    showSuccess("All notifications marked as unread.")
  }

  const handleNotificationClick = (n) => {
    markAsRead(n.id)
    const text = n.text.toLowerCase()

    if (text.includes('message')) setActiveTab('messages')
    else if (text.includes('application') || text.includes('intern')) setActiveTab('internships')

    setShowNotifPanel(false)
  }

  const stats = useMemo(() => {
    const totalInternships = internships.length
    const totalAcceptedStudents = internships.reduce((sum, intern) =>
      sum + intern.applicants.filter(a => a.status === 'Accepted').length, 0
    )
    const totalApplications = internships.reduce((sum, intern) => sum + intern.applicants.length, 0)
    return { totalInternships, totalAcceptedStudents, totalApplications }
  }, [internships])

  const internshipHistory = useMemo(() => [
    { label: '2024-Q1', completed: 4, offered: 6 },
    { label: '2024-Q2', completed: 6, offered: 8 },
    { label: '2024-Q3', completed: 7, offered: 9 },
    { label: '2024-Q4', completed: 8, offered: 10 },
    { label: '2025-Q1', completed: 10, offered: 12 },
    { label: '2026-Q1', completed: stats.totalAcceptedStudents, offered: stats.totalInternships + 6 }
  ], [stats])

  const toggleMessageRead = (id) => {
    setMessages(messages.map(msg => msg.id === id ? { ...msg, read: !msg.read } : msg))
  }

  const handleSendMessage = (e) => {
    e.preventDefault()

    if (!messageForm.receiver.trim() || !messageForm.text.trim()) {
      alert("Please choose a receiver and write a message.")
      return
    }

    const newMsg = {
      id: Date.now(),
      sender: user?.companyName || "Demo Company",
      receiver: messageForm.receiver.trim(),
      role: "Employer",
      text: messageForm.text.trim(),
      date: new Date().toISOString().split('T')[0],
      read: true
    }

    setMessages([newMsg, ...messages])
    setMessageForm({ receiver: '', text: '' })
    setShowMessageModal(false)
    showSuccess("Message sent successfully.")
  }

  const toggleFavProject = (id) => {
    setFavorites(prev => {
      const isFav = prev.projects.includes(id)
      return { ...prev, projects: isFav ? prev.projects.filter(pId => pId !== id) : [...prev.projects, id] }
    })
    showSuccess("Favorites updated.")
  }

  const toggleFavPortfolio = (id) => {
    setFavorites(prev => {
      const isFav = prev.portfolios.includes(id)
      return { ...prev, portfolios: isFav ? prev.portfolios.filter(pId => pId !== id) : [...prev.portfolios, id] }
    })
    showSuccess("Favorites updated.")
  }

  const openProjectDetails = (project) => {
    setSelectedProject(project)
    setActiveTab('project-details')
    setSelectedInternship(null)
    setSelectedInstructor(null)
  }

  const handleMapUpdate = (e) => {
    e.preventDefault()

    const trimmedLocation = mapAddress.trim()
    if (!trimmedLocation) {
      alert("Please enter a building or city.")
      return
    }

    const updatedForm = {
      ...profileForm,
      mapLocation: trimmedLocation,
      address: trimmedLocation
    }

    setProfileForm(updatedForm)
    saveEmployerProfile(user.email, updatedForm)
    setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(trimmedLocation)}&output=embed`)
    setMapAddress('')
    showSuccess("Location saved to Google Maps and added to your profile.")
  }

  const recommendedProjects = useMemo(() => projectsData.slice(0, 3), [])
  const todayDateString = new Date().toISOString().split('T')[0]

  const filteredInternships = useMemo(() => {
    if (!internSearch) return internships
    const lowerSearch = internSearch.toLowerCase()
    return internships.filter(i =>
      (i.title && i.title.toLowerCase().includes(lowerSearch)) ||
      (i.skills && i.skills.toLowerCase().includes(lowerSearch)) ||
      (i.programmingLanguages && i.programmingLanguages.toLowerCase().includes(lowerSearch)) ||
      (i.duration && i.duration.toLowerCase().includes(lowerSearch)) ||
      (i.deadline && i.deadline.includes(lowerSearch))
    )
  }, [internships, internSearch])

  const handleSaveInternship = (e) => {
    e.preventDefault()
    if (internForm.deadline < todayDateString) {
      alert("The application deadline cannot be in the past.")
      return
    }

    if (isEditingIntern) {
      setInternships(internships.map(i => i.id === isEditingIntern ? { ...i, ...internForm } : i))
      showSuccess("Internship updated successfully!")
    } else {
      setInternships([{ ...internForm, id: Date.now(), isArchived: false, applicants: [] }, ...internships])
      showSuccess(`Internship '${internForm.title}' posted!`)
    }

    setShowInternForm(false)
    setIsEditingIntern(null)
    setInternForm(initialInternState)
  }

  const toggleHiringStatus = (id) => {
    setInternships(internships.map(i => {
      if (i.id === id) {
        const newStatus = i.status === 'Hiring' ? 'Position Filled' : 'Hiring'
        if (selectedInternship?.id === id) setSelectedInternship({ ...i, status: newStatus })
        return { ...i, status: newStatus }
      }
      return i
    }))
    showSuccess("Internship status updated.")
  }

  const archiveInternship = (id) => {
    setInternships(internships.map(i => {
      if (i.id === id) {
        const archivedState = !i.isArchived
        if (selectedInternship?.id === id) setSelectedInternship({ ...i, isArchived: archivedState })
        return { ...i, isArchived: archivedState }
      }
      return i
    }))
    showSuccess("Archive status updated.")
  }

  const handleDeleteInternship = (id) => {
    if (window.confirm("Delete this internship?")) {
      setInternships(internships.filter(i => i.id !== id))
      if (selectedInternship?.id === id) setSelectedInternship(null)
      showSuccess("Internship deleted.")
    }
  }

  const updateAppStatus = (internId, appId, newStatus) => {
    setInternships(internships.map(i => {
      if (i.id === internId) {
        const updatedApplicants = i.applicants.map(a => a.id === appId ? { ...a, status: newStatus } : a)
        const updatedInternship = { ...i, applicants: updatedApplicants }
        if (selectedInternship?.id === internId) setSelectedInternship(updatedInternship)
        return updatedInternship
      }
      return i
    }))
    showSuccess(`Applicant status changed to ${newStatus}.`)
  }

  const getContributionScore = (applicant) => {
    const student = studentsData.find(s => s.email === applicant.email || s.name === applicant.name)
    return applicant.contributionScore || student?.projects?.length || student?.projectCount || 0
  }

  const getSortedApplicants = (internship) => {
    let sorted = [...internship.applicants]
    if (applicantSort === 'topContributors') {
      sorted.sort((a, b) => getContributionScore(b) - getContributionScore(a))
    }
    return sorted
  }

  const isApplicantSuggested = (applicant) => {
    return favorites.portfolios.some(favId => {
      const student = studentsData.find(s => s.id === favId)
      return student && (student.email === applicant.email || student.name === applicant.name)
    })
  }

  const sidebarItems = [
    { id: 'profile', label: 'Overview', icon: '⌂' },
    { id: 'profile-details', label: 'My Profile', icon: '♙' },
    { id: 'notifications', label: 'Notifications', icon: '♧' },
    { id: 'internships', label: 'Internships', icon: '▣' },
    { id: 'instructors', label: 'Find Instructors', icon: '▤' },
    { id: 'favorite-projects', label: 'Favorite Projects', icon: '♡' },
    { id: 'recommended-projects', label: 'Recommended', icon: '☆' },
    { id: 'messages', label: 'Messages', icon: '▢' },
    { id: 'statistics', label: 'Statistics', icon: '▥' }
  ]

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <aside className="w-[300px] bg-white border-r border-slate-200 min-h-screen p-6 flex flex-col fixed left-0 top-0 bottom-0">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Employer Portal</p>
          <h1 className="text-xl font-black text-slate-900 mt-2">{user.companyName || 'Demo Company'}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>

        <nav className="space-y-2 flex-1">
          {sidebarItems.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              onClick={() => {
                setActiveTab(item.id)
                setSelectedInternship(null)
                setSelectedInstructor(null)
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-bold transition-colors ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <span className="text-xl w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'notifications' && userNotifications.some(n => !n.read) && (
                <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                  {userNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-200 pt-6">
          <button className="text-slate-700 font-bold hover:text-red-600">Logout</button>
        </div>
      </aside>

      <main className="ml-[300px] w-full px-10 py-8 relative">
        <div className="flex justify-end items-center mb-6">
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => {
                setActiveTab('profile')
                navigate('/employer')
              }}
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors relative flex items-center justify-center h-10 w-10"
              title="Go to Home Dashboard"
            >
              <span className="text-lg">🏠</span>
            </button>

            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors relative flex items-center justify-center h-10 w-10">
              <span className="text-lg">🔔</span>
              {userNotifications.some(n => !n.read) && notificationsEnabled && (
                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showNotifPanel && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[110] overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                  <span className="font-black text-xs uppercase tracking-widest">Notifications</span>
                  <div className="flex gap-3">
                    <button onClick={markAllUnread} className="text-[10px] font-bold text-slate-500 hover:underline">Mark unread</button>
                    <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:underline">Mark read</button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {userNotifications.length > 0 ? userNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 cursor-pointer ${!n.read ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <p className={`text-sm ${!n.read ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>{n.text}</p>
                      <p className="text-xs text-slate-400 mt-2 font-bold tracking-wide uppercase">{n.time} • {n.read ? 'Read' : 'Unread'}</p>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-500 font-bold">You're all caught up!</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {notification.show && (
          <div className="fixed top-8 right-8 z-[120]">
            <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400">
              <div className="bg-white/20 p-1 rounded-full text-lg">✓</div>
              <p className="font-bold text-sm tracking-wide">{notification.message}</p>
            </div>
          </div>
        )}

        {showMessageModal && (
          <div className="fixed inset-0 bg-slate-900/40 z-[130] flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">New Message</h3>
                <button onClick={() => setShowMessageModal(false)} className="text-slate-400 hover:text-slate-700 font-black">✕</button>
              </div>
              <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Receiver</label>
                  <select
                    value={messageForm.receiver}
                    onChange={e => setMessageForm({ ...messageForm, receiver: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-400"
                  >
                    <option value="">Select receiver</option>
                    {studentsData.slice(0, 5).map(student => (
                      <option key={student.id} value={student.name}>{student.name}</option>
                    ))}
                    {instructors.map(inst => (
                      <option key={inst.id} value={inst.name}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Message</label>
                  <textarea
                    value={messageForm.text}
                    onChange={e => setMessageForm({ ...messageForm, text: e.target.value })}
                    className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 outline-none min-h-[140px] focus:border-blue-400"
                    placeholder="Write your message..."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700">Send Message</button>
                  <button type="button" onClick={() => setShowMessageModal(false)} className="px-5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900">Welcome back, {user.companyName || 'Demo Company'} 👋</h2>
              <p className="text-slate-500 mt-2">Here's your employer activity summary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <p className="text-slate-500 font-medium">Internships Offered</p>
                <p className="text-4xl font-black text-blue-600 mt-2">{stats.totalInternships}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                <p className="text-slate-500 font-medium">Students Accepted</p>
                <p className="text-4xl font-black text-emerald-600 mt-2">{stats.totalAcceptedStudents}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
                <p className="text-slate-500 font-medium">Applications</p>
                <p className="text-4xl font-black text-amber-600 mt-2">{stats.totalApplications}</p>
              </div>
              <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100 shadow-sm">
                <p className="text-slate-500 font-medium">Unread Messages</p>
                <p className="text-4xl font-black text-violet-600 mt-2">{messages.filter(m => !m.read).length}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Recent Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase block mb-1">Company</span>
                  <span className="text-slate-900 font-bold">{user.companyName || 'Demo Company'}</span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase block mb-1">Email</span>
                  <span className="text-slate-900 font-bold">{user.email}</span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase block mb-1">Status</span>
                  <span className={`text-[10px] px-2 py-1 rounded-md font-black ${profileForm.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {profileForm.isVerified ? 'VERIFIED PARTNER' : 'VERIFICATION PENDING'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile-details' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-black text-slate-900">My Profile</h2>
              <Button onClick={() => setEditingProfile(!editingProfile)}>{editingProfile ? "Cancel" : "Edit Profile"}</Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-8">
                <div className="flex flex-col items-center">
                  <div className="h-28 w-28 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border border-blue-100">
                    {profileForm.profilePicture ? (
                      <img src={profileForm.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-black text-blue-600">{(user.companyName || 'D').charAt(0)}</span>
                    )}
                  </div>

                  <label className="mt-4 cursor-pointer flex flex-col items-center justify-center bg-white text-slate-500 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors shadow-sm text-center">
                    <span className="text-lg leading-none">↥</span>
                    <span className="text-xs font-bold">Upload Photo</span>
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        const updatedForm = { ...profileForm, profilePicture: reader.result }
                        setProfileForm(updatedForm)
                        saveEmployerProfile(user.email, updatedForm)
                        showSuccess("Profile photo uploaded.")
                      }
                      reader.readAsDataURL(file)
                    }} className="hidden" />
                  </label>

                  <div className="h-20 w-20 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center mt-6">
                    {profileForm.logo ? (
                      <img src={profileForm.logo} alt="Logo" className="object-contain p-2 w-full h-full" />
                    ) : (
                      <span className="text-xs text-slate-300 font-bold">LOGO</span>
                    )}
                  </div>

                  <label className="mt-3 cursor-pointer flex flex-col items-center justify-center bg-white text-slate-500 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors shadow-sm text-center">
                    <span className="text-lg leading-none">↥</span>
                    <span className="text-xs font-bold">Upload Logo</span>
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        const updatedForm = { ...profileForm, logo: reader.result }
                        setProfileForm(updatedForm)
                        saveEmployerProfile(user.email, updatedForm)
                        showSuccess("Company logo uploaded.")
                      }
                      reader.readAsDataURL(file)
                    }} className="hidden" />
                  </label>
                </div>

                <div>
                  {editingProfile ? (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (profileForm.phone && profileForm.phone.length !== 11) {
                        alert("Phone number must be exactly 11 digits.")
                        return
                      }
                      saveEmployerProfile(user.email, profileForm)
                      setEditingProfile(false)
                      showSuccess("Profile details updated successfully!")
                    }} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required className="p-3 bg-slate-50 border rounded-xl" placeholder="Website" value={profileForm.website} onChange={e => setProfileForm({ ...profileForm, website: e.target.value })} />
                        <input type="tel" required pattern="\d{11}" className="p-3 bg-slate-50 border rounded-xl" placeholder="Phone (11 digits)" value={profileForm.phone} maxLength={11} minLength={11} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '') })} />
                      </div>

                      <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Company Address" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} />

                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Biography</label>
                        <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]" value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
                      </div>

                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Research Interests</label>
                        <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]" value={profileForm.researchInterests} onChange={e => setProfileForm({ ...profileForm, researchInterests: e.target.value })} />
                      </div>

                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Education / Company Background</label>
                        <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]" value={profileForm.education} onChange={e => setProfileForm({ ...profileForm, education: e.target.value })} />
                      </div>

                      <label className="cursor-pointer flex flex-col items-center justify-center bg-blue-50 text-blue-700 border border-blue-200 rounded-xl p-6 hover:bg-blue-100 transition-colors shadow-sm">
                        <span className="text-2xl mb-2">📄</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-center">Upload Tax Cert</span>
                        <input type="file" accept=".pdf" onChange={e => {
                          const file = e.target.files[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onloadend = () => setProfileForm({ ...profileForm, taxCertificate: reader.result, taxCertificateName: file.name })
                          reader.readAsDataURL(file)
                        }} className="hidden" />
                      </label>

                      <Button type="submit" className="w-full py-4 text-lg">Update Profile Information</Button>
                    </form>
                  ) : (
                    <div>
                      <div className="flex items-start gap-5 mb-6">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center">
                          {profileForm.logo ? <img src={profileForm.logo} alt="Logo" className="object-contain p-2 w-full h-full" /> : <span className="text-xs text-slate-300 font-bold">LOGO</span>}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">{user.companyName || 'Demo Company'}</h3>
                          <p className="text-slate-500">{user.email}</p>
                          <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Employer Account</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Biography</p>
                          <p className="text-slate-700 leading-relaxed">{profileForm.bio}</p>
                        </div>

                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Research Interests</p>
                          <p className="text-slate-700 leading-relaxed">{profileForm.researchInterests}</p>
                        </div>

                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Education / Company Background</p>
                          <p className="text-slate-700 leading-relaxed">{profileForm.education}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                          <div>
                            <span className="text-xs font-black text-slate-400 uppercase block mb-1">Website</span>
                            <a href={profileForm.website} className="text-blue-600 font-bold">{profileForm.website || "Not set"}</a>
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-400 uppercase block mb-1">Contact</span>
                            <span className="text-slate-900 font-bold">{profileForm.phone || "Not set"}</span>
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-400 uppercase block mb-1">Address</span>
                            <span className="text-slate-900 font-bold">{profileForm.address || profileForm.mapLocation || "Not set"}</span>
                            {profileForm.mapLocation && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profileForm.mapLocation)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 text-xs font-bold block mt-1"
                              >
                                Open in Google Maps
                              </a>
                            )}
                          </div>
                        </div>

                        {profileForm.taxCertificate && (
                          <a href={profileForm.taxCertificate} download={profileForm.taxCertificateName || "Tax_Certificate.pdf"} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-colors">
                            📄 Download Tax Certificate
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-5xl">
              <h3 className="font-black text-slate-900 tracking-tight mb-4">PUBLIC LOCATION</h3>
              <form onSubmit={handleMapUpdate} className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 mb-6">
                <input value={mapAddress} onChange={e => setMapAddress(e.target.value)} placeholder="Enter building/city" className="w-full p-3 border rounded-xl text-sm bg-slate-50 outline-none" />
                <Button className="w-full py-3" type="submit">Update Map</Button>
              </form>

              {profileForm.mapLocation && (
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase">Saved Location</p>
                    <p className="font-bold text-slate-900">{profileForm.mapLocation}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profileForm.mapLocation)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold text-sm"
                  >
                    Open in Maps ↗
                  </a>
                </div>
              )}

              {mapSrc ? (
                <div className="rounded-xl overflow-hidden border">
                  <iframe src={mapSrc} width="100%" height="220" title="Map" />
                </div>
              ) : (
                <div className="h-[220px] bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 px-6 text-center">Add your location.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900">Employer Statistics</h2>
              <p className="text-slate-500 mt-2">Students who completed internships with your company and internships offered over time.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Internship History</h3>
              <div className="space-y-3">
                {internshipHistory.map(row => {
                  const percent = Math.round((row.completed / row.offered) * 100)
                  return (
                    <div key={row.label} className="grid grid-cols-12 gap-4 items-center border border-slate-100 rounded-xl p-4">
                      <span className="col-span-2 font-black">{row.label}</span>
                      <span className="col-span-3 text-slate-700">Completed: <b>{row.completed}</b> · Offered: <b>{row.offered}</b></span>
                      <div className="col-span-6 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                      <span className="col-span-1 text-sm text-slate-500">{percent}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'internships' && (
          <div className="space-y-8">
            {!selectedInternship && (
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Internships</h2>
                  <p className="text-slate-500 mt-2">Manage roles, applicants, and hiring status.</p>
                </div>
                {!showInternForm && (
                  <Button onClick={() => { setInternForm(initialInternState); setIsEditingIntern(null); setShowInternForm(true) }} className="px-8">+ POST NEW ROLE</Button>
                )}
              </div>
            )}

            {!showInternForm && !selectedInternship && (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_190px] gap-4">
                <input
                  type="text"
                  placeholder="Search internships by title, skills, language, duration, or deadline..."
                  value={internSearch}
                  onChange={(e) => setInternSearch(e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-lg bg-white shadow-sm focus:border-blue-400 outline-none transition-colors"
                />
                <select
                  value={applicantSort}
                  onChange={(e) => setApplicantSort(e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-lg bg-white shadow-sm focus:border-blue-400 outline-none transition-colors"
                >
                  <option value="default">Default Sort</option>
                  <option value="topContributors">Top Contributors</option>
                </select>
              </div>
            )}

            {showInternForm && !selectedInternship && (
              <div className="bg-blue-600 p-8 rounded-3xl shadow-2xl text-white space-y-6">
                <h3 className="text-xl font-black italic">{isEditingIntern ? "Edit Internship details" : "Post a New Opportunity"}</h3>
                <form onSubmit={handleSaveInternship} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Position Title" value={internForm.title} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 col-span-2 text-white" onChange={e => setInternForm({ ...internForm, title: e.target.value })} />
                  <textarea required placeholder="Responsibilities & Details" value={internForm.details} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 col-span-2 min-h-[100px] text-white" onChange={e => setInternForm({ ...internForm, details: e.target.value })} />
                  <input required placeholder="Required Skills" value={internForm.skills} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({ ...internForm, skills: e.target.value })} />
                  <input required placeholder="Programming Languages" value={internForm.programmingLanguages} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({ ...internForm, programmingLanguages: e.target.value })} />
                  <input required placeholder="Duration" value={internForm.duration} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({ ...internForm, duration: e.target.value })} />
                  <input type="date" required min={todayDateString} value={internForm.deadline} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none text-white" onChange={e => setInternForm({ ...internForm, deadline: e.target.value })} />
                  <div className="flex gap-4 col-span-2 mt-4">
                    <button type="submit" className="bg-white text-blue-600 font-black hover:bg-slate-100 flex-1 py-4 rounded-xl transition-colors">{isEditingIntern ? "Save Changes" : "Publish Internship"}</button>
                    <button type="button" onClick={() => setShowInternForm(false)} className="text-white/60 font-bold hover:text-white underline px-4">Dismiss</button>
                  </div>
                </form>
              </div>
            )}

            {selectedInternship ? (
              <div className="bg-white border-2 border-slate-100 rounded-[40px] shadow-2xl overflow-hidden">
                <div className="bg-slate-900 text-white p-12 relative">
                  <button onClick={() => setSelectedInternship(null)} className="text-[10px] font-black mb-8 text-slate-400 hover:text-white tracking-widest">← BACK TO LIST</button>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${selectedInternship.status === 'Hiring' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'}`}>
                          {selectedInternship.status}
                        </span>
                        {selectedInternship.isArchived && <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase bg-red-500 text-white">Archived</span>}
                      </div>
                      <h2 className="text-4xl font-black tracking-tighter mb-2">{selectedInternship.title}</h2>
                      <p className="text-blue-400 font-bold text-sm uppercase tracking-widest">Deadline: {selectedInternship.deadline} • Duration: {selectedInternship.duration || 'N/A'}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => toggleHiringStatus(selectedInternship.id)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Mark as {selectedInternship.status === 'Hiring' ? 'Filled' : 'Hiring'}</button>
                      <button onClick={() => archiveInternship(selectedInternship.id)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">{selectedInternship.isArchived ? 'Unarchive' : 'Archive'}</button>
                      <button onClick={() => { setInternForm(selectedInternship); setIsEditingIntern(selectedInternship.id); setShowInternForm(true); setSelectedInternship(null) }} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Edit</button>
                      <button onClick={() => handleDeleteInternship(selectedInternship.id)} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs font-bold px-4 py-2 rounded-lg transition-colors">Delete</button>
                    </div>
                  </div>
                </div>

                <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
                  <div className="lg:col-span-2 space-y-10">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 block uppercase mb-4 tracking-widest">Responsibilities & Details</label>
                      <p className="text-lg text-slate-800 leading-relaxed">{selectedInternship.details || "No details provided."}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 block uppercase mb-4 tracking-widest">Required Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedInternship.skills ? selectedInternship.skills.split(',').map(s => <span key={s} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-bold">{s.trim()}</span>) : <span className="text-sm text-slate-400 italic">None specified</span>}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 block uppercase mb-4 tracking-widest">Programming Languages</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedInternship.programmingLanguages ? selectedInternship.programmingLanguages.split(',').map(lang => <span key={lang} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-md text-xs font-bold">{lang.trim()}</span>) : <span className="text-sm text-slate-400 italic">None specified</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[30px] border flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6 gap-3">
                      <label className="text-[10px] font-black text-slate-900 block uppercase tracking-widest">Applicants ({selectedInternship.applicants.length})</label>
                      <select value={applicantSort} onChange={(e) => setApplicantSort(e.target.value)} className="text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg outline-none">
                        <option value="default">Default Sort</option>
                        <option value="topContributors">Top Contributors</option>
                      </select>
                    </div>

                    <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px]">
                      {selectedInternship.applicants.length > 0 ? getSortedApplicants(selectedInternship).map(app => {
                        const isSuggested = isApplicantSuggested(app)
                        return (
                          <div key={app.id} className={`p-4 rounded-xl shadow-sm border ${isSuggested ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-black text-slate-800">{app.name}</p>
                                <p className="text-[11px] text-slate-400 mb-1">{app.email}</p>
                                <p className="text-[11px] font-bold text-blue-600">Contribution score: {getContributionScore(app)}</p>
                              </div>
                              {isSuggested && <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">★ Suggested</span>}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] font-black uppercase text-blue-500">{app.status}</span>
                              <select className="text-xs font-bold p-2 border rounded-lg bg-slate-50 outline-none" value={app.status} onChange={e => updateAppStatus(selectedInternship.id, app.id, e.target.value)}>
                                <option value="Nominated">Nominate</option>
                                <option value="Accepted">Accept</option>
                                <option value="Rejected">Reject</option>
                              </select>
                            </div>
                          </div>
                        )
                      }) : (
                        <p className="text-xs text-slate-400 italic text-center py-4">No applicants yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {!showInternForm && filteredInternships.length === 0 && (
                  <div className="text-center p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold">No internships match your search.</div>
                )}
                {!showInternForm && filteredInternships.map(intern => (
                  <div key={intern.id} className={`bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm transition-all hover:border-blue-200 ${intern.isArchived ? 'opacity-60 bg-slate-50' : ''}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1 cursor-pointer" onClick={() => setSelectedInternship(intern)}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${intern.status === 'Hiring' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{intern.status}</span>
                          {intern.isArchived && <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-800">Archived</span>}
                          <span className="text-[10px] font-black text-blue-500 uppercase">Closes: {intern.deadline}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight hover:text-blue-700">{intern.title}</h3>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-1">{intern.details}</p>
                      </div>
                      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                        <button onClick={() => setSelectedInternship(intern)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap text-center">View Details</button>
                        <div className="flex gap-2">
                          <button onClick={() => { setInternForm(intern); setIsEditingIntern(intern.id); setShowInternForm(true) }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors">Edit</button>
                          <button onClick={() => handleDeleteInternship(intern.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'instructors' && (
          <div className="space-y-8">
            {!selectedInstructor ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-black text-slate-900">Faculty Search</h2>
                  <p className="text-slate-500 mt-2">Search by instructor name or course.</p>
                </div>
                <input type="text" placeholder="Search by name or course..." className="w-full p-4 border border-slate-300 rounded-lg bg-white shadow-sm focus:border-blue-400 outline-none" onChange={e => setSearchTerm(e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instructors.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.courses.join().toLowerCase().includes(searchTerm.toLowerCase())).map(inst => (
                    <div key={inst.id} onClick={() => setSelectedInstructor(inst)} className="bg-white border-2 border-slate-100 p-6 rounded-3xl cursor-pointer hover:border-blue-400 group">
                      <img src={inst.photo} alt={inst.name} className="h-20 w-20 rounded-full object-cover mb-4" />
                      <h3 className="font-black text-slate-900 text-lg group-hover:text-blue-700">{inst.name}</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">Courses: {inst.courses.length}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-100 rounded-[40px] shadow-2xl overflow-hidden">
                <div className="bg-slate-950 text-white p-12">
                  <button onClick={() => setSelectedInstructor(null)} className="text-[10px] font-black mb-8 text-slate-500 hover:text-white tracking-widest">← RETURN</button>
                  <img src={selectedInstructor.photo} alt={selectedInstructor.name} className="h-24 w-24 rounded-full object-cover mb-6" />
                  <h2 className="text-5xl font-black tracking-tighter mb-2">{selectedInstructor.name}</h2>
                  <p className="text-blue-400 font-bold">{selectedInstructor.email}</p>
                </div>
                <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-10">
                    <div>
                      <label className="text-[10px] font-black text-slate-300 block uppercase mb-4 tracking-widest">Biography</label>
                      <p className="text-xl text-slate-800 font-medium italic border-l-4 border-blue-100 pl-6">"{selectedInstructor.bio}"</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-10 rounded-[30px] border">
                    <label className="text-[10px] font-black text-slate-900 block uppercase mb-8 tracking-widest">Teaching</label>
                    <ul className="space-y-4">
                      {selectedInstructor.courses.map(c => (
                        <li key={c} className="flex items-center gap-4 text-slate-700 font-black"><span className="h-2 w-2 bg-blue-600 rounded-full"></span><span className="text-lg">{c}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorite-projects' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900">Favorite Projects</h2>
              <p className="text-slate-500 mt-2">Click any favorite project to open its project details in this dashboard.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              {favorites.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.projects.map(id => {
                    const p = projectsData.find(x => x.id === id)
                    if (!p) return null
                    return (
                      <button type="button" onClick={() => openProjectDetails(p)} key={p.id} className="text-left p-4 border rounded-xl bg-slate-50 flex flex-col justify-between hover:border-blue-300 transition-colors group">
                        <div>
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700">{p.title}</p>
                            <span onClick={(e) => { e.stopPropagation(); toggleFavProject(p.id) }} className="text-red-500 text-xl hover:scale-125 transition-transform">❤️</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{p.domain}</p>
                          <p className="text-sm text-slate-600 mt-3 line-clamp-2">{p.summary}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : <p className="text-sm text-slate-400 italic">No favorite projects yet.</p>}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4">Favorite Portfolios</h3>
              {favorites.portfolios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.portfolios.map(id => {
                    const s = studentsData.find(x => x.id === id)
                    if (!s) return null
                    return (
                      <Link to={`/portfolio/${s.id}`} key={s.id} className="p-4 border rounded-xl bg-slate-50 flex justify-between items-center hover:border-blue-300 transition-colors group">
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-700">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.major}</p>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); toggleFavPortfolio(s.id) }} className="text-red-500 text-xl hover:scale-125 transition-transform">❤️</button>
                      </Link>
                    )
                  })}
                </div>
              ) : <p className="text-sm text-slate-400 italic">No favorite portfolios yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'recommended-projects' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900">Recommended Projects</h2>
              <p className="text-slate-500 mt-2">Click any recommended project to open its project details in this dashboard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedProjects.map(project => (
                <button type="button" onClick={() => openProjectDetails(project)} key={project.id} className="text-left p-6 border rounded-2xl bg-white shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors group">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-700">{project.title}</h3>
                      <span onClick={(e) => { e.stopPropagation(); toggleFavProject(project.id) }} className="text-2xl hover:scale-125 transition-transform opacity-70 hover:opacity-100">
                        {favorites.projects.includes(project.id) ? '❤️' : '🤍'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">{project.domain}</p>
                    <p className="text-sm text-slate-600 line-clamp-2">{project.summary}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'project-details' && selectedProject && (
          <div className="space-y-8">
            <button onClick={() => setActiveTab(favorites.projects.includes(selectedProject.id) ? 'favorite-projects' : 'recommended-projects')} className="text-[10px] font-black text-slate-500 hover:text-blue-600 tracking-widest uppercase">← Back to Projects</button>
            <div className="bg-white border-2 border-slate-100 rounded-[40px] shadow-2xl overflow-hidden">
              <div className="bg-slate-900 text-white p-12">
                <div className="flex justify-between items-start gap-6">
                  <div>
                    <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-3">{selectedProject.domain || 'Project'}</p>
                    <h2 className="text-5xl font-black tracking-tighter mb-4">{selectedProject.title}</h2>
                    <p className="text-slate-300 text-lg leading-relaxed max-w-4xl">{selectedProject.summary || selectedProject.description || 'No summary available.'}</p>
                  </div>
                  <button onClick={() => toggleFavProject(selectedProject.id)} className="bg-white/10 hover:bg-white/20 text-white text-2xl h-12 w-12 rounded-xl">
                    {favorites.projects.includes(selectedProject.id) ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>

              <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 block uppercase mb-4 tracking-widest">Project Details</label>
                    <p className="text-lg text-slate-800 leading-relaxed">{selectedProject.description || selectedProject.summary || 'Project details are not available.'}</p>
                  </div>

                  {selectedProject.techStack && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 block uppercase mb-4 tracking-widest">Tech Stack</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.techStack.map(item => <span key={item} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-md text-xs font-bold">{item}</span>)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-8 rounded-[30px] border">
                  <label className="text-[10px] font-black text-slate-900 block uppercase mb-6 tracking-widest">Project Info</label>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase">Owner</p>
                      <p className="font-bold text-slate-800">{selectedProject.owner || selectedProject.studentName || 'Student project'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase">Domain</p>
                      <p className="font-bold text-slate-800">{selectedProject.domain || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase">Status</p>
                      <p className="font-bold text-slate-800">{selectedProject.status || 'Available'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Messages</h2>
                <p className="text-slate-500 mt-2">Open the message composer, choose a receiver, write your message, and send it.</p>
              </div>
              <Button onClick={() => setShowMessageModal(true)} variant="secondary" className="text-xs px-4">
                + New Message
              </Button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {messages.length > 0 ? messages.map(msg => (
                  <div key={msg.id} className={`p-6 sm:p-8 transition-colors ${!msg.read ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900">{msg.sender}</h3>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{msg.role}</span>
                        {msg.receiver && <p className="text-xs text-slate-400 mt-2">To: {msg.receiver}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">{msg.date}</span>
                        <button
                          onClick={() => toggleMessageRead(msg.id)}
                          className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${msg.read ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                          Mark as {msg.read ? 'Unread' : 'Read'}
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-700 mt-3 text-sm leading-relaxed">{msg.text}</p>
                  </div>
                )) : <div className="p-16 text-center text-slate-400 font-bold">No messages found.</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Notifications</h2>
              <div className="flex gap-4 items-center">
                <button onClick={markAllUnread} className="text-sm font-bold text-slate-500 hover:text-slate-700 hover:underline">Mark All as Unread</button>
                <button onClick={markAllRead} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline">Mark All as Read</button>
                <button onClick={toggleAllNotifications} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${notificationsEnabled ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                  {notificationsEnabled ? 'Turn Off Alerts' : 'Turn On Alerts'}
                </button>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {!notificationsEnabled && (
                <div className="p-4 bg-slate-50 border-b border-slate-200 text-center"><span className="text-sm font-bold text-slate-500">Alerts are currently paused. You won't receive new notifications.</span></div>
              )}
              <div className="divide-y divide-slate-100">
                {userNotifications.length > 0 ? userNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex-1 pointer-events-none">
                      <p className={`text-base ${!n.read ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>{n.text}</p>
                      <p className="text-xs text-slate-400 mt-2 font-bold tracking-wide uppercase">{n.time} • {n.read ? 'Read' : 'Unread'}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setUserNotifications(userNotifications.map(item => item.id === n.id ? { ...item, read: !item.read } : item)) }}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${!n.read ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Mark as {n.read ? 'Unread' : 'Read'}
                    </button>
                  </div>
                )) : <div className="p-16 text-center"><span className="text-4xl block mb-4">📭</span><p className="text-slate-500 font-bold">You're all caught up!</p></div>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default EmployerDashboard
