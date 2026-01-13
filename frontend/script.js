// Set default date to today's date
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}

const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop page reload

    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Submitting...";
    submitBtn.disabled = true;

    // Gather data from the form
    const formData = {
        date: document.getElementById('date').value,
        coordinator: document.getElementById('coordinator').value,
        hall: document.getElementById('hall').value,
        attendees: document.getElementById('attendees').value || 0,
        new_attendees: document.getElementById('new_attendees').value || 0,
        testimonies: document.getElementById('testimonies').value || 0,
        names: document.getElementById('names').value
    };

    const API_URL = 'https://kerygma-report.onrender.com';

    try {
        const response = await fetch(`${API_URL}/api/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert("✅ Report submitted successfully!");
            form.reset(); // Clear the form
        } else {
            alert("❌ Failed to submit report. Please try again.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("❌ Network error.");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});
