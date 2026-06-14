import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from '../models/Company.js';
import Item from '../models/Item.js';
import Transaction from '../models/Transaction.js';

dotenv.config();

const runTests = async () => {
  console.log('Starting automated stock calculation logic tests...');
  
  // Connect to Test Database
  const TEST_MONGO_URI = process.env.MONGO_URI.replace('rehman_agro_traders', 'rehman_agro_traders_test');
  await mongoose.connect(TEST_MONGO_URI);
  console.log('Connected to test database:', TEST_MONGO_URI);

  // Clear any existing test records
  await Company.deleteMany({});
  await Item.deleteMany({});
  await Transaction.deleteMany({});

  let testCompany, testItem, tx;

  try {
    // Test 1: Setup Company and Item
    console.log('\n--- Test 1: Setup Company and Item ---');
    testCompany = await Company.create({ companyName: 'Test Agro Corp' });
    console.log('Created Company:', testCompany.companyName);

    testItem = await Item.create({
      itemName: 'Urea Test Bag',
      companyId: testCompany._id,
      unit: 'Bag',
      purchasePrice: 1000,
      salePrice: 1200,
      openingStock: 100,
      quantity: 100,
    });
    console.log(`Created Item: ${testItem.itemName}, Opening Stock: ${testItem.openingStock}, Quantity: ${testItem.quantity}`);
    if (testItem.quantity !== 100) throw new Error('Setup failed: initial quantity must equal opening stock');

    // Test 2: Create Stock In Transaction
    console.log('\n--- Test 2: Save Stock In Transaction (+50) ---');
    let itemsToBuy = [{
      itemId: testItem._id,
      itemName: testItem.itemName,
      quantity: 50,
      rate: 1000,
      totalAmount: 50 * 1000
    }];

    // Update stock level (simulating controller save)
    await Item.findByIdAndUpdate(testItem._id, { $inc: { quantity: 50 } });
    tx = await Transaction.create({
      type: 'STOCK_IN',
      customerSupplierName: testCompany.companyName,
      items: itemsToBuy,
      totalAmount: 50 * 1000,
    });

    testItem = await Item.findById(testItem._id);
    console.log(`Saved purchase invoice. New Item Quantity: ${testItem.quantity} (Expected: 150)`);
    if (testItem.quantity !== 150) throw new Error('Stock In failed: stock quantity must be 150');

    // Test 3: Edit Stock In Transaction (Shift quantity from +50 to +30)
    console.log('\n--- Test 3: Edit Stock In Transaction (Change Qty to 30) ---');
    const oldQty = tx.items[0].quantity; // 50
    const newQty = 30;
    
    // Reverse old, apply new
    await Item.findByIdAndUpdate(testItem._id, { $inc: { quantity: -oldQty } }); // 150 - 50 = 100
    await Item.findByIdAndUpdate(testItem._id, { $inc: { quantity: newQty } });  // 100 + 30 = 130
    
    tx.items[0].quantity = newQty;
    tx.items[0].totalAmount = newQty * tx.items[0].rate;
    tx.totalAmount = newQty * tx.items[0].rate;
    await tx.save();

    testItem = await Item.findById(testItem._id);
    console.log(`Updated purchase invoice. New Item Quantity: ${testItem.quantity} (Expected: 130)`);
    if (testItem.quantity !== 130) throw new Error('Stock In Edit failed: stock quantity must be 130');

    // Test 4: Create Stock Out Transaction
    console.log('\n--- Test 4: Save Stock Out Transaction (-20) ---');
    let itemsToSell = [{
      itemId: testItem._id,
      itemName: testItem.itemName,
      quantity: 20,
      rate: 1200,
      totalAmount: 20 * 1200
    }];

    // Update stock level (simulating controller save)
    await Item.findByIdAndUpdate(testItem._id, { $inc: { quantity: -20 } }); // 130 - 20 = 110
    const salesTx = await Transaction.create({
      type: 'STOCK_OUT',
      customerSupplierName: 'Ali Traders',
      items: itemsToSell,
      totalAmount: 20 * 1200,
    });

    testItem = await Item.findById(testItem._id);
    console.log(`Saved sales invoice. New Item Quantity: ${testItem.quantity} (Expected: 110)`);
    if (testItem.quantity !== 110) throw new Error('Stock Out failed: stock quantity must be 110');

    // Test 5: Delete Stock Out Transaction (Should reverse the -20 back to +20)
    console.log('\n--- Test 5: Delete Stock Out Transaction (Should return +20) ---');
    await Item.findByIdAndUpdate(testItem._id, { $inc: { quantity: salesTx.items[0].quantity } }); // 110 + 20 = 130
    await Transaction.findByIdAndDelete(salesTx._id);

    testItem = await Item.findById(testItem._id);
    console.log(`Deleted sales invoice. New Item Quantity: ${testItem.quantity} (Expected: 130)`);
    if (testItem.quantity !== 130) throw new Error('Stock Out delete reversal failed');

    // Test 6: Delete Stock In Transaction (Should reverse the +30 back to -30, ending at original opening 100)
    console.log('\n--- Test 6: Delete Stock In Transaction (Should return to original 100) ---');
    await Item.findByIdAndUpdate(testItem._id, { $inc: { quantity: -tx.items[0].quantity } }); // 130 - 30 = 100
    await Transaction.findByIdAndDelete(tx._id);

    testItem = await Item.findById(testItem._id);
    console.log(`Deleted purchase invoice. New Item Quantity: ${testItem.quantity} (Expected: 100)`);
    if (testItem.quantity !== 100) throw new Error('Stock In delete reversal failed');

    console.log('\n=========================================');
    console.log('🎉 ALL LOGIC TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('=========================================');

  } catch (error) {
    console.error('\n❌ TEST ERROR EXCEPTION:', error.message);
    process.exit(1);
  } finally {
    // Cleanup and disconnect
    await Company.deleteMany({});
    await Item.deleteMany({});
    await Transaction.deleteMany({});
    await mongoose.disconnect();
    console.log('\nDatabase cleaned and disconnected.');
  }
};

runTests();
