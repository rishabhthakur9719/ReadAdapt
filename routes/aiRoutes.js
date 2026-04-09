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

    // Upgraded to the latest reliable model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const wLimit = wordLimit || 100;
    const prompt = `Write an educational, easy-to-understand passage about ${topic}. It must be exactly ${wLimit} words long. Do not use complex jargon. Format as plain text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

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

    // Feature Upgrade: Forcing Native JSON Response
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Generate a multiple-choice quiz about ${topic} with ${qCount} questions at a ${level} level. 
    Return a JSON array of objects. Each object must have an 'id' (integer), a 'question' (string), an 'options' (array of 4 strings), and a 'correctIndex' (integer 0-3).`;

    const result = await model.generateContent(prompt);

    // We can now safely parse it directly!
    const mockQuestions = JSON.parse(result.response.text());

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