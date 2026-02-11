import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Approvals = () => {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const { theme } = useTheme();

    const fetchLeads = () => {
        fetch('http://127.0.0.1:8000/dashboard/leads')
            .then(res => res.json())
            .then(data => {
                setLeads(data);
                // Sync selected lead if it exists
                if (selectedLead) {
                    const updated = data.find(l => l.id === selectedLead.id);
                    if (updated) setSelectedLead(updated);
                } else if (data.length > 0) {
                    setSelectedLead(data[0]);
                }
            })
            .catch(err => console.error("Failed to fetch leads:", err));
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleRunSearch = async () => {
        setIsSearching(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/workflow/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'factory closing' })
            });

            if (response.ok) {
                // Refresh leads after search completes
                fetchLeads();
            } else {
                const error = await response.json();
                if (error.detail && error.detail.includes('Python 3.11 or 3.12')) {
                    alert('⚠️ AI Search requires Python 3.11 or 3.12\n\nYou are currently using Python 3.14 which is incompatible with the LangGraph workflow system.\n\nTo fix this, install Python 3.12:\nbrew install pyenv\npyenv install 3.12\npyenv local 3.12');
                } else {
                    alert('Search failed: ' + (error.detail || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error("Search failed:", error);
            alert('Search failed: ' + error.message);
        } finally {
            setIsSearching(false);
        }
    };

    // Helper to extract display data from complex backend state
    const getDisplayData = (lead) => {
        return {
            title: lead.trigger_data?.trigger_type || "Unknown Signal",
            company: lead.trigger_data?.company_name || "Unknown Company",
            source: lead.trigger_data?.signal_source || "Web",
            progress: Math.floor((lead.trigger_data?.confidence_score || 0) * 100),
            contact: lead.contacts?.[0]?.name || "Finding...",
            msg: lead.outreach_content?.linkedin_message || "Drafting..."
        };
    };

    return (
        <div>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 lg:mb-8">
                <div className="flex items-center gap-2 lg:gap-4">
                    <h2 className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Approval Center</h2>
                    <div className={`h-6 w-px ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>
                    <div className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="hidden sm:inline">Live Sync Active</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-4 w-full sm:w-auto">
                    <button onClick={() => alert("Notifications feature coming soon!")} className={`relative p-2 transition cursor-pointer ${theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                        <Bell size={20} />
                        <span className={`absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full border ${theme === 'dark' ? 'border-slate-900' : 'border-white'}`}></span>
                    </button>
                    <button
                        onClick={handleRunSearch}
                        disabled={isSearching}
                        className={`flex-1 sm:flex-none bg-primary-500 text-white px-3 lg:px-4 py-2 rounded-lg font-bold text-xs lg:text-sm hover:bg-primary-400 transition flex items-center justify-center gap-2 shadow-lg ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSearching ? (
                            <>
                                <span className="animate-spin">↻</span> Searching...
                            </>
                        ) : (
                            <>
                                <span className="text-lg leading-none">⚡</span> <span className="hidden sm:inline">Run AI Search</span><span className="sm:hidden">Search</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[500px] lg:h-[600px]">
                {/* List */}
                <div className="w-full lg:w-1/3 space-y-3 lg:space-y-4 overflow-y-auto pr-1 lg:pr-2">
                    {leads.length === 0 && !isSearching && <p className={`text-center text-sm italic mt-10 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>No leads found yet. Click "Run AI Search".</p>}
                    {isSearching && leads.length === 0 && <p className="text-primary-500 text-center text-sm italic mt-10 animate-pulse">Scanning the web for signals...</p>}

                    {leads.map((lead) => {
                        const d = getDisplayData(lead);
                        return (
                            <ApprovalItem
                                key={lead.id || lead.trigger_data?.company_name}
                                title={d.title}
                                company={d.company}
                                status={lead.status || 'PENDING'}
                                progress={d.progress}
                                initial={d.company[0]}
                                active={selectedLead === lead}
                                onClick={() => setSelectedLead(lead)}
                            />
                        );
                    })}
                </div>

                {/* Detail View */}
                {selectedLead && (
                    <div className="hidden lg:block flex-1">
                        <LeadDetailView lead={selectedLead} getDisplayData={getDisplayData} refreshLeadList={fetchLeads} />
                    </div>
                )}
                {selectedLead && (
                    <div className={`lg:hidden fixed inset-0 z-50 overflow-y-auto ${theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-100'}`}>
                        <div className={`sticky top-0 border-b p-4 flex items-center gap-2 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
                            <button onClick={() => setSelectedLead(null)} className={theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                                ← Back
                            </button>
                            <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Lead Details</span>
                        </div>
                        <LeadDetailView lead={selectedLead} getDisplayData={getDisplayData} refreshLeadList={fetchLeads} />
                    </div>
                )}
                {!selectedLead && leads.length > 0 && (
                    <div className={`hidden lg:flex flex-1 rounded-xl p-6 flex-col justify-center items-center ${theme === 'dark' ? 'bg-zinc-900 text-zinc-500' : 'bg-gray-50 text-gray-500'}`}>
                        Select a lead to view details
                    </div>
                )}
            </div>
        </div>
    );
};

const LeadDetailView = ({ lead, getDisplayData, refreshLeadList }) => {
    const d = getDisplayData(lead);
    const [isEditing, setIsEditing] = useState(false);
    const [messageDraft, setMessageDraft] = useState(d.msg);
    const [isUpdating, setIsUpdating] = useState(false);
    const { theme } = useTheme();

    // Sync message draft when lead changes
    useEffect(() => {
        setMessageDraft(d.msg);
        setIsEditing(false);
    }, [lead, d.msg]);

    const handleAction = async (actionType) => {
        setIsUpdating(true);
        try {
            const updates = {};
            if (actionType === 'APPROVE') {
                updates.status = 'APPROVED';
                updates.outreach_content = { linkedin_message: messageDraft };
            } else if (actionType === 'DISCARD') {
                updates.status = 'DISCARDED';
            }

            console.log(`[Approvals] Updating lead ${lead.id} with action ${actionType}`, updates);
            const res = await fetch(`http://127.0.0.1:8000/dashboard/leads/${lead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            console.log(`[Approvals] Response status: ${res.status}`);
            if (res.ok) {
                console.log("[Approvals] Update successful, refreshing list...");
                refreshLeadList();
            } else {
                console.error("Failed to update lead", await res.text());
                alert(`Error: Failed to update lead. Server returned ${res.status}`);
            }
        } catch (error) {
            console.error("Error updating lead:", error);
            alert(`Error: Connection failed. ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className={`flex-1 rounded-xl p-6 flex flex-col animate-in fade-in duration-300 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white shadow-lg'}`}>
            <div className="mb-6">
                <div className="text-primary-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>((●))</span> TRIGGER DETECTED
                </div>
                <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{d.title}</h3>
                <p className={`text-sm italic mb-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Signal detected via {d.source}. High confidence event.
                </p>
                <div className="flex gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${theme === 'dark' ? 'bg-zinc-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Web Signal</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${theme === 'dark' ? 'bg-zinc-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>{d.company}</span>
                </div>
            </div>

            <div className={`rounded-xl p-4 mb-6 border ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-xs font-bold uppercase mb-3 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-600'}`}>Target Profile</h4>
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full border-2 border-cyan-500 overflow-hidden relative ${theme === 'dark' ? 'bg-slate-200' : 'bg-gray-300'}`}>
                        <div className={`w-full h-full flex items-center justify-center font-bold text-xl ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-400'}`}>{d.company[0]}</div>
                    </div>
                    <div>
                        <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{d.company}</h4>
                        <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Contact: {d.contact}</p>
                        <div className={`flex gap-3 text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                            <span className="flex items-center gap-1">🔗 {d.source}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-2">
                <h4 className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-600'}`}>AI Drafted Email Message</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-zinc-900 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>PERSONA: <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Professional Email</span></span>
            </div>

            <div className={`p-6 rounded-lg border font-mono text-sm mb-6 flex-1 shadow-inner relative transition-colors ${theme === 'dark' ? 'bg-zinc-950 text-gray-300 border-zinc-700' : 'bg-white text-gray-700 border-gray-300'} ${isEditing ? 'border-cyan-500 ring-1 ring-cyan-500' : ''}`}>
                {isEditing ? (
                    <textarea
                        value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                        className="w-full h-full bg-transparent resize-none focus:outline-none"
                    />
                ) : (
                    <p className="whitespace-pre-wrap">{messageDraft}</p>
                )}
                <div className={`absolute bottom-2 right-2 text-[10px] flex items-center gap-1 ${theme === 'dark' ? 'text-zinc-600' : 'text-gray-500'}`}>
                    <span>{isEditing ? 'Editing...' : '⌨️ CMD + E to Edit'}</span>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={'w-1/4 py-3 border rounded-lg font-medium text-sm flex flex-col items-center justify-center leading-none ' + (isEditing ? 'border-cyan-500 text-primary-400' : (theme === 'dark' ? 'border-slate-600 text-gray-300 hover:bg-zinc-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100'))}
                >
                    <span>{isEditing ? 'Save Draft' : 'Edit'}</span>
                    <span className="text-[10px] opacity-60">Message</span>
                </button>
                <button
                    onClick={() => handleAction('DISCARD')}
                    disabled={isUpdating}
                    className="w-1/4 py-3 border border-red-900/30 text-red-400 rounded-lg hover:bg-red-900/10 font-medium text-sm flex flex-col items-center justify-center leading-none disabled:opacity-50"
                >
                    <span>Discard</span>
                    <span className="text-[10px] opacity-60">Lead</span>
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={() => handleAction('APPROVE')}
                    disabled={isUpdating}
                    className="w-1/3 py-3 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-400 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                    {isUpdating ? 'Sending...' : 'Approve & Send'}
                </button>
            </div>
        </div>
    )
}

const ApprovalItem = ({ title, company, status, progress, initial, active, onClick }) => {
    const { theme } = useTheme();

    const getContainerClassName = () => {
        const base = 'p-4 rounded-lg border cursor-pointer ';
        if (active) {
            return base + (theme === 'dark' ? 'bg-zinc-900 border-cyan-500/50' : 'bg-gray-200 border-cyan-500/50');
        }
        return base + (theme === 'dark' ? 'bg-zinc-900/50 hover:bg-zinc-900' : 'bg-gray-50 hover:bg-gray-100');
    };

    const getBorderClassName = () => {
        return theme === 'dark' ? 'border-zinc-700' : 'border-gray-200';
    };

    const getAvatarClassName = () => {
        return 'w-8 h-8 rounded flex items-center justify-center font-bold ' +
               (theme === 'dark' ? 'bg-zinc-800 text-gray-300' : 'bg-gray-300 text-gray-700');
    };

    const getTextClassName = () => {
        return theme === 'dark' ? 'text-white' : 'text-gray-900';
    };

    const getSubtextClassName = () => {
        return theme === 'dark' ? 'text-zinc-500' : 'text-gray-600';
    };

    const getStatusClassName = () => {
        if (status === 'PENDING') {
            return 'text-[10px] px-2 py-1 rounded h-fit bg-yellow-500/20 text-yellow-500';
        }
        return 'text-[10px] px-2 py-1 rounded h-fit ' +
               (theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-300 text-gray-600');
    };

    const getProgressBarBgClassName = () => {
        return 'flex-1 h-1 rounded-full overflow-hidden ' +
               (theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-300');
    };

    const containerClassName = getContainerClassName() + ' ' + getBorderClassName();
    const progressStyle = { width: progress + '%' };

    return (
        <div onClick={onClick} className={containerClassName}>
            <div className="flex justify-between mb-2">
                <div className="flex gap-3">
                    <div className={getAvatarClassName()}>{initial}</div>
                    <div>
                        <h4 className={'font-bold text-sm ' + getTextClassName()}>{title}</h4>
                        <p className={'text-xs ' + getSubtextClassName()}>{company}</p>
                    </div>
                </div>
                <span className={getStatusClassName()}>{status}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <div className={getProgressBarBgClassName()}>
                    <div className="h-full bg-primary-500" style={progressStyle}></div>
                </div>
                <span className="text-xs font-mono text-primary-400">{progress}%</span>
            </div>
        </div>
    );
}

export default Approvals;
