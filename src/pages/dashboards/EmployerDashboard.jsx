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

  // --- TAB & GLOBAL NOTIFICATION STATE ---
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

  // --- PROFILE & STATISTICS STATE ---
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ 
    bio: '', address: '', phone: '', website: '', logo: '', taxCertificate: '', taxCertificateName: '', mapLocation: '', isVerified: false 
  })
  const [mapAddress, setMapAddress] = useState('')
  const [mapSrc, setMapSrc] = useState('')

  // --- INSTRUCTOR STATE ---
  const [instructors] = useState([
    { id: 1, name: "Dr. Slim Abdennadher", email: "slim.abdennadher@guc.edu.eg", bio: "Expert in Logic Programming.", researchInterests: "AI", education: "Ph.D. Munich", courses: ["Bachelor Project", "Theory of Computation"] },
    { id: 2, name: "Dr. Milad Ghantous", email: "milad.ghantous@guc.edu.eg", bio: "Database expert.", researchInterests: "DBMS", education: "Ph.D.", courses: ["Bachelor Project", "Database Systems"] }
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInstructor, setSelectedInstructor] = useState(null)

  // --- INTERNSHIP & APPLICANT STATE ---
  const [internSearch, setInternSearch] = useState('')
  const [internships, setInternships] = useState(() => {
    const saved = localStorage.getItem(storageKeys.internships)
    return saved ? JSON.parse(saved) : [{ 
      id: 1, title: 'Business Analyst Intern', details: 'Gather requirements and create documentation.', skills: 'Communication, Agile', duration: '3 Months', programmingLanguages: 'SQL', status: 'Hiring', deadline: '2026-04-01', isArchived: false,
      applicants: [{ id: 101, name: 'Laila Hassan', email: 'laila@guc.edu.eg', status: 'Nominated' }]
    }]
  })
  
  const initialInternState = { title: '', details: '', skills: '', duration: '', programmingLanguages: '', deadline: '', status: 'Hiring' }
  const [showInternForm, setShowInternForm] = useState(false)
  const [isEditingIntern, setIsEditingIntern] = useState(null)
  const [internForm, setInternForm] = useState(initialInternState)
  const [selectedInternship, setSelectedInternship] = useState(null)
  const [applicantSort, setApplicantSort] = useState('default')

  // --- FAVORITES & DISCOVER STATE ---
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(storageKeys.favorites)
    return saved ? JSON.parse(saved) : { projects: [], portfolios: [] }
  })

  // --- MESSAGES STATE ---
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKeys.messages)
    return saved ? JSON.parse(saved) : [
      { id: 1, sender: "Ahmed Ali", role: "Student", text: "Hello, I have a question regarding the BA internship.", date: "2026-05-08" }
    ]
  })

