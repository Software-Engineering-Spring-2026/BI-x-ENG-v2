import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/Card'
import projects from '../../data/projects'

function ExploreProjects() {
  const [searchTerm, setSearchTerm] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')

  const domains = ['all', ...new Set(projects.map((project) => project.domain))]

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesSearch =
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.summary.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDomain =
          domainFilter === 'all' || project.domain === domainFilter
        return matchesSearch && matchesDomain
      }),
    [searchTerm, domainFilter],
  )

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Explore Projects</h1>
      <p className="mt-2 text-slate-600">
        Browse graduation and course projects submitted by GUC students.
      </p>

      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by project title, student, or keyword"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
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
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            title={project.title}
            subtitle={`${project.student} • ${project.domain}`}
          >
            <p className="text-sm text-slate-600">{project.summary}</p>
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
