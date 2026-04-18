const Comment = require('../models/comment.model');
const ReviewSession = require('../models/reviewSession.model');
const { publishEvent } = require('../services/rabbitmq.service');
const { getIO } = require('../services/socket.service');

async function postComment(req, res) {
  try {
    const { session_id, candidate_id, reviewer_id, video_timestamp_ms, text } = req.body;

    const comment = await Comment.create({ session_id, candidate_id, reviewer_id, video_timestamp_ms, text });

    await publishEvent('feedback.posted', {
      commentId: comment._id.toString(),
      sessionId: session_id,
      candidateId: candidate_id,
      reviewerId: reviewer_id,
      videoTimestampMs: video_timestamp_ms,
    });

    // Broadcast to co-reviewers via WebSocket
    getIO().to(session_id).emit('new-comment', comment);

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
}

async function getComments(req, res) {
  try {
    const filter = { session_id: req.params.sessionId };
    if (req.query.candidate_id) {
      filter.candidate_id = req.query.candidate_id;
    }

    const comments = await Comment.find(filter).sort({ video_timestamp_ms: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

async function completeReview(req, res) {
  try {
    const { reviewer_id, started_at } = req.body;
    const { sessionId } = req.params;

    const completedAt = new Date();
    const commentCount = await Comment.countDocuments({ session_id: sessionId, reviewer_id });

    const session = await ReviewSession.create({
      session_id: sessionId,
      reviewer_id,
      started_at,
      completed_at: completedAt,
      duration_seconds: (completedAt - new Date(started_at)) / 1000,
    });

    await publishEvent('review.completed', {
      sessionId,
      reviewerId: reviewer_id,
      startedAt: started_at,
      completedAt,
      commentCount,
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete review' });
  }
}

module.exports = { postComment, getComments, completeReview };
