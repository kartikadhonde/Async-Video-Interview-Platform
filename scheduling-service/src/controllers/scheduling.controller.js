const Session = require('../models/session.model');
const QuestionSet = require('../models/questionSet.model');
const Assignment = require('../models/assignment.model');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');

async function createSession(req, res) {
  try {
    const session = await Session.create(req.body);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
}

async function listSessions(req, res) {
  try {
    const sessions = await Session.find().sort({ created_at: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
}

async function getSession(req, res) {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get session' });
  }
}

async function createQuestionSet(req, res) {
  try {
    const qs = await QuestionSet.create(req.body);
    res.status(201).json(qs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create question set' });
  }
}

async function getQuestionSet(req, res) {
  try {
    const qs = await QuestionSet.findById(req.params.id);
    if (!qs) return res.status(404).json({ error: 'Question set not found' });
    res.json(qs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get question set' });
  }
}

async function createAssignment(req, res) {
  try {
    const { session_id, candidate_id, candidate_profile } = req.body;
    const assignment = await Assignment.create({
      session_id,
      candidate_id,
      candidate_profile,
      invite_token: uuidv4(),
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
}

async function listAssignmentsBySession(req, res) {
  try {
    const { sessionId } = req.params;
    const assignments = await Assignment.find({ session_id: sessionId }).sort({ _id: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list assignments' });
  }
}

async function getAssignmentByToken(req, res) {
  try {
    const assignment = await Assignment.findOne({ invite_token: req.params.token });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get assignment' });
  }
}

async function listReviewersByIds(req, res) {
  try {
    const raw = String(req.query.ids || '').trim();
    if (!raw) return res.json([]);

    const ids = [...new Set(raw.split(',').map((id) => id.trim()).filter(Boolean))];
    if (!ids.length) return res.json([]);

    const reviewers = await User.find({ _id: { $in: ids }, role: 'reviewer' })
      .select('_id email role')
      .lean();

    const result = reviewers.map((reviewer) => {
      const email = reviewer.email || '';
      const name = email.endsWith('@reviewer.local') ? email.replace('@reviewer.local', '') : email;
      return {
        id: String(reviewer._id),
        email,
        role: reviewer.role,
        name,
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list reviewers' });
  }
}

module.exports = {
  createSession, listSessions, getSession,
  createQuestionSet, getQuestionSet,
  createAssignment, getAssignmentByToken, listAssignmentsBySession,
  listReviewersByIds,
};
