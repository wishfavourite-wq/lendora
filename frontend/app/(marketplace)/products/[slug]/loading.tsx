export default function ProductDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12 animate-pulse">
      <div className="h-4 w-32 bg-ink-100 rounded mb-6" />
      <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_400px] gap-6 lg:gap-10">
        <div className="space-y-4">
          <div className="aspect-[4/3] bg-ink-100 rounded-2xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-square w-20 bg-ink-100 rounded-xl" />)}
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-ink-100 rounded" style={{ width: `${80 - i * 8}%` }} />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-ink-100 rounded w-3/4" />
          <div className="h-6 bg-ink-100 rounded w-1/2" />
          <div className="h-40 bg-white rounded-2xl border border-ink-100" />
          <div className="h-32 bg-white rounded-2xl border border-ink-100" />
          <div className="h-12 bg-ink-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
