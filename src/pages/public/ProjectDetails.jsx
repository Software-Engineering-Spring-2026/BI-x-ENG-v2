import { Link, useParams } from 'react-router-dom'
import projects from '../../data/projects'

function ProjectDetails() {
  const { id } = useParams()
  const project = projects.find((entry) => entry.id === id)

  if (!project) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Project Not Found</h1>
        <Link to="/explore-projects" className="mt-4 inline-block text-blue-700">
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
      <p className="mt-2 text-slate-600">
        {project.student} • {project.domain} • {project.year}
      </p>
      <p className="mt-4 text-slate-700">{project.summary}</p>

      <div className="mt-5">
        <h2 className="text-lg font-semibold text-slate-900">Tech Stack</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetails
