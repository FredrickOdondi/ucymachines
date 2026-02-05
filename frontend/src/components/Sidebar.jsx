import React from 'react';
import { LayoutDashboard, Users, Workflow, FileText, Settings, Activity, Database, Zap } from 'lucide-react';

const Sidebar = ({ currentPage, onNavigate }) => {
    return (
        <div className="w-64 bg-slate-900 h-screen border-r border-slate-800 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-8 px-2">
                <div className="bg-blue-500 p-2 rounded">
                    <Activity size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-white text-lg">Ucymachines</h1>
                    <p className="text-xs text-slate-400">AI ORCHESTRATION</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={currentPage === 'dashboard'}
                    onClick={() => onNavigate('dashboard')}
                />
                <NavItem
                    icon={<Users size={20} />}
                    label="Leads Approval"
                    active={currentPage === 'approvals'}
                    onClick={() => onNavigate('approvals')}
                />
                <NavItem
                    icon={<FileText size={20} />}
                    label="Inbox"
                    active={currentPage === 'inbox'}
                    onClick={() => onNavigate('inbox')}
                />
                <NavItem
                    icon={<Database size={20} />}
                    label="Leads Database"
                    active={currentPage === 'leads'}
                    onClick={() => onNavigate('leads')}
                />
                <NavItem
                    icon={<Zap size={20} />}
                    label="EMS Automation"
                    active={currentPage === 'ems'}
                    onClick={() => onNavigate('ems')}
                />
                <NavItem icon={<Workflow size={20} />} label="Workflows" />
                <NavItem icon={<FileText size={20} />} label="Real-time Logs" />
                <NavItem
                    icon={<Settings size={20} />}
                    label="Config"
                    active={currentPage === 'config'}
                    onClick={() => onNavigate('config')}
                />
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs">AC</div>
                    <div>
                        <p className="text-sm font-medium text-white">Admin Console</p>
                        <p className="text-xs text-slate-500">v2.4.0-prod</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors ${active ? 'bg-slate-800 text-cyan-400 border-l-2 border-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default Sidebar;
