import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../../data/authStorage'

// ─── tiny localStorage helpers ───────────────────────────────────────────────
const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
}
function useLS(key, initial) {
  const [val, setVal] = useState(() => LS.get(key, initial))
  const save = (v) => { const next = typeof v === 'function' ? v(val) : v; LS.set(key, next); setVal(next) }
  return [val, save]
}

// ─── constants ───────────────────────────────────────────────────────────────
const COURSES    = ['CSEN 401', 'CSEN 402', 'CSEN 501', 'DMET 502', 'DMET 305', 'Bachelor Project']
const LANGS      = ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP']
const SKILLS_ALL = ['React', 'Node.js', 'Python', 'Machine Learning', 'UI/UX', 'Docker', 'SQL', 'Git', 'Flutter', 'AWS']
const TASK_STATUSES = ['pending', 'postponed', 'completed']

// ─── inline SVG icons (no extra deps) ────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)
const IC = {
  home:        'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  folder:      'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  task:        'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7',
  bell:        'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  chat:        'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  briefcase:   'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z',
  chart:       'M18 20V10M12 20V4M6 20v-6',
  user:        'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  heart:       'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  logout:      'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  plus:        'M12 5v14M5 12h14',
  edit:        'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:       'M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 6V4h4v2',
  x:           'M18 6L6 18M6 6l12 12',
  search:      'M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z',
  eye:         'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6',
  eyeOff:      'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
  link:        'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  upload:      'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  star:        'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  flag:        'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  check:       'M20 6L9 17l-5-5',
  send:        'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  menu:        'M3 12h18M3 6h18M3 18h18',
  users:       'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  fileText:    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
}

// ─── reusable primitives ──────────────────────────────────────────────────────
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

const Btn = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }) => {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }
  const variants = {
    primary:   'bg-blue-700 text-white hover:bg-blue-800',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    ghost:     'text-slate-600 hover:bg-slate-100',
    success:   'bg-green-600 text-white hover:bg-green-700',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

const Input = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input className={`rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 ${error ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-blue-500'}`} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

const Textarea = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <textarea className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} {...props} />
  </div>
)

const Sel = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" {...props}>
      {children}
    </select>
  </div>
)

const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
)

const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => e.target===e.currentTarget && onClose()}>
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

