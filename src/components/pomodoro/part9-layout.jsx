// ================================
// PART 9: NAVIGATION AND LAYOUT COMPONENTS
// ================================

import React, { useEffect } from 'react';
import { Target, BarChart3, History } from 'lucide-react';
import { usePomodoroContext } from './part1-context.jsx';
import { TABS } from './part1-context.jsx';
import { ProgressBar } from './part3-utilities.jsx';
import { useAnalytics } from './part2-hooks.jsx';

// ================================
// CLOCK AND DATE DISPLAY COMPONENT
// ================================

export const ClockAndDateDisplay = () => {
    const { state, actions } = usePomodoroContext();
    const { currentTime } = state;

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => actions.updateCurrentTime(), 1000);
        return () => clearInterval(timer);
    }, [actions]);

    return (
        <>
            {/* Digital Clock - Top Left */}
            <div className="absolute top-10 left-6 z-10">
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
            <div className="absolute top-10 right-6 z-10">
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
        </>
    );
};

// ================================
// NAVIGATION TABS COMPONENT
// ================================

export const NavigationTabs = () => {
    const { state, actions } = usePomodoroContext();
    const { activeTab } = state;

    const tabs = [
        { key: TABS.TIMER, label: 'Timer', icon: Target },
        { key: TABS.ANALYTICS, label: 'Analytics', icon: BarChart3 },
        { key: TABS.HISTORY, label: 'History', icon: History }
    ];

    return (
        <div className="flex justify-center mb-8">
            <div className="bg-gray-800/40 backdrop-blur-md rounded-full p-1 border border-[#1a2331] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] transform hover:scale-105 hover:translate-y-[-2px] transition-all duration-500 ease-out">
                <div className="flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => actions.setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm flex items-center gap-2 ${activeTab === tab.key
                                ? 'bg-indigo-500 text-white shadow-lg scale-105'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ================================
// MAIN HEADER COMPONENT
// ================================

export const MainHeader = () => {
    const { totalTimeToday, todaySessionCount } = useAnalytics();
    const { state } = usePomodoroContext();
    const { dailyGoal } = state;

    return (
        <>
            {/* Clock and Date Display */}
            <ClockAndDateDisplay />

            {/* Main Content Container */}
            <div className="w-full px-4 pt-4">
                {/* Navigation Tabs */}
                <NavigationTabs />

                {/* Progress Bar (only show on timer tab) */}
                {state.activeTab === TABS.TIMER && (
                    <ProgressBar
                        totalTimeToday={totalTimeToday}
                        dailyGoal={dailyGoal}
                        todaySessionCount={todaySessionCount}
                    />
                )}
            </div>
        </>
    );
};

// ================================
// MAIN CONTENT WRAPPER COMPONENT
// ================================

export const MainContentWrapper = ({ children }) => {
    return (
        <div className="pt-8" style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', minHeight: '100vh' }}>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                {children}
            </div>
        </div>
    );
};

// ================================
// TAB CONTENT CONTAINER COMPONENT
// ================================

export const TabContentContainer = ({ children }) => {
    return (
        <div className="w-full px-4">
            {children}
        </div>
    );
};

// ================================
// LOADING SCREEN COMPONENT
// ================================

export const LoadingScreen = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4">
                    <div className="w-full h-full border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
                <div className="text-white text-xl">Loading your data...</div>
                <div className="text-gray-400 text-sm mt-2">Please wait while we initialize your workspace</div>
            </div>
        </div>
    );
};

// ================================
// ERROR BOUNDARY COMPONENT
// ================================

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error for debugging
        console.error('Pomodoro App Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 text-red-400">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                The application encountered an unexpected error. Please refresh the page to try again.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all duration-200 font-medium"
                            >
                                Refresh Page
                            </button>

                            {/* Development error details */}
                            {process.env.NODE_ENV === 'development' && (
                                <details className="mt-4 text-left">
                                    <summary className="text-sm text-gray-400 cursor-pointer">Error Details</summary>
                                    <div className="mt-2 p-3 bg-gray-900 rounded text-xs text-red-300 font-mono">
                                        <div className="mb-2">
                                            <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                                        </div>
                                        <div>
                                            <strong>Stack:</strong>
                                            <pre className="whitespace-pre-wrap">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
};

// ================================
// MAIN LAYOUT COMPONENT
// ================================

export const MainLayout = ({ children }) => {
    return (
        <ErrorBoundary>
            <MainContentWrapper>
                <MainHeader />
                <TabContentContainer>
                    {children}
                </TabContentContainer>
            </MainContentWrapper>
        </ErrorBoundary>
    );
};