import React, { useState } from 'react';
import { LayoutDashboard, Users, Workflow, FileText, Settings, Activity, Database, Zap, LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = ({ currentPage, onNavigate, user, onLogout, isCollapsed, onToggle }) => {
    const { theme } = useTheme();

    return (
        <div className={`h-screen border-r flex flex-col transition-all duration-300 shadow-soft ${isCollapsed ? 'w-16' : 'w-64'} ${!isCollapsed ? 'sm:relative sm:z-0 z-50 fixed' : 'relative'} ${theme === 'dark' ? 'bg-surface/DEFAULT border-slate-700' : 'bg-gray-100 border-gray-300'}`}>
            <div className="flex items-center justify-between p-2 lg:p-4 mb-4 lg:mb-6">
                {!isCollapsed ? (
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-primary-400 to-primary-500 p-1.5 lg:p-2 rounded-lg shadow-glow">
                            <Activity size={16} className="text-white lg:hidden" />
                            <Activity size={20} className="text-white hidden lg:block" />
                        </div>
                        <div className="hidden lg:block">
                            <h1 className={'font-bold text-lg tracking-tight ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>MachineryLeads</h1>
                            <p className={'text-[10px] font-medium tracking-widest uppercase ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>AI Platform</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        <div className="bg-gradient-to-br from-primary-400 to-primary-500 p-1.5 rounded-lg shadow-glow">
                            <Activity size={16} className="text-white" />
                        </div>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className={'hidden sm:flex items-center justify-center p-1.5 rounded-lg transition-colors flex-shrink-0 ' + (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Mobile toggle button - only visible on small screens when expanded */}
            {!isCollapsed && (
                <button
                    onClick={onToggle}
                    className={'sm:hidden absolute top-4 right-4 flex items-center justify-center p-2 rounded-lg transition-colors z-50 ' + (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')}
                >
                    <X size={18} />
                </button>
            )}

            {/* Mobile overlay when sidebar is open */}
            {!isCollapsed && (
                <div
                    className="sm:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={onToggle}
                ></div>
            )}

            <nav className="flex-1 space-y-1 px-1 lg:px-2">
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={currentPage === 'dashboard'}
                    onClick={() => onNavigate('dashboard')}
                    isCollapsed={isCollapsed}
                />
                <NavItem
                    icon={<Users size={20} />}
                    label="Leads Approval"
                    active={currentPage === 'approvals'}
                    onClick={() => onNavigate('approvals')}
                    isCollapsed={isCollapsed}
                />
                <NavItem
                    icon={<FileText size={20} />}
                    label="Inbox"
                    active={currentPage === 'inbox'}
                    onClick={() => onNavigate('inbox')}
                    isCollapsed={isCollapsed}
                />
                <NavItem
                    icon={<Database size={20} />}
                    label="Leads Database"
                    active={currentPage === 'leads'}
                    onClick={() => onNavigate('leads')}
                    isCollapsed={isCollapsed}
                />
                <NavItem
                    icon={<Zap size={20} />}
                    label="EMS Automation"
                    active={currentPage === 'ems'}
                    onClick={() => onNavigate('ems')}
                    isCollapsed={isCollapsed}
                />
                <NavItem
                    icon={<Settings size={20} />}
                    label="Config"
                    active={currentPage === 'config'}
                    onClick={() => onNavigate('config')}
                    isCollapsed={isCollapsed}
                />
            </nav>

            <div className={'mt-auto pt-4 border-t space-y-2 lg:space-y-3 px-1 lg:px-2 ' + (theme === 'dark' ? 'border-slate-700' : 'border-gray-300')}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 lg:gap-3'}`}>
                    {user?.picture ? (
                        <img src={user.picture} alt={user.name} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex-shrink-0" />
                    ) : (
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white text-xs lg:text-sm font-bold flex-shrink-0 shadow-glow">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 hidden lg:block">
                            <p className={'text-sm font-medium truncate ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>{user?.name || 'User'}</p>
                            <p className={'text-xs truncate ' + (theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>{user?.email || ''}</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={onLogout}
                    className={'flex items-center w-full px-2 lg:px-4 py-2 rounded-lg text-sm transition-colors ' + (theme === 'dark' ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/10' : 'text-gray-600 hover:text-red-600 hover:bg-red-100') + (isCollapsed ? ' justify-center' : ' gap-2')}
                    title="Sign Out"
                >
                    <LogOut size={16} className="flex-shrink-0" />
                    <span className={`whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>Sign Out</span>
                </button>
            </div>

            {/* Mobile toggle button at bottom */}
            <div className={'sm:hidden p-2 lg:p-4 border-t ' + (theme === 'dark' ? 'border-slate-700' : 'border-gray-300')}>
                <button
                    onClick={onToggle}
                    className={'flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-sm transition-colors ' + (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick, isCollapsed }) => {
    const { theme } = useTheme();

    return (
        <button
            onClick={onClick}
            className={'group relative flex items-center w-full px-2 lg:px-4 py-2 lg:py-3 rounded-lg text-sm transition-all duration-200 ' + (active ? (theme === 'dark' ? 'bg-zinc-900 text-primary-400' : 'bg-gray-300 text-primary-600') : (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')) + (isCollapsed ? ' justify-center' : ' gap-3')}
            title={label}
        >
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-500 rounded-full shadow-glow"></div>
            )}
            <div className={`flex-shrink-0 transition-transform duration-200 ${!isCollapsed && 'group-hover:scale-110'}`}>{icon}</div>
            <span className={`whitespace-nowrap font-medium ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
        </button>
    );
};

export default Sidebar;
