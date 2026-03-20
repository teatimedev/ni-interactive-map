export function LoadingSkeleton() {
  return (
    <div className="animate-pulse px-5 py-4 space-y-4">
      <div className="h-4 bg-[#2a2a2a] rounded w-1/3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-[#2a2a2a] rounded" />
        <div className="h-16 bg-[#2a2a2a] rounded" />
      </div>
      <div className="h-3 bg-[#2a2a2a] rounded w-full" />
      <div className="h-3 bg-[#2a2a2a] rounded w-2/3" />
      <div className="h-20 bg-[#2a2a2a] rounded" />
      <div className="h-3 bg-[#2a2a2a] rounded w-3/4" />
    </div>
  );
}
