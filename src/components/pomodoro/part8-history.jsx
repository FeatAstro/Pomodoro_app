// ================================
// PART 8: HISTORY COMPONENTS
// ================================

import React from 'react';
import {
    History, Calendar, CalendarDays, CalendarRange
} from 'lucide-react';
import { usePomodoroContext } from './part1-context.jsx';
import { HISTORY_VIEW_MODES } from './part1-context.jsx';
import { useHistoryManagement } from './part2-hooks.jsx';
import { useSound } from './part2-hooks.jsx';
import { SessionHistoryItem, TaskHistoryItem } from './part3-utilities.jsx';

// ================================
// HISTORY VIEW MODE SELECTOR COMPONENT
// ================================

export const HistoryViewModeSelector = () => {
    const { state, actions } = usePomodoroContext();
    const { historyViewMode } = state;

    const viewModes = [
        { key: HISTORY_VIEW_MODES.DAY, label: 'Day', icon: Calendar },
        { key: HISTORY_VIEW_MODES.WEEK, label: 'Week', icon: Calendar },
        { key: HISTORY_VIEW_MODES.MONTH, label: 'Month', icon: CalendarDays },
        { key: HISTORY_VIEW_MODES.YEAR, label: 'Year', icon: CalendarRange }
    ];

    return (
        <div className="flex justify-center mb-8">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-gray-700/50">
                <div className="flex gap-1">
                    {viewModes.map((mode) => (
                        <button
                            key={mode.key}
                            onClick={() => actions.setHistoryViewMode(mode.key)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${historyViewMode === mode.key
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
// HISTORY PERIOD GROUP COMPONENT
// ================================

export const HistoryPeriodGroup = ({
    period,
    type, // 'sessions' or 'tasks'
    onToggle,
    isExpanded,
    onDeleteItem,
    expandedItems,
    onToggleItem
}) => {
    return (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
            {/* Period Header */}
            <button
                onClick={() => onToggle(`${type}-${period.key}`)}
                className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 transition-all duration-200"
            >
                <div className="flex items-center gap-3">
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <span className="font-medium text-white">{period.label}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                        {period.items.length} {type === 'sessions' ? 'session' : 'task'}{period.items.length !== 1 ? 's' : ''}
                    </span>
                    <span className={`text-sm font-medium ${type === 'sessions' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {Math.round(period.items.reduce((sum, item) =>
                            sum + (item.totalMinutes || item.duration || 0), 0
                        ))} min
                    </span>
                </div>
            </button>

            {/* Period Content */}
            {isExpanded && (
                <div className="p-3 bg-gray-800/50 space-y-2">
                    {period.items.map((item) => {
                        if (type === 'sessions') {
                            return (
                                <SessionHistoryItem
                                    key={item.id}
                                    session={item}
                                    onDelete={onDeleteItem}
                                    isExpanded={expandedItems.has(item.id)}
                                    onToggle={() => onToggleItem(item.id)}
                                />
                            );
                        } else {
                            return (
                                <TaskHistoryItem
                                    key={item.id}
                                    task={item}
                                    onDelete={onDeleteItem}
                                    isExpanded={expandedItems.has(item.id)}
                                    onToggle={() => onToggleItem(item.id)}
                                />
                            );
                        }
                    })}
                </div>
            )}
        </div>
    );
};

// ================================
// WORK SESSIONS HISTORY COMPONENT
// ================================

export const WorkSessionsHistory = () => {
    const { state, actions } = usePomodoroContext();
    const { timeHistory, historyViewMode, expandedTimePeriods, expandedSessions } = state;
    const { groupHistoryByPeriod } = useHistoryManagement();

    /**
     * Delete a session from time history
     */
    const deleteTimeSession = (sessionId) => {
        if (window.confirm('Are you sure you want to delete this session?')) {
            actions.deleteTimeHistory(sessionId);
        }
    };

    /**
     * Clear all sessions
     */
    const clearAllSessions = () => {
        if (window.confirm('Are you sure you want to delete all work sessions? This will also reset your streak data and cannot be undone.')) {
            actions.clearTimeHistory();
        }
    };

    const groupedSessions = groupHistoryByPeriod(timeHistory, historyViewMode);

    return (
        <div className="bg-gray-800 rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Work Sessions ({timeHistory.length})</h3>
                <button
                    onClick={clearAllSessions}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 text-sm"
                >
                    Clear All
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 max-h-[500px] overflow-y-auto space-y-3">
                {timeHistory.length === 0 ? (
                    <p className="text-gray-400 italic text-center py-8">No work sessions recorded yet</p>
                ) : (
                    <div className="space-y-3">
                        {groupedSessions.map((period) => (
                            <HistoryPeriodGroup
                                key={period.key}
                                period={period}
                                type="sessions"
                                onToggle={actions.toggleExpandedTimePeriod}
                                isExpanded={expandedTimePeriods.has(`sessions-${period.key}`)}
                                onDeleteItem={deleteTimeSession}
                                expandedItems={expandedSessions}
                                onToggleItem={actions.toggleExpandedSession}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ================================
// COMPLETED TASKS HISTORY COMPONENT
// ================================

export const CompletedTasksHistory = () => {
    const { state, actions } = usePomodoroContext();
    const { taskHistory, historyViewMode, expandedTimePeriods, expandedTasks } = state;
    const { groupHistoryByPeriod } = useHistoryManagement();

    /**
     * Delete a task from task history
     */
    const deleteTask = (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            actions.deleteTaskHistory(taskId);
        }
    };

    /**
     * Clear all completed tasks
     */
    const clearAllTasks = () => {
        if (window.confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
            actions.clearTaskHistory();
        }
    };

    const groupedTasks = groupHistoryByPeriod(taskHistory, historyViewMode);

    return (
        <div className="bg-gray-800 rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Completed Tasks ({taskHistory.length})</h3>
                <button
                    onClick={clearAllTasks}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 text-sm"
                >
                    Clear All
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 max-h-[500px] overflow-y-auto space-y-3">
                {taskHistory.length === 0 ? (
                    <p className="text-gray-400 italic text-center py-8">No completed tasks yet</p>
                ) : (
                    <div className="space-y-3">
                        {groupedTasks.map((period) => (
                            <HistoryPeriodGroup
                                key={period.key}
                                period={period}
                                type="tasks"
                                onToggle={actions.toggleExpandedTimePeriod}
                                isExpanded={expandedTimePeriods.has(`tasks-${period.key}`)}
                                onDeleteItem={deleteTask}
                                expandedItems={expandedTasks}
                                onToggleItem={actions.toggleExpandedTask}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ================================
// SOUND TEST CONTROLS COMPONENT
// ================================

export const SoundTestControls = () => {
    const { playBreakWarningSound, playSessionStartSound, playFinishSound } = useSound();

    return (
        <div className="space-x-2">
            <button
                onClick={() => playBreakWarningSound()}
                className="px-2 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200"
            >
                🔔 Test Warning
            </button>
            <button
                onClick={() => playSessionStartSound()}
                className="px-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200"
            >
                🎵 Test Start Sound
            </button>
            <button
                onClick={() => playFinishSound()}
                className="px-2 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200"
            >
                🔊 Test Sound
            </button>
        </div>
    );
};

// ================================
// HISTORY TAB COMPONENT
// ================================

export const HistoryTab = () => {
    const { state } = usePomodoroContext();
    const { timeHistory, taskHistory } = state;

    const hasAnyHistory = timeHistory.length > 0 || taskHistory.length > 0;

    return (
        <div>
            {/* Attribution */}
            <div className="text-center py-4 text-xs text-gray-500">
                <a href="https://www.flaticon.com/fr/icones-gratuites/fusee" title="fusée icônes" className="hover:text-gray-400">
                    Rocket icon created by Freepik - Flaticon
                </a>
            </div>

            {/* History Header */}
            <div className="bg-gray-800 rounded-xl shadow-xl p-8 mb-6">
                <div className="flex items-center gap-2 mb-6">
                    <History className="w-6 h-6 text-indigo-500" />
                    <h2 className="text-2xl font-bold text-white">Session History</h2>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-gray-300">
                            View your completed work sessions organized by time period
                        </p>
                    </div>

                    {/* Sound Test Buttons */}
                    <SoundTestControls />
                </div>
            </div>

            {/* Time Period Selector */}
            <HistoryViewModeSelector />

            {/* History Content */}
            {!hasAnyHistory ? (
                /* Empty State */
                <div className="text-center py-12 text-gray-400">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No history yet. Complete some sessions to see your progress!</p>
                </div>
            ) : (
                /* History Grid */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WorkSessionsHistory />
                    <CompletedTasksHistory />
                </div>
            )}
        </div>
    );
};