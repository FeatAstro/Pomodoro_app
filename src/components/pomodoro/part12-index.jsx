// ================================
// PART 12: INDEX AND EXPORTS
// ================================

// ================================
// MAIN APP EXPORT
// ================================

// Import main app component
import PomodoroApp from './part10-main.jsx';
export default PomodoroApp;

// ================================
// CONTEXT AND STATE EXPORTS
// ================================

export {
    // Context
    PomodoroProvider,
    usePomodoroContext,

    // Constants
    TIMER_MODES,
    TABS,
    VIEW_MODES,
    HISTORY_VIEW_MODES,
    ACTION_TYPES,

    // Initial state and reducer
    initialState,
    pomodoroReducer
} from './part1-context.jsx';

// ================================
// HOOKS EXPORTS
// ================================

export {
    useTimer,
    useSound,
    useTaskTimer,
    useDataPersistence,
    useAnalytics,
    useHistoryManagement
} from './part2-hooks.jsx';

// ================================
// UTILITY EXPORTS
// ================================

export {
    formatTime,
    exportData,
    importData,
    TaskItem,
    SessionHistoryItem,
    TaskHistoryItem,
    ProgressBar
} from './part3-utilities.jsx';

// ================================
// MODAL EXPORTS
// ================================

export {
    InstructionsModalPortal,
    ConfirmationModal,
    LoadingModal,
    SuccessModal
} from './part4-modals.jsx';

// ================================
// TIMER COMPONENT EXPORTS
// ================================

export {
    ActiveTaskDisplay,
    SessionStatsDisplay,
    TimerModeSelector,
    TimerDisplay,
    TimerControls,
    DeveloperModeToggle
} from './part5-timer.jsx';

// ================================
// TASK MANAGEMENT EXPORTS
// ================================

export {
    TaskInput,
    ActiveTasksPanel,
    RecentlyCompletedPanel,
    TaskManagementSection
} from './part6-tasks.jsx';

// ================================
// ANALYTICS EXPORTS
// ================================

export {
    ViewModeSelector,
    AnalyticsCharts,
    StatisticsCards,
    DataManagement,
    AnalyticsTab
} from './part7-analytics.jsx';

// ================================
// HISTORY EXPORTS
// ================================

export {
    HistoryViewModeSelector,
    HistoryPeriodGroup,
    WorkSessionsHistory,
    CompletedTasksHistory,
    SoundTestControls,
    HistoryTab
} from './part8-history.jsx';

// ================================
// LAYOUT EXPORTS
// ================================

export {
    ClockAndDateDisplay,
    NavigationTabs,
    MainHeader,
    MainContentWrapper,
    TabContentContainer,
    LoadingScreen,
    ErrorBoundary,
    MainLayout
} from './part9-layout.jsx';

// ================================
// TITLE BAR EXPORT
// ================================

export { default as TitleBar } from './part11-titlebar.jsx';

// ================================
// VERSION AND APP INFO
// ================================

export const APP_INFO = {
    name: 'Focus Timer',
    version: '2.0.0',
    description: 'A beautiful, feature-rich Pomodoro timer with task management and analytics',
    author: 'Refactored Architecture',
    license: 'MIT'
};

// ================================
// UTILITY FUNCTIONS FOR SETUP
// ================================

/**
 * Initialize the Pomodoro app with custom configuration
 * @param {Object} config - Configuration object
 * @param {number} config.defaultDailyGoal - Default daily goal in minutes
 * @param {boolean} config.enableSounds - Enable sound notifications
 * @param {boolean} config.enableTestMode - Enable test mode by default
 */
export const initializePomodoroApp = (config = {}) => {
    const defaultConfig = {
        defaultDailyGoal: 480, // 8 hours
        enableSounds: true,
        enableTestMode: false,
        autoSave: true,
        saveInterval: 2000
    };

    const appConfig = { ...defaultConfig, ...config };

    console.log('🎯 Initializing Pomodoro App with config:', appConfig);

    return appConfig;
};

/**
 * Get app statistics for external monitoring
 */
export const getAppStats = (state) => {
    if (!state) return null;

    return {
        totalSessions: state.timeHistory?.length || 0,
        totalMinutes: state.timeHistory?.reduce((sum, session) => sum + (session.totalMinutes || 0), 0) || 0,
        totalTasks: state.taskHistory?.length || 0,
        currentStreak: state.dailyStreak || 0,
        activeTasks: state.tasks?.filter(t => !t.isDefault).length || 0,
        lastActive: new Date().toISOString()
    };
};

