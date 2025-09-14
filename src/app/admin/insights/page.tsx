"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AdminNFTInsightsManager } from "@/components/06-admin";

function AdminContent() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
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
                <h1 className="text-3xl font-bold text-gray-900">NFT Insights Management</h1>
                <p className="mt-2 text-gray-600">Manage NFT insights, descriptions, and metadata</p>
            </div>

            <AdminNFTInsightsManager />
        </div>
    );
}

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Suspense fallback={
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="mt-2 text-gray-600">Loading...</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                            <div className="space-y-4">
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-32 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            }>
                <AdminContent />
            </Suspense>
        </div>
    );
}