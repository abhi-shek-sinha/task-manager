import  { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchTasks, createTask, updateTask, deleteTask, setSearchQuery, setStatusFilter } from './store/slices/taskSlice';
import type { Task, TaskFormData, TaskStatus } from './types';
import { Navbar } from './components/Navbar';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { AuthPage } from './components/AuthPage';
import { Plus, Search, Filter } from 'lucide-react';

export default function App() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { tasks, isLoading, searchQuery, statusFilter } = useAppSelector((state) => state.tasks);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchTasks({ search: searchQuery, status: statusFilter }));
    }
  }, [user, searchQuery, statusFilter, dispatch]);

  const handleCreateOrUpdate = (data: TaskFormData) => {
    if (editingTask) {
      dispatch(updateTask({ id: editingTask._id, taskData: data }));
    } else {
      dispatch(createTask(data));
    }
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    dispatch(deleteTask(id));
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    dispatch(updateTask({ id, taskData: { status } }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <Navbar />
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Top Control Bar: Search & Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Filter & Add Task Button */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Filter className="w-4 h-4 absolute left-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => dispatch(setStatusFilter(e.target.value))}
                className="pl-9 pr-8 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="on process">On Process</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Task Grid */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 font-medium">
            Loading your task dashboard...
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No tasks found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create a new task to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialTask={editingTask}
      />
    </div>
  );
}