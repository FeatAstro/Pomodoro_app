// ================================
// PART 6: TASK MANAGEMENT COMPONENTS
// ================================

import React, { useCallback, useMemo } from 'react';
import { Plus, Target, Check } from 'lucide-react';
import { usePomodoroContext } from './part1-context.jsx';
import { useTaskTimer } from './part2-hooks.jsx';
import { TaskItem, formatMinutesToHourMin } from './part3-utilities.jsx';

// ================================
// TASK INPUT COMPONENT
// ================================

export const TaskInput = () => {
    const { state, actions } = usePomodoroContext();
    const { currentTask, tasks, isRunning } = state;
    const { updateActiveTaskTime, setActiveTask } = useTaskTimer();

    /**
     * Add new task to the active tasks list
     * Maintains default task at bottom and auto-activates new task if timer is running
     */
    const addTask = useCallback(() => {
        if (currentTask.trim()) {
            const newTask = {
                id: Date.now(),
                text: currentTask,
                completed: false,
                accumulatedTime: 0
            };

            // Update tasks list while keeping default task at bottom
            const nonDefaultTasks = tasks.filter(task => !task.isDefault);
            const defaultTask = tasks.find(task => task.isDefault);

            let updatedTasks;
            if (defaultTask) {
                updatedTasks = [newTask, ...nonDefaultTasks, defaultTask];
            } else {
                // Create default task if somehow missing
                const newDefaultTask = {
                    id: Date.now() + Math.random() + 1,
                    text: 'Focus Session',
                    completed: false,
                    accumulatedTime: 0,
                    isDefault: true
                };
                updatedTasks = [newTask, ...nonDefaultTasks, newDefaultTask];
            }

            actions.updateTasks(updatedTasks);
            actions.setCurrentTask('');

            // Auto-activate new task if timer is running
            if (isRunning) {
                updateActiveTaskTime();
                setActiveTask(newTask.id);
            }
        }
    }, [currentTask, tasks, isRunning, actions, updateActiveTaskTime, setActiveTask]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    };

    return (
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
                        {/* Task Input Field */}
                        <div className="relative">
                            <input
                                type="text"
                                value={currentTask}
                                onChange={(e) => actions.setCurrentTask(e.target.value)}
                                placeholder="What are you working on?"
                                className="w-full px-5 py-4 text-white/90 placeholder-white/40 bg-gray-700/30 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-lg transition-all duration-300 hover:bg-gray-700/40 focus:bg-gray-700/50"
                                onKeyPress={handleKeyPress}
                            />
                        </div>

                        {/* Action Buttons */}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ================================
// ACTIVE TASKS PANEL COMPONENT
// ================================

export const ActiveTasksPanel = () => {
    const { state, actions } = usePomodoroContext();
    const { tasks, activeTaskId, isRunning, taskSessionTimes } = state;
    const { updateActiveTaskTime, setActiveTask } = useTaskTimer();

    /**
     * Save completed task to task history
     * Calculates total time spent on task from session and accumulated time
     */
    const saveCompletedTask = useCallback((taskText) => {
        const taskObj = tasks.find(t => t.text === taskText);
        const sessionTime = taskObj ? (taskSessionTimes[taskObj.id] || 0) : 0;
        const accumulatedTime = taskObj ? (taskObj.accumulatedTime || 0) : 0;
        const totalTime = accumulatedTime + sessionTime;

        const newTask = {
            id: Date.now() + Math.random(),
            task: taskText,
            timestamp: new Date().toISOString(),
            duration: totalTime > 0 ? Math.round(totalTime) : 0,
            sessionTime: Math.round(sessionTime),
            accumulatedTime: Math.round(accumulatedTime)
        };

        actions.addTaskHistory(newTask);
    }, [tasks, taskSessionTimes, actions]);

    /**
     * Complete a task - moves it to completed list and handles active task switching
     */
    const completeTask = useCallback((taskId, taskText) => {
        // Find the task to get its accumulated time
        const task = tasks.find(t => t.id === taskId);
        const sessionTime = taskSessionTimes[taskId] || 0;
        const accumulatedTime = task?.accumulatedTime || 0;
        const totalTime = accumulatedTime + sessionTime;

        // Handle active task switching if completing the currently active task
        if (taskId === activeTaskId) {
            if (isRunning) {
                updateActiveTaskTime();
            }

            // Find next task to activate
            const currentTaskIndex = tasks.findIndex(t => t.id === taskId);
            let nextActiveTaskId = null;

            // Look for next non-default task after current
            for (let i = currentTaskIndex + 1; i < tasks.length; i++) {
                if (!tasks[i].isDefault) {
                    nextActiveTaskId = tasks[i].id;
                    break;
                }
            }

            // If no task found after, look before current
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

            actions.setActiveTaskId(nextActiveTaskId);
            if (isRunning && nextActiveTaskId) {
                actions.setLastUpdateTime(Date.now());
            }
        }

        // Create completed task with time information
        const completedTask = {
            id: taskId,
            text: taskText,
            timestamp: new Date(),
            duration: totalTime, // Total time spent on this task
            sessionTime: sessionTime, // Time spent in current session
            accumulatedTime: accumulatedTime // Time from previous sessions
        };

        // Move task from active to completed
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        actions.updateTasks(updatedTasks);

        // Add to completed tasks
        actions.addCompletedTask(completedTask);

        // Save to task history
        saveCompletedTask(taskText);

        // Clear any session time for this task
        if (taskSessionTimes[taskId]) {
            const newTaskSessionTimes = { ...taskSessionTimes };
            delete newTaskSessionTimes[taskId];
            actions.updateTaskSessionTimes(newTaskSessionTimes);
        }
    }, [saveCompletedTask, activeTaskId, isRunning, updateActiveTaskTime, tasks, taskSessionTimes, actions]);


    /**
     * Delete a task from the active list
     */
    const deleteTask = useCallback((taskId) => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (taskToDelete?.isDefault) {
            return; // Prevent deletion of default tasks
        }

        // Handle active task switching if deleting current active task
        if (taskId === activeTaskId && isRunning) {
            const currentTaskIndex = tasks.findIndex(t => t.id === taskId);
            let nextActiveTaskId = null;

            // Find next non-default task
            for (let i = currentTaskIndex + 1; i < tasks.length; i++) {
                if (!tasks[i].isDefault) {
                    nextActiveTaskId = tasks[i].id;
                    break;
                }
            }

            // If no task found after, look before current
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
            actions.setActiveTaskId(nextActiveTaskId);
            if (nextActiveTaskId) {
                actions.setLastUpdateTime(Date.now());
            }
        }

        const updatedTasks = tasks.filter(t => t.id !== taskId);
        actions.updateTasks(updatedTasks);
    }, [tasks, activeTaskId, isRunning, updateActiveTaskTime, actions]);

    const nonDefaultTasksCount = tasks.filter(t => !t.isDefault).length;

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl"></div>

            <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)] p-6 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-500">

                {/* Panel Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
                        <Check className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white/90 tracking-tight">Ongoing tasks</h3>
                    <div className="ml-auto px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                        <span className="text-sm font-medium text-blue-400">{nonDefaultTasksCount}</span>
                    </div>
                </div>

                {/* Task List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {tasks.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-8 px-4 rounded-xl bg-gray-700/20 border border-dashed border-white/10">
                            <Target className="w-8 h-8 mx-auto mb-3 text-white/30" />
                            <p className="text-white/40 text-sm">No active tasks</p>
                            <p className="text-white/30 text-xs mt-1">Add a task above to get started</p>
                        </div>
                    ) : (
                        /* Task Items */
                        tasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onComplete={completeTask}
                                onDelete={deleteTask}
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
    );
};

