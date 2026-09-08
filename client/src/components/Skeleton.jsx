// components/Skeleton.jsx
// Simple pulsing placeholder blocks used while data is loading, so the
// page never sits blank.

export function SkeletonBlock({ className = "" }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <SkeletonBlock className="h-5 w-2/3" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-3 w-1/2 mb-2" />
      <SkeletonBlock className="h-3 w-1/3 mb-4" />
      <div className="flex gap-4 pt-3 border-t border-gray-100">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <SkeletonBlock className="h-3 w-20 mb-2" />
      <SkeletonBlock className="h-6 w-10" />
    </div>
  );
}

export function EventDetailsSkeleton() {
  return (
    <div>
      <SkeletonBlock className="h-4 w-28 mb-4" />
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <SkeletonBlock className="h-7 w-1/2 mb-3" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SkeletonBlock className="h-5 w-32 mb-4" />
        <SkeletonBlock className="h-10 w-full mb-2" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    </div>
  );
}