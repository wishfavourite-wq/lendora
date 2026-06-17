import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function ProductsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      <div className="h-11 bg-ink-100 rounded-xl mb-5 animate-pulse w-full max-w-lg" />
      <div className="h-4 bg-ink-100 rounded mb-5 animate-pulse w-32" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
