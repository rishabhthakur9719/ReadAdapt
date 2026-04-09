const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const authParams = require('../middleware/auth');

const calculateEvaluation = (transcript, targetText) => {
  // Normalize strings to lowercase and strip punctuation
  const normalizedSpoken = transcript.toLowerCase().replace(/[.,]/g, '');
  const normalizedTarget = (targetText || "").toLowerCase().replace(/[.,]/g, '');

  const spokenWords = normalizedSpoken.split(/\s+/).filter(w => w.length > 0);
  const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 0);

  // A very basic evaluation algorithm: comparing words sequentially
  let correctCount = 0;
  let missedWords = [];

  // Create a naive matching scheme for the MVP: iterate through target words and see if spoken contains them
  // For better accuracy we'd use Levenshtein distance or a sequence alignment algorithm, but for MVP:
  const spokenSet = new Set(spokenWords);
  targetWords.forEach(word => {
    if (spokenSet.has(word)) {
      correctCount++;
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
