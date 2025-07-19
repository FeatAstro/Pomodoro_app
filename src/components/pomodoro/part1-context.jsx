// ================================
// UPDATED PART 1: CONTEXT FOR TAURI V2 + VITE
// ================================

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// ================================
// TYPES AND INTERFACES (using JSDoc for type safety)
// ================================

/**
 * @typedef {Object} Task
 * @property {number} id - Unique identifier
 * @property {string} text - Task description
 * @property {boolean} completed - Whether task is completed
 * @property {number} accumulatedTime - Total time spent on task (minutes)
 * @property {boolean} [isDefault] - Whether this is the default task
 */

/**
 * @typedef {Object} CompletedTask
 * @property {number} id - Unique identifier
 * @property {string} text - Task description
 * @property {Date} timestamp - When task was completed
 */

/**
 * @typedef {Object} SessionHistoryItem
 * @property {number} id - Unique identifier
 * @property {string} task - Primary task name for this session
 * @property {number} totalMinutes - Total session duration
 * @property {number} sessionCount - Number of completed sessions
 * @property {number} sessionStreak - Session streak at time of save
 * @property {number} dailyStreak - Daily streak at time of save
 * @property {string} timestamp - ISO timestamp
 * @property {string} sessionType - '25/5', '50/10', or 'stopwatch'
 * @property {Object.<string, number>} taskBreakdown - Time per task in session
 */

/**
 * @typedef {Object} TaskHistoryItem
 * @property {number} id - Unique identifier
 * @property {string} task - Task description
 * @property {string} timestamp - ISO timestamp
 * @property {number} duration - Time spent on task (minutes)
 */

/**
 * @typedef {Object} StreakHistoryItem
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {number} streak - Daily streak value for that date
 */

// ================================
// CONSTANTS
// ================================

export const TIMER_MODES = {
    POMODORO_25: '25/5',
    POMODORO_50: '50/10',
    STOPWATCH: 'stopwatch'
};

export const TABS = {
    TIMER: 'timer',
    ANALYTICS: 'analytics',
    HISTORY: 'history'
};

export const VIEW_MODES = {
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
};

export const HISTORY_VIEW_MODES = {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
};

// ================================
// INITIAL STATE
// ================================

export const initialState = {
    // Timer core state
    mode: TIMER_MODES.POMODORO_25,
    isBreak: false,
    isRunning: false,
    timeLeft: 25 * 60,
    sessionElapsedTime: 0,
    sessionStartTime: null,

    // UI state
    activeTab: TABS.TIMER,
    viewMode: VIEW_MODES.WEEK,
    historyViewMode: HISTORY_VIEW_MODES.DAY,
    showInstructions: false,
    testMode: false,
    devClickCount: 0,

    // Task management
    currentTask: '',
    tasks: [],
    completedTasks: [],
    activeTaskId: null,
    taskSessionTimes: {},
    taskSessionNames: {},
    lastUpdateTime: null,

    // Session tracking
    tempSessionCount: 0,
    dailyStreak: 0,
    sessionStreak: 0,

    // Persistent data
    dailyGoal: 480, // 8 hours in minutes
    timeHistory: [],
    taskHistory: [],
    streakHistory: [],
    manualMaxDailyStreak: null,
    manualMaxSessionStreak: null,

    // Data persistence
    dataFilePath: undefined,
    isLoaded: false,

    // UI expansion states
    expandedSessions: new Set(),
    expandedTasks: new Set(),
    expandedTimePeriods: new Set(),

    // Current time for display
    currentTime: new Date()
};

// ================================
// ACTION TYPES
// ================================

