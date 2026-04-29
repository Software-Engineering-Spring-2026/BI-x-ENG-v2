function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} BI X ENG V2 ProjectHub</p>
        <p>Showcasing student innovation with professional visibility.</p>
      </div>
    </footer>
  )
}

export default Footer
