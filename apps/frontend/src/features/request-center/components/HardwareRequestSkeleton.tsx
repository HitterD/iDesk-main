import React from 'react';

export const HardwareRequestSkeleton: React.FC<{ viewMode: 'list' | 'card' }> = ({ viewMode }) => {
    return (
        <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] overflow-hidden shadow-sm animate-pulse ${viewMode === 'card' ? 'rounded-3xl p-6 flex flex-col' : 'rounded-xl p-4'}`}>
                    {viewMode === 'card' ? (
                        <>
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-16 bg-muted rounded-full" />
                                    <div className="h-5 w-32 bg-muted rounded-full" />
                                </div>
                                <div className="h-6 w-20 bg-muted rounded-full" />
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-muted" />
                                <div className="space-y-2">
                                    <div className="h-3 w-24 bg-muted rounded-full" />
                                    <div className="h-2 w-16 bg-muted rounded-full" />
                                </div>
                            </div>
                            <div className="mt-auto space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-3 w-16 bg-muted rounded-full" />
                                    <div className="h-3 w-12 bg-muted rounded-full" />
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full" />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="h-4 w-16 bg-muted rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 bg-muted rounded-full" />
                                <div className="h-3 w-1/4 bg-muted rounded-full" />
                            </div>
                            <div className="h-8 w-24 bg-muted rounded-full shrink-0" />
                            <div className="h-4 w-16 bg-muted rounded-full shrink-0" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
