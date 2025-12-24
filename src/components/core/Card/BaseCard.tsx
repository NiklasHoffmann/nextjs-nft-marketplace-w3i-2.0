/**
 * BaseCard Component (REFACTORED)
 * 
 * Unified card component for all card variants across the application.
 * Eliminates duplication in NFTCard, CollectionCard, StatCard, and others.
 * 
 * Features:
 * - Consistent styling and hover effects
 * - Flexible slot system (image, header, content, footer, badge, overlay)
 * - Size variants (sm, md, lg, xl)
 * - Optional loading skeleton state
 * - Click handling with cursor styles
 * - Customizable borders, shadows, and backgrounds
 * 
 * @example
 * ```tsx
 * <BaseCard
 *   size="md"
 *   hoverable
 *   onClick={() => router.push(`/nft/${address}/${tokenId}`)}
 *   image={<img src={nft.image} alt={nft.name} />}
 *   badge={<span className="badge">Sale</span>}
 *   header={<h3>{nft.name}</h3>}
 *   content={<p>{nft.description}</p>}
 *   footer={<PriceDisplay price={nft.price} />}
 * />
 * ```
 */
'use client'
import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ===== TYPES =====

export interface BaseCardProps {
    /** Card size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Enable hover effects (scale, shadow) */
    hoverable?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Loading skeleton state */
    loading?: boolean;

    // Slot system for flexible content
    /** Image/media slot (top of card) */
    image?: ReactNode;
    /** Badge overlay (top-right corner) */
    badge?: ReactNode;
    /** Header slot */
    header?: ReactNode;
    /** Main content slot */
    content?: ReactNode;
    /** Footer slot */
    footer?: ReactNode;
    /** Full overlay (for loading, states, etc.) */
    overlay?: ReactNode;

    // Styling options
    /** Border style */
    border?: boolean | 'default' | 'thick' | 'colored';
    /** Shadow style */
    shadow?: boolean | 'sm' | 'md' | 'lg' | 'xl';
    /** Background style */
    background?: 'white' | 'gray' | 'gradient';
    /** Rounded corners */
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';

    // Advanced options
    /** Disable transition effects */
    noTransition?: boolean;
    /** Custom padding (overrides size default) */
    padding?: string;
}

// ===== SIZE CONFIGS =====

const sizeConfig = {
    sm: {
        width: 'w-64',
        imageHeight: 'h-48',
        padding: 'p-3'
    },
    md: {
        width: 'w-60',
        imageHeight: 'h-72',
        padding: 'p-4'
    },
    lg: {
        width: 'w-96',
        imageHeight: 'h-80',
        padding: 'p-5'
    },
    xl: {
        width: 'w-[28rem]',
        imageHeight: 'h-96',
        padding: 'p-6'
    }
} as const;

// ===== STYLE CONFIGS =====

const borderStyles = {
    none: '',
    default: 'border border-gray-200',
    thick: 'border-2 border-gray-300',
    colored: 'border border-blue-200'
} as const;

const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
} as const;

const backgroundStyles = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-white to-gray-50'
} as const;

const roundedStyles = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl'
} as const;

// ===== LOADING SKELETON =====

const CardSkeleton = memo(({ size }: { size: 'sm' | 'md' | 'lg' | 'xl' }) => {
    const config = sizeConfig[size];

    return (
        <div className={cn(
            config.width,
            config.imageHeight,
            'bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse'
        )}>
            {/* Image skeleton */}
            <div className="h-3/5 bg-gray-200" />

            {/* Content skeleton */}
            <div className={cn(config.padding, 'h-2/5 flex flex-col justify-between')}>
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
        </div>
    );
});

CardSkeleton.displayName = 'CardSkeleton';

// ===== MAIN COMPONENT =====

