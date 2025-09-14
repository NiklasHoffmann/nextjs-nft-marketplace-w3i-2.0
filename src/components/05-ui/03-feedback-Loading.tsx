/**
 * Loading Spinner Component
 */
import { LoadingProps } from '@/types';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
};

const Spinner = ({ size = 'md', className }: { size?: keyof typeof sizeClasses; className?: string }) => (
  <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeClasses[size], className)} />
);

const Dots = ({ size = 'md', className }: { size?: keyof typeof sizeClasses; className?: string }) => (
  <div className={cn('flex space-x-1', className)}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={cn(
          'rounded-full bg-blue-600 animate-bounce',
          sizeClasses[size]
        )}
        style={{
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
);

const Pulse = ({ size = 'md', className }: { size?: keyof typeof sizeClasses; className?: string }) => (
  <div className={cn('rounded-full bg-blue-200 animate-pulse', sizeClasses[size], className)} />
);

export default function Loading({ 
  size = 'md', 
  variant = 'spinner', 
  className,
  children 
}: LoadingProps) {
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <Dots size={size} className={className} />;
      case 'pulse':
        return <Pulse size={size} className={className} />;
      default:
        return <Spinner size={size} className={className} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderLoader()}
      {children && (
        <div className="text-sm text-gray-600 text-center">
          {children}
        </div>
      )}
    </div>
  );
}
