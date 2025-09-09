/**
 * Card Component for consistent layouts
 */
import { BaseComponentProps } from '@/types';
import { cn } from '@/lib/utils';

interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variants = {
  default: 'bg-white',
  outlined: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-lg',
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
}: CardProps) {
  return (
    <div className={cn(
      'rounded-lg',
      variants[variant],
      paddings[padding],
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: BaseComponentProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: BaseComponentProps) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }: BaseComponentProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}
