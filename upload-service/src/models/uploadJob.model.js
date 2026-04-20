const mongoose = require('mongoose');

const uploadJobSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  candidate_id: { type: String, required: true },
  candidate_name: { type: String },
  question_boundaries: [
    {
      question_id: { type: String },
      question_text: { type: String },
      started_at_ms: { type: Number },
      ended_at_ms: { type: Number },
    },
  ],
  minio_url: { type: String },
  status: {
    type: String,
    enum: ['UPLOADING', 'COMPLETE', 'FAILED'],
    default: 'UPLOADING',
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UploadJob', uploadJobSchema);
