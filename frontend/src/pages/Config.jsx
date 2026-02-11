import React, { useState, useEffect } from 'react';
import { Play, Square, Clock, Mail, Link as LinkIcon, Unlink, Send, Chrome, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Config = () => {
    const { theme } = useTheme();
    const [schedulerStatus, setSchedulerStatus] = useState(null);
    const [intervalMinutes, setIntervalMinutes] = useState(10);
    const [loading, setLoading] = useState(false);

    // Gmail state
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailAddress, setGmailAddress] = useState(null);
    const [gmailLoading, setGmailLoading] = useState(false);

    // Email sync state
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchSchedulerStatus();
        fetchGmailStatus();
        fetchSyncStatus();
        const interval = setInterval(() => {
            fetchSchedulerStatus();
            fetchSyncStatus();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchSchedulerStatus = async () => {
        try {
            const response = await fetch("http://localhost:8000/scheduler/status");
            const data = await response.json();
            setSchedulerStatus(data);
        } catch (error) {
            console.error("Error fetching scheduler status:", error);
        }
    };

    const fetchGmailStatus = async () => {
        try {
            const response = await fetch("http://localhost:8000/gmail/status");
            const data = await response.json();
            setGmailConnected(data.connected);
            setGmailAddress(data.email);
        } catch (error) {
            console.error("Error fetching Gmail status:", error);
        }
    };

    const fetchSyncStatus = async () => {
        try {
            const response = await fetch("http://localhost:8000/email/sync-status");
            const data = await response.json();
            setLastSyncTime(data.last_sync);
        } catch (error) {
            console.error("Error fetching sync status:", error);
        }
    };

    const triggerSync = async () => {
        if (!gmailConnected) {
            alert("Please connect Gmail first");
            return;
        }

        setSyncing(true);
        try {
            const response = await fetch("http://localhost:8000/email/sync", {
                method: "POST"
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Sync complete!\n\nTotal messages: ${data.total_messages}\nMatched to leads: ${data.matched}\nUnmatched: ${data.unmatched}`);
                fetchSyncStatus();
            } else {
                alert("❌ Sync failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            alert("Error triggering sync: " + error.message);
        }
        setSyncing(false);
    };

    const startScheduler = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/scheduler/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interval_minutes: intervalMinutes })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Scheduler start response:", data);
            setSchedulerStatus(data);

            // Refresh status immediately
            await fetchSchedulerStatus();

            alert(`✓ Scheduler started - will run every ${intervalMinutes} minute(s)`);
        } catch (error) {
            console.error("Error starting scheduler:", error);
            alert("Error starting scheduler: " + error.message);
        }
        setLoading(false);
    };

    const stopScheduler = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/scheduler/stop", {
                method: "POST"
            });
            const data = await response.json();
            setSchedulerStatus(data);
            alert(`✓ Scheduler stopped`);
        } catch (error) {
            alert("Error stopping scheduler: " + error.message);
        }
        setLoading(false);
    };

    const connectGmail = () => {
        setGmailLoading(true);
        window.location.href = "http://localhost:8000/gmail/auth-url";
    };

    const disconnectGmail = async () => {
        if (!confirm("Are you sure you want to disconnect your Gmail account?")) return;

        setGmailLoading(true);
        try {
            await fetch("http://localhost:8000/gmail/disconnect", {
                method: "DELETE"
            });
            setGmailConnected(false);
            setGmailAddress(null);
            alert("✓ Gmail disconnected successfully");
        } catch (error) {
            alert("Error disconnecting Gmail: " + error.message);
        }
        setGmailLoading(false);
    };

    const sendTestEmail = async () => {
        if (!gmailConnected) {
            alert("Please connect Gmail first");
            return;
        }

        setGmailLoading(true);
        try {
            const response = await fetch("http://localhost:8000/email/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ Test email sent successfully!\n\nCheck your inbox at ${data.to}`);
            } else {
                alert("❌ Failed to send test email: " + (data.error || data.detail || "Unknown error"));
            }
        } catch (error) {
            alert("Error sending test email: " + error.message);
        }
        setGmailLoading(false);
    };

    const isRunning = schedulerStatus?.running || false;

    return (
        <div className="space-y-4 lg:space-y-6">
            <header className="flex justify-between items-center">
                <h2 className={'text-xl lg:text-2xl font-bold ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Automation & Settings</h2>
            </header>

            {/* Top Section: Gmail & Email Sync */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Gmail Authentication */}
                <div className={'rounded-xl p-4 lg:p-6 ' + (theme === 'dark' ? 'bg-zinc-900' : 'bg-white')}>
                    <div className="flex items-center gap-3 mb-4 lg:mb-6">
                        <Mail className="w-5 h-5 text-red-400" />
                        <h3 className={'text-base lg:text-lg font-bold ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Gmail Integration</h3>
                    </div>

                    <div className="space-y-4 lg:space-y-6">
                        {/* Status */}
                        <div className={'p-3 lg:p-4 rounded-lg border ' + (theme === 'dark' ? 'bg-zinc-950 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                            <div className={'text-xs mb-2 ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>CONNECTION STATUS</div>
                            <div className="flex items-center gap-2">
                                <div className={'w-3 h-3 rounded-full ' + (gmailConnected ? 'bg-green-500 animate-pulse' : theme === 'dark' ? 'bg-slate-600' : 'bg-gray-400')}></div>
                                <span className="text-sm font-mono">
                                    {gmailConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                                </span>
                            </div>
                            {gmailConnected && gmailAddress && (
                                <div className={'text-xs mt-2 ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                                    <span className="text-primary-400">{gmailAddress}</span>
                                </div>
                            )}
                        </div>

                        {/* Connection Actions */}
                        <div className={'p-3 lg:p-4 rounded-lg border ' + (theme === 'dark' ? 'bg-zinc-950 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                            <div className={'text-xs mb-3 ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>ACTIONS</div>
                            <div className="space-y-2">
                                {!gmailConnected ? (
                                    <button
                                        onClick={connectGmail}
                                        disabled={gmailLoading}
                                        className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 py-2 lg:py-3 rounded font-bold text-xs lg:text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                                            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                                            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                                            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                                        </svg>
                                        Sign in with Google
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            onClick={sendTestEmail}
                                            disabled={gmailLoading}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold text-xs lg:text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                                        >
                                            <Send size={14} />
                                            Send Test Email
                                        </button>
                                        <button
                                            onClick={disconnectGmail}
                                            disabled={gmailLoading}
                                            className={'w-full py-2 rounded font-bold text-xs lg:text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 ' + (theme === 'dark' ? 'bg-zinc-800 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')}
                                        >
                                            <Unlink size={16} />
                                            Disconnect Gmail
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Sync */}
                <div className={'rounded-xl p-4 lg:p-6 ' + (theme === 'dark' ? 'bg-zinc-900' : 'bg-white')}>
                    <div className="flex items-center gap-3 mb-4 lg:mb-6">
                        <RefreshCw className={`w-5 h-5 text-purple-400 ${syncing ? 'animate-spin' : ''}`} />
                        <h3 className={'text-base lg:text-lg font-bold ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Email Sync</h3>
                    </div>

                    <div className="space-y-4 lg:space-y-6">
                        {/* Status */}
                        <div className={'p-3 lg:p-4 rounded-lg border ' + (theme === 'dark' ? 'bg-zinc-950 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                            <div className={'text-xs mb-2 ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>LAST SYNC</div>
                            {lastSyncTime ? (
                                <div className={'text-sm font-mono ' + (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                                    {new Date(lastSyncTime).toLocaleString()}
                                </div>
                            ) : (
                                <div className={'text-sm font-mono ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                                    Never synced
                                </div>
                            )}
                        </div>

                        {/* Sync Action */}
                        <div className={'p-3 lg:p-4 rounded-lg border ' + (theme === 'dark' ? 'bg-zinc-950 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                            <div className={'text-xs mb-3 ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>ACTIONS</div>
                            <button
                                onClick={triggerSync}
                                disabled={syncing || !gmailConnected}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 lg:py-3 rounded font-bold text-xs lg:text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                {syncing ? 'SYNCING...' : 'SYNC NOW'}
                            </button>
                            {!gmailConnected && (
                                <div className={'text-xs mt-2 text-center ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                                    Connect Gmail to enable sync
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className={'p-3 rounded-lg border ' + (theme === 'dark' ? 'bg-zinc-950 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                            <div className={'text-xs ' + (theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                                Automatically fetch incoming email replies and match them to leads.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Scheduler */}
            <div className="bg-surface/DEFAULT  rounded-xl p-4 lg:p-6">
                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                    <Clock className="w-5 h-5 text-primary-400" />
                    <h3 className="text-base lg:text-lg font-bold">AI Search Automation</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                        {/* Status & Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Status */}
                            <div className="bg-background/DEFAULT p-3 lg:p-4 rounded-lg border border">
                                <div className="text-xs text-zinc-400 mb-2">STATUS</div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                    <span className="text-sm font-mono">
                                        {isRunning ? 'RUNNING' : 'IDLE'}
                                    </span>
                                </div>
                                {isRunning && schedulerStatus && (
                                    <div className="text-xs text-zinc-400 mt-2">
                                        Searches: <span className="text-primary-400">{schedulerStatus.total_searches}</span>
                                    </div>
                                )}
                            </div>

                            {/* Interval Input */}
                            <div className="bg-background/DEFAULT p-3 lg:p-4 rounded-lg border border">
                                <label className="block text-xs font-bold text-zinc-400 mb-2">
                                    INTERVAL (MINUTES)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={intervalMinutes}
                                        onChange={(e) => setIntervalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                        disabled={isRunning}
                                        className="flex-1 bg-zinc-900  rounded px-3 py-2 text-sm text-white disabled:opacity-50"
                                    />
                                    <span className="text-zinc-500 text-sm pt-2">min</span>
                                </div>
                            </div>
                        </div>

                        {/* Slider */}
                        <div className="bg-background/DEFAULT p-3 rounded-lg border border">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-zinc-400">1 min</span>
                                <span className="text-zinc-400">120 min</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="120"
                                value={intervalMinutes}
                                onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
                                disabled={isRunning}
                                className="w-full h-2 bg-zinc-900 rounded-full cursor-pointer disabled:opacity-50"
                                style={{
                                    background: isRunning
                                        ? 'rgb(30, 41, 59)'
                                        : `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${(intervalMinutes / 120) * 100}%, rgb(51, 65, 85) ${(intervalMinutes / 120) * 100}%, rgb(51, 65, 85) 100%)`
                                }}
                            />
                            <div className="text-center text-xs text-primary-400 mt-2">
                                Every {intervalMinutes} minute{intervalMinutes !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex gap-3">
                            {!isRunning ? (
                                <button
                                    onClick={startScheduler}
                                    disabled={loading}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                                >
                                    <Play className="w-4 h-4" />
                                    START
                                </button>
                            ) : (
                                <button
                                    onClick={stopScheduler}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                                >
                                    <Square className="w-4 h-4" />
                                    STOP
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div className="bg-background/DEFAULT rounded-lg  p-3 lg:p-4">
                        <h4 className="text-sm font-bold text-white mb-3">How It Works</h4>
                        <div className="space-y-3 text-xs lg:text-sm text-gray-300">
                            <div>
                                <div className="text-primary-400 font-bold mb-1">🤖 Automation</div>
                                <p className="text-zinc-400">AI search runs automatically, scanning for new industrial signals.</p>
                            </div>
                            <div>
                                <div className="text-primary-400 font-bold mb-1">📊 Leads Database</div>
                                <p className="text-zinc-400">Each search extracts and adds qualified contacts to your database.</p>
                            </div>
                            <div>
                                <div className="text-primary-400 font-bold mb-1">💡 Tips</div>
                                <p className="text-zinc-400">Start with 10-15 min intervals. Run overnight to build your pipeline.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Config;