const TagPicker = ({ options, selected, onToggle, label }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onToggle(o)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${selected.includes(o) ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'}`}>
          {o}
        </button>
      ))}
    </div>
  </div>
)

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function Overview({ user, projects, notifications, internships, setTab }) {
  const myProjects  = projects.filter(p => p.owner === user.email)
  const unread      = notifications.filter(n => !n.read).length
  const applied     = internships.filter(i => i.applied).length
  const publicProj  = myProjects.filter(p => p.visibility === 'public').length

  // language stats
  const langs = {}
  myProjects.forEach(p => (p.languages || []).forEach(l => { langs[l] = (langs[l] || 0) + 1 }))
  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1

  const stats = [
    { label: 'My Projects',     value: myProjects.length, color: 'text-blue-700',   bg: 'bg-blue-50',   tab: 'projects' },
    { label: 'Unread Alerts',   value: unread,            color: 'text-yellow-700', bg: 'bg-yellow-50', tab: 'notifications' },
    { label: 'Applied Jobs',    value: applied,           color: 'text-green-700',  bg: 'bg-green-50',  tab: 'internships' },
    { label: 'Public Projects', value: publicProj,        color: 'text-purple-700', bg: 'bg-purple-50', tab: 'projects' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user.firstName || 'Student'} 👋</h2>
        <p className="mt-1 text-slate-500">Here's a summary of your ProjectHub activity.</p>
      </div>

      {/* stat cards */}
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
        {/* language breakdown */}
        <Card>
          <h3 className="mb-4 font-semibold text-slate-800">Languages in My Projects</h3>
          {Object.keys(langs).length === 0
            ? <EmptyState message="Add projects with languages to see stats." />
            : <div className="space-y-3">
                {Object.entries(langs).sort((a,b)=>b[1]-a[1]).map(([lang, count]) => (
                  <div key={lang}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{lang}</span>
                      <span className="text-slate-400">{Math.round(count/total*100)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${Math.round(count/total*100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
          }
        </Card>

        {/* recent notifications */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Notifications</h3>
            <button onClick={() => setTab('notifications')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          {notifications.length === 0
            ? <EmptyState message="No notifications yet." />
            : <ul className="space-y-3">
                {notifications.slice(0, 5).map(n => (
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

      {/* top collaborators */}
      <Card>
        <h3 className="mb-4 font-semibold text-slate-800">Top Collaborators</h3>
        {myProjects.length === 0
          ? <EmptyState message="No projects yet." />
          : (() => {
              const colMap = {}
              myProjects.forEach(p => (p.collaborators||[]).filter(c=>c.status==='accepted').forEach(c => {
                colMap[c.email] = (colMap[c.email] || 0) + 1
              }))
              const sorted = Object.entries(colMap).sort((a,b)=>b[1]-a[1]).slice(0,5)
              return sorted.length === 0
                ? <EmptyState message="No accepted collaborators yet." />
                : <div className="flex flex-wrap gap-3">
                    {sorted.map(([email, count]) => (
                      <div key={email} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700">{email}</p>
                          <p className="text-xs text-slate-400">{count} project{count>1?'s':''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
            })()
        }
      </Card>
    </div>
  )
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function ProfileSection({ profile, setProfile }) {
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
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
              {(profile.firstName?.[0] || 'S').toUpperCase()}
            </div>
            {editing && (
              <label className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600">
                <Icon d={IC.upload} size={12} /> Upload Photo
                <input type="file" className="hidden" accept="image/*" />
              </label>
            )}
          </div>

          {/* fields */}
          <div className="flex-1 space-y-4">
            {editing ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="First Name" value={form.firstName || ''} onChange={f('firstName')} />
                  <Input label="Last Name"  value={form.lastName  || ''} onChange={f('lastName')} />
                </div>
                <Input label="GUC Email (read-only)" value={form.email || ''} disabled />
                <Input label="Major" value={form.major || ''} onChange={f('major')} placeholder="e.g. Computer Science" />
                <Input label="LinkedIn / CV Link" value={form.linkedin || ''} onChange={f('linkedin')} placeholder="https://linkedin.com/in/yourname" />
                <TagPicker label="Skills" options={SKILLS_ALL}
                  selected={form.skills || []}
                  onToggle={s => setForm(p => ({ ...p, skills: (p.skills||[]).includes(s) ? (p.skills||[]).filter(x=>x!==s) : [...(p.skills||[]),s] }))} />
                <div className="flex gap-2 pt-1">
                  <Btn onClick={save}><Icon d={IC.check} />Save Changes</Btn>
                  <Btn variant="secondary" onClick={() => setEditing(false)}>Cancel</Btn>
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xl font-semibold text-slate-900">{profile.firstName} {profile.lastName}</p>
                <p className="text-sm text-slate-500">{profile.email}</p>
                {profile.major && (
                  <p className="text-sm"><span className="font-medium text-slate-700">Major:</span> {profile.major}</p>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                    <Icon d={IC.link} size={13} />{profile.linkedin}
                  </a>
                )}
                {(profile.skills||[]).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.skills.map(s => <Badge key={s}>{s}</Badge>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────
function ProjectsSection({ projects, setProjects, profile, pushNotif }) {
  const [modal, setModal]     = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]   = useState('')
  const [filterCourse, setFilter] = useState('')
  const [sortBy, setSort]     = useState('date')

  const myProjects = projects.filter(p => p.owner === profile.email ||
    (p.collaborators||[]).some(c => c.email === profile.email && c.status === 'accepted'))

  const displayed = myProjects
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !filterCourse || p.course === filterCourse)
    .sort((a,b) => sortBy === 'date'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : (b.rating||0) - (a.rating||0))

  const blank = () => ({
    id: Date.now().toString(), title: '', course: COURSES[0],
    github: '', demoVideo: '', description: '', languages: [],
    visibility: 'public', owner: profile.email,
    collaborators: [], tasks: [], thesisDrafts: [],
    createdAt: new Date().toISOString(), rating: 0,
  })
  const [form, setForm] = useState(blank)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const openCreate = () => { setForm(blank()); setModal('create') }
  const openEdit   = p   => { setSelected(p); setForm({ ...p }); setModal('edit') }

  const saveProject = () => {
    if (!form.title.trim()) return alert('Project title is required.')
    if (modal === 'create') setProjects(p => [...p, form])
    else setProjects(p => p.map(x => x.id === form.id ? form : x))
    setModal(null)
  }

  const delProject = id => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    setProjects(p => p.filter(x => x.id !== id))
  }

  const toggleVisibility = id => {
    setProjects(p => p.map(x => x.id === id
      ? { ...x, visibility: x.visibility === 'public' ? 'private' : 'public' } : x))
  }

  const statusColor = { public: 'green', private: 'slate' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">My Projects</h2>
        <Btn onClick={openCreate}><Icon d={IC.plus} />New Project</Btn>
      </div>

      {/* filters row */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={IC.search} size={14} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={filterCourse} onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Courses</option>
          {COURSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSort(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="date">Sort by Date</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {/* project list */}
      {displayed.length === 0
        ? <Card><EmptyState message="No projects found. Create your first project!" /></Card>
        : <div className="space-y-3">
            {displayed.map(p => {
              const isOwner = p.owner === profile.email
              return (
                <Card key={p.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{p.title}</h3>
                        <Badge color={statusColor[p.visibility]}>{p.visibility}</Badge>
                        <Badge color="blue">{p.course}</Badge>
                        {p.rating > 0 && <Badge color="yellow">★ {p.rating}/5</Badge>}
                        {(p.flagged) && <Badge color="red">⚑ Flagged</Badge>}
                      </div>
                      {p.description && <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                      {(p.languages||[]).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.languages.map(l => <Badge key={l} color="slate">{l}</Badge>)}
                        </div>
                      )}
                      <p className="text-xs text-slate-400">Created {new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    {isOwner && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Btn size="sm" variant="ghost" onClick={() => toggleVisibility(p.id)}>
                          <Icon d={p.visibility==='public'?IC.eyeOff:IC.eye} size={13} />
                          {p.visibility==='public'?'Make Private':'Make Public'}
                        </Btn>
                        <Btn size="sm" variant="secondary" onClick={() => { setSelected(p); setModal('tasks') }}>
                          <Icon d={IC.task} size={13} />Tasks
                        </Btn>
                        <Btn size="sm" variant="secondary" onClick={() => { setSelected(p); setModal('collabs') }}>
                          <Icon d={IC.users} size={13} />Collabs
                        </Btn>
                        {p.course === 'Bachelor Project' && (
                          <Btn size="sm" variant="secondary" onClick={() => { setSelected(p); setModal('thesis') }}>
                            <Icon d={IC.fileText} size={13} />Thesis
                          </Btn>
                        )}
                        <Btn size="sm" onClick={() => openEdit(p)}><Icon d={IC.edit} size={13} />Edit</Btn>
                        <Btn size="sm" variant="danger" onClick={() => delProject(p.id)}>
                          <Icon d={IC.trash} size={13} />Delete
                        </Btn>
                      </div>
                    )}
                  </div>

                  {/* instructor feedback */}
                  {(p.instructorComments||[]).length > 0 && (
                    <div className="mt-3 rounded-lg bg-blue-50 p-3">
                      <p className="mb-1 text-xs font-semibold text-blue-700">Instructor Feedback</p>
                      {p.instructorComments.map((c,i) => (
                        <p key={i} className="text-xs text-blue-800">"{c.text}" — <span className="text-blue-600">{c.author}</span></p>
                      ))}
                    </div>
                  )}

                  {/* flagged appeal */}
                  {p.flagged && isOwner && (
                    <AppealSection project={p} setProjects={setProjects} pushNotif={pushNotif} />
                  )}
                </Card>
              )
            })}
          </div>
      }

      {/* Create / Edit modal */}
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'New Project':'Edit Project'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Input label="Project Title *" value={form.title} onChange={f('title')} placeholder="My Awesome Project" />
            <Sel label="Course *" value={form.course} onChange={f('course')}>
              {COURSES.map(c => <option key={c}>{c}</option>)}
            </Sel>
            <Textarea label="Short Description" value={form.description} onChange={f('description')} placeholder="Describe your project briefly…" />
            <Input label="GitHub Link" value={form.github} onChange={f('github')} placeholder="https://github.com/username/repo" />
            <Input label="Demo Video Link" value={form.demoVideo} onChange={f('demoVideo')} placeholder="https://youtube.com/watch?v=…" />
            <TagPicker label="Programming Languages" options={LANGS}
              selected={form.languages||[]}
              onToggle={l => setForm(p => ({ ...p, languages: (p.languages||[]).includes(l) ? (p.languages||[]).filter(x=>x!==l) : [...(p.languages||[]),l] }))} />
            <Sel label="Visibility" value={form.visibility} onChange={f('visibility')}>
              <option value="public">Public — visible on your portfolio</option>
              <option value="private">Private — only you can see</option>
            </Sel>
          </div>
          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
            <Btn onClick={saveProject}><Icon d={IC.check} />Save Project</Btn>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {modal==='tasks' && selected && (
        <TasksModal
          project={projects.find(p=>p.id===selected.id)||selected}
          setProjects={setProjects} profile={profile}
          onClose={() => setModal(null)} />
      )}
      {modal==='collabs' && selected && (
        <CollabsModal
          project={projects.find(p=>p.id===selected.id)||selected}
          setProjects={setProjects} pushNotif={pushNotif}
          onClose={() => setModal(null)} />
      )}
      {modal==='thesis' && selected && (
        <ThesisModal
          project={projects.find(p=>p.id===selected.id)||selected}
          setProjects={setProjects}
          onClose={() => setModal(null)} />
      )}
    </div>
  )
}

// ─── Appeal section (inside flagged project) ──────────────────────────────────
function AppealSection({ project, setProjects, pushNotif }) {
  const [msg, setMsg] = useState(project.appealMessage || '')
  const [sent, setSent] = useState(!!project.appealSent)

  const send = () => {
    if (!msg.trim()) return alert('Please write a short explanation.')
    setProjects(p => p.map(x => x.id===project.id ? { ...x, appealMessage: msg, appealSent: true } : x))
    pushNotif(`Your appeal for "${project.title}" has been submitted.`)
    setSent(true)
  }

  return (
    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="mb-1 text-xs font-semibold text-red-700">⚑ Project Flagged{project.flagReason ? `: ${project.flagReason}` : ''}</p>
      {sent
        ? <p className="text-xs text-green-700">✓ Appeal submitted successfully.</p>
        : <>
            <Textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Explain your point of view…" />
            <div className="mt-2"><Btn size="sm" variant="danger" onClick={send}><Icon d={IC.send} size={13}/>Send Appeal</Btn></div>
          </>
      }
    </div>
  )
}

// ─── TASKS modal ──────────────────────────────────────────────────────────────
function TasksModal({ project, setProjects, profile, onClose }) {
  const isOwner = project.owner === profile.email
  const [tasks, setTasks] = useState(project.tasks || [])
  const [form, setForm]   = useState({ title:'', description:'', assignee:'', deadline:'', status:'pending' })
  const [dragIdx, setDragIdx] = useState(null)

  const sync = t => {
    setTasks(t)
    setProjects(p => p.map(x => x.id===project.id ? { ...x, tasks: t } : x))
  }

  const add = () => {
    if (!form.title.trim()) return alert('Task title is required.')
    sync([...tasks, { ...form, id: Date.now().toString(), createdBy: profile.email }])
    setForm({ title:'', description:'', assignee:'', deadline:'', status:'pending' })
  }

  const del    = id     => sync(tasks.filter(t => t.id!==id))
  const update = (id,k,v) => sync(tasks.map(t => t.id===id ? { ...t, [k]: v } : t))

  const onDrop = i => {
    if (dragIdx===null||dragIdx===i) return
    const t = [...tasks]; const [item] = t.splice(dragIdx,1); t.splice(i,0,item)
    sync(t); setDragIdx(null)
  }

  const statusColor = { pending:'yellow', postponed:'slate', completed:'green' }

  return (
    <Modal title={`Tasks — ${project.title}`} onClose={onClose} wide>
      <div className="space-y-4">
        {isOwner && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add New Task</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Task title *" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} />
              <Input placeholder="Assignee email" value={form.assignee} onChange={e=>setForm(p=>({...p,assignee:e.target.value}))} />
            </div>
            <Input placeholder="Short description" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="date" label="Deadline" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} />
              <Sel label="Status" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                {TASK_STATUSES.map(s=><option key={s}>{s}</option>)}
              </Sel>
            </div>
            <Btn size="sm" onClick={add}><Icon d={IC.plus} size={13}/>Add Task</Btn>
          </div>
        )}

        {tasks.length===0
          ? <EmptyState message="No tasks yet." />
          : <div className="space-y-2">
              {isOwner && <p className="text-xs text-slate-400">Drag tasks to reorder by importance.</p>}
              {tasks.map((t,i) => (
                <div key={t.id}
                  draggable={isOwner}
                  onDragStart={()=>setDragIdx(i)}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={()=>onDrop(i)}
                  className={`rounded-lg border border-slate-200 bg-white p-3 ${isOwner?'cursor-grab active:cursor-grabbing':''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{t.title}</p>
                      {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                      {t.assignee && <p className="text-xs text-slate-400 mt-1">👤 {t.assignee}</p>}
                      {t.deadline  && <p className="text-xs text-slate-400">📅 Due {t.deadline}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge color={statusColor[t.status]}>{t.status}</Badge>
                      <select value={t.status} onChange={e=>update(t.id,'status',e.target.value)}
                        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                        {TASK_STATUSES.map(s=><option key={s}>{s}</option>)}
                      </select>
                      {isOwner && (
                        <button onClick={()=>del(t.id)} className="text-slate-300 hover:text-red-500 transition">
                          <Icon d={IC.trash} size={13}/>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* instructor comment on task */}
                  {(t.instructorComment) && (
                    <div className="mt-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">
                      💬 <strong>Instructor:</strong> {t.instructorComment}
                    </div>
                  )}
                </div>
              ))}
            </div>
        }
      </div>
    </Modal>
  )
}

// ─── COLLABORATORS modal ───────────────────────────────────────────────────────
function CollabsModal({ project, setProjects, pushNotif, onClose }) {
  const [email, setEmail] = useState('')
  const collabs = project.collaborators || []

  const invite = () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    if (collabs.some(c=>c.email===trimmed)) return alert('Already invited.')
    const updated = [...collabs, { email: trimmed, status:'pending', invitedAt: new Date().toISOString() }]
    setProjects(p=>p.map(x=>x.id===project.id?{...x,collaborators:updated}:x))
    pushNotif(`Invitation sent to ${trimmed} for "${project.title}".`)
    setEmail('')
  }

  const cancel = em => {
    setProjects(p=>p.map(x=>x.id===project.id?{...x,collaborators:(x.collaborators||[]).filter(c=>c.email!==em)}:x))
  }

  const statusColor = { pending:'yellow', accepted:'green', rejected:'red' }

  return (
    <Modal title={`Collaborators — ${project.title}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&invite()}
            placeholder="Invite by email…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <Btn onClick={invite}><Icon d={IC.send} size={13}/>Invite</Btn>
        </div>

        {collabs.length===0
          ? <EmptyState message="No collaborators yet." />
          : <ul className="space-y-2">
              {collabs.map(c=>(
                <li key={c.email} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.email}</p>
                    <p className="text-xs text-slate-400">Invited {new Date(c.invitedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={statusColor[c.status]||'slate'}>{c.status}</Badge>
                    {c.status==='pending' && (
                      <button onClick={()=>cancel(c.email)} className="text-xs text-red-500 hover:underline">Cancel</button>
                    )}
                    {c.status==='accepted' && (
                      <button onClick={()=>cancel(c.email)} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
        }
      </div>
    </Modal>
  )
}

// ─── THESIS modal ─────────────────────────────────────────────────────────────
function ThesisModal({ project, setProjects, onClose }) {
  const drafts = project.thesisDrafts || []

  const addDraft = () => {
    const name = prompt('Enter draft name (e.g. "Draft v1"):')
    if (!name?.trim()) return
    const newDraft = { id: Date.now().toString(), name: name.trim(), isFinal: false, uploadedAt: new Date().toISOString() }
    const updated  = [...drafts, newDraft]
    setProjects(p=>p.map(x=>x.id===project.id?{...x,thesisDrafts:updated}:x))
  }

  const setFinal = id => {
    const updated = drafts.map(d => ({ ...d, isFinal: d.id===id }))
    setProjects(p=>p.map(x=>x.id===project.id?{...x,thesisDrafts:updated}:x))
  }

  const del = id => {
    setProjects(p=>p.map(x=>x.id===project.id?{...x,thesisDrafts:(x.thesisDrafts||[]).filter(d=>d.id!==id)}:x))
  }

  return (
    <Modal title={`Thesis Drafts — ${project.title}`} onClose={onClose}>
      <div className="space-y-3">
        <Btn size="sm" onClick={addDraft}><Icon d={IC.upload} size={13}/>Upload Draft</Btn>
        {drafts.length===0
          ? <EmptyState message="No thesis drafts uploaded yet." />
          : <ul className="space-y-2">
              {drafts.map(d=>(
                <li key={d.id} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${d.isFinal?'border-blue-300 bg-blue-50':'border-slate-200'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon d={IC.fileText} size={14} />
                      <span className="text-sm font-medium text-slate-800">{d.name}</span>
                      {d.isFinal && <Badge color="blue">Final Draft</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(d.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!d.isFinal && <Btn size="sm" variant="secondary" onClick={()=>setFinal(d.id)}>Set as Final</Btn>}
                    {!d.isFinal && <button onClick={()=>del(d.id)} className="text-slate-300 hover:text-red-500"><Icon d={IC.trash} size={13}/></button>}
                  </div>
                </li>
              ))}
            </ul>
        }
        {drafts.some(d=>d.isFinal) && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            ℹ️ All non-final drafts are automatically private once a final draft is selected.
          </p>
        )}
      </div>
    </Modal>
  )
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function NotificationsSection({ notifications, setNotifications }) {
  const [notifEnabled, setNotifEnabled] = useState(true)

  const markAll = read => setNotifications(p=>p.map(n=>({...n,read})))
  const toggle  = id    => setNotifications(p=>p.map(n=>n.id===id?{...n,read:!n.read}:n))
  const unread  = notifications.filter(n=>!n.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
          {unread>0 && <p className="mt-0.5 text-sm text-slate-500">{unread} unread</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn size="sm" variant="secondary" onClick={()=>markAll(true)}>Mark all read</Btn>
          <Btn size="sm" variant="secondary" onClick={()=>markAll(false)}>Mark all unread</Btn>
          <Btn size="sm" variant={notifEnabled?'danger':'success'} onClick={()=>setNotifEnabled(p=>!p)}>
            <Icon d={IC.bell} size={13}/>{notifEnabled?'Turn Off Notifications':'Turn On Notifications'}
          </Btn>
        </div>
      </div>

      {!notifEnabled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          🔕 Notifications are turned off. You won't receive new alerts.
        </div>
      )}

      {notifications.length===0
        ? <Card><EmptyState message="No notifications yet." /></Card>
        : <div className="space-y-2">
            {notifications.slice().reverse().map(n=>(
              <div key={n.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${n.read?'border-slate-200 bg-white':'border-blue-200 bg-blue-50'}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read?'bg-slate-300':'bg-blue-600'}`}/>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read?'text-slate-500':'text-slate-800 font-medium'}`}>{n.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={()=>toggle(n.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  {n.read?'Unread':'Read'}
                </button>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────
function MessagesSection({ profile, pushNotif }) {
  const [threads, setThreads] = useLS('student_messages_'+profile.email, [])
  const [active, setActive]   = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [text, setText]       = useState('')

  const startThread = () => {
    const em = newEmail.trim().toLowerCase()
    if (!em) return
    if (threads.some(t=>t.with===em)) { setActive(em); setNewEmail(''); return }
    setThreads(p=>[...p,{with:em,messages:[]}])
    setActive(em); setNewEmail('')
  }

  const send = () => {
    if (!text.trim()||!active) return
    const msg = { id:Date.now().toString(), from:profile.email, text:text.trim(), at:new Date().toISOString() }
    setThreads(p=>p.map(t=>t.with===active?{...t,messages:[...t.messages,msg]}:t))
    pushNotif(`Message sent to ${active}.`)
    setText('')
  }

  const activeThread = threads.find(t=>t.with===active)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Messages</h2>
      <div className="flex gap-4 min-h-96">
        {/* sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          <div className="flex gap-1.5">
            <input value={newEmail} onChange={e=>setNewEmail(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&startThread()}
              placeholder="Email…"
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
            <Btn size="sm" onClick={startThread}><Icon d={IC.plus} size={12}/></Btn>
          </div>
          {threads.length===0
            ? <p className="text-xs text-slate-400 text-center py-4">No conversations.</p>
            : threads.map(t=>(
                <button key={t.with} onClick={()=>setActive(t.with)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${active===t.with?'bg-blue-700 text-white':'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mb-1">
                    {t.with[0].toUpperCase()}
                  </div>
                  <p className="font-medium truncate">{t.with}</p>
                  <p className={`text-xs truncate ${active===t.with?'text-blue-200':'text-slate-400'}`}>
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
                  {activeThread.messages.length===0
                    ? <p className="text-center text-sm text-slate-400">Say hello 👋</p>
                    : activeThread.messages.map(m=>(
                        <div key={m.id} className={`flex ${m.from===profile.email?'justify-end':'justify-start'}`}>
                          <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${m.from===profile.email?'bg-blue-700 text-white':'bg-slate-100 text-slate-800'}`}>
                            <p>{m.text}</p>
                            <p className={`text-xs mt-1 ${m.from===profile.email?'text-blue-200':'text-slate-400'}`}>
                              {new Date(m.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                      ))
                  }
                </div>
                <div className="border-t border-slate-200 flex gap-2 p-3">
                  <input value={text} onChange={e=>setText(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&send()}
                    placeholder="Type a message…"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                  <Btn onClick={send}><Icon d={IC.send} size={13}/>Send</Btn>
                </div>
              </>
          }
        </div>
      </div>
    </div>
  )
}

// ─── INTERNSHIPS ──────────────────────────────────────────────────────────────
const SAMPLE_INTERNSHIPS = [
  { id:'i1', title:'Frontend Developer Intern', company:'TechCorp', duration:'3 months', deadline:'2026-08-01', skills:['React','JavaScript'], description:'Work on our customer-facing web apps.', postedAt:'2026-04-01', status:'hiring' },
  { id:'i2', title:'Data Science Intern', company:'DataViz Co', duration:'6 months', deadline:'2026-07-15', skills:['Python','SQL'], description:'Help build ML pipelines for client analytics.', postedAt:'2026-03-20', status:'hiring' },
  { id:'i3', title:'Mobile Developer Intern', company:'AppWorks', duration:'4 months', deadline:'2026-06-30', skills:['Flutter','Swift'], description:'Build cross-platform mobile features.', postedAt:'2026-04-10', status:'hiring' },
]

function InternshipsSection({ profile, pushNotif }) {
  const [applications, setApplications] = useLS('student_applications_'+profile.email, [])
  const [search, setSearch]    = useState('')
  const [filterComp, setFilter] = useState('')
  const [filterDur, setFilterDur] = useState('')
  const [sort, setSort]        = useState('date')
  const [modal, setModal]      = useState(null)
  const [selected, setSelected] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')

  const companies = [...new Set(SAMPLE_INTERNSHIPS.map(i=>i.company))]
  const durations = [...new Set(SAMPLE_INTERNSHIPS.map(i=>i.duration))]

  const displayed = SAMPLE_INTERNSHIPS
    .filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.company.toLowerCase().includes(search.toLowerCase()))
    .filter(i => !filterComp || i.company===filterComp)
    .filter(i => !filterDur  || i.duration===filterDur)
    .sort((a,b) => new Date(b.postedAt)-new Date(a.postedAt))

  const getApp = id => applications.find(a=>a.internshipId===id)

  const apply = () => {
    if (!coverLetter.trim()) return alert('Please write a cover letter.')
    setApplications(p=>[...p, { internshipId:selected.id, coverLetter, appliedAt:new Date().toISOString(), status:'pending' }])
    pushNotif(`Application submitted for "${selected.title}" at ${selected.company}.`)
    setModal(null); setCoverLetter('')
  }

  const completedApps = applications.filter(a => a.status==='accepted')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Internships</h2>

      {/* completed internships portfolio badge */}
      {completedApps.length>0 && (
        <Card className="border-green-200 bg-green-50">
          <p className="font-semibold text-green-800 mb-2">✓ Completed Internships on Your Portfolio</p>
          <div className="flex flex-wrap gap-2">
            {completedApps.map(a=>{
              const intern = SAMPLE_INTERNSHIPS.find(i=>i.id===a.internshipId)
              return intern ? <Badge key={a.internshipId} color="green">{intern.title} @ {intern.company}</Badge> : null
            })}
          </div>
        </Card>
      )}

      {/* filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={IC.search} size={14}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search internships…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <select value={filterComp} onChange={e=>setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Companies</option>
          {companies.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={filterDur} onChange={e=>setFilterDur(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Durations</option>
          {durations.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>

      {/* internship cards */}
      {displayed.length===0
        ? <Card><EmptyState message="No internships match your search." /></Card>
        : <div className="space-y-3">
            {displayed.map(intern=>{
              const app = getApp(intern.id)
              const statusColor = { pending:'yellow', accepted:'green', rejected:'red', nominated:'purple' }
              return (
                <Card key={intern.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{intern.title}</h3>
                        <Badge color="blue">{intern.company}</Badge>
                        <Badge color="slate">{intern.duration}</Badge>
                        <Badge color="green">{intern.status==='hiring'?'Currently Hiring':'Position Filled'}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{intern.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {intern.skills.map(s=><Badge key={s} color="slate">{s}</Badge>)}
                      </div>
                      <p className="text-xs text-slate-400">
                        Posted {new Date(intern.postedAt).toLocaleDateString()} · Deadline {new Date(intern.deadline).toLocaleDateString()}
                      </p>
                      {app && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-slate-500">Application:</span>
                          <Badge color={statusColor[app.status]||'slate'}>{app.status}</Badge>
                        </div>
                      )}
                    </div>
                    {!app
                      ? <Btn size="sm" onClick={()=>{setSelected(intern);setModal('apply')}}>
                          <Icon d={IC.briefcase} size={13}/>Apply
                        </Btn>
                      : <span className="text-xs text-slate-400">Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                    }
                  </div>
                </Card>
              )
            })}
          </div>
      }

      {modal==='apply' && selected && (
        <Modal title={`Apply — ${selected.title}`} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p><strong>{selected.company}</strong> · {selected.duration}</p>
              <p className="text-slate-500 mt-1">{selected.description}</p>
            </div>
            <Textarea label="Cover Letter *" value={coverLetter} onChange={e=>setCoverLetter(e.target.value)}
              placeholder="Why do you think you're a good fit for this role?" rows={5} />
          </div>
          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
            <Btn onClick={apply}><Icon d={IC.send} size={13}/>Submit Application</Btn>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── FAVORITES ────────────────────────────────────────────────────────────────
function FavoritesSection({ projects }) {
  const [favProjects, setFavProjects]     = useLS('student_fav_projects', [])
  const [favPortfolios, setFavPortfolios] = useLS('student_fav_portfolios', [])

  const publicProjects = projects.filter(p=>p.visibility==='public')

  const toggleFavProject = id => setFavProjects(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Favorites</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold text-slate-800">Saved Projects</h3>
          {publicProjects.length===0
            ? <Card><EmptyState message="No public projects available yet." /></Card>
            : <div className="space-y-2">
                {publicProjects.map(p=>(
                  <Card key={p.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{p.title}</p>
                      <div className="flex gap-1 mt-1"><Badge color="blue">{p.course}</Badge></div>
                    </div>
                    <button onClick={()=>toggleFavProject(p.id)}
                      className={`transition ${favProjects.includes(p.id)?'text-red-500':'text-slate-300 hover:text-red-400'}`}>
                      <Icon d={IC.heart} size={18}/>
                    </button>
                  </Card>
                ))}
              </div>
          }
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-slate-800">My Saved Projects</h3>
          {favProjects.length===0
            ? <Card><EmptyState message="No saved projects yet. Heart a project to save it." /></Card>
            : <div className="space-y-2">
                {favProjects.map(id=>{
                  const p = projects.find(x=>x.id===id)
                  return p ? (
                    <Card key={id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">{p.title}</p>
                        <Badge color="blue">{p.course}</Badge>
                      </div>
                      <button onClick={()=>toggleFavProject(id)} className="text-red-500 hover:text-red-700">
                        <Icon d={IC.x} size={14}/>
                      </button>
                    </Card>
                  ) : null
                })}
              </div>
          }
        </div>
      </div>
    </div>
  )
}

// ─── STATS ────────────────────────────────────────────────────────────────────
function StatsSection({ projects, profile }) {
  const myProjects = projects.filter(p=>p.owner===profile.email)
  const langs = {}
  myProjects.forEach(p=>(p.languages||[]).forEach(l=>{ langs[l]=(langs[l]||0)+1 }))
  const total = Object.values(langs).reduce((a,b)=>a+b,0)||1
  const colMap = {}
  myProjects.forEach(p=>(p.collaborators||[]).filter(c=>c.status==='accepted').forEach(c=>{
    colMap[c.email]=(colMap[c.email]||0)+1
  }))
  const topCollabs = Object.entries(colMap).sort((a,b)=>b[1]-a[1]).slice(0,5)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">My Statistics</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label:'Total Projects',  value: myProjects.length },
          { label:'Public Projects', value: myProjects.filter(p=>p.visibility==='public').length },
          { label:'Collaborators',   value: Object.keys(colMap).length },
        ].map(s=>(
          <Card key={s.label} className="text-center">
            <p className="text-4xl font-bold text-blue-700">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-slate-800">Languages Used (%)</h3>
          {Object.keys(langs).length===0
            ? <EmptyState message="No language data yet." />
            : <div className="space-y-3">
                {Object.entries(langs).sort((a,b)=>b[1]-a[1]).map(([lang,count])=>(
                  <div key={lang}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-medium text-slate-700">{lang}</span>
                      <span className="text-slate-400">{Math.round(count/total*100)}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100">
                      <div className="h-2.5 rounded-full bg-blue-600" style={{width:`${Math.round(count/total*100)}%`}}/>
                    </div>
                  </div>
                ))}
              </div>
          }
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold text-slate-800">Top Collaborators per Project</h3>
          {topCollabs.length===0
            ? <EmptyState message="No accepted collaborators yet." />
            : <ul className="space-y-2">
                {topCollabs.map(([email,count])=>(
                  <li key={email} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {email[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-700">{email}</span>
                    </div>
                    <Badge color="blue">{count} project{count>1?'s':''}</Badge>
                  </li>
                ))}
              </ul>
          }
        </Card>
      </div>
    </div>
  )
}

// ─── INVITATIONS ──────────────────────────────────────────────────────────────
function InvitationsSection({ profile, projects, setProjects, pushNotif }) {
  const myInvites = projects.flatMap(p=>
    (p.collaborators||[])
      .filter(c=>c.email===profile.email && c.status==='pending')
      .map(c=>({ project:p, collab:c }))
  )

  const respond = (projectId, status) => {
    setProjects(p=>p.map(x=>x.id===projectId
      ? { ...x, collaborators:(x.collaborators||[]).map(c=>c.email===profile.email?{...c,status}:c) }
      : x))
    pushNotif(`You ${status} the invitation.`)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Project Invitations</h2>
      {myInvites.length===0
        ? <Card><EmptyState message="No pending invitations." /></Card>
        : <div className="space-y-3">
            {myInvites.map(({project,collab})=>(
              <Card key={project.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{project.title}</p>
                    <p className="text-sm text-slate-500">Owner: {project.owner}</p>
                    <p className="text-xs text-slate-400">Invited {new Date(collab.invitedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn size="sm" variant="success" onClick={()=>respond(project.id,'accepted')}>
                      <Icon d={IC.check} size={13}/>Accept
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={()=>respond(project.id,'rejected')}>
                      <Icon d={IC.x} size={13}/>Reject
                    </Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const navigate  = useNavigate()
  const rawUser   = getCurrentUser()

  if (!rawUser || rawUser.role !== 'student') {
    navigate('/login')
    return null
  }

  const [tab, setTab]           = useState('overview')
  const [sidebarOpen, setSidebar] = useState(false)

  const [profile, setProfileLS] = useLS('student_profile_'+rawUser.email, {
    firstName: rawUser.firstName || '',
    lastName:  rawUser.lastName  || '',
    email:     rawUser.email,
    major:     rawUser.major || '',
    linkedin:  '',
    skills:    [],
  })

  const [projects, setProjectsLS]           = useLS('student_projects', [])
  const [notifications, setNotificationsLS] = useLS('student_notifs_'+rawUser.email, [])
  const [internships]                       = useLS('student_internships', [])

  const pushNotif = msg => setNotificationsLS(p=>[...p, {
    id: Date.now().toString(), message: msg, read: false, createdAt: new Date().toISOString()
  }])

  const setProfile  = v => setProfileLS(v)
  const setProjects = fn => setProjectsLS(typeof fn==='function'?fn(projects):fn)
  const setNotifications = fn => setNotificationsLS(typeof fn==='function'?fn(notifications):fn)

  const unread = notifications.filter(n=>!n.read).length

  const navItems = [
    { id:'overview',       label:'Overview',      icon:IC.home      },
    { id:'profile',        label:'My Profile',    icon:IC.user      },
    { id:'projects',       label:'Projects',      icon:IC.folder    },
    { id:'invitations',    label:'Invitations',   icon:IC.users     },
    { id:'notifications',  label:'Notifications', icon:IC.bell,  badge: unread },
    { id:'messages',       label:'Messages',      icon:IC.chat      },
    { id:'internships',    label:'Internships',   icon:IC.briefcase },
    { id:'favorites',      label:'Favorites',     icon:IC.heart     },
    { id:'stats',          label:'Statistics',    icon:IC.chart     },
  ]

  const handleLogout = () => { logoutUser(); navigate('/login') }

  const NavContent = () => (
    <>
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Student Portal</p>
        <p className="mt-1 font-semibold text-slate-900 truncate">{profile.firstName} {profile.lastName}</p>
        <p className="text-xs text-slate-500 truncate">{profile.email}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>{ setTab(item.id); setSidebar(false) }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${tab===item.id?'bg-blue-700 text-white':'text-slate-700 hover:bg-slate-100 hover:text-blue-700'}`}>
            <Icon d={item.icon} size={16}/>
            <span>{item.label}</span>
            {item.badge>0 && (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${tab===item.id?'bg-white text-blue-700':'bg-blue-100 text-blue-700'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600">
          <Icon d={IC.logout} size={16}/>Logout
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
        <div className="fixed inset-0 z-40 md:hidden" onClick={()=>setSidebar(false)}>
          <div className="absolute inset-0 bg-black/40"/>
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r border-slate-200 bg-white px-4 py-6"
            onClick={e=>e.stopPropagation()}>
            <NavContent />
          </aside>
        </div>
      )}

      {/* main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* top bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button onClick={()=>setSidebar(true)} className="rounded-lg border border-slate-300 p-2 text-slate-600">
            <Icon d={IC.menu}/>
          </button>
          <span className="font-semibold text-slate-900">Student Portal</span>
          {unread>0 && <span className="ml-auto rounded-full bg-blue-700 px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-5xl">
            {tab==='overview'     && <Overview user={profile} projects={projects} notifications={notifications} internships={internships} setTab={setTab}/>}
            {tab==='profile'      && <ProfileSection profile={profile} setProfile={setProfile}/>}
            {tab==='projects'     && <ProjectsSection projects={projects} setProjects={setProjects} profile={profile} pushNotif={pushNotif}/>}
            {tab==='invitations'  && <InvitationsSection profile={profile} projects={projects} setProjects={setProjects} pushNotif={pushNotif}/>}
            {tab==='notifications'&& <NotificationsSection notifications={notifications} setNotifications={setNotifications}/>}
            {tab==='messages'     && <MessagesSection profile={profile} pushNotif={pushNotif}/>}
            {tab==='internships'  && <InternshipsSection profile={profile} pushNotif={pushNotif}/>}
            {tab==='favorites'    && <FavoritesSection projects={projects}/>}
            {tab==='stats'        && <StatsSection projects={projects} profile={profile}/>}
          </div>
        </main>
      </div>
    </div>
  )
}
