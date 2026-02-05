import React, { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';

const Config = () => {
    const [schedulerStatus, setSchedulerStatus] = useState(null);
    const [intervalMinutes, setIntervalMinutes] = useState(10);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSchedulerStatus();
        const interval = setInterval(fetchSchedulerStatus, 5000); // Refresh every 5 seconds
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

    const startScheduler = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/scheduler/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interval_minutes: intervalMinutes })
            });
            const data = await response.json();
            setSchedulerStatus(data);
            alert(`✓ Scheduler started - will run every ${intervalMinutes} minute(s)`);
        } catch (error) {
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
            alert(`✓ Scheduler stopped (ran ${data.total_searches} searches)`);
        } catch (error) {
            alert("Error stopping scheduler: " + error.message);
        }
        setLoading(false);
    };

    const isRunning = schedulerStatus?.running || false;

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Automation & Settings</h2>
            </header>

            <div className="grid grid-cols-2 gap-6">
                {/* Scheduler Control */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-bold">AI Search Automation</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Status */}
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-400 mb-2">STATUS</div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                <span className="text-sm font-mono">
                                    {isRunning ? 'RUNNING' : 'IDLE'}
                                </span>
                            </div>
                            {isRunning && schedulerStatus && (
                                <div className="text-xs text-slate-400 mt-2">
                                    Searches completed: <span className="text-cyan-400">{schedulerStatus.total_searches}</span>
                                </div>
                            )}
                        </div>

                        {/* Interval Control */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-3">
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
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white disabled:opacity-50"
                                />
                                <span className="text-slate-500 text-sm pt-2">min</span>
                            </div>
                        </div>

                        {/* Slider Visualization */}
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-400">1 min</span>
                                <span className="text-slate-400">60 min</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="120"
                                value={intervalMinutes}
                                onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
                                disabled={isRunning}
                                className="w-full h-2 bg-slate-800 rounded-full cursor-pointer disabled:opacity-50"
                                style={{
                                    background: isRunning
                                        ? 'rgb(30, 41, 59)'
                                        : `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${(intervalMinutes / 120) * 100}%, rgb(51, 65, 85) ${(intervalMinutes / 120) * 100}%, rgb(51, 65, 85) 100%)`
                                }}
                            />
                            <div className="text-center text-xs text-cyan-400 mt-2">
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
                </div>

                {/* Info Panel */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">How It Works</h3>
                    <div className="space-y-4 text-sm text-slate-300">
                        <div>
                            <div className="text-cyan-400 font-bold mb-1">Automation</div>
                            <p>The AI search runs automatically at your configured interval, continuously scanning for new industrial signals.</p>
                        </div>
                        <div>
                            <div className="text-cyan-400 font-bold mb-1">Leads Database</div>
                            <p>Each search automatically extracts and processes leads, adding qualified contacts to your database.</p>
                        </div>
                        <div>
                            <div className="text-cyan-400 font-bold mb-1">Recommendations</div>
                            <p>Start with 10-15 minute intervals. Increase for lower frequency, decrease for aggressive lead hunting.</p>
                        </div>
                        <div className="bg-slate-950 p-3 rounded border border-slate-700 mt-4">
                            <div className="text-xs text-slate-400">💡 Pro Tip</div>
                            <p>Set it running overnight to build a lead pipeline while you sleep.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Config;
