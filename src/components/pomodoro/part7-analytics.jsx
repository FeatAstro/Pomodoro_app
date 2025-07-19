// ================================
// PART 7: ANALYTICS COMPONENTS
// ================================

import React, { useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
    Calendar, CalendarDays, CalendarRange, HelpCircle, Zap
} from 'lucide-react';
import { usePomodoroContext } from './part1-context.jsx';
import { VIEW_MODES } from './part1-context.jsx';
import { useAnalytics } from './part2-hooks.jsx';
import { exportData, importData, formatMinutesToHourMin } from './part3-utilities.jsx';

// ================================
// VIEW MODE SELECTOR COMPONENT
// ================================

export const ViewModeSelector = () => {
    const { state, actions } = usePomodoroContext();
    const { viewMode } = state;

    const viewModes = [
        { key: VIEW_MODES.WEEK, label: 'Week', icon: Calendar },
        { key: VIEW_MODES.MONTH, label: 'Month', icon: CalendarDays },
        { key: VIEW_MODES.YEAR, label: 'Year', icon: CalendarRange }
    ];

    return (
        <div className="flex justify-center mb-8">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-gray-700/50">
                <div className="flex gap-1">
                    {viewModes.map((mode) => (
                        <button
                            key={mode.key}
                            onClick={() => actions.setViewMode(mode.key)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === mode.key
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            <mode.icon className="w-4 h-4" />
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ================================
// ANALYTICS CHARTS COMPONENT
// ================================

export const AnalyticsCharts = () => {
    const { getChartData } = useAnalytics();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Time Spent Chart */}
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Time Spent (Hours)</h3>
                <div className="h-64 bg-gray-900/50 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData('time')} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                            <Bar dataKey="value" fill="url(#timeGradient)" radius={[4, 4, 0, 0]} />
                            <defs>
                                <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#b572fc" />
                                    <stop offset="100%" stopColor="#301e42" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tasks Completed Chart */}
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Tasks Completed</h3>
                <div className="h-64 bg-gray-900/50 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData('tasks')} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                            <Bar dataKey="value" fill="url(#taskGradient)" radius={[4, 4, 0, 0]} />
                            <defs>
                                <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#eba423" />
                                    <stop offset="100%" stopColor="#402a03" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// ================================
// STATISTICS CARDS COMPONENT
// ================================

export const StatisticsCards = () => {
    const { state } = usePomodoroContext();
    const { timeHistory, taskHistory, viewMode } = state;
    const { getMaxDailyStreakForPeriod, getMaxSessionStreakForPeriod } = useAnalytics();

    const totalMinutes = timeHistory.reduce((sum, session) => sum + (session.totalMinutes || 0), 0);
    const totalTasks = taskHistory.length;
    const totalSessions = timeHistory.reduce((sum, session) => sum + (session.sessionCount || 0), 0);
    const maxDailyStreak = getMaxDailyStreakForPeriod(viewMode);
    const maxSessionStreak = getMaxSessionStreakForPeriod(viewMode);

    const stats = [
        {
            value: formatMinutesToHourMin(totalMinutes),
            label: 'Total',
            bgColor: 'bg-indigo-900/30',
            textColor: 'text-indigo-300'
        },
        {
            value: totalTasks,
            label: 'Tasks Completed',
            bgColor: 'bg-green-900/30',
            textColor: 'text-green-300'
        },
        {
            value: totalSessions,
            label: 'Total Sessions',
            bgColor: 'bg-purple-900/30',
            textColor: 'text-purple-300'
        },
        {
            value: maxDailyStreak,
            label: `Daily Max (${viewMode})`,
            bgColor: 'bg-orange-900/30',
            textColor: 'text-orange-300',
            icon: '🔥'
        },
        {
            value: maxSessionStreak,
            label: `Session Max (${viewMode})`,
            bgColor: 'bg-red-900/30',
            textColor: 'text-yellow-300',
            icon: <Zap className="w-5 h-5" />
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className={`${stat.bgColor} p-4 rounded-lg text-center`}>
                    <div className={`text-2xl font-bold ${stat.textColor} flex items-center justify-center gap-1`}>
                        {stat.icon && stat.icon}
                        {stat.value}
                    </div>
                    <div className={`text-sm ${stat.textColor.replace('300', '400')}`}>{stat.label}</div>
                </div>
            ))}
        </div>
    );
};

// ================================
// DATA MANAGEMENT COMPONENT
// ================================

export const DataManagement = () => {
    const { state, actions } = usePomodoroContext();

    /**
     * Handle file import
     */
    const handleImportData = useCallback(async (event) => {
        const file = event.target.files[0];
        await importData(file, actions);
        // Reset the file input
        event.target.value = '';
    }, [actions]);

    /**
     * Handle data export
     */
    const handleExportData = useCallback(async () => {
        await exportData(state);
    }, [state]);

    /**
     * Clear all user data
     */
    const clearAllData = useCallback(async () => {
        if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            // Reset all data to initial state
            actions.clearTimeHistory();
            actions.clearTaskHistory();
            actions.updateTasks([]);
            actions.updateCompletedTasks([]);
            actions.setDailyGoal(480);
            actions.setDailyStreak(0);
            actions.setSessionStreak(0);
            actions.setStreakHistory([]);

            // Clear temporary session data
            actions.setTempSessionCount(0);

            // Clear task tracking
            actions.setActiveTaskId(null);
            actions.updateTaskSessionTimes({});
            actions.setLastUpdateTime(null);
            actions.setTaskSessionNames({});
        }
    }, [actions]);

    return (
        <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-200">Data Management</h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Your data is automatically saved to your app directory. Share with friends!
                    </p>
                </div>
                <div className="space-x-2">
                    <label className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 cursor-pointer">
                        Import Data
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={handleExportData}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200"
                    >
                        Export Data
                    </button>
                    <button
                        onClick={clearAllData}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
                    >
                        Clear All Data
                    </button>
                </div>
            </div>

            {/* Individual Clear Options */}
            <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <h4 className="text-md font-medium text-gray-200 mb-3">Clear Specific Data</h4>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            if (window.confirm('Clear all work sessions? This will also reset your streak data.')) {
                                actions.clearTimeHistory();
                                actions.setDailyStreak(0);
                                actions.setSessionStreak(0);
                                actions.setStreakHistory([]);
                                // Also reset manual overrides when clearing sessions
                                actions.setManualMaxDailyStreak(null);
                                actions.setManualMaxSessionStreak(null);
                            }
                        }}
                        className="px-3 py-2 bg-red-500/80 text-white rounded-md hover:bg-red-500 transition-all duration-200 text-sm"
                    >
                        Clear Work Sessions
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Clear all completed tasks?')) {
                                actions.clearTaskHistory();
                            }
                        }}
                        className="px-3 py-2 bg-red-500/80 text-white rounded-md hover:bg-red-500 transition-all duration-200 text-sm"
                    >
                        Clear Completed Tasks
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Reset max daily streak display to 0? This only affects what you see in analytics, not your actual history.')) {
                                actions.setManualMaxDailyStreak(null);
                            }
                        }}
                        className="px-3 py-2 bg-orange-500/80 text-white rounded-md hover:bg-orange-500 transition-all duration-200 text-sm"
                    >
                        Reset Max Daily Streak Display
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Reset max session streak display to 0? This only affects what you see in analytics, not your actual history.')) {
                                actions.setManualMaxSessionStreak(null);
                            }
                        }}
                        className="px-3 py-2 bg-yellow-500/80 text-white rounded-md hover:bg-yellow-500 transition-all duration-200 text-sm"
                    >
                        Reset Max Session Streak Display
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Note: "Clear Work Sessions" removes all session data. "Reset Max Streak Display" buttons only change what you see in analytics and timer stats - your actual history remains unchanged.
                </p>
            </div>
        </div>
    );
};

// ================================
// ANALYTICS TAB COMPONENT
// ================================

export const AnalyticsTab = () => {
    const { actions } = usePomodoroContext();

    return (
        <div className="bg-gray-800 rounded-xl shadow-xl p-8">
            {/* Analytics Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Analytics</h2>
                <button
                    onClick={() => actions.setShowInstructions(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200"
                >
                    <HelpCircle className="w-4 h-4" />
                    How to Share Data
                </button>
            </div>

            {/* View Mode Selector */}
            <ViewModeSelector />

            {/* Charts Grid */}
            <AnalyticsCharts />

            {/* Statistics Cards */}
            <StatisticsCards />

            {/* Data Management Section */}
            <DataManagement />
        </div>
    );
};