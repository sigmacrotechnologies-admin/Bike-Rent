'use client';

export function MeshBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute -right-32 top-20 h-[500px] w-[500px] rounded-full bg-electric-500/15 blur-[120px]" />
      <div className="absolute -left-32 bottom-20 h-[400px] w-[400px] rounded-full bg-neon-400/10 blur-[100px]" />
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-600/5 blur-[80px]" />
    </div>
  );
}
