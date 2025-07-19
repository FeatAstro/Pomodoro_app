// ================================
// PART 4: MODAL COMPONENTS
// ================================

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    X, HelpCircle, Target, Zap, Flame, Download, Upload, FileText
} from 'lucide-react';

// ================================
// INSTRUCTIONS MODAL COMPONENT
// ================================

/**
 * Instructions Modal Component - Portal-based modal for app instructions
 * Shows how to use the app and share data with friends
 */
export const InstructionsModalPortal = ({ isOpen, onClose }) => {
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
                                <li>• <strong>Streaks:</strong> Session and daily progress tracking</li>
                                <li>• Data is only saved when you stop the timer</li>
                            </ul>
                        </div>

                        {/* Session & Streak System */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Session & Streak System
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li>• <strong>Session Streaks <Zap className="w-3 h-3 inline text-yellow-400" />:</strong> Consecutive completed focus sessions</li>
                                <li>• <strong>Daily Streaks 🔥:</strong> Cumulative daily focus progress (25min = 0.5, 50min = 1.0)</li>
                                <li>• <strong>Session tracking:</strong> Only counts when you complete full timer cycles</li>
                                <li>• <strong>Stopping the timer</strong> resets session streak but saves your progress</li>
                                <li>• <strong>Daily streaks</strong> automatically reset at midnight</li>
                                <li>• Data is permanently saved when you press "Stop"</li>
                            </ul>
                        </div>

                        {/* Streak Icons Explanation */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-400" />
                                Understanding Your Streaks
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-500/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-yellow-400" />
                                        <span className="font-semibold text-yellow-300">Session Streak (Lightning)</span>
                                    </div>
                                    <p className="text-yellow-200 text-xs">
                                        Counts consecutive completed focus sessions in your current work period.
                                        Resets when you stop the timer, perfect for tracking momentum during intensive work sessions.
                                    </p>
                                </div>
                                <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-500/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">🔥</span>
                                        <span className="font-semibold text-orange-300">Daily Streak (Fire)</span>
                                    </div>
                                    <p className="text-orange-200 text-xs">
                                        Accumulates throughout the day as you complete focus sessions.
                                        Persists across multiple work sessions and resets at midnight. Great for daily goal tracking!
                                    </p>
                                </div>
                            </div>
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
                                    <li>• All your focus sessions with session and streak counts</li>
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
                                Sharing & Competition Ideas
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p>Great ways to use the export/import feature:</p>
                                <ul className="space-y-1 pl-4">
                                    <li>• <strong>Streak competitions:</strong> Compare session and daily streaks with friends</li>
                                    <li>• <strong>Productivity challenges:</strong> Set weekly focus time goals and share results</li>
                                    <li>• <strong>Study groups:</strong> Track collective progress on projects</li>
                                    <li>• <strong>Accountability partners:</strong> Share your daily achievements</li>
                                    <li>• <strong>Progress backup:</strong> Save your data before trying new focus strategies</li>
                                    <li>• <strong>Device sync:</strong> Transfer your streaks between computers</li>
                                    <li>• <strong>Team motivation:</strong> Create office-wide focus challenges</li>
                                </ul>
                                <div className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/30 mt-3">
                                    <p className="text-indigo-300 text-xs">
                                        💡 <strong>Pro tip:</strong> Your exported file shows max streaks achieved, total focus time,
                                        and detailed session breakdowns - perfect for sharing achievements or analyzing your productivity patterns!
                                    </p>
                                </div>
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
// CONFIRMATION MODAL COMPONENT
// ================================

/**
 * Reusable Confirmation Modal Component
 */
export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default" // "default", "danger", "warning"
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    const variantStyles = {
        default: {
            button: "bg-indigo-500 hover:bg-indigo-600",
            icon: "text-indigo-400"
        },
        danger: {
            button: "bg-red-500 hover:bg-red-600",
            icon: "text-red-400"
        },
        warning: {
            button: "bg-yellow-500 hover:bg-yellow-600",
            icon: "text-yellow-400"
        }
    };

    const styles = variantStyles[variant];

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-700">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <HelpCircle className={`w-5 h-5 ${styles.icon}`} />
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full flex items-center justify-center transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-500 transition-all duration-200 font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-3 text-white rounded-xl transition-all duration-200 font-medium ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ================================
// LOADING MODAL COMPONENT
// ================================

/**
 * Loading Modal Component - Shows during data operations
 */
export const LoadingModal = ({ isOpen, message = "Loading..." }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 text-center">
                {/* Animated Spinner */}
                <div className="w-12 h-12 mx-auto mb-4">
                    <div className="w-full h-full border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>

                {/* Loading Message */}
                <h2 className="text-xl font-bold text-white mb-2">{message}</h2>
                <p className="text-gray-400 text-sm">Please wait...</p>
            </div>
        </div>,
        document.body
    );
};

// ================================
// SUCCESS MODAL COMPONENT
// ================================

/**
 * Success Modal Component - Shows success messages with auto-dismiss
 */
export const SuccessModal = ({
    isOpen,
    onClose,
    title = "Success!",
    message,
    autoClose = true,
    autoCloseDelay = 3000
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, autoCloseDelay, onClose]);

    if (!mounted || !isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-700">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 text-green-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full flex items-center justify-center transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
                    {autoClose && (
                        <div className="mt-3 text-xs text-gray-500">
                            This message will close automatically in {autoCloseDelay / 1000} seconds.
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                {!autoClose && (
                    <div className="p-4 border-t border-gray-700">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-medium"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};