// Function to send the message to the chatbot and display the response
function sendMessage() {
    const userMessage = document.getElementById('chat-input').value;

    if (userMessage.trim() === "") return;

    // Clear the chatbox before displaying new messages
    const chatbox = document.getElementById('chatbox');
    chatbox.innerHTML = '';  // Clear existing chat messages

    // Display the initial instructions message
    chatbox.innerHTML = `
        <p>Halo, ini layanan pesan singkat untuk mengetahui informasi pada data spesifik yang anda pilih</p>
        <p>Anda dapat memasukan dengan ketentuan:</p>
        <p>product [spasi] nama produk</p>
        <p>order [spasi] nomorpesanan</p>
        <p>category [spasi] nama kategori</p>
    `;

    // Display the user's message in the chatbox
    displayMessage(userMessage, 'user');

    // Clear input field
    document.getElementById('chat-input').value = '';
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token is missing. User may not be logged in.');
        displayMessage('You need to log in first.', 'bot');
        // Track failed message send due to missing token
        gtag('event', 'send_message', {
            'event_category': 'Chatbot',
            'event_label': 'Failed - No token',
            'message_length': userMessage.length
        });
        return;
    }

    // Send the message to the chatbot via API with token in Authorization header
    fetch(`${api}/chatbot`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,  // Adding token to Authorization header
            'Accept': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
    })
        .then(response => response.json())
        .then(data => {
            // Display chatbot's response
            const botResponse = data.response || 'Maaf, saya tidak mengerti.';
            displayMessage(botResponse, 'bot');
            // Track successful message send
            gtag('event', 'send_message', {
                'event_category': 'Chatbot',
                'event_label': 'Success',
                'message_length': userMessage.length
            });
        })
        .catch(error => {
            console.error('Error:', error);
            displayMessage('Terjadi kesalahan. Silakan coba lagi.', 'bot');
            // Track failed message send due to error
            gtag('event', 'send_message', {
                'event_category': 'Chatbot',
                'event_label': 'Failed - Error',
                'message_length': userMessage.length
            });
        });
}

// Function to display message in the chatbox
function displayMessage(message, sender) {
    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender);
    messageElement.innerText = message;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight; // Scroll ke bawah setiap kali pesan baru muncul
}

// Event listener for clicking the 'Send' button
document.getElementById('send-message').addEventListener('click', sendMessage);

// Event listener for pressing 'Enter' key in the input field
document.getElementById('chat-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default 'Enter' behavior (like form submission)
        sendMessage(); // Call the sendMessage function
    }
});

// Toggle chatbot visibility
document.getElementById('chatbot-button').addEventListener('click', () => {
    document.getElementById('chatbot-container').style.display = 'block';
    document.getElementById('chat-input').focus(); // Set focus to chat input when chatbot is opened
});

// Close chatbot
document.getElementById('close-chatbot').addEventListener('click', () => {
    document.getElementById('chatbot-container').style.display = 'none';
});

var api = '';
// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
    await ApiConfig.loadConfig("apiUrl"); // Memastikan konfigurasi dimuat
    api = ApiConfig.getApiUrl();
});