//              addemployer profile



  // --- FEEDBACK & NOTIFICATION HELPER ---
  const showSuccess = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: '' }), 5000)
  }

  const toggleAllNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    showSuccess(notificationsEnabled ? "All notifications turned off." : "Notifications enabled.")
  }

  const markAsRead = (id) => setUserNotifications(userNotifications.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => { setUserNotifications(userNotifications.map(n => ({ ...n, read: true }))); showSuccess("All notifications marked as read.") }
  const markAllUnread = () => { setUserNotifications(userNotifications.map(n => ({ ...n, read: false }))); showSuccess("All notifications marked as unread.") }

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    const text = n.text.toLowerCase();
    
    if (text.includes('message')) {
      setActiveTab('messages');
    } else if (text.includes('application') || text.includes('intern')) {
      setActiveTab('internships');
    }
    
    setShowNotifPanel(false);
  }

  // --- STATISTICS CALCULATIONS ---
  const stats = useMemo(() => {
    const totalInternships = internships.length;
    const totalAcceptedStudents = internships.reduce((sum, intern) => 
      sum + intern.applicants.filter(a => a.status === 'Accepted').length, 0
    );
    return { totalInternships, totalAcceptedStudents }
  }, [internships])

  // --- MESSAGES LOGIC ---
  const simulateIncomingMessage = () => {
    const newMsg = { id: Date.now(), sender: "Dr. Slim Abdennadher", role: "Course Instructor", text: "I highly recommend my student for your open position.", date: new Date().toISOString().split('T')[0] };
    setMessages([newMsg, ...messages]);
    if (notificationsEnabled) {
      setUserNotifications([{ id: Date.now(), text: `New private message from ${newMsg.sender}`, read: false, time: "Just now" }, ...userNotifications]);
      showSuccess("New message received!");
    }
  }

  // --- FAVORITES LOGIC ---
  const toggleFavProject = (id) => {
    setFavorites(prev => {
      const isFav = prev.projects.includes(id);
      return { ...prev, projects: isFav ? prev.projects.filter(pId => pId !== id) : [...prev.projects, id] }
    })
    showSuccess("Favorites updated.")
  }

  const toggleFavPortfolio = (id) => {
    setFavorites(prev => {
      const isFav = prev.portfolios.includes(id);
      return { ...prev, portfolios: isFav ? prev.portfolios.filter(pId => pId !== id) : [...prev.portfolios, id] }
    })
    showSuccess("Favorites updated.")
  }
  const recommendedProjects = useMemo(() => projectsData.slice(0, 3), [])

  // --- INTERNSHIP HANDLERS ---
  const todayDateString = new Date().toISOString().split('T')[0];

  const filteredInternships = useMemo(() => {
    if (!internSearch) return internships;
    const lowerSearch = internSearch.toLowerCase();
    return internships.filter(i => 
      (i.title && i.title.toLowerCase().includes(lowerSearch)) ||
      (i.skills && i.skills.toLowerCase().includes(lowerSearch)) ||
      (i.programmingLanguages && i.programmingLanguages.toLowerCase().includes(lowerSearch)) ||
      (i.duration && i.duration.toLowerCase().includes(lowerSearch)) ||
      (i.deadline && i.deadline.includes(lowerSearch))
    );
  }, [internships, internSearch]);

  const handleSaveInternship = (e) => {
    e.preventDefault()
    if (internForm.deadline < todayDateString) { alert("The application deadline cannot be in the past."); return; }
    if (isEditingIntern) {
      setInternships(internships.map(i => i.id === isEditingIntern ? { ...i, ...internForm } : i))
      showSuccess("Internship updated successfully!")
    } else {
      setInternships([{ ...internForm, id: Date.now(), isArchived: false, applicants: [] }, ...internships])
      showSuccess(`Internship '${internForm.title}' posted!`)
    }
    setShowInternForm(false); setIsEditingIntern(null); setInternForm(initialInternState);
  }

  const toggleHiringStatus = (id) => {
    setInternships(internships.map(i => {
      if (i.id === id) {
        const newStatus = i.status === 'Hiring' ? 'Position Filled' : 'Hiring';
        if (selectedInternship?.id === id) setSelectedInternship({ ...i, status: newStatus });
        return { ...i, status: newStatus };
      }
      return i;
    }))
    showSuccess("Internship status updated.")
  }

  const archiveInternship = (id, deadline) => {
    setInternships(internships.map(i => {
      if (i.id === id) {
        const archivedState = !i.isArchived;
        if (selectedInternship?.id === id) setSelectedInternship({ ...i, isArchived: archivedState });
        return { ...i, isArchived: archivedState };
      }
      return i;
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
        const updatedApplicants = i.applicants.map(a => a.id === appId ? { ...a, status: newStatus } : a);
        const updatedInternship = { ...i, applicants: updatedApplicants };
        if (selectedInternship?.id === internId) setSelectedInternship(updatedInternship);
        return updatedInternship;
      }
      return i;
    }))
    showSuccess(`Applicant status changed to ${newStatus}.`)
  }

  const getSortedApplicants = (internship) => {
    let sorted = [...internship.applicants];
    if (applicantSort === 'topContributors') {
      sorted.sort((a, b) => {
        const studentA = studentsData.find(s => s.email === a.email || s.name === a.name)
        const studentB = studentsData.find(s => s.email === b.email || s.name === b.name)
        const aCount = studentA?.projects?.length || studentA?.projectCount || 0
        const bCount = studentB?.projects?.length || studentB?.projectCount || 0
        return bCount - aCount;
      });
    }
    return sorted;
  }

  const isApplicantSuggested = (applicant) => {
    return favorites.portfolios.some(favId => {
      const student = studentsData.find(s => s.id === favId);
      return student && (student.email === applicant.email || student.name === applicant.name);
    });
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto mt-8 mb-20 px-4 font-sans relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-slate-800">Employer Hub</h1>
        <div className="flex items-center gap-4 relative">
          
          {/* UPDATED HOME BUTTON TO USE programatic navigate() to ensure it fires properly */}
          <Link 
  to="/" 
  className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors relative flex items-center justify-center h-10 w-10" 
  title="Go to Home"
>
  <span className="text-lg">🏠</span>
</Link>
          
           <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors relative flex items-center justify-center h-10 w-10">
            <span className="text-lg">🔔</span>
            {userNotifications.some(n => !n.read) && notificationsEnabled && (
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* Notif Panel Dropdown */}
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
                    className={`p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex-1 pointer-events-none">
                      <p className={`text-base ${!n.read ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>{n.text}</p>
                      <p className="text-xs text-slate-400 mt-2 font-bold tracking-wide uppercase">{n.time} • {n.read ? 'Read' : 'Unread'}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} 
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${!n.read ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Mark as {n.read ? 'Unread' : 'Read'}
                    </button>
                  </div>
                )) : <div className="p-16 text-center"><span className="text-4xl block mb-4">📭</span><p className="text-slate-500 font-bold">You're all caught up!</p></div>}
              </div>
              <div className="p-3 bg-white border-t flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Alerts {notificationsEnabled ? 'ON' : 'OFF'}</span>
                  <button onClick={toggleAllNotifications} className={`text-[10px] font-black px-3 py-1 rounded-full ${notificationsEnabled ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {notificationsEnabled ? 'Turn Off All' : 'Turn On'}
                  </button>
                </div>
                <button onClick={() => { setActiveTab('notifications'); setShowNotifPanel(false); }} className="w-full text-center text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest pt-2 border-t border-slate-100 mt-1">
                  View All in Notifications Tab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {notification.show && (
        <div className="fixed top-8 right-8 z-[120] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400">
            <div className="bg-white/20 p-1 rounded-full text-lg">✓</div>
            <p className="font-bold text-sm tracking-wide">{notification.message}</p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-8 gap-8 overflow-x-auto">
        {['profile', 'internships', 'instructors', 'favorites & discover', 'messages', 'notifications'].map(tab => (
          <button 
            key={tab} 
            onClick={() => { setActiveTab(tab); setSelectedInternship(null); setSelectedInstructor(null); }}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'border-b-4 border-blue-600 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- PROFILE TAB --- */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-6 items-center">
                  <div className="h-24 w-24 bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden flex items-center justify-center">
                    {profileForm.logo ? <img src={profileForm.logo} alt="Logo" className="object-contain p-2" /> : <span className="text-[10px] text-slate-300 font-bold">LOGO</span>}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">{user.companyName}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-sm text-slate-500">{user.email}</span>
                      
                      {/* Address appended with chosen map location */}
                      {(profileForm.address || profileForm.mapLocation) && (
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                          📍 {profileForm.address || 'Address not set'} {profileForm.mapLocation ? `| Map: ${profileForm.mapLocation}` : ''}
                        </span>
                      )}

                      <span className={`text-[10px] px-2 py-1 rounded-md font-black tracking-tighter ${profileForm.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {profileForm.isVerified ? 'VERIFIED PARTNER' : 'VERIFICATION PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setEditingProfile(!editingProfile)}>{editingProfile ? "Cancel" : "Edit Profile"}</Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Internships Offered</p>
                  <p className="text-3xl font-black text-blue-600">{stats.totalInternships}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students Accepted</p>
                  <p className="text-3xl font-black text-blue-600">{stats.totalAcceptedStudents}</p>
                </div>
              </div>

              {editingProfile ? (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (profileForm.phone && profileForm.phone.length !== 11) { alert("Phone number must be exactly 11 digits."); return; }
                  saveEmployerProfile(user.email, profileForm)
                  setEditingProfile(false)
                  showSuccess("Profile details updated successfully!")
                }} className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Company Biography</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} />
                  </div>
                  <div>
                    <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Company Address" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input required className="p-3 bg-slate-50 border rounded-xl" placeholder="Website" value={profileForm.website} onChange={e => setProfileForm({...profileForm, website: e.target.value})} />
                    <input type="tel" required pattern="\d{11}" className="p-3 bg-slate-50 border rounded-xl" placeholder="Phone (11 digits)" value={profileForm.phone} maxLength={11} minLength={11} onChange={e => setProfileForm({...profileForm, phone: e.target.value.replace(/\D/g, '')})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <label className="cursor-pointer flex flex-col items-center justify-center bg-blue-50 text-blue-700 border border-blue-200 rounded-xl p-6 hover:bg-blue-100 transition-colors shadow-sm">
                      <span className="text-2xl mb-2">🖼️</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-center">Upload Logo</span>
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files[0]; if (!file) return;
                        const reader = new FileReader(); reader.onloadend = () => setProfileForm({...profileForm, logo: reader.result}); reader.readAsDataURL(file);
                      }} className="hidden" />
                    </label>
                    <label className="cursor-pointer flex flex-col items-center justify-center bg-blue-50 text-blue-700 border border-blue-200 rounded-xl p-6 hover:bg-blue-100 transition-colors shadow-sm">
                      <span className="text-2xl mb-2">📄</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-center">Upload Tax Cert</span>
                      <input type="file" accept=".pdf" onChange={e => {
                        const file = e.target.files[0]; if (!file) return;
                        const reader = new FileReader(); reader.onloadend = () => setProfileForm({...profileForm, taxCertificate: reader.result, taxCertificateName: file.name}); reader.readAsDataURL(file);
                      }} className="hidden" />
                    </label>
                  </div>
                  <Button type="submit" className="w-full py-4 text-lg mt-4">Update Profile Information</Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <p className="text-slate-700 leading-relaxed text-lg">{profileForm.bio || "Provide a biography."}</p>
                  {profileForm.taxCertificate && (
                    <div className="mt-4">
                      <a href={profileForm.taxCertificate} download={profileForm.taxCertificateName || "Tax_Certificate.pdf"} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-colors">
                        📄 Download Tax Certificate
                      </a>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                    <div><span className="text-xs font-black text-slate-400 uppercase block mb-1">Website</span><a href={profileForm.website} className="text-blue-600 font-bold">{profileForm.website || "Not set"}</a></div>
                    <div><span className="text-xs font-black text-slate-400 uppercase block mb-1">Contact</span><span className="text-slate-900 font-bold">{profileForm.phone || "Not set"}</span></div>
                    {/* View Details Address with Map Location appended */}
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase block mb-1">Address</span>
                      <span className="text-slate-900 font-bold">
                        {profileForm.address || "Not set"}
                        {profileForm.mapLocation && <span className="text-blue-600 block text-xs mt-1">(Map: {profileForm.mapLocation})</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-black text-slate-900 tracking-tight mb-4">PUBLIC LOCATION</h3>
              <p className="text-xs text-slate-400 mb-4">This location is saved directly to your public profile.</p>
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                const updatedForm = {...profileForm, mapLocation: mapAddress.trim()};
                setProfileForm(updatedForm);
                saveEmployerProfile(user.email, updatedForm);
                setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(mapAddress.trim())}&output=embed`); 
                setMapAddress(''); 
                showSuccess("Location saved to public profile!"); 
              }} className="space-y-3 mb-6">
                <input value={mapAddress} onChange={e => setMapAddress(e.target.value)} placeholder="Enter building/city" className="w-full p-3 border rounded-xl text-sm bg-slate-50 outline-none" />
                <Button className="w-full py-3" type="submit">Update Map</Button>
              </form>
              {mapSrc ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border">
                    <iframe src={mapSrc} width="100%" height="200" title="Map" />
                  </div>
                  <button onClick={() => { 
                    const updatedForm = {...profileForm, mapLocation: ''};
                    setProfileForm(updatedForm);
                    saveEmployerProfile(user.email, updatedForm);
                    setMapSrc(''); 
                    showSuccess("Location removed from profile."); 
                  }} className="text-[10px] font-black text-red-400 uppercase w-full">Remove Map</button>
                </div>
              ) : (
                <div className="h-[200px] bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 px-6 text-center">Add your location.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- INTERNSHIPS TAB --- */}
      {activeTab === 'internships' && (
        <div className="space-y-8">
          {!selectedInternship && (
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Internships</h2>
              {!showInternForm && (
                <Button onClick={() => { setInternForm(initialInternState); setIsEditingIntern(null); setShowInternForm(true); }} className="px-8">+ POST NEW ROLE</Button>
              )}
            </div>
          )}

          {/* Internship Search Bar */}
          {!showInternForm && !selectedInternship && (
            <input 
              type="text" 
              placeholder="Search internships by title, skills, language, duration, or deadline..." 
              value={internSearch}
              onChange={(e) => setInternSearch(e.target.value)}
              className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white shadow-sm focus:border-blue-400 outline-none transition-colors"
            />
          )}

          {showInternForm && !selectedInternship && (
            <div className="bg-blue-600 p-8 rounded-3xl shadow-2xl text-white space-y-6">
              <h3 className="text-xl font-black italic">{isEditingIntern ? "Edit Internship details" : "Post a New Opportunity"}</h3>
              <form onSubmit={handleSaveInternship} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Position Title" value={internForm.title} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 col-span-2 text-white" onChange={e => setInternForm({...internForm, title: e.target.value})} />
                <textarea required placeholder="Responsibilities & Details" value={internForm.details} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 col-span-2 min-h-[100px] text-white" onChange={e => setInternForm({...internForm, details: e.target.value})} />
                <input required placeholder="Required Skills (e.g. Communication, Agile)" value={internForm.skills} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({...internForm, skills: e.target.value})} />
                <input required placeholder="Programming Languages (e.g. Python, Java)" value={internForm.programmingLanguages} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({...internForm, programmingLanguages: e.target.value})} />
                <input required placeholder="Duration (e.g. 3 Months, 6 Weeks)" value={internForm.duration} className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 text-white" onChange={e => setInternForm({...internForm, duration: e.target.value})} />
                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/20">
                  <span className="text-sm font-bold opacity-70">DEADLINE:</span>
                  <input type="date" required min={todayDateString} value={internForm.deadline} className="bg-transparent text-white outline-none w-full" onChange={e => setInternForm({...internForm, deadline: e.target.value})} />
                </div>
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
                     <button onClick={() => archiveInternship(selectedInternship.id, selectedInternship.deadline)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">{selectedInternship.isArchived ? 'Unarchive' : 'Archive'}</button>
                     <button onClick={() => { setInternForm(selectedInternship); setIsEditingIntern(selectedInternship.id); setShowInternForm(true); setSelectedInternship(null); }} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Edit</button>
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

                 {/* Applicants Panel */}
                 <div className="bg-slate-50 p-8 rounded-[30px] border flex flex-col h-full">
                   <div className="flex justify-between items-center mb-6">
                     <label className="text-[10px] font-black text-slate-900 block uppercase tracking-widest">Applicants ({selectedInternship.applicants.length})</label>
                     <select value={applicantSort} onChange={(e) => setApplicantSort(e.target.value)} className="text-[10px] font-bold p-1 bg-white border rounded">
                       <option value="default">Default Sort</option>
                       <option value="topContributors">Top Contributors</option>
                     </select>
                   </div>
                   
                   <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px]">
                     {selectedInternship.applicants.length > 0 ? getSortedApplicants(selectedInternship).map(app => {
                       const isSuggested = isApplicantSuggested(app);
                       return (
                         <div key={app.id} className={`p-4 rounded-xl shadow-sm border ${isSuggested ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                           <div className="flex justify-between items-start">
                             <div>
                               <p className="text-sm font-black text-slate-800">{app.name}</p>
                               <p className="text-[11px] text-slate-400 mb-3">{app.email}</p>
                             </div>
                             {isSuggested && <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">★ Suggested</span>}
                           </div>
                           <div className="flex items-center justify-between">
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
                        <button onClick={() => { setInternForm(intern); setIsEditingIntern(intern.id); setShowInternForm(true); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors">Edit</button>
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

      {/* --- INSTRUCTORS TAB --- */}
      {activeTab === 'instructors' && (
        <div className="space-y-8">
          {!selectedInstructor ? (
            <div className="space-y-8">
              <div className="bg-white p-10 rounded-3xl border border-slate-200">
                <h2 className="text-3xl font-black mb-2 text-slate-900 tracking-tighter">Faculty Search</h2>
                <div className="relative">
                  <input type="text" placeholder="Search by name or course..." className="w-full p-5 pl-5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white outline-none" onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instructors.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.courses.join().toLowerCase().includes(searchTerm.toLowerCase())).map(inst => (
                  <div key={inst.id} onClick={() => setSelectedInstructor(inst)} className="bg-white border-2 border-slate-100 p-6 rounded-3xl cursor-pointer hover:border-blue-400 group">
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

      {/* --- FAVORITES & DISCOVER TAB --- */}
      {activeTab === 'favorites & discover' && (
        <div className="space-y-12">
          {/* Favorites Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">My Favorites</h2>
            
            {/* Favorite Portfolios (CLICKABLE!) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4">Favorite Portfolios</h3>
              {favorites.portfolios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.portfolios.map(id => {
                    const s = studentsData.find(x => x.id === id);
                    if (!s) return null;
                    return (
                      <Link to={`/portfolio/${s.id}`} key={s.id} className="p-4 border rounded-xl bg-slate-50 flex justify-between items-center hover:border-blue-300 transition-colors group">
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-700">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.major}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); toggleFavPortfolio(s.id); }} 
                          className="text-red-500 text-xl hover:scale-125 transition-transform"
                        >
                          ❤️
                        </button>
                      </Link>
                    )
                  })}
                </div>
              ) : <p className="text-sm text-slate-400 italic">No favorite portfolios yet.</p>}
            </div>

            {/* Favorite Projects (CLICKABLE!) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4">Favorite Projects</h3>
              {favorites.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.projects.map(id => {
                    const p = projectsData.find(x => x.id === id);
                    if (!p) return null;
                    return (
                      <Link to={`/project/${p.id}`} key={p.id} className="p-4 border rounded-xl bg-slate-50 flex flex-col justify-between hover:border-blue-300 transition-colors group">
                        <div>
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700">{p.title}</p>
                            <button 
                              onClick={(e) => { e.preventDefault(); toggleFavProject(p.id); }} 
                              className="text-red-500 text-xl hover:scale-125 transition-transform"
                            >
                              ❤️
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{p.domain}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : <p className="text-sm text-slate-400 italic">No favorite projects yet.</p>}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Recommended Section (CLICKABLE!) */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Recommended Projects</h2>
            <p className="text-sm text-slate-600 mb-6">Dynamically suggested for your company based on industry trends.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedProjects.map(project => (
                <Link to={`/project/${project.id}`} key={project.id} className="p-6 border rounded-2xl bg-white shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors group">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-700">{project.title}</h3>
                      <button 
                        onClick={(e) => { e.preventDefault(); toggleFavProject(project.id); }} 
                        className="text-2xl hover:scale-125 transition-transform opacity-70 hover:opacity-100"
                      >
                        {favorites.projects.includes(project.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">{project.domain}</p>
                    <p className="text-sm text-slate-600 line-clamp-2">{project.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MESSAGES TAB --- */}
      {activeTab === 'messages' && (
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Messages</h2>
            <Button onClick={simulateIncomingMessage} variant="secondary" className="text-xs px-4">
              + Simulate New Message
            </Button>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {messages.length > 0 ? messages.map(msg => (
                <div key={msg.id} className="p-6 sm:p-8 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{msg.sender}</h3>
                      <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{msg.role}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{msg.date}</span>
                  </div>
                  <p className="text-slate-700 mt-3 text-sm leading-relaxed">{msg.text}</p>
                </div>
              )) : <div className="p-16 text-center text-slate-400 font-bold">No messages found.</div>}
            </div>
          </div>
        </div>
      )}

      {/* --- NOTIFICATIONS TAB --- */}
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
                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} 
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
    </div>
  )
}

export default EmployerDashboard