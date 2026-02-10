"use client";

import { Suspense } from "react";
import Link from "next/link";
import InsightsManager from "../components/insights/InsightsManager";
import { LoadingState } from '@/components/core/Loading';
import { AdminPageShell } from '@/app/admin/components/shared/AdminPageShell';

function AdminContent() {
    return (
        <AdminPageShell>
                {/* Back Button */}
                <div className="mb-6">
                    <Link
                        href="/admin"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Zurück zum Admin Panel
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">NFT Insights</h1>
                    <p className="text-gray-600">Manage NFT insights, descriptions, and metadata</p>
                </div>

                <InsightsManager />
        </AdminPageShell>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={
            <AdminPageShell>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">NFT Insights</h1>
                    <LoadingState size="md" message="Loading insights manager..." />
                </div>
            </AdminPageShell>
        }>
            <AdminContent />
        </Suspense>
    );
}
