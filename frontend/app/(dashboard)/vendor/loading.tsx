export default function VendorDashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-ink-100 rounded-lg mb-2" />
      <div className="h-4 w-32 bg-ink-100 rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-ink-100 p-5 h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 h-64" />
        <div className="bg-white rounded-2xl border border-ink-100 h-64" />
      </div>
    </div>
  )
}
