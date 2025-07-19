// ================================
// PART 10: MAIN APP COMPONENT
// ================================

import React, { useEffect } from 'react';

// Context and Providers
import { PomodoroProvider, usePomodoroContext } from './part1-context';
import { TABS } from './part1-context.jsx';

// Hooks
import { useDataPersistence } from './part2-hooks.jsx';

// Layout Components
import { MainLayout, LoadingScreen } from './part9-layout.jsx';

// Modal Components
import { InstructionsModalPortal } from './part4-modals.jsx';

// Timer Components
import {
    ActiveTaskDisplay,
    SessionStatsDisplay,
    TimerModeSelector,
    TimerDisplay,
    TimerControls,
    DeveloperModeToggle
} from './part5-timer.jsx';

// Task Management Components
import {
    TaskInput,
    TaskManagementSection
} from './part6-tasks.jsx';

// Analytics Components
import { AnalyticsTab } from './part7-analytics.jsx';

// History Components
import { HistoryTab } from './part8-history.jsx';

// Title Bar Component (assuming this exists from original code)
// This would need to be imported from wherever TitleBar is defined
// import TitleBar from './TitleBar';

// ================================
// TIMER TAB CONTENT COMPONENT
// ================================

const TimerTabContent = () => {
    return (
        <div>
            <div className="mb-8">
                <div className="bg-gradient-to-br from-[#1a2331] to-[#0e111a] rounded-2xl border border-[#1a2331] shadow-[inset_0_1px_3px_rgba(255,255,255,0.05),0_35px_60px_-15px_rgba(0,0,0,0.5)] p-1 mb-1 relative">

                    {/* Active Task Display - Top Left */}
                    <ActiveTaskDisplay />

                    {/* Session Stats Display - Top Right */}
                    <SessionStatsDisplay />

                    {/* Timer Mode Selection */}
                    <TimerModeSelector />

                    {/* Main Timer Display */}
                    <TimerDisplay />

                    {/* Timer Controls */}
                    <div className="flex justify-center">
                        <div className="flex flex-col items-center">
                            <TimerControls />
                        </div>
                    </div>

                    {/* Developer Mode Toggle */}
                    <DeveloperModeToggle />
                </div>

                {/* Task Input Section */}
                <TaskInput />

                {/* Task Management Section */}
                <TaskManagementSection />
            </div>
        </div>
    );
};

// ================================
// TAB CONTENT ROUTER COMPONENT
// ================================

const TabContentRouter = () => {
    const { state } = usePomodoroContext();
    const { activeTab } = state;

    switch (activeTab) {
        case TABS.TIMER:
            return <TimerTabContent />;
        case TABS.ANALYTICS:
            return <AnalyticsTab />;
        case TABS.HISTORY:
            return <HistoryTab />;
        default:
            return <TimerTabContent />;
    }
};

// ================================
// DAILY STREAK RESET HOOK (Resets to 0 every midnight)
// ================================

const useMidnightStreakReset = () => {
    const { state, actions } = usePomodoroContext();
    const { dailyStreak, timeHistory, isLoaded } = state;

    useEffect(() => {
        // Only run if data is loaded
        if (!isLoaded) return;

        const checkMidnight = () => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            // Get the last session date from timeHistory
            const lastSession = timeHistory[timeHistory.length - 1];
            const lastSessionDate = lastSession ? lastSession.timestamp.split('T')[0] : null;

            console.log('Daily streak midnight check:', {
                today,
                lastSessionDate,
                currentDailyStreak: dailyStreak,
                timeHistoryLength: timeHistory.length
            });

            // If we have a current streak and the last session was on a previous day
            if (dailyStreak > 0 && lastSessionDate && lastSessionDate !== today) {
                console.log('🔄 New day detected - resetting daily streak to 0');
                actions.setDailyStreak(0);
                // Note: We don't reset session streak as it persists across days until the timer is stopped
            } else if (dailyStreak > 0 && lastSessionDate === today) {
                console.log('📅 Same day - keeping current daily streak:', dailyStreak);
            } else if (dailyStreak > 0 && !lastSessionDate) {
                // Edge case: have a streak but no session history
                console.log('⚠️ Have daily streak but no session history - resetting to be safe');
                actions.setDailyStreak(0);
            } else {
                console.log('💤 No current daily streak - nothing to reset');
            }
        };

        // Calculate time until next midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();

        console.log('⏰ Time until midnight:', Math.floor(timeUntilMidnight / 1000 / 60), 'minutes');

        // Check immediately on mount (app startup)
        checkMidnight();

        // Set timeout for exactly midnight
        const midnightTimeout = setTimeout(() => {
            console.log('🌙 Midnight reached - resetting daily streak');
            actions.setDailyStreak(0);

            // Then check every 24 hours at midnight
            const dailyInterval = setInterval(() => {
                console.log('🌙 Daily midnight reset');
                actions.setDailyStreak(0);
            }, 24 * 60 * 60 * 1000);

            // Store interval reference for cleanup
            midnightTimeout._dailyInterval = dailyInterval;
        }, timeUntilMidnight);

        // Also check every hour as a backup (but only reset at actual midnight)
        const hourlyCheck = setInterval(() => {
            const currentHour = new Date().getHours();
            const currentMinute = new Date().getMinutes();

            // Only reset exactly at midnight (00:00)
            if (currentHour === 0 && currentMinute < 5) { // Small window to catch midnight
                console.log('🌙 Hourly backup midnight reset triggered');
                actions.setDailyStreak(0);
            }
        }, 60 * 60 * 1000);

        // Cleanup function
        return () => {
            clearTimeout(midnightTimeout);
            if (midnightTimeout._dailyInterval) {
                clearInterval(midnightTimeout._dailyInterval);
            }
            clearInterval(hourlyCheck);
        };
    }, [isLoaded, actions]); // Removed dailyStreak and timeHistory from dependencies to avoid frequent re-runs
};

