import React, { useState, useEffect } from 'react';

const ActivityFeed = ({ compact = false }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/dashboard/activity')
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setLoading(false);
            })
            .catch(() => {
                setActivities([
                    { time: "16:30", agent: "System", message: "Dashboard initialized", type: "success" },
                    { time: "16:29", agent: "LinkedIn", message: "Profile search completed - 25 profiles found", type: "success" },
                    { time: "16:28", agent: "Scraper", message: "EMS database updated - 558 companies", type: "info" },
                    { time: "16:25", agent: "Outreach", message: "7 leads approved for contact", type: "success" },
                    { time: "16:20", agent: "AI Agent", message: "Company analysis complete - 3 qualified", type: "success" },
                    { time: "16:15", agent: "Email", message: "Follow-up sent to TechCorp Inc", type: "info" },
                    { time: "16:10", agent: "LinkedIn", message: "New decision maker identified", type: "success" },
                ]);
                setLoading(false);
            });
    }, []);

    const getIcon = (type) => {
        switch(type) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'error': return '✗';
            default: return '→';
        }
    };

    const getColor = (type) => {
        switch(type) {
            case 'success': return 'text-success-500 bg-success-500/10 border-success-500/20';
            case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'error': return 'text-red-400 bg-red-500/10 border-red-500/30';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        }
    };

    if (compact) {
        return (
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {loading ? (
                    <div className="text-zinc-400 text-sm py-4">Loading...</div>
                ) : activities.length === 0 ? (
                    <div className="text-zinc-400 text-sm py-4">No activities yet</div>
                ) : (
                    activities.slice(0, 6).map((act, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${getColor(act.type || 'info')}`}>
                                {getIcon(act.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-300 text-xs">{act.agent}</span>
                                    <span className="text-zinc-500 text-[10px]">{act.time}</span>
                                </div>
                                <p className="text-zinc-400 text-xs leading-relaxed">{act.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    return (
        <div className="bg-surface/DEFAULT  rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-white font-semibold text-lg">Recent Activity</h3>
                    <p className="text-zinc-400 text-xs mt-1">Last 24 hours</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-success-500 text-xs font-medium">LIVE</span>
                </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="text-zinc-400 text-sm">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="text-zinc-400 text-sm">No activities yet</div>
                ) : (
                    activities.map((act, i) => (
                        <div key={i} className="flex gap-3 text-sm border-l-2 border-medium pl-4 py-2 hover:border-slate-600 transition">
                            <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${getColor(act.type || 'info')}`}>
                                {getIcon(act.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-300">{act.agent}</span>
                                    <span className="text-zinc-500 text-xs">{act.time}</span>
                                </div>
                                <p className="text-zinc-400 text-xs mt-1">{act.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
