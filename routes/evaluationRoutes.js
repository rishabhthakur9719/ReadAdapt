const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const authParams = require('../middleware/auth');

const calculateEvaluation = (transcript, targetText) => {
  // Normalize strings to lowercase and strip punctuation
  const normalizedSpoken = transcript.toLowerCase().replace(/[.,!?]/g, '');
  const normalizedTarget = (targetText || "").toLowerCase().replace(/[.,!?]/g, '');

  const spokenWords = normalizedSpoken.split(/\s+/).filter(w => w.length > 0);
  const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 0);

  let correctCount = 0;
  let missedWords = [];

  // Iterate through target words and consume spoken words one by one
  targetWords.forEach(word => {
    const matchIndex = spokenWords.indexOf(word);
    
    if (matchIndex !== -1) {
      correctCount++;
      // Consume the word so it cannot be counted twice
      spokenWords.splice(matchIndex, 1);
    } else {
      missedWords.push(word);
    }
  });

  const accuracyScore = targetWords.length > 0 ? Math.max(0, Math.round((correctCount / targetWords.length) * 100)) : 0;

  return { accuracyScore, missedWords };
};

router.post('/evaluate', authParams, async (req, res) => {
  try {
    const { transcript, targetText } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const { accuracyScore, missedWords } = calculateEvaluation(transcript, targetText);

    const report = new Report({
      userId: req.user._id,
      spokenText: transcript,
      accuracyScore,
      missedWords
    });

    await report.save();

    res.json({ message: 'Evaluation successful', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during evaluation' });
  }
});

router.get('/reports', authParams, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching reports' });
  }
});

module.exports = router;
