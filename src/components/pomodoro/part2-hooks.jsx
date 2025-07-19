// ================================
// UPDATED PART 2: HOOKS FOR TAURI V2
// ================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePomodoroContext } from './part1-context.jsx';
import { TIMER_MODES, ACTION_TYPES } from './part1-context.jsx';
import { formatMinutesToHourMin } from './part3-utilities.jsx';

// ================================
// TIMER HOOK (No changes needed)
// ================================

export const useTimer = (onTimerComplete, onTimeWarning) => {
    const { state, actions } = usePomodoroContext();
    const { mode, isBreak, isRunning, timeLeft, testMode } = state;
    const intervalRef = useRef(null);

    // Initialize timer based on mode and break state
    useEffect(() => {
        if (mode === TIMER_MODES.POMODORO_25) {
            actions.setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
        } else if (mode === TIMER_MODES.POMODORO_50) {
            actions.setTimeLeft(isBreak ? 10 * 60 : 50 * 60);
        } else if (mode === TIMER_MODES.STOPWATCH) {
            actions.setTimeLeft(0);
        }
        actions.setSessionElapsedTime(0);
    }, [mode, isBreak, actions]);

    // FIXED: Main timer interval logic
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                if (mode === TIMER_MODES.STOPWATCH) {
                    // Stopwatch counts up - use functional update
                    actions.setTimeLeft(prev => {
                        const newTime = prev + 1;
                        actions.setSessionElapsedTime(newTime);
                        return newTime;
                    });
                } else {
                    // Pomodoro counts down - use functional update
                    actions.setTimeLeft(prev => {
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
                        const totalTime = mode === TIMER_MODES.POMODORO_25 ? (isBreak ? 5 * 60 : 25 * 60) : (isBreak ? 10 * 60 : 50 * 60);
                        actions.setSessionElapsedTime(totalTime - newTime);
                        return newTime;
                    });
                }
            }, testMode ? 5 : 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isRunning, mode, isBreak, onTimerComplete, onTimeWarning, testMode, actions]);

    return { timeLeft, isRunning };
};

// ================================
// SOUND HOOK (No changes needed)
// ================================

