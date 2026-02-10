import type { ReactNode } from 'react';

interface AdminPageShellProps {
    children: ReactNode;
    maxWidthClass?: string;
}

export function AdminPageShell({ children, maxWidthClass = 'max-w-6xl' }: AdminPageShellProps) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className={`${maxWidthClass} mx-auto`}>{children}</div>
            </div>
        </div>
    );
}
