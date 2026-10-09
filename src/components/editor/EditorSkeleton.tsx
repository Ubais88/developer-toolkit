export const EditorSkeleton = () => (
  <div className="flex h-full w-full flex-col gap-2.5 bg-surface-1 p-5" aria-label="Loading editor">
    {[68, 42, 56, 30, 74, 48, 36].map((w, i) => (
      <div key={i} className="skeleton h-3 rounded" style={{ width: `${w}%` }} />
    ))}
  </div>
);
