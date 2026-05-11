import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../../data/authStorage'
import { seedAcademicPlatformDemoData } from '../../data/academicPlatformSeed'

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
}
function useLS(key, initial) {
  const [val, setVal] = useState(() => LS.get(key, initial))
  const save = (v) => { const next = typeof v === 'function' ? v(val) : v; LS.set(key, next); setVal(next) }
  return [val, save]
}

// ─── constants ────────────────────────────────────────────────────────────────
const ALL_COURSES = [
  'CSEN 401', 'CSEN 402', 'CSEN 501', 'CSEN 502',
  'DMET 502', 'DMET 305', 'CSEN 603', 'CSEN 701',
  'Bachelor Project',
]

// ─── inline SVG icons ─────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)
const IC = {
  home:      'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  user:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  book:      'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z',
  folder:    'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  bell:      'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  chat:      'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  flag:      'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  chart:     'M18 20V10M12 20V4M6 20v-6',
  logout:    'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  plus:      'M12 5v14M5 12h14',
  edit:      'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:     'M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 6V4h4v2',
  x:         'M18 6L6 18M6 6l12 12',
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z',
  check:     'M20 6L9 17l-5-5',
  link:      'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  unlink:    'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71M1 1l22 22',
  upload:    'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  send:      'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  menu:      'M3 12h18M3 6h18M3 18h18',
  eye:       'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6',
  fileText:  'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  heart:     'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  users:     'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
}

// ─── reusable UI primitives ───────────────────────────────────────────────────
const Badge = ({ children, color = 'blue' }) => {
  const map = {
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    slate:  'bg-slate-100 text-slate-600',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color] ?? map.slate}`}>
      {children}
    </span>
  )
}

const Btn = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }
  const variants = {
    primary:   'bg-blue-700 text-white hover:bg-blue-800',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    ghost:     'text-slate-600 hover:bg-slate-100',
    success:   'bg-green-600 text-white hover:bg-green-700',
    warning:   'bg-yellow-500 text-white hover:bg-yellow-600',
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

const Input = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input className={`rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

const Textarea = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <textarea className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} {...props} />
  </div>
)

const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
)

