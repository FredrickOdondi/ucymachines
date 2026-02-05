import React from 'react';

const ActivityFeed = () => {
    const activities = [
        { time: "[14:22:01]", agent: "DiscoveryAgent", msg: "Enriched lead #UCY-992 (Lathe Ops)", color: "text-green-400" },
        { time: "[14:21:55]", agent: "Router", msg: "Branching to Outreach for #UCY-988", color: "text-blue-400" },
        { time: "[14:21:40]", agent: "QualAgent", msg: "Filtering signal stream... 14 entries dropped.", color: "text-yellow-400" },
        { time: "[14:21:32]", agent: "TriggerNode", msg: "New signal detected: 'Industrial Drill Search'", color: "text-green-400" },
        { time: "[14:21:10]", agent: "Execution", msg: "Email batch #203 dispatched via SMTP-4", color: "text-cyan-400" },
    ];

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 h-full font-mono text-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-sans font-medium">Agent Activity Feed</h3>
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">LIVE</span>
            </div>
            <div className="space-y-3">
                {activities.map((act, i) => (
                    <div key={i} className="text-slate-300">
                        <span className="text-slate-500">{act.time}</span> <span className={act.color}>{act.agent}:</span> {act.msg}
                    </div>
                ))}
                {/* Cursor blink effect */}
                <div className="text-cyan-500 animate-pulse">_</div>
            </div>
        </div>
    );
};

export default ActivityFeed;
