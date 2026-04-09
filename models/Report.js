const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  spokenText: {
    type: String,
    required: true
  },
  accuracyScore: {
    type: Number,
    required: true
  },
  missedWords: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
