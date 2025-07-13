class AdvancedVoiceHandler extends VoiceHandler {
    constructor(assistant) {
        super(assistant);
        this.aiVoiceEnabled = localStorage.getItem('aiVoiceEnabled') === 'true';
        this.selectedAIVoice = localStorage.getItem('selectedAIVoice') || 'elevenlabs';
        this.voiceApiKey = localStorage.getItem('voiceApiKey') || '';
        this.selectedElevenLabsVoice = localStorage.getItem('elevenLabsVoice') || 'pNInz6obpgDQGcFmaJgB'; // Default voice ID
        this.audioContext = null;
        this.currentAudio = null;
        
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    async speak(text) {
        if (!text) return;
        
        // Stop any current audio
        this.stopCurrentAudio();
        
        if (this.aiVoiceEnabled && this.voiceApiKey) {
            await this.speakWithAI(text);
        } else {
            // Fallback to enhanced browser TTS
            this.speakWithEnhancedBrowserTTS(text);
        }
    }

    async speakWithAI(text) {
        const cleanText = this.cleanTextForSpeech(text);
        
        try {
            switch (this.selectedAIVoice) {
                case 'elevenlabs':
                    await this.speakWithElevenLabs(cleanText);
                    break;
                case 'openai':
                    await this.speakWithOpenAI(cleanText);
                    break;
                case 'azure':
                    await this.speakWithAzure(cleanText);
                    break;
                default:
                    this.speakWithEnhancedBrowserTTS(cleanText);
            }
        } catch (error) {
            console.error('AI voice synthesis failed:', error);
            // Fallback to browser TTS
            this.speakWithEnhancedBrowserTTS(cleanText);
        }
    }

    async speakWithElevenLabs(text) {
        this.showSpeakingIndicator();
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.selectedElevenLabsVoice}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': this.voiceApiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        await this.playAudioBlob(audioBlob);
    }

    async speakWithOpenAI(text) {
        this.showSpeakingIndicator();
        
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.voiceApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'tts-1-hd', // High quality model
                input: text,
                voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
                response_format: 'mp3'
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        await this.playAudioBlob(audioBlob);
    }

    async speakWithAzure(text) {
        this.showSpeakingIndicator();
        
        const ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                <voice name="en-US-JennyNeural">
                    <prosody rate="1.0" pitch="0%">${text}</prosody>
                </voice>
            </speak>
        `;

        const response = await fetch(`https://${this.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': this.voiceApiKey,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
            },
            body: ssml
        });

        if (!response.ok) {
            throw new Error(`Azure API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        await this.playAudioBlob(audioBlob);
    }

    speakWithEnhancedBrowserTTS(text) {
        // Enhanced browser TTS with better voice selection
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a higher quality voice
        const voices = this.synthesis.getVoices();
        const preferredVoices = [
            // Look for neural/premium voices first
            voices.find(v => v.name.includes('Neural') && v.lang.startsWith('en')),
            voices.find(v => v.name.includes('Premium') && v.lang.startsWith('en')),
            voices.find(v => v.name.includes('Enhanced') && v.lang.startsWith('en')),
            // macOS high-quality voices
            voices.find(v => v.name === 'Samantha' || v.name === 'Alex'),
            // Windows high-quality voices
            voices.find(v => v.name.includes('Zira') || v.name.includes('David')),
            // Any English voice
            voices.find(v => v.lang.startsWith('en'))
        ];
        
        const bestVoice = preferredVoices.find(v => v) || voices[0];
        if (bestVoice) {
            utterance.voice = bestVoice;
        }
        
        // Optimize settings for more natural speech
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onstart = () => this.showSpeakingIndicator();
        utterance.onend = () => this.hideSpeakingIndicator();
        utterance.onerror = () => this.hideSpeakingIndicator();
        
        this.synthesis.speak(utterance);
    }

    async playAudioBlob(blob) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            this.currentAudio = audio;
            
            audio.onended = () => {
                this.hideSpeakingIndicator();
                this.currentAudio = null;
                resolve();
            };
            
            audio.onerror = (error) => {
                this.hideSpeakingIndicator();
                this.currentAudio = null;
                reject(error);
            };
            
            audio.src = URL.createObjectURL(blob);
            audio.play().catch(reject);
        });
    }

    stopCurrentAudio() {
        // Stop browser TTS
        this.synthesis.cancel();
        
        // Stop AI-generated audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        this.hideSpeakingIndicator();
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
                <div class="voice-mode-selection">
                    <h4>Voice Quality</h4>
                    <label>
                        <input type="radio" name="voiceMode" value="browser" ${!this.aiVoiceEnabled ? 'checked' : ''}>
                        Browser Voice (Free)
                    </label>
                    <label>
                        <input type="radio" name="voiceMode" value="ai" ${this.aiVoiceEnabled ? 'checked' : ''}>
                        AI Voice (Premium - Requires API Key)
                    </label>
                </div>

                <div id="browserVoiceSettings" ${this.aiVoiceEnabled ? 'style="display:none"' : ''}>
                    <label>
                        <input type="checkbox" id="speechEnabled" ${this.speechEnabled ? 'checked' : ''}>
                        Enable voice responses
                    </label>
                    
                    <label>Voice:</label>
                    <select id="voiceSelect">
                        <option value="">Best Available</option>
                        ${voiceOptions}
                    </select>
                    
                    <label>Speech Rate: <span id="rateValue">${this.speechRate}</span></label>
                    <input type="range" id="speechRate" min="0.5" max="2" step="0.1" value="${this.speechRate}">
                    
                    <label>Speech Pitch: <span id="pitchValue">${this.speechPitch}</span></label>
                    <input type="range" id="speechPitch" min="0.5" max="2" step="0.1" value="${this.speechPitch}">
                </div>

                <div id="aiVoiceSettings" ${!this.aiVoiceEnabled ? 'style="display:none"' : ''}>
                    <label>AI Voice Service:</label>
                    <select id="aiVoiceSelect">
                        <option value="elevenlabs" ${this.selectedAIVoice === 'elevenlabs' ? 'selected' : ''}>ElevenLabs (Best Quality)</option>
                        <option value="openai" ${this.selectedAIVoice === 'openai' ? 'selected' : ''}>OpenAI TTS (Good Quality)</option>
                        <option value="azure" ${this.selectedAIVoice === 'azure' ? 'selected' : ''}>Azure Cognitive Services</option>
                    </select>
                    
                    <label>API Key:</label>
                    <input type="password" id="voiceApiKey" value="${this.voiceApiKey}" placeholder="Enter your API key">
                    
                    <div id="elevenLabsSettings" ${this.selectedAIVoice !== 'elevenlabs' ? 'style="display:none"' : ''}>
                        <label>ElevenLabs Voice:</label>
                        <select id="elevenLabsVoice">
                            <option value="pNInz6obpgDQGcFmaJgB">Adam (Deep male)</option>
                            <option value="EXAVITQu4vr4xnSDxMaL">Bella (Female)</option>
                            <option value="ErXwobaYiN019PkySvjV">Antoni (Male)</option>
                            <option value="VR6AewLTigWG4xSOukaG">Arnold (Male)</option>
                            <option value="pqHfZKP75CvOlQylNhV4">Bill (Male)</option>
                            <option value="nPczCjzI2devNBz1zQrb">Brian (Male)</option>
                        </select>
                    </div>
                    
                    <div class="api-info">
                        <p><strong>Getting API Keys:</strong></p>
                        <ul>
                            <li><strong>ElevenLabs:</strong> Sign up at elevenlabs.io (10,000 chars/month free)</li>
                            <li><strong>OpenAI:</strong> Get API key from platform.openai.com</li>
                            <li><strong>Azure:</strong> Create Speech service on Azure portal</li>
                        </ul>
                    </div>
                </div>
                
                <div class="voice-test">
                    <button type="button" id="testVoice">Test Voice</button>
                </div>
                
                <button type="submit">Save Settings</button>
            </form>
        `;
        
        modal.style.display = 'block';
        this.attachVoiceSettingsListeners();
    }

    attachVoiceSettingsListeners() {
        // Voice mode toggle
        document.querySelectorAll('input[name="voiceMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const isAI = e.target.value === 'ai';
                document.getElementById('browserVoiceSettings').style.display = isAI ? 'none' : 'block';
                document.getElementById('aiVoiceSettings').style.display = isAI ? 'block' : 'none';
            });
        });

        // AI voice service toggle
        document.getElementById('aiVoiceSelect').addEventListener('change', (e) => {
            document.getElementById('elevenLabsSettings').style.display = 
                e.target.value === 'elevenlabs' ? 'block' : 'none';
        });

        // Range sliders
        const rateSlider = document.getElementById('speechRate');
        const pitchSlider = document.getElementById('speechPitch');
        const rateValue = document.getElementById('rateValue');
        const pitchValue = document.getElementById('pitchValue');
        
        if (rateSlider) {
            rateSlider.addEventListener('input', () => {
                rateValue.textContent = rateSlider.value;
            });
        }
        
        if (pitchSlider) {
            pitchSlider.addEventListener('input', () => {
                pitchValue.textContent = pitchSlider.value;
            });
        }

        // Test voice
        document.getElementById('testVoice').addEventListener('click', () => {
            const isAI = document.querySelector('input[name="voiceMode"]:checked').value === 'ai';
            
            if (isAI) {
                // Test AI voice with current settings
                const tempKey = document.getElementById('voiceApiKey').value;
                const tempService = document.getElementById('aiVoiceSelect').value;
                
                if (!tempKey) {
                    alert('Please enter an API key to test AI voice.');
                    return;
                }
                
                // Temporarily update settings for test
                const oldKey = this.voiceApiKey;
                const oldService = this.selectedAIVoice;
                const oldEnabled = this.aiVoiceEnabled;
                
                this.voiceApiKey = tempKey;
                this.selectedAIVoice = tempService;
                this.aiVoiceEnabled = true;
                
                this.speak("Hello! This is how I sound with AI voice synthesis. Pretty natural, right?");
                
                // Restore old settings
                setTimeout(() => {
                    this.voiceApiKey = oldKey;
                    this.selectedAIVoice = oldService;
                    this.aiVoiceEnabled = oldEnabled;
                }, 100);
            } else {
                // Test browser voice
                const tempRate = parseFloat(document.getElementById('speechRate').value);
                const tempPitch = parseFloat(document.getElementById('speechPitch').value);
                const tempVoice = document.getElementById('voiceSelect').value;
                
                const oldRate = this.speechRate;
                const oldPitch = this.speechPitch;
                const oldVoice = this.selectedVoice;
                const oldEnabled = this.aiVoiceEnabled;
                
                this.speechRate = tempRate;
                this.speechPitch = tempPitch;
                this.selectedVoice = tempVoice;
                this.aiVoiceEnabled = false;
                
                this.speak("Hello! This is how I sound with enhanced browser voice.");
                
                // Restore old settings
                setTimeout(() => {
                    this.speechRate = oldRate;
                    this.speechPitch = oldPitch;
                    this.selectedVoice = oldVoice;
                    this.aiVoiceEnabled = oldEnabled;
                }, 100);
            }
        });

        // Form submission
        document.getElementById('voiceSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAdvancedVoiceSettings();
            document.getElementById('modal').style.display = 'none';
        });
    }

    saveAdvancedVoiceSettings() {
        const isAI = document.querySelector('input[name="voiceMode"]:checked').value === 'ai';
        
        this.aiVoiceEnabled = isAI;
        this.speechEnabled = document.getElementById('speechEnabled').checked;
        
        if (isAI) {
            this.selectedAIVoice = document.getElementById('aiVoiceSelect').value;
            this.voiceApiKey = document.getElementById('voiceApiKey').value;
            if (this.selectedAIVoice === 'elevenlabs') {
                this.selectedElevenLabsVoice = document.getElementById('elevenLabsVoice').value;
            }
        } else {
            this.selectedVoice = document.getElementById('voiceSelect').value;
            this.speechRate = parseFloat(document.getElementById('speechRate').value);
            this.speechPitch = parseFloat(document.getElementById('speechPitch').value);
        }
        
        // Save to localStorage
        localStorage.setItem('aiVoiceEnabled', this.aiVoiceEnabled);
        localStorage.setItem('speechEnabled', this.speechEnabled);
        localStorage.setItem('selectedAIVoice', this.selectedAIVoice);
        localStorage.setItem('voiceApiKey', this.voiceApiKey);
        localStorage.setItem('elevenLabsVoice', this.selectedElevenLabsVoice);
        localStorage.setItem('selectedVoice', this.selectedVoice);
        localStorage.setItem('speechRate', this.speechRate);
        localStorage.setItem('speechPitch', this.speechPitch);
        
        this.assistant.addMessage('assistant', 
            isAI ? 'AI voice settings saved! You now have premium voice quality! 🎤✨' 
                 : 'Enhanced voice settings saved! 🎤✨'
        );
    }
}

// Export for use in main app
window.AdvancedVoiceHandler = AdvancedVoiceHandler;