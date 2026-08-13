import { Response } from 'express';
import Task, { TaskStatus } from '../models/Task';
import { AuthRequest } from '../middleware/authMiddleware';

// Create Task
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, dueDate, status } = req.body;

    if (!title || !description || !dueDate) {
      res.status(400).json({ message: 'Title, description, and due date are required.' });
      return;
    }

    const initialStatus: TaskStatus = status || 'on process';

    const task = await Task.create({
      user: req.user?.id,
      title,
      description,
      dueDate,
      status: initialStatus,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get All Tasks (with search & status filtering)
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const query: any = { user: req.user?.id };

    if (status) {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query).sort({ dueDate: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get Single Task by ID
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user?.id });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Update Task (supports status changes, editing, and re-scheduling expired tasks)
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, dueDate, status } = req.body;

    const task = await Task.findOne({ _id: req.params.id, user: req.user?.id });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (title) task.title = title;
    if (description) task.description = description;

    if (dueDate) {
      const newDueDate = new Date(dueDate);
      task.dueDate = newDueDate;

      // Reschedule logic: If task was expired and updated with a future due date, revive it.
      if (task.status === 'expired' && newDueDate > new Date()) {
        task.status = status || 'on process';
      }
    }

    if (status) {
      task.status = status as TaskStatus;
    }

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Delete Task (allowed from any state)
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user?.id });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(200).json({ message: 'Task deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
