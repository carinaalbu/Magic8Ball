const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { MAGIC_8BALL_ANSWERS } = require('./src/answers');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'magic8ball.db');
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"Magic 8-Ball" <no-reply@magic8ball.app>';

let db;

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

function validateQuestion(question) {
  if (typeof question !== 'string') {
    return null;
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 300);
}

function validateEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function createTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

async function initializeDatabase() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/answer', async (req, res) => {
  try {
    const question = validateQuestion(req.body?.question);
    if (!question) {
      return res.status(400).json({ error: 'A valid question is required.' });
    }

    const answer =
      MAGIC_8BALL_ANSWERS[Math.floor(Math.random() * MAGIC_8BALL_ANSWERS.length)];

    const result = await db.run(
      'INSERT INTO submissions (question, answer, email, created_at) VALUES (?, ?, ?, ?)',
      [question, answer, null, new Date().toISOString()]
    );

    return res.status(200).json({
      success: true,
      entryId: result.lastID,
      answer
    });
  } catch (error) {
    console.error('Error generating answer:', error);
    return res.status(500).json({ error: 'Failed to generate answer.' });
  }
});

app.post('/api/submit', async (req, res) => {
  try {
    const { entryId, email } = req.body || {};
    const parsedEntryId = Number(entryId);

    if (!Number.isInteger(parsedEntryId) || parsedEntryId <= 0) {
      return res.status(400).json({ error: 'A valid entry id is required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    const entry = await db.get(
      'SELECT id, question, answer FROM submissions WHERE id = ?',
      [parsedEntryId]
    );

    if (!entry) {
      return res.status(404).json({ error: 'Answer entry not found.' });
    }

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(503).json({
        error:
          'Email sending is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.'
      });
    }

    await transporter.sendMail({
      from: SMTP_FROM,
      to: email.trim(),
      subject: 'Your Magic 8-Ball Answer',
      text: `Your question: ${entry.question}\nMagic 8-Ball answer: ${entry.answer}`
    });

    await db.run('UPDATE submissions SET email = ? WHERE id = ?', [
      email.trim(),
      parsedEntryId
    ]);

    return res
      .status(200)
      .json({ success: true, message: 'Answer emailed successfully.' });
  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize SQLite database:', error);
    process.exit(1);
  });
