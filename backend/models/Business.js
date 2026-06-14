import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Rehman Agro Traders',
    },
    contact: {
      type: String,
      required: true,
      default: '0312-7788945',
    },
    address: {
      type: String,
      required: true,
      default: 'Chichawatni, Punjab, Pakistan',
    },
  },
  {
    timestamps: true,
  }
);

const Business = mongoose.model('Business', businessSchema);
export default Business;
