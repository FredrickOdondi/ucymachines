import React, { useState, useEffect } from 'react';
import { Download, Search, Phone, Mail, Building2, MapPin, TrendingUp, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const LeadsDatabase = () => {
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('APPROVED');
    const [highlightedLeadId, setHighlightedLeadId] = useState(null);
    const { theme } = useTheme();

    useEffect(() => {
        fetchLeads();

        // Check if there's a selected lead ID from navigation
        const storedLeadId = sessionStorage.getItem('selectedLeadId');
        if (storedLeadId) {
            setHighlightedLeadId(storedLeadId);
            sessionStorage.removeItem('selectedLeadId'); // Clear after using

            // Scroll to the lead after a short delay
            setTimeout(() => {
                const element = document.getElementById(`lead-row-${storedLeadId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
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

    // Delete a lead
    const handleDeleteLead = async (leadId) => {
        if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/dashboard/leads/${leadId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Refresh the leads list
                fetchLeads();
            } else {
                const error = await response.json();
                alert('Failed to delete lead: ' + (error.detail || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('Failed to delete lead: ' + error.message);
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Leads Database</h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-600'}`}>Manage and export your approved leads</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-primary-500 px-4 py-2 rounded-lg font-medium text-white transition"
                >
                    <Download size={18} />
                    Export to CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search by company or contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${theme === 'dark' ? 'bg-zinc-900 text-white placeholder:text-zinc-500' : 'bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300'}`}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900 border border-gray-300'}`}
                >
                    <option value="ALL">All Status</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="DISCARDED">Discarded</option>
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
                    color="bg-success-500/10 text-success-500"
                />
                <StatCard
                    icon={<Mail size={20} />}
                    label="With Email"
                    value={leads.filter(l => l.contacts?.[0]?.email).length}
                    color="bg-primary-500/10 text-primary-400"
                />
                <StatCard
                    icon={<TrendingUp size={20} />}
                    label="High Confidence"
                    value={leads.filter(l => (l.trigger_data?.confidence_score || 0) > 0.7).length}
                    color="bg-purple-500/10 text-purple-400"
                />
            </div>

            {/* Table */}
            <div className={`flex-1 rounded-xl overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-surface/DEFAULT' : 'bg-white border border-gray-200'}`}>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full min-w-[800px]">
                        <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                            <tr>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Company</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Contact</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Email</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase hidden md:table-cell ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Industry</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase hidden lg:table-cell ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Location</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase hidden sm:table-cell ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Trigger</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Confidence</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Status</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase hidden xl:table-cell ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Source</th>
                                <th className={`px-2 lg:px-4 py-3 text-left text-[10px] lg:text-xs font-bold uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={theme === 'dark' ? 'divide-y divide-slate-800' : 'divide-y divide-gray-200'}>
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className={`px-4 py-12 text-center ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                                        No leads found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <TableRow key={lead.id} lead={lead} isHighlighted={highlightedLeadId === lead.id.toString()} onDelete={handleDeleteLead} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => {
    const { theme } = useTheme();

    return (
        <div className={`rounded-xl p-3 lg:p-4 ${theme === 'dark' ? 'bg-surface/DEFAULT' : 'bg-gray-50'}`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg ${color} flex items-center justify-center mb-2`}>
                {icon}
            </div>
            <p className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            <p className={`text-[10px] lg:text-xs uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-600'}`}>{label}</p>
        </div>
    );
};

const TableRow = ({ lead, isHighlighted, onDelete }) => {
    const { theme } = useTheme();
    const contact = lead.contacts?.[0] || {};
    const confidence = Math.floor((lead.trigger_data?.confidence_score || 0) * 100);

    return (
        <tr
            id={`lead-row-${lead.id}`}
            className={`transition ${isHighlighted ? 'bg-cyan-900/30 ring-2 ring-cyan-500' : ''} ${theme === 'dark' ? 'hover:bg-zinc-900/50' : 'hover:bg-gray-100'}`}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <Building2 size={16} className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} />
                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{lead.trigger_data?.company_name || 'Unknown'}</span>
                </div>
            </td>
            <td className={`px-4 py-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{contact.name || '-'}</td>
            <td className="px-4 py-3">
                {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-primary-400 hover:text-cyan-300">
                        <Mail size={14} />
                        <span className="text-sm">{contact.email}</span>
                    </a>
                ) : (
                    <span className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}>-</span>
                )}
            </td>
            <td className={`px-4 py-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{lead.company_data?.industry || 'Unknown'}</td>
            <td className="px-4 py-3">
                <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <MapPin size={14} className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'} />
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
                    <div className={`w-16 h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-surface/DEFAULT-700' : 'bg-gray-300'}`}>
                        <div
                            className={`h-full ${confidence > 70 ? 'bg-green-500' : confidence > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${confidence}%` }}
                        />
                    </div>
                    <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{confidence}%</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-bold rounded ${lead.status === 'APPROVED' ? 'bg-green-500/20 text-success-500' :
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
                    className={`text-xs hover:text-primary-400 underline max-w-[200px] truncate block ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}
                >
                    {lead.trigger_data?.signal_source || 'N/A'}
                </a>
            </td>
            <td className="px-4 py-3">
                <button
                    onClick={() => onDelete(lead.id)}
                    className={'p-2 rounded-lg transition hover:bg-red-900/20 hover:text-red-400 ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}
                    title="Delete lead"
                >
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
};

export default LeadsDatabase;
