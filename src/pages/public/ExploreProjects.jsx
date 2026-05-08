import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/Card'
import projects from '../../data/projects'

function ExploreProjects() {
  const [searchTerm, setSearchTerm] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [instructorFilter, setInstructorFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  // Dynamically extract unique domains, courses, and instructors
  const domains = ['all', ...new Set(projects.map((project) => project.domain).filter(Boolean))]
  const courses = ['all', ...new Set(projects.map((project) => project.course).filter(Boolean))]
  const instructors = ['all', ...new Set(projects.map((project) => project.instructor).filter(Boolean))]

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesSearch =
          project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.summary?.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesDomain =
          domainFilter === 'all' || project.domain === domainFilter
          
        const matchesCourse = 
          courseFilter === 'all' || project.course === courseFilter

        const matchesInstructor = 
          instructorFilter === 'all' || project.instructor === instructorFilter

        const matchesDate = 
          dateFilter === '' || project.date === dateFilter

        return matchesSearch && matchesDomain && matchesCourse && matchesInstructor && matchesDate
      }),
    [searchTerm, domainFilter, courseFilter, instructorFilter, dateFilter]
  )

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Explore Projects</h1>
      <p className="mt-2 text-slate-600">
        Browse graduation and course projects submitted by GUC students.
      </p>

      {/* Filter Section */}
      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none lg:col-span-1"
        />
        
        <select
          value={domainFilter}
          onChange={(event) => setDomainFilter(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
        >
          {domains.map((domain) => (
            <option key={domain} value={domain}>
              {domain === 'all' ? 'All Domains' : domain}
            </option>
          ))}
        </select>

        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
        >
          {courses.map((course) => (
            <option key={course} value={course}>
              {course === 'all' ? 'All Courses / Projects' : course}
            </option>
          ))}
        </select>

        <select
          value={instructorFilter}
          onChange={(event) => setInstructorFilter(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
        >
          {instructors.map((instructor) => (
            <option key={instructor} value={instructor}>
              {instructor === 'all' ? 'All Instructors' : instructor}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none text-slate-600"
          title="Filter by Creation Date"
        />
      </div>

      {/* Projects Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            title={project.title}
            subtitle={`${project.student} • ${project.domain}`}
          >
            <p className="text-sm text-slate-600">{project.summary}</p>
            {/* Optional: Display additional details like course and date to verify filters are working */}
            <div className="mt-2 text-xs text-slate-500 font-medium">
              <p>Course: {project.course || 'N/A'} | Instructor: {project.instructor || 'N/A'}</p>
              <p>Created: {project.date || 'N/A'}</p>
            </div>
            
            <Link
              to={`/project/${project.id}`}
              className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View details
            </Link>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">
          No projects match the selected search and filter criteria.
        </p>
      )}
    </div>
  )
}

export default ExploreProjects