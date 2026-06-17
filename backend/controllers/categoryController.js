import Category from '../models/Category.js';
import Item from '../models/Item.js';
import { logActivity } from './activityController.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
  const { search } = req.query;
  try {
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const categories = await Category.find(query).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const categoryExists = await Category.findOne({ name: name.trim() });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name: name.trim() });
    await logActivity(
      'Category Created', 
      `Added new category: ${category.name}`, 
      req.user.username,
      null,
      { categoryName: category.name }
    );
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const categoryExists = await Category.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });
    if (categoryExists) {
      return res.status(400).json({ message: 'Another category already has this name' });
    }

    const oldName = category.name;
    category.name = name.trim();
    const updatedCategory = await category.save();

    await logActivity(
      'Category Updated', 
      `Updated category from "${oldName}" to "${category.name}"`, 
      req.user.username,
      { categoryName: oldName },
      { categoryName: category.name }
    );
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Integrity Check: Prevent deletion if items exist for this category
    const itemsCount = await Item.countDocuments({ category: req.params.id });
    if (itemsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. It is linked to ${itemsCount} registered items. Please reassign or delete those items first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    await logActivity(
      'Category Deleted', 
      `Deleted category: ${category.name}`, 
      req.user.username,
      { categoryName: category.name },
      null
    );
    res.json({ message: 'Category removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