// ================================
// RECENTLY COMPLETED PANEL COMPONENT
// ================================

export const RecentlyCompletedPanel = () => {
    const { state, actions } = usePomodoroContext();
    const { completedTasks } = state;

    /**
     * Get recently completed tasks (last 24 hours)
     */
    const recentCompletedTasks = useMemo(() => {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return completedTasks.filter(task => new Date(task.timestamp) > oneDayAgo);
    }, [completedTasks]);

    /**
     * Delete a completed task from recent completions
     */
    const deleteCompletedTask = useCallback((taskId) => {
        if (window.confirm('Are you sure you want to delete this completed task?')) {
            actions.deleteCompletedTask(taskId);
        }
    }, [actions]);

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>

            <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)] p-6 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-500">

                {/* Panel Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                        <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white/90 tracking-tight">Recently Completed</h3>
                    <div className="ml-auto px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                        <span className="text-sm font-medium text-emerald-400">{recentCompletedTasks.length}</span>
                    </div>
                </div>

                {/* Completed Task List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {recentCompletedTasks.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-8 px-4 rounded-xl bg-gray-700/20 border border-dashed border-white/10">
                            <Check className="w-8 h-8 mx-auto mb-3 text-white/30" />
                            <p className="text-white/40 text-sm">No completed tasks yet</p>
                            <p className="text-white/30 text-xs mt-1">Complete tasks to see them here</p>
                        </div>
                    ) : (
                        /* Completed Task Items - Show last 3 in reverse order */
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
    );
};

// ================================
// TASK MANAGEMENT SECTION COMPONENT
// ================================

export const TaskManagementSection = () => {
    return (
        <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ActiveTasksPanel />
                <RecentlyCompletedPanel />
            </div>
        </div>
    );
};