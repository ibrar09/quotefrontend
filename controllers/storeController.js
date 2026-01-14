import * as storeService from '../services/storeService.js';
import { Job, JobItem, PriceList, CustomStore } from '../models/index.js';

// Create a new store
export const createStore = async (req, res) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json({ success: true, data: store });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all stores
export const getStores = async (req, res) => {
  try {
    const stores = await storeService.getAllStores();
    res.status(200).json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get single store by CCID + all items (PriceList or JobItems)
export const getStore = async (req, res) => {
  try {
    const ccid = req.params.ccid;

    // 1️⃣ Fetch store from Master List
    let store = await storeService.getStoreByCCID(ccid);

    // 1b. If not in Master, check Custom Stores
    if (!store) {
      store = await CustomStore.findByPk(ccid);
    }

    if (!store) {
      return res.status(404).json({ success: false, message: 'Invalid CCID / Store not found' });
    }

    // 2️⃣ Fetch all jobs for this store
    const jobs = await Job.findAll({
      where: { oracle_ccid: ccid },
      include: [{ model: JobItem }] // include JobItems linked to the jobs
    });

    // 3️⃣ Optional: Fetch the price list items if you want auto-fill from catalog
    const priceListItems = await PriceList.findAll();

    // 4️⃣ Return combined data
    res.status(200).json({
      success: true,
      data: {
        store,
        jobs,
        priceListItems
      }
    });

  } catch (err) {
    console.error('Error fetching store:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update store
export const updateStore = async (req, res) => {
  try {
    const updatedStore = await storeService.updateStore(req.params.ccid, req.body);
    res.status(200).json({ success: true, data: updatedStore });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete store
export const deleteStore = async (req, res) => {
  try {
    await storeService.deleteStore(req.params.ccid);
    res.status(200).json({ success: true, message: 'Store deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


export const searchStores = async (req, res) => {
  try {
    const { q } = req.query;
    const stores = await Store.findAll({
      where: {
        [Op.or]: [
          { oracle_ccid: { [Op.iLike]: `%${q}%` } },
          { store_name: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: 10
    });

    res.status(200).json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};