export function SkeletonCard() {
  return (
    <div className="card-base flex flex-col" aria-hidden="true" role="presentation">
      {/* Image */}
      <div className="skeleton aspect-[4/3] rounded-none rounded-t-3xl" />
      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-1/2 rounded-lg" />
        <div className="flex justify-between items-center">
          <div className="skeleton h-3 w-16 rounded-lg" />
          <div className="skeleton h-3 w-20 rounded-lg" />
        </div>
        <div className="border-t border-ink-100 dark:border-surface-raised pt-3 flex justify-between items-center">
          <div>
            <div className="skeleton h-5 w-20 rounded-lg mb-1" />
            <div className="skeleton h-3 w-24 rounded-lg" />
          </div>
          <div className="skeleton h-8 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
