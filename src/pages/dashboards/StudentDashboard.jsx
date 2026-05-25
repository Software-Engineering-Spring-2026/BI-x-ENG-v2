import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../../data/authStorage'
import { seedAcademicPlatformDemoData } from '../../data/academicPlatformSeed'

const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
}

// ── Global theme helpers ─────────────────────────────────────────────────────
const THEME_KEY = 'projecthub_dark_mode'
const applyTheme = (dark) => {
  if (dark) {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
  }
}
// Apply immediately on script load (before React renders) to avoid flash
applyTheme(LS.get(THEME_KEY, false))
function useLS(key, initial) {
  const [val, setVal] = useState(() => LS.get(key, initial))
  const save = (v) => { const next = typeof v === 'function' ? v(val) : v; LS.set(key, next); setVal(next) }
  return [val, save]
}

const COURSES    = ['CSEN 401','CSEN 402','CSEN 501','CSEN 502','DMET 502','DMET 305','CSEN 603','CSEN 701','Bachelor Project']
const LANGS      = ['JavaScript','Python','Java','C++','TypeScript','Go','Rust','Swift','Kotlin','PHP']
const SKILLS_ALL = ['React','Node.js','Python','Machine Learning','UI/UX','Docker','SQL','Git','Flutter','AWS']
const TASK_STATUSES = ['pending','postponed','completed']

const getSeedInstructors = () => {
  const users = LS.get('guc_projecthub_users', [])
  const instructors = users.filter(u => u.role === 'instructor')
  if (instructors.length === 0) {
    return [{ firstName:'Demo', lastName:'Instructor', email:'instructor@guc.edu.eg', role:'instructor', linkedCourses:['CSEN 401','CSEN 402','Bachelor Project'], bio:'Expert in software engineering.', research:'Distributed systems, AI', education:'PhD Computer Science, GUC' }]
  }return instructors.map(u => {
    const prof = LS.get('instructor_profile_'+u.email, {})
    return {
      ...u,
      linkedCourses: LS.get('instructor_courses_'+u.email, ['Bachelor Project']),
      ...prof,
      firstName: (prof.firstName && prof.firstName.trim()) ? prof.firstName : (u.firstName || ''),
      lastName:  (prof.lastName  && prof.lastName.trim())  ? prof.lastName  : (u.lastName  || ''),
    }
  })
}

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)
const IC = {
  home:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', folder:'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  task:'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7', bell:'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  chat:'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', briefcase:'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z',
  chart:'M18 20V10M12 20V4M6 20v-6', user:'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  heart:'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  logout:'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9', plus:'M12 5v14M5 12h14',
  edit:'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:'M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 6V4h4v2', x:'M18 6L6 18M6 6l12 12',
  search:'M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z', check:'M20 6L9 17l-5-5',
  link:'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  upload:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12', send:'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  menu:'M3 12h18M3 6h18M3 18h18', eye:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6',
  eyeOff:'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
  users:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  fileText:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  flag:'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  book:'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z',
 star:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  download:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  settings:'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  moon:'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  sun:'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z',
  shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  help:'M12 22a10 10 0 100-20 10 10 0 000 20zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01',
  clock:'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  zap:'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
}

const Badge = ({ children, color = 'blue' }) => {
  const map = {
    blue:'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    green:'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    red:'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    yellow:'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    slate:'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    purple:'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    orange:'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color]??map.slate}`}>{children}</span>
}
const Btn = ({ children, onClick, variant='primary', size='md', className='', disabled=false }) => {
  const base='inline-flex items-center gap-1.5 rounded-lg font-medium transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes={sm:'px-3 py-1.5 text-xs',md:'px-4 py-2 text-sm',lg:'px-5 py-2.5 text-sm'}
  const variants={
    primary:'bg-blue-700 text-white hover:bg-blue-800',
    secondary:'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600',
    danger:'bg-red-600 text-white hover:bg-red-700',
    ghost:'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700',
    success:'bg-green-600 text-white hover:bg-green-700',
  }
  return <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>
}
const Input = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input className={`rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 ${error?'border-red-400 focus:ring-red-400':'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500'}`} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)
const Textarea = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
    <textarea className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} {...props} />
  </div>
)
const Sel = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" {...props}>{children}</select>
  </div>
)
const Card = ({ children, className='' }) => <div className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm ${className}`}>{children}</div>
const Modal = ({ title, onClose, children, wide=false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className={`w-full ${wide?'max-w-2xl':'max-w-lg'} rounded-xl bg-white dark:bg-slate-800 shadow-xl flex flex-col max-h-[90vh]`}>
<div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 shrink-0">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Icon d={IC.x}/></button>
      </div>
      <div className="overflow-y-auto px-6 py-4 dark:bg-slate-800">{children}</div>
    </div>
  </div>
)
const EmptyState = ({ message }) => <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">{message}</p>
const TagPicker = ({ options, selected, onToggle, label }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
    <div className="flex flex-wrap gap-2">
      {options.map(o=>(
        <button key={o} type="button" onClick={()=>onToggle(o)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${selected.includes(o)?'border-blue-700 bg-blue-700 text-white':'border-slate-300 text-slate-600 hover:border-blue-400'}`}>{o}</button>
      ))}
    </div>
  </div>
)
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative flex-1 min-w-48">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={IC.search} size={14}/></span>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
  </div>
)

