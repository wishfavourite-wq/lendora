export default function RentalsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 animate-pulse">
      <div className="h-8 w-40 bg-ink-100 rounded mb-6" />
      <div className="flex gap-2 mb-6">
        {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-24 bg-ink-100 rounded-full" />)}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-ink-100 p-5 h-28" />
        ))}
      </div>
    </div>
  )
}
