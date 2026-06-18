// Purpose: Implement page-level UI and behavior.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import InterviewToolsPanel from '../components/InterviewToolsPanel';

// Main flow: Initialize dependencies and run module logic.

const STATUS_BADGE = { OPEN: 'badge-green', CLOSED: 'badge-gray', REVIEWING: 'badge-blue' };

// Function: average - Handles average.
function average(values) {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export default function HRDashboard() {
  const [candidateRows, setCandidateRows] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Function: loadDashboardRows - Handles load dashboard rows.
    async function loadDashboardRows() {
      try {
        const { data: sessions } = await api.get('/scheduling/sessions');
        const sessionPayloads = await Promise.all(
          sessions.map(async (session) => {
            const [assignmentsRes, ratingsRes] = await Promise.all([
              api.get(`/scheduling/sessions/${session._id}/assignments`).catch(() => ({ data: [] })),
              api.get(`/feedback/ratings/${session._id}`).catch(() => ({ data: [] })),
            ]);

            return {
              session,
              assignments: assignmentsRes.data || [],
              ratings: ratingsRes.data || [],
            };
          })
        );

        const rows = [];

        sessionPayloads.forEach(({ session, assignments, ratings }) => {
          const ratingsByCandidate = ratings.reduce((acc, rating) => {
            if (!acc[rating.candidate_id]) acc[rating.candidate_id] = [];
            acc[rating.candidate_id].push(rating);
            return acc;
          }, {});

          assignments.forEach((assignment) => {
            const candidateId = assignment.candidate_id;
            const candidateRatings = ratingsByCandidate[candidateId] || [];

            const communication = average(candidateRatings.map((item) => item.communication_score));
            const technical = average(candidateRatings.map((item) => item.technical_score));
            const problemSolving = average(candidateRatings.map((item) => item.problem_solving_score));
            const confidence = average(candidateRatings.map((item) => item.confidence_score));
            const cultureFit = average(candidateRatings.map((item) => item.culture_fit_score));
            const reviewerOverall = average(candidateRatings.map((item) => item.overall_score));

            rows.push({
              key: `${session._id}-${candidateId}`,
              sessionId: session._id,
              sessionStatus: session.status,
              deadline: session.deadline,
              candidateName: assignment?.candidate_profile?.full_name || candidateId,
              candidateEmail: assignment?.candidate_profile?.email || '—',
              communication,
              technical,
              problemSolving,
              confidence,
              cultureFit,
              reviewerOverall,
            });
          });
        });

        const rankedRows = [...rows]
          .sort((a, b) => b.reviewerOverall - a.reviewerOverall)
          .map((row, index) => ({ ...row, overallRank: index + 1 }));

        setCandidateRows(rankedRows);
      } catch (err) {
        const status = err?.response?.status;
        setError(status ? `Failed to load sessions (HTTP ${status}).` : 'Failed to load sessions.');
        setCandidateRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardRows();
  }, []);

  const totalCandidates = candidateRows.length;
  const totalSessions = new Set(candidateRows.map((row) => row.sessionId)).size;
  const averageOverall = average(candidateRows.map((row) => row.reviewerOverall));
  const topCandidate = candidateRows.find((row) => row.overallRank === 1);

  const metricAverages = [
    { label: 'Communication', value: average(candidateRows.map((row) => row.communication)) },
    { label: 'Technical', value: average(candidateRows.map((row) => row.technical)) },
    { label: 'Problem Solving', value: average(candidateRows.map((row) => row.problemSolving)) },
    { label: 'Confidence', value: average(candidateRows.map((row) => row.confidence)) },
    { label: 'Culture Fit', value: average(candidateRows.map((row) => row.cultureFit)) },
  ];

  const sessionSummaries = Object.values(
    candidateRows.reduce((acc, row) => {
      if (!acc[row.sessionId]) {
        acc[row.sessionId] = {
          sessionId: row.sessionId,
          status: row.sessionStatus,
          deadline: row.deadline,
          candidates: 0,
          totalScore: 0,
        };
      }

      acc[row.sessionId].candidates += 1;
      acc[row.sessionId].totalScore += row.reviewerOverall;
      return acc;
    }, {})
  ).map((session) => ({
    ...session,
    avgScore: session.candidates ? session.totalScore / session.candidates : 0,
  }));

  const scoreDistribution = [
    { label: '0-2', min: 0, max: 2 },
    { label: '2-4', min: 2, max: 4 },
    { label: '4-6', min: 4, max: 6 },
    { label: '6-8', min: 6, max: 8 },
    { label: '8-10', min: 8, max: 10.0001 },
  ].map((bucket) => ({
    ...bucket,
    count: candidateRows.filter((row) => row.reviewerOverall >= bucket.min && row.reviewerOverall < bucket.max).length,
  }));

  const maxDistributionCount = Math.max(...scoreDistribution.map((bucket) => bucket.count), 1);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          <div className="hero-banner mb-md">
            <p className="hero-kicker">Hiring Command Center</p>
            <div className="flex-between" style={{ alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ marginBottom: '.3rem' }}>HR Dashboard</h1>
                <p style={{ marginBottom: 0 }}>Track reviewer scores, candidate rank, and session health in one place.</p>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="tabs-shell mb-md">
            <button
              className={`tab-chip ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              type="button"
            >
              Overview
            </button>
            <button
              className={`tab-chip ${activeTab === 'rankings' ? 'active' : ''}`}
              onClick={() => setActiveTab('rankings')}
              type="button"
            >
              Candidate Rankings
            </button>
            <button
              className={`tab-chip ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
              type="button"
            >
              Session Insights
            </button>
          </div>

          <div className="card card-elevated">
            {loading ? <div className="spinner" /> : (
              <>
                {candidateRows.length === 0 && (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>No candidate metrics yet</p>
                )}

                {candidateRows.length > 0 && activeTab === 'overview' && (
                  <>
                    <div className="hr-kpi-grid mb-md">
                      <div className="kpi-card">
                        <p className="kpi-label">Candidates</p>
                        <h2>{totalCandidates}</h2>
                      </div>
                      <div className="kpi-card">
                        <p className="kpi-label">Sessions</p>
                        <h2>{totalSessions}</h2>
                      </div>
                      <div className="kpi-card">
                        <p className="kpi-label">Average Overall Score</p>
                        <h2>{averageOverall.toFixed(1)} / 10</h2>
                      </div>
                      <div className="kpi-card">
                        <p className="kpi-label">Top Candidate</p>
                        <h2 style={{ fontSize: '1.1rem' }}>{topCandidate?.candidateName || '—'}</h2>
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="card" style={{ padding: '1rem' }}>
                        <h3>Average Reviewer Metrics</h3>
                        <p className="text-muted text-sm">Score out of 10</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                          {metricAverages.map((metric) => (
                            <div key={metric.label}>
                              <div className="flex-between text-sm" style={{ marginBottom: '.2rem' }}>
                                <span>{metric.label}</span>
                                <strong>{metric.value.toFixed(1)}</strong>
                              </div>
                              <div className="chart-track">
                                <div className="chart-fill" style={{ width: `${Math.min(metric.value * 10, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card" style={{ padding: '1rem' }}>
                        <h3>Score Distribution</h3>
                        <p className="text-muted text-sm">How candidates are spread by overall score</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                          {scoreDistribution.map((bucket) => (
                            <div key={bucket.label}>
                              <div className="flex-between text-sm" style={{ marginBottom: '.2rem' }}>
                                <span>{bucket.label}</span>
                                <strong>{bucket.count}</strong>
                              </div>
                              <div className="chart-track">
                                <div className="chart-fill chart-fill-alt" style={{ width: `${(bucket.count / maxDistributionCount) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {candidateRows.length > 0 && activeTab === 'rankings' && (
                  <>
                    <div className="grid-3 mb-md">
                      {candidateRows.slice(0, 3).map((row) => (
                        <div className="kpi-card" key={`top-${row.key}`}>
                          <p className="kpi-label">Rank #{row.overallRank}</p>
                          <h3 style={{ marginBottom: '.35rem' }}>{row.candidateName}</h3>
                          <p className="text-sm" style={{ marginBottom: '.35rem' }}>{row.candidateEmail}</p>
                          <span className="badge badge-blue">{row.reviewerOverall.toFixed(1)} / 10</span>
                        </div>
                      ))}
                    </div>

                    <table className="table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Candidate</th>
                          <th>Reviewer Avg</th>
                          <th>Session</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidateRows.map((row) => (
                          <tr key={row.key}>
                            <td><span className="badge badge-blue">#{row.overallRank}</span></td>
                            <td>
                              <strong>{row.candidateName}</strong>
                              <p className="text-muted text-sm" style={{ margin: 0 }}>{row.candidateEmail}</p>
                            </td>
                            <td><strong>{row.reviewerOverall.toFixed(1)}</strong></td>
                            <td><span className={`badge ${STATUS_BADGE[row.sessionStatus] || 'badge-gray'}`}>{row.sessionStatus}</span></td>
                            <td>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => navigate(`/analytics?session=${row.sessionId}`)}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {candidateRows.length > 0 && activeTab === 'sessions' && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Session ID</th>
                        <th>Status</th>
                        <th>Candidates</th>
                        <th>Avg Score</th>
                        <th>Deadline</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionSummaries.map((session) => (
                        <tr key={session.sessionId}>
                          <td><strong>{session.sessionId.slice(0, 12)}...</strong></td>
                          <td><span className={`badge ${STATUS_BADGE[session.status] || 'badge-gray'}`}>{session.status}</span></td>
                          <td>{session.candidates}</td>
                          <td>
                            <div className="text-sm" style={{ marginBottom: '.2rem' }}><strong>{session.avgScore.toFixed(1)} / 10</strong></div>
                            <div className="chart-track" style={{ maxWidth: '140px' }}>
                              <div className="chart-fill" style={{ width: `${Math.min(session.avgScore * 10, 100)}%` }} />
                            </div>
                          </td>
                          <td>{session.deadline ? new Date(session.deadline).toLocaleDateString() : '—'}</td>
                          <td>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => navigate(`/analytics?session=${session.sessionId}`)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>

          <div className="card card-elevated mt-lg">
            <InterviewToolsPanel
              embedded
              title="HR Tools"
              description="Create universal candidate invites and verify transcript status directly from the HR dashboard."
            />
          </div>
        </div>
      </div>
    </>
  );
}
