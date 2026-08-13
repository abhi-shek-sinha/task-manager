import React from 'react';
import type { Task, TaskStatus } from '../types';
import { CountdownTimer } from './CountdownTimer';
import { CheckCircle, Trash2, Edit3, RotateCcw } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'on process':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">In Progress</span>;
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Completed</span>;
      case 'expired':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">Expired</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
      <div className="space-y-3">
        {/* Header: Status and Timer */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {getStatusBadge(task.status)}
          <CountdownTimer dueDate={task.dueDate} status={task.status} />
        </div>

        {/* Section 1: Title */}
        <h3 className={`font-semibold text-lg leading-snug text-slate-800 dark:text-slate-100 ${task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
          {task.title}
        </h3>

        {/* Section 2: Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {task.description}
        </p>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Quick status transitions */}
          {task.status !== 'completed' && task.status !== 'expired' && (
            <button
              onClick={() => onStatusChange(task._id, 'completed')}
              className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
              title="Mark as Completed"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {/* Edit / Reschedule Button */}
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
            title={task.status === 'expired' ? 'Reschedule Expired Task' : 'Edit Task'}
          >
            {task.status === 'expired' ? <RotateCcw className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        </div>

        {/* Abort / Delete Button (available in all states) */}
        <button
          onClick={() => onDelete(task._id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          title="Abort/Delete Task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
