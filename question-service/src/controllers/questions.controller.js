const FIXED_QUESTIONS = [
    'Introduce yourself',
    'What project are you proud of?',
    'What are your strengths and weaknesses?',
    'What do you hope to accomplish by joining our company?',
];

function getFixedQuestions(req, res) {
    const questions = FIXED_QUESTIONS.map((text, index) => ({
        id: `q${index + 1}`,
        text,
        time_limit_seconds: 60,
        order: index + 1,
    }));

    res.json({
        interview_type: 'fixed',
        total_questions: questions.length,
        questions,
    });
}

module.exports = { getFixedQuestions };
