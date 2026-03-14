export default function MarketplaceLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#eef2ff] px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="h-10 w-72 rounded-xl bg-slate-200/80 animate-pulse" />
                <div className="h-5 w-96 rounded-lg bg-slate-200/70 animate-pulse" />

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 pt-4">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm"
                        >
                            <div className="aspect-square rounded-xl bg-slate-200 animate-pulse" />
                            <div className="mt-3 h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
                            <div className="mt-2 h-3 w-1/2 rounded bg-slate-200/80 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
