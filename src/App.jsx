import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Play, Pause, Square, Plus, Check, Clock, BarChart3, Calendar, CalendarDays, CalendarRange, Target, X, History, Flame, Bell, HelpCircle, Download, Upload, FileText } from 'lucide-react';
import { appDataDir, join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';

// Memoized sub-components
const TaskItem = memo(({ task, onComplete, onDelete, isActive = false }) => {
  return (
    <div className={`group relative overflow-hidden ${isActive ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10' : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10'} backdrop-blur-sm border ${isActive ? 'border-blue-500/20' : 'border-l-4 border-emerald-500/50'} rounded-xl p-3 hover:from-${isActive ? 'blue' : 'emerald'}-500/15 hover:to-${isActive ? 'cyan' : 'teal'}-500/15 transition-all duration-300`}>
      {!isActive && <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full -translate-y-6 translate-x-6"></div>}
      <div className="relative flex items-center gap-3">
        {isActive ? (
          <>
            <button
              onClick={() => onComplete(task.id, task.text)}
              className="w-6 h-6 rounded-full border-2 border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-all duration-200 group/check hover:shadow-[0_0_8px_rgba(59,130,246,0.4)]"
            >
              <Check className="w-4 h-4 text-blue-400 opacity-0 group-hover/check:opacity-100 transition-opacity duration-200" />
            </button>
            <span className="flex-1 text-white/90 font-medium group-hover:text-white transition-colors duration-200">
              {task.text}
              {task.accumulatedTime > 0 && (
                <span className="text-blue-400/60 text-xs ml-1">
                  ({Math.round(task.accumulatedTime)}m)
                </span>
              )}
            </span>
          </>
        ) : (
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
        <button
          onClick={() => onDelete(task.id)}
          className="w-6 h-6 text-white/30 hover:text-red-400 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

const SessionHistoryItem = memo(({ session, onDelete }) => {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg shadow-sm">
      <div className="flex-1">
        <div className="font-medium text-white">{session.task}</div>
        <div className="flex gap-4 mt-1 text-sm">
          <div className="flex items-center gap-1 text-indigo-400 font-medium">
            <Target className="w-3 h-3" />
            {session.workDuration || session.duration || 0} min work
            {session.breakDuration > 0 && <span className="text-green-400"> + {session.breakDuration}m break</span>}
          </div>
          <div className="flex items-center gap-1 text-purple-400 font-medium">
            <Flame className="w-3 h-3" />
            {session.sessionCount || 0} sessions
          </div>
          {session.completedFully && (
            <div className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
              ✓ Full cycle
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm text-gray-400">
            {new Date(session.timestamp).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <button
          onClick={() => onDelete(session.id)}
          className="w-6 h-6 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});

const TaskHistoryItem = memo(({ task, onDelete }) => {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg shadow-sm">
      <div className="flex-1">
        <div className="font-medium text-white">{task.task}</div>
        <div className="flex gap-4 mt-1 text-sm">
          <div className="flex items-center gap-1 text-indigo-400 font-medium">
            <Target className="w-3 h-3" />
            {task.duration} min
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm text-gray-400">
            {new Date(task.timestamp).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="w-6 h-6 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});

// Custom hooks
const useTimer = (mode, isBreak, onTimerComplete, onTimeWarning, testMode) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionElapsedTime, setSessionElapsedTime] = useState(0);
  const intervalRef = useRef(null);

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

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (mode === 'stopwatch') {
            const newTime = prev + 1;
            setSessionElapsedTime(newTime);
            return newTime;
          } else {
            const newTime = prev - 1;

            // Handle warnings
            if (!testMode && onTimeWarning) {
              onTimeWarning(newTime);
            }

            if (newTime <= 0) {
              onTimerComplete();
              return 0;
            }
            const totalTime = mode === '25/5' ? (isBreak ? 5 * 60 : 25 * 60) : (isBreak ? 10 * 60 : 50 * 60);
            setSessionElapsedTime(totalTime - newTime);
            return newTime;
          }
        });
      }, testMode ? 20 : 1000); // 50x faster in test mode (1000ms / 50 = 20ms)
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, isBreak, onTimerComplete, onTimeWarning, testMode]);

  return { timeLeft, isRunning, setIsRunning, sessionElapsedTime, setTimeLeft, setSessionElapsedTime };
};

const useSound = () => {
  const audioContextRef = useRef(null);

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

const PomodoroApp = () => {
  // Test mode - accelerates time by 50x
  // 25 min = 30 seconds, 5 min = 6 seconds, 50 min = 60 seconds, 10 min = 12 seconds
  const [testMode, setTestMode] = useState(false);

  // Timer states
  const [mode, setMode] = useState('25/5');
  const [isBreak, setIsBreak] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedBreak, setCompletedBreak] = useState(false);
  const [completedWorkSession, setCompletedWorkSession] = useState(null);

  // State
  const [dailyGoal, setDailyGoal] = useState(480);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [timeHistory, setTimeHistory] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);

  // Streak tracking
  const [currentSessionStreak, setCurrentSessionStreak] = useState(0);
  const [longestSessionStreak, setLongestSessionStreak] = useState(0);
  const [lastSessionDate, setLastSessionDate] = useState(null);

  const [viewMode, setViewMode] = useState('week');
  const [activeTab, setActiveTab] = useState('timer');
  const [dataFilePath, setDataFilePath] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Sound hooks
  const { playFinishSound, playSessionStartSound, playBreakWarningSound, playAlmostSound } = useSound();

  // Notification helper
  const showNotification = useCallback((title, body, icon = '🍅') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'pomodoro-timer',
        requireInteraction: false,
        silent: false
      });
    }
  }, []);

  // Time warning handler
  const handleTimeWarning = useCallback((timeLeft) => {
    if (timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
      playAlmostSound();
    }

    if (isBreak && timeLeft === 30) {
      playBreakWarningSound();
      showNotification('Break ending soon!', 'Get ready to focus again in 30 seconds', '⏰');
    }
  }, [isBreak, playAlmostSound, playBreakWarningSound, showNotification]);

  // Callbacks
  const updateSessionStreak = useCallback((sessionType) => {
    const sessionValue = sessionType === '25/5' ? 0.5 : 1;
    const newStreak = currentSessionStreak + sessionValue;
    setCurrentSessionStreak(newStreak);

    if (newStreak > longestSessionStreak) {
      setLongestSessionStreak(newStreak);
    }

    setLastSessionDate(new Date().toISOString());
  }, [currentSessionStreak, longestSessionStreak]);

  const resetStreak = useCallback(() => {
    setCurrentSessionStreak(0);
  }, []);

  const saveTimeSession = useCallback((workDuration, breakDuration = 0, timestamp, sessionType, addToTasks = true) => {
    const taskForSession = tasks.length > 0 ? tasks[0].text : 'No Title';

    let sessionCount;
    if (sessionType === '25/5') {
      sessionCount = 0.5;
    } else if (sessionType === '50/10') {
      sessionCount = 1;
    } else {
      sessionCount = Math.max(0.5, Math.floor(workDuration / 25) * 0.5);
    }

    const newSession = {
      id: Date.now() + Math.random(),
      workDuration: workDuration,
      breakDuration: breakDuration,
      totalDuration: workDuration + breakDuration,
      timestamp: timestamp.toISOString(),
      task: taskForSession,
      sessionCount: sessionCount,
      sessionType: sessionType,
      completedFully: breakDuration > 0
    };

    setTimeHistory(prev => {
      const exists = prev.some(session =>
        Math.abs(new Date(session.timestamp).getTime() - new Date(newSession.timestamp).getTime()) < 5000 &&
        session.task === newSession.task &&
        Math.abs(session.workDuration - newSession.workDuration) < 2
      );

      if (exists) return prev;
      return [...prev, newSession];
    });

    if (addToTasks && workDuration > 0) {
      const timeToAdd = breakDuration > 0 ? workDuration + breakDuration : workDuration;
      setTasks(prev => prev.map(task => ({
        ...task,
        accumulatedTime: (task.accumulatedTime || 0) + timeToAdd
      })));
    }
  }, [tasks]);

  // Timer complete handler
  // Timer complete handler
  const handleTimerComplete = useCallback(() => {
    if (!isBreak) {
      playFinishSound();
      showNotification('Focus session complete!', `Great work! You've completed a ${mode === '25/5' ? '25' : '50'} minute focus session.`, '✅');

      setIsBreak(true);
      setCompletedBreak(false);
      const workTime = mode === '25/5' ? 25 : 50;
      setCompletedWorkSession({
        workDuration: workTime,
        timestamp: new Date(),
        mode: mode
      });

      setTimeout(() => {
        showNotification('Break time!', `Take a ${mode === '25/5' ? '5' : '10'} minute break. You've earned it!`, '☕');
      }, 1000);
    } else {
      playSessionStartSound();
      setCompletedBreak(true);

      updateSessionStreak(mode);

      if (completedWorkSession) {
        const breakTime = mode === '25/5' ? 5 : 10;
        const totalSessionTime = completedWorkSession.workDuration + breakTime;

        setTasks(prev => prev.map(task => ({
          ...task,
          accumulatedTime: (task.accumulatedTime || 0) + totalSessionTime
        })));

        saveTimeSession(
          completedWorkSession.workDuration,
          breakTime,
          completedWorkSession.timestamp,
          mode,
          false
        );
        setCompletedWorkSession(null);
      }

      showNotification('Break complete!', 'Time to get back to work. Stay focused!', '🎯');
      setIsBreak(false);
    }
  }, [isBreak, mode, completedWorkSession, playFinishSound, playSessionStartSound, showNotification, updateSessionStreak, saveTimeSession]);

  // Timer hook
  const timerState = useTimer(mode, isBreak, handleTimerComplete, handleTimeWarning, testMode);
  const { timeLeft, isRunning, setIsRunning, sessionElapsedTime, setTimeLeft, setSessionElapsedTime } = timerState;

  // Initialize data file path
  useEffect(() => {
    const initDataPath = async () => {
      try {
        const appDataDirPath = await appDataDir();
        try {
          await mkdir(appDataDirPath, { recursive: true });
        } catch (e) {
          console.log('Directory might already exist:', e);
        }
        const filePath = await join(appDataDirPath, 'pomodoro-data.json');
        setDataFilePath(filePath);
      } catch (error) {
        console.error('Error setting up data path:', error);
      }
    };
    initDataPath();
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!dataFilePath) return;

      try {
        const fileExists = await exists(dataFilePath);
        if (!fileExists) {
          setIsLoaded(true);
          return;
        }

        const fileContent = await readTextFile(dataFilePath);
        const data = JSON.parse(fileContent);

        if (data.dailyGoal !== undefined) setDailyGoal(data.dailyGoal);
        if (data.tasks) setTasks(data.tasks);
        if (data.completedTasks) {
          setCompletedTasks(data.completedTasks.map(task => ({
            ...task,
            timestamp: new Date(task.timestamp)
          })));
        }
        if (data.timeHistory) setTimeHistory(data.timeHistory);
        if (data.taskHistory) setTaskHistory(data.taskHistory);
        if (data.currentSessionStreak !== undefined) setCurrentSessionStreak(data.currentSessionStreak);
        if (data.longestSessionStreak !== undefined) setLongestSessionStreak(data.longestSessionStreak);
        if (data.lastSessionDate) setLastSessionDate(data.lastSessionDate);

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoaded(true);
      }
    };

    if (dataFilePath && !isLoaded) {
      loadData();
    }
  }, [dataFilePath, isLoaded]);

  // Save data
  const saveData = useCallback(async () => {
    if (!dataFilePath) return false;

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

    try {
      const jsonString = JSON.stringify(data, null, 2);
      await writeTextFile(dataFilePath, jsonString);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }, [dataFilePath, dailyGoal, tasks, completedTasks, timeHistory, taskHistory, currentSessionStreak, longestSessionStreak, lastSessionDate]);

  // Auto-save on data changes
  useEffect(() => {
    if (isLoaded) saveData();
  }, [isLoaded, saveData]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
  }, [sessionStartTime]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const stopTimer = useCallback(() => {
    setIsRunning(false);

    let workDuration = 0;

    if (mode === 'stopwatch') {
      workDuration = Math.floor(sessionElapsedTime / 60);
      if (workDuration >= 1) {
        saveTimeSession(workDuration, 0, new Date(), mode, true);
      }
    } else {
      if (isBreak) {
        if (completedWorkSession) {
          setTasks(prev => prev.map(task => ({
            ...task,
            accumulatedTime: (task.accumulatedTime || 0) + completedWorkSession.workDuration
          })));

          saveTimeSession(
            completedWorkSession.workDuration,
            0,
            completedWorkSession.timestamp,
            mode,
            false
          );
          setCompletedWorkSession(null);
        }
      } else {
        workDuration = Math.floor(sessionElapsedTime / 60);
        if (workDuration >= 1) {
          saveTimeSession(workDuration, 0, new Date(), mode, true);
        }
      }
    }

    resetStreak();

    setTimeLeft(mode === '25/5' ? 25 * 60 : mode === '50/10' ? 50 * 60 : 0);
    setIsBreak(false);
    setSessionStartTime(null);
    setSessionElapsedTime(0);
    setCompletedBreak(false);
    setCompletedWorkSession(null);
  }, [mode, isBreak, sessionElapsedTime, completedWorkSession, saveTimeSession, resetStreak]);

  const addTask = useCallback(() => {
    if (currentTask.trim()) {
      setTasks(prev => [...prev, {
        id: Date.now(),
        text: currentTask,
        completed: false,
        accumulatedTime: 0
      }]);
      setCurrentTask('');
    }
  }, [currentTask]);

  const saveCompletedTask = useCallback((task) => {
    const taskObj = tasks.find(t => t.text === task);
    const totalTime = taskObj ? (taskObj.accumulatedTime || 0) : 0;

    const newTask = {
      id: Date.now() + Math.random(),
      task: task,
      timestamp: new Date().toISOString(),
      duration: totalTime > 0 ? Math.round(totalTime) : (mode === 'stopwatch' ? Math.floor(timeLeft / 60) : (mode === '25/5' ? 25 : 50) - Math.floor(timeLeft / 60))
    };

    setTaskHistory(prev => [...prev, newTask]);
  }, [tasks, mode, timeLeft]);

  const completeTask = useCallback((taskId, taskText) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setCompletedTasks(prev => [...prev, { id: taskId, text: taskText, timestamp: new Date() }]);
    saveCompletedTask(taskText);
  }, [saveCompletedTask]);

  const deleteTimeSession = useCallback((sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setTimeHistory(prev => prev.filter(session => session.id !== sessionId));
    }
  }, []);

  const deleteTask = useCallback((taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTaskHistory(prev => prev.filter(task => task.id !== taskId));
    }
  }, []);

  const deleteCompletedTask = useCallback((taskId) => {
    if (window.confirm('Are you sure you want to delete this completed task?')) {
      setCompletedTasks(prev => prev.filter(task => task.id !== taskId));
    }
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoized calculations
  const totalTimeToday = useMemo(() => {
    return timeHistory
      .filter(entry => entry.timestamp.split('T')[0] === new Date().toISOString().split('T')[0])
      .reduce((total, entry) => total + (entry.totalDuration || entry.duration || 0), 0);
  }, [timeHistory]);

  const todaySessionCount = useMemo(() => {
    return timeHistory.filter(s => s.timestamp.split('T')[0] === new Date().toISOString().split('T')[0]).length;
  }, [timeHistory]);

  const getChartData = useCallback((type) => {
    const now = new Date();
    let data = [];
    let sourceData = type === 'time' ? timeHistory : taskHistory;

    if (viewMode === 'week') {
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
            ? Math.round((dayData.reduce((sum, item) => sum + (item.totalDuration || item.duration || 0), 0) / 60) * 10) / 10
            : dayData.length
        });
      }
    } else if (viewMode === 'month') {
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
            ? Math.round((dayData.reduce((sum, item) => sum + (item.totalDuration || item.duration || 0), 0) / 60) * 10) / 10
            : dayData.length
        });
      }
    } else if (viewMode === 'year') {
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
            ? Math.round((monthData.reduce((sum, item) => sum + (item.totalDuration || item.duration || 0), 0) / 60) * 10) / 10
            : monthData.length
        });
      }
    }

    return data;
  }, [viewMode, timeHistory, taskHistory]);

  const exportData = useCallback(() => {
    const data = {
      timeHistory,
      taskHistory,
      tasks,
      completedTasks,
      dailyGoal,
      currentSessionStreak,
      longestSessionStreak,
      lastSessionDate,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [timeHistory, taskHistory, tasks, completedTasks, dailyGoal, currentSessionStreak, longestSessionStreak, lastSessionDate]);

  const importData = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (window.confirm('This will replace all your current data. Are you sure?')) {
          if (data.timeHistory) setTimeHistory(data.timeHistory);
          if (data.taskHistory) setTaskHistory(data.taskHistory);
          if (data.tasks) setTasks(data.tasks);
          if (data.completedTasks) {
            setCompletedTasks(data.completedTasks.map(task => ({
              ...task,
              timestamp: new Date(task.timestamp)
            })));
          }
          if (data.dailyGoal) setDailyGoal(data.dailyGoal);
          if (data.currentSessionStreak !== undefined) setCurrentSessionStreak(data.currentSessionStreak);
          if (data.longestSessionStreak !== undefined) setLongestSessionStreak(data.longestSessionStreak);
          if (data.lastSessionDate) setLastSessionDate(data.lastSessionDate);

          alert('Data imported successfully!');
        }
      } catch (error) {
        alert('Invalid file format. Please select a valid Pomodoro data file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const clearAllData = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setTimeHistory([]);
      setTaskHistory([]);
      setTasks([]);
      setCompletedTasks([]);
      setDailyGoal(480);
      setCurrentSessionStreak(0);
      setLongestSessionStreak(0);
      setLastSessionDate(null);
    }
  }, []);

  // Instructions Modal Component
  const InstructionsModal = memo(() => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white">How to Use & Share Data</h2>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full flex items-center justify-center transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Basic Usage
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• Choose between 25min (Pomodoro) or 50min focus sessions</li>
                <li>• Add tasks to work on during your sessions</li>
                <li>• Complete full cycles (work + break) to earn streak points</li>
                <li>• Your data is automatically saved to your device</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Streak System
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• 25min session = 0.5 streak points</li>
                <li>• 50min session = 1.0 streak points</li>
                <li>• Streak resets to 0 if you stop the timer early</li>
                <li>• Streak tracks consecutive sessions in your current work session</li>
              </ul>
            </div>

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

            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                File Format
              </h3>
              <div className="space-y-2 text-sm">
                <p>The exported file is in JSON format and contains:</p>
                <ul className="space-y-1 pl-4">
                  <li>• All your focus sessions and their durations</li>
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

          <div className="mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all duration-200 font-semibold"
            >
              Got it! Let's focus 🎯
            </button>
          </div>
        </div>
      </div>
    </div>
  ));

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading your data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      {showInstructions && <InstructionsModal />}

      {/* Digital Clock */}
      <div className="absolute top-6 left-6 z-10">
        <div className="text-2xl font-mono font-bold text-white drop-shadow-2xl" style={{
          textShadow: '0 0 20px rgba(99, 102, 241, 0.8), 0 0 40px rgba(99, 102, 241, 0.6), 0 0 60px rgba(99, 102, 241, 0.4)'
        }}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Date Display */}
      <div className="absolute top-6 right-6 z-10">
        <div className="text-right">
          <div className="text-3xl font-bold text-white mb-1 tracking-tight drop-shadow-2xl" style={{
            textShadow: '0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.4)'
          }}>
            {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </div>
          <div className="text-base font-light text-gray-300 drop-shadow-lg" style={{
            textShadow: '0 0 15px rgba(156, 163, 175, 0.6), 0 0 30px rgba(156, 163, 175, 0.4)'
          }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-4">
        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/40 backdrop-blur-md rounded-full p-1 border border-[#1a2331] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] transform hover:scale-105 hover:translate-y-[-2px] transition-all duration-500 ease-out">
            <div className="flex">
              <button
                onClick={() => setActiveTab('timer')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm flex items-center gap-2 ${activeTab === 'timer' ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
              >
                <Target className="w-4 h-4" />
                Timer
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
              >
                <History className="w-4 h-4" />
                History
              </button>
            </div>
          </div>
        </div>

        {/* Timer Tab */}
        {activeTab === 'timer' && (
          <div>
            <div className="mb-8">
              <div className="bg-gradient-to-br from-[#1a2331] to-[#0e111a] rounded-2xl border border-[#1a2331] shadow-[inset_0_1px_3px_rgba(255,255,255,0.05),0_35px_60px_-15px_rgba(0,0,0,0.5)] p-8 mb-6 relative">
                {/* Active Tasks Display */}
                <div className="absolute top-4 left-4 z-10 w-52">
                  {tasks.length > 0 && (
                    <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10 shadow-lg" style={{
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.25), 0 0 30px rgba(59, 130, 246, 0.08), inset 0 1px 2px rgba(255,255,255,0.05)'
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-medium text-white/90">Active Tasks</span>
                      </div>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {tasks.slice(0, 2).map((task, index) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <div
                              className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0"
                              style={{
                                animation: `tickleDot 1.5s ease-in-out infinite`,
                                animationDelay: `${index * 0.2}s`
                              }}
                            ></div>
                            <div className="flex-1 truncate">
                              <span className="text-white/80">{task.text}</span>
                              {task.accumulatedTime > 0 && (
                                <span className="text-blue-400/60 text-xs ml-1">
                                  ({Math.round(task.accumulatedTime)}m)
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {tasks.length > 2 && (
                          <div className="text-xs text-white/50 text-center pt-1">
                            +{tasks.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Streak Display */}
                <div className="absolute top-4 right-4 z-10 w-40">
                  <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10 shadow-lg" style={{
                    boxShadow: '0 0 15px rgba(251, 146, 60, 0.25), 0 0 30px rgba(251, 146, 60, 0.08), inset 0 1px 2px rgba(255,255,255,0.05)'
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-xs font-medium text-white/90">Session Streak</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <div className="text-center">
                        <div className="text-sm font-bold text-orange-400">{currentSessionStreak}</div>
                        <div className="text-xs text-white/60">Current</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-red-400">{longestSessionStreak}</div>
                        <div className="text-xs text-white/60">Best</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(Math.min(Math.floor(currentSessionStreak * 2), 4))].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-orange-400 rounded-full"
                          style={{
                            animationDelay: `${i * 150}ms`,
                            animation: `tickleDot 2s ease-in-out infinite`
                          }}
                        ></div>
                      ))}
                      {currentSessionStreak > 2 && (
                        <span className="text-xs text-orange-400 font-medium ml-1">+{Math.floor((currentSessionStreak - 2) * 2)}</span>
                      )}
                    </div>
                    <div className="text-xs text-white/50 text-center mt-1">
                      Stop timer = Reset to 0
                    </div>
                  </div>
                </div>

                <style jsx>{`
                  @keyframes tickleDot {
                    0%, 100% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                  }
                `}</style>

                {/* Timer Modes */}
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
                        className={`w-10 h-10 rounded-full text-1xl font-bold transition-all duration-300 ease-out ${mode === m.key ? 'bg-indigo-500 text-white shadow-[0_10px_25px_rgba(99,102,241,0.5)] scale-110 ring-2 ring-indigo-300' : 'bg-gray-600/60 text-gray-200 hover:bg-gray-500/70 hover:scale-105 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timer Display */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 w-80 h-80 rounded-full bg-indigo-500 blur-3xl opacity-25 scale-110"></div>
                      <div className="relative w-80 h-80 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-700 shadow-3xl flex items-center justify-center backdrop-blur-sm">
                        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"></div>

                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 320 320">
                          <circle cx="160" cy="160" r="140" fill="none" stroke="#374151" strokeWidth="10" className="opacity-30" />
                          <circle
                            cx="160" cy="160" r="140" fill="none" stroke="url(#gradient)" strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 140}`}
                            strokeDashoffset={mode === 'stopwatch' ? 0 : 2 * Math.PI * 140 * (1 - (sessionElapsedTime / (mode === '25/5' ? (isBreak ? 5 * 60 : 25 * 60) : (isBreak ? 10 * 60 : 50 * 60))))}
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

                        <div className="relative z-10 text-center">
                          <div className="text-7xl font-mono font-bold text-white mb-3 leading-none tracking-tight drop-shadow-2xl">
                            {formatTime(timeLeft)}
                          </div>
                          {isRunning && (
                            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-lg font-semibold ${isBreak ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'} backdrop-blur-sm`}>
                              <span className="text-xl">{isBreak ? '☕' : '🎯'}</span>
                              {isBreak ? 'Break Time' : 'Focus Time'}
                            </div>
                          )}
                          {testMode && (
                            <div className="absolute -top-2 -right-2 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full shadow-lg animate-pulse">
                              50x
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex gap-4 w-full max-w-md">
                      <button
                        onClick={startTimer}
                        disabled={isRunning}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white rounded-2xl font-bold text-base hover:bg-green-600 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-[0_10px_30px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95"
                      >
                        <Play className="w-5 h-5" />
                        Start
                      </button>
                      <button
                        onClick={pauseTimer}
                        disabled={!isRunning}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 text-white rounded-2xl font-bold text-base hover:bg-yellow-600 hover:shadow-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-[0_10px_30px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </button>
                      <button
                        onClick={stopTimer}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-2xl font-bold text-base hover:bg-red-600 hover:shadow-red-500/40 transition-all duration-300 ease-out shadow-[0_10px_30px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95"
                      >
                        <Square className="w-5 h-5" />
                        Stop
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-yellow-900/30 rounded-lg border border-yellow-500/30">
                  <label className="flex items-center gap-2 text-yellow-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testMode}
                      onChange={(e) => setTestMode(e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <span className="font-medium">🚀 Test Mode (50x faster)</span>
                  </label>
                  <p className="text-xs text-yellow-300/70 mt-1 ml-6">
                    Accelerates time by 50x for quick testing. A 25-minute session takes 30 seconds.
                  </p>
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className="p-4 mb-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <Target className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className="text-base font-bold text-white">
                      {todaySessionCount} sessions today
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex bg-indigo-500/10 items-center gap-2 px-4 py-2 border border-indigo-500/30 rounded-full shadow-inner backdrop-blur-sm">
                      <span className="text-sm font-medium text-white">Goal:</span>
                      <button
                        onClick={() => setDailyGoal(Math.max(60, dailyGoal - 60))}
                        className="w-6 h-6 rounded-full text-indigo-400 hover:text-white flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-white">{Math.floor(dailyGoal / 60)}h</span>
                      <button
                        onClick={() => setDailyGoal(Math.min(1440, dailyGoal + 60))}
                        className="w-6 h-6 rounded-full text-indigo-400 hover:text-white flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full backdrop-blur-sm">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-sm font-bold text-green-400">
                        {Math.floor(totalTimeToday / 60)}h {totalTimeToday % 60}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full shadow-lg"
                      style={{
                        width: `${Math.min((totalTimeToday / dailyGoal) * 100, 100)}%`,
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Task Input Section */}
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

                        {Notification.permission === 'default' && (
                          <button
                            onClick={() => Notification.requestPermission()}
                            className="group relative overflow-hidden px-5 py-3 bg-gradient-to-r from-yellow-500/80 to-orange-500/80 hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl transition-all duration-300 ease-out shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_40px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95"
                          >
                            <div className="relative flex items-center justify-center gap-2 font-semibold">
                              <Bell className="w-5 h-5" />
                              Enable Notifications
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Management Section */}
              <div className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Active Tasks */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl"></div>

                    <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)] p-6 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
                          <Check className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white/90 tracking-tight">Active Tasks</h3>
                        <div className="ml-auto px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                          <span className="text-sm font-medium text-blue-400">{tasks.length}</span>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        {tasks.length === 0 ? (
                          <div className="text-center py-8 px-4 rounded-xl bg-gray-700/20 border border-dashed border-white/10">
                            <Target className="w-8 h-8 mx-auto mb-3 text-white/30" />
                            <p className="text-white/40 text-sm">No active tasks</p>
                            <p className="text-white/30 text-xs mt-1">Add a task above to get started</p>
                          </div>
                        ) : (
                          tasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              onComplete={completeTask}
                              onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
                              isActive={true}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recently Completed */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>

                    <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)] p-6 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                          <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white/90 tracking-tight">Recently Completed</h3>
                        <div className="ml-auto px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                          <span className="text-sm font-medium text-emerald-400">{completedTasks.length}</span>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        {completedTasks.length === 0 ? (
                          <div className="text-center py-8 px-4 rounded-xl bg-gray-700/20 border border-dashed border-white/10">
                            <Check className="w-8 h-8 mx-auto mb-3 text-white/30" />
                            <p className="text-white/40 text-sm">No completed tasks yet</p>
                            <p className="text-white/30 text-xs mt-1">Complete tasks to see them here</p>
                          </div>
                        ) : (
                          completedTasks.slice(-5).reverse().map((task) => (
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

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-gray-800 rounded-xl shadow-xl p-8">
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

            <div className="flex justify-center mb-8">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-gray-700/50">
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'week' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'month' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('year')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${viewMode === 'year' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
                  >
                    <CalendarRange className="w-4 h-4" />
                    Year
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-indigo-900/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-indigo-300">
                  {timeHistory.reduce((sum, session) => sum + (session.totalDuration || session.duration || 0), 0)}
                </div>
                <div className="text-sm text-indigo-400">Total Minutes</div>
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
                <div className="text-sm text-purple-400">Session Count</div>
              </div>
              <div className="bg-orange-900/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-300">
                  {timeHistory.length > 0 ? Math.round(timeHistory.reduce((sum, session) => sum + (session.totalDuration || session.duration || 0), 0) / timeHistory.length) : 0}
                </div>
                <div className="text-sm text-orange-400">Avg Session (min)</div>
              </div>
              <div className="bg-red-900/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-300 flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6" />
                  {currentSessionStreak}
                </div>
                <div className="text-sm text-red-400">Session Streak</div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Data Management</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Your data is automatically saved to your app directory. Share with friends!
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => playFinishSound()}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200"
                  >
                    🔊 Test Sound
                  </button>
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
                    Clear Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="text-1xl font-bold text-white">
              <a href="https://www.flaticon.com/free-icons/stopwatch" title="stopwatch icons">Stopwatch icons created by alfanz -
                Flaticon</a>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-xl p-8 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-6 h-6 text-indigo-500" />
                <h2 className="text-2xl font-bold text-white">Session History</h2>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-gray-300">
                    View your completed sessions and tasks (Auto-saved to file)
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => playBreakWarningSound()}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200"
                  >
                    🔔 Test Warning
                  </button>
                  <button
                    onClick={() => playSessionStartSound()}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200"
                  >
                    🎵 Test Start Sound
                  </button>
                  <button
                    onClick={() => showNotification('Test Notification', 'This is a test notification from your Pomodoro timer!', '🍅')}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200"
                  >
                    🔔 Test Notification
                  </button>
                </div>
              </div>
            </div>

            {timeHistory.length === 0 && taskHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No history yet. Complete some sessions to see your progress!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Time Sessions ({timeHistory.length})</h3>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete all time sessions? This action cannot be undone.')) {
                          setTimeHistory([]);
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 text-sm"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {timeHistory.length === 0 ? (
                      <p className="text-gray-400 italic text-center py-8">No time sessions recorded yet</p>
                    ) : (
                      <div className="space-y-2">
                        {timeHistory.slice().reverse().map((session) => (
                          <SessionHistoryItem
                            key={session.id}
                            session={session}
                            onDelete={deleteTimeSession}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

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

                  <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {taskHistory.length === 0 ? (
                      <p className="text-gray-400 italic text-center py-8">No completed tasks yet</p>
                    ) : (
                      <div className="space-y-2">
                        {taskHistory.slice().reverse().map((task) => (
                          <TaskHistoryItem
                            key={task.id}
                            task={task}
                            onDelete={deleteTask}
                          />
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
    </div>
  );
};

export default PomodoroApp;