/**
 * Export configuration for development tools
 */
export const DEV_TOOLS = {
    enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
    enableReduxDevTools: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
};

// ================================
// TYPE DEFINITIONS (JSDoc)
// ================================

/**
 * @typedef {Object} PomodoroConfig
 * @property {number} defaultDailyGoal - Default daily goal in minutes
 * @property {boolean} enableSounds - Enable sound notifications
 * @property {boolean} enableTestMode - Enable test mode by default
 * @property {boolean} autoSave - Enable automatic saving
 * @property {number} saveInterval - Auto-save interval in milliseconds
 */

/**
 * @typedef {Object} AppStats
 * @property {number} totalSessions - Total number of completed sessions
 * @property {number} totalMinutes - Total minutes of focus time
 * @property {number} totalTasks - Total number of completed tasks
 * @property {number} currentStreak - Current daily streak
 * @property {number} activeTasks - Number of active tasks
 * @property {string} lastActive - ISO timestamp of last activity
 */

// ================================
// ERROR HANDLING UTILITIES
// ================================

/**
 * Global error handler for the Pomodoro app
 */
export const handleAppError = (error, errorInfo = null) => {
    console.error('🚨 Pomodoro App Error:', error);

    if (errorInfo) {
        console.error('Error Info:', errorInfo);
    }

    // In production, you might want to send errors to a logging service
    if (process.env.NODE_ENV === 'production') {
        // Example: sendToLoggingService(error, errorInfo);
    }

    return {
        error: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack
    };
};

/**
 * Performance monitoring utility
 */
export const measurePerformance = (operation, fn) => {
    if (!DEV_TOOLS.enablePerformanceMonitoring) {
        return fn();
    }

    const start = performance.now();
    const result = fn();
    const end = performance.now();

    console.log(`⚡ ${operation} took ${(end - start).toFixed(2)}ms`);
    return result;
};

// ================================
// DEMO DATA GENERATOR
// ================================

/**
 * Generate demo data for testing and development
 */
export const generateDemoData = () => {
    const now = new Date();
    const demoData = {
        timeHistory: [],
        taskHistory: [],
        tasks: [
            {
                id: 1,
                text: 'Review project requirements',
                completed: false,
                accumulatedTime: 45,
                isDefault: false
            },
            {
                id: 2,
                text: 'Write documentation',
                completed: false,
                accumulatedTime: 30,
                isDefault: false
            },
            {
                id: 999,
                text: 'Focus Session',
                completed: false,
                accumulatedTime: 0,
                isDefault: true
            }
        ],
        dailyStreak: 2.5,
        sessionStreak: 0
    };

    // Generate sample sessions for the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const sessionsToday = Math.floor(Math.random() * 4) + 1;

        for (let j = 0; j < sessionsToday; j++) {
            const sessionTime = new Date(date);
            sessionTime.setHours(9 + j * 2, Math.floor(Math.random() * 60), 0, 0);

            demoData.timeHistory.push({
                id: Date.now() + Math.random(),
                task: j === 0 ? 'Review project requirements' : 'Write documentation',
                totalMinutes: 25,
                sessionCount: 1,
                sessionStreak: j + 1,
                dailyStreak: (j + 1) * 0.5,
                timestamp: sessionTime.toISOString(),
                sessionType: '25/5',
                taskBreakdown: {
                    'Review project requirements': j === 0 ? 25 : 0,
                    'Write documentation': j === 0 ? 0 : 25
                }
            });
        }
    }

    // Generate sample completed tasks
    for (let i = 0; i < 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        demoData.taskHistory.push({
            id: Date.now() + Math.random(),
            task: `Completed task ${i + 1}`,
            timestamp: date.toISOString(),
            duration: 25 + Math.floor(Math.random() * 50)
        });
    }

    return demoData;
};

// ================================
// DEVELOPMENT HELPERS
// ================================

if (process.env.NODE_ENV === 'development') {
    // Expose helpful debugging tools to window object
    window.PomodoroDevTools = {
        generateDemoData,
        getAppStats,
        measurePerformance,
        APP_INFO,
        DEV_TOOLS
    };

    console.log('🛠️ Pomodoro Development Tools available at window.PomodoroDevTools');
}