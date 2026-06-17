import Item from '../models/Item.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import { logActivity } from './activityController.js';

// @desc    Get all items
// @route   GET /api/items
// @access  Private
export const getItems = async (req, res) => {
  const { search, companyId, category } = req.query;

  try {
    let query = {};
    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }
    if (companyId) {
      query.companyId = companyId;
    }
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        query.category = category;
      }
    }

    const items = await Item.find(query)
      .populate('companyId', 'companyName')
      .populate('category', 'name')
      .sort({ itemName: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an item
// @route   POST /api/items
// @access  Private
export const createItem = async (req, res) => {
  const { itemName, companyId, category, unit, purchasePrice, salePrice, openingStock } = req.body;

  if (!itemName || !companyId || !unit) {
    return res.status(400).json({ message: 'Item name, company, and unit are required' });
  }

  try {
    const itemExists = await Item.findOne({
      itemName: itemName.trim(),
      companyId,
    });

    if (itemExists) {
      return res.status(400).json({ message: 'This item already exists under this company' });
    }

    let finalCategory = category;
    if (!finalCategory || String(finalCategory).trim() === '') {
      const defaultCat = await Category.findOne({ name: 'fertilizers' });
      if (defaultCat) {
        finalCategory = defaultCat._id;
      }
    }

    const initialStock = Number(openingStock) || 0;

    const item = await Item.create({
      itemName: itemName.trim(),
      companyId,
      category: finalCategory,
      unit,
      purchasePrice: Number(purchasePrice) || 0,
      salePrice: Number(salePrice) || 0,
      openingStock: initialStock,
      quantity: initialStock,
    });

    const populatedItem = await Item.findById(item._id)
      .populate('companyId', 'companyName')
      .populate('category', 'name');
    
    await logActivity(
      'Item Created',
      `Created item "${item.itemName}" under "${populatedItem.companyId.companyName}" (Category: "${populatedItem.category?.name || 'fertilizers'}") with opening stock of ${initialStock} ${unit}`,
      req.user.username
    );

    res.status(201).json(populatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Private
export const updateItem = async (req, res) => {
  const { itemName, companyId, category, unit, purchasePrice, salePrice, openingStock } = req.body;

  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (itemName && companyId) {
      const itemExists = await Item.findOne({
        itemName: itemName.trim(),
        companyId,
        _id: { $ne: req.params.id },
      });
      if (itemExists) {
        return res.status(400).json({ message: 'An item with this name already exists under this company' });
      }
    }

    let finalCategory = category;
    if (finalCategory === '') {
      const defaultCat = await Category.findOne({ name: 'fertilizers' });
      if (defaultCat) {
        finalCategory = defaultCat._id;
      }
    }

    const oldOpening = item.openingStock;
    const newOpening = openingStock !== undefined ? Number(openingStock) : oldOpening;
    const diff = newOpening - oldOpening;

    item.itemName = itemName !== undefined ? itemName.trim() : item.itemName;
    item.companyId = companyId || item.companyId;
    if (finalCategory !== undefined) {
      item.category = finalCategory;
    }
    item.unit = unit || item.unit;
    item.purchasePrice = purchasePrice !== undefined ? Number(purchasePrice) : item.purchasePrice;
    item.salePrice = salePrice !== undefined ? Number(salePrice) : item.salePrice;
    item.openingStock = newOpening;
    
    item.quantity += diff;

    const updatedItem = await item.save();
    const populatedItem = await Item.findById(updatedItem._id)
      .populate('companyId', 'companyName')
      .populate('category', 'name');

    await logActivity(
      'Item Updated',
      `Updated item "${populatedItem.itemName}". Details: Category: "${populatedItem.category?.name || 'fertilizers'}", Price P/S: ${populatedItem.purchasePrice}/${populatedItem.salePrice}, Stock: ${populatedItem.quantity}`,
      req.user.username
    );

    res.json(populatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Private
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Safety check: Prevent deletion if transactions exist for this item
    const transactionsCount = await Transaction.countDocuments({
      'items.itemId': req.params.id,
    });

    if (transactionsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete item. It is linked to ${transactionsCount} stock invoice(s). Please delete those invoices first.`,
      });
    }

    await Item.findByIdAndDelete(req.params.id);
    await logActivity('Item Deleted', `Deleted item: "${item.itemName}"`, req.user.username);
    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