export const useSound = () => {
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
// TASK TIMER HOOK (No changes needed)
// ================================

export const useTaskTimer = () => {
    const { state, actions } = usePomodoroContext();
    const {
        isRunning,
        activeTaskId,
        taskSessionTimes,
        lastUpdateTime,
        testMode,
        tasks,
        taskSessionNames,
        isBreak
    } = state;

    const updateActiveTaskTime = useCallback(() => {
        if (!isRunning || !activeTaskId) return;

        const now = Date.now();
        if (!lastUpdateTime) {
            actions.setLastUpdateTime(now);
            return;
        }

        // Calculate time delta (accelerated in test mode)
        const deltaSeconds = (now - lastUpdateTime) / 1000;
        const deltaMinutes = testMode ? (deltaSeconds * 200) / 60 : deltaSeconds / 60;

        // Add time to active task
        const newTaskSessionTimes = {
            ...taskSessionTimes,
            [activeTaskId]: (taskSessionTimes[activeTaskId] || 0) + deltaMinutes
        };
        actions.updateTaskSessionTimes(newTaskSessionTimes);

        // Store task name for later reference
        const activeTask = tasks.find(t => t.id === activeTaskId);
        if (activeTask) {
            const newTaskSessionNames = {
                ...taskSessionNames,
                [activeTaskId]: activeTask.text
            };
            actions.setTaskSessionNames(newTaskSessionNames);
        }

        actions.setLastUpdateTime(now);
    }, [isRunning, activeTaskId, lastUpdateTime, testMode, tasks, taskSessionTimes, taskSessionNames, actions]);

    const saveSessionToAccumulated = useCallback(() => {
        console.log('saveSessionToAccumulated called');
        console.log('Current taskSessionTimes:', taskSessionTimes);

        if (Object.keys(taskSessionTimes).length > 0) {
            // Reset session times only - task updates are handled by the caller
            actions.updateTaskSessionTimes({});
            console.log(`Reset session times for ${Object.keys(taskSessionTimes).length} tasks`);
        } else {
            console.log('No session times to reset');
        }
    }, [taskSessionTimes, actions]);

    // Auto-update task times when timer is running
    useEffect(() => {
        let interval;
        if (isRunning && activeTaskId) {
            interval = setInterval(updateActiveTaskTime, testMode ? 50 : 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, activeTaskId, updateActiveTaskTime, testMode]);

    const setActiveTask = useCallback((taskId) => {
        // Only allow task switching during work sessions, not breaks
        if (!isRunning || isBreak) return;

        // Update current task time before switching
        updateActiveTaskTime();

        // Switch to new task
        actions.setActiveTaskId(taskId);
        actions.setLastUpdateTime(Date.now());

        console.log('Switched to task:', taskId);
    }, [isRunning, isBreak, updateActiveTaskTime, actions]);

    return {
        updateActiveTaskTime,
        saveSessionToAccumulated,
        setActiveTask,
        taskSessionTimes,
        activeTaskId
    };
};

// ================================
// UPDATED DATA PERSISTENCE HOOK FOR TAURI V2
// ================================

export const useDataPersistence = () => {
    const { state, actions } = usePomodoroContext();
    const {
        isLoaded,
        dataFilePath,
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

    /**
     * Initialize data persistence with Tauri v2 approach
     */
    useEffect(() => {
        const initData = async () => {
            try {
                console.log('🔄 Initializing Tauri v2 file system access...');

                // Test if we can access the file system (Tauri v2)
                const { exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');

                const testFile = 'pomodoro-data.json';
                await exists(testFile, { baseDir: BaseDirectory.AppData });

                console.log('✅ Tauri v2 file system is accessible');
                actions.setDataFilePath(testFile); // Just the filename

            } catch (error) {
                console.error('❌ Tauri v2 file system test failed:', error);
                actions.setDataFilePath(null);
                actions.setIsLoaded(true);
            }
        };

        // Only run once
        if (!dataFilePath && !isLoaded) {
            initData();
        }
    }, [dataFilePath, isLoaded, actions]);

    /**
     * Load data using Tauri v2 APIs
     */
    useEffect(() => {
        const loadData = async () => {
            if (isLoaded || !dataFilePath) {
                return;
            }

            try {
                console.log('📖 Attempting to load data with Tauri v2...');

                const { exists, readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');

                const fileExists = await exists(dataFilePath, { baseDir: BaseDirectory.AppData });

                if (!fileExists) {
                    console.log('📝 No existing data file, starting fresh');
                    actions.setIsLoaded(true);
                    return;
                }

                console.log('📄 Reading existing data file...');
                const content = await readTextFile(dataFilePath, { baseDir: BaseDirectory.AppData });

                if (!content || content.trim() === '') {
                    console.log('📝 Empty file, starting fresh');
                    actions.setIsLoaded(true);
                    return;
                }

                const data = JSON.parse(content);
                console.log('🎯 Data loaded successfully:', Object.keys(data));

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
                if (data.streakHistory && Array.isArray(data.streakHistory)) loadData.streakHistory = data.streakHistory;
                if (data.manualMaxDailyStreak !== undefined) {
                    loadData.manualMaxDailyStreak = data.manualMaxDailyStreak;
                } else {
                    loadData.manualMaxDailyStreak = null; // Ensure null if not set
                }

                if (data.manualMaxSessionStreak !== undefined) {
                    loadData.manualMaxSessionStreak = data.manualMaxSessionStreak;
                } else {
                    loadData.manualMaxSessionStreak = null; // Ensure null if not set
                }

                // Initialize daily streak from today's sessions
                const today = new Date().toISOString().split('T')[0];
                const todaySessions = data.timeHistory?.filter(session =>
                    session.timestamp.split('T')[0] === today
                ) || [];

                if (todaySessions.length > 0) {
                    // Calculate daily streak from today's sessions using sessionCount
                    const todayDailyStreak = todaySessions.reduce((sum, session) => {
                        const sessionCount = session.sessionCount || 0;
                        if (session.sessionType === '25/5') return sum + (sessionCount * 0.5);
                        if (session.sessionType === '50/10') return sum + (sessionCount * 1.0);
                        return sum; // stopwatch doesn't contribute
                    }, 0);

                    loadData.dailyStreak = Math.max(data.dailyStreak || 0, todayDailyStreak);
                } else {
                    if (data.dailyStreak !== undefined) loadData.dailyStreak = data.dailyStreak;
                }

                // Initialize session streak (always starts at 0 on app startup)
                loadData.sessionStreak = 0;

                // Load all data at once
                actions.loadAllData(loadData);

                console.log('✅ All data restored successfully with Tauri v2');

            } catch (error) {
                console.error('❌ Error loading data with Tauri v2:', error);
            } finally {
                actions.setIsLoaded(true);
            }
        };

        loadData();
    }, [dataFilePath, isLoaded, actions]);

    /**
     * Save data using Tauri v2 APIs
     */
    const saveData = useCallback(async () => {
        if (!isLoaded || !dataFilePath) {
            console.log('⚠️ Skipping save - not ready');
            return false;
        }

        try {
            const { writeTextFile, exists, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs');

            // Create the app directory if it doesn't exist (Tauri v2)
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
                dailyStreak,
                sessionStreak,
                streakHistory,
                manualMaxDailyStreak,
                manualMaxSessionStreak,
                lastSaved: new Date().toISOString(),
                version: '2.0'
            };

            console.log('💾 Saving data with Tauri v2...', {
                tasks: data.tasks?.length || 0,
                timeHistory: data.timeHistory?.length || 0,
                taskHistory: data.taskHistory?.length || 0
            });

            await writeTextFile(dataFilePath, JSON.stringify(data, null, 2), {
                baseDir: BaseDirectory.AppData
            });

            console.log('✅ Data saved successfully with Tauri v2');
            return true;

        } catch (error) {
            console.error('❌ Error saving data with Tauri v2:', error);
            return false;
        }
    }, [isLoaded, dataFilePath, dailyGoal, tasks, completedTasks, timeHistory, taskHistory, dailyStreak, sessionStreak, streakHistory, manualMaxDailyStreak, manualMaxSessionStreak]);

    // Auto-save with debouncing
    useEffect(() => {
        if (isLoaded && dataFilePath) {
            const timeoutId = setTimeout(() => {
                console.log('🔄 Auto-saving with Tauri v2...');
                saveData();
            }, 2000);

            return () => clearTimeout(timeoutId);
        }
    }, [isLoaded, dataFilePath, dailyGoal, tasks, completedTasks, timeHistory, taskHistory, dailyStreak, sessionStreak, streakHistory, manualMaxDailyStreak, manualMaxSessionStreak, saveData]);

    return { saveData };
};

// ================================
// ANALYTICS HOOK (No changes needed)
// ================================

export const useAnalytics = () => {
    const { state } = usePomodoroContext();
    const {
        timeHistory,
        taskHistory,
        completedTasks,
        taskSessionTimes,
        viewMode,
        dailyStreak,
        sessionStreak,
        manualMaxDailyStreak,
        manualMaxSessionStreak,
        mode
    } = state;

    const recentCompletedTasks = useMemo(() => {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return completedTasks.filter(task => new Date(task.timestamp) > oneDayAgo);
    }, [completedTasks]);

    const totalTimeToday = useMemo(() => {
        // Get base time from completed sessions today
        const baseTime = timeHistory
            .filter(entry => entry.timestamp.split('T')[0] === new Date().toISOString().split('T')[0])
            .reduce((total, entry) => total + (entry.totalMinutes || 0), 0);

        // Add current session time if timer is running or paused
        const currentSessionMinutes = Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0);

        return baseTime + currentSessionMinutes;
    }, [timeHistory, taskSessionTimes]);

    const todaySessionCount = useMemo(() => {
        const todayBase = timeHistory
            .filter(s => s.timestamp.split('T')[0] === new Date().toISOString().split('T')[0])
            .reduce((total, session) => total + (session.sessionCount || 0), 0);

        // Add current session count if timer is active
        return todayBase + state.tempSessionCount;
    }, [timeHistory, state.tempSessionCount]);

    const getMaxDailyStreakForPeriod = useCallback((period) => {
        // If manual override is set and it's not null, use that
        if (manualMaxDailyStreak !== null && manualMaxDailyStreak !== undefined) {
            return manualMaxDailyStreak;
        }

        // Filter sessions by period
        let filteredSessions = timeHistory;
        const now = Date.now();

        if (period === 'week') {
            const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
            filteredSessions = timeHistory.filter(session => new Date(session.timestamp).getTime() >= weekAgo);
        } else if (period === 'month') {
            const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
            filteredSessions = timeHistory.filter(session => new Date(session.timestamp).getTime() >= monthAgo);
        } else if (period === 'year') {
            const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
            filteredSessions = timeHistory.filter(session => new Date(session.timestamp).getTime() >= yearAgo);
        }

        // Get all daily streak values from filtered sessions
        const streakValues = filteredSessions.map(session => session.dailyStreak || 0);

        // Also include current daily streak
        streakValues.push(dailyStreak);

        // Additionally, calculate daily streaks by day to handle accumulation properly
        const dailyStreaksByDay = {};

        filteredSessions.forEach(session => {
            const date = session.timestamp.split('T')[0];
            if (!dailyStreaksByDay[date]) {
                dailyStreaksByDay[date] = 0;
            }

            // Add session contribution to daily streak
            const sessionCount = session.sessionCount || 0;
            if (session.sessionType === '25/5') {
                dailyStreaksByDay[date] += sessionCount * 0.5;
            } else if (session.sessionType === '50/10') {
                dailyStreaksByDay[date] += sessionCount * 1.0;
            }
            // stopwatch doesn't contribute
        });

        // Add calculated daily streaks to our values
        Object.values(dailyStreaksByDay).forEach(dayStreak => {
            streakValues.push(dayStreak);
        });

        // Filter out zero values and get maximum
        const nonZeroStreaks = streakValues.filter(streak => streak > 0);

        return nonZeroStreaks.length > 0 ? Math.max(...nonZeroStreaks) : 0;
    }, [timeHistory, manualMaxDailyStreak, dailyStreak]);

    // In part2-hooks.jsx, replace the getMaxSessionStreakForPeriod function with this:

    const getMaxSessionStreakForPeriod = useCallback((period) => {
        // If manual override is set and it's not null, use that
        if (manualMaxSessionStreak !== null && manualMaxSessionStreak !== undefined) {
            return manualMaxSessionStreak;
        }

        // Filter sessions by period
        let filteredSessions = timeHistory;
        const now = Date.now();

        if (period === 'week') {
            const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
            filteredSessions = timeHistory.filter(session => new Date(session.timestamp).getTime() >= weekAgo);
        } else if (period === 'month') {
            const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
            filteredSessions = timeHistory.filter(session => new Date(session.timestamp).getTime() >= monthAgo);
        } else if (period === 'year') {
            const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
            filteredSessions = timeHistory.filter(session => new Date(session.timestamp).getTime() >= yearAgo);
        }

        // Get all session streak values from filtered sessions (only pomodoro modes)
        const streakValues = filteredSessions
            .filter(session => session.sessionType !== 'stopwatch') // Only pomodoro sessions
            .map(session => session.sessionStreak || 0);

        // Also include current session streak if not in stopwatch mode
        if (mode !== 'stopwatch') {
            streakValues.push(sessionStreak);
        }

        // Filter out zero values and get maximum
        const nonZeroStreaks = streakValues.filter(streak => streak > 0);

        return nonZeroStreaks.length > 0 ? Math.max(...nonZeroStreaks) : 0;
    }, [timeHistory, manualMaxSessionStreak, sessionStreak, mode]);

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

    return {
        recentCompletedTasks,
        totalTimeToday,
        todaySessionCount,
        getMaxDailyStreakForPeriod,
        getMaxSessionStreakForPeriod,
        getChartData
    };
};

// ================================
// HISTORY MANAGEMENT HOOK 
// ================================

export const useHistoryManagement = () => {
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

    return {
        groupHistoryByPeriod
    };
};