function Overview({ user, projects, notifications, setTab }) {
  const myProjects=projects.filter(p=>p.owner===user.email)
  const unread=notifications.filter(n=>!n.read).length
  const apps=LS.get('student_applications_'+user.email,[])
  const langs={}
  myProjects.forEach(p=>(p.languages||[]).forEach(l=>{langs[l]=(langs[l]||0)+1}))
  const total=Object.values(langs).reduce((a,b)=>a+b,0)||1
  const colMap={}
  myProjects.forEach(p=>(p.collaborators||[]).filter(c=>c.status==='accepted').forEach(c=>{colMap[c.email]=(colMap[c.email]||0)+1}))
  const topCollabs=Object.entries(colMap).sort((a,b)=>b[1]-a[1]).slice(0,3)
  const stats=[
    {label:'My Projects',value:myProjects.length,color:'text-blue-700',bg:'bg-blue-50',tab:'projects'},
    {label:'Unread Alerts',value:unread,color:'text-yellow-700',bg:'bg-yellow-50',tab:'notifications'},
    {label:'Applied Jobs',value:apps.length,color:'text-green-700',bg:'bg-green-50',tab:'internships'},
    {label:'Public Projects',value:myProjects.filter(p=>p.visibility==='public').length,color:'text-purple-700',bg:'bg-purple-50',tab:'projects'},
  ]
  return (
    <div className="space-y-8">

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-8 py-10 sm:px-12 sm:py-14 shadow-lg shadow-blue-200">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl"/>
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"/>
        <div className="pointer-events-none absolute right-32 top-6 h-20 w-20 rounded-full bg-blue-400/20 blur-2xl"/>

        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          {/* Text block */}
          <div className="space-y-3 max-w-lg">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight">
              Welcome back,<br className="hidden sm:block"/> {user.firstName||'Student'} 👋
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Track your projects, collaborate with peers, and discover internship opportunities — all in one place.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button onClick={()=>setTab('create-project')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-md hover:bg-blue-50 hover:shadow-lg active:scale-95 transition-all duration-150 w-full sm:w-auto justify-center">
              <Icon d={IC.plus} size={15}/>New Project
            </button>
            <button onClick={()=>setTab('explore')}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/50 active:scale-95 transition-all duration-150 w-full sm:w-auto justify-center">
              <Icon d={IC.eye} size={15}/>Explore Projects
            </button>
          </div>
        </div>
      </div>

      {/* ── Analytics Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(s=>(
          <button key={s.label} onClick={()=>setTab(s.tab)}
            className={`group rounded-xl border-0 p-5 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${s.bg}`}>
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-slate-800">Languages Used</h3>
          {Object.keys(langs).length===0?<EmptyState message="Add projects with languages to see stats."/>:
            <div className="space-y-3">
              {Object.entries(langs).sort((a,b)=>b[1]-a[1]).map(([lang,count])=>(
                <div key={lang}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-slate-700">{lang}</span><span className="text-slate-400">{Math.round(count/total*100)}%</span></div>
                  <div className="h-2 w-full rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{width:`${Math.round(count/total*100)}%`}}/></div>
                </div>
              ))}
            </div>
          }
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Notifications</h3>
            <button onClick={()=>setTab('notifications')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          {notifications.length===0?<EmptyState message="No notifications yet."/>:
            <ul className="space-y-3">
              {notifications.slice().reverse().slice(0,5).map(n=>(
                <li key={n.id} className="flex items-start gap-2.5 text-sm">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read?'bg-slate-300':'bg-blue-600'}`}/>
                  <div><p className={n.read?'text-slate-400':'text-slate-700'}>{n.message}</p><p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</p></div>
                </li>
              ))}
            </ul>
          }
        </Card>
      </div>
      {topCollabs.length>0&&(
        <Card>
          <h3 className="mb-3 font-semibold text-slate-800">Top Collaborators</h3>
          <div className="flex flex-wrap gap-3">
            {topCollabs.map(([email,count])=>(
              <div key={email} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{email[0].toUpperCase()}</div>
                <div><p className="text-xs font-medium text-slate-700">{email}</p><p className="text-xs text-slate-400">{count} project{count>1?'s':''}</p></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Upcoming Today Widget ── */}
      {(()=>{
        const scheduleKey='student_schedule_'+user.email
        const allEvents=LS.get(scheduleKey,[])
        const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        const todayName=DAYS[new Date().getDay()]
        const todayEvents=allEvents.filter(e=>e.day===todayName).sort((a,b)=>a.time.localeCompare(b.time))
        const typeColor={class:'blue',deadline:'red',interview:'purple',meeting:'green',reminder:'yellow'}
        const typeDot={class:'bg-blue-500',deadline:'bg-red-500',interview:'bg-purple-500',meeting:'bg-green-500',reminder:'bg-amber-500'}
        if(allEvents.length===0)return null
        return (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">📅 Upcoming Today</h3>
              <button onClick={()=>setTab('schedule')} className="text-xs text-blue-600 hover:underline">View schedule</button>
            </div>
            {todayEvents.length===0
              ?<p className="text-sm text-slate-400">Nothing scheduled for today.</p>
              :<div className="space-y-2">
                {todayEvents.slice(0,4).map(e=>(
                  <div key={e.id} className="flex items-center gap-3">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${typeDot[e.type]}`}/>
                    <span className="text-xs font-mono text-slate-400 w-10 shrink-0">{e.time}</span>
                    <span className="text-sm text-slate-700 font-medium truncate">{e.title}</span>
                    <Badge color={typeColor[e.type]}>{e.type}</Badge>
                  </div>
                ))}
                {todayEvents.length>4&&<p className="text-xs text-slate-400 pl-5">+{todayEvents.length-4} more events today</p>}
              </div>
            }
          </Card>
        )
      })()}

      </div>
  )
}

function ProfileSection({ profile, setProfile }) {
  const [editing, setEditing]=useState(false)


  const [form, setForm]=useState(profile)
  const [photoKey, setPhotoKey]=useState(0)
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  const save=()=>{setProfile(form);setEditing(false)}
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
        {!editing&&<Btn onClick={()=>{setForm(profile);setEditing(true)}}><Icon d={IC.edit}/>Edit Profile</Btn>}
      </div>
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2 shrink-0">
            {profile.photo
  ? <img src={profile.photo} alt="avatar" className="h-24 w-24 rounded-full object-cover border-2 border-blue-200"/>
  : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">{(profile.firstName?.[0]||'S').toUpperCase()}</div>
}
<label className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <Icon d={IC.upload} size={12}/> {profile.photo ? 'Change Photo' : 'Upload Photo'}
              <input type="file" className="hidden" accept="image/*" key={photoKey} onChange={e=>{
                const file=e.target.files?.[0]
                if(!file)return
                const reader=new FileReader()
                reader.onload=ev=>{
                  setProfile(prev=>({...prev,photo:ev.target.result}))
                  setForm(prev=>({...prev,photo:ev.target.result}))
                  setPhotoKey(k=>k+1)
                }
                reader.readAsDataURL(file)
              }}/>
            </label>
          </div>
          <div className="flex-1 space-y-4">
            {editing?(
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="First Name" value={form.firstName||''} onChange={f('firstName')}/>
                  <Input label="Last Name" value={form.lastName||''} onChange={f('lastName')}/>
                </div>
                <Input label="GUC Email (read-only)" value={form.email||''} disabled/>
                <Input label="Major" value={form.major||''} onChange={f('major')} placeholder="e.g. Computer Science"/>
                <Input label="LinkedIn / CV Link" value={form.linkedin||''} onChange={f('linkedin')} placeholder="https://linkedin.com/in/yourname"/>
                <TagPicker label="Skills" options={SKILLS_ALL} selected={form.skills||[]}
                  onToggle={s=>setForm(p=>({...p,skills:(p.skills||[]).includes(s)?(p.skills||[]).filter(x=>x!==s):[...(p.skills||[]),s]}))}/>
                <div className="flex gap-2 pt-1"><Btn onClick={save}><Icon d={IC.check}/>Save</Btn><Btn variant="secondary" onClick={()=>setEditing(false)}>Cancel</Btn></div>
              </>
            ):(
              <div className="space-y-2.5">
                <p className="text-xl font-semibold text-slate-900">{profile.firstName} {profile.lastName}</p>
                <p className="text-sm text-slate-500">{profile.email}</p>
                {profile.major&&<p className="text-sm"><span className="font-medium text-slate-700">Major:</span> {profile.major}</p>}
                {profile.linkedin&&<a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><Icon d={IC.link} size={13}/>{profile.linkedin}</a>}
                {(profile.skills||[]).length>0&&<div className="flex flex-wrap gap-1.5 pt-1">{profile.skills.map(s=><Badge key={s}>{s}</Badge>)}</div>}
                {!profile.major&&!profile.linkedin&&!(profile.skills||[]).length&&<p className="text-sm text-slate-400">No profile info yet. Click Edit Profile to add details.</p>}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function InstructorsSection() {
  const [search, setSearch]=useState('')
  const [selected, setSelected]=useState(null)
  const instructors=getSeedInstructors()
  const displayed=instructors.filter(i=>{
    const name=`${i.firstName||''} ${i.lastName||''}`.toLowerCase()
    const q=search.toLowerCase()
    return name.includes(q)||i.email.toLowerCase().includes(q)||(i.linkedCourses||[]).join(' ').toLowerCase().includes(q)
  })
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Find Instructors</h2><p className="mt-1 text-sm text-slate-500">Search by name or course.</p></div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or course…"/>
      {displayed.length===0?<Card><EmptyState message="No instructors found."/></Card>:
        <div className="space-y-3">
          {displayed.map(i=>(
            <Card key={i.email}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">{(i.firstName?.[0]||'I').toUpperCase()}</div>
                  <div>
                    <p className="font-semibold text-slate-900">{i.firstName} {i.lastName}</p>
                    <p className="text-sm text-slate-500">{i.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">{(i.linkedCourses||[]).map(c=><Badge key={c} color="blue">{c}</Badge>)}</div>
                  </div>
                </div>
                <Btn size="sm" onClick={()=>setSelected(i)}><Icon d={IC.eye} size={13}/>View Profile</Btn>
              </div>
            </Card>
          ))}
        </div>
      }
      {selected&&(
        <Modal title="Instructor Profile" onClose={()=>setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">{(selected.firstName?.[0]||'I').toUpperCase()}</div>
              <div><p className="text-lg font-semibold text-slate-900">{selected.firstName} {selected.lastName}</p><p className="text-sm text-slate-500">{selected.email}</p><Badge color="blue">Course Instructor</Badge></div>
            </div>
            {selected.bio&&<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Biography</p><p className="mt-1 text-sm text-slate-700">{selected.bio}</p></div>}
            {selected.research&&<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Research Interests</p><p className="mt-1 text-sm text-slate-700">{selected.research}</p></div>}
            {selected.education&&<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Education</p><p className="mt-1 text-sm text-slate-700">{selected.education}</p></div>}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Linked Courses</p>
              <div className="flex flex-wrap gap-2">{(selected.linkedCourses||[]).map(c=><Badge key={c} color="blue">{c}</Badge>)}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AppealSection({ project, setProjects, pushNotif }) {
  const [msg, setMsg]=useState(project.appealMessage||'')
  const [sent, setSent]=useState(!!project.appealSent)
  const send=()=>{
    if (!msg.trim()) return alert('Please write your explanation.')
    setProjects(p=>p.map(x=>x.id===project.id?{...x,appealMessage:msg,appealSent:true}:x))
    pushNotif(`Your appeal for "${project.title}" was submitted.`)
    setSent(true)
  }
  return (
    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="mb-1 text-xs font-semibold text-red-700">⚑ Flagged{project.flagReason?`: ${project.flagReason}`:''}</p>
      {sent?<p className="text-xs text-green-700">✓ Appeal submitted.</p>:
        <><Textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Explain your point of view…"/>
        <div className="mt-2"><Btn size="sm" variant="danger" onClick={send}><Icon d={IC.send} size={13}/>Send Appeal</Btn></div></>
      }
    </div>
  )
}

function TasksModal({ project, setProjects, profile, onClose }) {
  const isOwner=project.owner===profile.email
  const [tasks, setTasks]=useState(project.tasks||[])
  const [form, setForm]=useState({title:'',description:'',assignee:'',deadline:'',status:'pending'})
  const [dragIdx, setDragIdx]=useState(null)
  const sync=t=>{setTasks(t);setProjects(p=>p.map(x=>x.id===project.id?{...x,tasks:t}:x))}
  const add=()=>{if(!form.title.trim())return alert('Task title required.');sync([...tasks,{...form,id:Date.now().toString(),createdBy:profile.email}]);setForm({title:'',description:'',assignee:'',deadline:'',status:'pending'})}
  const del=id=>sync(tasks.filter(t=>t.id!==id))
  const update=(id,k,v)=>sync(tasks.map(t=>t.id===id?{...t,[k]:v}:t))
  const onDrop=i=>{if(dragIdx===null||dragIdx===i)return;const t=[...tasks];const[item]=t.splice(dragIdx,1);t.splice(i,0,item);sync(t);setDragIdx(null)}
  const stColor={pending:'yellow',postponed:'slate',completed:'green'}
  return (
    <Modal title={`Tasks — ${project.title}`} onClose={onClose} wide>
      <div className="space-y-4">
        {isOwner&&(
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add New Task</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Task title *" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
              <Input placeholder="Assignee email" value={form.assignee} onChange={e=>setForm(p=>({...p,assignee:e.target.value}))}/>
            </div>
            <Input placeholder="Short description (1 line)" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="date" label="Deadline" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/>
              <Sel label="Status" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{TASK_STATUSES.map(s=><option key={s}>{s}</option>)}</Sel>
            </div>
            <Btn size="sm" onClick={add}><Icon d={IC.plus} size={13}/>Add Task</Btn>
          </div>
        )}
        {tasks.length===0?<EmptyState message="No tasks yet."/>:
          <div className="space-y-2">
            {isOwner&&<p className="text-xs text-slate-400">Drag to reorder by importance.</p>}
            {tasks.map((t,i)=>(
              <div key={t.id} draggable={isOwner} onDragStart={()=>setDragIdx(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(i)}
                className={`rounded-lg border border-slate-200 bg-white p-3 ${isOwner?'cursor-grab active:cursor-grabbing':''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{t.title}</p>
                    {t.description&&<p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                    {t.assignee&&<p className="text-xs text-slate-400 mt-1">👤 {t.assignee}</p>}
                    {t.deadline&&<p className="text-xs text-slate-400">📅 Due {t.deadline}</p>}
                    {t.instructorComment&&<div className="mt-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">💬 <strong>Instructor:</strong> {t.instructorComment}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color={stColor[t.status]}>{t.status}</Badge>
                    <select value={t.status} onChange={e=>update(t.id,'status',e.target.value)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                      {TASK_STATUSES.map(s=><option key={s}>{s}</option>)}
                    </select>
                    {isOwner&&<button onClick={()=>del(t.id)} className="text-slate-300 hover:text-red-500"><Icon d={IC.trash} size={13}/></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </Modal>
  )
}

function CollabsModal({ project, setProjects, profile, pushNotif, onClose }) {
  const [search, setSearch]=useState('')
  const collabs=project.collaborators||[]
  const allUsers=LS.get('guc_projecthub_users',[])
  const instructors=getSeedInstructors()
  const allPeople=[...allUsers.filter(u=>u.role==='student'&&u.email!==profile.email),...instructors]
  const searchResults=search.length>1?allPeople.filter(u=>{
    const name=`${u.firstName||''} ${u.lastName||''}`.toLowerCase()
    return name.includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase())
  }).slice(0,6):[]
  const invite=email=>{
    const trimmed=email.trim().toLowerCase()
    if (!trimmed) return
    if (collabs.some(c=>c.email===trimmed)) return alert('Already invited.')
    const updated=[...collabs,{email:trimmed,status:'pending',invitedAt:new Date().toISOString()}]
    setProjects(p=>p.map(x=>x.id===project.id?{...x,collaborators:updated}:x))
    pushNotif(`Invitation sent to ${trimmed} for "${project.title}".`)
    const key='student_notifs_'+trimmed
    const existing=LS.get(key,[])
    LS.set(key,[...existing,{id:Date.now().toString(),read:false,message:`You were invited to join "${project.title}" by ${profile.email}.`,createdAt:new Date().toISOString()}])
    setSearch('')
  }
  const remove=email=>setProjects(p=>p.map(x=>x.id===project.id?{...x,collaborators:(x.collaborators||[]).filter(c=>c.email!==email)}:x))
  const stColor={pending:'yellow',accepted:'green',rejected:'red'}
  return (
    <Modal title={`Collaborators — ${project.title}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Search & Invite</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={IC.search} size={14}/></span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"/>
          </div>
          {searchResults.length>0&&(
            <div className="mt-1 rounded-lg border border-slate-200 bg-white shadow-sm">
              {searchResults.map(u=>(
                <div key={u.email} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                  <div><p className="text-sm font-medium text-slate-800">{u.firstName} {u.lastName}</p><p className="text-xs text-slate-400">{u.email} · {u.role}</p></div>
                  <Btn size="sm" onClick={()=>invite(u.email)}><Icon d={IC.plus} size={12}/>Invite</Btn>
                </div>
              ))}
            </div>
          )}
          {search.includes('@')&&(
            <div className="mt-2"><Btn size="sm" variant="secondary" onClick={()=>invite(search)}><Icon d={IC.send} size={12}/>Invite {search}</Btn></div>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Collaborators List({collabs.length})</p>
          {collabs.length===0?<EmptyState message="No collaborators yet."/>:
            <ul className="space-y-2">
              {collabs.map(c=>(
                <li key={c.email} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <div><p className="text-sm font-medium text-slate-800">{c.email}</p><p className="text-xs text-slate-400">Invited {new Date(c.invitedAt).toLocaleDateString()}</p></div>
                  <div className="flex items-center gap-2">
                    <Badge color={stColor[c.status]||'slate'}>{c.status}</Badge>
                    {c.status==='pending'&&<button onClick={()=>remove(c.email)} className="text-xs text-red-500 hover:underline">Cancel</button>}
                    {c.status==='accepted'&&<button onClick={()=>remove(c.email)} className="text-xs text-slate-400 hover:text-red-500">Remove</button>}
                  </div>
                </li>
              ))}
            </ul>
          }
        </div>
      </div>
    </Modal>
  )
}

function ThesisModal({ project, setProjects, onClose }) {
  const drafts=project.thesisDrafts||[]
const [draftName, setDraftName]=useState('')
  const [draftFile, setDraftFile]=useState(null)
  const [draftFileKey, setDraftFileKey]=useState(0)
  const addDraft=()=>{
    if(!draftName.trim())return alert('Please enter a draft name.')
    if(!draftFile)return alert('Please select a file to upload.')
    const reader=new FileReader()
    reader.onload=ev=>{
      const updated=[...drafts,{id:Date.now().toString(),name:draftName.trim(),isFinal:false,uploadedAt:new Date().toISOString(),fileData:ev.target.result,fileName:draftFile.name}]
      setProjects(p=>p.map(x=>x.id===project.id?{...x,thesisDrafts:updated}:x))
      setDraftName('')
      setDraftFile(null)
      setDraftFileKey(k=>k+1)
    }
    reader.readAsDataURL(draftFile)
  }
  const setFinal=id=>{const updated=drafts.map(d=>({...d,isFinal:d.id===id}));setProjects(p=>p.map(x=>x.id===project.id?{...x,thesisDrafts:updated}:x))}
  const del=id=>setProjects(p=>p.map(x=>x.id===project.id?{...x,thesisDrafts:(x.thesisDrafts||[]).filter(d=>d.id!==id)}:x))
  const hasFinal=drafts.some(d=>d.isFinal)
  return (
    <Modal title={`Thesis Drafts — ${project.title}`} onClose={onClose}>
      <div className="space-y-3">
       <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add New Draft</p>
       <Input placeholder="Draft name (e.g. Draft v1) *" value={draftName} onChange={e=>setDraftName(e.target.value)}/>
          <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600">
            <Icon d={IC.upload} size={12}/>
            {draftFile?draftFile.name:'Choose file (PDF, DOCX, etc.)'}
            <input type="file" className="hidden" key={draftFileKey} accept=".pdf,.doc,.docx,.txt" onChange={e=>setDraftFile(e.target.files?.[0]||null)}/>
          </label>
          <Btn size="sm" onClick={addDraft} disabled={!draftName.trim()||!draftFile}><Icon d={IC.upload} size={13}/>Upload Draft</Btn>
        </div>
        {drafts.length===0?<EmptyState message="No thesis drafts uploaded yet."/>:
          <ul className="space-y-2">
            {drafts.map(d=>(
              <li key={d.id} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${d.isFinal?'border-blue-300 bg-blue-50':'border-slate-200'}`}>
                <div>
                  <div className="flex items-center gap-2"><Icon d={IC.fileText} size={14}/><span className="text-sm font-medium text-slate-800">{d.name}</span>{d.isFinal&&<Badge color="blue">Final Draft</Badge>}{hasFinal&&!d.isFinal&&<Badge color="slate">Private</Badge>}</div>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(d.uploadedAt).toLocaleDateString()}</p>
                </div>
<div className="flex items-center gap-2">
                  {d.fileData&&(
                    <a href={d.fileData} download={d.fileName||d.name}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
                      <Icon d={IC.download} size={12}/>Download
                    </a>
                  )}
                  {!d.isFinal&&<Btn size="sm" variant="secondary" onClick={()=>setFinal(d.id)}>Set as Final</Btn>}
                  {!d.isFinal&&<button onClick={()=>del(d.id)} className="text-slate-300 hover:text-red-500"><Icon d={IC.trash} size={13}/></button>}
                </div>
              </li>
            ))}
          </ul>
        }
        {hasFinal&&<p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">ℹ️ All non-final drafts are automatically private and invisible to everyone including instructors.</p>}
      </div>
    </Modal>
  )
}

function ProjectsSection({ projects, setProjects, profile, pushNotif, openCreateOnMount, setTab }) {
  const blank=()=>({id:Date.now().toString(),title:'',course:COURSES[0],github:'',demoVideo:'',description:'',languages:[],visibility:'public',owner:profile.email,collaborators:[],tasks:[],thesisDrafts:[],createdAt:new Date().toISOString(),rating:0})
  const [modal, setModal]=useState(openCreateOnMount?'create':null)
  const [form, setForm]=useState(blank)
  const [selected, setSelected]=useState(null)
  const [search, setSearch]=useState('')
  const [filterCourse, setFilterCourse]=useState('')
const [sortDate, setSortDate]=useState('newest')
  const [sortRating, setSortRating]=useState('none')
  const myProjects=projects.filter(p=>p.owner===profile.email||(p.collaborators||[]).some(c=>c.email===profile.email&&c.status==='accepted'))
  const hasRatings=myProjects.some(p=>(p.rating||0)>0)
  const displayed=myProjects
    .filter(p=>p.title.toLowerCase().includes(search.toLowerCase()))
    .filter(p=>!filterCourse||p.course===filterCourse)
    .sort((a,b)=>{
      // rating sort takes priority if selected
      if(sortRating==='highest')return (b.rating||0)-(a.rating||0)
      if(sortRating==='lowest')return (a.rating||0)-(b.rating||0)
      // fallback to date sort
      if(sortDate==='newest')return new Date(b.createdAt)-new Date(a.createdAt)
      if(sortDate==='oldest')return new Date(a.createdAt)-new Date(b.createdAt)
      return new Date(b.createdAt)-new Date(a.createdAt)
    })

  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  const openCreate=()=>{setForm(blank());setModal('create')}
  const openEdit=p=>{setSelected(p);setForm({...p});setModal('edit')}
  const saveProject=()=>{if(!form.title.trim())return alert('Project title is required.');if(modal==='create')setProjects(p=>[...p,form]);else setProjects(p=>p.map(x=>x.id===form.id?form:x));setModal(null)}
  const delProject=id=>{if(!confirm('Delete this project?'))return;setProjects(p=>p.filter(x=>x.id!==id))}
  const toggleVisibility=id=>setProjects(p=>p.map(x=>x.id===id?{...x,visibility:x.visibility==='public'?'private':'public'}:x))
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-900">My Projects</h2><Btn onClick={openCreate}><Icon d={IC.plus}/>New Project</Btn></div>
<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title…"/>
        </div>

        {/* Course filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">Course</label>
          <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition-colors">
            <option value="">All Courses</option>
            {COURSES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Sort by Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">Sort by Date</label>
          <select value={sortDate} onChange={e=>{setSortDate(e.target.value);setSortRating('none')}}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition-colors">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Sort by Rating */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">Sort by Rating</label>
          <select
            value={sortRating}
            disabled={!hasRatings}
            onChange={e=>setSortRating(e.target.value)}
            title={!hasRatings?'No ratings yet — rate a project to enable this filter':''}
            className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors
              ${hasRatings
                ?'border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:border-blue-500 cursor-pointer'
                :'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}>
            <option value="none">{hasRatings?'No Rating Sort':'No ratings yet'}</option>
            {hasRatings&&<>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </>}
          </select>
        </div>
      </div>
      {displayed.length===0?<Card><EmptyState message="No projects found. Create your first project!"/></Card>:
        <div className="space-y-3">
          {displayed.map(p=>{
            const isOwner=p.owner===profile.email
            return (
              <Card key={p.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{p.title}</h3>
                      <Badge color={p.visibility==='public'?'green':'slate'}>{p.visibility}</Badge>
                      <Badge color="blue">{p.course}</Badge>
                      {p.rating>0&&<Badge color="yellow">★ {p.rating}/5</Badge>}
                      {p.flagged&&<Badge color="red">⚑ Flagged</Badge>}
                    </div>
                    {p.description&&<p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-1">{(p.languages||[]).map(l=><Badge key={l} color="slate">{l}</Badge>)}</div>
                    <p className="text-xs text-slate-400">Created {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Btn size="sm" variant="ghost" onClick={()=>{setSelected(p);setModal('view')}}><Icon d={IC.eye} size={13}/>View</Btn>
                    {isOwner&&<>
                      <Btn size="sm" variant="ghost" onClick={()=>toggleVisibility(p.id)}><Icon d={p.visibility==='public'?IC.eyeOff:IC.eye} size={13}/>{p.visibility==='public'?'Make Private':'Make Public'}</Btn>
                      <Btn size="sm" variant="secondary" onClick={()=>{setSelected(p);setModal('tasks')}}><Icon d={IC.task} size={13}/>Tasks</Btn>
                      <Btn size="sm" variant="secondary" onClick={()=>{setSelected(p);setModal('collabs')}}><Icon d={IC.users} size={13}/>Collabs</Btn>
                      {p.course==='Bachelor Project'&&<Btn size="sm" variant="secondary" onClick={()=>{setSelected(p);setModal('thesis')}}><Icon d={IC.fileText} size={13}/>Thesis</Btn>}
                      <Btn size="sm" onClick={()=>openEdit(p)}><Icon d={IC.edit} size={13}/>Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={()=>delProject(p.id)}><Icon d={IC.trash} size={13}/>Delete</Btn>
                    </>}
                  </div>
                </div>
                {(p.instructorComments||[]).length>0&&(
                  <div className="mt-3 rounded-lg bg-blue-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-blue-700">💬 Instructor Feedback </p>
                    {p.instructorComments.map((c,i)=><p key={i} className="text-xs text-blue-800">"{c.text}" — <span className="text-blue-600">{c.author}</span></p>)}
                  </div>
                )}
                {p.flagged&&isOwner&&<AppealSection project={p} setProjects={setProjects} pushNotif={pushNotif}/>}
              </Card>
            )
          })}
        </div>
      }
      {modal==='view'&&selected&&(
        <Modal title={selected.title} onClose={()=>setModal(null)} wide>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2"><Badge color={selected.visibility==='public'?'green':'slate'}>{selected.visibility}</Badge><Badge color="blue">{selected.course}</Badge>{selected.rating>0&&<Badge color="yellow">★ {selected.rating}/5</Badge>}</div>
            {selected.description&&<p className="text-sm text-slate-700">{selected.description}</p>}
            {selected.github&&<a href={selected.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><Icon d={IC.link} size={13}/>GitHub</a>}
            {selected.demoVideo&&<a href={selected.demoVideo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><Icon d={IC.eye} size={13}/>Demo Video</a>}
            <div className="flex flex-wrap gap-1">{(selected.languages||[]).map(l=><Badge key={l} color="slate">{l}</Badge>)}</div>
            <p className="text-xs text-slate-400">Owner: {selected.owner} · Created {new Date(selected.createdAt).toLocaleDateString()}</p>
            {(selected.instructorComments||[]).length>0&&<div className="rounded-lg bg-blue-50 p-3"><p className="mb-1 text-xs font-semibold text-blue-700">Instructor Feedback</p>{selected.instructorComments.map((c,i)=><p key={i} className="text-xs text-blue-800">"{c.text}" — {c.author}</p>)}</div>}
            {(selected.tasks||[]).length>0&&<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Tasks</p>{selected.tasks.map(t=><div key={t.id} className="mb-1.5 rounded border border-slate-200 px-3 py-2 text-sm"><div className="flex justify-between"><span className="font-medium text-slate-800">{t.title}</span><Badge color={t.status==='completed'?'green':t.status==='postponed'?'slate':'yellow'}>{t.status}</Badge></div>{t.instructorComment&&<p className="text-xs text-blue-700 mt-1">💬 {t.instructorComment}</p>}</div>)}</div>}
          </div>
        </Modal>
      )}
      {(modal==='create'||modal==='edit')&&(
        <Modal title={modal==='create'?'New Project':'Edit Project'} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <Input label="Project Title *" value={form.title} onChange={f('title')} placeholder="My Awesome Project"/>
            <Sel label="Course *" value={form.course} onChange={f('course')}>{COURSES.map(c=><option key={c}>{c}</option>)}</Sel>
            <Textarea label="Short Description" value={form.description} onChange={f('description')} placeholder="Describe your project briefly…"/>
            <Input label="GitHub Link" value={form.github} onChange={f('github')} placeholder="https://github.com/username/repo"/>
            <Input label="Demo Video Link" value={form.demoVideo} onChange={f('demoVideo')} placeholder="https://youtube.com/watch?v=…"/>
            <TagPicker label="Programming Languages" options={LANGS} selected={form.languages||[]}
              onToggle={l=>setForm(p=>({...p,languages:(p.languages||[]).includes(l)?(p.languages||[]).filter(x=>x!==l):[...(p.languages||[]),l]}))}/>
            <Sel label="Visibility" value={form.visibility} onChange={f('visibility')}><option value="public">Public</option><option value="private">Private</option></Sel>
          </div>
          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><Btn onClick={saveProject}><Icon d={IC.check}/>Save Project</Btn><Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn></div>
        </Modal>
      )}
      {modal==='tasks'&&selected&&<TasksModal project={projects.find(p=>p.id===selected.id)||selected} setProjects={setProjects} profile={profile} onClose={()=>setModal(null)}/>}
      {modal==='collabs'&&selected&&<CollabsModal project={projects.find(p=>p.id===selected.id)||selected} setProjects={setProjects} profile={profile} pushNotif={pushNotif} onClose={()=>setModal(null)}/>}
      {modal==='thesis'&&selected&&<ThesisModal project={projects.find(p=>p.id===selected.id)||selected} setProjects={setProjects} onClose={()=>setModal(null)}/>}
    </div>
  )
}

function InvitationsSection({ profile, projects, setProjects, pushNotif }) {
  const myInvites=projects.flatMap(p=>(p.collaborators||[]).filter(c=>c.email===profile.email&&c.status==='pending').map(c=>({project:p,collab:c})))
  const respond=(projectId,status)=>{
    setProjects(p=>p.map(x=>x.id===projectId?{...x,collaborators:(x.collaborators||[]).map(c=>c.email===profile.email?{...c,status}:c)}:x))
    const proj=projects.find(p=>p.id===projectId)
    pushNotif(`You ${status} the invitation for "${proj?.title}".`)
  }
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Project Invitations</h2><p className="mt-1 text-sm text-slate-500">Accept or reject project invitations.</p></div>
      {myInvites.length===0?<Card><EmptyState message="No pending invitations."/></Card>:
        <div className="space-y-3">
          {myInvites.map(({project,collab})=>(
            <Card key={project.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{project.title}</p>
                  <div className="flex flex-wrap gap-2"><Badge color="blue">{project.course}</Badge><Badge color="slate">From: {project.owner}</Badge></div>
                  {project.description&&<p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>}
                  <p className="text-xs text-slate-400">Invited {new Date(collab.invitedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Btn size="sm" variant="success" onClick={()=>respond(project.id,'accepted')}><Icon d={IC.check} size={13}/>Accept</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>respond(project.id,'rejected')}><Icon d={IC.x} size={13}/>Reject</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  )
}

function ExploreProjectsSection({ profile, projects, favProjects, setFavProjects }) {
  const [search, setSearch]=useState('')
  const [filterCourse, setFilterCourse]=useState('')
  const [filterInstructor, setFilterInstructor]=useState('')
  const [filterDateFrom, setFilterDateFrom]=useState('')
  const [filterDateTo, setFilterDateTo]=useState('')
const [sortDate, setSortDate]=useState('newest')
  const [sortRating, setSortRating]=useState('none')
  const [selected, setSelected]=useState(null)
  const publicProjects=projects.filter(p=>p.visibility==='public')
  const instructors=getSeedInstructors()
  const courses=[...new Set(publicProjects.map(p=>p.course))]
  const hasRatings=publicProjects.some(p=>(p.rating||0)>0)
  const displayed=publicProjects
    .filter(p=>p.title.toLowerCase().includes(search.toLowerCase()))
    .filter(p=>!filterCourse||p.course===filterCourse)
    .filter(p=>!filterInstructor||(p.collaborators||[]).some(c=>c.email===filterInstructor&&c.status==='accepted'))
    .filter(p=>!filterDateFrom||new Date(p.createdAt)>=new Date(filterDateFrom))
    .filter(p=>!filterDateTo||new Date(p.createdAt)<=new Date(filterDateTo))
    .sort((a,b)=>{
      if(sortRating==='highest')return (b.rating||0)-(a.rating||0)
      if(sortRating==='lowest')return (a.rating||0)-(b.rating||0)
      if(sortDate==='newest')return new Date(b.createdAt)-new Date(a.createdAt)
      if(sortDate==='oldest')return new Date(a.createdAt)-new Date(b.createdAt)
      return new Date(b.createdAt)-new Date(a.createdAt)
    })
  const toggleFav=id=>setFavProjects(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Explore All Projects</h2><p className="mt-1 text-sm text-slate-500"> Search, filter by course/instructor/date, sort, view details.</p></div>
<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">

        {/* Search */}
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by project title…"/>
        </div>

        {/* Course */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">Course</label>
          <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition-colors">
            <option value="">All Courses</option>
            {courses.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Instructor */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">Instructor</label>
          <select value={filterInstructor} onChange={e=>setFilterInstructor(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition-colors">
            <option value="">All Instructors</option>
            {instructors.map(i=>{
              const name=`${i.firstName||''} ${i.lastName||''}`.trim()||i.email
              return <option key={i.email} value={i.email}>{name}</option>
            })}
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">From Date</label>
          <input type="date" value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition-colors"/>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">To Date</label>
          <input type="date" value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition-colors"/>
        </div>

        {/* Sort by Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">Sort by Date</label>
          <select value={sortDate} onChange={e=>{setSortDate(e.target.value);setSortRating('none')}}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 transition-colors">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Sort by Rating */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 px-0.5">Sort by Rating</label>
          <select
            value={sortRating}
            disabled={!hasRatings}
            onChange={e=>setSortRating(e.target.value)}
            title={!hasRatings?'No ratings yet':''}
            className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors
              ${hasRatings
                ?'border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:border-blue-500 cursor-pointer'
                :'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}>
            <option value="none">{hasRatings?'No Rating Sort':'No ratings yet'}</option>
            {hasRatings&&<>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </>}
          </select>
        </div>

      </div>
      {displayed.length===0?<Card><EmptyState message="No public projects match your search."/></Card>:
        <div className="space-y-3">
          {displayed.map(p=>(
            <Card key={p.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{p.title}</h3>{p.featured && <Badge color="purple">Featured</Badge>}<Badge color="blue">{p.course}</Badge>{p.rating>0&&<Badge color="yellow">★ {p.rating}/5</Badge>}</div>
                  {p.description&&<p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                  <div className="flex flex-wrap gap-1">{(p.languages||[]).map(l=><Badge key={l} color="slate">{l}</Badge>)}</div>
                  <p className="text-xs text-slate-400">By {p.owner} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Btn size="sm" variant="secondary" onClick={()=>setSelected(p)}><Icon d={IC.eye} size={13}/>View</Btn>
                  <button onClick={()=>toggleFav(p.id)} className={`rounded-lg p-1.5 transition ${favProjects.includes(p.id)?'text-red-500':'text-slate-300 hover:text-red-400'}`}><Icon d={IC.heart} size={16}/></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
      {selected&&(
        <Modal title={selected.title} onClose={()=>setSelected(null)} wide>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2"><Badge color="blue">{selected.course}</Badge>{selected.rating>0&&<Badge color="yellow">★ {selected.rating}/5</Badge>}</div>
            {selected.description&&<p className="text-sm text-slate-700">{selected.description}</p>}
            {selected.github&&<a href={selected.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><Icon d={IC.link} size={13}/>GitHub</a>}
            {selected.demoVideo&&<a href={selected.demoVideo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><Icon d={IC.eye} size={13}/>Demo Video</a>}
            <div className="flex flex-wrap gap-1">{(selected.languages||[]).map(l=><Badge key={l} color="slate">{l}</Badge>)}</div>
            <p className="text-xs text-slate-400">Owner: {selected.owner} · {new Date(selected.createdAt).toLocaleDateString()}</p>
            {(selected.collaborators||[]).filter(c=>c.status==='accepted').length>0&&<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Collaborators</p><div className="flex flex-wrap gap-1">{selected.collaborators.filter(c=>c.status==='accepted').map(c=><Badge key={c.email} color="slate">{c.email}</Badge>)}</div></div>}
          </div>
        </Modal>
      )}
    </div>
  )
}

function ExplorePortfoliosSection({ projects, favPortfolios, setFavPortfolios, setTab }) {
  const [search, setSearch]=useState('')
  const [filterMajor, setFilterMajor]=useState('')
  const [filterSkill, setFilterSkill]=useState('')
  const [sortByPortfolio, setSortByPortfolio]=useState('most')
  const [selected, setSelected]=useState(null)
  const currentUser=getCurrentUser()
  const allUsers=LS.get('guc_projecthub_users',[]).filter(u=>u.role==='student'&&u.email!==currentUser?.email)
  const profiles=allUsers.map(u=>({...u,...LS.get('student_profile_'+u.email,{})}))
  const withProjects=profiles.map(p=>({...p,publicProjects:projects.filter(pr=>pr.owner===p.email&&pr.visibility==='public'),projectCount:projects.filter(pr=>pr.owner===p.email&&pr.visibility==='public').length}))
  const majors=[...new Set(profiles.map(p=>p.major).filter(Boolean))]
  const allSkills=[...new Set(profiles.flatMap(p=>p.skills||[]))]
  const displayed=withProjects
    .filter(p=>{const name=`${p.firstName||''} ${p.lastName||''}`.toLowerCase();return name.includes(search.toLowerCase())||p.email.toLowerCase().includes(search.toLowerCase())})
    .filter(p=>!filterMajor||p.major===filterMajor)
    .filter(p=>!filterSkill||(p.skills||[]).includes(filterSkill))
    .sort((a,b)=>sortByPortfolio==='most'?b.projectCount-a.projectCount:a.projectCount-b.projectCount)
  const toggleFav=email=>setFavPortfolios(p=>p.includes(email)?p.filter(x=>x!==email):[...p,email])
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Explore All Portfolios</h2><p className="mt-1 text-sm text-slate-500">Search by name/email, filter by major/skills, sort by project count.</p></div>
<div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…"/>
        <select value={filterMajor} onChange={e=>setFilterMajor(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Majors</option>{majors.map(m=><option key={m}>{m}</option>)}
        </select>
        <select value={filterSkill} onChange={e=>setFilterSkill(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Skills</option>{allSkills.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={sortByPortfolio} onChange={e=>setSortByPortfolio(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="most">Most Projects</option>
          <option value="least">Least Projects</option>
        </select>
      </div>
      {displayed.length===0?<Card><EmptyState message="No student portfolios found."/></Card>:
        <div className="space-y-3">
          {displayed.map(p=>(
            <Card key={p.email}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {p.photo
  ? <img src={p.photo} alt="avatar" className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-blue-200"/>
  : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">{(p.firstName?.[0]||p.email[0]).toUpperCase()}</div>
}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                    <p className="text-sm text-slate-500">{p.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">{p.major&&<Badge color="blue">{p.major}</Badge>}<span className="text-xs text-slate-400">{p.projectCount} public project{p.projectCount!==1?'s':''}</span></div>
                    <div className="flex flex-wrap gap-1 mt-1">{(p.skills||[]).slice(0,4).map(s=><Badge key={s} color="slate">{s}</Badge>)}</div>
                  </div>
                </div>
<div className="flex gap-2 shrink-0">
                  <Btn size="sm" variant="secondary" onClick={()=>setSelected(p)}><Icon d={IC.eye} size={13}/>View Portfolio</Btn>
                  <Btn size="sm" variant="secondary" onClick={()=>{
                    setTab('messages')
                    // store target email so MessagesSection can auto-open it
                    LS.set('student_pending_message_target', p.email)
                  }}><Icon d={IC.chat} size={13}/>Message</Btn>
                  <button onClick={()=>toggleFav(p.email)} className={`rounded-lg p-1.5 transition ${favPortfolios.includes(p.email)?'text-red-500':'text-slate-300 hover:text-red-400'}`}><Icon d={IC.heart} size={16}/></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
      {selected&&(
        <Modal title={`${selected.firstName} ${selected.lastName}'s Portfolio`} onClose={()=>setSelected(null)} wide>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {selected.photo
  ? <img src={selected.photo} alt="avatar" className="h-14 w-14 rounded-full object-cover border-2 border-blue-200"/>
  : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">{(selected.firstName?.[0]||selected.email[0]).toUpperCase()}</div>
}
              <div><p className="font-semibold text-slate-900 text-lg">{selected.firstName} {selected.lastName}</p><p className="text-sm text-slate-500">{selected.email}</p>{selected.major&&<Badge color="blue">{selected.major}</Badge>}</div>
            </div>
            {selected.linkedin&&<a href={selected.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><Icon d={IC.link} size={13}/>{selected.linkedin}</a>}
            {(selected.skills||[]).length>0&&<div><p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p><div className="flex flex-wrap gap-1.5">{selected.skills.map(s=><Badge key={s}>{s}</Badge>)}</div></div>}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Public Projects ({selected.publicProjects.length})</p>
              {selected.publicProjects.length===0?<p className="text-sm text-slate-400">No public projects.</p>:
                <div className="space-y-2">{selected.publicProjects.map(proj=>(
                  <div key={proj.id} className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-slate-800">{proj.title}</p><Badge color="blue">{proj.course}</Badge>{proj.rating>0&&<Badge color="yellow">★ {proj.rating}/5</Badge>}</div>
                    {proj.description&&<p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{proj.description}</p>}
                    <div className="flex flex-wrap gap-1 mt-1">{(proj.languages||[]).map(l=><Badge key={l} color="slate">{l}</Badge>)}</div>
                  </div>
                ))}</div>
              }
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function FavoritesSection({ projects, favProjects, setFavProjects, favPortfolios, setFavPortfolios }) {
 const currentUser=getCurrentUser()
  const allUsers=LS.get('guc_projecthub_users',[]).filter(u=>u.role==='student'&&u.email!==currentUser?.email)
  const allProfiles=allUsers.map(u=>({...u,...LS.get('student_profile_'+u.email,{})}))
 const savedProjects=favProjects.map(id=>projects.find(p=>p.id===id)).filter(p=>p&&p.owner!==currentUser?.email)
  const savedPortfolios=favPortfolios.map(email=>{const p=allProfiles.find(x=>x.email===email);return p?{...p,projectCount:projects.filter(pr=>pr.owner===email&&pr.visibility==='public').length}:null}).filter(Boolean)
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">My Favorites</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold text-slate-800">Saved Projects ({savedProjects.length})</h3>
          {savedProjects.length===0?<Card><EmptyState message="No saved projects. Heart a project in Explore All Projects."/></Card>:
            <div className="space-y-2">{savedProjects.map(p=>(
              <Card key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="font-medium text-slate-800 truncate">{p.title}</p><div className="flex gap-1.5 mt-0.5"><Badge color="blue">{p.course}</Badge>{p.rating>0&&<Badge color="yellow">★ {p.rating}/5</Badge>}</div></div>
                <button onClick={()=>setFavProjects(prev=>prev.filter(id=>id!==p.id))} className="shrink-0 text-red-400 hover:text-red-600"><Icon d={IC.x} size={14}/></button>
              </Card>
            ))}</div>
          }
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-slate-800">Saved Portfolios ({savedPortfolios.length})</h3>
          {savedPortfolios.length===0?<Card><EmptyState message="No saved portfolios. Heart a portfolio in Explore All Portfolios."/></Card>:
            <div className="space-y-2">{savedPortfolios.map(p=>(
              <Card key={p.email} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{(p.firstName?.[0]||p.email[0]).toUpperCase()}</div>
                  <div className="min-w-0"><p className="font-medium text-slate-800 truncate">{p.firstName} {p.lastName}</p><p className="text-xs text-slate-400 truncate">{p.email} · {p.projectCount} projects</p></div>
                </div>
                <button onClick={()=>setFavPortfolios(prev=>prev.filter(e=>e!==p.email))} className="shrink-0 text-red-400 hover:text-red-600"><Icon d={IC.x} size={14}/></button>
              </Card>
            ))}</div>
          }
        </div>
      </div>
    </div>
  )
}

function RecommendedSection({ profile, projects, favProjects, setFavProjects }) {
  const myLangs=new Set(projects.filter(p=>p.owner===profile.email).flatMap(p=>p.languages||[]))
  const scored=projects.filter(p=>p.visibility==='public'&&p.owner!==profile.email).map(p=>{let score=0;(p.languages||[]).forEach(l=>{if(myLangs.has(l))score+=2});score+=(p.rating||0);return{...p,score}}).sort((a,b)=>b.score-a.score)
  const toggleFav=id=>setFavProjects(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Recommended Projects</h2><p className="mt-1 text-sm text-slate-500">Projects matching your programming languages.</p></div>
      {scored.length===0?<Card><EmptyState message="No recommendations yet. Add projects with languages to get personalized recommendations."/></Card>:
        <div className="space-y-3">{scored.slice(0,10).map(p=>(
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{p.title}</h3><Badge color="blue">{p.course}</Badge>{p.rating>0&&<Badge color="yellow">★ {p.rating}/5</Badge>}</div>
                {p.description&&<p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                <div className="flex flex-wrap gap-1">{(p.languages||[]).map(l=><Badge key={l} color={myLangs.has(l)?'green':'slate'}>{l}</Badge>)}</div>
                <p className="text-xs text-slate-400">By {p.owner}</p>
              </div>
              <button onClick={()=>toggleFav(p.id)} className={`shrink-0 rounded-lg p-1.5 transition ${favProjects.includes(p.id)?'text-red-500':'text-slate-300 hover:text-red-400'}`}><Icon d={IC.heart} size={16}/></button>
            </div>
          </Card>
        ))}</div>
      }
    </div>
  )
}

function MessagesSection({ profile, pushNotif }) {
  const [threads, setThreads]=useLS('student_messages_'+profile.email,[])
  const [active, setActive]=useState(null)
  const [newEmail, setNewEmail]=useState('')
  const [text, setText]=useState('')
  const [showNewThread, setShowNewThread]=useState(false)
  const bottomRef=useRef(null)
  const inputRef=useRef(null)

  const markThreadRead=(email)=>{
    // mark messages as read in state
    setThreads(p=>p.map(t=>t.with===email
      ?{...t,messages:t.messages.map(m=>m.from!==profile.email?{...m,read:true}:m)}
      :t
    ))
    // persist to localStorage
    const msgKey='student_messages_'+profile.email
    LS.set(msgKey,LS.get(msgKey,[]).map(t=>t.with===email
      ?{...t,messages:t.messages.map(m=>m.from!==profile.email?{...m,read:true}:m)}
      :t
    ))
    // mark related message notifications as read
    const notifKey='student_notifs_'+profile.email
    const notifs=LS.get(notifKey,[])
    const updated=notifs.map(n=>{
      const txt=(n.message||'').toLowerCase()
      const isMsg=txt.includes('message')||txt.includes('chat')
      const fromMatch=n.message?.includes(email)
      return (isMsg&&fromMatch)?{...n,read:true}:n
    })
    LS.set(notifKey,updated)
    // mark sender's outgoing messages as read (turns their checks blue)
    const senderKey='student_messages_'+email
    LS.set(senderKey,LS.get(senderKey,[]).map(t=>
      t.with===profile.email
        ?{...t,messages:t.messages.map(m=>m.from===email?{...m,read:true}:m)}
        :t
    ))
    // force a re-render of threads from localStorage so receipts update
    setThreads(LS.get('student_messages_'+profile.email,[]))
  }

  useEffect(()=>{
    const target=LS.get('student_pending_message_target',null)
    if(target){
      LS.set('student_pending_message_target',null)
      setThreads(p=>{
        if(!p.some(t=>t.with===target)) return[...p,{with:target,messages:[]}]
        return p
      })
      setActive(target)
      markThreadRead(target)
    }
  },[])

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:'smooth'})
  },[active,threads])

  useEffect(()=>{
    if(active) inputRef.current?.focus()
  },[active])

  const startThread=()=>{
    const em=newEmail.trim().toLowerCase()
    if(!em)return
    if(threads.some(t=>t.with===em)){
      setActive(em);markThreadRead(em)
    } else {
      setThreads(p=>[...p,{with:em,messages:[]}])
      setActive(em)
    }
    setNewEmail('');setShowNewThread(false)
  }

  const send=()=>{
    if(!text.trim()||!active)return
    const msg={id:Date.now().toString(),from:profile.email,text:text.trim(),at:new Date().toISOString(),read:false}
    setThreads(p=>p.map(t=>t.with===active?{...t,messages:[...t.messages,msg]}:t))
    const recipientKey='student_messages_'+active
    const recipientThreads=LS.get(recipientKey,[])
    const existingThread=recipientThreads.find(t=>t.with===profile.email)
    if(existingThread){
      LS.set(recipientKey,recipientThreads.map(t=>t.with===profile.email?{...t,messages:[...t.messages,msg]}:t))
    } else {
      LS.set(recipientKey,[...recipientThreads,{with:profile.email,messages:[msg]}])
    }
    LS.set('student_notifs_'+active,[...LS.get('student_notifs_'+active,[]),
      {id:Date.now().toString(),read:false,message:`New message from ${profile.email}.`,createdAt:new Date().toISOString()}
    ])
    pushNotif(`Message sent to ${active}.`)
    setText('')
  }

  const activeThread=threads.find(t=>t.with===active)
  const unreadCount=(email)=>threads.find(t=>t.with===email)?.messages.filter(m=>m.from!==profile.email&&!m.read).length||0
  const formatTime=(iso)=>new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  const formatDate=(iso)=>{
    const d=new Date(iso),today=new Date()
    if(d.toDateString()===today.toDateString())return 'Today'
    const y=new Date(today);y.setDate(today.getDate()-1)
    if(d.toDateString()===y.toDateString())return 'Yesterday'
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})
  }
  const grouped=(msgs=[])=>{
    const groups=[];let lastDate=''
    msgs.forEach(m=>{
      const label=formatDate(m.at)
      if(label!==lastDate){groups.push({type:'date',label});lastDate=label}
      groups.push({type:'msg',...m})
    })
    return groups
  }

  return (
<div className="flex h-[calc(100vh-8rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">

      {/* LEFT: Thread list */}
      <div className="flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3.5">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Messages</p>
          <button onClick={()=>setShowNewThread(p=>!p)} title="New conversation"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors">
            <Icon d={IC.plus} size={13}/>
          </button>
        </div>

       {showNewThread&&(
          <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 flex gap-1.5">
            <input autoFocus value={newEmail} onChange={e=>setNewEmail(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')startThread();if(e.key==='Escape')setShowNewThread(false)}}
              placeholder="Enter email address…"
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
            <button onClick={startThread}
              className="rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-800 transition-colors">
              Go
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {threads.length===0
?<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Icon d={IC.chat} size={18}/>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No conversations yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click + to start chatting</p>
            </div>
            :threads.map(t=>{
              const uc=unreadCount(t.with)
              const isActive=active===t.with
              const lastMsg=t.messages.at(-1)
              return (
<button key={t.with} onClick={()=>{setActive(t.with);markThreadRead(t.with)}}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 border-b border-slate-100 dark:border-slate-700/50
                    ${isActive?'bg-blue-700':'hover:bg-white dark:hover:bg-slate-800'}`}>
                  <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-150
                    ${isActive?'bg-blue-500 text-white':'bg-blue-100 text-blue-700'}`}>
                    {t.with[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`truncate text-xs font-semibold ${isActive?'text-white':uc>0?'text-slate-900':'text-slate-700'}`}>
                        {t.with}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {lastMsg&&(
                          <p className={`text-[10px] ${isActive?'text-blue-200':'text-slate-400'}`}>
                            {formatTime(lastMsg.at)}
                          </p>
                        )}
                        {/* unread badge — right side, disappears when read */}
                        {uc>0&&!isActive&&(
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white transition-all duration-200">
                            {uc>9?'9+':uc}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`truncate text-[11px] mt-0.5
                      ${isActive?'text-blue-200':uc>0?'font-semibold text-slate-800':'text-slate-400'}`}>
                      {lastMsg
                        ?(lastMsg.from===profile.email
                          ?<span className="text-slate-400">You: </span>
                          :'')
                        :''}
                      {lastMsg?lastMsg.text:'No messages yet'}
                    </p>
                  </div>
                </button>
              )
            })
          }
        </div>
      </div>

      {/* RIGHT: Chat window */}
      <div className="flex flex-1 flex-col min-w-0">
        {!activeThread
?<div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
              <Icon d={IC.chat} size={28}/>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">Select a conversation</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Choose from the left or start a new chat with the + button.</p>
            </div>
          </div>
          :<>
            {/* Chat header */}
<div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3.5 shrink-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-sm font-bold text-blue-700 dark:text-blue-300">
                {activeThread.with[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeThread.with}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{activeThread.messages.length} message{activeThread.messages.length!==1?'s':''}</p>
              </div>
            </div>

            {/* Scrollable messages */}
<div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 scroll-smooth bg-slate-50 dark:bg-slate-900/50">
              {activeThread.messages.length===0
                ?<div className="flex h-full items-center justify-center">
                  <p className="text-sm text-slate-400">Say hello 👋</p>
                </div>
                :grouped(activeThread.messages).map((item,idx)=>{
                  if(item.type==='date') return (
                    <div key={'d'+idx} className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-slate-200"/>
                      <span className="text-[10px] font-medium text-slate-400 px-2">{item.label}</span>
                      <div className="flex-1 h-px bg-slate-200"/>
                    </div>
                  )
                  const isMine=item.from===profile.email
                  const isRead=item.read===true
                  return (
                    <div key={item.id} className={`flex ${isMine?'justify-end':'justify-start'} mb-1`}>
                      {!isMine&&(
                        <div className="mr-2 flex h-6 w-6 shrink-0 self-end items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                          {item.from[0].toUpperCase()}
                        </div>
                      )}
                      <div className="max-w-xs lg:max-w-sm xl:max-w-md">
<div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                          ${isMine?'rounded-br-md bg-blue-700 text-white':'rounded-bl-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100'}`}>
                          <p className="break-words">{item.text}</p>
                        </div>
                        {/* timestamp + read receipt — only on outgoing */}
                        <div className={`mt-0.5 flex items-center gap-1 ${isMine?'justify-end':'justify-start'}`}>
                          <p className="text-[10px] text-slate-400">{formatTime(item.at)}</p>
                          {isMine&&(
                            <span title={isRead?'Seen':'Sent'} className="flex items-center transition-all duration-300">
                              {isRead
                                /* blue double check = seen */
                                ?<svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                                  <path d="M1 5l3 3 5-6" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M5 5l3 3 5-6" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                /* grey double check = delivered */
                                :<svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                                  <path d="M1 5l3 3 5-6" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M5 5l3 3 5-6" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              }
              <div ref={bottomRef}/>
            </div>

            {/* Fixed input bar */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <input ref={inputRef} value={text} onChange={e=>setText(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
                  placeholder={`Message ${activeThread.with.split('@')[0]}…`}
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"/>
                <button onClick={send} disabled={!text.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white transition-all hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                  <Icon d={IC.send} size={13}/>
                </button>
              </div>
<p className="mt-1.5 text-center text-[10px] text-slate-300 dark:text-slate-600">Press Enter to send</p>
            </div>
          </>
        }
      </div>
    </div>
  )
}

function InternshipsSection({ profile, pushNotif }) {
  const [applications, setApplications]=useLS('student_applications_'+profile.email,[])
  const [search, setSearch]=useState('')
  const [filterComp, setFilterComp]=useState('')
  const [filterDur, setFilterDur]=useState('')
  const [modal, setModal]=useState(null)
  const [selected, setSelected]=useState(null)
  const [coverLetter, setCoverLetter]=useState('')
  const [sortIntern, setSortIntern]=useState('newest')
  const getInternships = () => {
    const all = []
    const seen = new Set()
    const push = (item) => {
      if (!item || !item.id) return
      if (seen.has(item.id)) return
      seen.add(item.id)
      all.push(item)
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('employer_internships_')) {
        const list = LS.get(key, [])
        list.forEach((item) =>
          push({ ...item, companyEmail: key.replace('employer_internships_', '') }),
        )
      }
    }
    const catalog = LS.get('student_internships', [])
    if (Array.isArray(catalog)) {
      catalog.forEach((item) =>
        push({
          ...item,
          companyEmail: item.companyEmail || 'company@example.com',
          companyName: item.companyName || item.company || 'Company',
        }),
      )
    }
    if (all.length === 0) {
      return [
        {
          id: 'i1',
          title: 'Frontend Developer Intern',
          companyName: 'TechCorp',
          companyEmail: 'company@example.com',
          duration: '3 months',
          deadline: '2026-08-01',
          skills: ['React', 'JavaScript'],
          languages: ['JavaScript'],
          details: 'Work on our web apps.',
          postedAt: '2026-04-01',
          status: 'hiring',
          archived: false,
        },
        {
          id: 'i2',
          title: 'Data Science Intern',
          companyName: 'DataViz Co',
          companyEmail: 'dataviz@example.com',
          duration: '6 months',
          deadline: '2026-07-15',
          skills: ['Python', 'SQL'],
          languages: ['Python'],
          details: 'Build ML pipelines.',
          postedAt: '2026-03-20',
          status: 'hiring',
          archived: false,
        },
        {
          id: 'i3',
          title: 'Mobile Developer Intern',
          companyName: 'AppWorks',
          companyEmail: 'appworks@example.com',
          duration: '4 months',
          deadline: '2026-06-30',
          skills: ['Flutter'],
          languages: ['Dart'],
          details: 'Build mobile features.',
          postedAt: '2026-04-10',
          status: 'hiring',
          archived: false,
        },
      ]
    }
    return all.filter((i) => !i.archived)
  }
  const internships=getInternships()
  const companies=[...new Set(internships.map(i=>i.companyName||i.companyEmail))]
  const durations=[...new Set(internships.map(i=>i.duration))]
  const displayed=internships.filter(i=>{const comp=(i.companyName||i.companyEmail||'').toLowerCase();return i.title.toLowerCase().includes(search.toLowerCase())||comp.includes(search.toLowerCase())}).filter(i=>!filterComp||(i.companyName||i.companyEmail)===filterComp).filter(i=>!filterDur||i.duration===filterDur).sort((a,b)=>sortIntern==='oldest'?new Date(a.postedAt)-new Date(b.postedAt):new Date(b.postedAt)-new Date(a.postedAt))
  const getApp=id=>applications.find(a=>a.internshipId===id)
  const apply=()=>{
    if(!coverLetter.trim())return alert('Please write a cover letter.')
    const newApp={id:Date.now().toString(),internshipId:selected.id,studentEmail:profile.email,coverLetter,appliedAt:new Date().toISOString(),status:'pending'}
    setApplications(p=>[...p,newApp])
    const empKey='employer_applications_'+(selected.companyEmail||'company@example.com')
    LS.set(empKey,[...LS.get(empKey,[]),newApp])
    pushNotif(`Application submitted for "${selected.title}".`)
    setModal(null);setCoverLetter('')
  }
  const appStatuses=applications.map(a=>{const intern=internships.find(i=>i.id===a.internshipId);const empKey='employer_applications_'+(intern?.companyEmail||'');const empApps=LS.get(empKey,[]);const updated=empApps.find(e=>e.id===a.id);return updated?{...a,...updated}:a})
  const completedInternships=appStatuses.filter(a=>a.status==='accepted').map(a=>({...a,internship:internships.find(i=>i.id===a.internshipId)||{title:'Internship',companyName:'Company'}}))
  const stColor={pending:'yellow',nominated:'purple',accepted:'green',rejected:'red'}
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Internships</h2>
      {completedInternships.length>0&&(
        <Card className="border-green-200 bg-green-50">
          <p className="font-semibold text-green-800 mb-2">✓ Completed Internships on Portfolio</p>
          <div className="flex flex-wrap gap-2">{completedInternships.map(a=><Badge key={a.id} color="green">{a.internship.title} @ {a.internship.companyName||a.internship.companyEmail}</Badge>)}</div>
        </Card>
      )}
<div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or company…"/>
        <select value={filterComp} onChange={e=>setFilterComp(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Companies</option>{companies.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={filterDur} onChange={e=>setFilterDur(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All Durations</option>{durations.map(d=><option key={d}>{d}</option>)}
        </select>
        <select value={sortIntern} onChange={e=>setSortIntern(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
      {displayed.length===0?<Card><EmptyState message="No internships found."/></Card>:
        <div className="space-y-3">{displayed.map(intern=>{
          const app=getApp(intern.id)
          const updatedApp=appStatuses.find(a=>a.internshipId===intern.id)
          return (
            <Card key={intern.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{intern.title}</h3><Badge color="blue">{intern.companyName||intern.companyEmail}</Badge><Badge color="slate">{intern.duration}</Badge><Badge color={intern.status==='hiring'?'green':'slate'}>{intern.status==='hiring'?'Currently Hiring':'Position Filled'}</Badge></div>
                  {intern.details&&<p className="text-sm text-slate-500 line-clamp-2">{intern.details}</p>}
                  <div className="flex flex-wrap gap-1">{(intern.skills||[]).map(s=><Badge key={s} color="slate">{s}</Badge>)}{(intern.languages||[]).map(l=><Badge key={l} color="blue">{l}</Badge>)}</div>
                  <p className="text-xs text-slate-400">Posted {new Date(intern.postedAt).toLocaleDateString()} · Deadline {intern.deadline?new Date(intern.deadline).toLocaleDateString():'N/A'}</p>
                  {updatedApp&&<div className="flex items-center gap-2 pt-1"><span className="text-xs text-slate-500">Your application:</span><Badge color={stColor[updatedApp.status]||'slate'}>{updatedApp.status}</Badge></div>}
                </div>
                {!app?<Btn size="sm" onClick={()=>{setSelected(intern);setModal('apply')}}><Icon d={IC.briefcase} size={13}/>Apply</Btn>:<span className="text-xs text-slate-400 shrink-0">Applied {new Date(app.appliedAt).toLocaleDateString()}</span>}
              </div>
            </Card>
          )
        })}</div>
      }
      {modal==='apply'&&selected&&(
        <Modal title={`Apply — ${selected.title}`} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><p><strong>{selected.companyName||selected.companyEmail}</strong> · {selected.duration}</p>{selected.details&&<p className="text-slate-500 mt-1">{selected.details}</p>}</div>
            <Textarea label="Cover Letter *" value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} placeholder="Why do you think you're a good fit for this role?" rows={5}/>
          </div>
          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><Btn onClick={apply}><Icon d={IC.send} size={13}/>Submit Application</Btn><Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  )
}

function NotificationsSection({ notifications, setNotifications, profileEmail, setTab }) {
  const [notifsOn, setNotifsOn]=useLS('student_notifs_on_'+(profileEmail||'default'),true)
  const unread=notifications.filter(n=>!n.read).length
  const markAll=read=>setNotifications(p=>p.map(n=>({...n,read})))

  const resolveRoute=(n)=>{
    const msg=(n.message||'').toLowerCase()
    if(msg.includes('message')||msg.includes('chat')){
      const match=n.message?.match(/from\s+([\w.@+-]+@[\w.+-]+)/i)
        ||n.message?.match(/([\w.@+-]+@[\w.+-]+)/)
      if(match?.[1]){
        LS.set('student_pending_message_target',match[1])
        const key='student_messages_'+profileEmail
        LS.set(key,LS.get(key,[]).map(t=>
          t.with===match[1]
            ?{...t,messages:t.messages.map(m=>m.from!==profileEmail?{...m,read:true}:m)}
            :t
        ))
      }
      return 'messages'
    }
    if(msg.includes('invitation')||msg.includes('invited')||msg.includes('collab'))return 'invitations'
    if(msg.includes('internship')||msg.includes('application')||msg.includes('job')||msg.includes('hiring'))return 'internships'
    if(msg.includes('appeal')||msg.includes('project'))return 'projects'
    return null
  }

  const handleClick=(n)=>{
    setNotifications(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))
    const dest=resolveRoute(n)
    if(dest)setTab(dest)
  }

  const iconFor=(n)=>{
    const msg=(n.message||'').toLowerCase()
    if(msg.includes('message')||msg.includes('chat'))return{d:IC.chat,bg:'bg-blue-100 text-blue-600'}
    if(msg.includes('invitation')||msg.includes('invited'))return{d:IC.users,bg:'bg-purple-100 text-purple-600'}
    if(msg.includes('internship')||msg.includes('application')||msg.includes('job'))return{d:IC.briefcase,bg:'bg-green-100 text-green-600'}
    if(msg.includes('appeal')||msg.includes('project'))return{d:IC.folder,bg:'bg-amber-100 text-amber-600'}
    return{d:IC.bell,bg:'bg-slate-100 text-slate-500'}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
          {unread>0&&<p className="mt-0.5 text-sm text-slate-500">{unread} unread</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn size="sm" variant="secondary" onClick={()=>markAll(true)}>Mark all read</Btn>
          <Btn size="sm" variant="secondary" onClick={()=>markAll(false)}>Mark all unread</Btn>
          <Btn size="sm" variant={notifsOn?'danger':'success'} onClick={()=>setNotifsOn(p=>!p)}>
            <Icon d={IC.bell} size={13}/>{notifsOn?'Turn Off':'Turn On'}
          </Btn>
        </div>
      </div>

      {!notifsOn&&(
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          🔕 Notifications are turned off. New notifications will not be received.
        </div>
      )}

      {notifications.length===0
        ?<Card><EmptyState message="No notifications yet."/></Card>
        :<div className="space-y-1.5">
          {notifications.slice().reverse().map(n=>{
            const {d,bg}=iconFor(n)
            const dest=resolveRoute(n)
            const isClickable=!!dest
            return (
              <div
                key={n.id}
                onClick={()=>handleClick(n)}
                className={`group flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150
                  ${n.read?'border-slate-200 bg-white':'border-blue-200 bg-blue-50/60'}
                  ${isClickable?'cursor-pointer hover:border-blue-300 hover:shadow-sm hover:bg-blue-50 active:scale-[0.995]':'cursor-default'}`}>
                {/* category icon */}
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} transition-transform duration-150 ${isClickable?'group-hover:scale-105':''}`}>
                  <Icon d={d} size={14}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.read?'text-slate-500':'text-slate-800 font-medium'}`}>
                    {n.message}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                    </p>
                    {isClickable&&(
                      <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        Click to open →
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.read&&<span className="h-2 w-2 rounded-full bg-blue-600"/>}
                  <button
                    onClick={e=>{e.stopPropagation();setNotifications(p=>p.map(x=>x.id===n.id?{...x,read:!x.read}:x))}}
                    className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    {n.read?'Unread':'Read'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      }
    </div>
  )
}

function StatsSection({ projects, profile }) {
  const myProjects=projects.filter(p=>p.owner===profile.email)
  const langs={}
  myProjects.forEach(p=>(p.languages||[]).forEach(l=>{langs[l]=(langs[l]||0)+1}))
  const total=Object.values(langs).reduce((a,b)=>a+b,0)||1
  const colMap={}
  myProjects.forEach(p=>(p.collaborators||[]).filter(c=>c.status==='accepted').forEach(c=>{colMap[c.email]=(colMap[c.email]||0)+1}))
  const topCollabs=Object.entries(colMap).sort((a,b)=>b[1]-a[1]).slice(0,5)
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">My Statistics </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {[{label:'Total Projects',value:myProjects.length},{label:'Public Projects',value:myProjects.filter(p=>p.visibility==='public').length},{label:'Collaborators',value:Object.keys(colMap).length}].map(s=>(
          <Card key={s.label} className="text-center"><p className="text-4xl font-bold text-blue-700">{s.value}</p><p className="mt-1 text-sm text-slate-500">{s.label}</p></Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-slate-800">Languages Used (%)</h3>
          {Object.keys(langs).length===0?<EmptyState message="No language data yet."/>:
            <div className="space-y-3">{Object.entries(langs).sort((a,b)=>b[1]-a[1]).map(([lang,count])=>(
              <div key={lang}><div className="flex justify-between mb-1 text-sm"><span className="font-medium text-slate-700">{lang}</span><span className="text-slate-400">{Math.round(count/total*100)}%</span></div>
              <div className="h-2.5 w-full rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-blue-600" style={{width:`${Math.round(count/total*100)}%`}}/></div></div>
            ))}</div>
          }
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold text-slate-800">Top Collaborators per Project</h3>
          {topCollabs.length===0?<EmptyState message="No accepted collaborators yet."/>:
            <ul className="space-y-2">{topCollabs.map(([email,count])=>(
              <li key={email} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{email[0].toUpperCase()}</div><span className="text-sm text-slate-700">{email}</span></div>
                <Badge color="blue">{count} project{count>1?'s':''}</Badge>
              </li>
            ))}</ul>
          }
        </Card>
      </div>
    </div>
  )
}

function SettingsSection({ profile, rawUser, initialTab='appearance' }) {
  const [darkMode, setDarkMode]=useState(()=>LS.get(THEME_KEY, false))
  // sync to global state when changed from settings
  const handleThemeChange=(val)=>{
    setDarkMode(val)
    applyTheme(val)
    LS.set(THEME_KEY, val)
    LS.set('student_dark_mode_'+rawUser.email, val)
  }
  const [msgNotifs, setMsgNotifs]=useLS('student_setting_msg_notifs_'+rawUser.email, true)
  const [internNotifs, setInternNotifs]=useLS('student_setting_intern_notifs_'+rawUser.email, true)
  const [collabNotifs, setCollabNotifs]=useLS('student_setting_collab_notifs_'+rawUser.email, true)
  const [profilePublic, setProfilePublic]=useLS('student_setting_profile_public_'+rawUser.email, true)
  const [cooldown, setCooldown]=useState(false)
  const [cooldownCount, setCooldownCount]=useState(5)
  const [tab, setTab]=useState(initialTab)

  // sync if initialTab changes (from dropdown navigation)
  useEffect(()=>{ setTab(initialTab) },[initialTab])

  const startCooldown=()=>{
    setCooldown(true);setCooldownCount(5)
    const t=setInterval(()=>setCooldownCount(c=>{
      if(c<=1){clearInterval(t);setTimeout(()=>setCooldown(false),400);return 0}
      return c-1
    }),1000)
  }

  

  const settingsTabs=[
    {id:'appearance',label:'Appearance',icon:IC.moon},
    {id:'notifications',label:'Notifications',icon:IC.bell},
    {id:'wellness',label:'Wellness',icon:IC.zap},
    {id:'account',label:'Account',icon:IC.shield},
  ]

  const Toggle=({value,onChange,label,desc})=>(
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {desc&&<p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <button onClick={()=>onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none
          ${value?'bg-blue-600':'bg-slate-200 dark:bg-slate-600'}`}>
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200
          ${value?'translate-x-5':'translate-x-0'}`}/>
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Cooldown overlay */}
      {cooldown&&(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping"/>
              <div className="absolute inset-2 rounded-full border-2 border-blue-300/50"/>
              <span className="text-4xl font-bold text-white">{cooldownCount}</span>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-light text-white tracking-wide">Take a breath</p>
              <p className="text-sm text-blue-200">Inhale slowly… exhale gently…</p>
            </div>
            <div className="h-1 w-48 rounded-full bg-slate-700">
              <div className="h-1 rounded-full bg-blue-400 transition-all duration-1000"
                style={{width:`${(cooldownCount/5)*100}%`}}/>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account preferences and platform experience.</p>
      </div>

      <div className="flex gap-6">
        {/* Settings sub-nav */}
        <div className="w-44 shrink-0 space-y-0.5">
          {settingsTabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                ${tab===t.id
                  ?'bg-blue-700 text-white shadow-sm'
                  :'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700'}`}>
              <Icon d={t.icon} size={14}/>{t.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">

          {/* ── Appearance ── */}
          {tab==='appearance'&&(
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Appearance</h3>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Choose your preferred theme for ProjectHub.</p>
              </div>

              {/* Visual theme selector — ONLY control */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Theme</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Light theme card */}
                  <button onClick={()=>handleThemeChange(false)}
                    className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200
                      ${!darkMode
                        ?'border-blue-600 shadow-md shadow-blue-100'
                        :'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                    {/* Preview mockup */}
                    <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-slate-200"/>
                        <div className="h-1.5 w-16 rounded bg-slate-200"/>
                        <div className="ml-auto h-1.5 w-8 rounded bg-blue-200"/>
                      </div>
                      <div className="flex gap-2 p-2">
                        <div className="w-8 space-y-1">
                          <div className="h-1.5 rounded bg-blue-100"/>
                          <div className="h-1.5 rounded bg-slate-100"/>
                          <div className="h-1.5 rounded bg-slate-100"/>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="h-6 rounded-lg bg-blue-100"/>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="h-4 rounded bg-slate-100"/>
                            <div className="h-4 rounded bg-slate-100"/>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Light</p>
                        <p className="text-xs text-slate-400">Clean and bright</p>
                      </div>
                      {!darkMode&&(
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                          <Icon d={IC.check} size={11}/>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Dark theme card */}
                  <button onClick={()=>handleThemeChange(true)}
                    className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200
                      ${darkMode
                        ?'border-blue-600 shadow-md shadow-blue-900/30'
                        :'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                    {/* Preview mockup */}
                    <div className="mb-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
                      <div className="flex items-center gap-1.5 border-b border-slate-700 bg-slate-800 px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-slate-600"/>
                        <div className="h-1.5 w-16 rounded bg-slate-600"/>
                        <div className="ml-auto h-1.5 w-8 rounded bg-blue-700"/>
                      </div>
                      <div className="flex gap-2 p-2">
                        <div className="w-8 space-y-1">
                          <div className="h-1.5 rounded bg-blue-900"/>
                          <div className="h-1.5 rounded bg-slate-700"/>
                          <div className="h-1.5 rounded bg-slate-700"/>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="h-6 rounded-lg bg-blue-900"/>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="h-4 rounded bg-slate-700"/>
                            <div className="h-4 rounded bg-slate-700"/>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Dark</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Easy on the eyes</p>
                      </div>
                      {darkMode&&(
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                          <Icon d={IC.check} size={11}/>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Current theme indicator */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 px-4 py-3">
                <Icon d={darkMode?IC.moon:IC.sun} size={14}/>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Currently using <span className="font-semibold">{darkMode?'Dark':'Light'}</span> mode
                </p>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab==='notifications'&&(
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h3 className="mb-0.5 font-semibold text-slate-900 dark:text-white">Notification Preferences</h3>
              <p className="mb-5 text-xs text-slate-400 dark:text-slate-500">Choose which notifications you want to receive.</p>
              <Toggle value={msgNotifs} onChange={setMsgNotifs} label="Message Notifications" desc="Get notified when someone sends you a message"/>
              <Toggle value={internNotifs} onChange={setInternNotifs} label="Internship Alerts" desc="Updates on applications and new listings"/>
              <Toggle value={collabNotifs} onChange={setCollabNotifs} label="Collaboration Invites" desc="Project invitations and team requests"/>
            </div>
          )}

          {/* ── Wellness ── */}
          {tab==='wellness'&&(
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Wellness & Focus</h3>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Tools to help you stay calm and focused.</p>
              </div>
              <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-5 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <Icon d={IC.zap} size={24}/>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">5-Second Cooldown</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Feeling overwhelmed? A calming overlay will guide you through a quick breathing reset.
                  </p>
                </div>
                <button onClick={startCooldown}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 active:scale-95 transition-all">
                  <Icon d={IC.zap} size={14}/>Start Cooldown
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">💡 Wellness Tips</p>
                <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <li>• Take short breaks every 25 minutes (Pomodoro method)</li>
                  <li>• Stay hydrated — keep water nearby while studying</li>
                  <li>• Use the schedule to avoid last-minute deadline stress</li>
                  <li>• Reach out to collaborators early on projects</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── Account ── */}
          {tab==='account'&&(
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Account Settings</h3>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Manage your account security and visibility.</p>
              </div>
              <Toggle value={profilePublic} onChange={setProfilePublic} label="Public Profile" desc="Allow other students to view your portfolio"/>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Account Info</p>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Email</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{rawUser.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Role</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">Student</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">University</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">GUC</span>
                  </div>
                </div>
                <div className="rounded-lg border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Danger Zone</p>
                  <p className="text-xs text-red-500 dark:text-red-500">To reset your account data, clear browser localStorage for this site.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


function ScheduleSection({ profile }) {
  const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday']
  const HOURS=['8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
  const [events, setEvents]=useLS('student_schedule_'+profile.email,[])
  const [modal, setModal]=useState(false)
  const [form, setForm]=useState({title:'',day:'Sunday',time:'8:00',duration:1,type:'class',location:'',notes:''})
  const TYPES=['class','deadline','interview','meeting','reminder']
  const typeColor={
    class:'bg-blue-100 text-blue-700 border-blue-200',
    deadline:'bg-red-100 text-red-700 border-red-200',
    interview:'bg-purple-100 text-purple-700 border-purple-200',
    meeting:'bg-green-100 text-green-700 border-green-200',
    reminder:'bg-amber-100 text-amber-700 border-amber-200',
  }
  const typeDot={
    class:'bg-blue-500',deadline:'bg-red-500',interview:'bg-purple-500',meeting:'bg-green-500',reminder:'bg-amber-500'
  }
  const save=()=>{
    if(!form.title.trim())return alert('Event title required.')
    setEvents(p=>[...p,{...form,id:Date.now().toString(),createdAt:new Date().toISOString()}])
    setForm({title:'',day:'Sunday',time:'8:00',duration:1,type:'class',location:'',notes:''})
    setModal(false)
  }
  const del=id=>setEvents(p=>p.filter(e=>e.id!==id))

  const todayName=DAYS[new Date().getDay()]||'Sunday'
  const todayEvents=events.filter(e=>e.day===todayName).sort((a,b)=>a.time.localeCompare(b.time))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Schedule</h2>
          <p className="mt-1 text-sm text-slate-500">Weekly timetable, deadlines, and upcoming events.</p>
        </div>
        <Btn onClick={()=>setModal(true)}><Icon d={IC.plus}/>Add Event</Btn>
      </div>

      {/* Today's agenda strip */}
      <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Today — {todayName}</p>
        {todayEvents.length===0
          ?<p className="text-sm text-slate-400 dark:text-slate-500">Nothing scheduled for today. Enjoy your free time! 🎉</p>
          :<div className="flex flex-wrap gap-2">
            {todayEvents.map(e=>(
              <div key={e.id} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${typeColor[e.type]}`}>
                <span>{e.time}</span>
                <span className="font-semibold">{e.title}</span>
                {e.location&&<span className="opacity-60">· {e.location}</span>}
              </div>
            ))}
          </div>
        }
      </div>

      {/* Weekly grid */}
     <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              <th className="w-16 py-3 px-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500">Time</th>
              {DAYS.map(d=>(
                <th key={d} className={`py-3 px-2 text-center text-xs font-semibold ${d===todayName?'text-blue-700':'text-slate-600'}`}>
                  {d.slice(0,3)}
                  {d===todayName&&<span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] text-white">Today</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
{HOURS.map(h=>(
              <tr key={h} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-2 px-3 text-xs text-slate-400 dark:text-slate-500 font-mono">{h}</td>
                {DAYS.map(d=>{
                  const ev=events.filter(e=>e.day===d&&e.time===h)
                  return (
                    <td key={d} className="py-1.5 px-2 text-center align-top">
                      {ev.map(e=>(
                        <div key={e.id}
                          className={`mb-1 rounded-lg border px-2 py-1 text-xs text-left cursor-default group relative ${typeColor[e.type]}`}>
                          <p className="font-semibold truncate">{e.title}</p>
                          {e.location&&<p className="opacity-60 truncate">{e.location}</p>}
                          <button onClick={()=>del(e.id)}
                            className="absolute right-1 top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-red-400 hover:text-red-600">
                            <Icon d={IC.x} size={10}/>
                          </button>
                        </div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upcoming list */}
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-800">All Upcoming Events</p>
        {events.length===0
          ?<Card><EmptyState message="No events yet. Add your classes, deadlines, and meetings."/></Card>
          :<div className="space-y-2">
            {[...events].sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||a.time.localeCompare(b.time)).map(e=>(
<div key={e.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${typeDot[e.type]}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{e.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{e.day} · {e.time}{e.location&&` · ${e.location}`}</p>
                </div>
                <Badge color={e.type==='class'?'blue':e.type==='deadline'?'red':e.type==='interview'?'purple':e.type==='meeting'?'green':'yellow'}>
                  {e.type}
                </Badge>
                <button onClick={()=>del(e.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                  <Icon d={IC.trash} size={13}/>
                </button>
              </div>
            ))}
          </div>
        }
      </div>

      {/* Add event modal */}
      {modal&&(
        <Modal title="Add Schedule Event" onClose={()=>setModal(false)}>
          <div className="space-y-4">
            <Input label="Event Title *" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. CSEN 401 Lecture"/>
            <div className="grid gap-3 sm:grid-cols-2">
              <Sel label="Day" value={form.day} onChange={e=>setForm(p=>({...p,day:e.target.value}))}>
                {DAYS.map(d=><option key={d}>{d}</option>)}
              </Sel>
              <Sel label="Time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}>
                {HOURS.map(h=><option key={h}>{h}</option>)}
              </Sel>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Sel label="Type" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </Sel>
              <Input label="Duration (hours)" type="number" min={1} max={4} value={form.duration}
                onChange={e=>setForm(p=>({...p,duration:+e.target.value}))}/>
            </div>
            <Input label="Location (optional)" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Hall C3, Online"/>
            <Textarea label="Notes (optional)" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Any extra details…"/>
          </div>
          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
            <Btn onClick={save}><Icon d={IC.check}/>Save Event</Btn>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const navigate=useNavigate()
  const rawUser=getCurrentUser()
  if(!rawUser||rawUser.role!=='student'){navigate('/login');return null}
  seedAcademicPlatformDemoData()
  const [tab, setTab]=useState('overview')
  const [sidebarOpen, setSidebar]=useState(false)
  const [profile, setProfileLS]=useLS('student_profile_'+rawUser.email,{firstName:rawUser.firstName||'',lastName:rawUser.lastName||'',email:rawUser.email,major:rawUser.major||'',linkedin:'',skills:[]})
  const [projects, setProjectsLS]=useLS('student_projects',[])
  const [notifications, setNotificationsLS]=useLS('student_notifs_'+rawUser.email,[])
  const [favProjects, setFavProjectsLS]=useLS('student_fav_projects_'+rawUser.email,[])
  const [favPortfolios, setFavPortfoliosLS]=useLS('student_fav_portfolios_'+rawUser.email,[])
  const setProfile=v=>setProfileLS(v)
  const setProjects=fn=>setProjectsLS(typeof fn==='function'?fn(projects):fn)
  const setNotifications=fn=>setNotificationsLS(typeof fn==='function'?fn(notifications):fn)
  const setFavProjects=fn=>setFavProjectsLS(typeof fn==='function'?fn(favProjects):fn)
  const setFavPortfolios=fn=>setFavPortfoliosLS(typeof fn==='function'?fn(favPortfolios):fn)
  const notifsEnabled=LS.get('student_notifs_on_'+rawUser.email,true)
const pushNotif=msg=>{if(!notifsEnabled)return;setNotificationsLS(p=>[...p,{id:Date.now().toString(),message:msg,read:false,createdAt:new Date().toISOString()}])}
  const unread=notifications.filter(n=>!n.read).length
  const invites=projects.filter(p=>(p.collaborators||[]).some(c=>c.email===rawUser.email&&c.status==='pending')).length
const navItems=[
    {id:'overview',label:'Overview',icon:IC.home},
    {id:'notifications',label:'Notifications',icon:IC.bell,badge:unread},
    {id:'projects',label:'My Projects',icon:IC.folder},
    {id:'schedule',label:'Schedule',icon:IC.calendar},
    {id:'invitations',label:'Invitations',icon:IC.users,badge:invites},
    {id:'instructors',label:'Find Instructors',icon:IC.book},
    {id:'portfolios',label:'Explore All Portfolios',icon:IC.users},
    {id:'favorites',label:'Favorites',icon:IC.heart},
    {id:'recommended',label:'Recommended',icon:IC.star},
    {id:'internships',label:'Internships',icon:IC.briefcase},
    // explore accessible via hero CTA; stats moved to profile dropdown
  ]
  const handleLogout=()=>{logoutUser();navigate('/login')}
 const [profileDropdown, setProfileDropdown]=useState(false)
  const [settingsTab, setSettingsTab]=useState('appearance')
  const [msgDropdown, setMsgDropdown]=useState(false)
  const [notifDropdown, setNotifDropdown]=useState(false)
  const profileRef=useRef(null)
  const msgRef=useRef(null)
  const notifRef=useRef(null)

  useEffect(()=>{
    const handler=(e)=>{
      if(profileRef.current&&!profileRef.current.contains(e.target))setProfileDropdown(false)
      if(msgRef.current&&!msgRef.current.contains(e.target))setMsgDropdown(false)
      if(notifRef.current&&!notifRef.current.contains(e.target))setNotifDropdown(false)
    }
    document.addEventListener('mousedown',handler)
    return()=>document.removeEventListener('mousedown',handler)
  },[])

  const recentThreads=(()=>{
    const threads=LS.get('student_messages_'+rawUser.email,[])
    return threads.filter(t=>t.messages.length>0).slice(0,4)
  })()

  const NavContent=()=>(
    <>
{/* Sidebar top spacer to align with header height */}
      <div className="mb-4 mt-1 px-2">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Workspace
        </p>
        <div className="flex items-center gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 px-3 py-2.5 border border-blue-100 dark:border-blue-900">
          {profile.photo
            ?<img src={profile.photo} alt="avatar" className="h-8 w-8 shrink-0 rounded-full object-cover border-2 border-blue-200"/>
            :<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
              {(profile.firstName||rawUser.firstName||'S')[0].toUpperCase()}
            </div>
          }
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {profile.firstName||rawUser.firstName} {profile.lastName||rawUser.lastName}
            </p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500 leading-tight">Student · GUC</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5">
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>{setTab(item.id);setSidebar(false)}}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
              ${tab===item.id
                ?'bg-blue-700 text-white shadow-sm'
                :'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 hover:translate-x-0.5'}`}>
            <Icon d={item.icon} size={16}/>
            <span>{item.label}</span>
            {item.badge>0&&(
              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold
                ${tab===item.id?'bg-white text-blue-700':'bg-red-500 text-white'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-4 border-t border-slate-100 pt-4 space-y-0.5">
        <button onClick={()=>{setTab('profile');setSidebar(false)}}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
            ${tab==='profile'?'bg-blue-700 text-white':'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 hover:translate-x-0.5'}`}>
          <Icon d={IC.user} size={16}/><span>My Profile</span>
        </button>
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-150 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">
          <Icon d={IC.logout} size={16}/><span>Logout</span>
        </button>
      </div>
    </>
  )

  const p={...profile,email:rawUser.email}
  const [darkMode, setDarkModeMain]=useState(()=>LS.get(THEME_KEY, false))
  useEffect(()=>{
    applyTheme(darkMode)
    LS.set(THEME_KEY, darkMode)
    // also write to per-user key so SettingsSection reads it
    LS.set('student_dark_mode_'+rawUser.email, darkMode)
  },[darkMode])
  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${darkMode?'bg-slate-900':'bg-slate-50'}`}>
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-5 md:flex overflow-y-auto">
        <NavContent/>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen&&(
        <div className="fixed inset-0 z-40 md:hidden" onClick={()=>setSidebar(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
<aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-5"
            onClick={e=>e.stopPropagation()}>
            <NavContent/>
          </aside>
        </div>
      )}

    {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header — fixed, never scrolls */}
        <header className="shrink-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-3">
{/* Left: Logo + Hamburger (mobile) + Page title */}
          <div className="flex items-center gap-3">

            {/* Hamburger — mobile only */}
            <button onClick={()=>setSidebar(true)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 md:hidden">
              <Icon d={IC.menu} size={18}/>
            </button>

            {/* Brand logo — always visible, navigates to home */}
            <button
              onClick={()=>navigate('/')}
              className="flex items-center gap-2 rounded-lg px-2 py-1 transition-all duration-150 hover:opacity-80 hover:bg-slate-50 group">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-700 shadow-sm group-hover:shadow-md transition-shadow duration-150">
                <Icon d={IC.folder} size={14}/>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 hidden sm:block">
                  BI × ENG V2
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  ProjectHub
                </span>
              </div>
            </button>

{/* Breadcrumb — desktop only */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-slate-300 text-sm select-none">/</span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 select-none">Dashboard</span>
              <span className="text-slate-300 dark:text-slate-600 text-sm select-none">/</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">
                {navItems.find(n=>n.id===tab)?.label
                  || (tab==='profile'?'My Profile'
                  : tab==='explore'?'Explore Projects'
                  : tab==='create-project'?'New Project'
                  : tab)}
              </span>
            </div>

          </div>

          {/* Right: Messages, Notifications, Avatar */}
          <div className="flex items-center gap-1">

{/* Messages */}
            <div className="relative" ref={msgRef}>
              <button onClick={()=>{setMsgDropdown(p=>!p);setNotifDropdown(false);setProfileDropdown(false)}}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                <Icon d={IC.chat} size={18}/>
{(()=>{
                  const allThreads=LS.get('student_messages_'+rawUser.email,[])
                  const unreadMsgs=allThreads.reduce((acc,t)=>acc+t.messages.filter(m=>m.from!==rawUser.email&&!m.read).length,0)
                  return unreadMsgs>0?(
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm transition-all duration-200">
                      {unreadMsgs>9?'9+':unreadMsgs}
                    </span>
                  ):null
                })()}
              </button>
              {msgDropdown&&(
                <div className="absolute right-0 top-11 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Messages</p>
                    <button onClick={()=>{setTab('messages');setMsgDropdown(false)}}
                      className="text-xs text-blue-500 hover:underline">Open</button>
                  </div>
                  {recentThreads.length===0
                    ?<p className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">No messages yet.</p>
                    :<ul className="divide-y divide-slate-100 dark:divide-slate-700">
                      {recentThreads.map(t=>(
                        <li key={t.with}>
                          <button onClick={()=>{
                            LS.set('student_pending_message_target',t.with)
                            const key='student_messages_'+rawUser.email
                            LS.set(key,LS.get(key,[]).map(th=>th.with===t.with?{...th,messages:th.messages.map(m=>m.from!==rawUser.email?{...m,read:true}:m)}:th))
                            setTab('messages')
                            setMsgDropdown(false)
                          }} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-xs font-bold text-blue-700 dark:text-blue-300">
                              {t.with[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">{t.with}</p>
                              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{t.messages.at(-1)?.text||'No messages'}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  }
                  <div className="border-t border-slate-100 dark:border-slate-700 p-2">
                    <button onClick={()=>{setTab('messages');setMsgDropdown(false)}}
                      className="w-full rounded-lg py-2 text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      View all messages
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={()=>{setNotifDropdown(p=>!p);setMsgDropdown(false);setProfileDropdown(false)}}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                <Icon d={IC.bell} size={18}/>
                {unread>0&&(
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unread>9?'9+':unread}
                  </span>
                )}
              </button>
              {notifDropdown&&(
                <div className="absolute right-0 top-11 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                    <div className="flex items-center gap-2">
                      {unread>0&&(
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                          {unread} new
                        </span>
                      )}
                      {unread>0&&(
                        <button
                          onClick={()=>setNotifications(p=>p.map(n=>({...n,read:true})))}
                          className="text-xs text-slate-400 hover:text-blue-600 transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

{notifications.length===0
                    ?<p className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">No notifications yet.</p>
                    :<ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                      {notifications.slice().reverse().slice(0,6).map(n=>{
                        // ── route resolver ──────────────────────────────
                        const msg=n.message?.toLowerCase()||''
                        const goTo=()=>{
                          // mark as read
                          setNotifications(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))
                          setNotifDropdown(false)
                          // route by keyword
                          if(msg.includes('message')||msg.includes('chat')){
                            const match=n.message?.match(/from\s+([\w.@+-]+@[\w.+-]+)/i)
                              ||n.message?.match(/([\w.@+-]+@[\w.+-]+)/)
                            if(match?.[1]){
                              LS.set('student_pending_message_target',match[1])
                              // mark that thread as read in localStorage immediately
                              const key='student_messages_'+rawUser.email
                              LS.set(key,LS.get(key,[]).map(th=>
                                th.with===match[1]
                                  ?{...th,messages:th.messages.map(m=>m.from!==rawUser.email?{...m,read:true}:m)}
                                  :th
                              ))
                            }
                            setTab('messages')
                          } else if(msg.includes('invitation')||msg.includes('invited')||msg.includes('collab')){
                            setTab('invitations')
                          } else if(msg.includes('internship')||msg.includes('application')||msg.includes('job')||msg.includes('hiring')){
                            setTab('internships')
                          } else if(msg.includes('appeal')){
                            setTab('projects')
                          } else if(msg.includes('project')){
                            setTab('projects')
                          } else if(msg.includes('notification')){
                            setTab('notifications')
                          } else {
                            setTab('notifications')
                          }
                        }
                        // ── icon resolver ────────────────────────────────
                        const iconD=
                          msg.includes('message')||msg.includes('chat')?IC.chat:
                          msg.includes('invitation')||msg.includes('invited')?IC.users:
                          msg.includes('internship')||msg.includes('application')||msg.includes('job')?IC.briefcase:
                          msg.includes('project')||msg.includes('appeal')?IC.folder:
                          IC.bell
                        const iconBg=
                          msg.includes('message')||msg.includes('chat')?'bg-blue-100 text-blue-600':
                          msg.includes('invitation')||msg.includes('invited')?'bg-purple-100 text-purple-600':
                          msg.includes('internship')||msg.includes('application')||msg.includes('job')?'bg-green-100 text-green-600':
                          msg.includes('project')||msg.includes('appeal')?'bg-amber-100 text-amber-600':
                          'bg-slate-100 text-slate-500'
                        return (
                          <li key={n.id}>
                           <button
                              onClick={goTo}
                              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150
                                ${n.read
                                  ?'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                                  :'bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}>
                              {/* category icon */}
                              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                                <Icon d={iconD} size={12}/>
                              </div>
<div className="min-w-0 flex-1">
                                <p className={`text-xs leading-snug ${n.read?'text-slate-500 dark:text-slate-400':'text-slate-800 dark:text-slate-200 font-medium'}`}>
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                  {new Date(n.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                                </p>
                              </div>
                              {/* unread dot */}
                              {!n.read&&(
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600 transition-all duration-200"/>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  }

                  <div className="border-t border-slate-100 dark:border-slate-700 p-2 flex gap-1">
                    <button
                      onClick={()=>{setTab('notifications');setNotifDropdown(false)}}
                      className="flex-1 rounded-lg py-2 text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-1 h-6 w-px bg-slate-200"/>

            {/* Avatar / Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={()=>{setProfileDropdown(p=>!p);setMsgDropdown(false);setNotifDropdown(false)}}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 transition-colors">
                {profile.photo
                  ?<img src={profile.photo} alt="avatar" className="h-8 w-8 rounded-full object-cover border-2 border-blue-200"/>
                  :<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                    {(profile.firstName||rawUser.firstName||'S')[0].toUpperCase()}
                  </div>
                }
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{profile.firstName||rawUser.firstName}</p>
                  <p className="text-xs text-slate-400 leading-tight">Student</p>
                </div>
                <svg className="hidden sm:block h-3 w-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {profileDropdown&&(
                <div className="absolute right-0 top-11 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 z-50">
                  <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{profile.firstName||rawUser.firstName} {profile.lastName||rawUser.lastName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{rawUser.email}</p>
                  </div>
                 <div className="p-1.5 space-y-0.5">
                    <button onClick={()=>{setTab('profile');setProfileDropdown(false)}}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Icon d={IC.user} size={14}/>My Profile
                    </button>
                    <button onClick={()=>{setTab('settings');setSettingsTab('appearance');setProfileDropdown(false)}}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Icon d={IC.moon} size={14}/>Appearance
                    </button>
                    <button onClick={()=>{setTab('settings');setSettingsTab('notifications');setProfileDropdown(false)}}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Icon d={IC.bell} size={14}/>Notifications
                    </button>
                    <button onClick={()=>{setTab('settings');setSettingsTab('wellness');setProfileDropdown(false)}}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Icon d={IC.zap} size={14}/>Wellness
                    </button>
                    <button onClick={()=>{setTab('stats');setProfileDropdown(false)}}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Icon d={IC.chart} size={14}/>Statistics
                    </button>
                  </div>
                  <div className="border-t border-slate-100 p-1.5">
                    <button onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <Icon d={IC.logout} size={14}/>Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content — ONLY this scrolls */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto w-full max-w-5xl">
            {tab==='overview'&&<Overview user={{...rawUser,...profile}} projects={projects} notifications={notifications} setTab={setTab}/>}
            {tab==='profile'&&<ProfileSection profile={p} setProfile={setProfile}/>}
           {(tab==='projects'||tab==='create-project')&&<ProjectsSection projects={projects} setProjects={setProjects} profile={p} pushNotif={pushNotif} openCreateOnMount={tab==='create-project'} setTab={setTab}/>}
            {tab==='invitations'&&<InvitationsSection profile={p} projects={projects} setProjects={setProjects} pushNotif={pushNotif}/>}
            {tab==='instructors'&&<InstructorsSection/>}
            {tab==='explore'&&<ExploreProjectsSection profile={p} projects={projects} favProjects={favProjects} setFavProjects={setFavProjects}/>}
            {tab==='portfolios'&&<ExplorePortfoliosSection projects={projects} favPortfolios={favPortfolios} setFavPortfolios={setFavPortfolios} setTab={setTab}/>}
            {tab==='favorites'&&<FavoritesSection projects={projects} favProjects={favProjects} setFavProjects={setFavProjects} favPortfolios={favPortfolios} setFavPortfolios={setFavPortfolios}/>}
            {tab==='recommended'&&<RecommendedSection profile={p} projects={projects} favProjects={favProjects} setFavProjects={setFavProjects}/>}
            {tab==='messages'&&<MessagesSection profile={p} pushNotif={pushNotif}/>}
            {tab==='internships'&&<InternshipsSection profile={p} pushNotif={pushNotif}/>}
            {tab==='stats'&&<StatsSection projects={projects} profile={p}/>}
            {tab==='settings'&&<SettingsSection profile={p} rawUser={rawUser} initialTab={settingsTab}/>}
            {tab==='schedule'&&<ScheduleSection profile={p}/>}
            {tab==='notifications'&&<NotificationsSection notifications={notifications} setNotifications={setNotifications} profileEmail={rawUser.email} setTab={setTab}/>}
          </div>
        </main>
      </div>
    </div>
  )
}