class VoiceHandler {
    constructor(assistant) {
        this.assistant = assistant;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.voiceEnabled = localStorage.getItem('voiceEnabled') === 'true';
        this.speechEnabled = localStorage.getItem('speechEnabled') !== 'false'; // Default true
        this.selectedVoice = localStorage.getItem('selectedVoice') || '';
        this.speechRate = parseFloat(localStorage.getItem('speechRate')) || 1.0;
        this.speechPitch = parseFloat(localStorage.getItem('speechPitch')) || 1.0;
        
        this.initSpeechRecognition();
        this.initVoiceControls();
        this.loadVoices();
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton(true);
                this.showListeningIndicator();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton(false);
                this.hideListeningIndicator();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateVoiceButton(false);
                this.hideListeningIndicator();
                
                if (event.error === 'not-allowed') {
                    this.showVoicePermissionError();
                }
            };
        }
    }

    initVoiceControls() {
        // Add voice button to chat form
        const chatForm = document.getElementById('chatForm');
        const voiceButton = document.createElement('button');
        voiceButton.type = 'button';
        voiceButton.id = 'voiceButton';
        voiceButton.className = 'voice-button';
        voiceButton.innerHTML = '🎤';
        voiceButton.title = 'Click to speak';
        voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
        
        chatForm.appendChild(voiceButton);
        
        // Add listening indicator
        const indicator = document.createElement('div');
        indicator.id = 'listeningIndicator';
        indicator.className = 'listening-indicator';
        indicator.innerHTML = '👂 Listening...';
        indicator.style.display = 'none';
        document.querySelector('.input-area').appendChild(indicator);
        
        // Add voice settings button
        const settingsButton = document.createElement('button');
        settingsButton.type = 'button';
        settingsButton.className = 'voice-settings-button';
        settingsButton.innerHTML = '⚙️';
        settingsButton.title = 'Voice settings';
        settingsButton.addEventListener('click', () => this.showVoiceSettings());
        chatForm.appendChild(settingsButton);
    }

    loadVoices() {
        // Load available voices
        this.voices = this.synthesis.getVoices();
        
        // If voices aren't loaded yet, wait for them
        if (this.voices.length === 0) {
            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
            };
        }
    }

    toggleVoiceRecognition() {
        if (!this.recognition) {
            alert('Speech recognition is not supported in this browser. Try using Chrome, Edge, or Safari.');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.startListening();
        }
    }

    startListening() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
        }
    }

    handleVoiceInput(transcript) {
        const chatInput = document.getElementById('chatInput');
        chatInput.value = transcript;
        
        // Auto-submit the recognized text
        setTimeout(() => {
            this.assistant.handleUserInput();
        }, 100);
    }

    speak(text) {
        if (!this.speechEnabled || !text) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        // Clean text for speech (remove HTML, markdown, etc.)
        const cleanText = this.cleanTextForSpeech(text);
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Apply voice settings
        if (this.selectedVoice && this.voices.length > 0) {
            const voice = this.voices.find(v => v.name === this.selectedVoice);
            if (voice) utterance.voice = voice;
        }
        
        utterance.rate = this.speechRate;
        utterance.pitch = this.speechPitch;
        utterance.volume = 0.8;
        
        // Add speaking indicator
        utterance.onstart = () => this.showSpeakingIndicator();
        utterance.onend = () => this.hideSpeakingIndicator();
        
        this.synthesis.speak(utterance);
    }

    cleanTextForSpeech(text) {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/\n/g, '. ') // Replace newlines with pauses
            .replace(/([.!?])\s*([.!?])/g, '$1 ') // Clean up multiple punctuation
            .replace(/\s+/g, ' ') // Clean up multiple spaces
            .trim();
    }

    updateVoiceButton(listening) {
        const button = document.getElementById('voiceButton');
        if (button) {
            button.innerHTML = listening ? '⏹️' : '🎤';
            button.title = listening ? 'Stop listening' : 'Click to speak';
            button.classList.toggle('listening', listening);
        }
    }

    showListeningIndicator() {
        const indicator = document.getElementById('listeningIndicator');
        if (indicator) {
            indicator.style.display = 'block';
            indicator.classList.add('pulse');
        }
    }

    hideListeningIndicator() {
        const indicator = document.getElementById('listeningIndicator');
        if (indicator) {
            indicator.style.display = 'none';
            indicator.classList.remove('pulse');
        }
    }

    showSpeakingIndicator() {
        // Add visual indicator that assistant is speaking
        const avatar = document.querySelector('.avatar');
        if (avatar) {
            avatar.classList.add('speaking');
        }
    }

    hideSpeakingIndicator() {
        const avatar = document.querySelector('.avatar');
        if (avatar) {
            avatar.classList.remove('speaking');
        }
    }

    showVoicePermissionError() {
        this.assistant.addMessage('assistant', 
            "I need microphone permission to hear you! Please click the microphone icon in your browser's address bar and allow access. 🎤"
        );
    }

    showVoiceSettings() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        const voiceOptions = this.voices.map(voice => 
            `<option value="${voice.name}" ${voice.name === this.selectedVoice ? 'selected' : ''}>
                ${voice.name} (${voice.lang})
            </option>`
        ).join('');
        
        modalBody.innerHTML = `
            <h3>Voice Settings</h3>
            <form id="voiceSettingsForm">
                <label>
                    <input type="checkbox" id="speechEnabled" ${this.speechEnabled ? 'checked' : ''}>
                    Enable voice responses
                </label>
                
                <label>Voice:</label>
                <select id="voiceSelect">
                    <option value="">Default</option>
                    ${voiceOptions}
                </select>
                
                <label>Speech Rate: <span id="rateValue">${this.speechRate}</span></label>
                <input type="range" id="speechRate" min="0.5" max="2" step="0.1" value="${this.speechRate}">
                
                <label>Speech Pitch: <span id="pitchValue">${this.speechPitch}</span></label>
                <input type="range" id="speechPitch" min="0.5" max="2" step="0.1" value="${this.speechPitch}">
                
                <div class="voice-test">
                    <button type="button" id="testVoice">Test Voice</button>
                </div>
                
                <button type="submit">Save Settings</button>
            </form>
        `;
        
        modal.style.display = 'block';
        
        // Add event listeners
        const rateSlider = document.getElementById('speechRate');
        const pitchSlider = document.getElementById('speechPitch');
        const rateValue = document.getElementById('rateValue');
        const pitchValue = document.getElementById('pitchValue');
        
        rateSlider.addEventListener('input', () => {
            rateValue.textContent = rateSlider.value;
        });
        
        pitchSlider.addEventListener('input', () => {
            pitchValue.textContent = pitchSlider.value;
        });
        
        document.getElementById('testVoice').addEventListener('click', () => {
            const tempRate = parseFloat(rateSlider.value);
            const tempPitch = parseFloat(pitchSlider.value);
            const tempVoice = document.getElementById('voiceSelect').value;
            
            // Temporarily update settings for test
            const oldRate = this.speechRate;
            const oldPitch = this.speechPitch;
            const oldVoice = this.selectedVoice;
            
            this.speechRate = tempRate;
            this.speechPitch = tempPitch;
            this.selectedVoice = tempVoice;
            
            this.speak("Hello! This is how I'll sound with these settings.");
            
            // Restore old settings
            this.speechRate = oldRate;
            this.speechPitch = oldPitch;
            this.selectedVoice = oldVoice;
        });
        
        document.getElementById('voiceSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveVoiceSettings();
            modal.style.display = 'none';
        });
    }

    saveVoiceSettings() {
        this.speechEnabled = document.getElementById('speechEnabled').checked;
        this.selectedVoice = document.getElementById('voiceSelect').value;
        this.speechRate = parseFloat(document.getElementById('speechRate').value);
        this.speechPitch = parseFloat(document.getElementById('speechPitch').value);
        
        // Save to localStorage
        localStorage.setItem('speechEnabled', this.speechEnabled);
        localStorage.setItem('selectedVoice', this.selectedVoice);
        localStorage.setItem('speechRate', this.speechRate);
        localStorage.setItem('speechPitch', this.speechPitch);
        
        this.assistant.addMessage('assistant', 'Voice settings saved! 🎤✨');
    }

    // Check if browser supports speech features
    static isSupported() {
        return {
            speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
            speechSynthesis: 'speechSynthesis' in window
        };
    }
}

// Export for use in main app
window.VoiceHandler = VoiceHandler;