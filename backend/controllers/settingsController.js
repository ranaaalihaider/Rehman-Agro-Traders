import Business from '../models/Business.js';
import { logActivity } from './activityController.js';

// @desc    Get business profile details
// @route   GET /api/settings/profile
// @access  Public (so printable invoices don't require token, or Private)
// We make it Public so printing invoices or general page headers can load business details easily
export const getBusinessProfile = async (req, res) => {
  try {
    let profile = await Business.findOne();
    if (!profile) {
      profile = await Business.create({
        name: 'Rehman Agro Traders',
        contact: '0312-7788945',
        address: 'Chichawatni, Punjab, Pakistan',
      });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update business profile
// @route   PUT /api/settings/profile
// @access  Private
export const updateBusinessProfile = async (req, res) => {
  const { name, contact, address } = req.body;

  try {
    let profile = await Business.findOne();
    if (!profile) {
      profile = new Business();
    }
    
    const previousState = profile ? {
      name: profile.name,
      contact: profile.contact,
      address: profile.address,
    } : null;

    profile.name = name || profile.name;
    profile.contact = contact || profile.contact;
    profile.address = address || profile.address;

    const updatedProfile = await profile.save();
    
    const newState = {
      name: updatedProfile.name,
      contact: updatedProfile.contact,
      address: updatedProfile.address,
    };

    await logActivity(
      'Settings Updated', 
      `Business profile updated to: ${profile.name}`, 
      req.user ? req.user.username : 'admin',
      previousState,
      newState
    );
    
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
