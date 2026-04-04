interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-700/50';
  const variantClasses = {
    text: 'h-4 rounded',
    rect: 'rounded-md',
    circle: 'rounded-full',
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700/50 p-4 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" className={`w-${Math.floor(Math.random() * 4) + 6}/12`} />
      ))}
    </div>
  );
}
