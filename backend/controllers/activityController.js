import Activity from '../models/Activity.js';

// Helper to log activity and auto-prune logs older than 3 months
export const logActivity = async (action, description, user = 'admin', previousState = null, newState = null) => {
  try {
    // Save new log
    await Activity.create({
      action,
      description,
      user,
      previousState,
      newState,
    });

    // Auto-prune logs older than 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    await Activity.deleteMany({ timestamp: { $lt: threeMonthsAgo } });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// @desc    Get all activity logs
// @route   GET /api/activity
// @access  Private
export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ timestamp: -1 }).limit(1000);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
