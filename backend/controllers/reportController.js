import Item from '../models/Item.js';
import Company from '../models/Company.js';
import Transaction from '../models/Transaction.js';
import Activity from '../models/Activity.js';

// Helper to format Date to Local YYYY-MM-DD
const formatDateStr = (date) => {
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();

  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

// @desc    Get dashboard summary statistics
// @route   GET /api/reports/dashboard
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const totalItems = await Item.countDocuments();

    // Current Stock stats (Total Quantity and Total Value)
    const items = await Item.find({});
    let currentTotalStock = 0;
    let totalStockValue = 0;

    items.forEach((item) => {
      currentTotalStock += item.quantity;
      totalStockValue += item.quantity * item.purchasePrice;
    });

    // Today's transaction limits
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's transactions
    const todayTransactions = await Transaction.find({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    let todayStockInQty = 0;
    let todayStockOutQty = 0;
    let todayStockInValue = 0;
    let todayStockOutValue = 0;

    todayTransactions.forEach((tx) => {
      tx.items.forEach((item) => {
        if (tx.type === 'STOCK_IN') {
          todayStockInQty += item.quantity;
          todayStockInValue += item.totalAmount;
        } else {
          todayStockOutQty += item.quantity;
          todayStockOutValue += item.totalAmount;
        }
      });
    });

    // Recent activities (limit to 5)
    const recentActivities = await Activity.find().sort({ timestamp: -1 }).limit(5);

    res.json({
      totalCompanies,
      totalItems,
      currentTotalStock,
      totalStockValue,
      todayStockInQty,
      todayStockOutQty,
      todayStockInValue,
      todayStockOutValue,
      recentActivities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Date-Wise Stock Report (Balance History)
// @route   GET /api/reports/date-wise
// @access  Private
export const getDateWiseStockReport = async (req, res) => {
  const { startDate, endDate, itemId, companyId, groupBy } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and End date are required' });
  }

  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Fetch relevant items
    let itemQuery = {};
    if (itemId) {
      itemQuery._id = itemId;
    }
    if (companyId) {
      itemQuery.companyId = companyId;
    }
    const items = await Item.find(itemQuery)
      .populate('companyId', 'companyName')
      .populate('category', 'name');

    if (items.length === 0) {
      return res.json([]);
    }

    // 2. Fetch all transactions up to the end date
    const transactions = await Transaction.find({
      date: { $lte: end },
    }).sort({ date: 1 });

    // 3. Generate date array
    const dateArray = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 4. Calculate history for each item
    const itemDataList = [];

    for (let item of items) {
      const history = [];
      let currentOpening = item.openingStock;

      // Calculate the opening stock at the start of our range
      transactions.forEach((tx) => {
        if (new Date(tx.date) < start) {
          tx.items.forEach((txItem) => {
            if (txItem.itemId.toString() === item._id.toString()) {
              if (tx.type === 'STOCK_IN') {
                currentOpening += txItem.quantity;
              } else if (tx.type === 'STOCK_OUT') {
                currentOpening -= txItem.quantity;
              }
            }
          });
        }
      });

      let runningStock = currentOpening;
      let totalStockIn = 0;
      let totalStockOut = 0;

      // Loop through each date in the range
      for (let targetDate of dateArray) {
        const targetDateStr = formatDateStr(targetDate);
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        let dayStockIn = 0;
        let dayStockOut = 0;

        transactions.forEach((tx) => {
          if (new Date(tx.date) >= dayStart && new Date(tx.date) <= dayEnd) {
            tx.items.forEach((txItem) => {
              if (txItem.itemId.toString() === item._id.toString()) {
                if (tx.type === 'STOCK_IN') {
                  dayStockIn += txItem.quantity;
                } else if (tx.type === 'STOCK_OUT') {
                  dayStockOut += txItem.quantity;
                }
              }
            });
          }
        });

        const dayOpening = runningStock;
        const dayClosing = dayOpening + dayStockIn - dayStockOut;

        history.push({
          date: targetDateStr,
          openingStock: dayOpening,
          stockIn: dayStockIn,
          stockOut: dayStockOut,
          closingStock: dayClosing,
        });

        runningStock = dayClosing;
        totalStockIn += dayStockIn;
        totalStockOut += dayStockOut;
      }

      itemDataList.push({
        itemId: item._id,
        itemName: item.itemName,
        unit: item.unit || 'Bag',
        companyId: item.companyId?._id || '',
        companyName: item.companyId?.companyName || 'Unknown Company',
        categoryId: item.category?._id || '',
        categoryName: item.category?.name || 'Uncategorized',
        openingStock: currentOpening,
        closingStock: runningStock,
        totalStockIn,
        totalStockOut,
        history,
      });
    }

    // 5. Group item data dynamically by category or company
    if (groupBy === 'category') {
      const categoryGroupMap = {};
      itemDataList.forEach((itemData) => {
        const catName = itemData.categoryName;
        if (!categoryGroupMap[catName]) {
          categoryGroupMap[catName] = {
            categoryId: itemData.categoryId,
            categoryName: catName,
            items: [],
          };
        }
        categoryGroupMap[catName].items.push({
          itemId: itemData.itemId,
          itemName: itemData.itemName,
          unit: itemData.unit,
          companyName: itemData.companyName, // expose company to frontend
          openingStock: itemData.openingStock,
          closingStock: itemData.closingStock,
          totalStockIn: itemData.totalStockIn,
          totalStockOut: itemData.totalStockOut,
          history: itemData.history,
        });
      });
      const groupedReport = Object.values(categoryGroupMap).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      res.json(groupedReport);
    } else {
      const companyGroupMap = {};
      itemDataList.forEach((itemData) => {
        const cName = itemData.companyName;
        if (!companyGroupMap[cName]) {
          companyGroupMap[cName] = {
            companyId: itemData.companyId,
            companyName: cName,
            items: [],
          };
        }
        companyGroupMap[cName].items.push({
          itemId: itemData.itemId,
          itemName: itemData.itemName,
          unit: itemData.unit,
          companyName: itemData.companyName,
          openingStock: itemData.openingStock,
          closingStock: itemData.closingStock,
          totalStockIn: itemData.totalStockIn,
          totalStockOut: itemData.totalStockOut,
          history: itemData.history,
        });
      });
      const groupedReport = Object.values(companyGroupMap).sort((a, b) => a.companyName.localeCompare(b.companyName));
      res.json(groupedReport);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
