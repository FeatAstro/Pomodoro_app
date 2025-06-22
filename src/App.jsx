import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Play, Pause, Square, Plus, Check, Clock, BarChart3, Calendar, CalendarDays, CalendarRange, Target, X, History, Flame, Bell, HelpCircle, Download, Upload, FileText } from 'lucide-react';
import { appDataDir, join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';

// Memoized sub-components
const TaskItem = memo(({ task, onComplete, onDelete, isActive = false, activeTaskId, onSetActive, canChangeActive, taskTimes = {} }) => {
  // Calculer le temps total pour cette tâche (accumulé + temps de session actuel)
  const sessionTime = taskTimes[task.id] || 0;
  const accumulatedTime = task.accumulatedTime || 0;
  const totalTime = accumulatedTime + sessionTime;

  // Check if this task is the currently active one
  const isCurrentlyActive = activeTaskId === task.id;

  return (
    <div className={`group relative overflow-hidden ${isActive ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10' : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10'} backdrop-blur-sm border ${isActive ? 'border-blue-500/20' : 'border-l-4 border-emerald-500/50'} rounded-xl p-3 hover:from-${isActive ? 'blue' : 'emerald'}-500/15 hover:to-${isActive ? 'cyan' : 'teal'}-500/15 transition-all duration-300`}>
      {!isActive && <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full -translate-y-6 translate-x-6"></div>}
      <div className="relative flex items-center gap-3">
        {isActive ? (
          <>
            {/* Radio button for active task selection */}
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="activeTask"
                checked={isCurrentlyActive}
                onChange={() => canChangeActive && onSetActive(task.id)}
                disabled={!canChangeActive}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2"
              />
              {/* Only show complete button for non-default tasks */}
              {!task.isDefault && (
                <button
                  onClick={() => onComplete(task.id, task.text)}
                  className="w-6 h-6 rounded-full border-2 border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-all duration-200 group/check hover:shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                >
                  <Check className="w-4 h-4 text-blue-400 opacity-0 group-hover/check:opacity-100 transition-opacity duration-200" />
                </button>
              )}
            </div>

            <span className="flex-1 text-white/90 font-medium group-hover:text-white transition-colors duration-200">
              {task.text}
              {task.isDefault && (
                <span className="ml-2 px-2 py-0.5 bg-gray-500/30 text-gray-300 text-xs font-bold rounded-full border border-gray-500/50">
                  DEFAULT
                </span>
              )}
              {isCurrentlyActive && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500/30 text-blue-300 text-xs font-bold rounded-full border border-blue-500/50">
                  ACTIVE
                </span>
              )}
              {totalTime > 0 && (
                <span className="text-blue-400/60 text-xs ml-1">
                  ({accumulatedTime > 0 ? `${Math.round(accumulatedTime)}+` : ''}{Math.round(sessionTime)}m)
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

        {/* Only show delete button for non-default tasks */}
        {!task.isDefault && (
          <button
            onClick={() => onDelete(task.id)}
            className="w-6 h-6 text-white/30 hover:text-red-400 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

const SessionHistoryItem = memo(({ session, onDelete }) => {
  const isStopwatch = session.sessionType === 'stopwatch';

  return (
    <div className="group relative overflow-hidden bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-4 hover:from-indigo-500/15 hover:to-purple-500/15 transition-all duration-300">
      <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/10 rounded-full -translate-y-6 translate-x-6"></div>

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center backdrop-blur-sm">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="font-semibold text-white text-lg">{session.task}</div>
              <div className="text-sm text-indigo-400/80">
                {new Date(session.timestamp).toLocaleDateString()} at {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <button
            onClick={() => onDelete(session.id)}
            className="w-8 h-8 text-white/30 hover:text-red-400 hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center bg-indigo-900/20 rounded-lg p-2 border border-indigo-500/20">
            <div className="text-lg font-bold text-indigo-400">{session.totalMinutes}</div>
            <div className="text-xs text-indigo-300/80">Total Minutes</div>
          </div>

          {!isStopwatch ? (
            <>
              <div className="text-center bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                <div className="text-lg font-bold text-purple-400">{session.sessionCount}</div>
                <div className="text-xs text-purple-300/80">Sessions</div>
              </div>
              {session.cycleCount > 0 && (
                <>
                  <div className="text-center bg-green-900/20 rounded-lg p-2 border border-green-500/20">
                    <div className="text-lg font-bold text-green-400">{session.cycleCount}</div>
                    <div className="text-xs text-green-300/80">Cycles</div>
                  </div>
                  <div className="text-center bg-orange-900/20 rounded-lg p-2 border border-orange-500/20">
                    <div className="text-lg font-bold text-orange-400 flex items-center justify-center gap-1">
                      <Flame className="w-4 h-4" />
                      {session.overallStreak}
                    </div>
                    <div className="text-xs text-orange-300/80">Streak</div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center bg-cyan-900/20 rounded-lg p-2 border border-cyan-500/20">
              <div className="text-lg font-bold text-cyan-400 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                ∞
              </div>
              <div className="text-xs text-cyan-300/80">Stopwatch</div>
            </div>
          )}
        </div>

        {/* Task Breakdown */}
        {session.taskBreakdown && Object.keys(session.taskBreakdown).length > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-3 h-3 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">Task Breakdown:</span>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {Object.entries(session.taskBreakdown).map(([taskName, minutes]) => {
                if (minutes === 0) return null;

                return (
                  <div key={taskName} className="flex items-center justify-between text-xs">
                    <span className="text-white/70 truncate flex-1">
                      {taskName}
                    </span>
                    <span className="font-medium text-indigo-400 ml-2">
                      {Math.round(minutes)}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status indicators at bottom */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {[...Array(Math.min(Math.floor(session.overallStreak || 0), 6))].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 150}ms`
              }}
            ></div>
          ))}
          {(session.overallStreak || 0) > 3 && (
            <span className="text-xs text-indigo-400 font-medium ml-1">
              +{Math.floor(((session.overallStreak || 0) - 3) * 2)}
            </span>
          )}
        </div>
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
      }, testMode ? 5 : 1000);
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
  // Test mode - accelerates time 
  const [testMode, setTestMode] = useState(false);

  // Timer states
  const [mode, setMode] = useState('25/5');
  const [isBreak, setIsBreak] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // NOUVEAU SYSTÈME DE TEMPS PAR TÂCHE
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [taskSessionTimes, setTaskSessionTimes] = useState({}); // Temps de chaque tâche pour la session actuelle
  const [lastUpdateTime, setLastUpdateTime] = useState(null); // Pour calculer les deltas de temps
  const [taskSessionNames, setTaskSessionNames] = useState({}); // Track task names for session

  // Temporary session/cycle tracking (cleared on stop)
  const [tempSessionCount, setTempSessionCount] = useState(0);
  const [tempCycleCount, setTempCycleCount] = useState(0);
  const [tempOverallStreak, setTempOverallStreak] = useState(0);
  // CORRECTION: tempTotalMinutes supprimé car redondant avec taskSessionTimes

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

  // Time warning handler
  const handleTimeWarning = useCallback((timeLeft) => {
    if (timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
      playAlmostSound();
    }

    if (isBreak && timeLeft === 30) {
      playBreakWarningSound();
    }
  }, [isBreak, playAlmostSound, playBreakWarningSound]);

  const handleTimerComplete = useCallback(() => {
    if (!isBreak) {
      // Work session completed
      playFinishSound();

      const sessionValue = mode === '25/5' ? 0.5 : 1;

      // Update temporary counters
      setTempSessionCount(prev => prev + 1);
      setTempOverallStreak(prev => prev + sessionValue);
      // CORRECTION: Ne pas ajouter automatiquement le temps - il est déjà comptabilisé via taskSessionTimes
      // setTempTotalMinutes(prev => prev + workTime); // ❌ SUPPRIMÉ - causait le double comptage

      // Update session streak
      setCurrentSessionStreak(prev => {
        const newStreak = prev + sessionValue;
        if (newStreak > longestSessionStreak) {
          setLongestSessionStreak(newStreak);
        }
        return newStreak;
      });

      setIsBreak(true);
    } else {
      // Break completed - this completes a full cycle
      playSessionStartSound();

      // Update temporary counters
      setTempCycleCount(prev => prev + 1);
      // CORRECTION: Ne pas ajouter automatiquement le temps de pause non plus
      // setTempTotalMinutes(prev => prev + breakTime); // ❌ SUPPRIMÉ - les pauses ne sont pas comptées dans les tâches

      setIsBreak(false);
    }

    setLastSessionDate(new Date().toISOString());
  }, [isBreak, mode, longestSessionStreak, playFinishSound, playSessionStartSound]);

  // Timer hook
  const timerState = useTimer(mode, isBreak, handleTimerComplete, handleTimeWarning, testMode);
  const { timeLeft, isRunning, setIsRunning, sessionElapsedTime, setTimeLeft, setSessionElapsedTime } = timerState;

  // NOUVEAU SYSTÈME: Update du temps pour la tâche active
  const updateActiveTaskTime = useCallback(() => {
    if (!isRunning || !activeTaskId) return;

    const now = Date.now();
    if (!lastUpdateTime) {
      setLastUpdateTime(now);
      return;
    }

    const deltaSeconds = (now - lastUpdateTime) / 1000;
    const deltaMinutes = testMode ? (deltaSeconds * 200) / 60 : deltaSeconds / 60;

    setTaskSessionTimes(prev => ({
      ...prev,
      [activeTaskId]: (prev[activeTaskId] || 0) + deltaMinutes
    }));

    // Also store the task name
    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (activeTask) {
      setTaskSessionNames(prev => ({
        ...prev,
        [activeTaskId]: activeTask.text
      }));
    }

    setLastUpdateTime(now);
  }, [isRunning, activeTaskId, lastUpdateTime, testMode, tasks]);

  // Update task times every second when running
  useEffect(() => {
    let interval;
    if (isRunning && activeTaskId) {
      // CORRECTION: Intervalle plus fréquent en test mode pour plus de fluidité
      interval = setInterval(updateActiveTaskTime, testMode ? 50 : 1000); // 50ms en test mode, 1s normal
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTaskId, updateActiveTaskTime, testMode]); // Ajouter testMode dans les dépendances

  // NOUVEAU SYSTÈME: Changement de tâche active
  const setActiveTask = useCallback((taskId) => {
    if (!isRunning) return;

    // Mettre à jour le temps de la tâche actuelle avant de changer
    updateActiveTaskTime();

    // Changer de tâche active
    setActiveTaskId(taskId);
    setLastUpdateTime(Date.now());

    console.log('Switched to task:', taskId);
  }, [isRunning, updateActiveTaskTime]);

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

  // Auto-cleanup completed tasks older than 24 hours
  useEffect(() => {
    const cleanupOldTasks = () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      setCompletedTasks(prev =>
        prev.filter(task => new Date(task.timestamp) > oneDayAgo)
      );
    };

    // Run cleanup on load and then every hour
    cleanupOldTasks();
    const cleanupInterval = setInterval(cleanupOldTasks, 60 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

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
    setLastUpdateTime(Date.now());

    if (!sessionStartTime) {
      setSessionStartTime(new Date());
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
      setTasks([defaultTask]);
      setActiveTaskId(defaultTask.id);
    }
    // Auto-select first task if none is selected and tasks exist
    else if (!activeTaskId && tasks.length > 0) {
      setActiveTaskId(tasks[0].id);
    }
  }, [sessionStartTime, activeTaskId, tasks]);

  const pauseTimer = useCallback(() => {
    // Mettre à jour le temps de la tâche active avant de pauser
    updateActiveTaskTime();
    setIsRunning(false);
    setLastUpdateTime(null);
  }, [updateActiveTaskTime]);

  // NOUVEAU SYSTÈME: Stop timer avec sauvegarde propre
  const stopTimer = useCallback(() => {
    // Mettre à jour le temps de la tâche active une dernière fois
    if (isRunning) {
      updateActiveTaskTime();
    }

    setIsRunning(false);

    // Sauvegarder les temps accumulés dans les tâches
    if (Object.keys(taskSessionTimes).length > 0) {
      setTasks(prev => prev.map(task => {
        const sessionTime = taskSessionTimes[task.id] || 0;
        if (sessionTime > 0) {
          return {
            ...task,
            accumulatedTime: (task.accumulatedTime || 0) + sessionTime
          };
        }
        return task;
      }));
    }

    // Calculer le temps total de la session
    const totalSessionMinutes = Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0);

    // Save to permanent history
    // Save to permanent history
    if (mode === 'stopwatch') {
      if (totalSessionMinutes >= 1) {
        const activeTasks = tasks.length > 0 ? tasks.map(t => t.text).join(', ') : 'No Title';

        // Create task breakdown with names instead of IDs
        const taskBreakdownWithNames = {};
        Object.entries(taskSessionTimes).forEach(([taskId, time]) => {
          const task = tasks.find(t => t.id === parseInt(taskId));
          const taskName = task ? task.text : `Task ${taskId}`;
          if (time > 0) {
            taskBreakdownWithNames[taskName] = time;
          }
        });

        const newSession = {
          id: Date.now() + Math.random(),
          task: activeTasks,
          totalMinutes: Math.round(totalSessionMinutes),
          sessionCount: 0,
          cycleCount: 0,
          overallStreak: 0,
          timestamp: new Date().toISOString(),
          sessionType: mode,
          taskBreakdown: taskBreakdownWithNames
        };

        setTimeHistory(prev => [...prev, newSession]);
      }
    } else {
      // Pour les modes pomodoro
      const totalMinutesIncludingTemp = totalSessionMinutes;

      if (tempSessionCount > 0 || tempCycleCount > 0 || totalSessionMinutes > 0) {
        const activeTasks = tasks.length > 0 ? tasks.map(t => t.text).join(', ') : 'No Title';

        // Create task breakdown with names instead of IDs
        const taskBreakdownWithNames = {};
        Object.entries(taskSessionTimes).forEach(([taskId, time]) => {
          const task = tasks.find(t => t.id === parseInt(taskId));
          const taskName = task ? task.text : `Task ${taskId}`;
          if (time > 0) {
            taskBreakdownWithNames[taskName] = time;
          }
        });

        const newSession = {
          id: Date.now() + Math.random(),
          task: activeTasks,
          totalMinutes: Math.round(totalMinutesIncludingTemp),
          sessionCount: tempSessionCount,
          cycleCount: tempCycleCount,
          overallStreak: tempOverallStreak,
          timestamp: new Date().toISOString(),
          sessionType: mode,
          taskBreakdown: taskBreakdownWithNames
        };

        setTimeHistory(prev => [...prev, newSession]);
      }
    }

    // Clean up only unused default tasks (those with no time)
    setTasks(prev => prev.filter(task => {
      if (task.isDefault) {
        const sessionTime = taskSessionTimes[task.id] || 0;
        const totalTime = (task.accumulatedTime || 0) + sessionTime;
        // Only keep default tasks that have accumulated time
        return totalTime > 0;
      }
      return true; // Keep all non-default tasks
    }));

    // Reset all states
    setTempSessionCount(0);
    setTempCycleCount(0);
    setTempOverallStreak(0);
    setTaskSessionTimes({});
    setTaskSessionNames({});
    setActiveTaskId(null);
    setLastUpdateTime(null);

    // Reset timer state
    setTimeLeft(mode === '25/5' ? 25 * 60 : mode === '50/10' ? 50 * 60 : 0);
    setIsBreak(false);
    setSessionStartTime(null);
    setSessionElapsedTime(0);
    setCurrentSessionStreak(0);
  }, [isRunning, updateActiveTaskTime, taskSessionTimes, tasks, mode, tempSessionCount, tempCycleCount, tempOverallStreak]);

  const addTask = useCallback(() => {
    if (currentTask.trim()) {
      const newTask = {
        id: Date.now(),
        text: currentTask,
        completed: false,
        accumulatedTime: 0
      };

      setTasks(prev => {
        // If there's only a default task, add the new task and move default to back
        if (prev.length === 1 && prev[0].isDefault) {
          return [newTask, prev[0]]; // New task first, default at back
        } else {
          // Normal case: just add the new task
          return [...prev, newTask];
        }
      });

      setCurrentTask('');

      // Make the new task active if timer is running
      if (isRunning) {
        // Update current active task time before switching
        if (activeTaskId) {
          updateActiveTaskTime();
        }
        setActiveTaskId(newTask.id);
        setLastUpdateTime(Date.now());
      }
    }
  }, [currentTask, isRunning, activeTaskId, updateActiveTaskTime]);

  const saveCompletedTask = useCallback((task) => {
    const taskObj = tasks.find(t => t.text === task);
    const sessionTime = taskObj ? (taskSessionTimes[taskObj.id] || 0) : 0;
    const accumulatedTime = taskObj ? (taskObj.accumulatedTime || 0) : 0;
    const totalTime = accumulatedTime + sessionTime;

    const newTask = {
      id: Date.now() + Math.random(),
      task: task,
      timestamp: new Date().toISOString(),
      duration: totalTime > 0 ? Math.round(totalTime) : (mode === 'stopwatch' ? Math.floor(timeLeft / 60) : (mode === '25/5' ? 25 : 50) - Math.floor(timeLeft / 60))
    };

    setTaskHistory(prev => [...prev, newTask]);
  }, [tasks, mode, timeLeft, taskSessionTimes]);

  const completeTask = useCallback((taskId, taskText) => {
    // Si on complète la tâche actuellement active, la désactiver
    if (taskId === activeTaskId) {
      if (isRunning) {
        updateActiveTaskTime();
      }

      // Find next task to activate
      const currentTaskIndex = tasks.findIndex(t => t.id === taskId);
      let nextActiveTaskId = null;

      // Look for next non-default task first
      for (let i = currentTaskIndex + 1; i < tasks.length; i++) {
        if (!tasks[i].isDefault) {
          nextActiveTaskId = tasks[i].id;
          break;
        }
      }

      // If no non-default task found after current, look before current
      if (!nextActiveTaskId) {
        for (let i = 0; i < currentTaskIndex; i++) {
          if (!tasks[i].isDefault) {
            nextActiveTaskId = tasks[i].id;
            break;
          }
        }
      }

      // If still no non-default task, use default task
      if (!nextActiveTaskId) {
        const defaultTask = tasks.find(t => t.isDefault);
        if (defaultTask) {
          nextActiveTaskId = defaultTask.id;
        }
      }

      setActiveTaskId(nextActiveTaskId);
      if (isRunning && nextActiveTaskId) {
        setLastUpdateTime(Date.now());
      }
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));
    setCompletedTasks(prev => [...prev, { id: taskId, text: taskText, timestamp: new Date() }]);
    saveCompletedTask(taskText);
  }, [saveCompletedTask, activeTaskId, isRunning, updateActiveTaskTime, tasks]);

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

  // Memoized calculations with automatic cleanup and real-time updates
  const recentCompletedTasks = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return completedTasks.filter(task => new Date(task.timestamp) > oneDayAgo);
  }, [completedTasks]);

  const totalTimeToday = useMemo(() => {
    const baseTime = timeHistory
      .filter(entry => entry.timestamp.split('T')[0] === new Date().toISOString().split('T')[0])
      .reduce((total, entry) => total + (entry.totalMinutes || 0), 0);

    // Add current session time if timer is running or paused
    const currentSessionMinutes = Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0);

    return baseTime + currentSessionMinutes;
  }, [timeHistory, taskSessionTimes]);

  const todaySessionCount = useMemo(() => {
    return timeHistory
      .filter(s => s.timestamp.split('T')[0] === new Date().toISOString().split('T')[0])
      .reduce((total, session) => total + (session.sessionCount || 0), 0);
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
            ? Math.round((dayData.reduce((sum, item) => sum + (item.totalMinutes || item.duration || 0), 0) / 60) * 10) / 10
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
            ? Math.round((dayData.reduce((sum, item) => sum + (item.totalMinutes || item.duration || 0), 0) / 60) * 10) / 10
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
            ? Math.round((monthData.reduce((sum, item) => sum + (item.totalMinutes || item.duration || 0), 0) / 60) * 10) / 10
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
      // Clear temporary counters too
      setTempSessionCount(0);
      setTempCycleCount(0);
      setTempOverallStreak(0);
      // CORRECTION: tempTotalMinutes supprimé car redondant
      // Clear task tracking
      setActiveTaskId(null);
      setTaskSessionTimes({});
      setLastUpdateTime(null);
      setTaskSessionNames({});

    }
  }, []);

  // Instructions Modal Component
  const InstructionsModal = memo(() => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">How to Use & Share Data</h2>
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Basic Usage
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• Choose between 25min (Pomodoro) or 50min focus sessions</li>
                <li>• Add tasks to work on during your sessions</li>
                <li>• <strong>Sessions:</strong> 25/50 min work periods</li>
                <li>• <strong>Cycles:</strong> Complete work + break periods</li>
                <li>• Data is only saved when you stop the timer</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Session & Cycle System
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Session:</strong> 25min = 0.5 streak, 50min = 1.0 streak</li>
                <li>• <strong>Cycle:</strong> Work session + break (25+5 or 50+10 minutes)</li>
                <li>• History shows sessions completed, cycles completed, and overall streak</li>
                <li>• Stopping the timer resets current streak to 0</li>
                <li>• Only saves to history when you press Stop</li>
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
                  <li>• All your focus sessions with session/cycle counts</li>
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
        </div>

        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={() => setShowInstructions(false)}
            className="w-full py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all duration-200 font-semibold"
          >
            Got it! Let's focus 🎯
          </button>
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
                  {activeTaskId && tasks.length > 0 && (
                    <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10 shadow-lg" style={{
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.25), 0 0 30px rgba(59, 130, 246, 0.08), inset 0 1px 2px rgba(255,255,255,0.05)'
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-medium text-white/90">Active Task</span>
                      </div>
                      <div className="space-y-1.5">
                        {(() => {
                          const activeTask = tasks.find(t => t.id === activeTaskId);
                          if (!activeTask) return null;

                          const sessionTime = taskSessionTimes[activeTask.id] || 0;
                          const accumulatedTime = activeTask.accumulatedTime || 0;
                          const totalTime = accumulatedTime + sessionTime;

                          return (
                            <div className="flex items-center gap-2 text-xs">
                              <div
                                className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0"
                                style={{
                                  animation: `tickleDot 1.5s ease-in-out infinite`
                                }}
                              ></div>
                              <div className="flex-1">
                                <div className="text-white/80 font-medium">{activeTask.text}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  {accumulatedTime > 0 && (
                                    <span className="text-blue-400/60 text-xs">
                                      Previous: {Math.round(accumulatedTime)}m
                                    </span>
                                  )}
                                  {sessionTime > 0 && (
                                    <span className="text-green-400/60 text-xs">
                                      Session: +{Math.round(sessionTime)}m
                                    </span>
                                  )}
                                  {totalTime > 0 && (
                                    <span className="text-purple-400/60 text-xs">
                                      Total: {Math.round(totalTime)}m
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Session Stats */}
                <div className="absolute top-4 right-4 z-10 w-48">
                  <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10 shadow-lg" style={{
                    boxShadow: '0 0 15px rgba(251, 146, 60, 0.25), 0 0 30px rgba(251, 146, 60, 0.08), inset 0 1px 2px rgba(255,255,255,0.05)'
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-xs font-medium text-white/90">Current Work Session</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="text-center">
                        <div className="text-sm font-bold text-blue-400">{tempSessionCount}</div>
                        <div className="text-xs text-white/60">Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-400">{tempCycleCount}</div>
                        <div className="text-xs text-white/60">Cycles</div>
                      </div>
                    </div>

                    <div className="flex justify-between mb-2">
                      <div className="text-center">
                        <div className="text-sm font-bold text-orange-400">{tempOverallStreak}</div>
                        <div className="text-xs text-white/60">Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-purple-400">
                          {Math.round(Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0))}m
                        </div>
                        <div className="text-xs text-white/60">Total</div>
                      </div>
                    </div>

                    {/* Task breakdown display */}
                    {Object.keys(taskSessionTimes).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="text-xs text-white/70 mb-1">Task Time:</div>
                        <div className="space-y-1 max-h-16 overflow-y-auto">
                          {Object.entries(taskSessionTimes).map(([taskId, minutes]) => {
                            if (minutes === 0) return null;

                            // Use stored task name first (this is the key fix)
                            const storedName = taskSessionNames[taskId];

                            // Fallback to finding current task
                            const currentTask = tasks.find(t => t.id === parseInt(taskId));

                            // For completed tasks, we need to find by text since they get new IDs
                            // But we should rely on storedName primarily
                            const taskName = storedName || currentTask?.text || `Task ID: ${taskId}`;

                            const isActive = parseInt(taskId) === activeTaskId;
                            const isCompleted = !currentTask && storedName; // If we have stored name but no current task, it's completed

                            return (
                              <div key={taskId} className="flex items-center justify-between text-xs">
                                <span className={`truncate flex-1 ${isActive ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-white/60'}`}>
                                  {isActive && '→ '}{taskName}
                                  {isCompleted && ' ✓'}
                                </span>
                                <span className={`font-medium ml-1 ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-white/70'}`}>
                                  {Math.round(minutes)}m
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-1 mt-2">
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
                      Stop timer = Save & Reset
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
                              ++
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Task Indicator */}
                    {activeTaskId && tasks.length > 0 && (
                      <div className="mb-6 text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl backdrop-blur-sm shadow-lg">
                          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg" style={{
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
                          }}></div>
                          <div className="text-center">
                            <div className="text-blue-300 font-medium text-sm">Currently Working On</div>
                            <div className="text-white font-semibold text-lg">{tasks.find(t => t.id === activeTaskId)?.text || 'Unknown Task'}</div>
                            {isRunning && taskSessionTimes[activeTaskId] > 0 && (
                              <div className="text-green-400 text-xs font-medium mt-1">
                                +{Math.round(taskSessionTimes[activeTaskId])} min this session
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

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
                    <span className="font-medium">🚀 Test Mode (200x faster)</span>
                  </label>
                  <p className="text-xs text-yellow-300/70 mt-1 ml-6">
                    Accelerates both timer AND task time tracking for testing. Perfect for testing task switching, time accumulation, and save functionality!
                  </p>
                  {testMode && (
                    <div className="mt-2 p-2 bg-yellow-800/30 rounded border border-yellow-500/50">
                      <div className="text-xs text-yellow-200 font-medium">
                        ⚡ Test mode active: 1 real second = ~3.3 minutes of task time
                      </div>
                    </div>
                  )}
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
                      {Math.round(todaySessionCount * 10) / 10} sessions today
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
                        {Math.floor(totalTimeToday / 60)}h {Math.round(totalTimeToday % 60)}m
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

                {/* Debug info */}
                <div className="mt-4 p-3 bg-green-900/30 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-300">NOUVEAU SYSTÈME - Temps par tâche indépendant</span>
                    {testMode && <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full font-bold">TEST MODE 200x</span>}
                  </div>
                  <ul className="text-xs text-green-300/80 space-y-1">
                    <li>• ✅ Chaque tâche a son propre temps indépendant</li>
                    <li>• ✅ Le changement de tâche active fige le temps de la précédente</li>
                    <li>• ✅ Temps affiché en temps réel dans "Active Tasks"</li>
                    <li>• ✅ Sauvegarde globale + breakdown par tâche au stop</li>
                    <li>• ✅ Test mode accélère aussi le temps des tâches (200x)</li>
                  </ul>
                  <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-600/30 space-y-1">
                    <div className="text-xs text-gray-300">
                      Active Task ID: {activeTaskId || 'None'}
                    </div>
                    <div className="text-xs text-gray-300">
                      Task Session Times: {JSON.stringify(taskSessionTimes, null, 2)}
                    </div>
                    <div className="text-xs text-gray-300">
                      Total Session Time: {Math.round(Object.values(taskSessionTimes).reduce((sum, time) => sum + time, 0))}m
                    </div>
                    {testMode && (
                      <div className="text-xs text-yellow-300 font-medium">
                        🚀 Test Mode: Time accelerated 200x for quick testing!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add this temporary debug section after your existing debug info */}
              <div className="mt-2 p-2 bg-blue-800/50 rounded border border-blue-600/30 space-y-1">
                <div className="text-xs text-blue-300 font-medium">Debug: Task Session Names</div>
                <div className="text-xs text-blue-200">
                  Task Session Names: {JSON.stringify(taskSessionNames, null, 2)}
                </div>
                <div className="text-xs text-blue-200">
                  Current Active Task ID: {activeTaskId}
                </div>
                <div className="text-xs text-blue-200">
                  Active Task Name: {tasks.find(t => t.id === activeTaskId)?.text || 'None'}
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
                              onDelete={(id) => {
                                if (id === activeTaskId && isRunning) {
                                  // Find next task before deleting
                                  const currentTaskIndex = tasks.findIndex(t => t.id === id);
                                  let nextActiveTaskId = null;

                                  // Look for next non-default task first
                                  for (let i = currentTaskIndex + 1; i < tasks.length; i++) {
                                    if (!tasks[i].isDefault) {
                                      nextActiveTaskId = tasks[i].id;
                                      break;
                                    }
                                  }

                                  // If no non-default task found after current, look before current
                                  if (!nextActiveTaskId) {
                                    for (let i = 0; i < currentTaskIndex; i++) {
                                      if (!tasks[i].isDefault) {
                                        nextActiveTaskId = tasks[i].id;
                                        break;
                                      }
                                    }
                                  }

                                  // If still no non-default task, use default task
                                  if (!nextActiveTaskId) {
                                    const defaultTask = tasks.find(t => t.isDefault);
                                    if (defaultTask) {
                                      nextActiveTaskId = defaultTask.id;
                                    }
                                  }

                                  updateActiveTaskTime();
                                  setActiveTaskId(nextActiveTaskId);
                                  if (nextActiveTaskId) {
                                    setLastUpdateTime(Date.now());
                                  }
                                }

                                setTasks(prev => prev.filter(t => t.id !== id));
                              }}
                              isActive={true}
                              activeTaskId={activeTaskId}
                              onSetActive={setActiveTask}
                              canChangeActive={isRunning}
                              taskTimes={taskSessionTimes}
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
                          <span className="text-sm font-medium text-emerald-400">{recentCompletedTasks.length}</span>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        {recentCompletedTasks.length === 0 ? (
                          <div className="text-center py-8 px-4 rounded-xl bg-gray-700/20 border border-dashed border-white/10">
                            <Check className="w-8 h-8 mx-auto mb-3 text-white/30" />
                            <p className="text-white/40 text-sm">No completed tasks yet</p>
                            <p className="text-white/30 text-xs mt-1">Complete tasks to see them here</p>
                          </div>
                        ) : (
                          recentCompletedTasks.slice(-3).reverse().map((task) => (
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
                  {timeHistory.reduce((sum, session) => sum + (session.totalMinutes || 0), 0)}
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
                <div className="text-sm text-purple-400">Total Sessions</div>
              </div>
              <div className="bg-orange-900/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-300">
                  {timeHistory.reduce((sum, session) => sum + (session.cycleCount || 0), 0)}
                </div>
                <div className="text-sm text-orange-400">Total Cycles</div>
              </div>
              <div className="bg-red-900/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-300 flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6" />
                  {longestSessionStreak}
                </div>
                <div className="text-sm text-red-400">Best Streak</div>
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
                    View your completed work sessions with session/cycle counts (Saved when you stop timer)
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => playBreakWarningSound()}
                    className="px-2 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200"
                  >
                    🔔 Test Warning
                  </button>
                  <button
                    onClick={() => playSessionStartSound()}
                    className="px-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200"
                  >
                    🎵 Test Start Sound
                  </button>
                  <button
                    onClick={() => playFinishSound()}
                    className="px-2 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200"
                  >
                    🔊 Test Sound
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
                    <h3 className="text-xl font-semibold text-white">Work Sessions ({timeHistory.length})</h3>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete all work sessions? This action cannot be undone.')) {
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
                      <p className="text-gray-400 italic text-center py-8">No work sessions recorded yet</p>
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