const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Assignment = require('../models/assignment.model');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

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

module.exports = { login, register, inviteLogin };
