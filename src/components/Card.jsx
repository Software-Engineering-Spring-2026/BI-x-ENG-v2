function Card({ title, subtitle, children, className = '' }) {
  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${className}`}
    >
      {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      {children && <div className="mt-4">{children}</div>}
    </article>
  )
}

export default Card
