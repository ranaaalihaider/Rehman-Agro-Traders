import Transaction from '../models/Transaction.js';
import Item from '../models/Item.js';
import { logActivity } from './activityController.js';

// @desc    Get all transactions / invoices
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  const { type, startDate, endDate, search } = req.query;

  try {
    let query = {};
    if (type) {
      query.type = type;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerSupplierName: { $regex: search, $options: 'i' } },
        { 'items.itemName': { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a transaction (Stock In / Stock Out)
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  const { type, date, invoiceNumber, customerSupplierName, notes, items } = req.body;

  if (!type || !items || items.length === 0) {
    return res.status(400).json({ message: 'Type and at least one item are required' });
  }

  try {
    // 1. Process items and validate stock levels
    let processedItems = [];
    let invoiceTotal = 0;

    for (let item of items) {
      const dbItem = await Item.findById(item.itemId);
      if (!dbItem) {
        return res.status(404).json({ message: `Item ${item.itemName} not found` });
      }

      const qty = Number(item.quantity);
      const rate = Number(item.rate);
      const lineTotal = qty * rate;
      invoiceTotal += lineTotal;

      // Validate stock for Stock Out
      if (type === 'STOCK_OUT') {
        if (dbItem.quantity < qty) {
          return res.status(400).json({
            message: `Insufficient stock for "${dbItem.itemName}". Available: ${dbItem.quantity} ${dbItem.unit}, Requested: ${qty} ${dbItem.unit}`,
          });
        }
      }

      processedItems.push({
        itemId: item.itemId,
        itemName: dbItem.itemName,
        quantity: qty,
        rate,
        totalAmount: lineTotal,
      });
    }

    // 2. Update stock in DB
    for (let item of processedItems) {
      const change = type === 'STOCK_IN' ? item.quantity : -item.quantity;
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: change } });
    }

    // 3. Save transaction
    const transaction = await Transaction.create({
      type,
      date: date ? new Date(date) : new Date(),
      invoiceNumber: invoiceNumber ? invoiceNumber.trim() : '',
      customerSupplierName: customerSupplierName ? customerSupplierName.trim() : '',
      notes: notes ? notes.trim() : '',
      items: processedItems,
      totalAmount: invoiceTotal,
      createdBy: req.user.username,
    });

    const activityDesc = `${type === 'STOCK_IN' ? 'Stock In (Purchase)' : 'Stock Out (Sale)'} invoice created by "${req.user.name}" (${req.user.username}). Invoice #: ${transaction.invoiceNumber || transaction._id.toString().substring(18)}, Total: ${invoiceTotal}`;
    await logActivity('Invoice Created', activityDesc, req.user.username);

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  const { date, invoiceNumber, customerSupplierName, notes, items } = req.body;

  try {
    const oldTx = await Transaction.findById(req.params.id);
    if (!oldTx) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const previousState = {
      invoiceNumber: oldTx.invoiceNumber,
      customerSupplierName: oldTx.customerSupplierName,
      totalAmount: oldTx.totalAmount,
      notes: oldTx.notes,
      date: oldTx.date,
      items: oldTx.items.map(i => ({
        itemName: i.itemName,
        quantity: i.quantity,
        rate: i.rate,
        totalAmount: i.totalAmount,
      })),
    };

    const type = oldTx.type; // Type cannot change for safety

    // 1. Pre-validate stock changes in-memory
    let processedItems = [];
    let invoiceTotal = 0;
    
    // Create a map of items from the new request
    const newItemsMap = new Map();
    for (let item of items) {
      newItemsMap.set(item.itemId.toString(), item);
    }

    // Combine all item IDs that are affected (either in old, new, or both)
    const allItemIds = new Set([
      ...oldTx.items.map(i => i.itemId.toString()),
      ...items.map(i => i.itemId.toString()),
    ]);

    // Check stock levels dynamically
    for (let itemIdStr of allItemIds) {
      const dbItem = await Item.findById(itemIdStr);
      if (!dbItem) {
        // If it was in the old invoice but now deleted from system, verify
        continue;
      }

      // Old qty in this transaction
      const oldItem = oldTx.items.find(i => i.itemId.toString() === itemIdStr);
      const oldQty = oldItem ? oldItem.quantity : 0;

      // New qty in this transaction
      const newItem = newItemsMap.get(itemIdStr);
      const newQty = newItem ? Number(newItem.quantity) : 0;

      // Simulate stock level
      let simulatedStock = dbItem.quantity;
      // Reverse old transaction impact
      simulatedStock += (type === 'STOCK_IN' ? -oldQty : oldQty);
      // Apply new transaction impact
      simulatedStock += (type === 'STOCK_IN' ? newQty : -newQty);

      if (type === 'STOCK_OUT' && simulatedStock < 0) {
        return res.status(400).json({
          message: `Insufficient stock for "${dbItem.itemName}" if edited. Resulting stock would be ${simulatedStock} ${dbItem.unit}, but only ${dbItem.quantity} ${dbItem.unit} is currently in stock.`,
        });
      }
    }

    // 2. Apply Stock Updates (Reverse old, then Apply new)
    // Reverse old
    for (let oldItem of oldTx.items) {
      const reverseChange = type === 'STOCK_IN' ? -oldItem.quantity : oldItem.quantity;
      await Item.findByIdAndUpdate(oldItem.itemId, { $inc: { quantity: reverseChange } });
    }

    // Apply new and gather processed details
    for (let item of items) {
      const dbItem = await Item.findById(item.itemId);
      if (!dbItem) continue;

      const qty = Number(item.quantity);
      const rate = Number(item.rate);
      const lineTotal = qty * rate;
      invoiceTotal += lineTotal;

      const newChange = type === 'STOCK_IN' ? qty : -qty;
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: newChange } });

      processedItems.push({
        itemId: item.itemId,
        itemName: dbItem.itemName,
        quantity: qty,
        rate,
        totalAmount: lineTotal,
      });
    }

    // 3. Save updated transaction details
    oldTx.date = date ? new Date(date) : oldTx.date;
    oldTx.invoiceNumber = invoiceNumber !== undefined ? invoiceNumber.trim() : oldTx.invoiceNumber;
    oldTx.customerSupplierName = customerSupplierName !== undefined ? customerSupplierName.trim() : oldTx.customerSupplierName;
    oldTx.notes = notes !== undefined ? notes.trim() : oldTx.notes;
    oldTx.items = processedItems;
    oldTx.totalAmount = invoiceTotal;
    oldTx.createdBy = req.user.username; // Track editor

    const updatedTx = await oldTx.save();
    
    const newState = {
      invoiceNumber: updatedTx.invoiceNumber,
      customerSupplierName: updatedTx.customerSupplierName,
      totalAmount: updatedTx.totalAmount,
      notes: updatedTx.notes,
      date: updatedTx.date,
      items: updatedTx.items.map(i => ({
        itemName: i.itemName,
        quantity: i.quantity,
        rate: i.rate,
        totalAmount: i.totalAmount,
      })),
    };

    const activityDesc = `${type === 'STOCK_IN' ? 'Stock In (Purchase)' : 'Stock Out (Sale)'} invoice edited by "${req.user.name}" (${req.user.username}). Invoice #: ${updatedTx.invoiceNumber || updatedTx._id.toString().substring(18)}, New Total: ${invoiceTotal}`;
    await logActivity('Invoice Edited', activityDesc, req.user.username, previousState, newState);

    res.json(updatedTx);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { type, items, invoiceNumber } = transaction;

    // 1. Pre-validate that deleting a Stock In doesn't drive stock below 0
    if (type === 'STOCK_IN') {
      for (let item of items) {
        const dbItem = await Item.findById(item.itemId);
        if (dbItem && dbItem.quantity - item.quantity < 0) {
          return res.status(400).json({
            message: `Cannot delete Stock In invoice. Doing so would remove ${item.quantity} ${dbItem.unit} of "${dbItem.itemName}", driving its stock below zero (Current stock: ${dbItem.quantity}).`,
          });
        }
      }
    }

    // 2. Reverse stock changes
    for (let item of items) {
      const change = type === 'STOCK_IN' ? -item.quantity : item.quantity;
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: change } });
    }

    // 3. Remove transaction
    await Transaction.findByIdAndDelete(req.params.id);

    const activityDesc = `${type === 'STOCK_IN' ? 'Stock In (Purchase)' : 'Stock Out (Sale)'} invoice deleted. Invoice #: ${invoiceNumber || transaction._id.toString().substring(18)}`;
    await logActivity('Invoice Deleted', activityDesc, req.user.username);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
