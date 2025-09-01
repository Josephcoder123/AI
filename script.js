document.getElementById('generateFlashcards').addEventListener('click', async () => {
    const notes = document.getElementById('studyNotes').value;

    // Check if the textarea is empty
    if (!notes.trim()) {
        alert("Please enter your study notes.");
        return;
    }

    try {
        const response = await fetch('/generate_flashcards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const flashcards = await response.json();
        displayFlashcards(flashcards);
    } catch (error) {
        console.error('Error generating flashcards:', error);
        alert('Failed to generate flashcards. Please try again later.');
    }
});

function displayFlashcards(flashcards) {
    const container = document.getElementById('flashcardsContainer');
    container.innerHTML = ''; // Clear previous flashcards

    flashcards.forEach(card => {
        const flashcardDiv = document.createElement('div');
        flashcardDiv.className = 'flashcard';
        flashcardDiv.innerHTML = `<strong>Question:</strong> ${card.question}<br><strong>Answer:</strong> ${card.answer}`;
        container.appendChild(flashcardDiv);
    });
}
