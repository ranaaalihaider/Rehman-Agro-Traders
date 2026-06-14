import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Business from '../models/Business.js';
import Company from '../models/Company.js';
import Item from '../models/Item.js';
import Transaction from '../models/Transaction.js';
import Activity from '../models/Activity.js';

dotenv.config();

const resetDatabase = async () => {
  console.log('Starting full database reset and audit correction...');
  try {
    // Connect to database
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in process environment. Make sure you are running from backend folder.');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Delete all records from collections
    console.log('Cleaning collection: Users...');
    await User.deleteMany({});
    
    console.log('Cleaning collection: Businesses...');
    await Business.deleteMany({});
    
    console.log('Cleaning collection: Companies...');
    await Company.deleteMany({});
    
    console.log('Cleaning collection: Items...');
    await Item.deleteMany({});
    
    console.log('Cleaning collection: Transactions...');
    await Transaction.deleteMany({});
    
    console.log('Cleaning collection: Activities...');
    await Activity.deleteMany({});

    console.log('All collections cleaned successfully.');

    // 2. Seed default admin user
    const admin = await User.create({
      name: 'Admin',
      username: 'admin',
      password: 'Ali@123456',
    });
    console.log(`Seeded Default Administrator: Username: "${admin.username}", Password: "[Ali@123456]"`);

    // 3. Seed default business details
    const business = await Business.create({
      name: 'Rehman Agro Traders',
      contact: '0312-7788945',
      address: 'Chichawatni, Punjab, Pakistan',
    });
    console.log(`Seeded Default Business Profile: "${business.name}"`);

    // 4. Log reset action in activity log
    await Activity.create({
      action: 'Database Reset',
      description: 'The database was fully wiped and re-seeded to correct opening stock audit logs.',
      user: 'System',
    });
    console.log('System Activity log initialized.');

    console.log('\n=================================================');
    console.log('🎉 DATABASE HAS BEEN SUCCESSFULLY RESET & AUDITED! 🎉');
    console.log('=================================================\n');

  } catch (error) {
    console.error('❌ Error during database reset:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

resetDatabase();
