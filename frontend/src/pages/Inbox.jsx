import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, Mail, ArrowLeft, Users, Building, TrendingUp, X, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Inbox = () => {
    const { theme } = useTheme();
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

    // Filter leads based on selected filter type
    const getFilteredLeads = () => {
        const approvedLeads = leads.filter(l => l.status === 'APPROVED');
        if (filterType === 'ALL') {
            return approvedLeads;
        } else if (filterType === 'POSITIVE') {
            return approvedLeads.filter(l => l.status === 'REPLIED');
        } else if (filterType === 'NEUTRAL') {
            return approvedLeads.filter(l => l.status !== 'REPLIED');
        }
        return approvedLeads;
    };

    const fetchInbox = () => {
        fetch('http://127.0.0.1:8000/dashboard/leads')
            .then(res => res.json())
            .then(data => {
                setLeads(data);

                const storedLeadId = sessionStorage.getItem('selectedLeadId');

                if (selectedLead) {
                    const updated = data.find(l => l.id === selectedLead.id);
                    if (updated) setSelectedLead(updated);
                } else if (storedLeadId) {
                    const leadFromStorage = data.find(l => l.id.toString() === storedLeadId);
                    if (leadFromStorage) {
                        setSelectedLead(leadFromStorage);
                        sessionStorage.removeItem('selectedLeadId');
                    } else {
                        const approved = data.filter(l => l.status === 'APPROVED');
                        if (approved.length > 0) setSelectedLead(approved[0]);
                    }
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
            const res = await fetch(`http://127.0.0.1:8000/email/send/${selectedLead.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: inputValue })
            });

            if (res.ok) {
                setInputValue("");
                fetchInbox();
            } else {
                const error = await res.json();
                alert("Failed to send email: " + (error.detail || error.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Failed to send:", error);
            alert("Failed to send email: " + error.message);
        }
    };

    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        if (window.innerWidth < 1024) {
            setShowMobileChat(true);
        }
    };

    const handleBackToList = () => {
        setShowMobileChat(false);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-5rem)]">
            {/* Conversation List */}
            <div className={`flex flex-col ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white border border-gray-200'} rounded-2xl overflow-hidden ${showMobileChat ? 'hidden lg:flex w-full lg:w-72 xl:w-80' : 'flex w-full lg:w-72 xl:w-80'}`}>
                <header className="p-4 pb-3">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
                            <p className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-600'}`}>{getFilteredLeads().length} conversations</p>
                        </div>
                        <div className="bg-primary-500/10 px-2 py-1.5 rounded-full">
                            <Mail size={14} className="text-primary-400" />
                        </div>
                    </div>

                    <div className="flex gap-1.5">
                        {['ALL', 'POSITIVE', 'NEUTRAL'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setFilterType(filter)}
                                className={'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + (filterType === filter ? 'bg-primary-500 text-white' : theme === 'dark' ? 'text-zinc-400 hover:text-white bg-zinc-900/50' : 'text-gray-600 hover:text-gray-900 bg-gray-100')}
                            >
                                {filter === 'ALL' ? 'All' : filter === 'POSITIVE' ? 'Replied' : 'Pending'}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {getFilteredLeads().length === 0 && (
                        <div className={'flex flex-col items-center justify-center h-48 ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                            <Mail size={36} className="mb-2 opacity-50" />
                            <p className="text-xs">No conversations yet</p>
                        </div>
                    )}

                    {getFilteredLeads().map(lead => (
                        <InboxItem
                            key={lead.id}
                            name={lead.contacts[0]?.name || lead.trigger_data?.company_name || "Unknown"}
                            company={lead.trigger_data?.company_name}
                            snippet={lead.outreach_content?.email_message || lead.outreach_content?.linkedin_message || "No message content"}
                            time="Just now"
                            active={selectedLead?.id === lead.id}
                            onClick={() => handleSelectLead(lead)}
                            status={lead.status}
                        />
                    ))}
                </div>
            </div>

            {/* Chat View */}
            <div className={'flex-1 flex flex-col rounded-2xl overflow-hidden ' + (theme === 'dark' ? 'bg-zinc-950' : 'bg-white') + ' ' + (showMobileChat ? 'fixed inset-0 z-50 lg:static' : 'hidden lg:flex')}>
                {showMobileChat && (
                    <div className={'lg:hidden flex items-center gap-3 px-4 py-3 ' + (theme === 'dark' ? 'bg-zinc-950' : 'bg-white border-b border-gray-200')}>
                        <button onClick={handleBackToList} className={theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                            <ArrowLeft size={20} />
                        </button>
                        <span className={'font-semibold text-sm ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Back to Messages</span>
                    </div>
                )}

                {!selectedLead ? (
                    <div className={'flex flex-col items-center justify-center h-full ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                        <Users size={48} className="mb-3 opacity-50" />
                        <p className="text-base font-medium">Select a conversation</p>
                        <p className="text-sm mt-1">Choose a conversation from the list to view messages</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className={(showMobileChat ? 'hidden ' : 'flex ') + 'items-center justify-between px-4 lg:px-6 py-4 ' + (theme === 'dark' ? 'bg-zinc-950' : 'bg-white border-b border-gray-200')}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center font-bold text-white text-sm">
                                    {(selectedLead.contacts[0]?.name || selectedLead.trigger_data?.company_name || "U")[0]}
                                </div>
                                <div>
                                    <h3 className={'font-semibold text-sm ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                        {selectedLead.contacts[0]?.name || selectedLead.trigger_data?.company_name}
                                    </h3>
                                    <p className={'text-xs ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>{selectedLead.trigger_data?.company_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedLead.status === 'REPLIED' && (
                                    <div className="bg-success-500/10 text-success-500 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                        <CheckCircle size={14} />
                                        Replied
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                                    className={'p-2 rounded-lg transition-colors ' + (showDetailsPanel ? 'bg-primary-500 text-white' : theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}
                                    title="View company details"
                                >
                                    <Info size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
                            <div className="text-center">
                                <p className={'text-xs uppercase tracking-wider mb-3 ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>Today</p>
                            </div>

                            <MessageBubble
                                isAi
                                content={selectedLead.outreach_content?.email_message || selectedLead.outreach_content?.linkedin_message || "Message content missing..."}
                                time="Just now"
                            />

                            {selectedLead.memory?.messages?.map((msg, idx) => (
                                <MessageBubble
                                    key={msg.timestamp || msg.content?.substring(0, 20) || idx}
                                    content={msg.content}
                                    time={msg.timestamp}
                                    isAi={msg.isAi}
                                    isIncoming={msg.is_incoming}
                                />
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className={'p-4 lg:p-5 ' + (theme === 'dark' ? 'bg-zinc-950' : 'bg-white border-t border-gray-200')}>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className={'w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ' + (theme === 'dark' ? 'bg-zinc-900 text-white placeholder:text-zinc-500' : 'bg-gray-100 text-gray-900 placeholder:text-gray-500')}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    className="bg-primary-500 hover:bg-primary-400 text-white p-3 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Company Details Panel - Part of layout on desktop, overlay on mobile */}
            <>
                {/* Mobile: Fixed overlay with backdrop */}
                {showDetailsPanel && selectedLead && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setShowDetailsPanel(false)}
                    ></div>
                )}

                {/* Panel - Fixed overlay on mobile, part of layout on desktop */}
                {showDetailsPanel && selectedLead ? (
                    <div className={'fixed inset-y-0 right-0 z-50 shadow-2xl overflow-hidden flex flex-col lg:static lg:shadow-xl lg:z-auto w-full sm:w-80 transition-all duration-300 ' + (theme === 'dark' ? 'bg-zinc-900' : 'bg-white') + ' ' + (showDetailsPanel ? 'translate-x-0' : 'translate-x-full')}>
                        {/* Panel Header */}
                        <div className={'flex items-center justify-between px-4 py-4 flex-shrink-0 ' + (theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-100 border-b border-gray-200')}>
                            <h3 className={'font-semibold ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Lead Details</h3>
                            <button
                                onClick={() => setShowDetailsPanel(false)}
                                className={'p-2 rounded-lg transition-colors ' + (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                            {/* Lead Info */}
                            <div>
                                <h4 className={'text-xs font-semibold mb-3 flex items-center gap-2 ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                    <Building size={16} className="text-primary-400" />
                                    Company Details
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className={'text-[10px] uppercase tracking-wider ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>Company Name</p>
                                        <p className={'text-sm font-medium ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>{selectedLead.trigger_data?.company_name || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className={'text-[10px] uppercase tracking-wider ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>Industry</p>
                                        <p className={'text-sm font-medium ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>{selectedLead.company_data?.industry || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className={'text-[10px] uppercase tracking-wider ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>Location</p>
                                        <p className={'text-sm font-medium ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>{selectedLead.company_data?.location || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Confidence Score */}
                            <div>
                                <h4 className={'text-xs font-semibold mb-3 flex items-center gap-2 ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                    <TrendingUp size={16} className="text-success-500" />
                                    AI Confidence
                                </h4>
                                <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/10 rounded-xl p-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className={'text-4xl font-bold ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                                {Math.floor((selectedLead.trigger_data?.confidence_score || 0) * 100)}
                                                <span className="text-xl text-primary-400">%</span>
                                            </p>
                                            <p className={'text-xs mt-1 ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>Match Score</p>
                                        </div>
                                        <div className="h-14 w-14 relative">
                                            <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-pulse"></div>
                                            <div className="absolute inset-2 bg-primary-500 rounded-full animate-ping"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div>
                                <h4 className={'text-xs font-semibold mb-3 ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Engagement</h4>
                                <div className="space-y-2">
                                    <div className={'flex items-center justify-between p-3 rounded-xl ' + (theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-100')}>
                                        <span className={'text-sm ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>Messages</span>
                                        <span className={'text-sm font-semibold ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>{selectedLead.memory?.messages?.length || 1}</span>
                                    </div>
                                    <div className={'flex items-center justify-between p-3 rounded-xl ' + (theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-100')}>
                                        <span className={'text-sm ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>Status</span>
                                        <span className={'text-sm font-semibold ' + (selectedLead.status === 'REPLIED' ? 'text-success-500' : 'text-yellow-400')}>
                                            {selectedLead.status === 'REPLIED' ? 'Active' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </>
        </div>
    );
};

const InboxItem = ({ name, company, snippet, time, active, onClick, status }) => {
    const { theme } = useTheme();
    const replied = status === 'REPLIED';

    return (
        <div
            onClick={onClick}
            className={'p-3 rounded-xl cursor-pointer transition-all ' + (active ? 'bg-primary-500/10' : theme === 'dark' ? 'bg-zinc-900/30 hover:bg-zinc-900/50' : 'bg-gray-100 hover:bg-gray-200')}
        >
            <div className="flex items-start gap-2">
                <div className={'w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ' + (replied ? 'bg-success-500/20 text-success-500' : 'bg-primary-500/20 text-primary-400')}>
                    {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <h4 className={'text-xs font-semibold truncate pr-1.5 ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>{name}</h4>
                        <span className={'text-[9px] flex-shrink-0 ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>{time}</span>
                    </div>
                    <p className={'text-[10px] mb-1 ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>{company}</p>
                    <p className={'text-[10px] line-clamp-2 leading-relaxed ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-700')}> "{snippet}"</p>
                </div>
            </div>
        </div>
    );
};

const MessageBubble = ({ content, time, isAi, isIncoming, side = 'right' }) => {
    const { theme } = useTheme();
    if (isIncoming) side = 'left';
    if (isAi) side = 'right';

    return (
        <div className={'flex flex-col ' + (side === 'left' ? 'items-start' : 'items-end')}>
            <div className={'max-w-[85%] lg:max-w-[70%] p-4 lg:p-5 rounded-2xl text-sm leading-relaxed ' + (side === 'left'
                ? theme === 'dark' ? 'bg-zinc-900 text-zinc-200' : 'bg-gray-200 text-gray-800'
                : 'bg-gradient-to-br from-primary-400 to-primary-500 text-white') + ' ' + (side === 'left' ? 'rounded-tl-none' : 'rounded-tr-none shadow-lg')}>
                <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
            </div>
            {time && <span className={'text-xs mt-1 ml-1 ' + (theme === 'dark' ? 'text-zinc-600' : 'text-gray-500')}>{time}</span>}
        </div>
    );
};

export default Inbox;
