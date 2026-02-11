import React, { useState, useEffect } from 'react';

const DashboardStats = () => {
    const [stats, setStats] = useState({
        thisWeek: 0,
        contacted: 0,
        responsive: 0,
        closureRate: 0
    });

    useEffect(() => {
        fetch('http://127.0.0.1:8000/dashboard/leads')
            .then(res => res.json())
            .then(leads => {
                const thisWeek = leads.length;
                const contacted = leads.filter(l => l.execution_status?.message_sent).length;
                const responsive = leads.filter(l => l.memory?.response_received).length;

                setStats({
                    thisWeek: thisWeek,
                    contacted: contacted,
                    responsive: responsive,
                    closureRate: thisWeek > 0 ? Math.round((responsive / thisWeek) * 100) : 0
                });
            })
            .catch(err => console.error('Failed to fetch stats:', err));
    }, []);

    return (
        <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard
                title="NEW LEADS"
                value={stats.thisWeek}
                subtitle="captured this week"
                icon="📥"
                color="from-blue-600 to-blue-800"
                trend="+12%"
            />
            <StatCard
                title="CONTACTED"
                value={stats.contacted}
                subtitle="already reached out"
                icon="📧"
                color="from-cyan-600 to-cyan-800"
                trend="+23%"
            />
            <StatCard
                title="RESPONSES"
                value={stats.responsive}
                subtitle="positive replies"
                icon="✓"
                color="from-green-600 to-green-800"
                trend="+15%"
            />
            <StatCard
                title="CONVERSION RATE"
                value={`${stats.closureRate}%`}
                subtitle="leads to responses"
                icon="📈"
                color="from-emerald-600 to-emerald-800"
                trend="+8%"
            />
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white border border-white/10 shadow-lg relative overflow-hidden group hover:scale-105 transition-all duration-300`}>
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>

        <div className="relative">
            <div className="flex justify-between items-start mb-3">
                <div className="text-3xl">{icon}</div>
                {trend && (
                    <div className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        📈 {trend}
                    </div>
                )}
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-xs text-white/80 font-medium">{title}</div>
            <div className="text-xs text-white/60 mt-2">{subtitle}</div>
        </div>
    </div>
);

export default DashboardStats;
