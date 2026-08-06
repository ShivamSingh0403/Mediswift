document.getElementById('consultancyForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload

    // Reset previous error messages
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');

    // Grab values using your exact element IDs
    const doctorName = document.getElementById('doctorName').value.trim();
    const doctorEmail = document.getElementById('doctorEmail').value.trim();
    const doctorSpeciality = document.getElementById('doctorSpeciality').value;
    const doctorConcern = document.getElementById('doctorConcern').value.trim();

    // Basic frontend validation client-side
    let hasError = false;
    if (!doctorName) {
        document.querySelector('#doctorName ~ .error-text').textContent = 'Name is required';
        hasError = true;
    }
    if (!doctorEmail) {
        document.querySelector('#doctorEmail ~ .error-text').textContent = 'Email is required';
        hasError = true;
    }
    if (!doctorSpeciality) {
        document.querySelector('#doctorSpeciality ~ .error-text').textContent = 'Please select a speciality';
        hasError = true;
    }
    if (!doctorConcern) {
        document.querySelector('#doctorConcern ~ .error-text').textContent = 'Please describe your concern';
        hasError = true;
    }

    if (hasError) return;

    try {
        // Send data to the backend via POST
        const response = await fetch('http://127.0.0.1:5000/api/book-consultation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: doctorName,
                email: doctorEmail,
                speciality: doctorSpeciality,
                concern: doctorConcern
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('🎉 ' + result.message);
            document.getElementById('consultancyForm').reset(); // Clear form fields
        } else {
            alert('❌ ' + (result.error || 'Booking failed. Try again.'));
        }

    } catch (error) {
        console.error('Network Error:', error);
        alert('Could not connect to the server. Ensure your backend is running.');
    }
});