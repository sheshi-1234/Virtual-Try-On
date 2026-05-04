// chatbot.js
// Handles communication with the Backend AI API

class Chatbot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.skinTone = 'unknown';

        this.init();
    }

    init() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        window.addEventListener('skinToneDetected', (e) => {
            this.skinTone = e.detail.label;
        });
    }

    addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        
        if (sender === 'user') {
            msgDiv.className = 'p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed self-end bg-white/10 border border-white/20 rounded-br-sm text-right text-white';
        } else {
            msgDiv.className = 'p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed self-start bg-[#ff3366]/15 border border-[#ff3366]/20 rounded-bl-sm text-white';
        }
        
        msgDiv.textContent = text;
        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.chatInput.value = '';

        // Add a loading message
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed self-start bg-[#ff3366]/15 border border-[#ff3366]/20 rounded-bl-sm text-white opacity-70 animate-pulse';
        loadingDiv.id = loadingId;
        loadingDiv.textContent = 'Thinking...';
        this.chatMessages.appendChild(loadingDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        try {
            const baseUrl = window.location.protocol === 'file:' ? 'http://127.0.0.1:3000' : '';
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    skin_tone: this.skinTone
                })
            });

            const data = await response.json();
            
            // Remove loading message
            document.getElementById(loadingId).remove();

            if (data.reply) {
                this.addMessage(data.reply, 'system');
                this.parseResponseForActions(data.reply);
            } else if (data.error) {
                if (data.error.includes("API key not configured")) {
                    this.addMessage("AI Assistant is not ready. Please add your real GEMINI_API_KEY to the .env file in the project folder.", 'system');
                } else {
                    this.addMessage(`Error: ${data.error}`, 'system');
                }
            }
        } catch (error) {
            document.getElementById(loadingId).remove();
            this.addMessage(`Connection error. Make sure the backend is running.`, 'system');
        }
    }

    parseResponseForActions(reply) {
        // Simple heuristic: if the AI says a specific hex code or common color name, we could update the UI automatically.
        // For the sake of the project, let's keep it simple. If it recommends 'red', we could trigger the red button.
        const text = reply.toLowerCase();
        if (text.includes("try the #") || text.includes("apply #")) {
            // regex to extract hex
            const match = text.match(/#[0-9a-f]{6}/);
            if (match) {
                const hex = match[0];
                window.dispatchEvent(new CustomEvent('updateMakeupColor', { detail: { type: 'lipstick', color: hex } }));
            }
        }
    }
}

window.Chatbot = Chatbot;
