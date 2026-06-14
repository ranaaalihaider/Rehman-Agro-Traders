import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.model('Company', companySchema);
export default Company;
