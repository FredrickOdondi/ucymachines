import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

const Approvals = () => {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const fetchLeads = () => {
        fetch('http://127.0.0.1:8000/dashboard/leads')
            .then(res => res.json())
            .then(data => {
                setLeads(data);
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
            await fetch('http://127.0.0.1:8000/workflow/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'factory closing' })
            });
            // Refresh leads after search completes
            fetchLeads();
        } catch (error) {
            console.error("Search failed:", error);
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
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Approval Center</h2>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live Sync Active</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-slate-400 hover:text-white transition">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full border border-slate-900"></span>
                    </button>
                    {/* Trigger search manually for demo */}
                    <button
                        onClick={handleRunSearch}
                        disabled={isSearching}
                        className={`bg-cyan-500 text-slate-900 px-4 py-2 rounded font-bold text-sm hover:bg-cyan-400 transition flex items-center gap-2 ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSearching ? (
                            <>
                                <span className="animate-spin">↻</span> Searching...
                            </>
                        ) : (
                            <>
                                <span className="text-lg leading-none">⚡</span> Run AI Search
                            </>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex gap-6 h-[600px]">
                {/* List */}
                <div className="w-1/3 space-y-4 overflow-y-auto pr-2">
                    {leads.length === 0 && !isSearching && <p className="text-slate-500 text-center italic mt-10">No leads found yet. Click "Run AI Search".</p>}
                    {isSearching && leads.length === 0 && <p className="text-cyan-500 text-center italic mt-10 animate-pulse">Scanning the web for signals...</p>}

                    {leads.map((lead, idx) => {
                        const d = getDisplayData(lead);
                        return (
                            <ApprovalItem
                                key={idx}
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
                    <LeadDetailView lead={selectedLead} getDisplayData={getDisplayData} refreshLeadList={fetchLeads} />
                )}
                {!selectedLead && leads.length > 0 && (
                    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col justify-center items-center text-slate-500">
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
                //alert("Success: Lead updated!"); // Optional: Feedback
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
        <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col animate-in fade-in duration-300">
            <div className="mb-6">
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>((●))</span> TRIGGER DETECTED
                </div>
                <h3 className="text-xl font-bold mb-2">{d.title}</h3>
                <p className="text-slate-400 text-sm italic mb-3">
                    Signal detected via {d.source}. High confidence event.
                </p>
                <div className="flex gap-2">
                    <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase">Web Signal</span>
                    <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase">{d.company}</span>
                </div>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Target Profile</h4>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-cyan-500 overflow-hidden relative">
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center font-bold text-xl">{d.contact[0]}</div>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white">{d.contact}</h4>
                        <p className="text-slate-400 text-sm mb-1">Decision Maker at {d.company}</p>
                        <div className="flex gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">🔗 linkedin.com/search</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">AI Drafted Message</h4>
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">PERSONA: <span className="text-white font-bold">Executive Direct</span></span>
            </div>

            <div className={`bg-slate-950 p-6 rounded-lg border ${isEditing ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-slate-700'} font-mono text-sm text-slate-300 mb-6 flex-1 shadow-inner relative transition-colors`}>
                {isEditing ? (
                    <textarea
                        value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                        className="w-full h-full bg-transparent resize-none focus:outline-none"
                    />
                ) : (
                    <p className="whitespace-pre-wrap">{messageDraft}</p>
                )}

                <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 flex items-center gap-1">
                    <span>{isEditing ? 'Editing...' : '⌨️ CMD + E to Edit'}</span>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`w-1/4 py-3 border rounded-lg hover:bg-slate-800 font-medium text-sm flex flex-col items-center justify-center leading-none ${isEditing ? 'border-cyan-500 text-cyan-400' : 'border-slate-600 text-slate-300'}`}
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
                    className="w-1/3 py-3 bg-cyan-500 text-slate-900 rounded-lg font-bold hover:bg-cyan-400 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.5)] disabled:opacity-50"
                >
                    {isUpdating ? 'Sending...' : 'Approve & Send'}
                </button>
            </div>
        </div>
    )
}

const ApprovalItem = ({ title, company, status, progress, initial, active, onClick }) => (
    <div onClick={onClick} className={`p-4 rounded-lg border cursor-pointer border-slate-700 ${active ? 'bg-slate-800 border-cyan-500/50' : 'bg-slate-900/50 hover:bg-slate-800'}`}>
        <div className="flex justify-between mb-2">
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-slate-300">{initial}</div>
                <div>
                    <h4 className="font-bold text-sm text-white">{title}</h4>
                    <p className="text-xs text-slate-500">{company}</p>
                </div>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded h-fit ${status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-700 text-slate-400'}`}>{status}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs font-mono text-cyan-400">{progress}%</span>
        </div>
    </div>
)

export default Approvals;
