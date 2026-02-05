import React, { useState, useEffect } from 'react';
import { Download, Search, Phone, Mail, Building2, MapPin, TrendingUp } from 'lucide-react';

const LeadsDatabase = () => {
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('APPROVED');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = () => {
        fetch('http://127.0.0.1:8000/dashboard/leads')
            .then(res => res.json())
            .then(data => setLeads(data))
            .catch(err => console.error("Failed to fetch leads:", err));
    };

    // Filter leads based on search and status
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = searchTerm === '' ||
            lead.trigger_data?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.contacts?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'ALL' || lead.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Company', 'Contact Person', 'Email', 'Industry', 'Location', 'Trigger Type', 'Confidence', 'Status', 'Source'];
        const rows = filteredLeads.map(lead => [
            lead.trigger_data?.company_name || 'N/A',
            lead.contacts?.[0]?.name || 'N/A',
            lead.contacts?.[0]?.email || 'N/A',
            lead.company_data?.industry || 'Unknown',
            lead.company_data?.location || 'Unknown',
            lead.trigger_data?.trigger_type || 'N/A',
            Math.floor((lead.trigger_data?.confidence_score || 0) * 100) + '%',
            lead.status || 'PENDING',
            lead.trigger_data?.signal_source || 'N/A'
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Leads Database</h2>
                    <p className="text-sm text-slate-500">Manage and export your approved leads</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg font-medium transition"
                >
                    <Download size={18} />
                    Export to CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by company or contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                >
                    <option value="ALL">All Status</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="DISCARDED">Discarded</option>
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    icon={<Building2 size={20} />}
                    label="Total Leads"
                    value={leads.length}
                    color="bg-blue-500/10 text-blue-400"
                />
                <StatCard
                    icon={<TrendingUp size={20} />}
                    label="Approved"
                    value={leads.filter(l => l.status === 'APPROVED').length}
                    color="bg-green-500/10 text-green-400"
                />
                <StatCard
                    icon={<Mail size={20} />}
                    label="With Email"
                    value={leads.filter(l => l.contacts?.[0]?.email).length}
                    color="bg-cyan-500/10 text-cyan-400"
                />
                <StatCard
                    icon={<TrendingUp size={20} />}
                    label="High Confidence"
                    value={leads.filter(l => (l.trigger_data?.confidence_score || 0) > 0.7).length}
                    color="bg-purple-500/10 text-purple-400"
                />
            </div>

            {/* Table */}
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                        <thead className="bg-slate-800 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Company</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Industry</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Location</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Trigger</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Confidence</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-4 py-12 text-center text-slate-500">
                                        No leads found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead, idx) => (
                                    <TableRow key={lead.id || idx} lead={lead} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-2`}>
            {icon}
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500 uppercase">{label}</p>
    </div>
);

const TableRow = ({ lead }) => {
    const contact = lead.contacts?.[0] || {};
    const confidence = Math.floor((lead.trigger_data?.confidence_score || 0) * 100);

    return (
        <tr className="hover:bg-slate-800/50 transition">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-slate-500" />
                    <span className="font-medium text-white">{lead.trigger_data?.company_name || 'Unknown'}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-slate-300">{contact.name || '-'}</td>
            <td className="px-4 py-3">
                {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
                        <Mail size={14} />
                        <span className="text-sm">{contact.email}</span>
                    </a>
                ) : (
                    <span className="text-slate-500">-</span>
                )}
            </td>
            <td className="px-4 py-3 text-slate-300">{lead.company_data?.industry || 'Unknown'}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-slate-300">
                    <MapPin size={14} className="text-slate-500" />
                    {lead.company_data?.location || 'Unknown'}
                </div>
            </td>
            <td className="px-4 py-3">
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                    {lead.trigger_data?.trigger_type || 'N/A'}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${confidence > 70 ? 'bg-green-500' : confidence > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${confidence}%` }}
                        />
                    </div>
                    <span className="text-xs font-mono text-slate-400">{confidence}%</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-bold rounded ${lead.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                    lead.status === 'DISCARDED' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                    }`}>
                    {lead.status || 'PENDING'}
                </span>
            </td>
            <td className="px-4 py-3">
                <a
                    href={`https://${lead.trigger_data?.signal_source}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-cyan-400 underline max-w-[200px] truncate block"
                >
                    {lead.trigger_data?.signal_source || 'N/A'}
                </a>
            </td>
        </tr>
    );
};

export default LeadsDatabase;
