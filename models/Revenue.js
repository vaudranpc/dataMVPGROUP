// models/Revenue.js
const mongoose = require('mongoose');

const RevenueSchema = new mongoose.Schema({
  product: {
    type: String,
    enum: ['Politik 225', 'MVP Foot', 'Radio MVP Foot'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Revenue', RevenueSchema);
