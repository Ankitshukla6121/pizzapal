const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerName: String,
    pizzaId: mongoose.Schema.Types.ObjectId,
    address: String,
    phone: String,
    status: { type: String, default: 'Pending' },
});

module.exports = mongoose.model('Order', orderSchema);
