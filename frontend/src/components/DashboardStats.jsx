import React, { useState, useEffect } from 'react';

const DashboardStats = () => {
    const [stats, setStats] = useState({
        totalLeads: 0,
        approvedLeads: 0,
        withContacts: 0,
        pendingLeads: 0
    });

    useEffect(() => {
        fetch('http://127.0.0.1:8000/dashboard/leads')
            .then(res => res.json())
            .then(leads => {
                setStats({
                    totalLeads: leads.length,
                    approvedLeads: leads.filter(l => l.status === 'APPROVED').length,
                    withContacts: leads.filter(l => l.contacts && l.contacts.length > 0).length,
                    pendingLeads: leads.filter(l => l.status === 'PENDING').length
                });
            })
            .catch(err => console.error('Failed to fetch stats:', err));
    }, []);

    return (
        <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard title="TOTAL LEADS" value={stats.totalLeads} sub="captured" color="text-cyan-400" />
            <StatCard title="APPROVED LEADS" value={stats.approvedLeads} sub="ready to contact" color="text-green-400" />
            <StatCard title="VERIFIED EMAILS" value={stats.withContacts} sub="real personnel info" color="text-blue-400" />
            <StatCard title="PENDING REVIEW" value={stats.pendingLeads} sub="awaiting approval" color="text-yellow-400" />
        </div>
    );
};

const StatCard = ({ title, value, sub, color = "text-green-400" }) => (
    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
        <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-slate-400 font-medium">{title}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
            <span className="text-xs text-slate-500">{sub}</span>
        </div>
        <div className="h-1 w-full bg-slate-700 mt-4 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, value * 10)}%` }}></div>
        </div>
    </div>
);

export default DashboardStats;