// ================================
// POMODORO APP CORE COMPONENT
// ================================

const PomodoroAppCore = () => {
    const { state, actions } = usePomodoroContext(); // Get actions properly
    const { isLoaded, showInstructions } = state;

    // Initialize data persistence
    useDataPersistence();

    // Setup midnight streak reset
    useMidnightStreakReset();

    // Show loading screen while data is being loaded
    if (!isLoaded) {
        return <LoadingScreen />;
    }

    return (
        <MainLayout>
            {/* Instructions Modal */}
            <InstructionsModalPortal
                isOpen={showInstructions}
                onClose={() => actions.setShowInstructions(false)} // Use actions properly
            />

            {/* Main Tab Content */}
            <TabContentRouter />
        </MainLayout>
    );
};

// ================================
// MAIN POMODORO APP COMPONENT
// ================================

const PomodoroApp = () => {
    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}>
            {/* Title Bar - Uncomment if TitleBar component is available */}
            {/* <TitleBar /> */}

            <PomodoroProvider>
                <PomodoroAppCore />
            </PomodoroProvider>
        </div>
    );
};

// ================================
// EXPORT COMPONENT
// ================================

export default PomodoroApp;

// ================================
// USAGE INSTRUCTIONS
// ================================

/*
USAGE INSTRUCTIONS FOR THE REFACTORED POMODORO APP:

1. FILE STRUCTURE:
   Create separate files for each part and import them as needed:
   
   - part1-context.jsx      (Types, Constants, Context, Reducer)
   - part2-hooks.jsx        (Custom Hooks)
   - part3-utilities.jsx    (Utility Functions and Small Components)
   - part4-modals.jsx       (Modal Components)
   - part5-timer.jsx        (Timer Display and Controls)
   - part6-tasks.jsx       (Task Management Components)
   - part7-analytics.jsx    (Analytics Components)
   - part8-history.jsx      (History Components)
   - part9-layout.jsx       (Navigation and Layout)
   - part10-main.jsx        (Main App Component)

2. IMPORTS BETWEEN FILES:
   Each part imports only what it needs from other parts. The dependency flow is:
   
   part1 → (no dependencies)
   part2 → part1
   part3 → part1, part2
   part4 → (standalone)
   part5 → part1, part2, part3
   part6 → part1, part2, part3
   part7 → part1, part2, part3
   part8 → part1, part2, part3
   part9 → part1, part2, part3
   part10 → all parts

3. BENEFITS OF THIS REFACTOR:
   - Much smaller, focused components
   - Easier to test individual parts
   - Better code reusability
   - Improved maintainability
   - Clearer separation of concerns
   - Better performance (smaller re-render scopes)
   - Easier for new developers to understand

4. FUNCTIONALITY PRESERVED:
   - All original functionality is maintained
   - Same UI design and user experience
   - Same data persistence behavior
   - Same timer logic and behavior
   - Same task management features
   - Same analytics and history features

5. ADDITIONAL IMPROVEMENTS:
   - Better error handling with ErrorBoundary
   - Loading states for better UX
   - More robust state management with useReducer
   - Better TypeScript-style documentation with JSDoc
   - More modular and reusable components

To use this refactored version, simply replace your original component with these 10 parts, ensuring proper imports between files.
*/