// Purpose: Define data models and schema rules.

const mongoose = require('mongoose');

// Main flow: Execute core operations and return results.

const questionSetSchema = new mongoose.Schema({
  company_id: { type: String, required: true },
  questions: [
    {
      text: { type: String, required: true },
      time_limit_seconds: { type: Number, default: 120 },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuestionSet', questionSetSchema);
