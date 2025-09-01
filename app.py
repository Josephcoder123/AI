from flask import Flask, render_template
import sqlite3

app = Flask(__name__, template_folder='../front/templates')

# Database setup
def init_db():
    conn = sqlite3.connect('../database/study_buddy.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/add_flashcard', methods=['POST'])
def add_flashcard():
    question = request.form['question']
    answer = request.form['answer']
    conn = sqlite3.connect('../database/study_buddy.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO flashcards (question, answer) VALUES (?, ?)', (question, answer))
    conn.commit()
    conn.close()
    return redirect('/')
