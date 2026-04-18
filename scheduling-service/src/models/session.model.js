const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  company_id: { type: String, required: true },
  title: { type: String, required: true },
  question_set_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionSet' },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'REVIEWING'],
    default: 'OPEN',
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', sessionSchema);
