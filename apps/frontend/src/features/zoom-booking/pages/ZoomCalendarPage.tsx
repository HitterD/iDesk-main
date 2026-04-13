import { ZoomCalendar, ZoomErrorBoundary } from '../components';

export function ZoomCalendarPage() {
    return (
        <div className="min-h-0 h-auto lg:h-[calc(100vh-2rem)] flex flex-col gap-6 animate-fade-in-up overflow-y-auto custom-scrollbar -m-2 p-2 pb-6">
            <ZoomErrorBoundary>
                <ZoomCalendar />
            </ZoomErrorBoundary>
        </div>
    );
}
