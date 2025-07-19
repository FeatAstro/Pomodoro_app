// ================================
// FIXED PART 5: TIMER DISPLAY AND CONTROLS COMPONENTS
// ================================

import React, { useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Square, Target, Zap, Flame, Clock } from 'lucide-react';
import { usePomodoroContext } from './part1-context.jsx';
import { TIMER_MODES } from './part1-context.jsx';
import { useTimer, useSound, useTaskTimer } from './part2-hooks.jsx';
import { formatTime, formatMinutesToHourMin } from './part3-utilities.jsx';

// ================================
// ACTIVE TASK DISPLAY COMPONENT
// ================================

export const ActiveTaskDisplay = () => {
    const { state } = usePomodoroContext();
    const { activeTaskId, tasks, taskSessionTimes } = state;

    if (!activeTaskId || tasks.length === 0) return null;

    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return null;

    const sessionTime = taskSessionTimes[activeTask.id] || 0;
    const accumulatedTime = activeTask.accumulatedTime || 0;
    const totalTime = accumulatedTime + sessionTime;

    return (
        <div className="absolute top-4 left-4 z-10 w-68">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-1 mb-4">
                    <Target className="w-3 h-3 text-blue-400/60" />
                    <span className="text-xs font-medium text-white/70">Active Task</span>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-1 h-1 bg-blue-400/60 rounded-full flex-shrink-0 animate-pulse"></div>
                        <div className="flex-1 min-w-0">
                            <div className="text-white/80 font-medium">
                                {activeTask.text.length > 20 ? `${activeTask.text.substring(0, 20)}...` : activeTask.text}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                                {accumulatedTime > 0 && (
                                    <span className="text-blue-400/50">
                                        Prev: {formatMinutesToHourMin(accumulatedTime)}
                                    </span>
                                )}
                                {sessionTime > 0 && (
                                    <span className="text-green-400/60">
                                        +{formatMinutesToHourMin(sessionTime)}
                                    </span>
                                )}
                                {totalTime > 0 && (
                                    <span className="text-purple-400/50">
                                        Tot: {formatMinutesToHourMin(totalTime)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ================================
// SESSION STATS DISPLAY COMPONENT
// ================================

export const SessionStatsDisplay = () => {
    const { state } = usePomodoroContext();
    const {
        tempSessionCount,
        sessionStreak,
        dailyStreak,
        taskSessionTimes,
        taskSessionNames,
        tasks,
        activeTaskId,
        mode
    } = state;

    return (
        <div className="absolute top-4 right-4 z-10 w-44">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-white/10">
                <div className="flex items-center gap-1 mb-1">
                    <Flame className="w-3 h-3 text-orange-400/60" />
                    <span className="text-xs font-medium text-white/70">Session</span>
                </div>

                {/* Session/Streak Stats Grid */}
                <div className="grid grid-cols-2 gap-1 mb-1">
                    <div className="text-center">
                        <div className="text-xs font-bold text-blue-400/80">{tempSessionCount}</div>
                        <div className="text-xs text-white/50">Sessions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-yellow-400/80 flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3" />
                            {mode === TIMER_MODES.STOPWATCH ? '—' : Math.round(sessionStreak * 10) / 10}
                        </div>
                        <div className="text-xs text-white/50">Session</div>
                    </div>
                </div>

                {/* Streak/Time Stats Grid */}
                <div className="grid grid-cols-2 gap-1 mb-1">
                    <div className="text-center">
                        <div className="text-xs font-bold text-orange-400/80 flex items-center justify-center gap-1">
                            🔥
                            {Math.round(dailyStreak * 10) / 10}
                        </div>
                        <div className="text-xs text-white/50">Daily</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-purple-400/80">
                            {formatMinutesToHourMin(Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0))}
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
                                            {formatMinutesToHourMin(minutes)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Streak Indicator Dots */}
                <div className="flex items-center justify-center gap-1 mt-1">
                    {[...Array(Math.min(Math.floor(sessionStreak), 4))].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 h-1 bg-orange-400/60 rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 150}ms` }}
                        ></div>
                    ))}
                    {sessionStreak > 4 && (
                        <span className="text-xs text-orange-400/60 font-medium ml-1">
                            +{Math.floor((sessionStreak - 4) * 2)}
                        </span>
                    )}
                </div>
                <div className="text-xs text-white/40 text-center mt-1">
                    Stop = Save
                </div>
            </div>
        </div>
    );
};

// ================================
// TIMER MODE SELECTOR COMPONENT
// ================================

export const TimerModeSelector = () => {
    const { state, actions } = usePomodoroContext();
    const { mode } = state;

    const modes = useMemo(() => [
        { key: TIMER_MODES.POMODORO_25, label: '25' },
        { key: TIMER_MODES.POMODORO_50, label: '50' },
        { key: TIMER_MODES.STOPWATCH, label: '∞' }
    ], []);

    const handleModeChange = useCallback((newMode) => {
        actions.setMode(newMode);
        actions.setIsRunning(false);
        actions.setIsBreak(false);
    }, [actions]);

    return (
        <div className="flex justify-center mb-8">
            <div className="flex gap-3 bg-gray-700/30 backdrop-blur-md p-3 rounded-full border border-gray-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.05)] transition-all duration-500">
                {modes.map((m) => (
                    <button
                        key={m.key}
                        onClick={() => handleModeChange(m.key)}
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
    );
};

// ================================
// TIMER DISPLAY COMPONENT
// ================================

export const TimerDisplay = () => {
    const { state } = usePomodoroContext();
    const { timeLeft, isRunning, isBreak, mode, sessionElapsedTime, testMode } = state;

    return (
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
                                strokeDashoffset={mode === TIMER_MODES.STOPWATCH ? 0 : 2 * Math.PI * 168 * (1 - (sessionElapsedTime / (mode === TIMER_MODES.POMODORO_25 ? (isBreak ? 5 * 60 : 25 * 60) : (isBreak ? 10 * 60 : 50 * 60))))}
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
            </div>
        </div>
    );
};

// ================================
// TIMER CONTROLS COMPONENT 
// ================================

export const TimerControls = () => {
    const { state, actions } = usePomodoroContext();
    const {
        isRunning,
        sessionStartTime,
        activeTaskId,
        tasks,
        mode,
        isBreak,
        tempSessionCount,
        taskSessionTimes,
        taskSessionNames,
        dailyStreak,
        sessionStreak
    } = state;

    const { updateActiveTaskTime, saveSessionToAccumulated } = useTaskTimer();
    const { playFinishSound, playSessionStartSound } = useSound();

    // Memoize the timer event handlers to prevent infinite loops
    const handleTimeWarning = useCallback((timeLeft) => {
        // Time warning logic would go here if needed
    }, []);

    const handleTimerComplete = useCallback(() => {
        if (!isBreak) {
            // Work session completed
            playFinishSound();

            // Only update session-related counters for timed modes (not stopwatch)
            if (mode !== TIMER_MODES.STOPWATCH) {
                // Calculate session value for streaks (25min = 0.5, 50min = 1.0)
                const sessionValue = mode === TIMER_MODES.POMODORO_25 ? 0.5 : 1.0;

                // Update session count
                actions.incrementTempSessionCount();

                // FIXED: Use functional updates to get current values
                actions.setSessionStreak(prevStreak => {
                    const newSessionStreak = prevStreak + sessionValue;
                    console.log('Session streak updated:', prevStreak, '->', newSessionStreak);
                    return newSessionStreak;
                });

                actions.setDailyStreak(prevStreak => {
                    const newDailyStreak = prevStreak + sessionValue;
                    console.log('Daily streak updated:', prevStreak, '->', newDailyStreak);
                    return newDailyStreak;
                });

                console.log('Session completed - session value:', sessionValue);
            } else {
                // For stopwatch mode, only count the session without affecting streaks
                actions.incrementTempSessionCount();
            }

            // Transition to break
            actions.setIsBreak(true);
        } else {
            // Break completed - return to work
            playSessionStartSound();
            actions.setIsBreak(false);
        }
    }, [
        isBreak,
        mode,
        playFinishSound,
        playSessionStartSound,
        actions
        // REMOVED: sessionStreak and dailyStreak from dependencies since we're using functional updates
    ]);

    // Initialize timer hook with memoized handlers
    useTimer(handleTimerComplete, handleTimeWarning);

    /**
     * Start the timer - handles initial setup and task creation
     */
    const startTimer = useCallback(() => {
        actions.setIsRunning(true);
        actions.setLastUpdateTime(Date.now());

        // Record session start time if this is a new session
        if (!sessionStartTime) {
            actions.setSessionStartTime(new Date());
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
            actions.updateTasks([defaultTask]);
            actions.setActiveTaskId(defaultTask.id);
        }
        // Auto-select first task if none is selected and tasks exist
        else if (!activeTaskId && tasks.length > 0) {
            actions.setActiveTaskId(tasks[0].id);
        }
    }, [sessionStartTime, activeTaskId, tasks, actions]);

    /**
     * Pause the timer - preserves all current state
     */
    const pauseTimer = useCallback(() => {
        // Update active task time before pausing
        updateActiveTaskTime();
        actions.setIsRunning(false);
        actions.setLastUpdateTime(null);
    }, [updateActiveTaskTime, actions]);

    /**
 * Stop the timer - saves session to history and resets state
 * FIXED: Proper handling of active task time saving
 */
    const stopTimer = useCallback(() => {
        // Final update of active task time
        if (isRunning) {
            updateActiveTaskTime();
        }

        console.log('About to save session to accumulated');
        console.log('taskSessionTimes before save:', taskSessionTimes);

        // Calculate total session time BEFORE any resets
        const totalSessionMinutes = Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0);

        // FIXED: Update task accumulated times BEFORE calling saveSessionToAccumulated
        let updatedTasks = tasks;
        if (Object.keys(taskSessionTimes).length > 0) {
            updatedTasks = tasks.map(task => {
                const sessionTime = taskSessionTimes[task.id] || 0;
                if (sessionTime > 0) {
                    const newAccumulatedTime = (task.accumulatedTime || 0) + sessionTime;
                    console.log(`Updating task ${task.id} (${task.text}) accumulated time from ${task.accumulatedTime || 0} to ${newAccumulatedTime}`);
                    return {
                        ...task,
                        accumulatedTime: newAccumulatedTime
                    };
                }
                return task;
            });

            // Update tasks immediately
            actions.updateTasks(updatedTasks);
            console.log('Updated tasks with accumulated time:', updatedTasks);
        }

        // Now save session to accumulated (this will reset taskSessionTimes)
        saveSessionToAccumulated();

        console.log('After saveSessionToAccumulated call');

        actions.setIsRunning(false);

        if (mode === TIMER_MODES.STOPWATCH) {
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
                    sessionCount: tempSessionCount,
                    sessionStreak: 0, // No streak for stopwatch
                    dailyStreak: dailyStreak, // Use original daily streak (no contribution from stopwatch)
                    timestamp: new Date().toISOString(),
                    sessionType: mode,
                    taskBreakdown: taskBreakdownWithNames
                };

                actions.addTimeHistory(newSession);
            }
        } else {
            // Pomodoro modes - save if there were any sessions, cycles, or time
            if (tempSessionCount > 0 || totalSessionMinutes > 0) {
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
                    sessionStreak: sessionStreak, // Current session streak at time of stop
                    dailyStreak: dailyStreak, // Use the updated daily streak
                    timestamp: new Date().toISOString(),
                    sessionType: mode,
                    taskBreakdown: taskBreakdownWithNames
                };

                actions.addTimeHistory(newSession);
            }
        }

        // Reset accumulated time for default tasks after saving to history
        const resetTasks = updatedTasks.map(task => {
            if (task.isDefault) {
                return { ...task, accumulatedTime: 0 };
            }
            return task;
        });

        // Ensure default task always exists and stays at the bottom
        const nonDefaultTasks = resetTasks.filter(task => !task.isDefault);
        const defaultTask = resetTasks.find(task => task.isDefault);

        let finalTasks;
        if (defaultTask) {
            finalTasks = [...nonDefaultTasks, { ...defaultTask, accumulatedTime: 0 }];
        } else {
            // Create new default task if none exists
            const newDefaultTask = {
                id: Date.now() + Math.random(),
                text: 'Focus Session',
                completed: false,
                accumulatedTime: 0,
                isDefault: true
            };
            finalTasks = [...nonDefaultTasks, newDefaultTask];
        }

        actions.updateTasks(finalTasks);

        // Reset all session state
        actions.resetSessionState();
    }, [
        isRunning,
        updateActiveTaskTime,
        saveSessionToAccumulated,
        taskSessionTimes,
        tasks,
        mode,
        tempSessionCount,
        activeTaskId,
        taskSessionNames,
        dailyStreak,
        sessionStreak,
        actions
    ]);

    return (
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
    );
};

// ================================
// DEVELOPER MODE TOGGLE COMPONENT
// ================================

export const DeveloperModeToggle = () => {
    const { state, actions } = usePomodoroContext();
    const { testMode, devClickCount } = state;

    const handleVersionClick = useCallback(() => {
        const newCount = devClickCount + 1;
        actions.incrementDevClickCount();

        if (newCount >= 5) {
            actions.setTestMode(!testMode);
            actions.resetDevClickCount();
        }
    }, [devClickCount, testMode, actions]);

    return (
        <div className="mt-2 text-center">
            <div
                className="inline-block cursor-pointer select-none"
                onClick={handleVersionClick}
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
    );
};