// Purpose: Handle requests and shape responses.

const Comment = require('../models/comment.model');
const ReviewSession = require('../models/reviewSession.model');
const ReviewerRating = require('../models/reviewerRating.model');
const { publishEvent } = require('../services/rabbitmq.service');
const { getIO } = require('../services/socket.service');

// Main flow: Validate input, call services, return output.

// Function: toScore - Handles to score.
function toScore(value) {
  const score = Number(value);
  if (Number.isNaN(score)) return null;
  if (score < 0 || score > 10) return null;
  return score;
}

// Function: postComment - Handles post comment.
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
    res.status(500).json({ error: 'Failed to post comment' });
  }
}

// Function: getComments - Returns comments.
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

// Function: completeReview - Handles complete review.
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

// Function: upsertRating - Handles upsert rating.
async function upsertRating(req, res) {
  try {
    const { session_id, candidate_id, reviewer_id, metrics } = req.body;
    if (!session_id || !candidate_id || !reviewer_id) {
      return res.status(400).json({ error: 'session_id, candidate_id and reviewer_id are required' });
    }

    const normalizedMetrics = {
      communication_score: toScore(metrics?.communication_score),
      technical_score: toScore(metrics?.technical_score),
      problem_solving_score: toScore(metrics?.problem_solving_score),
      confidence_score: toScore(metrics?.confidence_score),
      culture_fit_score: toScore(metrics?.culture_fit_score),
    };

    if (Object.values(normalizedMetrics).some((value) => value === null)) {
      return res.status(400).json({ error: 'All metric scores must be numbers between 0 and 10' });
    }

    const overall_score = Number((
      (normalizedMetrics.communication_score + normalizedMetrics.technical_score + normalizedMetrics.problem_solving_score + normalizedMetrics.confidence_score + normalizedMetrics.culture_fit_score) / 5
    ).toFixed(2));

    const rating = await ReviewerRating.findOneAndUpdate(
      { session_id, candidate_id, reviewer_id },
      {
        $set: {
          ...normalizedMetrics,
          overall_score,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true, new: true }
    );

    await publishEvent('feedback.rated', {
      sessionId: session_id,
      candidateId: candidate_id,
      reviewerId: reviewer_id,
      overallScore: overall_score,
    });

    return res.status(201).json(rating);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save reviewer rating' });
  }
}

// Function: getRatings - Returns ratings.
async function getRatings(req, res) {
  try {
    const filter = { session_id: req.params.sessionId };
    if (req.query.candidate_id) {
      filter.candidate_id = req.query.candidate_id;
    }
    if (req.query.reviewer_id) {
      filter.reviewer_id = req.query.reviewer_id;
    }

    const ratings = await ReviewerRating.find(filter).sort({ updated_at: -1 });
    return res.json(ratings);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch ratings' });
  }
}

module.exports = { postComment, getComments, completeReview, upsertRating, getRatings };
