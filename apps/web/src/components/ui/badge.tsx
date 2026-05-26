import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-primary/20 text-primary': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'border border-border text-foreground': variant === 'outline',
          'bg-neon-400/20 text-neon-400': variant === 'success',
          'bg-yellow-500/20 text-yellow-400': variant === 'warning',
          'bg-red-500/20 text-red-400': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  );
}
