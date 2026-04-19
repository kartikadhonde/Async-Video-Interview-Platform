const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  candidate_id: { type: String, required: true },
  candidate_profile: {
    full_name: { type: String },
    email: { type: String },
    phone: { type: String },
    college: { type: String },
  },
  invite_token: { type: String, required: true, unique: true },
  submitted_at: { type: Date },
  status: {
    type: String,
    enum: ['INVITED', 'SUBMITTED', 'REVIEWED'],
    default: 'INVITED',
  },
});

module.exports = mongoose.model('Assignment', assignmentSchema);
