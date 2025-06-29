// ================================
// IMPORTS AND DEPENDENCIES
// ================================
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import ReactDOM from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
    Play, Pause, Square, Plus, Check, Clock, BarChart3, Calendar,
    CalendarDays, CalendarRange, Target, X, History, Flame,
    HelpCircle, Download, Upload, FileText
} from 'lucide-react';
import { appDataDir, join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';

// ================================
// MODAL COMPONENTS
// ================================

/**
 * Instructions Modal Component - Portal-based modal for app instructions
 * Shows how to use the app and share data with friends
 */
const InstructionsModalPortal = ({ isOpen, onClose }) => {
    const [mounted, setMounted] = useState(false);

    // Ensure proper mounting for portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-700">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-xl font-bold text-white">How to Use & Share Data</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full flex items-center justify-center transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6" style={{ height: '500px', overflowY: 'auto' }}>
                    <div className="space-y-6 text-gray-300">

                        {/* Basic Usage Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-400" />
                                Basic Usage
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li>• Choose between 25min (Pomodoro) or 50min focus sessions</li>
                                <li>• Add tasks to work on during your sessions</li>
                                <li>• <strong>Sessions:</strong> 25/50 min work periods</li>
                                <li>• <strong>Cycles:</strong> Complete work + break periods</li>
                                <li>• Data is only saved when you stop the timer</li>
                            </ul>
                        </div>

                        {/* Session & Cycle System */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-400" />
                                Session & Cycle System
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li>• <strong>Session:</strong> 25min = 0.5 streak, 50min = 1.0 streak</li>
                                <li>• <strong>Cycle:</strong> Work session + break (25+5 or 50+10 minutes)</li>
                                <li>• History shows sessions completed, cycles completed, and overall streak</li>
                                <li>• Stopping the timer resets current streak to 0</li>
                                <li>• Only saves to history when you press Stop</li>
                            </ul>
                        </div>

                        {/* Data Export Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Download className="w-5 h-5 text-green-400" />
                                Exporting Your Data
                            </h3>
                            <div className="space-y-3 text-sm">
                                <p>To share your data with friends or backup your progress:</p>
                                <ol className="space-y-2 pl-4">
                                    <li>1. Go to the <strong>Analytics</strong> tab</li>
                                    <li>2. Scroll down to "Data Management" section</li>
                                    <li>3. Click <strong>"Export Data"</strong> button</li>
                                    <li>4. A JSON file will be downloaded to your computer</li>
                                    <li>5. Share this file with friends or keep it as a backup</li>
                                </ol>
                                <div className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/30">
                                    <p className="text-indigo-300 text-xs">
                                        💡 <strong>Tip:</strong> The exported file contains all your sessions, tasks, streak data, and settings.
                                        It's perfect for backing up your progress or sharing achievements!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Data Import Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-blue-400" />
                                Importing Data
                            </h3>
                            <div className="space-y-3 text-sm">
                                <p>To load data from a friend or restore a backup:</p>
                                <ol className="space-y-2 pl-4">
                                    <li>1. Go to the <strong>Analytics</strong> tab</li>
                                    <li>2. Scroll down to "Data Management" section</li>
                                    <li>3. Click <strong>"Import Data"</strong> button</li>
                                    <li>4. Select the JSON file you want to import</li>
                                    <li>5. Confirm the import (this will replace your current data)</li>
                                </ol>
                                <div className="bg-red-900/30 p-3 rounded-lg border border-red-500/30">
                                    <p className="text-red-300 text-xs">
                                        ⚠️ <strong>Warning:</strong> Importing will completely replace your current data.
                                        Make sure to export your current data first if you want to keep it!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* File Format Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-400" />
                                File Format
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p>The exported file is in JSON format and contains:</p>
                                <ul className="space-y-1 pl-4">
                                    <li>• All your focus sessions with session/cycle counts</li>
                                    <li>• Completed tasks history</li>
                                    <li>• Current and longest streak records</li>
                                    <li>• Daily goal settings</li>
                                    <li>• Active tasks list</li>
                                </ul>
                                <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                                    <p className="text-gray-300 text-xs">
                                        📁 File name format: <code>pomodoro-data-YYYY-MM-DD.json</code>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sharing Tips */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-yellow-400" />
                                Sharing with Friends
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p>Great ways to use the export/import feature:</p>
                                <ul className="space-y-1 pl-4">
                                    <li>• Share your productivity achievements</li>
                                    <li>• Compare focus session streaks with friends</li>
                                    <li>• Backup your data before trying new strategies</li>
                                    <li>• Transfer data between devices</li>
                                    <li>• Create challenges by sharing goal targets</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all duration-200 font-semibold"
                    >
                        Got it! Let's focus 🎯
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ================================
// TASK ITEM COMPONENTS
// ================================

/**
 * Individual Task Item Component - Displays task with completion/deletion controls
 * Handles both active tasks and completed tasks with different styling
 */
const TaskItem = memo(({
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
                                    ({accumulatedTime > 0 ? `${Math.round(accumulatedTime)}+` : ''}{Math.round(sessionTime)}m)
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
// HISTORY ITEM COMPONENTS
// ================================

/**
 * Session History Item Component - Displays completed focus sessions
 * Expandable to show detailed stats and task breakdown
 */
const SessionHistoryItem = memo(({ session, onDelete, isExpanded, onToggle }) => {
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
                            {new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {session.totalMinutes}m
                            {!isStopwatch && ` • ${session.sessionCount}s • ${session.cycleCount}c`}
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
                                <div className="text-lg font-bold text-indigo-400">{session.totalMinutes}</div>
                                <div className="text-xs text-indigo-300/80">Total Minutes</div>
                            </div>

                            {!isStopwatch ? (
                                <>
                                    <div className="text-center bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                                        <div className="text-lg font-bold text-purple-400">{session.sessionCount}</div>
                                        <div className="text-xs text-purple-300/80">Sessions</div>
                                    </div>
                                    {session.cycleCount > 0 && (
                                        <>
                                            <div className="text-center bg-green-900/20 rounded-lg p-2 border border-green-500/20">
                                                <div className="text-lg font-bold text-green-400">{session.cycleCount}</div>
                                                <div className="text-xs text-green-300/80">Cycles</div>
                                            </div>
                                            <div className="text-center bg-orange-900/20 rounded-lg p-2 border border-orange-500/20">
                                                <div className="text-lg font-bold text-orange-400 flex items-center justify-center gap-1">
                                                    <Flame className="w-4 h-4" />
                                                    {session.overallStreak}
                                                </div>
                                                <div className="text-xs text-orange-300/80">Streak</div>
                                            </div>
                                        </>
                                    )}
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
                                                    {Math.round(minutes)}m
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

/**
 * Task History Item Component - Displays completed tasks
 * Expandable to show completion details and duration
 */
const TaskHistoryItem = memo(({ task, onDelete, isExpanded, onToggle }) => {
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
                            {new Date(task.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {task.duration}m
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
                                <div className="text-lg font-bold text-emerald-400">{task.duration}</div>
                                <div className="text-xs text-emerald-300/80">Duration (min)</div>
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
// CUSTOM HOOKS
// ================================

/**
 * Timer Hook - Manages timer state and countdown/countup logic
 * Handles different timer modes (25/5, 50/10, stopwatch) and test mode
 */
const useTimer = (mode, isBreak, onTimerComplete, onTimeWarning, testMode) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionElapsedTime, setSessionElapsedTime] = useState(0);
    const intervalRef = useRef(null);

    // Initialize timer based on mode and break state
    useEffect(() => {
        if (mode === '25/5') {
            setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
        } else if (mode === '50/10') {
            setTimeLeft(isBreak ? 10 * 60 : 50 * 60);
        } else if (mode === 'stopwatch') {
            setTimeLeft(0);
        }
        setSessionElapsedTime(0);
    }, [mode, isBreak]);

    // Main timer interval logic
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (mode === 'stopwatch') {
                        // Stopwatch counts up
                        const newTime = prev + 1;
                        setSessionElapsedTime(newTime);
                        return newTime;
                    } else {
                        // Pomodoro counts down
                        const newTime = prev - 1;

                        // Trigger warning sounds
                        if (!testMode && onTimeWarning) {
                            onTimeWarning(newTime);
                        }

                        // Timer completed
                        if (newTime <= 0) {
                            onTimerComplete();
                            return 0;
                        }

                        // Update elapsed time for progress tracking
                        const totalTime = mode === '25/5' ? (isBreak ? 5 * 60 : 25 * 60) : (isBreak ? 10 * 60 : 50 * 60);
                        setSessionElapsedTime(totalTime - newTime);
                        return newTime;
                    }
                });
            }, testMode ? 5 : 1000); // Accelerated in test mode
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isRunning, mode, isBreak, onTimerComplete, onTimeWarning, testMode]);

    return { timeLeft, isRunning, setIsRunning, sessionElapsedTime, setTimeLeft, setSessionElapsedTime };
};

/**
 * Sound Hook - Manages audio feedback for timer events
 * Creates different sounds for various timer states and warnings
 */
const useSound = () => {
    const audioContextRef = useRef(null);

    // Generic sound player using Web Audio API
    const playSound = useCallback((frequency, duration, type = 'sine') => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (error) {
            console.log('Audio not supported or blocked by browser');
        }
    }, []);

    // Specific sound effects for different events
    const playFinishSound = useCallback(() => {
        playSound(800, 0.2);
        setTimeout(() => playSound(600, 0.3), 200);
    }, [playSound]);

    const playSessionStartSound = useCallback(() => {
        playSound(400, 0.3);
        setTimeout(() => playSound(700, 0.4), 300);
    }, [playSound]);

    const playBreakWarningSound = useCallback(() => {
        playSound(600, 0.1);
    }, [playSound]);

    const playAlmostSound = useCallback(() => {
        playSound(1000, 0.15);
    }, [playSound]);

    return { playFinishSound, playSessionStartSound, playBreakWarningSound, playAlmostSound };
};

// ================================
// MAIN POMODORO COMPONENT - STATE SETUP
// ================================

const PomodoroApp = () => {

    // ================================
    // DEVELOPMENT & UI STATE
    // ================================

    // Test mode - accelerates timer for development/testing
    const [testMode, setTestMode] = useState(false);
    const [devClickCount, setDevClickCount] = useState(0);

    // UI expansion states for history items
    const [expandedSessions, setExpandedSessions] = useState(new Set());
    const [expandedTasks, setExpandedTasks] = useState(new Set());

    // ================================
    // TIMER CORE STATE
    // ================================

    // Timer configuration and state
    const [mode, setMode] = useState('25/5'); // '25/5', '50/10', or 'stopwatch'
    const [isBreak, setIsBreak] = useState(false);
    const [currentTask, setCurrentTask] = useState(''); // Input field for new tasks
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // ================================
    // TASK TIME TRACKING SYSTEM
    // ================================

    // New system for tracking time spent on each task during current session
    const [activeTaskId, setActiveTaskId] = useState(null); // Currently selected task
    const [taskSessionTimes, setTaskSessionTimes] = useState({}); // Time per task in current session
    const [lastUpdateTime, setLastUpdateTime] = useState(null); // For calculating time deltas
    const [taskSessionNames, setTaskSessionNames] = useState({}); // Track task names for completed tasks

    // ================================
    // TEMPORARY SESSION COUNTERS
    // ================================

    // These are reset when timer is stopped and saved to permanent history
    const [tempSessionCount, setTempSessionCount] = useState(0); // Completed work sessions
    const [tempCycleCount, setTempCycleCount] = useState(0); // Completed work+break cycles
    const [tempOverallStreak, setTempOverallStreak] = useState(0); // Current session streak

    // ================================
    // PERSISTENT DATA STATE
    // ================================

    // User settings
    const [dailyGoal, setDailyGoal] = useState(480); // Daily goal in minutes (8 hours default)

    // Task management
    const [tasks, setTasks] = useState([]); // Active tasks list
    const [completedTasks, setCompletedTasks] = useState([]); // Recently completed tasks (24h)

    // Historical data
    const [timeHistory, setTimeHistory] = useState([]); // All completed focus sessions
    const [taskHistory, setTaskHistory] = useState([]); // All completed tasks

    // History organization state
    const [historyViewMode, setHistoryViewMode] = useState('day'); // 'day', 'week', 'month', 'year'
    const [expandedTimePeriods, setExpandedTimePeriods] = useState(new Set());

    // ================================
    // STREAK TRACKING
    // ================================

    // Streak system for motivation
    const [currentSessionStreak, setCurrentSessionStreak] = useState(0); // Current session streak
    const [longestSessionStreak, setLongestSessionStreak] = useState(0); // All-time best streak
    const [lastSessionDate, setLastSessionDate] = useState(null); // Last session timestamp

    // ================================
    // UI AND DATA PERSISTENCE STATE
    // ================================

    // UI state
    const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'year' for analytics
    const [activeTab, setActiveTab] = useState('timer'); // 'timer', 'analytics', 'history'
    const [showInstructions, setShowInstructions] = useState(false); // Modal state

    // Data persistence
    const [dataFilePath, setDataFilePath] = useState(undefined); // Path to data file
    const [isLoaded, setIsLoaded] = useState(false); // Loading state

    // ================================
    // SOUND SYSTEM
    // ================================

    // Initialize sound hooks for audio feedback
    const { playFinishSound, playSessionStartSound, playBreakWarningSound, playAlmostSound } = useSound();

    // ================================
    // TIMER EVENT HANDLERS
    // ================================

    /**
     * Handles timer warning sounds (3, 2, 1 second warnings and break warnings)
     */
    const handleTimeWarning = useCallback((timeLeft) => {
        // Final countdown warnings
        if (timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
            playAlmostSound();
        }

        // Break ending warning (30 seconds before break ends)
        if (isBreak && timeLeft === 30) {
            playBreakWarningSound();
        }
    }, [isBreak, playAlmostSound, playBreakWarningSound]);

    /**
     * Handles timer completion - manages session/cycle counting and break transitions
     */
    const handleTimerComplete = useCallback(() => {
        if (!isBreak) {
            // Work session completed
            playFinishSound();

            // Calculate session value for streak (25min = 0.5, 50min = 1.0)
            const sessionValue = mode === '25/5' ? 0.5 : 1;

            // Update temporary session counters
            setTempSessionCount(prev => prev + 1);
            setTempOverallStreak(prev => prev + sessionValue);

            // Update session streak tracking
            setCurrentSessionStreak(prev => {
                const newStreak = prev + sessionValue;
                if (newStreak > longestSessionStreak) {
                    setLongestSessionStreak(newStreak);
                }
                return newStreak;
            });

            // Transition to break
            setIsBreak(true);
        } else {
            // Break completed - this completes a full cycle
            playSessionStartSound();

            // Update cycle counter
            setTempCycleCount(prev => prev + 1);

            // Return to work session
            setIsBreak(false);
        }

        // Record session completion timestamp
        setLastSessionDate(new Date().toISOString());
    }, [isBreak, mode, longestSessionStreak, playFinishSound, playSessionStartSound]);

    // ================================
    // TIMER HOOK INITIALIZATION
    // ================================

    // Initialize timer with all event handlers
    const timerState = useTimer(mode, isBreak, handleTimerComplete, handleTimeWarning, testMode);
    const { timeLeft, isRunning, setIsRunning, sessionElapsedTime, setTimeLeft, setSessionElapsedTime } = timerState;

    // ================================
    // TASK TIME TRACKING SYSTEM
    // ================================

    /**
     * Updates time tracking for the currently active task
     * Called regularly when timer is running to accumulate task time
     */
    const updateActiveTaskTime = useCallback(() => {
        if (!isRunning || !activeTaskId) return;

        const now = Date.now();
        if (!lastUpdateTime) {
            setLastUpdateTime(now);
            return;
        }

        // Calculate time delta (accelerated in test mode)
        const deltaSeconds = (now - lastUpdateTime) / 1000;
        const deltaMinutes = testMode ? (deltaSeconds * 200) / 60 : deltaSeconds / 60;

        // Add time to active task
        setTaskSessionTimes(prev => ({
            ...prev,
            [activeTaskId]: (prev[activeTaskId] || 0) + deltaMinutes
        }));

        // Store task name for later reference (in case task gets completed)
        const activeTask = tasks.find(t => t.id === activeTaskId);
        if (activeTask) {
            setTaskSessionNames(prev => ({
                ...prev,
                [activeTaskId]: activeTask.text
            }));
        }

        setLastUpdateTime(now);
    }, [isRunning, activeTaskId, lastUpdateTime, testMode, tasks]);

    // Auto-update task times when timer is running
    useEffect(() => {
        let interval;
        if (isRunning && activeTaskId) {
            // More frequent updates in test mode for smoother display
            interval = setInterval(updateActiveTaskTime, testMode ? 50 : 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, activeTaskId, updateActiveTaskTime, testMode]);

    /**
     * Switches active task while preserving time tracking
     * Only works when timer is running
     */
    const setActiveTask = useCallback((taskId) => {
        if (!isRunning) return;

        // Update current task time before switching
        updateActiveTaskTime();

        // Switch to new task
        setActiveTaskId(taskId);
        setLastUpdateTime(Date.now());

        console.log('Switched to task:', taskId);
    }, [isRunning, updateActiveTaskTime]);

    // ================================
    // SIMPLIFIED TAURI V2 DATA PERSISTENCE
    // ================================

    /**
     * Initialize data persistence with direct approach
     * No complex path joining - just use BaseDirectory directly
     */
    useEffect(() => {
        const initData = async () => {
            try {
                console.log('🔄 Initializing direct file system access...');

                // Test if we can access the file system by trying to check if a file exists
                const { exists } = await import('@tauri-apps/plugin-fs');
                const { BaseDirectory } = await import('@tauri-apps/plugin-fs');

                // Simple test to see if file system is working
                const testFile = 'pomodoro-data.json';
                await exists(testFile, { baseDir: BaseDirectory.AppData });

                console.log('✅ File system is accessible');
                setDataFilePath(testFile); // Just the filename

            } catch (error) {
                console.error('❌ File system test failed:', error);
                setDataFilePath(null);
                setIsLoaded(true);
            }
        };

        // Only run once
        if (!dataFilePath && !isLoaded) {
            initData();
        }
    }, [dataFilePath, isLoaded]);

    /**
     * Load data using simplified approach
     */
    useEffect(() => {
        const loadData = async () => {
            if (isLoaded || !dataFilePath) {
                return;
            }

            try {
                console.log('📖 Attempting to load data...');

                const { exists, readTextFile } = await import('@tauri-apps/plugin-fs');
                const { BaseDirectory } = await import('@tauri-apps/plugin-fs');

                const fileExists = await exists(dataFilePath, { baseDir: BaseDirectory.AppData });

                if (!fileExists) {
                    console.log('📝 No existing data file, starting fresh');
                    setIsLoaded(true);
                    return;
                }

                console.log('📄 Reading existing data file...');
                const content = await readTextFile(dataFilePath, { baseDir: BaseDirectory.AppData });

                if (!content || content.trim() === '') {
                    console.log('📝 Empty file, starting fresh');
                    setIsLoaded(true);
                    return;
                }

                const data = JSON.parse(content);
                console.log('🎯 Data loaded successfully:', Object.keys(data));

                // Restore data
                if (data.dailyGoal !== undefined) setDailyGoal(data.dailyGoal);
                if (data.tasks && Array.isArray(data.tasks)) setTasks(data.tasks);
                if (data.completedTasks && Array.isArray(data.completedTasks)) {
                    setCompletedTasks(data.completedTasks.map(task => ({
                        ...task,
                        timestamp: new Date(task.timestamp)
                    })));
                }
                if (data.timeHistory && Array.isArray(data.timeHistory)) setTimeHistory(data.timeHistory);
                if (data.taskHistory && Array.isArray(data.taskHistory)) setTaskHistory(data.taskHistory);
                if (data.currentSessionStreak !== undefined) setCurrentSessionStreak(data.currentSessionStreak);
                if (data.longestSessionStreak !== undefined) setLongestSessionStreak(data.longestSessionStreak);
                if (data.lastSessionDate) setLastSessionDate(data.lastSessionDate);

                console.log('✅ All data restored successfully');

            } catch (error) {
                console.error('❌ Error loading data:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadData();
    }, [dataFilePath, isLoaded]);

    /**
     * Save data with simplified approach
     */
    const saveData = useCallback(async () => {
        if (!isLoaded || !dataFilePath) {
            console.log('⚠️ Skipping save - not ready');
            return false;
        }

        try {
            const { writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');
            const { BaseDirectory } = await import('@tauri-apps/plugin-fs');

            // Create the app directory if it doesn't exist
            const dirExists = await exists('', { baseDir: BaseDirectory.AppData });
            if (!dirExists) {
                console.log('📁 Creating app directory...');
                await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true });
            }

            const data = {
                dailyGoal,
                tasks,
                completedTasks,
                timeHistory,
                taskHistory,
                currentSessionStreak,
                longestSessionStreak,
                lastSessionDate,
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };

            console.log('💾 Saving data...', {
                tasks: data.tasks?.length || 0,
                timeHistory: data.timeHistory?.length || 0,
                taskHistory: data.taskHistory?.length || 0
            });

            await writeTextFile(dataFilePath, JSON.stringify(data, null, 2), {
                baseDir: BaseDirectory.AppData
            });

            console.log('✅ Data saved successfully');
            return true;

        } catch (error) {
            console.error('❌ Error saving data:', error);
            return false;
        }
    }, [isLoaded, dataFilePath, dailyGoal, tasks, completedTasks, timeHistory, taskHistory, currentSessionStreak, longestSessionStreak, lastSessionDate]);

    // Auto-save with debouncing
    useEffect(() => {
        if (isLoaded && dataFilePath) {
            const timeoutId = setTimeout(() => {
                console.log('🔄 Auto-saving...');
                saveData();
            }, 2000); // Increased to 2 seconds to prevent rapid saves

            return () => clearTimeout(timeoutId);
        }
    }, [isLoaded, dataFilePath, dailyGoal, tasks, completedTasks, timeHistory, taskHistory, currentSessionStreak, longestSessionStreak, lastSessionDate]);


    // ================================
    // APP INITIALIZATION
    // ================================

    /**
     * Update current time display every second
     */
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // ================================
    // TIMER CONTROL FUNCTIONS
    // ================================

    /**
     * Start the timer - handles initial setup and task creation
     */
    const startTimer = useCallback(() => {
        setIsRunning(true);
        setLastUpdateTime(Date.now());

        // Record session start time if this is a new session
        if (!sessionStartTime) {
            setSessionStartTime(new Date());
        }

        // Auto-create default task if no tasks exist
        if (tasks.length === 0) {
            const defaultTask = {
                id: Date.now(),
                text: 'Focus Session',
                completed: false,
                accumulatedTime: 0,
                isDefault: true // Mark as default task
            };
            setTasks([defaultTask]);
            setActiveTaskId(defaultTask.id);
        }
        // Auto-select first task if none is selected and tasks exist
        else if (!activeTaskId && tasks.length > 0) {
            setActiveTaskId(tasks[0].id);
        }
    }, [sessionStartTime, activeTaskId, tasks]);

    /**
     * Pause the timer - preserves all current state
     */
    const pauseTimer = useCallback(() => {
        // Update active task time before pausing
        updateActiveTaskTime();
        setIsRunning(false);
        setLastUpdateTime(null);
    }, [updateActiveTaskTime]);

    /**
     * Stop the timer - saves session to history and resets state
     * This is where all the data gets permanently saved
     */
    const stopTimer = useCallback(() => {
        // Final update of active task time
        if (isRunning) {
            updateActiveTaskTime();
        }

        setIsRunning(false);

        // ================================
        // SAVE ACCUMULATED TIME TO TASKS
        // ================================

        // Update task accumulated times with session data
        if (Object.keys(taskSessionTimes).length > 0) {
            setTasks(prev => prev.map(task => {
                const sessionTime = taskSessionTimes[task.id] || 0;
                if (sessionTime > 0) {
                    return {
                        ...task,
                        accumulatedTime: (task.accumulatedTime || 0) + sessionTime
                    };
                }
                return task;
            }));
        }

        // ================================
        // SAVE SESSION TO HISTORY
        // ================================

        // Calculate total session time
        const totalSessionMinutes = Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0);

        if (mode === 'stopwatch') {
            // Stopwatch mode - save if session was at least 1 minute
            if (totalSessionMinutes >= 1) {
                const lastTaskName = activeTaskId ?
                    (tasks.find(t => t.id === activeTaskId)?.text || 'Focus Session') :
                    (tasks.length > 0 ? tasks[tasks.length - 1].text : 'Focus Session');

                // Create task breakdown with names instead of IDs
                const taskBreakdownWithNames = {};
                Object.entries(taskSessionTimes).forEach(([taskId, time]) => {
                    const storedName = taskSessionNames[taskId];
                    const currentTask = tasks.find(t => t.id === parseInt(taskId));
                    const taskName = storedName || currentTask?.text || `Task ${taskId}`;

                    if (time > 0) {
                        taskBreakdownWithNames[taskName] = time;
                    }
                });

                const newSession = {
                    id: Date.now() + Math.random(),
                    task: lastTaskName,
                    totalMinutes: Math.round(totalSessionMinutes),
                    sessionCount: 0,
                    cycleCount: 0,
                    overallStreak: 0,
                    timestamp: new Date().toISOString(),
                    sessionType: mode,
                    taskBreakdown: taskBreakdownWithNames
                };

                setTimeHistory(prev => [...prev, newSession]);
            }
        } else {
            // Pomodoro modes - save if there were any sessions, cycles, or time
            if (tempSessionCount > 0 || tempCycleCount > 0 || totalSessionMinutes > 0) {
                const lastTaskName = activeTaskId ?
                    (tasks.find(t => t.id === activeTaskId)?.text || 'Focus Session') :
                    (tasks.length > 0 ? tasks[tasks.length - 1].text : 'Focus Session');

                // Create task breakdown with names
                const taskBreakdownWithNames = {};
                Object.entries(taskSessionTimes).forEach(([taskId, time]) => {
                    const storedName = taskSessionNames[taskId];
                    const currentTask = tasks.find(t => t.id === parseInt(taskId));
                    const taskName = storedName || currentTask?.text || `Task ${taskId}`;

                    if (time > 0) {
                        taskBreakdownWithNames[taskName] = time;
                    }
                });

                const newSession = {
                    id: Date.now() + Math.random(),
                    task: lastTaskName,
                    totalMinutes: Math.round(totalSessionMinutes),
                    sessionCount: tempSessionCount,
                    cycleCount: tempCycleCount,
                    overallStreak: tempOverallStreak,
                    timestamp: new Date().toISOString(),
                    sessionType: mode,
                    taskBreakdown: taskBreakdownWithNames
                };

                setTimeHistory(prev => [...prev, newSession]);
            }
        }

        // ================================
        // RESET DEFAULT TASK TIME
        // ================================

        // Reset accumulated time for default tasks after saving to history
        setTasks(prev => prev.map(task => {
            if (task.isDefault) {
                return { ...task, accumulatedTime: 0 };
            }
            return task;
        }));

        // Ensure default task always exists and stays at the bottom
        setTasks(prev => {
            const nonDefaultTasks = prev.filter(task => !task.isDefault);
            const defaultTask = prev.find(task => task.isDefault);

            if (defaultTask) {
                return [...nonDefaultTasks, { ...defaultTask, accumulatedTime: 0 }];
            } else {
                // Create new default task if none exists
                const newDefaultTask = {
                    id: Date.now() + Math.random(),
                    text: 'Focus Session',
                    completed: false,
                    accumulatedTime: 0,
                    isDefault: true
                };
                return [...nonDefaultTasks, newDefaultTask];
            }
        });

        // ================================
        // RESET ALL SESSION STATE
        // ================================

        // Clear all temporary counters
        setTempSessionCount(0);
        setTempCycleCount(0);
        setTempOverallStreak(0);
        setTaskSessionTimes({});
        setTaskSessionNames({});
        setActiveTaskId(null);
        setLastUpdateTime(null);

        // Reset timer state
        setTimeLeft(mode === '25/5' ? 25 * 60 : mode === '50/10' ? 50 * 60 : 0);
        setIsBreak(false);
        setSessionStartTime(null);
        setSessionElapsedTime(0);
        setCurrentSessionStreak(0);
    }, [isRunning, updateActiveTaskTime, taskSessionTimes, tasks, mode, tempSessionCount, tempCycleCount, tempOverallStreak, activeTaskId, taskSessionNames]);

    // ================================
    // TASK MANAGEMENT FUNCTIONS
    // ================================

    /**
     * Add new task to the active tasks list
     * Maintains default task at bottom and auto-activates new task if timer is running
     */
    const addTask = useCallback(() => {
        if (currentTask.trim()) {
            const newTask = {
                id: Date.now(),
                text: currentTask,
                completed: false,
                accumulatedTime: 0
            };

            // Update tasks list while keeping default task at bottom
            setTasks(prev => {
                const nonDefaultTasks = prev.filter(task => !task.isDefault);
                const defaultTask = prev.find(task => task.isDefault);

                if (defaultTask) {
                    return [newTask, ...nonDefaultTasks, defaultTask];
                } else {
                    // Create default task if somehow missing
                    const newDefaultTask = {
                        id: Date.now() + Math.random() + 1,
                        text: 'Focus Session',
                        completed: false,
                        accumulatedTime: 0,
                        isDefault: true
                    };
                    return [newTask, ...nonDefaultTasks, newDefaultTask];
                }
            });

            setCurrentTask('');

            // Auto-activate new task if timer is running
            if (isRunning) {
                if (activeTaskId) {
                    updateActiveTaskTime();
                }
                setActiveTaskId(newTask.id);
                setLastUpdateTime(Date.now());
            }
        }
    }, [currentTask, isRunning, activeTaskId, updateActiveTaskTime]);

    /**
     * Save completed task to task history
     * Calculates total time spent on task from session and accumulated time
     */
    const saveCompletedTask = useCallback((task) => {
        const taskObj = tasks.find(t => t.text === task);
        const sessionTime = taskObj ? (taskSessionTimes[taskObj.id] || 0) : 0;
        const accumulatedTime = taskObj ? (taskObj.accumulatedTime || 0) : 0;
        const totalTime = accumulatedTime + sessionTime;

        const newTask = {
            id: Date.now() + Math.random(),
            task: task,
            timestamp: new Date().toISOString(),
            duration: totalTime > 0 ? Math.round(totalTime) : (
                mode === 'stopwatch' ? Math.floor(timeLeft / 60) :
                    (mode === '25/5' ? 25 : 50) - Math.floor(timeLeft / 60)
            )
        };

        setTaskHistory(prev => [...prev, newTask]);
    }, [tasks, mode, timeLeft, taskSessionTimes]);

    /**
     * Complete a task - moves it to completed list and handles active task switching
     */
    const completeTask = useCallback((taskId, taskText) => {
        // Handle active task switching if completing the currently active task
        if (taskId === activeTaskId) {
            if (isRunning) {
                updateActiveTaskTime();
            }

            // Find next task to activate
            const currentTaskIndex = tasks.findIndex(t => t.id === taskId);
            let nextActiveTaskId = null;

            // Look for next non-default task after current
            for (let i = currentTaskIndex + 1; i < tasks.length; i++) {
                if (!tasks[i].isDefault) {
                    nextActiveTaskId = tasks[i].id;
                    break;
                }
            }

            // If no task found after, look before current
            if (!nextActiveTaskId) {
                for (let i = 0; i < currentTaskIndex; i++) {
                    if (!tasks[i].isDefault) {
                        nextActiveTaskId = tasks[i].id;
                        break;
                    }
                }
            }

            // If still no non-default task, use default task
            if (!nextActiveTaskId) {
                const defaultTask = tasks.find(t => t.isDefault);
                if (defaultTask) {
                    nextActiveTaskId = defaultTask.id;
                }
            }

            setActiveTaskId(nextActiveTaskId);
            if (isRunning && nextActiveTaskId) {
                setLastUpdateTime(Date.now());
            }
        }

        // Move task from active to completed
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setCompletedTasks(prev => [...prev, { id: taskId, text: taskText, timestamp: new Date() }]);
        saveCompletedTask(taskText);
    }, [saveCompletedTask, activeTaskId, isRunning, updateActiveTaskTime, tasks]);

    // ================================
    // HISTORY MANAGEMENT FUNCTIONS
    // ================================

    /**
     * Delete a session from time history
     */
    const deleteTimeSession = useCallback((sessionId) => {
        if (window.confirm('Are you sure you want to delete this session?')) {
            setTimeHistory(prev => prev.filter(session => session.id !== sessionId));
        }
    }, []);

    /**
     * Delete a task from task history
     */
    const deleteTask = useCallback((taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setTaskHistory(prev => prev.filter(task => task.id !== taskId));
        }
    }, []);

    /**
     * Delete a completed task from recent completions
     */
    const deleteCompletedTask = useCallback((taskId) => {
        if (window.confirm('Are you sure you want to delete this completed task?')) {
            setCompletedTasks(prev => prev.filter(task => task.id !== taskId));
        }
    }, []);

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    /**
     * Format seconds into MM:SS display format
     */
    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.abs(seconds) % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);
    /**
    * Group history items by time period
    */
    const groupHistoryByPeriod = useCallback((historyItems, periodType) => {
        const groups = {};

        historyItems.forEach(item => {
            const date = new Date(item.timestamp);
            let key, label;

            switch (periodType) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    label = date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                    break;
                case 'month':
                    key = date.toISOString().substring(0, 7);
                    label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    label = date.getFullYear().toString();
                    break;
                default:
                    key = date.toISOString().split('T')[0];
                    label = date.toLocaleDateString();
            }

            if (!groups[key]) {
                groups[key] = {
                    label,
                    items: [],
                    date: date
                };
            }
            groups[key].items.push(item);
        });

        // Sort groups by date (most recent first)
        return Object.entries(groups)
            .sort(([, a], [, b]) => new Date(b.date) - new Date(a.date))
            .map(([key, value]) => ({ key, ...value }));
    }, []);

    /**
     * Toggle expanded state for time period
     */
    const toggleTimePeriod = useCallback((periodKey) => {
        setExpandedTimePeriods(prev => {
            const newSet = new Set(prev);
            if (newSet.has(periodKey)) {
                newSet.delete(periodKey);
            } else {
                newSet.add(periodKey);
            }
            return newSet;
        });
    }, []);

    // ================================
    // ANALYTICS AND CALCULATIONS
    // ================================

    /**
     * Get recently completed tasks (last 24 hours)
     * Auto-filters and cleans up old completions
     */
    const recentCompletedTasks = useMemo(() => {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return completedTasks.filter(task => new Date(task.timestamp) > oneDayAgo);
    }, [completedTasks]);

    /**
     * Calculate total time spent today including current session
     * Combines historical data with real-time session tracking
     */
    const totalTimeToday = useMemo(() => {
        // Get base time from completed sessions today
        const baseTime = timeHistory
            .filter(entry => entry.timestamp.split('T')[0] === new Date().toISOString().split('T')[0])
            .reduce((total, entry) => total + (entry.totalMinutes || 0), 0);

        // Add current session time if timer is running or paused
        const currentSessionMinutes = Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0);

        return baseTime + currentSessionMinutes;
    }, [timeHistory, taskSessionTimes]);

    /**
     * Calculate total sessions completed today
     */
    const todaySessionCount = useMemo(() => {
        return timeHistory
            .filter(s => s.timestamp.split('T')[0] === new Date().toISOString().split('T')[0])
            .reduce((total, session) => total + (session.sessionCount || 0), 0);
    }, [timeHistory]);

    /**
     * Generate chart data for analytics based on view mode and data type
     * Supports week/month/year views for both time and task completion data
     */
    const getChartData = useCallback((type) => {
        const now = new Date();
        let data = [];
        let sourceData = type === 'time' ? timeHistory : taskHistory;

        if (viewMode === 'week') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const dayData = sourceData.filter(item =>
                    item.timestamp.split('T')[0] === dateStr
                );

                data.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    value: type === 'time'
                        ? Math.round((dayData.reduce((sum, item) => sum + (item.totalMinutes || item.duration || 0), 0) / 60) * 10) / 10
                        : dayData.length
                });
            }
        } else if (viewMode === 'month') {
            // Last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const dayData = sourceData.filter(item =>
                    item.timestamp.split('T')[0] === dateStr
                );

                data.push({
                    date: date.getDate().toString(),
                    value: type === 'time'
                        ? Math.round((dayData.reduce((sum, item) => sum + (item.totalMinutes || item.duration || 0), 0) / 60) * 10) / 10
                        : dayData.length
                });
            }
        } else if (viewMode === 'year') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                const monthStr = date.toISOString().substring(0, 7);

                const monthData = sourceData.filter(item =>
                    item.timestamp.substring(0, 7) === monthStr
                );

                data.push({
                    date: date.toLocaleDateString('en-US', { month: 'short' }),
                    value: type === 'time'
                        ? Math.round((monthData.reduce((sum, item) => sum + (item.totalMinutes || item.duration || 0), 0) / 60) * 10) / 10
                        : monthData.length
                });
            }
        }

        return data;
    }, [viewMode, timeHistory, taskHistory]);

    /**
     * Clear all user data
     * Complete reset of the application state
     */
    const clearAllData = useCallback(async () => {
        if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            // Reset all data to initial state
            setTimeHistory([]);
            setTaskHistory([]);
            setTasks([]);
            setCompletedTasks([]);
            setDailyGoal(480);
            setCurrentSessionStreak(0);
            setLongestSessionStreak(0);
            setLastSessionDate(null);

            // Reset streak data
            setCurrentSessionStreak(0);
            setLongestSessionStreak(0);
            setLastSessionDate(null);

            // Clear temporary session data
            setTempSessionCount(0);
            setTempCycleCount(0);
            setTempOverallStreak(0);

            // Clear task tracking
            setActiveTaskId(null);
            setTaskSessionTimes({});
            setLastUpdateTime(null);
            setTaskSessionNames({});
        }
    }, []);

    /**
 * Export data to JSON file
 */
    const exportData = useCallback(async () => {
        try {
            const data = {
                dailyGoal,
                tasks,
                completedTasks,
                timeHistory,
                taskHistory,
                currentSessionStreak,
                longestSessionStreak,
                lastSessionDate,
                exportDate: new Date().toISOString(),
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
    }, [dailyGoal, tasks, completedTasks, timeHistory, taskHistory, currentSessionStreak, longestSessionStreak, lastSessionDate]);

    /**
     * Import data from JSON file
     */
    const importData = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate the data structure
            if (!data.version || !data.exportDate) {
                throw new Error('Invalid file format');
            }

            if (window.confirm('This will replace all your current data. Are you sure you want to continue?')) {
                // Restore all data
                if (data.dailyGoal !== undefined) setDailyGoal(data.dailyGoal);
                if (data.tasks && Array.isArray(data.tasks)) setTasks(data.tasks);
                if (data.completedTasks && Array.isArray(data.completedTasks)) {
                    setCompletedTasks(data.completedTasks.map(task => ({
                        ...task,
                        timestamp: new Date(task.timestamp)
                    })));
                }
                if (data.timeHistory && Array.isArray(data.timeHistory)) setTimeHistory(data.timeHistory);
                if (data.taskHistory && Array.isArray(data.taskHistory)) setTaskHistory(data.taskHistory);
                if (data.currentSessionStreak !== undefined) setCurrentSessionStreak(data.currentSessionStreak);
                if (data.longestSessionStreak !== undefined) setLongestSessionStreak(data.longestSessionStreak);
                if (data.lastSessionDate) setLastSessionDate(data.lastSessionDate);

                console.log('✅ Data imported successfully');
                alert('Data imported successfully!');
            }

            // Reset the file input
            event.target.value = '';
        } catch (error) {
            console.error('❌ Error importing data:', error);
            alert('Failed to import data. Please check the file format.');
            event.target.value = '';
        }
    }, []);

    // ================================
    // LOADING STATE
    // ================================

    // Show loading screen while data is being loaded
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-white text-xl">Loading your data...</div>
            </div>
        );
    }

    // ================================
    // MAIN APPLICATION RENDER
    // ================================

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}>
            {/* Enhanced Acrylic Title Bar with Window Controls */}
            <div
                className="fixed top-0 left-0 right-0 z-50 h-8"
                style={{
                    background: 'rgba(31, 41, 55, 0.9)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 2px 20px rgba(0,0,0,0.5)'
                }}
            >
                {/* Draggable area */}
                <div
                    className="absolute inset-0 w-full h-full"
                    data-tauri-drag-region
                ></div>

                {/* Content on top of draggable area */}
                <div className="relative flex items-center justify-between h-full px-4 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={async () => {
                                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                                const window = getCurrentWindow();
                                window.close();
                            }}
                            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 shadow-md border border-red-400/50 transition-colors duration-200 pointer-events-auto"
                        ></button>
                        <button
                            onClick={async () => {
                                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                                const window = getCurrentWindow();
                                window.minimize();
                            }}
                            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 shadow-md border border-yellow-400/50 transition-colors duration-200 pointer-events-auto"
                        ></button>
                        <button
                            onClick={async () => {
                                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                                const window = getCurrentWindow();
                                const isMaximized = await window.isMaximized();
                                if (isMaximized) {
                                    window.unmaximize();
                                } else {
                                    window.maximize();
                                }
                            }}
                            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 shadow-md border border-green-400/50 transition-colors duration-200 pointer-events-auto"
                        ></button>
                        <span className="ml-3 text-white text-sm font-semibold drop-shadow-md pointer-events-none">🍅 Pomodoro Timer</span>
                    </div>
                </div>
            </div>

            {/* Main Content with solid background */}
            <div className="pt-8" style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', minHeight: '100vh' }}>
                <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                    {/* Instructions Modal */}
                    <InstructionsModalPortal
                        isOpen={showInstructions}
                        onClose={() => setShowInstructions(false)}
                    />

                    {/* ================================ */}
                    {/* TOP HEADER BAR */}
                    {/* ================================ */}

                    {/* Digital Clock - Top Left */}
                    <div className="absolute top-6 left-6 z-10">
                        <div
                            className="text-2xl font-mono font-bold text-white drop-shadow-2xl"
                            style={{
                                textShadow: '0 0 20px rgba(99, 102, 241, 0.8), 0 0 40px rgba(99, 102, 241, 0.6), 0 0 60px rgba(99, 102, 241, 0.4)'
                            }}
                        >
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    {/* Date Display - Top Right */}
                    <div className="absolute top-6 right-6 z-10">
                        <div className="text-right">
                            <div
                                className="text-3xl font-bold text-white mb-1 tracking-tight drop-shadow-2xl"
                                style={{
                                    textShadow: '0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.4)'
                                }}
                            >
                                {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </div>
                            <div
                                className="text-base font-light text-gray-300 drop-shadow-lg"
                                style={{
                                    textShadow: '0 0 15px rgba(156, 163, 175, 0.6), 0 0 30px rgba(156, 163, 175, 0.4)'
                                }}
                            >
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* ================================ */}
                    {/* MAIN CONTENT CONTAINER */}
                    {/* ================================ */}

                    <div className="w-full px-4 pt-4">

                        {/* ================================ */}
                        {/* NAVIGATION TABS */}
                        {/* ================================ */}

                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-800/40 backdrop-blur-md rounded-full p-1 border border-[#1a2331] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] transform hover:scale-105 hover:translate-y-[-2px] transition-all duration-500 ease-out">
                                <div className="flex">
                                    {/* Timer Tab */}
                                    <button
                                        onClick={() => setActiveTab('timer')}
                                        className={`px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm flex items-center gap-2 ${activeTab === 'timer'
                                            ? 'bg-indigo-500 text-white shadow-lg scale-105'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <Target className="w-4 h-4" />
                                        Timer
                                    </button>

                                    {/* Analytics Tab */}
                                    <button
                                        onClick={() => setActiveTab('analytics')}
                                        className={`px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm flex items-center gap-2 ${activeTab === 'analytics'
                                            ? 'bg-indigo-500 text-white shadow-lg scale-105'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Analytics
                                    </button>

                                    {/* History Tab */}
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm flex items-center gap-2 ${activeTab === 'history'
                                            ? 'bg-indigo-500 text-white shadow-lg scale-105'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <History className="w-4 h-4" />
                                        History
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ================================ */}
                        {/* TIMER TAB CONTENT */}
                        {/* ================================ */}

                        {activeTab === 'timer' && (
                            <div>
                                <div className="mb-8">

                                    {/* ================================ */}
                                    {/* PROGRESS BAR SECTION - MAINTENANT EN HAUT */}
                                    {/* ================================ */}

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
                                                        onClick={() => setDailyGoal(Math.max(60, dailyGoal - 60))}
                                                        className="w-4 h-4 rounded-full text-indigo-400 hover:text-white flex items-center justify-center transition text-xs"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-xs font-bold text-white">{Math.floor(dailyGoal / 60)}h</span>
                                                    <button
                                                        onClick={() => setDailyGoal(Math.min(1440, dailyGoal + 60))}
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
                                                        {Math.floor(totalTimeToday / 60)}h {Math.round(totalTimeToday % 60)}m
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

                                    <div className="bg-gradient-to-br from-[#1a2331] to-[#0e111a] rounded-2xl border border-[#1a2331] shadow-[inset_0_1px_3px_rgba(255,255,255,0.05),0_35px_60px_-15px_rgba(0,0,0,0.5)] p-1 mb-1 relative">

                                        {/* ================================ */}
                                        {/* ACTIVE TASK DISPLAY - TOP LEFT */}
                                        {/* ================================ */}

                                        <div className="absolute top-4 left-4 z-10 w-48">
                                            {activeTaskId && tasks.length > 0 && (
                                                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                                                    <div className="flex items-center gap-1 mb-4">
                                                        <Target className="w-3 h-3 text-blue-400/60" />
                                                        <span className="text-xs font-medium text-white/70">Active Task</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {(() => {
                                                            const activeTask = tasks.find(t => t.id === activeTaskId);
                                                            if (!activeTask) return null;

                                                            const sessionTime = taskSessionTimes[activeTask.id] || 0;
                                                            const accumulatedTime = activeTask.accumulatedTime || 0;
                                                            const totalTime = accumulatedTime + sessionTime;

                                                            return (
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <div className="w-1 h-1 bg-blue-400/60 rounded-full flex-shrink-0 animate-pulse"></div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-white/80 font-medium">
                                                                            {activeTask.text.length > 20 ? `${activeTask.text.substring(0, 20)}...` : activeTask.text}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                                                                            {accumulatedTime > 0 && (
                                                                                <span className="text-blue-400/50">
                                                                                    Prev: {Math.round(accumulatedTime)}m
                                                                                </span>
                                                                            )}
                                                                            {sessionTime > 0 && (
                                                                                <span className="text-green-400/60">
                                                                                    +{Math.round(sessionTime)}m
                                                                                </span>
                                                                            )}
                                                                            {totalTime > 0 && (
                                                                                <span className="text-purple-400/50">
                                                                                    Tot: {Math.round(totalTime)}m
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* ================================ */}
                                        {/* SESSION STATS - TOP RIGHT */}
                                        {/* ================================ */}

                                        <div className="absolute top-4 right-4 z-10 w-44">
                                            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-white/10">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Flame className="w-3 h-3 text-orange-400/60" />
                                                    <span className="text-xs font-medium text-white/70">Session</span>
                                                </div>

                                                {/* Session/Cycle Stats Grid */}
                                                <div className="grid grid-cols-2 gap-1 mb-1">
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-blue-400/80">{tempSessionCount}</div>
                                                        <div className="text-xs text-white/50">Sessions</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-green-400/80">{tempCycleCount}</div>
                                                        <div className="text-xs text-white/50">Cycles</div>
                                                    </div>
                                                </div>

                                                {/* Streak/Time Stats Grid */}
                                                <div className="grid grid-cols-2 gap-1 mb-1">
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-orange-400/80">{tempOverallStreak}</div>
                                                        <div className="text-xs text-white/50">Streak</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-purple-400/80">
                                                            {Math.round(Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0))}m
                                                        </div>
                                                        <div className="text-xs text-white/50">Total</div>
                                                    </div>
                                                </div>

                                                {/* Task Breakdown Display */}
                                                {Object.keys(taskSessionTimes).length > 0 && (
                                                    <div className="mt-1 pt-1 border-t border-white/10">
                                                        <div className="text-xs text-white/60 mb-1">Tasks:</div>
                                                        <div className="space-y-0.5">
                                                            {Object.entries(taskSessionTimes).map(([taskId, minutes]) => {
                                                                if (minutes === 0) return null;

                                                                const storedName = taskSessionNames[taskId];
                                                                const currentTask = tasks.find(t => t.id === parseInt(taskId));
                                                                const taskName = storedName || currentTask?.text || `Task ID: ${taskId}`;

                                                                const isActive = parseInt(taskId) === activeTaskId;
                                                                const isCompleted = !currentTask && storedName;

                                                                return (
                                                                    <div key={taskId} className="flex items-center justify-between text-xs">
                                                                        <span className={`truncate flex-1 ${isActive ? 'text-blue-300/80' :
                                                                            isCompleted ? 'text-green-300/80' : 'text-white/50'
                                                                            }`}>
                                                                            {isActive && '→ '}{taskName}
                                                                            {isCompleted && ' ✓'}
                                                                        </span>
                                                                        <span className={`font-medium ml-1 ${isActive ? 'text-blue-400/80' :
                                                                            isCompleted ? 'text-green-400/80' : 'text-white/60'
                                                                            }`}>
                                                                            {Math.round(minutes)}m
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Streak Indicator Dots */}
                                                <div className="flex items-center justify-center gap-1 mt-1">
                                                    {[...Array(Math.min(Math.floor(currentSessionStreak * 2), 4))].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-1 h-1 bg-orange-400/60 rounded-full animate-pulse"
                                                            style={{ animationDelay: `${i * 150}ms` }}
                                                        ></div>
                                                    ))}
                                                    {currentSessionStreak > 2 && (
                                                        <span className="text-xs text-orange-400/60 font-medium ml-1">
                                                            +{Math.floor((currentSessionStreak - 2) * 2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-white/40 text-center mt-1">
                                                    Stop = Save
                                                </div>
                                            </div>
                                        </div>

                                        {/* ================================ */}
                                        {/* TIMER MODE SELECTION */}
                                        {/* ================================ */}

                                        <div className="flex justify-center mb-8">
                                            <div className="flex gap-3 bg-gray-700/30 backdrop-blur-md p-3 rounded-full border border-gray-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.05)] transition-all duration-500">
                                                {[
                                                    { key: '25/5', label: '25' },
                                                    { key: '50/10', label: '50' },
                                                    { key: 'stopwatch', label: '∞' }
                                                ].map((m) => (
                                                    <button
                                                        key={m.key}
                                                        onClick={() => {
                                                            setMode(m.key);
                                                            setIsRunning(false);
                                                            setIsBreak(false);
                                                        }}
                                                        className={`w-10 h-10 rounded-full text-1xl font-bold transition-all duration-300 ease-out ${mode === m.key
                                                            ? 'bg-indigo-500 text-white shadow-[0_10px_25px_rgba(99,102,241,0.5)] scale-110 ring-2 ring-indigo-300'
                                                            : 'bg-gray-600/60 text-gray-200 hover:bg-gray-500/70 hover:scale-105 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                                                            }`}
                                                    >
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* ================================ */}
                                        {/* MAIN TIMER DISPLAY */}
                                        {/* ================================ */}

                                        <div className="flex justify-center">
                                            <div className="flex flex-col items-center">
                                                {/* Timer Circle */}
                                                <div className="relative mb-8">
                                                    <div className="absolute inset-0 w-96 h-96 rounded-full bg-indigo-500 blur-3xl opacity-25 scale-110"></div>
                                                    <div className="relative w-96 h-96 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-700 shadow-3xl flex items-center justify-center backdrop-blur-sm">
                                                        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"></div>

                                                        {/* Progress Ring */}
                                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 384 384">
                                                            <circle cx="192" cy="192" r="168" fill="none" stroke="#374151" strokeWidth="12" className="opacity-30" />
                                                            <circle
                                                                cx="192" cy="192" r="168" fill="none" stroke="url(#gradient)" strokeWidth="12" strokeLinecap="round"
                                                                strokeDasharray={`${2 * Math.PI * 168}`}
                                                                strokeDashoffset={mode === 'stopwatch' ? 0 : 2 * Math.PI * 168 * (1 - (sessionElapsedTime / (mode === '25/5' ? (isBreak ? 5 * 60 : 25 * 60) : (isBreak ? 10 * 60 : 50 * 60))))}
                                                                className="transition-all duration-1000 ease-out drop-shadow-lg"
                                                                style={{ filter: 'drop-shadow(0 0 12px #818cf8)' }}
                                                            />
                                                            <defs>
                                                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#6366f1" />
                                                                    <stop offset="100%" stopColor="#a855f7" />
                                                                </linearGradient>
                                                            </defs>
                                                        </svg>

                                                        {/* Timer Display  */}
                                                        <div className="relative z-10 text-center">
                                                            <div className="text-8xl font-mono font-bold text-white mb-3 leading-none tracking-tight drop-shadow-2xl">
                                                                {formatTime(timeLeft)}
                                                            </div>
                                                            {isRunning && (
                                                                <div className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold ${isBreak
                                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                                                    } backdrop-blur-sm`}>
                                                                    <span className="text-base">{isBreak ? '☕' : '🎯'}</span>
                                                                    {isBreak ? 'Break Time' : 'Focus Time'}
                                                                </div>
                                                            )}

                                                            {/* Test Mode Indicator */}
                                                            {testMode && (
                                                                <div className="absolute -top-2 -right-2 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full shadow-lg animate-pulse">
                                                                    ++
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ================================ */}
                                                {/* TIMER CONTROLS */}
                                                {/* ================================ */}

                                                <div className="flex gap-4 w-full max-w-md">
                                                    <button
                                                        onClick={startTimer}
                                                        disabled={isRunning}
                                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-500 text-white rounded-2xl font-bold text-base hover:bg-green-600 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-[0_10px_30px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95"
                                                    >
                                                        <Play className="w-3 h-3" />
                                                        Start
                                                    </button>
                                                    <button
                                                        onClick={pauseTimer}
                                                        disabled={!isRunning}
                                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-yellow-500 text-white rounded-2xl font-bold text-base hover:bg-yellow-600 hover:shadow-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-[0_10px_30px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95"
                                                    >
                                                        <Pause className="w-3 h-3" />
                                                        Pause
                                                    </button>
                                                    <button
                                                        onClick={stopTimer}
                                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-500 text-white rounded-2xl font-bold text-base hover:bg-red-600 hover:shadow-red-500/40 transition-all duration-300 ease-out shadow-[0_10px_30px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95"
                                                    >
                                                        <Square className="w-3 h-3" />
                                                        Stop
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ================================ */}
                                        {/* DEVELOPER MODE TOGGLE */}
                                        {/* ================================ */}

                                        <div className="mt-2 text-center">
                                            <div
                                                className="inline-block cursor-pointer select-none"
                                                onClick={() => {
                                                    setDevClickCount(prev => {
                                                        const newCount = prev + 1;
                                                        if (newCount >= 5) {
                                                            setTestMode(!testMode);
                                                            return 0;
                                                        }
                                                        return newCount;
                                                    });
                                                }}
                                            >
                                                <span className="text-gray-500 text-xs hover:text-gray-400 transition-colors">
                                                    v1.0
                                                </span>
                                            </div>
                                            {testMode && (
                                                <div className="mt-2 px-3 py-1 bg-orange-900/30 rounded-full border border-orange-500/30">
                                                    <span className="text-xs text-orange-300 font-medium">
                                                        ⚡ Developer Mode Active
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ================================ */}
                                    {/* TASK INPUT SECTION */}
                                    {/* ================================ */}

                                    <div className="max-w-2xl mx-auto">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>

                                            <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)] p-6 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-500">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center backdrop-blur-sm">
                                                        <Target className="w-5 h-5 text-indigo-400" />
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-white/90 tracking-tight">Set Your Focus</h3>
                                                </div>

                                                <div className="space-y-6">
                                                    {/* Task Input Field */}
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={currentTask}
                                                            onChange={(e) => setCurrentTask(e.target.value)}
                                                            placeholder="What are you working on?"
                                                            className="w-full px-5 py-4 text-white/90 placeholder-white/40 bg-gray-700/30 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-lg transition-all duration-300 hover:bg-gray-700/40 focus:bg-gray-700/50"
                                                            onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                                        />
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={addTask}
                                                            className="flex-1 group relative overflow-hidden px-5 py-3 bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 ease-out shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                            <div className="relative flex items-center justify-center gap-2 font-semibold">
                                                                <Plus className="w-5 h-5" />
                                                                Add to Task List
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ================================ */}
                                    {/* TASK MANAGEMENT SECTION */}
                                    {/* ================================ */}

                                    <div className="mt-8">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                            {/* ================================ */}
                                            {/* ACTIVE TASKS PANEL */}
                                            {/* ================================ */}

                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl"></div>

                                                <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)] p-6 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-500">

                                                    {/* Panel Header */}
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
                                                            <Check className="w-5 h-5 text-blue-400" />
                                                        </div>
                                                        <h3 className="text-xl font-semibold text-white/90 tracking-tight">Ongoing tasks</h3>
                                                        <div className="ml-auto px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                                                            <span className="text-sm font-medium text-blue-400">{tasks.length - 1}</span>
                                                        </div>
                                                    </div>

                                                    {/* Task List */}
                                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                                        {tasks.length === 0 ? (
                                                            /* Empty State */
                                                            <div className="text-center py-8 px-4 rounded-xl bg-gray-700/20 border border-dashed border-white/10">
                                                                <Target className="w-8 h-8 mx-auto mb-3 text-white/30" />
                                                                <p className="text-white/40 text-sm">No active tasks</p>
                                                                <p className="text-white/30 text-xs mt-1">Add a task above to get started</p>
                                                            </div>
                                                        ) : (
                                                            /* Task Items */
                                                            tasks.map((task) => (
                                                                <TaskItem
                                                                    key={task.id}
                                                                    task={task}
                                                                    onComplete={completeTask}
                                                                    onDelete={(id) => {
                                                                        // Prevent deletion of default tasks
                                                                        const taskToDelete = tasks.find(t => t.id === id);
                                                                        if (taskToDelete?.isDefault) {
                                                                            return;
                                                                        }

                                                                        // Handle active task switching if deleting current active task
                                                                        if (id === activeTaskId && isRunning) {
                                                                            const currentTaskIndex = tasks.findIndex(t => t.id === id);
                                                                            let nextActiveTaskId = null;

                                                                            // Find next non-default task
                                                                            for (let i = currentTaskIndex + 1; i < tasks.length; i++) {
                                                                                if (!tasks[i].isDefault) {
                                                                                    nextActiveTaskId = tasks[i].id;
                                                                                    break;
                                                                                }
                                                                            }

                                                                            // If no task found after, look before current
                                                                            if (!nextActiveTaskId) {
                                                                                for (let i = 0; i < currentTaskIndex; i++) {
                                                                                    if (!tasks[i].isDefault) {
                                                                                        nextActiveTaskId = tasks[i].id;
                                                                                        break;
                                                                                    }
                                                                                }
                                                                            }

                                                                            // If still no non-default task, use default task
                                                                            if (!nextActiveTaskId) {
                                                                                const defaultTask = tasks.find(t => t.isDefault);
                                                                                if (defaultTask) {
                                                                                    nextActiveTaskId = defaultTask.id;
                                                                                }
                                                                            }

                                                                            updateActiveTaskTime();
                                                                            setActiveTaskId(nextActiveTaskId);
                                                                            if (nextActiveTaskId) {
                                                                                setLastUpdateTime(Date.now());
                                                                            }
                                                                        }

                                                                        setTasks(prev => prev.filter(t => t.id !== id));
                                                                    }}
                                                                    isActive={true}
                                                                    activeTaskId={activeTaskId}
                                                                    onSetActive={setActiveTask}
                                                                    canChangeActive={isRunning}
                                                                    taskTimes={taskSessionTimes}
                                                                />
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ================================ */}
                                            {/* RECENTLY COMPLETED PANEL */}
                                            {/* ================================ */}

                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>

                                                <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)] p-6 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-500">

                                                    {/* Panel Header */}
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                                                            <Check className="w-5 h-5 text-emerald-400" />
                                                        </div>
                                                        <h3 className="text-xl font-semibold text-white/90 tracking-tight">Recently Completed</h3>
                                                        <div className="ml-auto px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                                            <span className="text-sm font-medium text-emerald-400">{recentCompletedTasks.length}</span>
                                                        </div>
                                                    </div>

                                                    {/* Completed Task List */}
                                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                                        {recentCompletedTasks.length === 0 ? (
                                                            /* Empty State */
                                                            <div className="text-center py-8 px-4 rounded-xl bg-gray-700/20 border border-dashed border-white/10">
                                                                <Check className="w-8 h-8 mx-auto mb-3 text-white/30" />
                                                                <p className="text-white/40 text-sm">No completed tasks yet</p>
                                                                <p className="text-white/30 text-xs mt-1">Complete tasks to see them here</p>
                                                            </div>
                                                        ) : (
                                                            /* Completed Task Items - Show last 3 in reverse order */
                                                            recentCompletedTasks.slice(-3).reverse().map((task) => (
                                                                <TaskItem
                                                                    key={task.id}
                                                                    task={task}
                                                                    onComplete={() => { }}
                                                                    onDelete={deleteCompletedTask}
                                                                    isActive={false}
                                                                />
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================================ */}
                        {/* ANALYTICS TAB CONTENT */}
                        {/* ================================ */}

                        {activeTab === 'analytics' && (
                            <div className="bg-gray-800 rounded-xl shadow-xl p-8">

                                {/* Analytics Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">Analytics</h2>
                                    <button
                                        onClick={() => setShowInstructions(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        How to Share Data
                                    </button>
                                </div>

                                {/* View Mode Selector */}
                                <div className="flex justify-center mb-8">
                                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-gray-700/50">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setViewMode('week')}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'week'
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <Calendar className="w-4 h-4" />
                                                Week
                                            </button>
                                            <button
                                                onClick={() => setViewMode('month')}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'month'
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <CalendarDays className="w-4 h-4" />
                                                Month
                                            </button>
                                            <button
                                                onClick={() => setViewMode('year')}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'year'
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <CalendarRange className="w-4 h-4" />
                                                Year
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Grid */}
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
                                                            <stop offset="0%" stopColor="#6366f1" />
                                                            <stop offset="100%" stopColor="#3b82f6" />
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
                                                            <stop offset="0%" stopColor="#10b981" />
                                                            <stop offset="100%" stopColor="#059669" />
                                                        </linearGradient>
                                                    </defs>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                                    <div className="bg-indigo-900/30 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-indigo-300">
                                            {timeHistory.reduce((sum, session) => sum + (session.totalMinutes || 0), 0)}
                                        </div>
                                        <div className="text-sm text-blue-400">Total Minutes</div>
                                    </div>
                                    <div className="bg-green-900/30 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-300">
                                            {taskHistory.length}
                                        </div>
                                        <div className="text-sm text-green-400">Tasks Completed</div>
                                    </div>
                                    <div className="bg-purple-900/30 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-purple-300">
                                            {timeHistory.reduce((sum, session) => sum + (session.sessionCount || 0), 0)}
                                        </div>
                                        <div className="text-sm text-purple-400">Total Sessions</div>
                                    </div>
                                    <div className="bg-orange-900/30 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-orange-300">
                                            {timeHistory.reduce((sum, session) => sum + (session.cycleCount || 0), 0)}
                                        </div>
                                        <div className="text-sm text-orange-400">Total Cycles</div>
                                    </div>
                                    <div className="bg-red-900/30 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-red-300 flex items-center justify-center gap-2">
                                            <Flame className="w-6 h-6" />
                                            {longestSessionStreak}
                                        </div>
                                        <div className="text-sm text-red-400">Best Streak</div>
                                    </div>
                                </div>

                                {/* Data Management Section */}
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
                                                    onChange={importData}
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                onClick={exportData}
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

                                    {/* ADD THIS NEW SECTION - Individual Clear Options */}
                                    <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                                        <h4 className="text-md font-medium text-gray-200 mb-3">Clear Specific Data</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Clear all work sessions? This will also reset your streak data.')) {
                                                        setTimeHistory([]);
                                                        setCurrentSessionStreak(0);
                                                        setLongestSessionStreak(0);
                                                        setLastSessionDate(null);
                                                    }
                                                }}
                                                className="px-3 py-2 bg-red-500/80 text-white rounded-md hover:bg-red-500 transition-all duration-200 text-sm"
                                            >
                                                Clear Work Sessions
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Clear all completed tasks?')) {
                                                        setTaskHistory([]);
                                                    }
                                                }}
                                                className="px-3 py-2 bg-red-500/80 text-white rounded-md hover:bg-red-500 transition-all duration-200 text-sm"
                                            >
                                                Clear Completed Tasks
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Reset streak data only? (keeps your session history)')) {
                                                        setCurrentSessionStreak(0);
                                                        setLongestSessionStreak(0);
                                                        setLastSessionDate(null);
                                                    }
                                                }}
                                                className="px-3 py-2 bg-orange-500/80 text-white rounded-md hover:bg-orange-500 transition-all duration-200 text-sm"
                                            >
                                                Reset Streaks Only
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Note: Clearing work sessions will reset streak data since streaks are calculated from session history.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================================ */}
                        {/* HISTORY TAB CONTENT */}
                        {/* ================================ */}

                        {activeTab === 'history' && (
                            <div>
                                {/* Attribution */}
                                <div className="text-1xl font-bold text-white">
                                    <a href="https://www.flaticon.com/free-icons/stopwatch" title="stopwatch icons">
                                        Stopwatch icons created by alfanz - Flaticon
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

                                        {/* Sound Test Buttons Only */}
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
                                    </div>
                                </div>

                                {/* Time Period Selector */}
                                <div className="flex justify-center mb-8">
                                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-gray-700/50">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setHistoryViewMode('day')}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${historyViewMode === 'day'
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <Calendar className="w-4 h-4" />
                                                Day
                                            </button>
                                            <button
                                                onClick={() => setHistoryViewMode('week')}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${historyViewMode === 'week'
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <Calendar className="w-4 h-4" />
                                                Week
                                            </button>
                                            <button
                                                onClick={() => setHistoryViewMode('month')}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${historyViewMode === 'month'
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <CalendarDays className="w-4 h-4" />
                                                Month
                                            </button>
                                            <button
                                                onClick={() => setHistoryViewMode('year')}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${historyViewMode === 'year'
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <CalendarRange className="w-4 h-4" />
                                                Year
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* History Content */}
                                {timeHistory.length === 0 && taskHistory.length === 0 ? (
                                    /* Empty State */
                                    <div className="text-center py-12 text-gray-400">
                                        <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>No history yet. Complete some sessions to see your progress!</p>
                                    </div>
                                ) : (
                                    /* History Grid */
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                        {/* Work Sessions History */}
                                        <div className="bg-gray-800 rounded-xl shadow-xl p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xl font-semibold text-white">Work Sessions ({timeHistory.length})</h3>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete all work sessions? This will also reset your streak data and cannot be undone.')) {
                                                            setTimeHistory([]);
                                                            // Reset streak data when clearing work sessions
                                                            setCurrentSessionStreak(0);
                                                            setLongestSessionStreak(0);
                                                            setLastSessionDate(null);
                                                        }
                                                    }}
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
                                                        {groupHistoryByPeriod(timeHistory, historyViewMode).map((period) => (
                                                            <div key={period.key} className="border border-gray-700 rounded-lg overflow-hidden">
                                                                {/* Period Header */}
                                                                <button
                                                                    onClick={() => toggleTimePeriod(`sessions-${period.key}`)}
                                                                    className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 transition-all duration-200"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`transform transition-transform duration-200 ${expandedTimePeriods.has(`sessions-${period.key}`) ? 'rotate-90' : ''
                                                                            }`}>
                                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                            </svg>
                                                                        </div>
                                                                        <span className="font-medium text-white">{period.label}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-sm text-gray-400">
                                                                            {period.items.length} session{period.items.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                        <span className="text-sm text-indigo-400 font-medium">
                                                                            {Math.round(period.items.reduce((sum, item) => sum + (item.totalMinutes || 0), 0))} min
                                                                        </span>
                                                                    </div>
                                                                </button>

                                                                {/* Period Content */}
                                                                {expandedTimePeriods.has(`sessions-${period.key}`) && (
                                                                    <div className="p-3 bg-gray-800/50 space-y-2">
                                                                        {period.items.map((session) => (
                                                                            <SessionHistoryItem
                                                                                key={session.id}
                                                                                session={session}
                                                                                onDelete={deleteTimeSession}
                                                                                isExpanded={expandedSessions.has(session.id)}
                                                                                onToggle={() => {
                                                                                    const newExpanded = new Set(expandedSessions);
                                                                                    if (newExpanded.has(session.id)) {
                                                                                        newExpanded.delete(session.id);
                                                                                    } else {
                                                                                        newExpanded.add(session.id);
                                                                                    }
                                                                                    setExpandedSessions(newExpanded);
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Completed Tasks History */}
                                        <div className="bg-gray-800 rounded-xl shadow-xl p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xl font-semibold text-white">Completed Tasks ({taskHistory.length})</h3>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
                                                            setTaskHistory([]);
                                                        }
                                                    }}
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
                                                        {groupHistoryByPeriod(taskHistory, historyViewMode).map((period) => (
                                                            <div key={period.key} className="border border-gray-700 rounded-lg overflow-hidden">
                                                                {/* Period Header */}
                                                                <button
                                                                    onClick={() => toggleTimePeriod(`tasks-${period.key}`)}
                                                                    className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 transition-all duration-200"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`transform transition-transform duration-200 ${expandedTimePeriods.has(`tasks-${period.key}`) ? 'rotate-90' : ''
                                                                            }`}>
                                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                            </svg>
                                                                        </div>
                                                                        <span className="font-medium text-white">{period.label}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-sm text-gray-400">
                                                                            {period.items.length} task{period.items.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                        <span className="text-sm text-emerald-400 font-medium">
                                                                            {Math.round(period.items.reduce((sum, item) => sum + (item.duration || 0), 0))} min
                                                                        </span>
                                                                    </div>
                                                                </button>

                                                                {/* Period Content */}
                                                                {expandedTimePeriods.has(`tasks-${period.key}`) && (
                                                                    <div className="p-3 bg-gray-800/50 space-y-2">
                                                                        {period.items.map((task) => (
                                                                            <TaskHistoryItem
                                                                                key={task.id}
                                                                                task={task}
                                                                                onDelete={deleteTask}
                                                                                isExpanded={expandedTasks.has(task.id)}
                                                                                onToggle={() => {
                                                                                    const newExpanded = new Set(expandedTasks);
                                                                                    if (newExpanded.has(task.id)) {
                                                                                        newExpanded.delete(task.id);
                                                                                    } else {
                                                                                        newExpanded.add(task.id);
                                                                                    }
                                                                                    setExpandedTasks(newExpanded);
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div >
                );
            </div>
        </div>
    );
};



// ================================
// EXPORT COMPONENT
// ================================

export default PomodoroApp;