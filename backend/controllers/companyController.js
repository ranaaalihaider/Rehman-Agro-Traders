import Company from '../models/Company.js';
import Item from '../models/Item.js';
import { logActivity } from './activityController.js';

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
export const getCompanies = async (req, res) => {
  const { search } = req.query;
  try {
    let query = {};
    if (search) {
      query.companyName = { $regex: search, $options: 'i' };
    }
    const companies = await Company.find(query).sort({ companyName: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a company
// @route   POST /api/companies
// @access  Private
export const createCompany = async (req, res) => {
  const { companyName } = req.body;

  if (!companyName) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    const companyExists = await Company.findOne({ companyName: companyName.trim() });
    if (companyExists) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    const company = await Company.create({ companyName: companyName.trim() });
    await logActivity('Company Created', `Added new company: ${company.companyName}`, req.user.username);
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a company
// @route   PUT /api/companies/:id
// @access  Private
export const updateCompany = async (req, res) => {
  const { companyName } = req.body;

  if (!companyName) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const companyExists = await Company.findOne({
      companyName: companyName.trim(),
      _id: { $ne: req.params.id },
    });
    if (companyExists) {
      return res.status(400).json({ message: 'Another company already has this name' });
    }

    const oldName = company.companyName;
    company.companyName = companyName.trim();
    const updatedCompany = await company.save();

    await logActivity('Company Updated', `Updated company from "${oldName}" to "${company.companyName}"`, req.user.username);
    res.json(updatedCompany);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a company
// @route   DELETE /api/companies/:id
// @access  Private
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Integrity Check: Prevent deletion if items exist for this company
    const itemsCount = await Item.countDocuments({ companyId: req.params.id });
    if (itemsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete company. It has ${itemsCount} registered items. Please delete those items first.`,
      });
    }

    await Company.findByIdAndDelete(req.params.id);
    await logActivity('Company Deleted', `Deleted company: ${company.companyName}`, req.user.username);
    res.json({ message: 'Company removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
