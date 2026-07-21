const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route mapping for AI Room Summarization
// POST /api/ai/summarize -> Summarizes room discussion & notes
router.post('/summarize', verifyToken, aiController.summarizeRoom);

// Route mapping for AI Multiple-Choice Questions Generation
// POST /api/ai/questions -> Generates 5 quiz MCQs on notes topic
router.post('/questions', verifyToken, aiController.generateQuestions);

// Route mapping for AI Doubt Explanation
// POST /api/ai/explain -> Tutoring interface to explain user doubts
router.post('/explain', verifyToken, aiController.explainDoubt);

module.exports = router;
