class StudyBuddy {
    constructor() {
        this.flashcards = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedFlashcards();
    }

    bindEvents() {
        const generateBtn = document.getElementById('generateFlashcards');
        const loadBtn = document.getElementById('loadFlashcards');
        const notesTextarea = document.getElementById('studyNotes');

        generateBtn.addEventListener('click', () => this.generateFlashcards());
        loadBtn.addEventListener('click', () => this.loadSavedFlashcards());
        
        // Auto-resize textarea
        notesTextarea.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        });
    }

    async generateFlashcards() {
        const notes = document.getElementById('studyNotes').value;
        const generateBtn = document.getElementById('generateFlashcards');
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoader = generateBtn.querySelector('.btn-loader');

        if (!notes.trim()) {
            this.showMessage('Please enter your study notes.', 'error');
            return;
        }

        // Show loading state
        generateBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';

        try {
            const response = await fetch('/api/generate_flashcards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const flashcards = await response.json();
            this.flashcards = flashcards;
            this.displayFlashcards(flashcards);
            this.showMessage(`Generated ${flashcards.length} flashcards successfully!`, 'success');
            
            // Clear the textarea
            document.getElementById('studyNotes').value = '';
        } catch (error) {
            console.error('Error generating flashcards:', error);
            this.showMessage('Failed to generate flashcards. Please try again.', 'error');
        } finally {
            // Reset button state
            generateBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    }

    async loadSavedFlashcards() {
        try {
            const response = await fetch('/api/flashcards');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const flashcards = await response.json();
            this.flashcards = flashcards;
            this.displayFlashcards(flashcards);
            
            if (flashcards.length > 0) {
                this.showMessage(`Loaded ${flashcards.length} saved flashcards.`, 'success');
            }
        } catch (error) {
            console.error('Error loading flashcards:', error);
            this.showMessage('Failed to load saved flashcards.', 'error');
        }
    }

    displayFlashcards(flashcards) {
        const container = document.getElementById('flashcardsContainer');
        const emptyState = document.getElementById('emptyState');

        if (flashcards.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        flashcards.forEach((card, index) => {
            const flashcardDiv = this.createFlashcardElement(card, index);
            container.appendChild(flashcardDiv);
        });
    }

    createFlashcardElement(card, index) {
        const flashcardDiv = document.createElement('div');
        flashcardDiv.className = 'flashcard';
        flashcardDiv.dataset.index = index;

        flashcardDiv.innerHTML = `
            <div class="flashcard-controls">
                <button class="control-btn" onclick="studyBuddy.deleteFlashcard(${card.id || index})" title="Delete">
                    ✕
                </button>
            </div>
            <div class="flashcard-question">${card.question}</div>
            <div class="flashcard-answer">${card.answer}</div>
            <div class="flip-indicator">Click to flip</div>
        `;

        // Add click event to flip the card
        flashcardDiv.addEventListener('click', (e) => {
            if (!e.target.classList.contains('control-btn')) {
                flashcardDiv.classList.toggle('flipped');
            }
        });

        return flashcardDiv;
    }

    async deleteFlashcard(id) {
        if (!confirm('Are you sure you want to delete this flashcard?')) {
            return;
        }

        try {
            const response = await fetch(`/api/flashcards/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Remove from local array and re-display
            this.flashcards = this.flashcards.filter(card => (card.id || card.index) !== id);
            this.displayFlashcards(this.flashcards);
            this.showMessage('Flashcard deleted successfully.', 'success');
        } catch (error) {
            console.error('Error deleting flashcard:', error);
            this.showMessage('Failed to delete flashcard.', 'error');
        }
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.textContent = message;

        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize the app
const studyBuddy = new StudyBuddy();