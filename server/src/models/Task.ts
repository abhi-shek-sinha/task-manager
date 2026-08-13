import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus =  'on process' | 'completed' | 'expired';

export interface ITask extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: [ 'on process', 'completed', 'expired'],
      default: 'on process',
    },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Indexing title for faster search functionality
TaskSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<ITask>('Task', TaskSchema);