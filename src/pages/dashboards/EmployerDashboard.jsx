import { useState, useEffect } from 'react'
import { getCurrentUser, getEmployerProfile, saveEmployerProfile } from '../../data/authStorage'
import Button from '../../components/Button'

function EmployerDashboard() {
  const user = getCurrentUser()
  const storageKey = `employer_location_${user.email.toLowerCase()}`

  // --- TAB & NOTIFICATION STATE ---
  const [activeTab, setActiveTab] = useState('profile')
  const [notification, setNotification] = useState({ show: false, message: '' })

  // --- REQ 91: GLOBAL NOTIFICATIONS STATE ---
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showNotifPanel, setShowNotifPanel] = useState(false) 
  const [userNotifications, setUserNotifications] = useState([
    { id: 1, text: "New application received for Business Analyst role", read: false, time: "2 mins ago" },
    { id: 2, text: "Profile verification is currently pending", read: true, time: "1 hour ago" },
    { id: 3, text: "Reminder: Internship deadline tomorrow", read: false, time: "5 hours ago" }
  ])

  // --- PROFILE STATE (Req 10, 11, 12, 13) ---
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ 
    bio: '', address: '', phone: '', website: '', logo: '', taxCertificate: '', isVerified: false 
  })
  const [mapAddress, setMapAddress] = useState('')
  const [savedLocation, setSavedLocation] = useState('')
  const [mapSrc, setMapSrc] = useState('')

  // --- INTERNSHIP & APPLICANT STATE (Req 74, 77, 78, 85, 87, 88) ---
  const [internships, setInternships] = useState([
    { 
      id: 1, 
      title: 'Business Analyst Intern', 
      status: 'Hiring', 
      deadline: '2026-04-01',
      isArchived: false,
      applicants: [
        { id: 101, name: 'Laila Hassan', email: 'laila@guc.edu.eg', status: 'Nominated' }
      ]
    }
  ])
  const [showInternForm, setShowInternForm] = useState(false)
  const [newIntern, setNewIntern] = useState({ title: '', details: '', deadline: '', status: 'Hiring' })

  // --- INSTRUCTOR STATE (Req 8, 9) ---
  const [instructors] = useState([
    { id: 1, name: "Dr. Slim Abdennadher", email: "slim.abdennadher@guc.edu.eg", bio: "Expert in Logic Programming.", researchInterests: "AI", education: "Ph.D. Munich", courses: ["Bachelor Project", "Theory of Computation"] },
    { id: 2, name: "Dr. Milad Ghantous", email: "milad.ghantous@guc.edu.eg", bio: "Database expert.", researchInterests: "DBMS", education: "Ph.D.", courses: ["Bachelor Project", "Database Systems"] }
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInstructor, setSelectedInstructor] = useState(null)

  useEffect(() => {
    const profile = getEmployerProfile(user.email)
    if (profile) setProfileForm(profile)
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setSavedLocation(stored)
      setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(stored)}&output=embed`)
    }
  }, [user.email, storageKey])

  // --- FEEDBACK HELPER (7 seconds) ---
  const showSuccess = (msg) => {
    setNotification({ show: true, message: msg })
    setTimeout(() => setNotification({ show: false, message: '' }), 7000)
  }

  // --- NOTIFICATION HANDLERS ---
  const toggleAllNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    showSuccess(notificationsEnabled ? "All notifications turned off." : "Notifications enabled.")
  }

  const markAsRead = (id) => {
    setUserNotifications(userNotifications.map(n => n.id === id ? { ...n, read: !n.read } : n))
  }

  const markAllRead = () => {
    setUserNotifications(userNotifications.map(n => ({ ...n, read: true })))
    showSuccess("All notifications marked as read.")
  }

  // --- INTERNSHIP HANDLERS ---
  const toggleHiringStatus = (id) => {
    setInternships(internships.map(i => 
      i.id === id ? { ...i, status: i.status === 'Hiring' ? 'Position Filled' : 'Hiring' } : i
    ))
    showSuccess("Internship status updated.")
  }

  const archiveInternship = (id, deadline) => {
    const today = new Date();
    const expiry = new Date(deadline);
    if (today < expiry) {
      alert("Cannot archive: The application deadline has not passed yet.");
      return;
    }
    setInternships(internships.map(i => i.id === id ? { ...i, isArchived: !i.isArchived } : i))
    showSuccess("Internship archive status updated.")
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    saveEmployerProfile(user.email, profileForm)
    setEditingProfile(false)
    showSuccess("Profile details updated successfully!")
  }

  const handleLocationSave = (e) => {
    e.preventDefault()
    if (!mapAddress.trim()) return
    localStorage.setItem(storageKey, mapAddress.trim())
    setSavedLocation(mapAddress.trim())
    setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(mapAddress.trim())}&output=embed`)
    setMapAddress('')
    showSuccess("Location has been added to your company profile!")
  }

  const handleRemoveLocation = () => {
    localStorage.removeItem(storageKey)
    setSavedLocation('')
    setMapSrc('')
    showSuccess("Location removed from profile.")
  }

  const addInternship = (e) => {
    e.preventDefault()
    setInternships([...internships, { ...newIntern, id: Date.now(), isArchived: false, applicants: [] }])
    setShowInternForm(false)
    showSuccess(`Internship for '${newIntern.title}' posted!`)
  }

  const updateAppStatus = (internId, appId, newStatus) => {
    setInternships(internships.map(i => i.id === internId ? {
      ...i, applicants: i.applicants.map(a => a.id === appId ? { ...a, status: newStatus } : a)
    } : i))
    showSuccess(`Applicant status changed to ${newStatus}.`)
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 mb-20 px-4 font-sans relative">
      
      {/* HEADER WITH NOTIFICATION ICON REDIRECT AND DROPDOWN */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-slate-800">Employer Hub</h1>
        <div className="flex items-center gap-4 relative">
          {/* Notification Bell (Toggles Dropdown) */}
          <button 
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors relative"
          >
            <span className="text-lg">🔔</span>
            {userNotifications.some(n => !n.read) && notificationsEnabled && (
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* Notification Dropdown Panel Overlay */}
          {showNotifPanel && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[110] overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <span className="font-black text-xs uppercase tracking-widest">Notifications</span>
                <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:underline">Mark all read</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {userNotifications.length > 0 ? userNotifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 border-b last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <p className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{n.text}</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">{n.time} • {n.read ? 'Read' : 'Unread'}</p>
                  </div>
                )) : (
                  <p className="p-8 text-center text-xs text-slate-400 italic">No notifications yet.</p>
                )}
              </div>
              <div className="p-3 bg-white border-t flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Alerts {notificationsEnabled ? 'ON' : 'OFF'}</span>
                  <button 
                    onClick={toggleAllNotifications}
                    className={`text-[10px] font-black px-3 py-1 rounded-full ${notificationsEnabled ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}
                  >
                    {notificationsEnabled ? 'Turn Off All' : 'Turn On'}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('notifications');
                    setShowNotifPanel(false);
                  }}
                  className="w-full text-center text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest pt-2 border-t border-slate-100 mt-1"
                >
                  View All in Notifications Tab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {notification.show && (
        <div className="fixed top-8 right-8 z-[120] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400">
            <div className="bg-white/20 p-1 rounded-full text-lg">✓</div>
            <p className="font-bold text-sm tracking-wide">{notification.message}</p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-8 gap-10 overflow-x-auto">
        {['profile', 'internships', 'instructors', 'notifications'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'border-b-4 border-blue-600 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
            {tab === 'notifications' && userNotifications.some(n => !n.read) && notificationsEnabled && (
              <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px]">
                {userNotifications.filter(n => !n.read).length}
              </span>
            )}
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
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-500">{user.email}</span>
                      <span className={`text-[10px] px-2 py-1 rounded-md font-black tracking-tighter ${profileForm.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {profileForm.isVerified ? 'VERIFIED PARTNER' : 'VERIFICATION PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setEditingProfile(!editingProfile)}>{editingProfile ? "Cancel" : "Edit Profile"}</Button>
              </div>

              {editingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Company Biography</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Website" value={profileForm.website} onChange={e => setProfileForm({...profileForm, website: e.target.value})} />
                    <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Phone" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Logo</label>
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => setProfileForm({...profileForm, logo: reader.result});
                        reader.readAsDataURL(file);
                      }} className="text-xs w-full" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tax Cert (PDF)</label>
                      <input type="file" accept=".pdf" className="text-xs w-full" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full py-4 text-lg">Update Profile Information</Button>
                </form>
              ) : (
                <div className="space-y-8">
                  <p className="text-slate-700 leading-relaxed text-lg">{profileForm.bio || "Provide a biography."}</p>
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                    <div><span className="text-xs font-black text-slate-400 uppercase block mb-1">Website</span><a href={profileForm.website} className="text-blue-600 font-bold">{profileForm.website || "Not set"}</a></div>
                    <div><span className="text-xs font-black text-slate-400 uppercase block mb-1">Contact</span><span className="text-slate-900 font-bold">{profileForm.phone || "Not set"}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-black text-slate-900 tracking-tight mb-4">OFFICE LOCATION</h3>
              <form onSubmit={handleLocationSave} className="space-y-3 mb-6">
                <input value={mapAddress} onChange={e => setMapAddress(e.target.value)} placeholder="Enter building/city" className="w-full p-3 border rounded-xl text-sm bg-slate-50 outline-none" />
                <Button className="w-full py-3" type="submit">Update Map</Button>
              </form>
              {mapSrc ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border">
                    <iframe src={mapSrc} width="100%" height="200" title="Map" />
                  </div>
                  <button onClick={handleRemoveLocation} className="text-[10px] font-black text-red-400 uppercase w-full">Remove Map</button>
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
          <div className="flex justify-between items-end">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Internships</h2>
            <Button onClick={() => setShowInternForm(true)} className="px-8">+ POST NEW ROLE</Button>
          </div>

          {showInternForm && (
            <div className="bg-blue-600 p-8 rounded-3xl shadow-2xl text-white space-y-6">
              <h3 className="text-xl font-black italic">Post a New Opportunity</h3>
              <form onSubmit={addInternship} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Position Title" className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 col-span-2 text-white" onChange={e => setNewIntern({...newIntern, title: e.target.value})} />
                <textarea placeholder="Description" className="p-4 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-white/50 col-span-2 min-h-[100px] text-white" onChange={e => setNewIntern({...newIntern, details: e.target.value})} />
                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/20">
                  <span className="text-sm font-bold opacity-70">DEADLINE:</span>
                  <input type="date" className="bg-transparent text-white outline-none w-full" onChange={e => setNewIntern({...newIntern, deadline: e.target.value})} />
                </div>
                <div className="flex gap-4 col-span-2 mt-4">
                  <button type="submit" className="bg-white text-blue-600 font-black hover:bg-slate-100 flex-1 py-4 rounded-xl transition-colors">
                    Publish Internship
                  </button>
                  <button type="button" onClick={() => setShowInternForm(false)} className="text-white/60 font-bold hover:text-white underline px-4">Dismiss</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {internships.map(intern => (
              <div key={intern.id} className={`bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm ${intern.isArchived ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{intern.title} {intern.isArchived && "(Archived)"}</h3>
                    <div className="flex gap-4 mt-2">
                      <span className="text-[10px] font-black text-blue-500 uppercase">Closes: {intern.deadline}</span>
                      <button onClick={() => toggleHiringStatus(intern.id)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase underline">
                        Switch to {intern.status === 'Hiring' ? 'Filled' : 'Hiring'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${intern.status === 'Hiring' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {intern.status}
                    </span>
                    <button onClick={() => archiveInternship(intern.id, intern.deadline)} className="text-[10px] font-bold text-red-500 hover:underline">
                      {intern.isArchived ? 'Unarchive' : 'Archive Position'}
                    </button>
                  </div>
                </div>
                {!intern.isArchived && (
                  <div className="space-y-4">
                    {intern.applicants.map(app => (
                      <div key={app.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border">
                        <div>
                          <p className="text-sm font-black text-slate-800">{app.name}</p>
                          <p className="text-[11px] text-slate-400">{app.email}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] font-black uppercase text-blue-500">{app.status}</span>
                          <select className="text-xs font-bold p-3 border rounded-xl bg-white shadow-sm" value={app.status} onChange={e => updateAppStatus(intern.id, app.id, e.target.value)}>
                            <option value="Nominated">Nominate</option>
                            <option value="Accepted">Accept</option>
                            <option value="Rejected">Reject</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
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
                  <input 
                    type="text" placeholder="Search by name or course..." 
                    className="w-full p-5 pl-5 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white outline-none"
                    onChange={e => setSearchTerm(e.target.value)}
                  />
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
                      <li key={c} className="flex items-center gap-4 text-slate-700 font-black">
                        <span className="h-2 w-2 bg-blue-600 rounded-full"></span> 
                        <span className="text-lg">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- NOTIFICATIONS TAB --- */}
      {activeTab === 'notifications' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Notifications</h2>
            <div className="flex gap-4 items-center">
              <button 
                onClick={markAllRead} 
                className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Mark All as Read
              </button>
              <button 
                onClick={toggleAllNotifications}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${notificationsEnabled ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
              >
                {notificationsEnabled ? 'Turn Off Alerts' : 'Turn On Alerts'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {!notificationsEnabled && (
              <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
                <span className="text-sm font-bold text-slate-500">Alerts are currently paused. You won't receive new notifications.</span>
              </div>
            )}
            
            <div className="divide-y divide-slate-100">
              {userNotifications.length > 0 ? userNotifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${!n.read ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex-1">
                    <p className={`text-base ${!n.read ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>{n.text}</p>
                    <p className="text-xs text-slate-400 mt-2 font-bold tracking-wide uppercase">{n.time} • {n.read ? 'Read' : 'Unread'}</p>
                  </div>
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${!n.read ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Mark as {n.read ? 'Unread' : 'Read'}
                  </button>
                </div>
              )) : (
                <div className="p-16 text-center">
                  <span className="text-4xl block mb-4">📭</span>
                  <p className="text-slate-500 font-bold">You're all caught up!</p>
                  <p className="text-sm text-slate-400 mt-1">No notifications to display.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default EmployerDashboard