export const ACTION_TYPES = {
    // Timer actions
    SET_MODE: 'SET_MODE',
    SET_IS_BREAK: 'SET_IS_BREAK',
    SET_IS_RUNNING: 'SET_IS_RUNNING',
    SET_TIME_LEFT: 'SET_TIME_LEFT',
    SET_SESSION_ELAPSED_TIME: 'SET_SESSION_ELAPSED_TIME',
    SET_SESSION_START_TIME: 'SET_SESSION_START_TIME',
    UPDATE_CURRENT_TIME: 'UPDATE_CURRENT_TIME',

    // UI actions
    SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
    SET_VIEW_MODE: 'SET_VIEW_MODE',
    SET_HISTORY_VIEW_MODE: 'SET_HISTORY_VIEW_MODE',
    SET_SHOW_INSTRUCTIONS: 'SET_SHOW_INSTRUCTIONS',
    SET_TEST_MODE: 'SET_TEST_MODE',
    INCREMENT_DEV_CLICK_COUNT: 'INCREMENT_DEV_CLICK_COUNT',
    RESET_DEV_CLICK_COUNT: 'RESET_DEV_CLICK_COUNT',

    // Task actions
    SET_CURRENT_TASK: 'SET_CURRENT_TASK',
    ADD_TASK: 'ADD_TASK',
    UPDATE_TASKS: 'UPDATE_TASKS',
    DELETE_TASK: 'DELETE_TASK',
    COMPLETE_TASK: 'COMPLETE_TASK',
    SET_ACTIVE_TASK_ID: 'SET_ACTIVE_TASK_ID',
    UPDATE_TASK_SESSION_TIMES: 'UPDATE_TASK_SESSION_TIMES',
    SET_TASK_SESSION_NAMES: 'SET_TASK_SESSION_NAMES',
    SET_LAST_UPDATE_TIME: 'SET_LAST_UPDATE_TIME',
    ADD_COMPLETED_TASK: 'ADD_COMPLETED_TASK',
    DELETE_COMPLETED_TASK: 'DELETE_COMPLETED_TASK',

    // Session tracking
    SET_TEMP_SESSION_COUNT: 'SET_TEMP_SESSION_COUNT',
    INCREMENT_TEMP_SESSION_COUNT: 'INCREMENT_TEMP_SESSION_COUNT',
    SET_DAILY_STREAK: 'SET_DAILY_STREAK',
    SET_SESSION_STREAK: 'SET_SESSION_STREAK',

    // History actions
    ADD_TIME_HISTORY: 'ADD_TIME_HISTORY',
    DELETE_TIME_HISTORY: 'DELETE_TIME_HISTORY',
    CLEAR_TIME_HISTORY: 'CLEAR_TIME_HISTORY',
    ADD_TASK_HISTORY: 'ADD_TASK_HISTORY',
    DELETE_TASK_HISTORY: 'DELETE_TASK_HISTORY',
    CLEAR_TASK_HISTORY: 'CLEAR_TASK_HISTORY',
    SET_STREAK_HISTORY: 'SET_STREAK_HISTORY',

    // Settings
    SET_DAILY_GOAL: 'SET_DAILY_GOAL',
    SET_MANUAL_MAX_DAILY_STREAK: 'SET_MANUAL_MAX_DAILY_STREAK',
    SET_MANUAL_MAX_SESSION_STREAK: 'SET_MANUAL_MAX_SESSION_STREAK',

    // Data persistence
    SET_DATA_FILE_PATH: 'SET_DATA_FILE_PATH',
    SET_IS_LOADED: 'SET_IS_LOADED',
    LOAD_ALL_DATA: 'LOAD_ALL_DATA',

    // UI expansion states
    TOGGLE_EXPANDED_SESSION: 'TOGGLE_EXPANDED_SESSION',
    TOGGLE_EXPANDED_TASK: 'TOGGLE_EXPANDED_TASK',
    TOGGLE_EXPANDED_TIME_PERIOD: 'TOGGLE_EXPANDED_TIME_PERIOD',
    SET_EXPANDED_SESSIONS: 'SET_EXPANDED_SESSIONS',
    SET_EXPANDED_TASKS: 'SET_EXPANDED_TASKS',
    SET_EXPANDED_TIME_PERIODS: 'SET_EXPANDED_TIME_PERIODS',

    // Complex actions
    COMPLETE_SESSION: 'COMPLETE_SESSION',
    STOP_TIMER_AND_SAVE: 'STOP_TIMER_AND_SAVE',
    RESET_SESSION_STATE: 'RESET_SESSION_STATE'
};


