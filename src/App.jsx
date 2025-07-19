import React from 'react';
import TitleBar from './components/pomodoro/part11-titlebar.jsx';
import PomodoroApp from './components/pomodoro/part10-main.jsx';

function App() {
    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
        }}>
            <TitleBar />
            <PomodoroApp />
        </div>
    );
}

export default App;