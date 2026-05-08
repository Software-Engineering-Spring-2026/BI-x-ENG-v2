import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/Card'
import students from '../../data/students'

function ExplorePortfolios() {
  const [searchTerm, setSearchTerm] = useState('')
  const [majorFilter, setMajorFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all') // Added skill filtering
  const [sortBy, setSortBy] = useState('default') 

  // Dynamically extract unique majors and skills
  const majors = ['all', ...new Set(students.map((student) => student.major))]
  const allSkills = new Set()
  students.forEach((student) => student.skills?.forEach((skill) => allSkills.add(skill)))
  const availableSkills = ['all', ...Array.from(allSkills)]

  const filteredStudents = useMemo(() => {
    // 1. Filter the portfolios
    let result = students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) || // Search by email
        student.headline?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesMajor = majorFilter === 'all' || student.major === majorFilter
      
      // Filter by skill check
      const matchesSkill = skillFilter === 'all' || (student.skills && student.skills.includes(skillFilter))

      return matchesSearch && matchesMajor && matchesSkill
    })

    // 2. Sort the portfolios based on number of projects
    if (sortBy === 'projectsDesc') {
      result.sort((a, b) => (b.projects?.length || b.projectCount || 0) - (a.projects?.length || a.projectCount || 0))
    } else if (sortBy === 'projectsAsc') {
      result.sort((a, b) => (a.projects?.length || a.projectCount || 0) - (b.projects?.length || b.projectCount || 0))
    }

    return result
  }, [searchTerm, majorFilter, skillFilter, sortBy])

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Explore Portfolios</h1>
      <p className="mt-2 text-slate-600">
        Discover talented GUC students and their technical strengths.
      </p>

      {/* Filter Section */}
      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by student name, email, or headline..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
        />
        
        <select value={majorFilter} onChange={(e) => setMajorFilter(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700">
          {majors.map((major) => <option key={major} value={major}>{major === 'all' ? 'All Majors' : major}</option>)}
        </select>

        <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700">
          {availableSkills.map((skill) => <option key={skill} value={skill}>{skill === 'all' ? 'All Skills' : skill}</option>)}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 font-semibold bg-slate-50">
          <option value="default">Sort by...</option>
          <option value="projectsDesc">Most Projects</option>
          <option value="projectsAsc">Fewest Projects</option>
        </select>
      </div>

      {/* Portfolios Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card
            key={student.id}
            title={student.name}
            subtitle={`${student.major} • Class of ${student.graduationYear}`}
          >
            <p className="text-sm text-slate-600 line-clamp-2">{student.headline}</p>
            
            {/* Displaying Project Count so sorting visually makes sense */}
            <div className="mt-3 flex items-center gap-2">
               <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">
                 {student.projects?.length || student.projectCount || 0} Projects
               </span>
            </div>

            <Link to={`/portfolio/${student.id}`} className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900">
              View portfolio →
            </Link>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="mt-10 text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">No portfolios match your search and filter criteria.</p>
        </div>
      )}
    </div>
  )
}

export default ExplorePortfolios