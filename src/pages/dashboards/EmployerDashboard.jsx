import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, getEmployerProfile, saveEmployerProfile } from '../../data/authStorage'
import Button from '../../components/Button'
import projectsData from '../../data/projects'
import studentsData from '../../data/students'

function EmployerDashboard() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const empId = user?.email?.toLowerCase() || 'default'

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
      { id: 1, text: 'New application received for Business Analyst role', read: false, time: '2 mins ago' },
      { id: 2, text: 'Reminder: review nominated applicants this week', read: false, time: '1 hour ago' },
      { id: 3, text: 'New private message from Ahmed Ali', read: false, time: 'Today' },
      { id: 4, text: 'Your public profile location was updated', read: true, time: 'Yesterday' }
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
      name: 'Demo Instructor',
      email: 'instructor@guc.edu.eg',
      bio: 'Associate professor focusing on software engineering education and applied machine learning. Advises undergraduate capstone teams and graduate seminars.',
      researchInterests: 'Human-computer interaction for collaboration tools, educational data mining, and trustworthy ML in production systems.',
      education: 'Ph.D. Computer Science - Technical University; M.Sc. Software Engineering - GUC.',
      courses: ['Bachelor Project'],
      photo: defaultAvatar
    },
    {
      id: 2,
      name: 'Lojaina Elsalamouny',
      email: 'loji@guc.edu.eg',
      bio: 'Instructor and project mentor supporting software engineering students across project planning, architecture, implementation, and evaluation.',
      researchInterests: 'Software Engineering, HCI, Education Technology',
      education: 'M.Sc. Computer Science - GUC.',
      courses: ['Bachelor Project', 'CSEN 603', 'CSEN 701'],
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="60" fill="%23dbeafe"/><text x="60" y="72" text-anchor="middle" font-size="38" font-family="Arial" font-weight="700" fill="%232563eb">L</text></svg>'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState(null)

  const [internSearch, setInternSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')

  const [internships, setInternships] = useState(() => {
    const saved = localStorage.getItem(storageKeys.internships)
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        title: 'Industrial IoT Engineering Intern',
        company: 'Siemens',
        location: 'Cairo, Egypt',
        details: 'Work on edge telemetry pipelines for manufacturing dashboards. Requirements: Strong C++ or Python, basic networking, GPA 3.2+.',
        skills: 'C++, Python, MQTT',
        duration: '6 months',
        programmingLanguages: 'C++, Python',
        status: 'Currently Hiring',
        deadline: '2026-09-15',
        posted: '2026-04-01',
        isArchived: false,
        applicants: [
          { id: 101, name: 'Laila Hassan', email: 'laila@guc.edu.eg', status: 'Nominated', contributionScore: 92 },
          { id: 102, name: 'Ahmed Ali', email: 'ahmed@guc.edu.eg', status: 'Accepted', contributionScore: 88 },
          { id: 103, name: 'Carim Mansour', email: 'carim@guc.edu.eg', status: 'Rejected', contributionScore: 74 }
        ]
      },
      {
        id: 2,
        title: 'Cloud Software Engineer Intern',
        company: 'Microsoft',
        location: 'Remote (MENA)',
        details: 'Azure microservices, observability, and reliability for education-sector workloads. Requirements: Algorithms, distributed systems coursework, Git.',
        skills: 'Azure, Kubernetes, TypeScript, C#',
        duration: '3 months',
        programmingLanguages: 'TypeScript, C#',
        status: 'Currently Hiring',
        deadline: '2026-08-30',
        posted: '2026-04-01',
        isArchived: false,
        applicants: [
          { id: 104, name: 'Nour Adel', email: 'nour@guc.edu.eg', status: 'Accepted', contributionScore: 96 },
          { id: 105, name: 'Youssef Samir', email: 'youssef@guc.edu.eg', status: 'Nominated', contributionScore: 81 }
        ]
      },
      {
        id: 3,
        title: 'ADAS Perception Intern',
        company: 'Valeo',
        location: 'Cairo / Smart Village',
        details: 'Sensor fusion experiments and evaluation tooling for ADAS stacks. Requirements: Computer vision basics, MATLAB or Python.',
        skills: 'Computer Vision, Python',
        duration: '4 months',
        programmingLanguages: 'Python',
        status: 'Currently Hiring',
        deadline: '2026-07-20',
        posted: '2026-04-01',
        isArchived: false,
        applicants: []
      }
    ]
  })

  const initialInternState = {
    title: '',
    company: '',
    location: '',
    details: '',
    skills: '',
    duration: '',
    programmingLanguages: '',
    deadline: '',
    status: 'Currently Hiring'
  }

  const [showInternForm, setShowInternForm] = useState(false)
  const [isEditingIntern, setIsEditingIntern] = useState(null)
  const [internForm, setInternForm] = useState(initialInternState)
  const [selectedInternship, setSelectedInternship] = useState(null)
  const [applicantSort, setApplicantSort] = useState('default')

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(storageKeys.favorites)
    return saved ? JSON.parse(saved) : {
      projects: [projectsData[0]?.id].filter(Boolean),
      portfolios: []
    }
  })

  const [selectedProject, setSelectedProject] = useState(null)

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKeys.messages)
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        sender: 'Ahmed Ali',
        receiver: user?.companyName || 'Employer',
        role: 'Student',
        text: 'it works now',
        date: '2026-05-11',
        time: '03:25 PM',
        read: true,
        mine: false
      },
      {
        id: 2,
        sender: 'Ahmed Ali',
        receiver: user?.companyName || 'Employer',
        role: 'Student',
        text: 'I am happy it works',
        date: '2026-05-11',
        time: '03:29 PM',
        read: true,
        mine: false
      },
      {
        id: 3,
        sender: 'Ahmed Ali',
        receiver: user?.companyName || 'Employer',
        role: 'Student',
        text: 'I hope to get a good grade in this project',
        date: '2026-05-11',
        time: '03:30 PM',
        read: false,
        mine: false
      },
      {
        id: 4,
        sender: user?.companyName || 'Employer',
        receiver: 'Ahmed Ali',
        role: 'Employer',
        text: 'same man',
        date: '2026-05-11',
        time: '01:54 AM',
        read: true,
        mine: true
      },
      {
        id: 5,
        sender: user?.companyName || 'Employer',
        receiver: 'Ahmed Ali',
        role: 'Employer',
        text: 'i have high hopes',
        date: '2026-05-11',
        time: '01:54 AM',
        read: true,
        mine: true
      },
      {
        id: 6,
        sender: user?.companyName || 'Employer',
        receiver: 'Ahmed Ali',
        role: 'Employer',
        text: 'I sent this message with the new feature',
        date: '2026-05-11',
        time: '01:55 AM',
        read: true,
        mine: true
      }
    ]
  })

  const [selectedConversation, setSelectedConversation] = useState('Ahmed Ali')
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageForm, setMessageForm] = useState({ receiver: 'Ahmed Ali', text: '' })
  const [quickMessage, setQuickMessage] = useState('')

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

  const pageTitleClass = 'text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-slate-950'
  const pageSubClass = 'text-[15px] text-slate-500 mt-2'
  const cardClass = 'bg-white border border-slate-200 rounded-xl shadow-sm'

  const showSuccess = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: '' }), 5000)
  }

  const toggleAllNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    showSuccess(notificationsEnabled ? 'All notifications turned off.' : 'Notifications enabled.')
  }

  const markAsRead = (id) => setUserNotifications(userNotifications.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => {
    setUserNotifications(userNotifications.map(n => ({ ...n, read: true })))
    showSuccess('All notifications marked as read.')
  }
  const markAllUnread = () => {
    setUserNotifications(userNotifications.map(n => ({ ...n, read: false })))
    showSuccess('All notifications marked as unread.')
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

  const getNowTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()

    if (!messageForm.receiver.trim() || !messageForm.text.trim()) {
      alert('Please choose a receiver and write a message.')
      return
    }

    const newMsg = {
      id: Date.now(),
      sender: user?.companyName || 'Employer',
      receiver: messageForm.receiver.trim(),
      role: 'Employer',
      text: messageForm.text.trim(),
      date: new Date().toISOString().split('T')[0],
      time: getNowTime(),
      read: true,
      mine: true
    }

    setMessages([...messages, newMsg])
    setSelectedConversation(messageForm.receiver.trim())
    setMessageForm({ receiver: messageForm.receiver.trim(), text: '' })
    setShowMessageModal(false)
    showSuccess('Message sent successfully.')
  }

  const sendQuickMessage = (e) => {
    e.preventDefault()

    if (!quickMessage.trim()) return

    const newMsg = {
      id: Date.now(),
      sender: user?.companyName || 'Employer',
      receiver: selectedConversation,
      role: 'Employer',
      text: quickMessage.trim(),
      date: new Date().toISOString().split('T')[0],
      time: getNowTime(),
      read: true,
      mine: true
    }

    setMessages([...messages, newMsg])
    setQuickMessage('')
  }

  const toggleFavProject = (id) => {
    setFavorites(prev => {
      const isFav = prev.projects.includes(id)
      return { ...prev, projects: isFav ? prev.projects.filter(pId => pId !== id) : [...prev.projects, id] }
    })
    showSuccess('Favorites updated.')
  }

  const toggleFavPortfolio = (id) => {
    setFavorites(prev => {
      const isFav = prev.portfolios.includes(id)
      return { ...prev, portfolios: isFav ? prev.portfolios.filter(pId => pId !== id) : [...prev.portfolios, id] }
    })
    showSuccess('Favorites updated.')
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
      alert('Please enter a building or city.')
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
    showSuccess('Location saved to Google Maps and added to your profile.')
  }

  const recommendedProjects = useMemo(() => {
    const fallback = [
      {
        id: 'rec-1',
        title: 'Smart Campus Navigator',
        domain: 'CSEN 603',
        summary: 'Cross-platform indoor/outdoor navigation for GUC campuses with live occupancy, accessible routes, and offline maps.',
        techStack: ['TypeScript', 'JavaScript'],
        owner: 'student@student.guc.edu.eg',
        rating: 5
      },
      {
        id: 'rec-2',
        title: 'Graduation Thesis Portfolio Platform',
        domain: 'Bachelor Project',
        summary: 'A portfolio hub for thesis teams: milestones, reviews, versioning, and defense scheduling integrated with Git.',
        techStack: ['TypeScript', 'Go'],
        owner: 'student2@guc.edu.eg',
        rating: 5
      },
      {
        id: 'rec-3',
        title: 'Collaborative Notes Hub',
        domain: 'CSEN 603',
        summary: 'Real-time collaborative markdown notes with CRDT sync shared publicly for the course community.',
        techStack: ['Rust', 'WebSockets', 'React'],
        owner: 'student.dana@guc.edu.eg',
        rating: 5
      },
      {
        id: 'rec-4',
        title: 'GUC Events Social Graph',
        domain: 'CSEN 603',
        summary: 'Featured public project: graph analytics over campus events, club memberships, and collaborative filtering for recommendations.',
        techStack: ['Python', 'Cypher'],
        owner: 'student2@guc.edu.eg',
        rating: 5
      }
    ]

    return projectsData.length >= 3 ? projectsData.slice(0, 4) : fallback
  }, [])

  const todayDateString = new Date().toISOString().split('T')[0]

  const filteredInternships = useMemo(() => {
    const lowerSearch = internSearch.toLowerCase()

    return internships.filter(i => {
      const matchesSearch = !internSearch ||
        i.title?.toLowerCase().includes(lowerSearch) ||
        i.company?.toLowerCase().includes(lowerSearch) ||
        i.skills?.toLowerCase().includes(lowerSearch) ||
        i.programmingLanguages?.toLowerCase().includes(lowerSearch) ||
        i.duration?.toLowerCase().includes(lowerSearch) ||
        i.deadline?.includes(lowerSearch)

      const matchesCompany = companyFilter === 'all' || i.company === companyFilter
      const matchesDuration = durationFilter === 'all' || i.duration === durationFilter

      return matchesSearch && matchesCompany && matchesDuration
    })
  }, [internships, internSearch, companyFilter, durationFilter])

  const handleSaveInternship = (e) => {
    e.preventDefault()
    if (internForm.deadline < todayDateString) {
      alert('The application deadline cannot be in the past.')
      return
    }

    if (isEditingIntern) {
      setInternships(internships.map(i => i.id === isEditingIntern ? { ...i, ...internForm } : i))
      showSuccess('Internship updated successfully!')
    } else {
      setInternships([{ ...internForm, id: Date.now(), isArchived: false, applicants: [], posted: todayDateString }, ...internships])
      showSuccess(`Internship '${internForm.title}' posted!`)
    }

    setShowInternForm(false)
    setIsEditingIntern(null)
    setInternForm(initialInternState)
  }

  const toggleHiringStatus = (id) => {
    setInternships(internships.map(i => {
      if (i.id === id) {
        const newStatus = i.status === 'Currently Hiring' || i.status === 'Hiring' ? 'Position Filled' : 'Currently Hiring'
        if (selectedInternship?.id === id) setSelectedInternship({ ...i, status: newStatus })
        return { ...i, status: newStatus }
      }
      return i
    }))
    showSuccess('Internship status updated.')
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
    showSuccess('Archive status updated.')
  }

  const handleDeleteInternship = (id) => {
    if (window.confirm('Delete this internship?')) {
      setInternships(internships.filter(i => i.id !== id))
      if (selectedInternship?.id === id) setSelectedInternship(null)
      showSuccess('Internship deleted.')
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

  const getProjectTags = (project) => {
    if (Array.isArray(project.techStack)) return project.techStack
    if (Array.isArray(project.tags)) return project.tags
    if (project.skills) return String(project.skills).split(',').map(s => s.trim()).filter(Boolean)
    return ['TypeScript', 'React']
  }

  const getProjectRating = (project) => project.rating || project.score || 5

  const conversationNames = useMemo(() => {
    const names = new Set(['Ahmed Ali'])
    messages.forEach(msg => {
      if (msg.mine && msg.receiver) names.add(msg.receiver)
      if (!msg.mine && msg.sender) names.add(msg.sender)
    })
    studentsData.slice(0, 3).forEach(student => names.add(student.name))
    instructors.slice(0, 2).forEach(inst => names.add(inst.name))
    return [...names]
  }, [messages, instructors])

  const selectedMessages = messages.filter(msg =>
    msg.sender === selectedConversation || msg.receiver === selectedConversation
  )

  const sidebarItems = [
    { id: 'profile', label: 'Overview', icon: '⌂' },
    { id: 'profile-details', label: 'My Profile', icon: '♙' },
    { id: 'notifications', label: 'Notifications', icon: '♧' },
    { id: 'internships', label: 'Internships', icon: '▣' },
    { id: 'instructors', label: 'Find Instructors', icon: '▤' },
    { id: 'favorite-projects', label: 'Favorites', icon: '♡' },
    { id: 'recommended-projects', label: 'Recommended', icon: '☆' },
    { id: 'messages', label: 'Messages', icon: '▢' },
    { id: 'statistics', label: 'Statistics', icon: '▥' }
  ]

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex text-slate-950">
      <aside className="w-[260px] bg-white border-r border-slate-200 min-h-screen px-6 py-8 flex flex-col fixed left-0 top-0 bottom-0">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Employer Portal</p>
          <h1 className="text-lg font-extrabold text-slate-950 mt-2">{user.companyName || 'Employer'}</h1>
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
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'notifications' && userNotifications.some(n => !n.read) && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
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

      <main className="ml-[260px] w-full px-10 py-8 relative">
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
              <span className="text-lg">⌂</span>
            </button>

            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors relative flex items-center justify-center h-10 w-10">
              <span className="text-lg">♧</span>
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
                <button onClick={() => setShowMessageModal(false)} className="text-slate-400 hover:text-slate-700 font-black">x</button>
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
                    {conversationNames.map(name => (
                      <option key={name} value={name}>{name}</option>
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
          <div className="space-y-8 max-w-6xl">
            <div>
              <h2 className={pageTitleClass}>Overview</h2>
              <p className={pageSubClass}>Your employer dashboard summary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-slate-500 font-medium">Internships Offered</p>
                <p className="text-4xl font-black text-blue-600 mt-2">{stats.totalInternships}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-sm">
                <p className="text-slate-500 font-medium">Students Accepted</p>
                <p className="text-4xl font-black text-emerald-600 mt-2">{stats.totalAcceptedStudents}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 shadow-sm">
                <p className="text-slate-500 font-medium">Applications</p>
                <p className="text-4xl font-black text-amber-600 mt-2">{stats.totalApplications}</p>
              </div>
              <div className="bg-violet-50 p-6 rounded-xl border border-violet-100 shadow-sm">
                <p className="text-slate-500 font-medium">Unread Messages</p>
                <p className="text-4xl font-black text-violet-600 mt-2">{messages.filter(m => !m.read).length}</p>
              </div>
            </div>

            <div className={`${cardClass} p-8`}>
              <h3 className="text-2xl font-black text-slate-900 mb-6">Recent Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase block mb-1">Company</span>
                  <span className="text-slate-900 font-bold">{user.companyName || 'Employer'}</span>
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
            <div className="flex justify-between items-center max-w-5xl">
              <h2 className={pageTitleClass}>My Profile</h2>
              <Button onClick={() => setEditingProfile(!editingProfile)}>{editingProfile ? 'Cancel' : 'Edit Profile'}</Button>
            </div>

            <div className={`${cardClass} p-8 max-w-5xl`}>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-8">
                <div className="flex flex-col items-center">
                  <div className="h-28 w-28 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border border-blue-100">
                    {profileForm.profilePicture ? (
                      <img src={profileForm.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-black text-blue-600">{(user.companyName || 'E').charAt(0)}</span>
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
                        showSuccess('Profile photo uploaded.')
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
                        showSuccess('Company logo uploaded.')
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
                        alert('Phone number must be exactly 11 digits.')
                        return
                      }
                      saveEmployerProfile(user.email, profileForm)
                      setEditingProfile(false)
                      showSuccess('Profile details updated successfully!')
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
                        <span className="text-2xl mb-2">□</span>
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
                          <h3 className="text-2xl font-black text-slate-900">{user.companyName || 'Employer'}</h3>
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
                            <a href={profileForm.website} className="text-blue-600 font-bold">{profileForm.website || 'Not set'}</a>
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-400 uppercase block mb-1">Contact</span>
                            <span className="text-slate-900 font-bold">{profileForm.phone || 'Not set'}</span>
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-400 uppercase block mb-1">Address</span>
                            <span className="text-slate-900 font-bold">{profileForm.address || profileForm.mapLocation || 'Not set'}</span>
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
                          <a href={profileForm.taxCertificate} download={profileForm.taxCertificateName || 'Tax_Certificate.pdf'} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-colors">
                            Download Tax Certificate
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`${cardClass} p-6 max-w-5xl`}>
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
          <div className="space-y-8 max-w-6xl">
            <div>
              <h2 className={pageTitleClass}>Employer Statistics</h2>
              <p className={pageSubClass}>Students who completed internships with your company and internships offered over time.</p>
            </div>

            <div className={`${cardClass} p-8`}>
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
          <div className="space-y-8 max-w-6xl">
            {!selectedInternship && (
              <div>
                <h2 className={pageTitleClass}>Internships</h2>
              </div>
            )}

            {!showInternForm && !selectedInternship && (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_160px] gap-3">
                <input
                  type="text"
                  placeholder="⌕  Search by title or company..."
                  value={internSearch}
                  onChange={(e) => setInternSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-blue-400 outline-none transition-colors"
                />
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-blue-400 outline-none transition-colors"
                >
                  <option value="all">All Companies</option>
                  {[...new Set(internships.map(i => i.company).filter(Boolean))].map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-blue-400 outline-none transition-colors"
                >
                  <option value="all">All Durations</option>
                  {[...new Set(internships.map(i => i.duration).filter(Boolean))].map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>
              </div>
            )}

            {!selectedInternship && !showInternForm && (
              <div className="flex justify-end">
                <Button onClick={() => { setInternForm(initialInternState); setIsEditingIntern(null); setShowInternForm(true) }} className="px-6">+ Post New Role</Button>
              </div>
            )}

            {showInternForm && !selectedInternship && (
              <div className="bg-blue-600 p-8 rounded-3xl shadow-2xl text-white space-y-6">
                <h3 className="text-xl font-black italic">{isEditingIntern ? 'Edit Internship details' : 'Post a New Opportunity'}</h3>
                <form onSubmit={handleSaveInternship} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Position Title" value={internForm.title} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 col-span-2 text-white" onChange={e => setInternForm({ ...internForm, title: e.target.value })} />
                  <input required placeholder="Company" value={internForm.company} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({ ...internForm, company: e.target.value })} />
                  <input required placeholder="Location" value={internForm.location} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({ ...internForm, location: e.target.value })} />
                  <textarea required placeholder="Responsibilities & Details" value={internForm.details} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 col-span-2 min-h-[100px] text-white" onChange={e => setInternForm({ ...internForm, details: e.target.value })} />
                  <input required placeholder="Required Skills" value={internForm.skills} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({ ...internForm, skills: e.target.value })} />
                  <input required placeholder="Programming Languages" value={internForm.programmingLanguages} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({ ...internForm, programmingLanguages: e.target.value })} />
                  <input required placeholder="Duration" value={internForm.duration} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({ ...internForm, duration: e.target.value })} />
                  <input type="date" required min={todayDateString} value={internForm.deadline} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none text-white" onChange={e => setInternForm({ ...internForm, deadline: e.target.value })} />
                  <div className="flex gap-4 col-span-2 mt-4">
                    <button type="submit" className="bg-white text-blue-600 font-black hover:bg-slate-100 flex-1 py-4 rounded-xl transition-colors">{isEditingIntern ? 'Save Changes' : 'Publish Internship'}</button>
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
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${selectedInternship.status === 'Currently Hiring' || selectedInternship.status === 'Hiring' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'}`}>
                          {selectedInternship.status}
                        </span>
                        {selectedInternship.isArchived && <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase bg-red-500 text-white">Archived</span>}
                      </div>
                      <h2 className="text-4xl font-black tracking-tighter mb-2">{selectedInternship.title}</h2>
                      <p className="text-blue-400 font-bold text-sm uppercase tracking-widest">Deadline: {selectedInternship.deadline} • Duration: {selectedInternship.duration || 'N/A'}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => toggleHiringStatus(selectedInternship.id)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Mark as {selectedInternship.status === 'Currently Hiring' || selectedInternship.status === 'Hiring' ? 'Filled' : 'Hiring'}</button>
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
                      <p className="text-lg text-slate-800 leading-relaxed">{selectedInternship.details || 'No details provided.'}</p>
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
              <div className="grid grid-cols-1 gap-4">
                {!showInternForm && filteredInternships.length === 0 && (
                  <div className="text-center p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold">No internships match your search.</div>
                )}
                {!showInternForm && filteredInternships.map(intern => (
                  <div key={intern.id} className={`${cardClass} p-6 transition-all hover:border-blue-200 ${intern.isArchived ? 'opacity-60 bg-slate-50' : ''}`}>
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 cursor-pointer" onClick={() => setSelectedInternship(intern)}>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-extrabold text-slate-950 tracking-tight hover:text-blue-700">{intern.title}</h3>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{intern.company}</span>
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{intern.duration}</span>
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{intern.status}</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          <span className="text-pink-500">●</span> {intern.location} {intern.details}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {intern.skills.split(',').map(skill => (
                            <span key={skill} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{skill.trim()}</span>
                          ))}
                          {intern.programmingLanguages.split(',').map(lang => (
                            <span key={lang} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{lang.trim()}</span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-3">Posted {intern.posted || '2026-04-01'} · Deadline {intern.deadline}</p>
                      </div>
                      <button onClick={() => setSelectedInternship(intern)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-3 rounded-lg transition-colors whitespace-nowrap">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'instructors' && (
          <div className="space-y-8 max-w-6xl">
            {!selectedInstructor ? (
              <>
                <div>
                  <h2 className={pageTitleClass}>Find Instructors</h2>
                  <p className={pageSubClass}>Search by name or course.</p>
                </div>

                <input
                  type="text"
                  placeholder="⌕  Search by name or course..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white shadow-sm focus:border-blue-400 outline-none"
                  onChange={e => setSearchTerm(e.target.value)}
                />

                <div className="grid grid-cols-1 gap-4">
                  {instructors.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.courses.join().toLowerCase().includes(searchTerm.toLowerCase())).map(inst => (
                    <div key={inst.id} className={`${cardClass} p-6 flex items-center justify-between`}>
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
                          {inst.photo ? <img src={inst.photo} alt={inst.name} className="w-full h-full object-cover" /> : <span className="font-bold text-blue-700">{inst.name.charAt(0)}</span>}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-950 text-lg">{inst.name}</h3>
                          <p className="text-sm text-slate-500">{inst.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {inst.courses.map(course => (
                              <span key={course} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{course}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedInstructor(inst)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-lg">
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              </>
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
          <div className="space-y-8 max-w-6xl">
            <div>
              <h2 className={pageTitleClass}>My Favorites</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-950 mb-4">Saved Projects ({favorites.projects.length})</h3>
                <div className="space-y-4">
                  {favorites.projects.length > 0 ? favorites.projects.map(id => {
                    const p = projectsData.find(x => x.id === id) || recommendedProjects.find(x => x.id === id)
                    if (!p) return null
                    return (
                      <button type="button" onClick={() => openProjectDetails(p)} key={p.id} className={`${cardClass} w-full text-left p-6 hover:border-blue-300 transition-colors group`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-950 text-lg group-hover:text-blue-700">{p.title}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{p.domain || 'CSEN 603'}</span>
                              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">★ {getProjectRating(p)}/5</span>
                            </div>
                          </div>
                          <span onClick={(e) => { e.stopPropagation(); toggleFavProject(p.id) }} className="text-red-500 text-lg hover:scale-125 transition-transform">×</span>
                        </div>
                      </button>
                    )
                  }) : (
                    <div className={`${cardClass} h-40 flex items-center justify-center text-slate-400`}>No saved projects.</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-950 mb-4">Saved Portfolios ({favorites.portfolios.length})</h3>
                <div className="space-y-4">
                  {favorites.portfolios.length > 0 ? favorites.portfolios.map(id => {
                    const s = studentsData.find(x => x.id === id)
                    if (!s) return null
                    return (
                      <Link to={`/portfolio/${s.id}`} key={s.id} className={`${cardClass} p-6 flex justify-between items-center hover:border-blue-300 transition-colors group`}>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-700">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.major}</p>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); toggleFavPortfolio(s.id) }} className="text-red-500 text-xl hover:scale-125 transition-transform">×</button>
                      </Link>
                    )
                  }) : (
                    <div className={`${cardClass} h-40 flex items-center justify-center text-slate-400 text-center px-8`}>
                      No saved portfolios. Heart a portfolio in Explore All Portfolios.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommended-projects' && (
          <div className="space-y-8 max-w-6xl">
            <div>
              <h2 className={pageTitleClass}>Recommended Projects</h2>
              <p className={pageSubClass}>Projects matching your company interests.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {recommendedProjects.map(project => (
                <button type="button" onClick={() => openProjectDetails(project)} key={project.id} className={`${cardClass} text-left p-6 hover:border-blue-300 transition-colors group`}>
                  <div className="flex justify-between items-start gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-extrabold text-slate-950 text-lg leading-tight group-hover:text-blue-700">{project.title}</h3>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{project.domain || 'CSEN 603'}</span>
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">★ {getProjectRating(project)}/5</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-3">{project.summary || project.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {getProjectTags(project).map(tag => (
                          <span key={tag} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{tag}</span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-3">By {project.owner || project.studentName || 'student@student.guc.edu.eg'}</p>
                    </div>
                    <span onClick={(e) => { e.stopPropagation(); toggleFavProject(project.id) }} className={`text-2xl hover:scale-125 transition-transform ${favorites.projects.includes(project.id) ? 'text-red-500' : 'text-slate-300'}`}>
                      ♡
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'project-details' && selectedProject && (
          <div className="space-y-8 max-w-6xl">
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
                    {favorites.projects.includes(selectedProject.id) ? '♥' : '♡'}
                  </button>
                </div>
              </div>

              <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 block uppercase mb-4 tracking-widest">Project Details</label>
                    <p className="text-lg text-slate-800 leading-relaxed">{selectedProject.description || selectedProject.summary || 'Project details are not available.'}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 block uppercase mb-4 tracking-widest">Tech Stack</label>
                    <div className="flex flex-wrap gap-2">
                      {getProjectTags(selectedProject).map(item => <span key={item} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-md text-xs font-bold">{item}</span>)}
                    </div>
                  </div>
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
          <div className="h-[calc(100vh-110px)] max-w-6xl">
            <div className="grid grid-cols-[300px_1fr] h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="border-r border-slate-200 bg-slate-50">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-950">Messages</h2>
                    <p className="text-xs text-slate-500">Chats and private messages</p>
                  </div>
                  <button onClick={() => setShowMessageModal(true)} className="bg-blue-600 text-white h-9 w-9 rounded-lg font-bold">+</button>
                </div>

                <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-82px)]">
                  {conversationNames.map(name => {
                    const last = [...messages].reverse().find(msg => msg.sender === name || msg.receiver === name)
                    const unread = messages.filter(msg => !msg.mine && !msg.read && msg.sender === name).length

                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedConversation(name)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${
                          selectedConversation === name ? 'bg-white border-blue-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-white'
                        }`}
                      >
                        <div className="flex gap-3 items-center">
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center gap-2">
                              <p className="font-bold text-sm text-slate-900 truncate">{name}</p>
                              {unread > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full px-2">{unread}</span>}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{last?.text || 'No messages yet'}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col bg-white">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {selectedConversation.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-950">{selectedConversation}</h3>
                      <p className="text-xs text-slate-500">Private chat</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMessages(messages.map(msg => msg.sender === selectedConversation ? { ...msg, read: true } : msg))
                      showSuccess('Conversation marked as read.')
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Mark chat read
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                  <div className="space-y-4">
                    {selectedMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[60%] rounded-2xl px-4 py-3 ${msg.mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-900 rounded-bl-md'}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <div className={`mt-1 flex items-center gap-2 ${msg.mine ? 'text-blue-100' : 'text-slate-400'}`}>
                            <span className="text-xs">{msg.time || msg.date}</span>
                            {!msg.mine && (
                              <button onClick={() => toggleMessageRead(msg.id)} className="text-[10px] font-bold underline">
                                {msg.read ? 'Unread' : 'Read'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={sendQuickMessage} className="p-5 border-t border-slate-200 flex gap-3 bg-white">
                  <input
                    value={quickMessage}
                    onChange={e => setQuickMessage(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl">Send</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8 max-w-6xl">
            <div className="flex justify-between items-end">
              <div>
                <h2 className={pageTitleClass}>Notifications</h2>
                <p className={pageSubClass}>Updates, alerts, and internship activity.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={markAllUnread} className="text-sm font-bold text-slate-500 hover:text-slate-700 hover:underline">Mark All as Unread</button>
                <button onClick={markAllRead} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline">Mark All as Read</button>
                <button onClick={toggleAllNotifications} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${notificationsEnabled ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700'}`}>
                  {notificationsEnabled ? 'Turn Off Alerts' : 'Turn On Alerts'}
                </button>
              </div>
            </div>

            <div className={`${cardClass} overflow-hidden`}>
              {!notificationsEnabled && (
                <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
                  <span className="text-sm font-bold text-slate-500">Alerts are currently paused. You won't receive new notifications.</span>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {userNotifications.length > 0 ? userNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-6 flex justify-between items-center gap-4 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-3 w-3 rounded-full mt-2 ${n.read ? 'bg-slate-300' : 'bg-blue-600'}`}></div>
                      <div>
                        <p className={`${!n.read ? 'font-extrabold text-slate-950' : 'font-semibold text-slate-600'}`}>{n.text}</p>
                        <p className="text-xs text-slate-400 mt-2 font-bold uppercase">{n.time} • {n.read ? 'Read' : 'Unread'}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setUserNotifications(userNotifications.map(item => item.id === n.id ? { ...item, read: !item.read } : item)) }}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${!n.read ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Mark as {n.read ? 'Unread' : 'Read'}
                    </button>
                  </div>
                )) : (
                  <div className="p-16 text-center">
                    <p className="text-slate-500 font-bold">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default EmployerDashboard
