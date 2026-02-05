import React, { useState } from 'react';
import { Send, CheckCircle, AlertTriangle, Calendar, UserMinus, Plus } from 'lucide-react';

const Inbox = () => {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [inputValue, setInputValue] = useState("");

    const fetchInbox = () => {
        fetch('http://127.0.0.1:8000/dashboard/leads')
            .then(res => res.json())
            .then(data => {
                setLeads(data);
                if (selectedLead) {
                    // Refresh selected lead data
                    const updated = data.find(l => l.id === selectedLead.id);
                    if (updated) setSelectedLead(updated);
                } else {
                    const approved = data.filter(l => l.status === 'APPROVED');
                    if (approved.length > 0) setSelectedLead(approved[0]);
                }
            })
            .catch(err => console.error("Failed to fetch inbox:", err));
    };

    React.useEffect(() => {
        fetchInbox();
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !selectedLead) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/dashboard/leads/${selectedLead.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: inputValue, sender: "User" })
            });

            if (res.ok) {
                setInputValue("");
                fetchInbox(); // Refresh to see new message
            }
        } catch (error) {
            console.error("Failed to send:", error);
        }
    };

    return (
        <div className="flex h-[85vh] gap-6">
            {/* Conversation List */}
            <div className="w-1/3 flex flex-col gap-4">
                <header className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Inbox</h2>
                    <div className="flex gap-2 text-xs">
                        <button className="bg-cyan-600 px-3 py-1 rounded">All</button>
                        <button className="bg-slate-800 text-slate-400 px-3 py-1 rounded border border-slate-700">Positive</button>
                        <button className="bg-slate-800 text-slate-400 px-3 py-1 rounded border border-slate-700">Neutral</button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {/* Real Data Integration */}
                    {leads.filter(l => l.status === 'APPROVED').length === 0 && (
                        <p className="text-slate-500 text-sm text-center italic mt-10">No approved leads yet.</p>
                    )}

                    {leads.filter(l => l.status === 'APPROVED').map(lead => (
                        <InboxItem
                            key={lead.id}
                            name={lead.contacts[0]?.name || lead.trigger_data?.company_name || "Unknown"}
                            role={lead.contacts[0]?.role || "Decision Maker"}
                            snippet={lead.outreach_content?.linkedin_message || "No message content"}
                            time="Just now"
                            status="POSITIVE" // Mocking intent for now
                            active={selectedLead?.id === lead.id}
                            onClick={() => setSelectedLead(lead)}
                        />
                    ))}
                </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    {selectedLead ? (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center font-bold">
                                    {/* Placeholder Avatar */}
                                    {(selectedLead.contacts[0]?.name || "U")[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold">{selectedLead.contacts[0]?.name || selectedLead.trigger_data?.company_name}</h3>
                                    <p className="text-xs text-slate-500">{selectedLead.trigger_data?.company_name} • Sent just now</p>
                                </div>
                            </div>
                            <div className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded flex items-center gap-2">
                                <CheckCircle size={14} />
                                POSITIVE - OUTREACH SENT
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-500">Select a lead to view conversation</div>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/50">
                    {selectedLead ? (
                        <>
                            <p className="text-center text-xs text-slate-500 mb-4 bg-slate-900 w-fit mx-auto px-3 py-1 rounded-full border border-slate-800">HISTORY</p>

                            <Message
                                isAi
                                content={selectedLead.outreach_content?.linkedin_message || "Message content missing..."}
                            />

                            {/* Stored Messages */}
                            {selectedLead.messages?.map((msg, idx) => (
                                <Message
                                    key={idx}
                                    content={msg.content}
                                    time={msg.timestamp}
                                    isAi={msg.isAi}
                                />
                            ))}
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-500">
                            No conversation selected
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <div className="flex gap-2">
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg flex items-center px-4 py-3 text-slate-400 text-sm">
                            <span className="mr-2 opacity-50">📎</span>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="bg-transparent flex-1 focus:outline-none text-white"
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!selectedLead}
                            className="bg-cyan-600 w-12 rounded-lg flex items-center justify-center hover:bg-cyan-500 disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="w-1/4 space-y-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">Immediate Actions</h4>
                    <ActionButton icon={<Plus size={16} />} label="Hand off to Sales Human" primary />
                    <ActionButton icon={<Calendar size={16} />} label="Schedule Follow-up" />
                    <ActionButton icon={<UserMinus size={16} />} label="Mark as Not Interested" color="text-red-400 hover:bg-red-900/20" />
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase">Lead Intelligence</h4>

                    {selectedLead ? (
                        <>
                            <InfoRow label="COMPANY" value={selectedLead.trigger_data?.company_name || "Unknown"} />
                            <InfoRow label="INDUSTRY" value={selectedLead.company_data?.industry || "Unknown"} />
                            <InfoRow label="LOCATION" value={selectedLead.company_data?.location || "Unknown"} />

                            <div className="mt-4 p-4 bg-slate-800 rounded-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-xs text-cyan-400 font-bold mb-1">AI Confidence Score</p>
                                    <p className="text-4xl font-bold text-white">
                                        {Math.floor((selectedLead.trigger_data?.confidence_score || 0) * 100)}%
                                        <span className="text-xs font-normal text-slate-400"> MATCH</span>
                                    </p>
                                </div>
                                {/* Decorative blob */}
                                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500 rounded-full blur-2xl opacity-20"></div>
                            </div>
                        </>
                    ) : (
                        <p className="text-slate-500 text-sm">Select a lead to view intelligence</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const InboxItem = ({ name, role, snippet, time, status, active, onClick }) => (
    <div onClick={onClick} className={`p-4 rounded-lg cursor-pointer border ${active ? 'bg-slate-800 border-cyan-500/50' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}>
        <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-sm text-white">{name}</h4>
            <span className="text-xs text-slate-500">{time}</span>
        </div>
        <p className="text-xs text-cyan-400 mb-2">{role}</p>
        <p className="text-xs text-slate-400 line-clamp-2 italic">"{snippet}"</p>
        <div className="mt-2 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status === 'POSITIVE' ? 'bg-green-500' : status === 'NEUTRAL' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">{status} INTENT</span>
        </div>
    </div>
);

const Message = ({ content, time, isAi, side = 'right' }) => (
    <div className={`flex flex-col ${side === 'left' ? 'items-start' : 'items-end'}`}>
        {isAi && <div className="bg-cyan-900/20 border border-cyan-900/50 text-slate-400 text-xs px-2 py-1 rounded w-fit mb-1 flex items-center gap-1"><span>🤖</span> AI AGENT</div>}

        <div className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed ${side === 'left' ? 'bg-slate-800 text-slate-300 rounded-tl-none' : 'bg-cyan-600 text-white rounded-tr-none'}`}>
            {content}
        </div>
        {time && <span className="text-[10px] text-slate-500 mt-1 uppercase">{time}</span>}
    </div>
);

const ActionButton = ({ icon, label, primary, color = "text-slate-300 hover:bg-slate-800" }) => (
    <button className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition ${primary ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : `bg-slate-950 ${color}`}`}>
        <span>{label}</span>
        {icon}
    </button>
);

const InfoRow = ({ label, value, external }) => (
    <div className="mb-4 last:mb-0">
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{label}</p>
        <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">{value}</p>
            {external && <span className="text-xs text-slate-500">↗</span>}
        </div>
    </div>
);

export default Inbox;
