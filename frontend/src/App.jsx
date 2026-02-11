import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import ActivityFeed from './components/ActivityFeed';
import Approvals from './pages/Approvals';
import Inbox from './pages/Inbox';
import Config from './pages/Config';
import LeadsDatabase from './pages/LeadsDatabase';
import EmsAutomation from './pages/EmsAutomation';
import NickChatWidget from './components/NickChatWidget';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route path="/*" element={<MainApp />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

const MainApp = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { theme } = useTheme();

    const handleLogout = () => {
        alert("Logout feature - authentication has been disabled");
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <>
            <div className={`flex h-screen font-sans overflow-hidden relative ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-gray-900'}`}>
                <Sidebar
                    currentPage={currentPage}
                    onNavigate={setCurrentPage}
                    user={{ name: 'Admin', email: 'admin@machineryleads.com' }}
                    onLogout={handleLogout}
                    isCollapsed={isSidebarCollapsed}
                    onToggle={toggleSidebar}
                />
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">
                    {/* Mobile menu button */}
                    <div className="sm:hidden flex items-center gap-3 mb-4">
                        <button
                            onClick={toggleSidebar}
                            className={`flex items-center justify-center p-2 rounded-lg ${theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'} transition-colors`}
                        >
                            <Menu size={20} />
                        </button>
                        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>MachineryLeads</span>
                    </div>

                    {currentPage === 'dashboard' && <DashboardPage setCurrentPage={setCurrentPage} />}
                    {currentPage === 'approvals' && <Approvals />}
                    {currentPage === 'inbox' && <Inbox />}
                    {currentPage === 'leads' && <LeadsDatabase />}
                    {currentPage === 'config' && <Config />}
                    {currentPage === 'ems' && <EmsAutomation />}
                </main>
            </div>
            <NickChatWidget currentPage={currentPage} />
        </>
    );
};

