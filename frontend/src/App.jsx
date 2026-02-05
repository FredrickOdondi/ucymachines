import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import ActivityFeed from './components/ActivityFeed';
import Approvals from './pages/Approvals';
import Inbox from './pages/Inbox';
import Config from './pages/Config';
import LeadsDatabase from './pages/LeadsDatabase';
import EmsAutomation from './pages/EmsAutomation';

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
            <main className="flex-1 p-8 overflow-y-auto">
                {currentPage === 'dashboard' && <DashboardPage />}
                {currentPage === 'approvals' && <Approvals />}
                {currentPage === 'inbox' && <Inbox />}
                {currentPage === 'leads' && <LeadsDatabase />}
                {currentPage === 'config' && <Config />}
                {currentPage === 'ems' && <EmsAutomation />}
            </main>
        </div>
    );
}

const DashboardPage = () => (
    <>
        <header className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">System Health & Graph Overview</h2>
            <div className="flex gap-4">
                <button className="bg-slate-800 px-4 py-2 rounded text-sm text-slate-300 border border-slate-700">Last 24h</button>
                <button className="bg-cyan-600 px-4 py-2 rounded text-sm font-medium hover:bg-cyan-500 transition">DEPLOY CHANGES</button>
            </div>
        </header>

        <DashboardStats />

        <div className="grid grid-cols-3 gap-6 h-[500px]">
            {/* Main Visualization Area */}
            <div className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6 relative flex items-center justify-center">
                <h3 className="absolute top-6 left-6 font-medium">LangGraph Workflow Architecture</h3>
                <div className="absolute top-6 right-6 flex gap-2 text-xs">
                    <span className="flex items-center gap-1 text-green-400">● ACTIVE</span>
                </div>

                {/* Mock Graph Visual */}
                <div className="flex items-center gap-8 animate-pulse">
                    <div className="p-4 border border-green-500 rounded bg-green-500/10 text-center">
                        <div className="text-green-400 font-bold mb-1">((●))</div>
                        <div className="text-xs">TRIGGER</div>
                    </div>
                    <div className="h-0.5 w-12 bg-slate-700"></div>
                    <div className="p-4 border border-slate-600 rounded text-center">
                        <div className="text-slate-400 font-bold mb-1">==X</div>
                        <div className="text-xs">QUALIFICATION</div>
                    </div>
                    <div className="h-0.5 w-12 bg-slate-700"></div>
                    <div className="p-4 border border-yellow-500 rounded bg-yellow-500/10 text-center">
                        <div className="text-yellow-400 font-bold mb-1">@</div>
                        <div className="text-xs">DISCOVERY</div>
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <ActivityFeed />
        </div>
    </>
);

export default App;
