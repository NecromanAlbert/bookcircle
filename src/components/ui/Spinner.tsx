export function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent ${className}`} />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner />
    </div>
  )
}
