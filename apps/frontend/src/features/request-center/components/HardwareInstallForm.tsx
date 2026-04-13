import React, { useRef } from 'react';
import { Monitor, FileText, Calendar as CalendarIcon, Clock, Paperclip, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailableSlots } from '@/features/request-center/api/schedule.api';

export interface HardwareInstallFormData {
    scheduledDate: string;
    scheduledTime: string;
    hardwareType: string;
    customHardwareType: string;
    description: string;
    userAcknowledged: boolean;
    files: File[];
}

interface HardwareInstallFormProps {
    data: HardwareInstallFormData;
    onChange: (data: Partial<HardwareInstallFormData>) => void;
}

interface SchedulingConfig {
    timeSlots: string[];
    hardwareTypes: string[];
}

export const HardwareInstallForm: React.FC<HardwareInstallFormProps> = ({ data, onChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const DEFAULT_HARDWARE_TYPES = ['PC', 'IP-Phone', 'Printer'];
    const DEFAULT_TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00'];

    const { data: schedulingConfig } = useQuery<SchedulingConfig>({
        queryKey: ['scheduling-config'],
        queryFn: async () => {
            const res = await api.get('/settings/scheduling');
            return res.data;
        },
        staleTime: 60000,
    });

    const HARDWARE_TYPES = schedulingConfig?.hardwareTypes ?? DEFAULT_HARDWARE_TYPES;
    
    const { data: dynamicSlots, isLoading: isLoadingSlots } = useAvailableSlots(data.scheduledDate);
    const availableDynamicSlots = dynamicSlots?.slots 
        ? dynamicSlots.slots.filter(s => s.isAvailable).map(s => s.timeSlot) 
        : DEFAULT_TIME_SLOTS;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            onChange({ files: [...data.files, ...newFiles] });
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...data.files];
        newFiles.splice(index, 1);
        onChange({ files: newFiles });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Type & Description */}
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-widest flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-amber-500" /> 
                            Hardware Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {HARDWARE_TYPES.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => onChange({ hardwareType: type, customHardwareType: '' })}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-[opacity,transform,colors] duration-200 ease-out border-2 ${
                                        data.hardwareType === type
                                            ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => onChange({ hardwareType: 'OTHER' })}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-[opacity,transform,colors] duration-200 ease-out border-2 ${
                                    data.hardwareType === 'OTHER'
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                }`}
                            >
                                Other
                            </button>
                        </div>
                        {data.hardwareType === 'OTHER' && (
                            <input
                                type="text"
                                value={data.customHardwareType}
                                onChange={(e) => onChange({ customHardwareType: e.target.value })}
                                className="w-full mt-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none transition-colors duration-150"
                                placeholder="Specify hardware type..."
                            />
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-500" /> 
                            Description
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => onChange({ description: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/50 outline-none transition-colors duration-150 resize-none min-h-[120px]"
                            placeholder="Provide details about the installation (location, specific requirements, etc.)"
                        />
                    </div>
                </div>

                {/* Right Side: Schedule & Options */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-widest flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-amber-500" /> 
                                Date
                            </label>
                            <ModernDatePicker
                                value={data.scheduledDate ? parseISO(data.scheduledDate) : undefined}
                                onChange={(date) => onChange({ scheduledDate: format(date, 'yyyy-MM-dd') })}
                                placeholder="Select date"
                                minDate={new Date(Date.now() + 86400000)}
                                triggerClassName="w-full py-3 bg-slate-900 border-slate-800 rounded-xl text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500" /> 
                                Time Slot
                            </label>
                            <Select 
                                disabled={!data.scheduledDate || isLoadingSlots} 
                                value={data.scheduledTime} 
                                onValueChange={(value) => onChange({ scheduledTime: value })}
                            >
                                <SelectTrigger className="w-full px-4 py-3 h-auto text-sm bg-slate-900 border-slate-800 rounded-xl text-white">
                                    <SelectValue placeholder={!data.scheduledDate ? "Select Date First" : isLoadingSlots ? "Loading..." : "Select Time"} />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    {availableDynamicSlots.length === 0 && data.scheduledDate && !isLoadingSlots ? (
                                        <div className="p-2 text-sm text-slate-500 text-center">No slots available</div>
                                    ) : (
                                        availableDynamicSlots.map(slot => (
                                            <SelectItem key={slot} value={slot} className="text-slate-300 focus:bg-amber-500 focus:text-slate-950 capitalize">
                                                {slot} WIB
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-widest flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-amber-500" /> 
                            Attachments
                        </label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors duration-150 group"
                        >
                            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                            <Paperclip className="w-8 h-8 text-slate-700 group-hover:text-amber-500 mb-2 transition-colors" />
                            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-wider">Click to upload files</span>
                            <span className="text-[10px] text-slate-600 mt-1">Images, PDFs, or documents</span>
                        </div>
                        {data.files.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {data.files.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg group animate-in zoom-in-95">
                                        <span className="text-[10px] font-medium text-slate-400 max-w-[100px] truncate">{file.name}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                            className="text-slate-600 hover:text-red-500 transition-colors"
                                        >
                                            <CheckCircle2 className="w-3 h-3 rotate-45" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-[opacity,transform,colors] duration-200 ease-out ${
                            data.userAcknowledged 
                                ? 'bg-amber-500/5 border-amber-500/30' 
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}>
                            <div className="relative mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={data.userAcknowledged}
                                    onChange={(e) => onChange({ userAcknowledged: e.target.checked })}
                                    className="peer h-5 w-5 opacity-0 absolute inset-0 cursor-pointer z-10"
                                />
                                <div className={`h-5 w-5 rounded border-2 transition-[opacity,transform,colors] duration-200 ease-out flex items-center justify-center ${
                                    data.userAcknowledged ? 'bg-amber-500 border-amber-500' : 'bg-slate-950 border-slate-800'
                                }`}>
                                    {data.userAcknowledged && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 stroke-[3px]" />}
                                </div>
                            </div>
                            <div>
                                <span className="font-bold text-sm text-slate-200 block mb-1 uppercase tracking-tight">I Acknowledge</span>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    I understand that I must be available at the location during the scheduled time (approx. 2-4 hours). I have also backed up any critical data if this is a PC replacement/migration.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Notification / Alert */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Scheduling Policy</h5>
                    <p className="text-[10px] text-amber-500/70 font-medium leading-relaxed">
                        Hardware installations are processed based on available slots and priority. Emergency requests should be directed to the IT service desk immediately.
                    </p>
                </div>
            </div>
        </div>
    );
};
