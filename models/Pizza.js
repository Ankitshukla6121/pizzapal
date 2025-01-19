const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema({
    name: String,
    price: Number,
    ingredients: [String],
});

module.exports = mongoose.model('Pizza', pizzaSchema);
