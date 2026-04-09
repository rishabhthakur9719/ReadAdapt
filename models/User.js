const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  specification: {
    type: String,
    enum: ['Dyslexia', 'ADHD', 'Blind', 'Clinical', ''],
    default: ''
  },
  onboardingComplete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
