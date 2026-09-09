export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-label="טוען את המסך" role="status">
      <div className="skeleton-block h-44 rounded-[2rem]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-block h-32 rounded-3xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="skeleton-block h-72 rounded-3xl" />
        <div className="skeleton-block h-72 rounded-3xl" />
      </div>
    </div>
  );
}