export const BaseCard = memo<BaseCardProps>(({
    size = 'md',
    hoverable = false,
    onClick,
    className,
    loading = false,
    image,
    badge,
    header,
    content,
    footer,
    overlay,
    border = 'default',
    shadow = 'xl',
    background = 'white',
    rounded = 'xl',
    noTransition = false,
    padding
}) => {
    // Show skeleton during loading
    if (loading) {
        return <CardSkeleton size={size} />;
    }

    const config = sizeConfig[size];
    const isClickable = !!onClick;

    // Resolve style values
    const borderClass = border === false
        ? borderStyles.none
        : border === true
            ? borderStyles.default
            : borderStyles[border];

    const shadowClass = shadow === false
        ? shadowStyles.none
        : shadow === true
            ? shadowStyles.md
            : shadowStyles[shadow];

    // Build dynamic classes
    const cardClasses = cn(
        // Base layout
        'flex-shrink-0 overflow-hidden transform-gpu',
        config.width,

        // Background & Border
        backgroundStyles[background],
        borderClass,
        roundedStyles[rounded],
        shadowClass,

        // Interactive states
        isClickable && 'cursor-pointer',
        hoverable && !noTransition && 'transition-all duration-300 ease-out',
        hoverable && 'hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.4)] hover:scale-[1.02]',

        // Group for nested hover effects
        'group',

        // Custom classes
        className
    );

    const contentPadding = padding || config.padding;

    return (
        <div
            className={cardClasses}
            onClick={onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            } : undefined}
        >
            {/* Image Slot */}
            {image && (
                <div className={cn('relative overflow-hidden', config.imageHeight)}>
                    {image}

                    {/* Badge Overlay */}
                    {badge && (
                        <div className="absolute top-3 right-3 z-10">
                            {badge}
                        </div>
                    )}
                </div>
            )}

            {/* Content Area */}
            <div className={contentPadding}>
                {/* Header Slot */}
                {header && (
                    <div className={content || footer ? 'mb-3' : ''}>
                        {header}
                    </div>
                )}

                {/* Content Slot */}
                {content && (
                    <div className={footer ? 'mb-3' : ''}>
                        {content}
                    </div>
                )}

                {/* Footer Slot */}
                {footer && (
                    <div>
                        {footer}
                    </div>
                )}
            </div>

            {/* Full Overlay Slot */}
            {overlay && (
                <div className="absolute inset-0 z-20">
                    {overlay}
                </div>
            )}
        </div>
    );
});

BaseCard.displayName = 'BaseCard';

// ===== SUB-COMPONENTS =====

/**
 * Pre-styled badge component for card overlays
 */
export const CardBadge = memo<{
    children: ReactNode;
    variant?: 'sale' | 'swap' | 'sold' | 'new' | 'featured';
    className?: string;
}>(({ children, variant = 'sale', className }) => {
    const variantStyles = {
        sale: 'bg-green-500 text-white',
        swap: 'bg-orange-500 text-white',
        sold: 'bg-gray-500 text-white',
        new: 'bg-blue-500 text-white',
        featured: 'bg-purple-500 text-white'
    };

    return (
        <span className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold shadow-lg',
            variantStyles[variant],
            className
        )}>
            {children}
        </span>
    );
});

CardBadge.displayName = 'CardBadge';

/**
 * Pre-styled card header component
 */
export const CardHeader = memo<{
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    className?: string;
}>(({ title, subtitle, icon, className }) => {
    return (
        <div className={cn('flex items-start gap-2', className)}>
            {icon && (
                <div className="flex-shrink-0">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-sm text-gray-500 truncate">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
});

CardHeader.displayName = 'CardHeader';

/**
 * Pre-styled stat row component
 */
export const CardStat = memo<{
    label: string;
    value: string | number;
    icon?: ReactNode;
    variant?: 'default' | 'highlight';
    className?: string;
}>(({ label, value, icon, variant = 'default', className }) => {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            <div className="flex items-center gap-2 text-sm text-gray-600">
                {icon}
                <span>{label}</span>
            </div>
            <span className={cn(
                'font-semibold',
                variant === 'highlight' ? 'text-blue-600' : 'text-gray-900'
            )}>
                {value}
            </span>
        </div>
    );
});

CardStat.displayName = 'CardStat';

export default BaseCard;
