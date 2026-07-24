// Purpose: Provide reusable service/business logic.

const axios = require('axios');
const { getChannel } = require('../config/rabbitmq');
const CandidateMetrics = require('../models/candidateMetrics.model');
const ReviewerMetrics = require('../models/reviewerMetrics.model');

// Main flow: Execute core operations and return results.

// Function: bindAndConsume - Handles bind and consume.
async function bindAndConsume(channel, exchange, handler) {
  await channel.assertExchange(exchange, 'fanout', { durable: true });
  const q = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(q.queue, exchange, '');
  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error('Failed to parse message payload from exchange', exchange, err);
      try { channel.ack(msg); } catch (e) { console.error('Failed to ack malformed message', e); }
      return;
    }

    try {
      await handler(payload);
      channel.ack(msg);
    } catch (err) {
      console.error('Error handling message from exchange', exchange, err);
      try {
        // Do not requeue to avoid poison-message loops
        channel.nack(msg, false, false);
      } catch (nackErr) {
        console.error('Failed to nack message', nackErr);
      }
    }
  });
}

// Function: startConsumers - Starts consumers.
async function startConsumers() {
  const channel = getChannel();

  await bindAndConsume(channel, 'transcript.ready', async (payload) => {
    const { data: transcript } = await axios.get(
      `${process.env.TRANSCRIPTION_SERVICE_URL}/transcription/${payload.videoId}`
    );
    // Basic filler word count as a stub metric
    const fillerWords = ['um', 'uh', 'like', 'you know'];
    const text = transcript.full_text.toLowerCase();
    const fillerCount = fillerWords.reduce((acc, w) => acc + (text.split(w).length - 1), 0);

    await CandidateMetrics.create({
      candidate_id: payload.candidateId,
      session_id: payload.sessionId,
      filler_word_count: fillerCount,
      talk_time_seconds: transcript.duration_seconds || 0,
    });
  });

  await bindAndConsume(channel, 'feedback.posted', async (payload) => {
    // Upsert reviewer metrics — increment comment count
    await ReviewerMetrics.findOneAndUpdate(
      { reviewer_id: payload.reviewerId, session_id: payload.sessionId },
      { $inc: { comment_count: 1 }, $set: { computed_at: new Date() } },
      { upsert: true, new: true }
    );
  });

  await bindAndConsume(channel, 'review.completed', async (payload) => {
    await ReviewerMetrics.findOneAndUpdate(
      { reviewer_id: payload.reviewerId, session_id: payload.sessionId },
      {
        $set: {
          review_duration_seconds: (new Date(payload.completedAt) - new Date(payload.startedAt)) / 1000,
          comment_count: payload.commentCount,
          computed_at: new Date(),
        },
      },
      { upsert: true }
    );
  });
}

module.exports = { startConsumers };
