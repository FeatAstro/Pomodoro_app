// ================================
// UPDATED PART 11: TITLE BAR FOR TAURI V2
// ================================

import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2, Minimize2 } from 'lucide-react';

// ================================
// TITLE BAR COMPONENT FOR TAURI V2
// ================================

/**
 * Title Bar Component - Custom window controls for Tauri v2 applications
 * Provides minimize, maximize, and close functionality
 */
const TitleBar = () => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isTauriAvailable, setIsTauriAvailable] = useState(false);

    // Check if Tauri APIs are available (v2)
    useEffect(() => {
        const checkTauri = async () => {
            try {
                // More comprehensive check for Tauri v2
                const isTauri = typeof window !== 'undefined' &&
                    (window.__TAURI__ || window.__TAURI_INTERNALS__);

                if (isTauri) {
                    console.log('Tauri environment detected');
                    setIsTauriAvailable(true);

                    // Import Tauri v2 APIs with proper error handling
                    const { Window } = await import('@tauri-apps/api/window');
                    const currentWindow = Window.getCurrent();

                    // Check initial window state
                    try {
                        const maximized = await currentWindow.isMaximized();
                        setIsMaximized(maximized);
                        console.log('Initial maximized state:', maximized);
                    } catch (error) {
                        console.warn('Could not get window state:', error);
                    }

                    // Listen for window resize events
                    try {
                        const unlisten = await currentWindow.onResized(async () => {
                            try {
                                const maximized = await currentWindow.isMaximized();
                                setIsMaximized(maximized);
                            } catch (error) {
                                console.warn('Could not check maximized state:', error);
                            }
                        });

                        // Return cleanup function that properly handles the unlisten function
                        return unlisten;
                    } catch (error) {
                        console.warn('Could not set up resize listener:', error);
                        return null;
                    }
                } else {
                    console.log('Not in Tauri environment');
                    setIsTauriAvailable(false);
                }
            } catch (error) {
                console.log('Tauri APIs not available - running in web mode:', error);
                setIsTauriAvailable(false);
            }
        };

        const cleanup = checkTauri();

        // Return cleanup function
        return () => {
            if (cleanup && typeof cleanup.then === 'function') {
                cleanup.then(fn => {
                    if (fn && typeof fn === 'function') {
                        fn();
                    }
                });
            }
        };
    }, []);

    // Window control handlers for Tauri v2
    const handleMinimize = async () => {
        if (!isTauriAvailable) return;

        try {
            const { Window } = await import('@tauri-apps/api/window');
            const currentWindow = Window.getCurrent();
            await currentWindow.minimize();
            console.log('Window minimized');
        } catch (error) {
            console.error('Failed to minimize window:', error);
        }
    };

    const handleMaximize = async () => {
        if (!isTauriAvailable) return;

        try {
            const { Window } = await import('@tauri-apps/api/window');
            const currentWindow = Window.getCurrent();
            await currentWindow.toggleMaximize();
            console.log('Window maximize toggled');
        } catch (error) {
            console.error('Failed to maximize window:', error);
        }
    };

    const handleClose = async () => {
        if (!isTauriAvailable) return;

        try {
            const { Window } = await import('@tauri-apps/api/window');
            const currentWindow = Window.getCurrent();
            await currentWindow.close();
            console.log('Window close requested');
        } catch (error) {
            console.error('Failed to close window:', error);
        }
    };

    // Always render the title bar in development for testing
    // Remove this condition if you only want it to show in Tauri
    const shouldRender = isTauriAvailable || process.env.NODE_ENV === 'development';

    if (!shouldRender) {
        return null;
    }

    return (
        <div
            className="flex justify-between items-center h-8 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 select-none relative z-50"
            data-tauri-drag-region
            style={{
                // Ensure the title bar is always on top and properly positioned
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                WebkitAppRegion: 'drag' // Webkit equivalent for dragging
            }}
        >
            {/* Left side - App title */}
            <div className="flex items-center px-4" style={{ WebkitAppRegion: 'no-drag' }}>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm"></div>
                    <span className="text-sm font-medium text-white/80">Focus Timer</span>
                </div>
            </div>

            {/* Center - Draggable area */}
            <div
                className="flex-1"
                data-tauri-drag-region
                style={{
                    WebkitAppRegion: 'drag',
                    userSelect: 'none',
                    pointerEvents: 'auto'
                }}
                onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMaximize();
                }}
            ></div>

            {/* Right side - Window controls */}
            <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
                {/* Minimize Button */}
                <button
                    onClick={handleMinimize}
                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 group"
                    title="Minimize"
                    disabled={!isTauriAvailable}
                >
                    <Minus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </button>

                {/* Maximize/Restore Button */}
                <button
                    onClick={handleMaximize}
                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 group"
                    title={isMaximized ? "Restore" : "Maximize"}
                    disabled={!isTauriAvailable}
                >
                    {isMaximized ? (
                        <Minimize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                    ) : (
                        <Maximize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                    )}
                </button>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/80 transition-all duration-200 group"
                    title="Close"
                    disabled={!isTauriAvailable}
                >
                    <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;