import Link from 'next/link';

/**
 * Admin 404 Not Found Page
 * 
 * Displayed when an admin route doesn't exist.
 */
export default function AdminNotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
            <div className="max-w-lg w-full space-y-6 text-center">
                {/* 404 Illustration */}
                <div className="flex justify-center">
                    <div className="text-8xl">🔍</div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Admin Page Not Found
                    </h1>
                    <p className="text-xl text-gray-600">
                        The admin page you&apos;re looking for doesn&apos;t exist.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Link
                        href="/admin"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        Admin Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
