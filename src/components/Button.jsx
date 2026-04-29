function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800',
    secondary: 'bg-white text-blue-700 border border-blue-700 hover:bg-blue-50',
    muted: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
  }

  return (
    <button
      type={type}
      className={`rounded-md px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
