const express = require('express');
const router = express.Router();
const QuizReport = require('../models/QuizReport');
const authParams = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate-content', authParams, async (req, res) => {
  try {
    const { topic, wordLimit } = req.body;
    
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const wLimit = wordLimit || 100;
    const prompt = `Write an educational, easy-to-understand passage about ${topic}. It must be exactly ${wLimit} words long. Do not use complex jargon. Format as plain text.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('Gemini Gen Error:', error);
    res.status(500).json({ error: 'Server error generating content' });
  }
});

router.post('/generate-quiz', authParams, async (req, res) => {
  try {
    const { topic, numQuestions, difficulty } = req.body;
    
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const qCount = parseInt(numQuestions) || 3;
    const level = difficulty || 'Medium';
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Generate a multiple-choice quiz about ${topic} with ${qCount} questions at a ${level} level. You MUST return ONLY a valid JSON array of objects. Each object must have an 'id' (integer), a 'question' string, an 'options' array of 4 strings, and a 'correctIndex' integer matching the 0-based index of the correct option. Do not include markdown formatting like \`\`\`json.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawText = response.text();
    
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const mockQuestions = JSON.parse(rawText);

    res.json({ questions: mockQuestions });
  } catch (error) {
    console.error('Gemini Quiz Gen Error:', error);
    res.status(500).json({ error: 'Server error generating quiz' });
  }
});

router.post('/quiz-report', authParams, async (req, res) => {
  try {
    const { topic, score, totalQuestions } = req.body;
    const report = new QuizReport({
      userId: req.user._id,
      topic,
      score,
      totalQuestions
    });
    await report.save();
    res.json({ message: 'Quiz report saved', report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save quiz report' });
  }
});

router.get('/quizzes', authParams, async (req, res) => {
  try {
    const quizzes = await QuizReport.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching quizzes' });
  }
});

module.exports = router;