// ================================
// REDUCER
// ================================

const handleFunctionalUpdate = (currentValue, payload) => {
    return typeof payload === 'function' ? payload(currentValue) : payload;
};

export const pomodoroReducer = (state, action) => {
    switch (action.type) {
        // Timer actions
        case ACTION_TYPES.SET_MODE:
            return {
                ...state,
                mode: action.payload,
                timeLeft: action.payload === TIMER_MODES.POMODORO_25 ? 25 * 60 :
                    action.payload === TIMER_MODES.POMODORO_50 ? 50 * 60 : 0,
                isBreak: false,
                isRunning: false
            };

        case ACTION_TYPES.SET_IS_BREAK:
            return {
                ...state,
                isBreak: action.payload,
                timeLeft: state.mode === TIMER_MODES.POMODORO_25
                    ? (action.payload ? 5 * 60 : 25 * 60)
                    : state.mode === TIMER_MODES.POMODORO_50
                        ? (action.payload ? 10 * 60 : 50 * 60)
                        : 0
            };

        case ACTION_TYPES.SET_IS_RUNNING:
            return { ...state, isRunning: action.payload };

        case ACTION_TYPES.SET_TIME_LEFT:
            return {
                ...state,
                timeLeft: handleFunctionalUpdate(state.timeLeft, action.payload)
            };

        case ACTION_TYPES.SET_SESSION_ELAPSED_TIME:
            return { ...state, sessionElapsedTime: action.payload };

        case ACTION_TYPES.SET_SESSION_START_TIME:
            return { ...state, sessionStartTime: action.payload };

        case ACTION_TYPES.UPDATE_CURRENT_TIME:
            return { ...state, currentTime: new Date() };

        // UI actions
        case ACTION_TYPES.SET_ACTIVE_TAB:
            return { ...state, activeTab: action.payload };

        case ACTION_TYPES.SET_VIEW_MODE:
            return { ...state, viewMode: action.payload };

        case ACTION_TYPES.SET_HISTORY_VIEW_MODE:
            return { ...state, historyViewMode: action.payload };

        case ACTION_TYPES.SET_SHOW_INSTRUCTIONS:
            return { ...state, showInstructions: action.payload };

        case ACTION_TYPES.SET_TEST_MODE:
            return { ...state, testMode: action.payload };

        case ACTION_TYPES.INCREMENT_DEV_CLICK_COUNT:
            return { ...state, devClickCount: state.devClickCount + 1 };

        case ACTION_TYPES.RESET_DEV_CLICK_COUNT:
            return { ...state, devClickCount: 0 };

        // Task actions
        case ACTION_TYPES.SET_CURRENT_TASK:
            return { ...state, currentTask: action.payload };

        case ACTION_TYPES.ADD_TASK:
            return { ...state, tasks: action.payload };

        case ACTION_TYPES.UPDATE_TASKS:
            return { ...state, tasks: action.payload };

        case ACTION_TYPES.DELETE_TASK:
            return {
                ...state,
                tasks: state.tasks.filter(task => task.id !== action.payload)
            };

        case ACTION_TYPES.SET_ACTIVE_TASK_ID:
            return { ...state, activeTaskId: action.payload };

        case ACTION_TYPES.UPDATE_TASK_SESSION_TIMES:
            return { ...state, taskSessionTimes: action.payload };

        case ACTION_TYPES.SET_TASK_SESSION_NAMES:
            return { ...state, taskSessionNames: action.payload };

        case ACTION_TYPES.SET_LAST_UPDATE_TIME:
            return { ...state, lastUpdateTime: action.payload };

        case ACTION_TYPES.ADD_COMPLETED_TASK:
            return {
                ...state,
                completedTasks: [...state.completedTasks, action.payload]
            };

        case ACTION_TYPES.DELETE_COMPLETED_TASK:
            return {
                ...state,
                completedTasks: state.completedTasks.filter(task => task.id !== action.payload)
            };

        // Session tracking
        case ACTION_TYPES.SET_TEMP_SESSION_COUNT:
            return { ...state, tempSessionCount: action.payload };

        case ACTION_TYPES.INCREMENT_TEMP_SESSION_COUNT:
            return { ...state, tempSessionCount: state.tempSessionCount + 1 };

        case ACTION_TYPES.SET_DAILY_STREAK:
            return {
                ...state,
                dailyStreak: handleFunctionalUpdate(state.dailyStreak, action.payload)
            };

        case ACTION_TYPES.SET_SESSION_STREAK:
            return {
                ...state,
                sessionStreak: handleFunctionalUpdate(state.sessionStreak, action.payload)
            };

        // History actions
        case ACTION_TYPES.ADD_TIME_HISTORY:
            return {
                ...state,
                timeHistory: [...state.timeHistory, action.payload]
            };

        case ACTION_TYPES.DELETE_TIME_HISTORY:
            return {
                ...state,
                timeHistory: state.timeHistory.filter(session => session.id !== action.payload)
            };

        case ACTION_TYPES.CLEAR_TIME_HISTORY:
            return { ...state, timeHistory: [] };

        case ACTION_TYPES.ADD_TASK_HISTORY:
            return {
                ...state,
                taskHistory: [...state.taskHistory, action.payload]
            };

        case ACTION_TYPES.DELETE_TASK_HISTORY:
            return {
                ...state,
                taskHistory: state.taskHistory.filter(task => task.id !== action.payload)
            };

        case ACTION_TYPES.CLEAR_TASK_HISTORY:
            return { ...state, taskHistory: [] };

        case ACTION_TYPES.SET_STREAK_HISTORY:
            return { ...state, streakHistory: action.payload };

        // Settings
        case ACTION_TYPES.SET_DAILY_GOAL:
            return { ...state, dailyGoal: action.payload };

        case ACTION_TYPES.SET_MANUAL_MAX_DAILY_STREAK:
            return { ...state, manualMaxDailyStreak: action.payload };

        case ACTION_TYPES.SET_MANUAL_MAX_SESSION_STREAK:
            return { ...state, manualMaxSessionStreak: action.payload };

        // Data persistence
        case ACTION_TYPES.SET_DATA_FILE_PATH:
            return { ...state, dataFilePath: action.payload };

        case ACTION_TYPES.SET_IS_LOADED:
            return { ...state, isLoaded: action.payload };

        case ACTION_TYPES.LOAD_ALL_DATA:
            return { ...state, ...action.payload };

        // UI expansion states
        case ACTION_TYPES.TOGGLE_EXPANDED_SESSION:
            const newExpandedSessions = new Set(state.expandedSessions);
            if (newExpandedSessions.has(action.payload)) {
                newExpandedSessions.delete(action.payload);
            } else {
                newExpandedSessions.add(action.payload);
            }
            return { ...state, expandedSessions: newExpandedSessions };

        case ACTION_TYPES.TOGGLE_EXPANDED_TASK:
            const newExpandedTasks = new Set(state.expandedTasks);
            if (newExpandedTasks.has(action.payload)) {
                newExpandedTasks.delete(action.payload);
            } else {
                newExpandedTasks.add(action.payload);
            }
            return { ...state, expandedTasks: newExpandedTasks };

        case ACTION_TYPES.TOGGLE_EXPANDED_TIME_PERIOD:
            const newExpandedTimePeriods = new Set(state.expandedTimePeriods);
            if (newExpandedTimePeriods.has(action.payload)) {
                newExpandedTimePeriods.delete(action.payload);
            } else {
                newExpandedTimePeriods.add(action.payload);
            }
            return { ...state, expandedTimePeriods: newExpandedTimePeriods };

        case ACTION_TYPES.SET_EXPANDED_SESSIONS:
            return { ...state, expandedSessions: action.payload };

        case ACTION_TYPES.SET_EXPANDED_TASKS:
            return { ...state, expandedTasks: action.payload };

        case ACTION_TYPES.SET_EXPANDED_TIME_PERIODS:
            return { ...state, expandedTimePeriods: action.payload };

        // Complex actions
        case ACTION_TYPES.COMPLETE_SESSION:
            const sessionValue = state.mode === TIMER_MODES.POMODORO_25 ? 0.5 :
                state.mode === TIMER_MODES.POMODORO_50 ? 1.0 : 0;

            return {
                ...state,
                tempSessionCount: state.tempSessionCount + 1,
                sessionStreak: state.mode === TIMER_MODES.STOPWATCH ?
                    state.sessionStreak : state.sessionStreak + sessionValue,
                dailyStreak: state.mode === TIMER_MODES.STOPWATCH ?
                    state.dailyStreak : state.dailyStreak + sessionValue
            };

        case ACTION_TYPES.RESET_SESSION_STATE:
            return {
                ...state,
                tempSessionCount: 0,
                sessionStreak: 0,
                taskSessionTimes: {},
                taskSessionNames: {},
                activeTaskId: null,
                lastUpdateTime: null,
                timeLeft: state.mode === TIMER_MODES.POMODORO_25 ? 25 * 60 :
                    state.mode === TIMER_MODES.POMODORO_50 ? 50 * 60 : 0,
                isBreak: false,
                sessionStartTime: null,
                sessionElapsedTime: 0,
                isRunning: false
            };

        default:
            return state;
    }
};

