import mongoose from 'mongoose';

const transactionItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Rate cannot be negative'],
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
});

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['STOCK_IN', 'STOCK_OUT'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    customerSupplierName: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    items: [transactionItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
