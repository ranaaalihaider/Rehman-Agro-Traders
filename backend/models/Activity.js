import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
    default: 'admin',
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
