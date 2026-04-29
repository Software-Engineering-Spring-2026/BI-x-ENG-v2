import { Link, useParams } from 'react-router-dom'
import students from '../../data/students'

function PortfolioDetails() {
  const { id } = useParams()
  const student = students.find((entry) => entry.id === id)

  if (!student) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Portfolio Not Found</h1>
        <Link to="/explore-portfolios" className="mt-4 inline-block text-blue-700">
          Back to portfolios
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">{student.name}</h1>
      <p className="mt-2 text-slate-600">
        {student.major} • Class of {student.graduationYear}
      </p>
      <p className="mt-4 text-slate-700">{student.headline}</p>

      <div className="mt-5">
        <h2 className="text-lg font-semibold text-slate-900">Core Skills</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {student.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PortfolioDetails
