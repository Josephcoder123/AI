import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, '../database/study_buddy.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// API Routes
app.post('/generate_flashcards', async (req, res) => {
  try {
    const { notes } = req.body;
    
    if (!notes || !notes.trim()) {
      return res.status(400).json({ error: 'Study notes are required' });
    }

    // Simple AI-like flashcard generation
    const flashcards = generateFlashcardsFromNotes(notes);
    
    // Save flashcards to database
    const stmt = db.prepare('INSERT INTO flashcards (question, answer) VALUES (?, ?)');
    
    flashcards.forEach(card => {
      stmt.run(card.question, card.answer);
    });
    
    stmt.finalize();
    
    res.json(flashcards);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

app.get('/flashcards', (req, res) => {
  db.all('SELECT * FROM flashcards ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching flashcards:', err);
      return res.status(500).json({ error: 'Failed to fetch flashcards' });
    }
    res.json(rows);
  });
});

app.delete('/flashcards/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM flashcards WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting flashcard:', err);
      return res.status(500).json({ error: 'Failed to delete flashcard' });
    }
    res.json({ message: 'Flashcard deleted successfully' });
  });
});

// Simple AI-like flashcard generation function
function generateFlashcardsFromNotes(notes) {
  const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const flashcards = [];
  
  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(' ');
    if (words.length > 5) {
      // Create different types of questions
      if (index % 3 === 0) {
        // Fill in the blank
        const blankIndex = Math.floor(words.length / 2);
        const question = words.map((word, i) => i === blankIndex ? '______' : word).join(' ') + '?';
        const answer = words[blankIndex];
        flashcards.push({ question, answer });
      } else if (index % 3 === 1) {
        // What is... question
        const keyTerm = words.find(word => word.length > 4) || words[0];
        const question = `What is ${keyTerm}?`;
        const answer = sentence.trim();
        flashcards.push({ question, answer });
      } else {
        // True/False question
        const question = `True or False: ${sentence.trim()}`;
        const answer = 'True (based on your notes)';
        flashcards.push({ question, answer });
      }
    }
  });
  
  return flashcards.slice(0, 5); // Limit to 5 flashcards
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});