const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]`}>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <Icon d={IC.x} />
        </button>
      </div>
      <div className="overflow-y-auto px-6 py-4">{children}</div>
    </div>
  </div>
)

const EmptyState = ({ message }) => (
  <p className="py-10 text-center text-sm text-slate-400">{message}</p>
)

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => onChange && onChange(n)}
        className={`text-xl transition ${n <= value ? 'text-yellow-400' : 'text-slate-200 hover:text-yellow-300'}`}>
        ★
      </button>
    ))}
  </div>
)

// ─── seed projects from localStorage (shared with student) ────────────────────
const getSharedProjects = () => LS.get('student_projects', [])
const setSharedProjects = (v) => LS.set('student_projects', typeof v === 'function' ? v(getSharedProjects()) : v)

const unreadNotificationCount = (notifications) =>
  notifications.filter((n) => n.read === false).length

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function Overview({ user, profile, linkedCourses, notifications, projects, setTab }) {
  const assignedProjects = projects.filter(p =>
    (p.collaborators || []).some(c => c.email === user.email && c.status === 'accepted')
  )
  const unread   = unreadNotificationCount(notifications)
  const invites  = projects.filter(p =>
    (p.collaborators || []).some(c => c.email === user.email && c.status === 'pending')
  ).length

  const stats = [
    { label: 'Linked Courses',    value: linkedCourses.length, color: 'text-blue-700',   bg: 'bg-blue-50',   tab: 'courses' },
    { label: 'Assigned Projects', value: assignedProjects.length, color: 'text-purple-700', bg: 'bg-purple-50', tab: 'projects' },
    { label: 'Unread Alerts',     value: unread,               color: 'text-yellow-700', bg: 'bg-yellow-50', tab: 'notifications' },
    { label: 'Pending Invites',   value: invites,              color: 'text-green-700',  bg: 'bg-green-50',  tab: 'invitations' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile.firstName || user.firstName || 'Instructor'} 👋
        </h2>
        <p className="mt-1 text-slate-500">Here's your instructor activity summary.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(s => (
          <button key={s.label} onClick={() => setTab(s.tab)}
            className={`rounded-xl border-0 p-5 text-left shadow-sm transition hover:opacity-80 ${s.bg}`}>
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* linked courses */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">My Courses</h3>
            <button onClick={() => setTab('courses')} className="text-xs text-blue-600 hover:underline">Manage</button>
          </div>
          {linkedCourses.length === 0
            ? <EmptyState message="No courses linked yet." />
            : <div className="flex flex-wrap gap-2">
                {linkedCourses.map(c => <Badge key={c} color="blue">{c}</Badge>)}
              </div>
          }
        </Card>

        {/* recent notifications */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Notifications</h3>
            <button onClick={() => setTab('notifications')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          {notifications.length === 0
            ? <EmptyState message="No notifications yet." />
            : <ul className="space-y-2.5">
                {notifications.slice().reverse().slice(0, 5).map(n => (
                  <li key={n.id} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-300' : 'bg-blue-600'}`} />
                    <div>
                      <p className={n.read ? 'text-slate-400' : 'text-slate-700'}>{n.message}</p>
                      <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
          }
        </Card>
      </div>

      {/* recently assigned projects */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Assigned Projects</h3>
          <button onClick={() => setTab('projects')} className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        {assignedProjects.length === 0
          ? <EmptyState message="No projects assigned to you yet." />
          : <div className="space-y-2">
              {assignedProjects.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                  <div>
                    <p className="font-medium text-slate-800">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color="blue">{p.course}</Badge>
                      {p.rating > 0 && <Badge color="yellow">★ {p.rating}/5</Badge>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
        }
      </Card>
    </div>
  )
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileSection({ user, profile, setProfile }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(profile)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = () => { setProfile(form); setEditing(false) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
        {!editing && (
          <Btn onClick={() => { setForm(profile); setEditing(true) }}>
            <Icon d={IC.edit} />Edit Profile
          </Btn>
        )}
      </div>

      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* avatar */}
<div className="flex flex-col items-center gap-2 shrink-0">
            {profile.photo
              ? <img src={profile.photo} alt="avatar" className="h-24 w-24 rounded-full object-cover border-2 border-blue-200"/>
              : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                  {(profile.firstName?.[0] || user.firstName?.[0] || 'I').toUpperCase()}
                </div>
            }
            <label className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <Icon d={IC.upload} size={12} /> {profile.photo ? 'Change Photo' : 'Upload Photo'}
              <input type="file" className="hidden" accept="image/*" onChange={e => {
                const file=e.target.files?.[0]
                if(!file)return
                const reader=new FileReader()
                reader.onload=ev=>{
                  setProfile(prev=>({...prev,photo:ev.target.result}))
                  setForm(prev=>({...prev,photo:ev.target.result}))
                }
                reader.readAsDataURL(file)
              }}/>
            </label>
          </div>

          {/* fields */}
          <div className="flex-1 space-y-4">
            {editing ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="First Name" value={form.firstName || ''} onChange={f('firstName')} />
                  <Input label="Last Name"  value={form.lastName  || ''} onChange={f('lastName')} />
                </div>
                <Input label="GUC Email (read-only)" value={user.email || ''} disabled />
                <Textarea label="Short Biography" value={form.bio || ''} onChange={f('bio')}
                  placeholder="Tell students and employers a little about yourself…" rows={3} />
                <Textarea label="Research Interests" value={form.research || ''} onChange={f('research')}
                  placeholder="e.g. Machine Learning, Computer Vision, Distributed Systems…" rows={2} />
                <Textarea label="Education Background" value={form.education || ''} onChange={f('education')}
                  placeholder="e.g. PhD Computer Science, MIT 2015…" rows={2} />
                <div className="flex gap-2 pt-1">
                  <Btn onClick={save}><Icon d={IC.check} />Save Changes</Btn>
                  <Btn variant="secondary" onClick={() => setEditing(false)}>Cancel</Btn>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    {profile.firstName || user.firstName} {profile.lastName || user.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <Badge color="blue" >Course Instructor</Badge>
                </div>
                {profile.bio && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Biography</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.bio}</p>
                  </div>
                )}
                {profile.research && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Research Interests</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.research}</p>
                  </div>
                )}
                {profile.education && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Education</p>
                    <p className="mt-1 text-sm text-slate-700">{profile.education}</p>
                  </div>
                )}
                {!profile.bio && !profile.research && !profile.education && (
                  <p className="text-sm text-slate-400">No profile details added yet. Click Edit Profile to get started.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── COURSES ──────────────────────────────────────────────────────────────────
function CoursesSection({ user, linkedCourses, setLinkedCourses, pushNotif }) {
  const [search, setSearch] = useState('')

  // Bachelor Project is always linked
  const ensureBachelor = (list) =>
    list.includes('Bachelor Project') ? list : [...list, 'Bachelor Project']

  const toggle = (course) => {
    if (course === 'Bachelor Project') return // cannot unlink
    const current = linkedCourses
    if (current.includes(course)) {
      // unlink request
      const updated = ensureBachelor(current.filter(c => c !== course))
      setLinkedCourses(updated)
      pushNotif(`Unlink request sent for "${course}". Awaiting admin approval.`)
    } else {
      // link request
      const updated = ensureBachelor([...current, course])
      setLinkedCourses(updated)
      pushNotif(`Link request sent for "${course}". Awaiting admin approval.`)
    }
  }

  const filtered = ALL_COURSES.filter(c => c.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Courses</h2>
        <p className="mt-1 text-sm text-slate-500">
          You are automatically linked to <strong>Bachelor Project</strong>. Link/unlink requests for other courses require admin approval.
        </p>
      </div>

      {/* current courses */}
      <Card>
        <h3 className="mb-3 font-semibold text-slate-800">Currently Linked</h3>
        {linkedCourses.length === 0
          ? <EmptyState message="No courses linked." />
          : <div className="flex flex-wrap gap-2">
              {linkedCourses.map(c => (
                <div key={c} className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
                  <span className="text-sm font-medium text-blue-700">{c}</span>
                  {c !== 'Bachelor Project' && (
                    <button onClick={() => toggle(c)}
                      className="text-blue-400 hover:text-red-500 transition ml-1">
                      <Icon d={IC.x} size={12} />
                    </button>
                  )}
                  {c === 'Bachelor Project' && (
                    <span className="text-xs text-blue-400 ml-1">(always)</span>
                  )}
                </div>
              ))}
            </div>
        }
      </Card>

      {/* available courses to link */}
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-800">Available Courses</h3>
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={IC.search} size={13} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…"
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map(c => {
            const linked = linkedCourses.includes(c)
            const always = c === 'Bachelor Project'
            return (
              <div key={c} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Icon d={IC.book} size={14} />
                  <span className="text-sm font-medium text-slate-800">{c}</span>
                </div>
                <div className="flex items-center gap-2">
                  {linked && <Badge color="green">Linked</Badge>}
                  {always
                    ? <Badge color="slate">Auto-linked</Badge>
                    : <Btn size="sm" variant={linked ? 'danger' : 'secondary'} onClick={() => toggle(c)}>
                        <Icon d={linked ? IC.unlink : IC.link} size={12} />
                        {linked ? 'Unlink' : 'Link'}
                      </Btn>
                  }
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ─── PROJECTS (assigned) ──────────────────────────────────────────────────────
function ProjectsSection({ user, projects, setProjects, pushNotif }) {
  const [search, setSearch]     = useState('')
  const [filterCourse, setFilter] = useState('')
  const [sortBy, setSort]       = useState('date')
  const [selected, setSelected] = useState(null)
  const [modal, setModal]       = useState(null)

  const assignedProjects = projects.filter(p =>
    (p.collaborators || []).some(c => c.email === user.email && c.status === 'accepted')
  )

  const displayed = assignedProjects
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !filterCourse || p.course === filterCourse)
    .sort((a, b) => sortBy === 'date'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : (b.rating || 0) - (a.rating || 0))

  const courses = [...new Set(assignedProjects.map(p => p.course))]

  const openProject = (p) => { setSelected(p); setModal('view') }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Assigned Projects</h2>
        <p className="mt-1 text-sm text-slate-500">Projects where you are an invited instructor.</p>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={IC.search} size={14} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <select value={filterCourse} onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Courses</option>
          {courses.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSort(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="date">Sort by Date</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {displayed.length === 0
        ? <Card><EmptyState message="No assigned projects yet. Accept a project invitation to get started." /></Card>
        : <div className="space-y-3">
            {displayed.map(p => (
              <Card key={p.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{p.title}</h3>
                      <Badge color="blue">{p.course}</Badge>
                      {p.rating > 0 && <Badge color="yellow">★ {p.rating}/5</Badge>}
                      {p.flagged && <Badge color="red">⚑ Flagged</Badge>}
                    </div>
                    {p.description && <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-1">
                      {(p.languages || []).map(l => <Badge key={l} color="slate">{l}</Badge>)}
                    </div>
                    <p className="text-xs text-slate-400">
                      Owner: {p.owner} · Created {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Btn size="sm" onClick={() => openProject(p)}>
                      <Icon d={IC.eye} size={13} />View & Feedback
                    </Btn>
                    <Btn size="sm" variant="warning" onClick={() => { setSelected(p); setModal('flag') }}>
                      <Icon d={IC.flag} size={13} />Flag
                    </Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
      }

      {/* View & Feedback modal */}
      {modal === 'view' && selected && (
        <ProjectFeedbackModal
          project={projects.find(p => p.id === selected.id) || selected}
          user={user}
          setProjects={setProjects}
          pushNotif={pushNotif}
          onClose={() => setModal(null)} />
      )}

      {/* Flag modal */}
      {modal === 'flag' && selected && (
        <FlagModal
          project={projects.find(p => p.id === selected.id) || selected}
          setProjects={setProjects}
          pushNotif={pushNotif}
          onClose={() => setModal(null)} />
      )}
    </div>
  )
}

// ─── Project Feedback modal ────────────────────────────────────────────────────
function ProjectFeedbackModal({ project, user, setProjects, pushNotif, onClose }) {
  const [rating, setRating]           = useState(project.rating || 0)
  const [projectComment, setProjectComment] = useState('')
  const [editingComment, setEditingComment] = useState(null)
  const [taskComments, setTaskComments] = useState(
    Object.fromEntries((project.tasks || []).map(t => [t.id, t.instructorComment || '']))
  )

  const saveProjectComment = () => {
    if (!projectComment.trim()) return
    const comment = {
      id: Date.now().toString(),
      text: projectComment.trim(),
      author: user.email,
      at: new Date().toISOString(),
    }
    setProjects(p => p.map(x => x.id === project.id
      ? { ...x, instructorComments: [...(x.instructorComments || []), comment] } : x))
    pushNotif(`Instructor ${user.email} left feedback on "${project.title}".`)
    setProjectComment('')
  }

  const deleteProjectComment = (commentId) => {
    setProjects(p => p.map(x => x.id === project.id
      ? { ...x, instructorComments: (x.instructorComments || []).filter(c => c.id !== commentId) } : x))
  }

  const saveRating = () => {
    setProjects(p => p.map(x => x.id === project.id ? { ...x, rating } : x))
    pushNotif(`Instructor rated "${project.title}" ${rating}/5.`)
  }

  const saveTaskComment = (taskId) => {
    const text = taskComments[taskId] || ''
    setProjects(p => p.map(x => x.id === project.id
      ? { ...x, tasks: (x.tasks || []).map(t => t.id === taskId ? { ...t, instructorComment: text } : t) } : x))
    pushNotif(`Instructor left feedback on a task in "${project.title}".`)
  }

  const deleteTaskComment = (taskId) => {
    setTaskComments(p => ({ ...p, [taskId]: '' }))
    setProjects(p => p.map(x => x.id === project.id
      ? { ...x, tasks: (x.tasks || []).map(t => t.id === taskId ? { ...t, instructorComment: '' } : t) } : x))
  }

  const projectComments = project.instructorComments || []
  const thesisDrafts    = (project.thesisDrafts || []).filter(d => d.isFinal || project.course !== 'Bachelor Project')

  return (
    <Modal title={`Project: ${project.title}`} onClose={onClose} wide>
      <div className="space-y-6">
        {/* project info */}
        <div className="rounded-lg bg-slate-50 p-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge color="blue">{project.course}</Badge>
            <Badge color={project.visibility === 'public' ? 'green' : 'slate'}>{project.visibility}</Badge>
          </div>
          {project.description && <p className="text-sm text-slate-700">{project.description}</p>}
          {project.github    && <a href={project.github}    target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Icon d={IC.link} size={12} />GitHub</a>}
          {project.demoVideo && <a href={project.demoVideo} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Icon d={IC.eye} size={12} />Demo Video</a>}
          <div className="flex flex-wrap gap-1">
            {(project.languages || []).map(l => <Badge key={l} color="slate">{l}</Badge>)}
          </div>
        </div>

        {/* rating */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Rate this Project</p>
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} />
            <span className="text-sm text-slate-500">{rating > 0 ? `${rating}/5` : 'Not rated'}</span>
            <Btn size="sm" onClick={saveRating} disabled={rating === 0}>
              <Icon d={IC.check} size={12} />Save Rating
            </Btn>
          </div>
        </div>

        {/* project-level comments */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Project Feedback / Comments</p>
          <div className="space-y-2 mb-3">
            {projectComments.length === 0
              ? <p className="text-xs text-slate-400">No comments yet.</p>
              : projectComments.map(c => (
                  <div key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm text-slate-800">"{c.text}"</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.author} · {new Date(c.at).toLocaleDateString()}</p>
                    </div>
                    {c.author === user.email && (
                      <button onClick={() => deleteProjectComment(c.id)}
                        className="shrink-0 text-slate-300 hover:text-red-500 transition">
                        <Icon d={IC.trash} size={13} />
                      </button>
                    )}
                  </div>
                ))
            }
          </div>
          <div className="flex gap-2">
            <textarea value={projectComment} onChange={e => setProjectComment(e.target.value)}
              placeholder="Leave a comment or feedback on this project…"
              rows={2}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <Btn onClick={saveProjectComment} disabled={!projectComment.trim()}>
              <Icon d={IC.send} size={13} />Post
            </Btn>
          </div>
        </div>

        {/* thesis drafts feedback (Bachelor Project) */}
        {project.course === 'Bachelor Project' && thesisDrafts.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Thesis Drafts</p>
            <div className="space-y-2">
              {(project.thesisDrafts || []).filter(d => d.isFinal).map(d => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                  <Icon d={IC.fileText} size={14} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{d.name}</p>
                    <Badge color="blue">Final Draft</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* task-level comments */}
        {(project.tasks || []).length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Task Feedback</p>
            <div className="space-y-3">
              {project.tasks.map(t => (
                <div key={t.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800 text-sm">{t.title}</p>
                    <Badge color={t.status === 'completed' ? 'green' : t.status === 'postponed' ? 'slate' : 'yellow'}>
                      {t.status}
                    </Badge>
                  </div>
                  {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                  <div className="flex gap-2">
                    <input
                      value={taskComments[t.id] || ''}
                      onChange={e => setTaskComments(p => ({ ...p, [t.id]: e.target.value }))}
                      placeholder="Add comment on this task…"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
                    <Btn size="sm" onClick={() => saveTaskComment(t.id)}>
                      <Icon d={IC.check} size={11} />Save
                    </Btn>
                    {t.instructorComment && (
                      <Btn size="sm" variant="danger" onClick={() => deleteTaskComment(t.id)}>
                        <Icon d={IC.trash} size={11} />
                      </Btn>
                    )}
                  </div>
                  {t.instructorComment && (
                    <p className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">
                      💬 Current: "{t.instructorComment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Flag modal ────────────────────────────────────────────────────────────────
function FlagModal({ project, setProjects, pushNotif, onClose }) {
  const [reason, setReason] = useState(project.flagReason || '')

  const submit = () => {
    if (!reason.trim()) return alert('Please provide a reason for flagging.')
    setProjects(p => p.map(x => x.id === project.id
      ? { ...x, flagged: true, flagReason: reason.trim() } : x))
    // push notif to student (shared localStorage)
    const key = 'student_notifs_' + project.owner
    const existing = LS.get(key, [])
    LS.set(key, [...existing, {
      id: Date.now().toString(), read: false,
      message: `⚑ Your project "${project.title}" has been flagged. Reason: ${reason.trim()}`,
      createdAt: new Date().toISOString(),
    }])
    pushNotif(`Project "${project.title}" has been flagged.`)
    onClose()
  }

  const unflag = () => {
    setProjects(p => p.map(x => x.id === project.id
      ? { ...x, flagged: false, flagReason: '' } : x))
    pushNotif(`Project "${project.title}" has been unflagged.`)
    onClose()
  }

  return (
    <Modal title={`Flag Project — ${project.title}`} onClose={onClose}>
      <div className="space-y-4">
        {project.flagged && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            This project is currently flagged: "{project.flagReason}"
          </div>
        )}
        <Textarea label="Reason for Flagging *" value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. Suspected plagiarism, violates university rules…" rows={3} />
        <div className="flex gap-2">
          <Btn variant="danger" onClick={submit}><Icon d={IC.flag} size={13} />Flag Project</Btn>
          {project.flagged && <Btn variant="secondary" onClick={unflag}>Unflag Project</Btn>}
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ─── INVITATIONS ──────────────────────────────────────────────────────────────
function InvitationsSection({ user, projects, setProjects, pushNotif }) {
  const pending = projects.filter(p =>
    (p.collaborators || []).some(c => c.email === user.email && c.status === 'pending')
  )

  const respond = (projectId, status) => {
    setProjects(p => p.map(x => x.id === projectId
      ? { ...x, collaborators: (x.collaborators || []).map(c => c.email === user.email ? { ...c, status } : c) }
      : x))
    const proj = projects.find(p => p.id === projectId)
    pushNotif(`You ${status} the invitation for "${proj?.title}".`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Project Invitations</h2>
        <p className="mt-1 text-sm text-slate-500">Students can invite you to their projects as an instructor.</p>
      </div>

      {pending.length === 0
        ? <Card><EmptyState message="No pending invitations." /></Card>
        : <div className="space-y-3">
            {pending.map(p => {
              const collab = (p.collaborators || []).find(c => c.email === user.email)
              return (
                <Card key={p.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{p.title}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge color="blue">{p.course}</Badge>
                        <Badge color="slate">Owner: {p.owner}</Badge>
                      </div>
                      {p.description && <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                      <p className="text-xs text-slate-400">
                        Invited {new Date(collab?.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Btn size="sm" variant="success" onClick={() => respond(p.id, 'accepted')}>
                        <Icon d={IC.check} size={13} />Accept
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => respond(p.id, 'rejected')}>
                        <Icon d={IC.x} size={13} />Reject
                      </Btn>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
      }
    </div>
  )
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function NotificationsSection({ notifications, setNotifications, profileEmail }) {
  const [notifsOn, setNotifsOn] = useLS('instructor_notifs_on_'+(profileEmail||'default'), true)
  const unread = unreadNotificationCount(notifications)
  const markAll = read => setNotifications(p => p.map(n => ({ ...n, read })))
  const toggle  = id   => setNotifications(p => p.map(n => n.id === id ? { ...n, read: !n.read } : n))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
          {unread > 0 && <p className="mt-0.5 text-sm text-slate-500">{unread} unread</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn size="sm" variant="secondary" onClick={() => markAll(true)}>Mark all read</Btn>
          <Btn size="sm" variant="secondary" onClick={() => markAll(false)}>Mark all unread</Btn>
          <Btn size="sm" variant={notifsOn ? 'danger' : 'success'} onClick={() => setNotifsOn(p => !p)}>
            <Icon d={IC.bell} size={13} />{notifsOn ? 'Turn Off' : 'Turn On'} Notifications
          </Btn>
        </div>
      </div>

      {!notifsOn && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          🔕 Notifications are turned off.
        </div>
      )}

      {notifications.length === 0
        ? <Card><EmptyState message="No notifications yet." /></Card>
        : <div className="space-y-2">
            {notifications.slice().reverse().map(n => (
              <div key={n.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${n.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50'}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-300' : 'bg-blue-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>{n.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => toggle(n.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  {n.read ? 'Unread' : 'Read'}
                </button>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────
function MessagesSection({ user, pushNotif }) {
  const [threads, setThreads] = useLS('instructor_messages_' + user.email, [])
  const [active, setActive]   = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [text, setText]       = useState('')

  const startThread = () => {
    const em = newEmail.trim().toLowerCase()
    if (!em) return
    if (threads.some(t => t.with === em)) { setActive(em); setNewEmail(''); return }
    setThreads(p => [...p, { with: em, messages: [] }])
    setActive(em); setNewEmail('')
  }

const send = () => {
    if (!text.trim() || !active) return
    const msg = { id: Date.now().toString(), from: user.email, text: text.trim(), at: new Date().toISOString() }
    setThreads(p => p.map(t => t.with === active ? { ...t, messages: [...t.messages, msg] } : t))
    // write into recipient's thread
    const recipientKey = 'student_messages_' + active
    const recipientThreads = LS.get(recipientKey, [])
    const existingThread = recipientThreads.find(t => t.with === user.email)
    if (existingThread) {
      LS.set(recipientKey, recipientThreads.map(t => t.with === user.email ? { ...t, messages: [...t.messages, msg] } : t))
    } else {
      LS.set(recipientKey, [...recipientThreads, { with: user.email, messages: [msg] }])
    }
    // notify recipient
    const recipientNotifsKey = 'student_notifs_' + active
    LS.set(recipientNotifsKey, [...LS.get(recipientNotifsKey, []), {
      id: Date.now().toString(), read: false,
      message: `New message from ${user.email}.`,
      createdAt: new Date().toISOString(),
    }])
    pushNotif(`Message sent to ${active}.`)
    setText('')
  }

  const activeThread = threads.find(t => t.with === active)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Messages</h2>
      <div className="flex gap-4" style={{ minHeight: '420px' }}>
        {/* sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          <div className="flex gap-1.5">
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startThread()}
              placeholder="Email…"
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
            <Btn size="sm" onClick={startThread}><Icon d={IC.plus} size={12} /></Btn>
          </div>
          {threads.length === 0
            ? <p className="text-center text-xs text-slate-400 py-4">No conversations.</p>
            : threads.map(t => (
                <button key={t.with} onClick={() => setActive(t.with)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${active === t.with ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mb-1">
                    {t.with[0].toUpperCase()}
                  </div>
                  <p className="font-medium truncate text-xs">{t.with}</p>
                  <p className={`text-xs truncate ${active === t.with ? 'text-blue-200' : 'text-slate-400'}`}>
                    {t.messages.at(-1)?.text || 'No messages yet'}
                  </p>
                </button>
              ))
          }
        </div>

        {/* chat area */}
        <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
          {!activeThread
            ? <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                Select a conversation or start a new one.
              </div>
            : <>
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="font-semibold text-slate-800">{activeThread.with}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeThread.messages.length === 0
                    ? <p className="text-center text-sm text-slate-400">Say hello 👋</p>
                    : activeThread.messages.map(m => (
                        <div key={m.id} className={`flex ${m.from === user.email ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${m.from === user.email ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
                            <p>{m.text}</p>
                            <p className={`text-xs mt-1 ${m.from === user.email ? 'text-blue-200' : 'text-slate-400'}`}>
                              {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                  }
                </div>
                <div className="border-t border-slate-200 flex gap-2 p-3">
                  <input value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Type a message…"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                  <Btn onClick={send}><Icon d={IC.send} size={13} />Send</Btn>
                </div>
              </>
          }
        </div>
      </div>
    </div>
  )
}

// ─── RECOMMENDED PROJECTS ──────────────────────────────────────────────────────
function RecommendedSection({ user, projects, linkedCourses }) {
  // recommend public projects from courses I teach, that I'm NOT already on
  const recommended = projects.filter(p =>
    p.visibility === 'public' &&
    linkedCourses.includes(p.course) &&
    !(p.collaborators || []).some(c => c.email === user.email)
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Recommended Projects</h2>
        <p className="mt-1 text-sm text-slate-500">
          Public projects from your courses that you haven't been assigned to yet.
        </p>
      </div>

      {recommended.length === 0
        ? <Card><EmptyState message="No recommended projects at this time." /></Card>
        : <div className="space-y-3">
            {recommended.map(p => (
              <Card key={p.id}>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{p.title}</h3>
                    <Badge color="blue">{p.course}</Badge>
                    {p.rating > 0 && <Badge color="yellow">★ {p.rating}/5</Badge>}
                  </div>
                  {p.description && <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {(p.languages || []).map(l => <Badge key={l} color="slate">{l}</Badge>)}
                  </div>
                  <p className="text-xs text-slate-400">Owner: {p.owner} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  )
}
// ─── STUDENT PORTFOLIOS (Req 8, 9, 47–51) ────────────────────────────────────
function StudentPortfoliosSection() {
  const [search, setSearch]         = useState('')
  const [filterMajor, setFilterMajor] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [selected, setSelected]     = useState(null)

  const allUsers   = LS.get('guc_projecthub_users', []).filter(u => u.role === 'student')
  const allProjects= LS.get('student_projects', [])
  const profiles   = allUsers.map(u => ({ ...u, ...LS.get('student_profile_'+u.email, {}) }))

  const withProjects = profiles.map(p => ({
    ...p,
    publicProjects: allProjects.filter(pr => pr.owner === p.email && pr.visibility === 'public'),
    projectCount:   allProjects.filter(pr => pr.owner === p.email && pr.visibility === 'public').length,
  }))

  const majors    = [...new Set(profiles.map(p => p.major).filter(Boolean))]
  const allSkills = [...new Set(profiles.flatMap(p => p.skills || []))]

  // Req 47 — search by name or email
  // Req 48 — filter by major or skills
  // Req 50 — sort by project count
  const displayed = withProjects
    .filter(p => {
      const name = `${p.firstName||''} ${p.lastName||''}`.toLowerCase()
      return name.includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
    })
    .filter(p => !filterMajor || p.major === filterMajor)
    .filter(p => !filterSkill || (p.skills || []).includes(filterSkill))
    .sort((a, b) => b.projectCount - a.projectCount)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Student Portfolios</h2>
        <p className="mt-1 text-sm text-slate-500">Search and browse student portfolios — Req 8, 9, 47–51.</p>
      </div>

      {/* Req 47, 48, 50 — search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={IC.search} size={14}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"/>
        </div>
        <select value={filterMajor} onChange={e=>setFilterMajor(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Majors</option>
          {majors.map(m=><option key={m}>{m}</option>)}
        </select>
        <select value={filterSkill} onChange={e=>setFilterSkill(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Skills</option>
          {allSkills.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Req 49 — view list */}
      {displayed.length === 0
        ? <Card><EmptyState message="No student portfolios found."/></Card>
        : <div className="space-y-3">
            {displayed.map(p=>(
              <Card key={p.email}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.photo
                      ? <img src={p.photo} alt="avatar" className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-blue-200"/>
                      : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                          {(p.firstName?.[0]||p.email[0]).toUpperCase()}
                        </div>
                    }
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                      <p className="text-sm text-slate-500">{p.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {p.major && <Badge color="blue">{p.major}</Badge>}
                        <span className="text-xs text-slate-400">{p.projectCount} public project{p.projectCount!==1?'s':''}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(p.skills||[]).slice(0,4).map(s=><Badge key={s} color="slate">{s}</Badge>)}
                      </div>
                    </div>
                  </div>
                  {/* Req 51 */}
                  <Btn size="sm" variant="secondary" onClick={()=>setSelected(p)}>
                    <Icon d={IC.eye} size={13}/>View Portfolio
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
      }

      {/* Req 51 — view portfolio detail (Req 9 — view student profile) */}
      {selected && (
        <Modal title={`${selected.firstName} ${selected.lastName}'s Portfolio`} onClose={()=>setSelected(null)} wide>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {selected.photo
                ? <img src={selected.photo} alt="avatar" className="h-14 w-14 rounded-full object-cover border-2 border-blue-200"/>
                : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                    {(selected.firstName?.[0]||selected.email[0]).toUpperCase()}
                  </div>
              }
              <div>
                <p className="text-lg font-semibold text-slate-900">{selected.firstName} {selected.lastName}</p>
                <p className="text-sm text-slate-500">{selected.email}</p>
                {selected.major && <Badge color="blue">{selected.major}</Badge>}
              </div>
            </div>
            {selected.linkedin && (
              <a href={selected.linkedin} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                <Icon d={IC.link} size={13}/>{selected.linkedin}
              </a>
            )}
            {(selected.skills||[]).length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">{selected.skills.map(s=><Badge key={s}>{s}</Badge>)}</div>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Public Projects ({selected.publicProjects.length})
              </p>
              {selected.publicProjects.length === 0
                ? <p className="text-sm text-slate-400">No public projects.</p>
                : <div className="space-y-2">
                    {selected.publicProjects.map(proj=>(
                      <div key={proj.id} className="rounded-lg border border-slate-200 px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-800">{proj.title}</p>
                          <Badge color="blue">{proj.course}</Badge>
                          {proj.rating>0 && <Badge color="yellow">★ {proj.rating}/5</Badge>}
                        </div>
                        {proj.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{proj.description}</p>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(proj.languages||[]).map(l=><Badge key={l} color="slate">{l}</Badge>)}
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}







// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function InstructorDashboard() {
  const navigate = useNavigate()
  const rawUser  = getCurrentUser()

  if (!rawUser || rawUser.role !== 'instructor') {
    navigate('/login')
    return null
  }

  seedAcademicPlatformDemoData({ instructorEmail: rawUser.email })

  const [tab, setTab]         = useState('overview')
  const [sidebarOpen, setSidebar] = useState(false)

  const [profile, setProfileLS] = useLS('instructor_profile_' + rawUser.email, {
    firstName:  rawUser.firstName || '',
    lastName:   rawUser.lastName  || '',
    bio:        '',
    research:   '',
    education:  '',
  })

  const [linkedCourses, setLinkedCoursesLS] = useLS(
    'instructor_courses_' + rawUser.email,
    ['Bachelor Project']
  )

  // shared projects with student dashboard
  const [projects, setProjectsLS] = useState(() => getSharedProjects())
  const setProjects = (fn) => {
    const next = typeof fn === 'function' ? fn(projects) : fn
    setSharedProjects(next)
    setProjectsLS(next)
  }

  const [notifications, setNotificationsLS] = useLS('instructor_notifs_' + rawUser.email, [])

  const setProfile       = v  => setProfileLS(v)
  const setLinkedCourses = v  => setLinkedCoursesLS(v)
  const setNotifications = fn => setNotificationsLS(typeof fn === 'function' ? fn(notifications) : fn)

  const pushNotif = msg => setNotificationsLS(p => [...p, {
    id: Date.now().toString(), message: msg, read: false, createdAt: new Date().toISOString(),
  }])

  const unread  = unreadNotificationCount(notifications)
  const invites = projects.filter(p =>
    (p.collaborators || []).some(c => c.email === rawUser.email && c.status === 'pending')
  ).length

  const navItems = [
    { id: 'overview',      label: 'Overview',      icon: IC.home,     },
    { id: 'profile',       label: 'My Profile',    icon: IC.user,     },
    { id: 'courses',       label: 'My Courses',    icon: IC.book,     },
    { id: 'projects',      label: 'Projects',      icon: IC.folder,   },
    { id: 'invitations',   label: 'Invitations',   icon: IC.users,    badge: invites },
    { id: 'notifications', label: 'Notifications', icon: IC.bell,     badge: unread, badgeTone: 'red' },
    { id: 'messages',      label: 'Messages',      icon: IC.chat,     },
   { id: 'recommended',   label: 'Recommended',   icon: IC.heart,    },
    { id: 'portfolios',    label: 'Student Portfolios', icon: IC.users },
  ]

  const handleLogout = () => { logoutUser(); navigate('/login') }

  const NavContent = () => (
    <>
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Instructor Portal</p>
        <p className="mt-1 font-semibold text-slate-900 truncate">
          {profile.firstName || rawUser.firstName} {profile.lastName || rawUser.lastName}
        </p>
        <p className="text-xs text-slate-500 truncate">{rawUser.email}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setSidebar(false) }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
              ${tab === item.id ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'}`}>
            <Icon d={item.icon} size={16} />
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span
                className={
                  item.badgeTone === 'red'
                    ? `ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none text-white shadow-sm ${
                        tab === item.id ? 'bg-red-500 ring-2 ring-white/90' : 'bg-red-600'
                      }`
                    : `ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                        tab === item.id ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
                      }`
                }>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600">
          <Icon d={IC.logout} size={16} />Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <NavContent />
      </aside>

      {/* mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebar(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r border-slate-200 bg-white px-4 py-6"
            onClick={e => e.stopPropagation()}>
            <NavContent />
          </aside>
        </div>
      )}

      {/* main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* mobile top bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setSidebar(true)} className="rounded-lg border border-slate-300 p-2 text-slate-600">
            <Icon d={IC.menu} />
          </button>
          <span className="font-semibold text-slate-900">Instructor Portal</span>
          {unread > 0 && (
            <span
              className="ml-auto flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-semibold leading-none text-white shadow-sm"
              aria-label={`${unread} unread notifications`}>
              {unread}
            </span>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-5xl">
            {tab === 'overview'      && <Overview user={rawUser} profile={profile} linkedCourses={linkedCourses} notifications={notifications} projects={projects} setTab={setTab} />}
            {tab === 'profile'       && <ProfileSection user={rawUser} profile={profile} setProfile={setProfile} />}
            {tab === 'courses'       && <CoursesSection user={rawUser} linkedCourses={linkedCourses} setLinkedCourses={setLinkedCourses} pushNotif={pushNotif} />}
            {tab === 'projects'      && <ProjectsSection user={rawUser} projects={projects} setProjects={setProjects} pushNotif={pushNotif} />}
            {tab === 'invitations'   && <InvitationsSection user={rawUser} projects={projects} setProjects={setProjects} pushNotif={pushNotif} />}
           {tab === 'notifications' && <NotificationsSection notifications={notifications} setNotifications={setNotifications} profileEmail={rawUser.email}/>}
            {tab === 'messages'      && <MessagesSection user={rawUser} pushNotif={pushNotif} />}
           {tab === 'recommended'   && <RecommendedSection user={rawUser} projects={projects} linkedCourses={linkedCourses} />}
            {tab === 'portfolios'    && <StudentPortfoliosSection />}
          </div>
        </main>
      </div>
    </div>
  )
}   


