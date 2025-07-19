// ================================
// PART 3: UTILITY FUNCTIONS AND SMALLER COMPONENTS
// ================================

import React, { memo } from 'react';
import { Check, Clock, X, Target, Zap } from 'lucide-react';
import { usePomodoroContext } from './part1-context.jsx';

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Format seconds into MM:SS display format
 */
export const formatTime = (seconds) => {
    // Handle invalid or null values
    if (seconds == null || isNaN(seconds) || seconds < 0) {
        return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format minutes into "XXh XXmin" display format
 */
export const formatMinutesToHourMin = (minutes) => {
    // Handle invalid or null values
    if (minutes == null || isNaN(minutes) || minutes < 0) {
        return '0min';
    }

    const roundedMinutes = Math.round(minutes);
    const hours = Math.floor(roundedMinutes / 60);
    const remainingMinutes = roundedMinutes % 60;

    if (hours === 0) {
        return `${remainingMinutes}min`;
    } else if (remainingMinutes === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${remainingMinutes}min`;
    }
};

/**
 * Export data to JSON file
 */
export const exportData = async (state) => {
    try {
        const {
            dailyGoal,
            tasks,
            completedTasks,
            timeHistory,
            taskHistory,
            dailyStreak,
            sessionStreak,
            streakHistory,
            manualMaxDailyStreak,
            manualMaxSessionStreak
        } = state;

        const data = {
            dailyGoal,
            tasks,
            completedTasks,
            timeHistory,
            taskHistory,
            dailyStreak,
            sessionStreak,
            streakHistory,
            manualMaxDailyStreak,
            manualMaxSessionStreak,
            lastSaved: new Date().toISOString(),
            version: '1.0'
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ Data exported successfully');
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        alert('Failed to export data');
    }
};

/**
 * Import data from JSON file
 */
export const importData = async (file, actions) => {
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate the data structure
        if (!data.version || !data.lastSaved) {
            throw new Error('Invalid file format');
        }

        if (window.confirm('This will replace all your current data. Are you sure you want to continue?')) {
            // Prepare data for loading
            const loadData = {};

            if (data.dailyGoal !== undefined) loadData.dailyGoal = data.dailyGoal;
            if (data.tasks && Array.isArray(data.tasks)) loadData.tasks = data.tasks;
            if (data.completedTasks && Array.isArray(data.completedTasks)) {
                loadData.completedTasks = data.completedTasks.map(task => ({
                    ...task,
                    timestamp: new Date(task.timestamp)
                }));
            }
            if (data.timeHistory && Array.isArray(data.timeHistory)) loadData.timeHistory = data.timeHistory;
            if (data.taskHistory && Array.isArray(data.taskHistory)) loadData.taskHistory = data.taskHistory;
            if (data.dailyStreak !== undefined) loadData.dailyStreak = data.dailyStreak;
            if (data.sessionStreak !== undefined) loadData.sessionStreak = data.sessionStreak;
            if (data.streakHistory && Array.isArray(data.streakHistory)) loadData.streakHistory = data.streakHistory;
            if (data.manualMaxDailyStreak !== undefined) loadData.manualMaxDailyStreak = data.manualMaxDailyStreak;
            if (data.manualMaxSessionStreak !== undefined) loadData.manualMaxSessionStreak = data.manualMaxSessionStreak;

            actions.loadAllData(loadData);
            console.log('✅ Data imported successfully');
            alert('Data imported successfully!');
        }

    } catch (error) {
        console.error('❌ Error importing data:', error);
        alert('Failed to import data. Please check the file format.');
    }
};

// ================================
// TASK ITEM COMPONENT
// ================================

/**
 * Individual Task Item Component - Displays task with completion/deletion controls
 * Handles both active tasks and completed tasks with different styling
 */
export const TaskItem = memo(({
    task,
    onComplete,
    onDelete,
    isActive = false,
    activeTaskId,
    onSetActive,
    canChangeActive,
    taskTimes = {}
}) => {
    // Calculate total time for this task (accumulated + current session time)
    const sessionTime = taskTimes[task.id] || 0;
    const accumulatedTime = task.accumulatedTime || 0;
    const totalTime = accumulatedTime + sessionTime;

    // Check if this task is currently active
    const isCurrentlyActive = activeTaskId === task.id;

    return (
        <div className={`group relative overflow-hidden ${isActive
            ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'
            : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10'
            } backdrop-blur-sm border ${isActive
                ? 'border-blue-500/20'
                : 'border-l-4 border-emerald-500/50'
            } rounded-xl p-3 hover:from-${isActive ? 'blue' : 'emerald'}-500/15 hover:to-${isActive ? 'cyan' : 'teal'}-500/15 transition-all duration-300`}>

            {/* Decorative element for completed tasks */}
            {!isActive && (
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full -translate-y-6 translate-x-6"></div>
            )}

            <div className="relative flex items-center gap-3">
                {isActive ? (
                    // Active Task Layout
                    <>
                        <div className="flex items-center gap-2">
                            {/* Radio button for task selection */}
                            <input
                                type="radio"
                                name="activeTask"
                                checked={isCurrentlyActive}
                                onChange={() => canChangeActive && onSetActive(task.id)}
                                disabled={!canChangeActive}
                                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2"
                            />

                            {/* Complete button (only for non-default tasks) */}
                            {!task.isDefault && (
                                <button
                                    onClick={() => onComplete(task.id, task.text)}
                                    className="w-6 h-6 rounded-full border-2 border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-all duration-200 group/check hover:shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                >
                                    <Check className="w-4 h-4 text-blue-400 opacity-0 group-hover/check:opacity-100 transition-opacity duration-200" />
                                </button>
                            )}
                        </div>

                        {/* Task text and status indicators */}
                        <span className="flex-1 text-white/90 font-medium group-hover:text-white transition-colors duration-200">
                            {task.text.length > 25 ? `${task.text.substring(0, 25)}...` : task.text}

                            {/* Default task badge */}
                            {task.isDefault && (
                                <span className="ml-2 px-2 py-0.5 bg-gray-500/30 text-gray-300 text-xs font-bold rounded-full border border-gray-500/50">
                                    DEFAULT
                                </span>
                            )}

                            {/* Active task badge */}
                            {isCurrentlyActive && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-500/30 text-blue-300 text-xs font-bold rounded-full border border-blue-500/50">
                                    ACTIVE
                                </span>
                            )}

                            {/* Time tracking display */}
                            {totalTime > 0 && (
                                <span className="text-blue-400/60 text-xs ml-1">
                                    ({accumulatedTime > 0 ? `${formatMinutesToHourMin(accumulatedTime)}+` : ''}{formatMinutesToHourMin(sessionTime)})
                                </span>
                            )}
                        </span>
                    </>
                ) : (
                    // Completed Task Layout
                    <div className="flex-1">
                        <span className="text-emerald-300 font-medium text-sm">{task.text}</span>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs text-white/50">
                                <Clock className="w-3 h-3" />
                                {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                            <div className="text-xs text-emerald-400/80 font-medium">
                                ✓ Completed
                            </div>
                            {/* Add time spent display */}
                            {task.duration > 0 && (
                                <>
                                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                                    <div className="text-xs text-blue-400/80 font-medium">
                                        {formatMinutesToHourMin(task.duration)} spent
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Delete button (only for non-default tasks) */}
                {!task.isDefault && (
                    <button
                        onClick={() => onDelete(task.id)}
                        className="w-6 h-6 text-white/30 hover:text-red-400 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
});

// ================================
// SESSION HISTORY ITEM COMPONENT
// ================================

/**
 * Session History Item Component - Displays completed focus sessions
 * Expandable to show detailed stats and task breakdown
 */
export const SessionHistoryItem = memo(({ session, onDelete, isExpanded, onToggle }) => {
    const isStopwatch = session.sessionType === 'stopwatch';

    return (
        <div className="group relative bg-gradient-to-r from-indigo-500/8 to-purple-500/8 backdrop-blur-sm border border-indigo-500/15 rounded-lg overflow-hidden hover:from-indigo-500/12 hover:to-purple-500/12 transition-all duration-300">

            {/* Compact Header - Always Visible */}
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-3 flex-1">
                    {/* Session type indicator */}
                    <div className={`w-7 h-7 rounded-full ${session.sessionType === '25/5' ? 'bg-green-500/20 border border-green-500/30' :
                        session.sessionType === '50/10' ? 'bg-blue-500/20 border border-blue-500/30' :
                            'bg-purple-500/20 border border-purple-500/30'
                        } flex items-center justify-center`}>
                        {session.sessionType === '25/5' ? (
                            <div className="text-green-400 font-bold text-xs">25</div>
                        ) : session.sessionType === '50/10' ? (
                            <div className="text-blue-400 font-bold text-xs">50</div>
                        ) : (
                            <Clock className="w-3 h-3 text-purple-400" />
                        )}
                    </div>

                    {/* Session summary */}
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm">
                            {session.task.length > 25 ? `${session.task.substring(0, 25)}...` : session.task}
                        </div>
                        <div className="text-xs text-gray-400">
                            {new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {formatMinutesToHourMin(session.totalMinutes)}
                            {!isStopwatch && ` • ${session.sessionCount}s • Streak: ${session.sessionStreak || 0}`}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Expand/collapse arrow */}
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {/* Delete button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(session.id);
                        }}
                        className="w-6 h-6 text-white/30 hover:text-red-400 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-indigo-500/10">
                    <div className="pt-3">
                        {/* Timestamp */}
                        <div className="text-sm text-indigo-400/80 mb-2">
                            {new Date(session.timestamp).toLocaleDateString()} at {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="text-center bg-indigo-900/20 rounded-lg p-2 border border-indigo-500/20">
                                <div className="text-lg font-bold text-indigo-400">{formatMinutesToHourMin(session.totalMinutes)}</div>
                                <div className="text-xs text-indigo-300/80">Total Time</div>
                            </div>

                            {!isStopwatch ? (
                                <>
                                    <div className="text-center bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                                        <div className="text-lg font-bold text-purple-400">{session.sessionCount}</div>
                                        <div className="text-xs text-purple-300/80">Sessions</div>
                                    </div>
                                    <div className="text-center bg-orange-900/20 rounded-lg p-2 border border-orange-500/20">
                                        <div className="text-lg font-bold text-yellow-400 flex items-center justify-center gap-1">
                                            <Zap className="w-4 h-4" />
                                            {session.sessionStreak || 0}
                                        </div>
                                        <div className="text-xs text-yellow-300/80">Session</div>
                                    </div>
                                    <div className="text-center bg-green-900/20 rounded-lg p-2 border border-green-500/20">
                                        <div className="text-lg font-bold text-green-400 flex items-center justify-center gap-1">
                                            🔥 {session.dailyStreak || 0}
                                        </div>
                                        <div className="text-xs text-green-300/80">Daily</div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center bg-cyan-900/20 rounded-lg p-2 border border-cyan-500/20">
                                    <div className="text-lg font-bold text-cyan-400 flex items-center justify-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        ∞
                                    </div>
                                    <div className="text-xs text-cyan-300/80">Stopwatch</div>
                                </div>
                            )}
                        </div>

                        {/* Task Breakdown */}
                        {session.taskBreakdown && Object.keys(session.taskBreakdown).length > 0 && (
                            <div className="pt-2 border-t border-indigo-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-3 h-3 text-indigo-400" />
                                    <span className="text-xs font-medium text-indigo-300">Task Breakdown:</span>
                                </div>
                                <div className="space-y-1">
                                    {Object.entries(session.taskBreakdown).map(([taskName, minutes]) => {
                                        if (minutes === 0) return null;
                                        return (
                                            <div key={taskName} className="flex items-center justify-between text-xs bg-indigo-900/10 rounded p-2">
                                                <span className="text-white/70 flex-1">
                                                    {taskName.length > 25 ? `${taskName.substring(0, 25)}...` : taskName}
                                                </span>
                                                <span className="font-medium text-indigo-400 ml-2">
                                                    {formatMinutesToHourMin(minutes)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

// ================================
// TASK HISTORY ITEM COMPONENT
// ================================

/**
 * Task History Item Component - Displays completed tasks
 * Expandable to show completion details and duration
 */
export const TaskHistoryItem = memo(({ task, onDelete, isExpanded, onToggle }) => {
    return (
        <div className="group relative bg-gradient-to-r from-emerald-500/8 to-teal-500/8 backdrop-blur-sm border border-emerald-500/15 rounded-lg overflow-hidden hover:from-emerald-500/12 hover:to-teal-500/12 transition-all duration-300">

            {/* Compact Header */}
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-3 flex-1">
                    {/* Completion icon */}
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-400" />
                    </div>

                    {/* Task summary */}
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm">
                            {task.task.length > 25 ? `${task.task.substring(0, 25)}...` : task.task}
                        </div>
                        <div className="text-xs text-gray-400">
                            {new Date(task.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {formatMinutesToHourMin(task.duration)}
                        </div>

                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                        }}
                        className="w-6 h-6 text-white/30 hover:text-red-400 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-emerald-500/10">
                    <div className="pt-3">
                        {/* Completion timestamp */}
                        <div className="text-sm text-emerald-400/80 mb-3">
                            Completed on {new Date(task.timestamp).toLocaleDateString()} at {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {/* Detailed Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center bg-emerald-900/20 rounded-lg p-3 border border-emerald-500/20">
                                <div className="text-lg font-bold text-emerald-400">{Math.floor(task.duration / 60)}h {task.duration % 60}min</div>
                                <div className="text-xs text-emerald-300/80">Duration</div>
                            </div>
                            <div className="text-center bg-teal-900/20 rounded-lg p-3 border border-teal-500/20">
                                <div className="text-lg font-bold text-teal-400">
                                    {new Date(task.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className="text-xs text-teal-300/80">Day</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

// ================================
// PROGRESS BAR COMPONENT
// ================================

export const ProgressBar = ({ totalTimeToday, dailyGoal, todaySessionCount }) => {
    const { actions } = usePomodoroContext();

    return (
        <div className="p-2 mb-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <Target className="w-3 h-3 text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold text-white">
                        {Math.round(todaySessionCount * 10) / 10} sessions today
                    </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Daily Goal Control */}
                    <div className="flex bg-indigo-500/10 items-center gap-1 px-3 py-1 border border-indigo-500/30 rounded-full shadow-inner backdrop-blur-sm">
                        <span className="text-xs font-medium text-white">Goal:</span>
                        <button
                            onClick={() => actions.setDailyGoal(Math.max(60, dailyGoal - 60))}
                            className="w-4 h-4 rounded-full text-indigo-400 hover:text-white flex items-center justify-center transition text-xs"
                        >
                            -
                        </button>
                        <span className="text-xs font-bold text-white">{Math.floor(dailyGoal / 60)}h</span>
                        <button
                            onClick={() => actions.setDailyGoal(Math.min(1440, dailyGoal + 60))}
                            className="w-4 h-4 rounded-full text-indigo-400 hover:text-white flex items-center justify-center transition text-xs"
                        >
                            +
                        </button>
                    </div>

                    {/* Today's Time Display */}
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full backdrop-blur-sm">
                        <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Clock className="w-2 h-2 text-green-400" />
                        </div>
                        <span className="text-xs font-bold text-green-400">
                            {formatMinutesToHourMin(totalTimeToday)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full shadow-lg"
                        style={{
                            width: `${Math.min((totalTimeToday / dailyGoal) * 100, 100)}%`,
                            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};