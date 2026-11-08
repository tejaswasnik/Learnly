export function CourseGridSkeleton({ count = 8 }) {
  return (
    <ul aria-hidden="true" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="animate-pulse overflow-hidden rounded-base bg-surface">
          <div className="aspect-video bg-surface-2" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 rounded-xs bg-surface-2" />
            <div className="h-5 w-4/5 rounded-xs bg-surface-2" />
            <div className="h-4 w-1/2 rounded-xs bg-surface-2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
