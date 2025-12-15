const Material = require('../models/Material');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// @desc Process Purchase
exports.createPurchase = async (req, res) => {
    try {
        const { vendor, itemId, itemType, qty, unitPrice } = req.body;
        const totalAmount = Number(qty) * Number(unitPrice);

        if (itemType === 'Raw Material') {
            // Update Raw Material Stock
            const material = await Material.findById(itemId);
            if (!material) return res.status(404).json({ msg: 'Material not found' });
            
            // INCREASE STOCK
            material.stock.current += Number(qty);
            // Update Cost (Simple Average or Last Purchase Price)
            material.costPerUnit = Number(unitPrice);
            await material.save();

        } else if (itemType === 'Finished Good') {
            // Update Product Stock (For "Full Buy" Trading)
            const product = await Product.findById(itemId);
            if (!product) return res.status(404).json({ msg: 'Product not found' });

            // INCREASE WAREHOUSE STOCK
            product.stock.warehouse += Number(qty);
            await product.save();
        }

        // Update Vendor Balance (We owe them money)
        await Vendor.findByIdAndUpdate(vendor, { $inc: { balance: totalAmount } });

        res.json({ success: true, msg: 'Purchase Recorded & Stock Updated' });

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};