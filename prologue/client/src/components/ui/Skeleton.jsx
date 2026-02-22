export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-shimmer rounded bg-gradient-to-r from-border via-card-bg/80 to-border bg-[length:200%_100%] ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-lg border border-border bg-card-bg p-5 space-y-4 ${className}`}>
      <Skeleton className="h-5 w-2/3" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="rounded-lg border border-border bg-card-bg p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card-bg p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card-bg">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonScores() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card-bg p-5">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card-bg p-8 text-center">
        <Skeleton className="h-4 w-40 mx-auto mb-4" />
        <Skeleton className="h-12 w-24 mx-auto" />
      </div>
    </div>
  );
}

export function SkeletonMessaging() {
  return (
    <div className="flex overflow-hidden bg-primary" style={{ height: 'calc(100vh - 3.5rem)' }}>
      <aside className="w-[220px] shrink-0 border-r border-border bg-secondary p-3 space-y-4">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </aside>
      <div className="flex-1 flex flex-col p-4">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
          <Skeleton className="h-12 w-2/3" />
        </div>
        <Skeleton className="h-12 w-full mt-4" />
      </div>
    </div>
  );
}

export function SkeletonMessagesOnly() {
  return (
    <div className="flex-1 p-4 space-y-3">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-12 w-1/2 ml-auto" />
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="h-10 w-1/3 ml-auto" />
    </div>
  );
}

export function SkeletonCertificate() {
  return (
    <div className="min-h-screen bg-primary py-12 px-4">
      <div className="max-w-[800px] mx-auto">
        <div className="rounded-lg border border-border bg-card-bg p-12 space-y-6">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-10 w-40 mx-auto" />
          <Skeleton className="h-24 w-24 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCompletedProjects() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <SkeletonCard key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
