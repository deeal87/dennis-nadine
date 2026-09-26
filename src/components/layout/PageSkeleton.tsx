export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Wird geladen">
      <div className="skeleton h-10 w-2/3 max-w-sm rounded-2xl" />
      <div className="skeleton h-4 w-1/2 max-w-xs rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-56 rounded-[var(--radius-card)]" />
        ))}
      </div>
    </div>
  );
}
