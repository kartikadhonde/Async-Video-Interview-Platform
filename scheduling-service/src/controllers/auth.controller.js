// Purpose: Handle requests and shape responses.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Assignment = require('../models/assignment.model');

// Main flow: Validate input, call services, return output.

const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'admin';

// Function: buildReviewerEmail - Builds reviewer email.
function buildReviewerEmail(username) {
  return `${username.toLowerCase()}@reviewer.local`;
}

// Function: login - Handles login. hr 
async function login(req, res) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    let user = await User.findOne({ email });

    if (!user && email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      const password_hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      user = await User.create({
        email: DEFAULT_ADMIN_EMAIL,
        password_hash,
        role: 'HR',
        company_id: 'default',
      });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign( //id badge
      { id: user._id, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

// Function: register - Handles register. hr admin
async function register(req, res) {
  try {
    const { email, password, role, company_id } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, role, company_id });
    res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
}

// Function: reviewerLogin - Handles reviewer login.
async function reviewerLogin(req, res) {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!/^reviewer\d+$/.test(username)) {
      return res.status(400).json({ error: 'Username must be in format reviewer1, reviewer2, ...' });
    }

    if (password !== 'review') {
      return res.status(401).json({ error: 'Invalid reviewer credentials' });
    }

    const email = buildReviewerEmail(username);
    let user = await User.findOne({ email });

    if (!user) {
      const password_hash = await bcrypt.hash('review', 10);
      user = await User.create({
        email,
        password_hash,
        role: 'reviewer',
        company_id: 'reviewers',
      });
    }

    if (user.role !== 'reviewer') {
      return res.status(403).json({ error: 'User is not a reviewer' });
    }

    const token = jwt.sign(
      { id: user._id, role: 'reviewer', company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: username,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Reviewer login failed' });
  }
}

// Function: inviteLogin - Handles invite login.
async function inviteLogin(req, res) {
  try {
    const { invite_token, candidate_profile } = req.body;
    if (!invite_token) return res.status(400).json({ error: 'invite_token is required' });

    const assignment = await Assignment.findOne({ invite_token });
    if (!assignment) return res.status(401).json({ error: 'Invalid invite token' });

    const profile = {
      full_name: candidate_profile?.full_name?.trim() || assignment.candidate_profile?.full_name || '',
      email: candidate_profile?.email?.trim() || assignment.candidate_profile?.email || '',
      phone: candidate_profile?.phone?.trim() || assignment.candidate_profile?.phone || '',
      college: candidate_profile?.college?.trim() || assignment.candidate_profile?.college || '',
    };

    assignment.candidate_profile = profile;
    await assignment.save();

    const candidateId = assignment.candidate_id;
    const token = jwt.sign(
      {
        id: candidateId,
        role: 'candidate',
        session_id: assignment.session_id?.toString(),
        candidate_name: profile.full_name || candidateId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id: candidateId,
        email: `candidate+${candidateId}@invite.local`,
        role: 'candidate',
        name: profile.full_name || candidateId,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Invite login failed' });
  }
}

module.exports = { login, register, inviteLogin, reviewerLogin };