// ================================
// CONTEXT CREATION
// ================================

export const PomodoroContext = createContext();

// ================================
// CONTEXT PROVIDER
// ================================

export const PomodoroProvider = ({ children }) => {
    const [state, dispatch] = useReducer(pomodoroReducer, initialState);

    // Memoize the actions object to prevent unnecessary re-renders
    const actions = useMemo(() => ({
        // Timer actions
        setMode: (mode) => dispatch({ type: ACTION_TYPES.SET_MODE, payload: mode }),
        setIsBreak: (isBreak) => dispatch({ type: ACTION_TYPES.SET_IS_BREAK, payload: isBreak }),
        setIsRunning: (isRunning) => dispatch({ type: ACTION_TYPES.SET_IS_RUNNING, payload: isRunning }),

        setTimeLeft: (timeLeft) => dispatch({ type: ACTION_TYPES.SET_TIME_LEFT, payload: timeLeft }),

        setSessionElapsedTime: (time) => dispatch({ type: ACTION_TYPES.SET_SESSION_ELAPSED_TIME, payload: time }),
        setSessionStartTime: (time) => dispatch({ type: ACTION_TYPES.SET_SESSION_START_TIME, payload: time }),
        updateCurrentTime: () => dispatch({ type: ACTION_TYPES.UPDATE_CURRENT_TIME }),

        // UI actions
        setActiveTab: (tab) => dispatch({ type: ACTION_TYPES.SET_ACTIVE_TAB, payload: tab }),
        setViewMode: (mode) => dispatch({ type: ACTION_TYPES.SET_VIEW_MODE, payload: mode }),
        setHistoryViewMode: (mode) => dispatch({ type: ACTION_TYPES.SET_HISTORY_VIEW_MODE, payload: mode }),
        setShowInstructions: (show) => dispatch({ type: ACTION_TYPES.SET_SHOW_INSTRUCTIONS, payload: show }),
        setTestMode: (test) => dispatch({ type: ACTION_TYPES.SET_TEST_MODE, payload: test }),
        incrementDevClickCount: () => dispatch({ type: ACTION_TYPES.INCREMENT_DEV_CLICK_COUNT }),
        resetDevClickCount: () => dispatch({ type: ACTION_TYPES.RESET_DEV_CLICK_COUNT }),

        // Task actions  
        setCurrentTask: (task) => dispatch({ type: ACTION_TYPES.SET_CURRENT_TASK, payload: task }),
        updateTasks: (tasks) => dispatch({ type: ACTION_TYPES.UPDATE_TASKS, payload: tasks }),
        deleteTask: (taskId) => dispatch({ type: ACTION_TYPES.DELETE_TASK, payload: taskId }),
        setActiveTaskId: (taskId) => dispatch({ type: ACTION_TYPES.SET_ACTIVE_TASK_ID, payload: taskId }),
        updateTaskSessionTimes: (times) => dispatch({ type: ACTION_TYPES.UPDATE_TASK_SESSION_TIMES, payload: times }),
        setTaskSessionNames: (names) => dispatch({ type: ACTION_TYPES.SET_TASK_SESSION_NAMES, payload: names }),
        setLastUpdateTime: (time) => dispatch({ type: ACTION_TYPES.SET_LAST_UPDATE_TIME, payload: time }),
        addCompletedTask: (task) => dispatch({ type: ACTION_TYPES.ADD_COMPLETED_TASK, payload: task }),
        deleteCompletedTask: (taskId) => dispatch({ type: ACTION_TYPES.DELETE_COMPLETED_TASK, payload: taskId }),

        // FIXED: Session tracking actions that support functional updates
        setTempSessionCount: (count) => dispatch({ type: ACTION_TYPES.SET_TEMP_SESSION_COUNT, payload: count }),
        incrementTempSessionCount: () => dispatch({ type: ACTION_TYPES.INCREMENT_TEMP_SESSION_COUNT }),

        setDailyStreak: (streak) => dispatch({ type: ACTION_TYPES.SET_DAILY_STREAK, payload: streak }),
        setSessionStreak: (streak) => dispatch({ type: ACTION_TYPES.SET_SESSION_STREAK, payload: streak }),

        // History actions
        addTimeHistory: (session) => dispatch({ type: ACTION_TYPES.ADD_TIME_HISTORY, payload: session }),
        deleteTimeHistory: (sessionId) => dispatch({ type: ACTION_TYPES.DELETE_TIME_HISTORY, payload: sessionId }),
        clearTimeHistory: () => dispatch({ type: ACTION_TYPES.CLEAR_TIME_HISTORY }),
        addTaskHistory: (task) => dispatch({ type: ACTION_TYPES.ADD_TASK_HISTORY, payload: task }),
        deleteTaskHistory: (taskId) => dispatch({ type: ACTION_TYPES.DELETE_TASK_HISTORY, payload: taskId }),
        clearTaskHistory: () => dispatch({ type: ACTION_TYPES.CLEAR_TASK_HISTORY }),
        setStreakHistory: (history) => dispatch({ type: ACTION_TYPES.SET_STREAK_HISTORY, payload: history }),

        // Settings
        setDailyGoal: (goal) => dispatch({ type: ACTION_TYPES.SET_DAILY_GOAL, payload: goal }),
        setManualMaxDailyStreak: (streak) => dispatch({ type: ACTION_TYPES.SET_MANUAL_MAX_DAILY_STREAK, payload: streak }),
        setManualMaxSessionStreak: (streak) => dispatch({ type: ACTION_TYPES.SET_MANUAL_MAX_SESSION_STREAK, payload: streak }),

        // Data persistence
        setDataFilePath: (path) => dispatch({ type: ACTION_TYPES.SET_DATA_FILE_PATH, payload: path }),
        setIsLoaded: (loaded) => dispatch({ type: ACTION_TYPES.SET_IS_LOADED, payload: loaded }),
        loadAllData: (data) => dispatch({ type: ACTION_TYPES.LOAD_ALL_DATA, payload: data }),

        // UI expansion states
        toggleExpandedSession: (sessionId) => dispatch({ type: ACTION_TYPES.TOGGLE_EXPANDED_SESSION, payload: sessionId }),
        toggleExpandedTask: (taskId) => dispatch({ type: ACTION_TYPES.TOGGLE_EXPANDED_TASK, payload: taskId }),
        toggleExpandedTimePeriod: (periodKey) => dispatch({ type: ACTION_TYPES.TOGGLE_EXPANDED_TIME_PERIOD, payload: periodKey }),

        // Complex actions
        completeSession: () => dispatch({ type: ACTION_TYPES.COMPLETE_SESSION }),
        resetSessionState: () => dispatch({ type: ACTION_TYPES.RESET_SESSION_STATE })
    }), [dispatch]);


    return (
        <PomodoroContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </PomodoroContext.Provider>
    );
};

// ================================
// CONTEXT HOOK
// ================================

export const usePomodoroContext = () => {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error('usePomodoroContext must be used within a PomodoroProvider');
    }
    return context;
};