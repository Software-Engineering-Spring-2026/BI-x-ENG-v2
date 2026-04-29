import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/Card'
import students from '../../data/students'

function ExplorePortfolios() {
  const [searchTerm, setSearchTerm] = useState('')
  const [majorFilter, setMajorFilter] = useState('all')

  const majors = ['all', ...new Set(students.map((student) => student.major))]

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch =
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        const matchesMajor =
          majorFilter === 'all' || student.major === majorFilter
        return matchesSearch && matchesMajor
      }),
    [searchTerm, majorFilter],
  )

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Explore Portfolios</h1>
      <p className="mt-2 text-slate-600">
        Discover talented GUC students and their technical strengths.
      </p>

      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by student, skill, or headline"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
        />
        <select
          value={majorFilter}
          onChange={(event) => setMajorFilter(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
        >
          {majors.map((major) => (
            <option key={major} value={major}>
              {major === 'all' ? 'All Majors' : major}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card
            key={student.id}
            title={student.name}
            subtitle={`${student.major} • ${student.graduationYear}`}
          >
            <p className="text-sm text-slate-600">{student.headline}</p>
            <Link
              to={`/portfolio/${student.id}`}
              className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View portfolio
            </Link>
          </Card>
        ))}
      </div>
      {filteredStudents.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">
          No portfolios match the selected search and filter criteria.
        </p>
      )}
    </div>
  )
}

export default ExplorePortfolios
