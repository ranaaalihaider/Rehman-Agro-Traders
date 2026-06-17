import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    unit: {
      type: String,
      required: true,
      enum: ['Bag', 'Kg', 'Liter', 'Pack', 'Bottle', 'Other'],
      default: 'Bag',
    },
    purchasePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    salePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    openingStock: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0, // Gets computed or set on creation as openingStock
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of item name per company
itemSchema.index({ itemName: 1, companyId: 1 }, { unique: true });

const Item = mongoose.model('Item', itemSchema);
export default Item;
