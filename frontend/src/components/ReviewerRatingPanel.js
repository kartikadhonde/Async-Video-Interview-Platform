import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const METRICS = [
    { key: 'communication_score', label: 'Communication' },
    { key: 'technical_score', label: 'Technical depth' },
    { key: 'problem_solving_score', label: 'Problem solving' },
    { key: 'confidence_score', label: 'Confidence' },
    { key: 'culture_fit_score', label: 'Culture fit' },
];

const DEFAULT_SCORES = {
    communication_score: 5,
    technical_score: 5,
    problem_solving_score: 5,
    confidence_score: 5,
    culture_fit_score: 5,
};

export default function ReviewerRatingPanel({ sessionId, candidateId, onSaved }) {
    const { user } = useAuth();
    const [scores, setScores] = useState(DEFAULT_SCORES);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!sessionId || !candidateId || !user?.id) return;

        async function fetchExistingRating() {
            setLoading(true);
            setMessage('');
            try {
                const { data } = await api.get(`/feedback/ratings/${sessionId}?candidate_id=${encodeURIComponent(candidateId)}&reviewer_id=${encodeURIComponent(user.id)}`);
                const existing = data?.[0];
                if (!existing) {
                    setScores(DEFAULT_SCORES);
                    return;
                }

                setScores({
                    communication_score: existing.communication_score ?? 5,
                    technical_score: existing.technical_score ?? 5,
                    problem_solving_score: existing.problem_solving_score ?? 5,
                    confidence_score: existing.confidence_score ?? 5,
                    culture_fit_score: existing.culture_fit_score ?? 5,
                });
            } catch {
                setScores(DEFAULT_SCORES);
            } finally {
                setLoading(false);
            }
        }

        fetchExistingRating();
    }, [sessionId, candidateId, user?.id]);

    const overallScore = useMemo(() => {
        const total = Object.values(scores).reduce((acc, value) => acc + Number(value || 0), 0);
        return (total / METRICS.length).toFixed(1);
    }, [scores]);

    async function handleSaveRating(e) {
        e.preventDefault();
        if (!sessionId || !candidateId || !user?.id) return;

        setSaving(true);
        setMessage('');
        try {
            await api.post('/feedback/ratings', {
                session_id: sessionId,
                candidate_id: candidateId,
                reviewer_id: user.id,
                metrics: scores,
            });
            setMessage('Rating saved.');
            onSaved?.();
        } catch (err) {
            const serverError = err?.response?.data?.error;
            setMessage(serverError || 'Failed to save rating.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <h3>Candidate Rating</h3>
            <p className="text-muted text-sm" style={{ marginBottom: '.75rem' }}>Score each metric out of 10.</p>
            <hr className="divider" />

            {loading ? <div className="spinner" /> : (
                <form onSubmit={handleSaveRating} style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {METRICS.map((metric) => (
                        <div key={metric.key}>
                            <div className="flex-between" style={{ marginBottom: '.3rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>{metric.label}</label>
                                <strong>{scores[metric.key]}/10</strong>
                            </div>
                            <input
                                className="rating-slider"
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={scores[metric.key]}
                                onChange={(e) => setScores((prev) => ({ ...prev, [metric.key]: Number(e.target.value) }))}
                            />
                        </div>
                    ))}

                    <div className="alert alert-info" style={{ marginBottom: 0 }}>
                        Current overall score: <strong>{overallScore}/10</strong>
                    </div>

                    {message && (
                        <p className="text-sm" style={{ color: message.includes('saved') ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
                            {message}
                        </p>
                    )}

                    <button className="btn btn-primary btn-sm" type="submit" disabled={saving || !candidateId}>
                        {saving ? 'Saving...' : 'Save rating'}
                    </button>
                </form>
            )}
        </div>
    );
}
