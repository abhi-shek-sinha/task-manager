import cron from 'node-cron';
import Task from '../models/Task';

export const startCronJobs = (): void => {
  // Check every minute for overdue tasks
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const result = await Task.updateMany(
        {
          dueDate: { $lt: now },
          status: 'on process',
        },
        { $set: { status: 'expired' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`Cron Job: ${result.modifiedCount} overdue tasks marked as expired.`);
      }
    } catch (error) {
      console.error('Error in task expiration cron job:', error);
    }
  });

  console.log('Cron job service initialized.');
};
