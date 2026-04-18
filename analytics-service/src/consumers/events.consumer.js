const axios = require('axios');
const { getChannel } = require('../config/rabbitmq');
const CandidateMetrics = require('../models/candidateMetrics.model');
const ReviewerMetrics = require('../models/reviewerMetrics.model');

async function bindAndConsume(channel, exchange, handler) {
  await channel.assertExchange(exchange, 'fanout', { durable: true });
  const q = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(q.queue, exchange, '');
  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    const payload = JSON.parse(msg.content.toString());
    await handler(payload);
    channel.ack(msg);
  });
}

async function startConsumers() {
  const channel = getChannel();

  await bindAndConsume(channel, 'transcript.ready', async (payload) => {
    console.log('Analytics: transcript.ready received', payload);
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
    console.log('Analytics: feedback.posted received', payload);
    // Upsert reviewer metrics — increment comment count
    await ReviewerMetrics.findOneAndUpdate(
      { reviewer_id: payload.reviewerId, session_id: payload.sessionId },
      { $inc: { comment_count: 1 }, $set: { computed_at: new Date() } },
      { upsert: true, new: true }
    );
  });

  await bindAndConsume(channel, 'review.completed', async (payload) => {
    console.log('Analytics: review.completed received', payload);
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

  console.log('Analytics Service: All RabbitMQ consumers started');
}

module.exports = { startConsumers };