const DashboardPage = ({ setCurrentPage }) => {
    const [leads, setLeads] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [timeRange, setTimeRange] = React.useState('week');
    const { theme, toggleTheme } = useTheme();

    React.useEffect(() => {
        fetch('http://127.0.0.1:8000/dashboard/leads')
            .then(res => res.json())
            .then(data => {
                setLeads(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch leads:', err);
                setLoading(false);
            });
    }, []);

    // Calculate metrics
    const needsFollowUp = leads.filter(l => l.memory?.follow_up_required && l.status === 'APPROVED');
    const hotLeads = leads.filter(l => l.status === 'APPROVED').slice(0, 5);
    const totalPotentialValue = leads.length * 50000;
    const contacted = leads.filter(l => l.execution_status?.message_sent).length;
    const responsive = leads.filter(l => l.memory?.response_received).length;
    const pendingApproval = leads.filter(l => l.status === 'PENDING').length;

    // Quick actions
    const quickActions = [
        { icon: '🔄', label: 'Scrape EMS', color: 'from-blue-600 to-blue-700', page: 'ems' },
        { icon: '🔍', label: 'Search LinkedIn', color: 'from-purple-600 to-purple-700', page: 'inbox' },
        { icon: '✓', label: 'Approvals', color: 'from-green-600 to-green-700', page: 'approvals', count: pendingApproval },
        { icon: '💼', label: 'All Leads', color: 'from-cyan-600 to-cyan-700', page: 'leads', count: leads.length },
    ];

    const handleQuickAction = (page) => {
        if (page && setCurrentPage) {
            setCurrentPage(page);
        }
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) return '📈';
        if (trend < 0) return '📉';
        return '➡️';
    };

    return (
        <>
            {/* Header */}
            <header className="mb-6 lg:mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h1 className={`text-2xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text ${theme === 'dark' ? 'text-transparent' : 'text-cyan-600'}`}>
                            Machinery Leads Dashboard
                        </h1>
                        <p className={`text-sm lg:text-base ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>AI-powered lead generation and outreach automation</p>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto">
                        <div className={`flex items-center gap-2 rounded-lg px-3 lg:px-4 py-2 ${theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-100'}`}>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className={`text-xs lg:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>System Active</span>
                        </div>
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center justify-center p-2.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button onClick={() => handleQuickAction('ems')} className="bg-gradient-to-r from-blue-600 to-primary-600 hover:from-blue-500 hover:to-cyan-500 px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg text-xs lg:text-sm font-bold text-white transition shadow-lg shadow-blue-500/25 cursor-pointer whitespace-nowrap">
                            🚀 Quick Actions
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => handleQuickAction(action.page)}
                            className={`bg-gradient-to-br ${action.color} rounded-xl p-3 lg:p-4 text-white text-left hover:scale-105 transition-transform shadow-lg cursor-pointer`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xl lg:text-2xl">{action.icon}</span>
                                {action.count !== undefined && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {action.count}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm lg:font-semibold">{action.label}</div>
                        </button>
                    ))}
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6 lg:mb-8">
                <StatCard
                    title="Total Leads"
                    value={leads.length}
                    subtitle="in pipeline"
                    icon="🎯"
                    color="from-blue-600 to-blue-800"
                    trend="+12%"
                />
                <StatCard
                    title="Approved"
                    value={leads.filter(l => l.status === 'APPROVED').length}
                    subtitle="ready to contact"
                    icon="✓"
                    color="from-emerald-600 to-emerald-800"
                    trend="+8%"
                />
                <StatCard
                    title="Contacted"
                    value={contacted}
                    subtitle="outreach sent"
                    icon="📧"
                    color="from-cyan-600 to-cyan-800"
                    trend="+23%"
                />
                <StatCard
                    title="Responses"
                    value={responsive}
                    subtitle="positive replies"
                    icon="💬"
                    color="from-purple-600 to-purple-800"
                    trend="+15%"
                />
                <StatCard
                    title="Pipeline Value"
                    value={`$${(totalPotentialValue / 1000).toFixed(0)}K`}
                    subtitle="estimated"
                    icon="💰"
                    color="from-amber-600 to-amber-800"
                    trend="+18%"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
                {/* Left Column - Hot Leads */}
                <div className="xl:col-span-8 space-y-4 lg:space-y-6">
                    {/* Top Leads Section */}
                    <div className={`backdrop-blur rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-xl ${theme === 'dark' ? 'bg-surface/DEFAULT/50' : 'bg-gray-50'}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
                            <div>
                                <h2 className={`text-xl lg:text-2xl font-bold flex items-center gap-2 lg:gap-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    <span className="bg-gradient-to-br from-orange-500 to-red-500 w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center text-lg lg:text-xl">🔥</span>
                                    Hot Leads
                                </h2>
                                <p className={`text-xs lg:text-sm mt-1 ml-9 lg:ml-13 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Approved and ready for outreach</p>
                            </div>
                            <button onClick={() => handleQuickAction('leads')} className="text-primary-400 hover:text-cyan-300 text-xs lg:text-sm font-medium flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                View All
                                <span>→</span>
                            </button>
                        </div>

                        {loading ? (
                            <div className={`text-center py-8 lg:py-12 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                                <div className="animate-spin w-6 h-6 lg:w-8 lg:h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                Loading leads...
                            </div>
                        ) : hotLeads.length === 0 ? (
                            <div className={`text-center py-8 lg:py-12 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'text-zinc-400 bg-zinc-900/30 border-medium' : 'text-gray-600 bg-gray-100 border-gray-300'}`}>
                                <div className="text-3xl lg:text-4xl mb-3">📭</div>
                                <p className="text-sm lg:text-base">No approved leads yet. Start scraping to discover opportunities!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 lg:space-y-4">
                                {hotLeads.map((lead, idx) => (
                                    <LeadCard key={lead.id} lead={lead} idx={idx} setCurrentPage={setCurrentPage} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                        <MetricCard
                            title="Conversion Rate"
                            value={leads.length > 0 ? Math.round((responsive / leads.length) * 100) : 0}
                            unit="%"
                            subtitle="Leads to responses"
                            color="blue"
                            target="25%"
                        />
                        <MetricCard
                            title="Avg Response Time"
                            value="2.3"
                            unit="days"
                            subtitle="Time to first reply"
                            color="green"
                            target="< 3 days"
                        />
                        <MetricCard
                            title="Follow-up Rate"
                            value={needsFollowUp.length > 0 ? Math.round((contacted / (contacted + needsFollowUp.length)) * 100) : 100}
                            unit="%"
                            subtitle="Completion rate"
                            color="purple"
                            target="80%"
                        />
                    </div>
                </div>

                {/* Right Column - Activity & Alerts */}
                <div className="xl:col-span-4 space-y-4 lg:space-y-6">
                    {/* Urgent Actions */}
                    {(needsFollowUp.length > 0 || pendingApproval > 0) && (
                        <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-xl">
                            <h3 className={`text-base lg:text-lg font-bold mb-3 lg:mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <span className="text-lg lg:text-xl">⚡</span>
                                Urgent Actions
                            </h3>
                            <div className="space-y-2 lg:space-y-3">
                                {pendingApproval > 0 && (
                                    <AlertCard
                                        type="warning"
                                        title={`${pendingApproval} leads awaiting approval`}
                                        subtitle="Review and approve for outreach"
                                        action="Review Now"
                                        onAction={() => handleQuickAction('approvals')}
                                    />
                                )}
                                {needsFollowUp.slice(0, 2).map((lead) => (
                                    <AlertCard
                                        key={lead.id}
                                        type="urgent"
                                        title={`Follow-up: ${lead.trigger_data?.company_name}`}
                                        subtitle="Due for follow-up contact"
                                        action="Contact"
                                        onAction={() => handleQuickAction('leads')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className={`backdrop-blur rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-xl ${theme === 'dark' ? 'bg-surface/DEFAULT/50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-3 lg:mb-4">
                            <h3 className={`text-base lg:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activity Feed</h3>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className={`rounded-lg px-2 lg:px-3 py-1 text-xs ${theme === 'dark' ? 'bg-zinc-900 border border-slate-600 text-gray-300' : 'bg-white border border-gray-300 text-gray-700'}`}
                            >
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>
                        <ActivityFeed compact />
                    </div>

                    {/* Quick Stats */}
                    <div className={`backdrop-blur rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-xl ${theme === 'dark' ? 'bg-surface/DEFAULT/50' : 'bg-gray-50'}`}>
                        <h3 className={`text-base lg:text-lg font-bold mb-3 lg:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📊 Quick Stats</h3>
                        <div className="space-y-2 lg:space-y-3">
                            <StatRow label="Companies in database" value="558+" icon="🏢" />
                            <StatRow label="LinkedIn profiles found" value="2,341" icon="👥" />
                            <StatRow label="Messages sent today" value="47" icon="📤" />
                            <StatRow label="Success rate" value="89%" icon="✓" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, color, trend }) => {
    const { theme } = useTheme();

    return (
        <div className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white border border-white/10 shadow-xl relative overflow-hidden group hover:scale-105 transition-transform`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
                <div className="flex justify-between items-start mb-3">
                    <div className="text-3xl">{icon}</div>
                    {trend && (
                        <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            {trend}
                        </div>
                    )}
                </div>
                <div className="text-3xl font-bold mb-1">{value}</div>
                <div className="text-sm font-medium text-white/90">{title}</div>
                <div className="text-xs text-white/60 mt-1">{subtitle}</div>
            </div>
        </div>
    );
};

// Lead Card Component
const LeadCard = ({ lead, idx, setCurrentPage }) => {
    const { theme } = useTheme();
    const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
    const contactCount = lead.contacts?.length || 0;

    const handleViewDetails = (e) => {
        e.stopPropagation();
        // Store the selected lead ID in sessionStorage for the Leads page to use
        sessionStorage.setItem('selectedLeadId', lead.id.toString());
        setCurrentPage('leads');
    };

    const handleContactNow = (e) => {
        e.stopPropagation();
        // Store the selected lead ID and navigate to inbox
        sessionStorage.setItem('selectedLeadId', lead.id.toString());
        setCurrentPage('inbox');
    };

    return (
        <div className={`rounded-xl p-3 lg:p-5 hover:border-cyan-500/50 transition-all group cursor-pointer ${theme === 'dark' ? 'bg-zinc-900/50 hover:bg-zinc-900/80' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <div className="flex items-start gap-2 lg:gap-4">
                <div className="text-2xl lg:text-3xl">{medals[idx]}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2 lg:mb-3">
                        <div className="min-w-0 flex-1">
                            <h3 className={`text-base lg:text-lg font-bold truncate group-hover:text-primary-400 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {lead.trigger_data?.company_name || 'Unknown Company'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1 lg:gap-2 mt-1">
                                <span className="text-[10px] lg:text-xs bg-emerald-500/20 text-emerald-400 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded font-medium">
                                    ✓ APPROVED
                                </span>
                                <span className={`text-[10px] lg:text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                                    {new Date(lead.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="text-right sm:text-left flex-shrink-0">
                            <div className="text-xl lg:text-2xl font-bold text-primary-400">{contactCount}</div>
                            <div className={`text-[10px] lg:text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>contacts</div>
                        </div>
                    </div>

                    <p className={`text-xs lg:text-sm mb-2 lg:mb-3 line-clamp-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {lead.trigger_data?.draft_message || 'No message available'}
                    </p>

                    <div className={`flex flex-wrap items-center gap-2 lg:gap-3 text-[10px] lg:text-xs mb-3 lg:mb-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-1">
                            <span>⚡</span>
                            <span className="capitalize hidden sm:inline">{lead.trigger_data?.trigger_type?.replace('_', ' ') || 'Unknown'}</span>
                            <span className="capitalize sm:hidden">{lead.trigger_data?.trigger_type?.split('_')[0] || 'Signal'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>📍</span>
                            <span className="truncate max-w-[100px]">{lead.company_data?.country || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>🌐</span>
                            <span>{lead.company_data?.website ? 'Online' : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={handleViewDetails} className="flex-1 bg-cyan-600 hover:bg-primary-500 text-white text-xs lg:text-sm font-medium py-2 lg:py-2.5 rounded-lg transition flex items-center justify-center gap-1 lg:gap-2 cursor-pointer">
                            <span>👁️</span> <span className="hidden sm:inline">View Details</span><span className="sm:hidden">Details</span>
                        </button>
                        <button onClick={handleContactNow} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs lg:text-sm font-medium py-2 lg:py-2.5 rounded-lg transition flex items-center justify-center gap-1 lg:gap-2 cursor-pointer">
                            <span>📞</span> <span className="hidden sm:inline">Contact Now</span><span className="sm:hidden">Contact</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Metric Card Component
const MetricCard = ({ title, value, unit, subtitle, color, target }) => {
    const { theme } = useTheme();
    const colors = {
        blue: 'from-blue-600 to-blue-800 border-blue-400/30',
        green: 'from-emerald-600 to-emerald-800 border-emerald-400/30',
        purple: 'from-purple-600 to-purple-800 border-purple-400/30',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white border relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
                <div className="text-3xl font-bold mb-1">
                    {value}<span className="text-lg font-medium text-white/70">{unit}</span>
                </div>
                <div className="text-sm font-medium mb-1">{title}</div>
                <div className="text-xs text-white/60">{subtitle} • Target: {target}</div>
                <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white/40 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((parseFloat(value) / parseFloat(target)) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

// Alert Card Component
const AlertCard = ({ type, title, subtitle, action, onAction }) => {
    const { theme } = useTheme();
    const styles = {
        urgent: 'border-red-500/50 bg-red-500/10',
        warning: 'border-amber-500/50 bg-amber-500/10',
    };

    return (
        <div className={`border rounded-xl p-4 ${styles[type]} hover:scale-[1.02] transition-transform`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</div>
                    <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{subtitle}</div>
                </div>
                <button onClick={onAction} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition cursor-pointer">
                    {action}
                </button>
            </div>
        </div>
    );
};

// Stat Row Component
const StatRow = ({ label, value, icon }) => {
    const { theme } = useTheme();

    return (
        <div className={`flex items-center justify-between py-2 border-b last:border-0 ${theme === 'dark' ? 'border-medium/50 text-zinc-400' : 'border-gray-200 text-gray-600'}`}>
            <div className="flex items-center gap-2 text-sm">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</div>
        </div>
    );
};

export default App;
