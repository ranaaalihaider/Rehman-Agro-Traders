import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Import Models for Seeding
import User from './models/User.js';
import Business from './models/Business.js';
import Category from './models/Category.js';
import Item from './models/Item.js';

dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/settings', settingsRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Rehman Agro Traders API is running...');
});

// Seed defaults
const seedDefaults = async () => {
  try {
    // 1. Seed default Admin User if not exists
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      await User.create({
        name: 'Admin',
        username: 'admin',
        password: 'Ali@123456',
      });
      console.log('Default admin user seeded: admin / Ali@123456');
    } else {
      adminUser.name = 'Admin';
      adminUser.password = 'Ali@123456';
      await adminUser.save();
      console.log('Default admin user verified/updated: admin / Ali@123456');
    }

    // 2. Seed default Business details if not exists
    const businessCount = await Business.countDocuments();
    if (businessCount === 0) {
      await Business.create({
        name: 'Rehman Agro Traders',
        contact: '0312-7788945',
        address: 'Chichawatni, Punjab, Pakistan',
      });
      console.log('Default business details seeded.');
    }

    // 3. Seed default Category 'fertilizers' if not exists
    let defaultCategory = await Category.findOne({ name: 'fertilizers' });
    if (!defaultCategory) {
      defaultCategory = await Category.create({ name: 'fertilizers' });
      console.log('Default fertilizers category seeded.');
    }

    // 4. Data Migration: Update existing items to Category ObjectId reference
    const itemsToUpdate = await Item.find({
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: { $type: 'string' } }
      ]
    });

    if (itemsToUpdate.length > 0) {
      console.log(`Migrating ${itemsToUpdate.length} items to new category system...`);
      for (let item of itemsToUpdate) {
        let categoryName = 'fertilizers';
        if (item.category && typeof item.category === 'string' && item.category.trim() !== '') {
          categoryName = item.category.trim();
        }

        let cat = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });
        if (!cat) {
          cat = await Category.create({ name: categoryName.toLowerCase() });
          console.log(`Seeded category from legacy item value: ${categoryName}`);
        }
        item.category = cat._id;
        await item.save();
      }
      console.log('Migration completed successfully.');
    }
  } catch (error) {
    console.error('Error seeding defaults:', error);
  }
};

// Execute seeding after connection has been made
setTimeout(seedDefaults, 5000);

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
