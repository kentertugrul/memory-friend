class FriendlyAssistant {
    constructor() {
        this.memories = JSON.parse(localStorage.getItem('friendMemories')) || [];
        this.conversations = JSON.parse(localStorage.getItem('conversations')) || [];
        this.userName = localStorage.getItem('userName') || '';
        this.init();
    }

    init() {
        this.updateGreeting();
        this.attachEventListeners();
        this.loadInitialConversation();
        this.updateMemoryPanel();
        this.startPeriodicCheck();
    }

    updateGreeting() {
        const hour = new Date().getHours();
        const greeting = document.getElementById('greeting');
        const status = document.getElementById('status');
        
        let timeGreeting = '';
        let mood = '';
        
        if (hour < 5) {
            timeGreeting = "Still up? ";
            mood = "I'm here if you need to talk about anything";
        } else if (hour < 12) {
            timeGreeting = "Good morning! ";
            mood = "Ready to help you tackle the day";
        } else if (hour < 17) {
            timeGreeting = "Good afternoon! ";
            mood = "Hope your day is going well";
        } else if (hour < 22) {
            timeGreeting = "Good evening! ";
            mood = "Let's see what we can accomplish";
        } else {
            timeGreeting = "Hey night owl! ";
            mood = "I'm here to help, no matter how late";
        }
        
        if (this.userName) {
            greeting.textContent = timeGreeting + this.userName + "! 👋";
        } else {
            greeting.textContent = timeGreeting + "friend! 👋";
        }
        
        status.textContent = mood;
    }

    attachEventListeners() {
        document.getElementById('chatForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserInput();
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });

        window.handleSuggestion = (text) => {
            document.getElementById('chatInput').value = text;
            this.handleUserInput();
        };
    }

    loadInitialConversation() {
        const conversation = document.getElementById('conversation');
        
        if (this.conversations.length === 0) {
            this.addMessage('assistant', this.getWelcomeMessage());
        } else {
            // Show last few messages
            const recentConvos = this.conversations.slice(-5);
            recentConvos.forEach(msg => {
                this.displayMessage(msg.role, msg.content, false);
            });
            this.addMessage('assistant', this.getContinuationMessage());
        }
    }

    getWelcomeMessage() {
        const messages = [
            "Hey there! I'm your personal memory friend. I'll remember everything you tell me - your tasks, thoughts, appointments, random ideas... anything! Just talk to me like you would a friend. What's on your mind?",
            "Hi! Think of me as your external brain. Tell me what you need to remember, what you're thinking about, or ask me what you told me before. I'm here to help! What's up?",
            "Hello! I'm here to be your memory companion. Whether it's something you need to do, someone's birthday, a great idea, or just a random thought - I'll keep track of it all. What would you like me to remember?"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    getContinuationMessage() {
        const hour = new Date().getHours();
        const messages = [
            "I'm back! What's new since we last talked?",
            "Hey again! Need me to remember anything new?",
            "Welcome back! How can I help you today?",
            `Good to see you again! ${this.getTimeBasedComment()}`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    getTimeBasedComment() {
        const hour = new Date().getHours();
        if (hour < 10) return "Starting the day off right?";
        if (hour < 14) return "How's your day going so far?";
        if (hour < 18) return "Afternoon productivity mode?";
        if (hour < 22) return "Wrapping up the day?";
        return "Burning the midnight oil?";
    }

    handleUserInput() {
        const input = document.getElementById('chatInput');
        const userMessage = input.value.trim();
        
        if (!userMessage) return;
        
        this.addMessage('user', userMessage);
        input.value = '';
        
        // Process the message
        setTimeout(() => {
            this.processUserMessage(userMessage);
        }, 500);
    }

    processUserMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Extract name if introduced
        if (lowerMessage.includes("my name is") || lowerMessage.includes("i'm ") || lowerMessage.includes("i am ")) {
            this.extractAndSaveName(message);
        }
        
        // Check if this message contains a list
        const detectedList = this.detectAndParseList(message);
        if (detectedList && detectedList.length > 1) {
            this.handleListInput(message, detectedList);
            return;
        }
        
        // Different types of interactions
        if (lowerMessage.includes("remember") || lowerMessage.includes("remind me") || lowerMessage.includes("don't forget")) {
            this.handleMemoryRequest(message);
        } else if (lowerMessage.includes("what") && (lowerMessage.includes("remember") || lowerMessage.includes("told") || lowerMessage.includes("say"))) {
            this.handleRecallRequest(message);
        } else if (lowerMessage.includes("today") || lowerMessage.includes("do i have") || lowerMessage.includes("what's on")) {
            this.handleScheduleQuery(message);
        } else if (lowerMessage.includes("delete") || lowerMessage.includes("forget") || lowerMessage.includes("remove")) {
            this.handleDeleteRequest(message);
        } else if (lowerMessage.includes("calendar") || lowerMessage.includes("schedule") || lowerMessage.includes("appointment")) {
            this.handleCalendarRequest(message);
        } else if (lowerMessage.includes("email") || lowerMessage.includes("remind") || lowerMessage.includes("notification")) {
            this.handleReminderRequest(message);
        } else if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
            this.handleThanks();
        } else if (lowerMessage.includes("help") || lowerMessage.includes("what can you")) {
            this.handleHelpRequest();
        } else if (lowerMessage.includes("show") && (lowerMessage.includes("list") || lowerMessage.includes("organize") || lowerMessage.includes("summary"))) {
            this.showOrganizedList();
        } else if (lowerMessage.includes("priority") || lowerMessage.includes("urgent") || lowerMessage.includes("important")) {
            this.handlePriorityChange(message);
        } else {
            this.handleGeneralConversation(message);
        }
    }

    extractAndSaveName(message) {
        const patterns = [
            /my name is (\w+)/i,
            /i'm (\w+)/i,
            /i am (\w+)/i,
            /call me (\w+)/i
        ];
        
        for (let pattern of patterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                this.userName = match[1];
                localStorage.setItem('userName', this.userName);
                this.updateGreeting();
                this.addMessage('assistant', `Nice to meet you, ${this.userName}! I'll remember that. 😊`);
                return;
            }
        }
    }

    handleMemoryRequest(message) {
        // Extract what to remember
        const memory = message.replace(/remember|remind me|don't forget|to|that|i need to|i have to/gi, '').trim();
        
        if (memory) {
            const memoryObj = {
                id: Date.now(),
                content: memory,
                type: this.categorizeMemory(memory),
                createdAt: new Date().toISOString(),
                completed: false
            };
            
            this.memories.push(memoryObj);
            this.saveData();
            this.updateMemoryPanel();
            
            const responses = [
                `Got it! I'll remember: "${memory}" ✓`,
                `Noted! "${memory}" is now in my memory bank. I won't forget!`,
                `Consider it remembered! "${memory}" is safe with me.`,
                `Absolutely! I've stored "${memory}" in my brain. 🧠`
            ];
            
            this.addMessage('assistant', responses[Math.floor(Math.random() * responses.length)]);
            
            // Check if it's time-sensitive
            if (this.isTimeSensitive(memory)) {
                setTimeout(() => {
                    this.addMessage('assistant', "Would you like me to create a calendar event or set up an email reminder for this? Just let me know!");
                }, 1500);
            }
        }
    }

    handleRecallRequest(message) {
        const keywords = message.toLowerCase().split(' ').filter(word => 
            word.length > 3 && !['what', 'did', 'tell', 'about', 'remember', 'said', 'have'].includes(word)
        );
        
        const relevantMemories = this.memories.filter(memory => {
            const memLower = memory.content.toLowerCase();
            return keywords.some(keyword => memLower.includes(keyword));
        });
        
        if (relevantMemories.length > 0) {
            let response = "Here's what I remember about that:\n\n";
            relevantMemories.forEach((memory, index) => {
                const date = new Date(memory.createdAt).toLocaleDateString();
                response += `${index + 1}. "${memory.content}" (saved on ${date})\n`;
            });
            this.addMessage('assistant', response);
        } else if (this.memories.length > 0) {
            this.addMessage('assistant', "Hmm, I don't have anything specific about that. Would you like to see everything I'm remembering for you?");
            setTimeout(() => {
                this.showAllMemories();
            }, 1000);
        } else {
            this.addMessage('assistant', "I don't have any memories saved yet. Tell me what you'd like me to remember!");
        }
    }

    handleScheduleQuery() {
        const today = new Date().toDateString();
        const todaysMemories = this.memories.filter(memory => {
            if (memory.dueDate) {
                return new Date(memory.dueDate).toDateString() === today;
            }
            return false;
        });
        
        const incompleteMemories = this.memories.filter(m => !m.completed && m.type === 'task');
        
        if (todaysMemories.length > 0 || incompleteMemories.length > 0) {
            let response = "Here's what's on your plate:\n\n";
            
            if (todaysMemories.length > 0) {
                response += "📅 **Today's items:**\n";
                todaysMemories.forEach(m => {
                    response += `• ${m.content}\n`;
                });
            }
            
            if (incompleteMemories.length > 0) {
                response += "\n📝 **Ongoing tasks:**\n";
                incompleteMemories.forEach(m => {
                    response += `• ${m.content}\n`;
                });
            }
            
            this.addMessage('assistant', response);
        } else {
            const responses = [
                "Your schedule looks clear! No specific tasks or appointments I'm tracking for today. Want to add something?",
                "Nothing pressing on the agenda today. It's a blank canvas! What would you like to accomplish?",
                "No scheduled items for today. Perfect time to tackle something new or just relax!"
            ];
            this.addMessage('assistant', responses[Math.floor(Math.random() * responses.length)]);
        }
    }

    handleDeleteRequest(message) {
        const relevantMemories = this.memories.filter(m => !m.completed);
        
        if (relevantMemories.length === 0) {
            this.addMessage('assistant', "There's nothing to delete right now. Your memory bank is empty!");
            return;
        }
        
        this.addMessage('assistant', "Sure! Here's what I can forget for you. Just click on what you want me to remove:");
        
        setTimeout(() => {
            this.showDeletableMemories();
        }, 500);
    }

    handleCalendarRequest() {
        this.addMessage('assistant', "I can create a calendar file for you! Which memory would you like to turn into an event?");
        setTimeout(() => {
            this.showCalendarModal();
        }, 500);
    }

    handleReminderRequest() {
        this.addMessage('assistant', "I can set up email reminders for you! Let me show you the options...");
        setTimeout(() => {
            this.showReminderModal();
        }, 500);
    }

    handleThanks() {
        const responses = [
            "You're welcome! That's what friends are for! 😊",
            "Happy to help! Anything else on your mind?",
            "No problem at all! I'm here whenever you need me.",
            "My pleasure! Feel free to tell me anything else you need to remember."
        ];
        this.addMessage('assistant', responses[Math.floor(Math.random() * responses.length)]);
    }

    handleHelpRequest() {
        this.addMessage('assistant', `I'm here to be your external memory! Here's what I can do:

📝 **Remember things**: Just tell me "remember..." or "remind me..." and I'll store it
🔍 **Recall memories**: Ask "what did I tell you about..." 
📅 **Check schedule**: Ask "what's on today?" or "what do I have to do?"
🗑️ **Forget things**: Say "delete" or "forget" to remove memories
📆 **Calendar events**: I can create calendar files for your appointments
📧 **Email reminders**: I can help set up recurring reminders

Just talk to me naturally - I'll figure out what you need!`);
    }

    handleGeneralConversation(message) {
        // Store as a general thought/memory
        const memoryObj = {
            id: Date.now(),
            content: message,
            type: 'thought',
            createdAt: new Date().toISOString(),
            completed: false
        };
        
        this.memories.push(memoryObj);
        this.saveData();
        this.updateMemoryPanel();
        
        const responses = [
            "Interesting! I'll keep that in mind. Anything else you want to share?",
            "Thanks for sharing that with me. I'll remember it! What else is going on?",
            "Got it! That's now stored in my memory. Tell me more!",
            "I hear you. I've made a note of that. What's next on your mind?"
        ];
        
        this.addMessage('assistant', responses[Math.floor(Math.random() * responses.length)]);
    }

    categorizeMemory(content) {
        const lower = content.toLowerCase();
        if (lower.includes('meeting') || lower.includes('appointment') || lower.includes('call')) return 'appointment';
        if (lower.includes('buy') || lower.includes('get') || lower.includes('pick up')) return 'shopping';
        if (lower.includes('pay') || lower.includes('bill') || lower.includes('deadline')) return 'deadline';
        if (lower.includes('birthday') || lower.includes('anniversary')) return 'event';
        if (lower.includes('idea') || lower.includes('thought')) return 'idea';
        return 'task';
    }

    isTimeSensitive(content) {
        const timeSensitiveWords = ['tomorrow', 'today', 'tonight', 'morning', 'afternoon', 'evening', 
                                   'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                                   'o\'clock', 'pm', 'am', 'deadline', 'due', 'meeting', 'appointment'];
        const lower = content.toLowerCase();
        return timeSensitiveWords.some(word => lower.includes(word));
    }

    addMessage(role, content) {
        const conversation = { role, content, timestamp: new Date().toISOString() };
        this.conversations.push(conversation);
        this.saveData();
        this.displayMessage(role, content, true);
    }

    displayMessage(role, content, animate = true) {
        const conversation = document.getElementById('conversation');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message ${animate ? 'fade-in' : ''}`;
        
        if (role === 'assistant') {
            messageDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">${this.formatMessage(content)}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">${this.formatMessage(content)}</div>
            `;
        }
        
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }

    formatMessage(content) {
        // Convert markdown-style formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '&bull;');
    }

    updateMemoryPanel() {
        const memoriesDiv = document.getElementById('memories');
        const incompleteMemories = this.memories.filter(m => !m.completed);
        
        if (incompleteMemories.length === 0) {
            memoriesDiv.innerHTML = '<p class="no-memories">Nothing to remember right now. Tell me what\'s on your mind!</p>';
            return;
        }
        
        memoriesDiv.innerHTML = '';
        
        // Sort by urgency first, then by category
        const sortedMemories = incompleteMemories.sort((a, b) => {
            const urgencyA = a.urgency || 3;
            const urgencyB = b.urgency || 3;
            if (urgencyA !== urgencyB) return urgencyB - urgencyA; // Higher urgency first
            return a.type.localeCompare(b.type); // Then alphabetical by type
        });
        
        const grouped = this.groupMemoriesByUrgency(sortedMemories);
        
        Object.entries(grouped).forEach(([urgency, memories]) => {
            if (memories.length === 0) return;
            
            const section = document.createElement('div');
            section.className = 'memory-section';
            
            const urgencyText = this.getUrgencyText(parseInt(urgency));
            const urgencyColor = this.getUrgencyColor(parseInt(urgency));
            
            section.innerHTML = `<h4 style="color: ${urgencyColor};">${urgencyText} Priority (${memories.length})</h4>`;
            
            memories.forEach((memory, index) => {
                const memoryDiv = document.createElement('div');
                memoryDiv.className = 'memory-item';
                memoryDiv.style.borderLeftColor = urgencyColor;
                
                const emoji = this.getCategoryEmoji(memory.type);
                const number = index + 1;
                
                memoryDiv.innerHTML = `
                    <div class="memory-content">
                        <span><strong>${number}.</strong> ${emoji} ${memory.content}</span>
                    </div>
                    <div class="memory-actions">
                        <select class="priority-selector" onchange="assistant.changePriority(${memory.id}, this.value)" title="Change priority">
                            <option value="1" ${(memory.urgency || 3) === 1 ? 'selected' : ''}>Very Low</option>
                            <option value="2" ${(memory.urgency || 3) === 2 ? 'selected' : ''}>Low</option>
                            <option value="3" ${(memory.urgency || 3) === 3 ? 'selected' : ''}>Medium</option>
                            <option value="4" ${(memory.urgency || 3) === 4 ? 'selected' : ''}>High</option>
                            <option value="5" ${(memory.urgency || 3) === 5 ? 'selected' : ''}>Critical</option>
                        </select>
                        <button onclick="assistant.completeMemory(${memory.id})" title="Mark as done">✓</button>
                    </div>
                `;
                section.appendChild(memoryDiv);
            });
            
            memoriesDiv.appendChild(section);
        });
    }

    groupMemoriesByType(memories) {
        return memories.reduce((groups, memory) => {
            const type = memory.type || 'general';
            if (!groups[type]) groups[type] = [];
            groups[type].push(memory);
            return groups;
        }, {});
    }

    groupMemoriesByUrgency(memories) {
        return memories.reduce((groups, memory) => {
            const urgency = memory.urgency || 3;
            if (!groups[urgency]) groups[urgency] = [];
            groups[urgency].push(memory);
            return groups;
        }, {});
    }

    getTypeIcon(type) {
        const icons = {
            task: '📋',
            appointment: '📅',
            shopping: '🛒',
            deadline: '⏰',
            event: '🎉',
            idea: '💡',
            thought: '💭',
            general: '📝'
        };
        return icons[type] || '📝';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    completeMemory(id) {
        const memory = this.memories.find(m => m.id === id);
        if (memory) {
            memory.completed = true;
            this.saveData();
            this.updateMemoryPanel();
            
            const responses = [
                `Nice job! I've marked "${memory.content}" as done! 🎉`,
                `Awesome! "${memory.content}" is completed. Well done! ✨`,
                `Great work! I've checked off "${memory.content}" for you. 👏`
            ];
            
            this.addMessage('assistant', responses[Math.floor(Math.random() * responses.length)]);
        }
    }

    changePriority(id, newUrgency) {
        const memory = this.memories.find(m => m.id === id);
        if (memory) {
            const oldUrgency = memory.urgency || 3;
            const oldUrgencyText = this.getUrgencyText(oldUrgency);
            const newUrgencyText = this.getUrgencyText(parseInt(newUrgency));
            
            memory.urgency = parseInt(newUrgency);
            memory.priority = this.urgencyToPriority(parseInt(newUrgency));
            
            this.saveData();
            this.updateMemoryPanel();
            
            if (oldUrgency !== parseInt(newUrgency)) {
                const responses = [
                    `Updated! "${memory.content}" is now ${newUrgencyText} priority. 🎯`,
                    `Priority changed! "${memory.content}" moved from ${oldUrgencyText} to ${newUrgencyText}. ⚡`,
                    `Got it! I've bumped "${memory.content}" to ${newUrgencyText} priority. 🔥`
                ];
                
                this.addMessage('assistant', responses[Math.floor(Math.random() * responses.length)]);
            }
        }
    }

    handlePriorityChange(message) {
        const lowerMessage = message.toLowerCase();
        const incompleteMemories = this.memories.filter(m => !m.completed);
        
        if (incompleteMemories.length === 0) {
            this.addMessage('assistant', "You don't have any tasks to change priority for right now!");
            return;
        }
        
        // Try to detect which task and what priority
        let targetMemory = null;
        let newPriority = null;
        
        // Look for specific task mentions
        for (let memory of incompleteMemories) {
            const memoryWords = memory.content.toLowerCase().split(' ');
            const messageWords = lowerMessage.split(' ');
            
            // Check if any significant words from the memory appear in the message
            const overlap = memoryWords.filter(word => 
                word.length > 3 && messageWords.includes(word)
            );
            
            if (overlap.length > 0) {
                targetMemory = memory;
                break;
            }
        }
        
        // Detect priority level
        if (lowerMessage.includes('critical') || lowerMessage.includes('emergency')) {
            newPriority = 5;
        } else if (lowerMessage.includes('high') || lowerMessage.includes('urgent')) {
            newPriority = 4;
        } else if (lowerMessage.includes('medium') || lowerMessage.includes('normal')) {
            newPriority = 3;
        } else if (lowerMessage.includes('low')) {
            newPriority = 2;
        } else if (lowerMessage.includes('very low') || lowerMessage.includes('minimal')) {
            newPriority = 1;
        }
        
        if (targetMemory && newPriority) {
            this.changePriority(targetMemory.id, newPriority);
        } else {
            // Show interactive priority changer
            this.showPriorityChangeModal();
        }
    }

    showPriorityChangeModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        const incompleteMemories = this.memories.filter(m => !m.completed);
        
        modalBody.innerHTML = `
            <h3>Change Task Priority</h3>
            <form id="priorityChangeForm">
                <label>Select task:</label>
                <select id="taskSelectPriority" required>
                    ${incompleteMemories.map(m => 
                        `<option value="${m.id}">${m.content} (Currently: ${this.getUrgencyText(m.urgency || 3)})</option>`
                    ).join('')}
                </select>
                
                <label>New priority:</label>
                <select id="newPrioritySelect" required>
                    <option value="5">Critical - Red</option>
                    <option value="4">High - Orange</option>
                    <option value="3" selected>Medium - Yellow</option>
                    <option value="2">Low - Green</option>
                    <option value="1">Very Low - Blue</option>
                </select>
                
                <button type="submit">Update Priority</button>
            </form>
        `;
        
        modal.style.display = 'block';
        
        document.getElementById('priorityChangeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const taskId = parseInt(document.getElementById('taskSelectPriority').value);
            const newPriority = parseInt(document.getElementById('newPrioritySelect').value);
            this.changePriority(taskId, newPriority);
            modal.style.display = 'none';
        });
    }

    showDeletableMemories() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        const incompleteMemories = this.memories.filter(m => !m.completed);
        
        modalBody.innerHTML = `
            <h3>Select memories to forget:</h3>
            <div class="deletable-memories">
                ${incompleteMemories.map(memory => `
                    <div class="deletable-memory">
                        <span>${memory.content}</span>
                        <button onclick="assistant.deleteMemory(${memory.id})">Forget this</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        modal.style.display = 'block';
    }

    deleteMemory(id) {
        this.memories = this.memories.filter(m => m.id !== id);
        this.saveData();
        this.updateMemoryPanel();
        document.getElementById('modal').style.display = 'none';
        this.addMessage('assistant', "Done! I've forgotten about that. 🗑️");
    }

    showAllMemories() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        const grouped = this.groupMemoriesByType(this.memories.filter(m => !m.completed));
        
        let content = '<h3>Everything I\'m remembering for you:</h3><div class="all-memories">';
        
        Object.entries(grouped).forEach(([type, memories]) => {
            content += `<div class="memory-type-group">
                <h4>${this.getTypeIcon(type)} ${this.capitalize(type)}s</h4>
                ${memories.map(m => `<p>• ${m.content}</p>`).join('')}
            </div>`;
        });
        
        content += '</div>';
        modalBody.innerHTML = content;
        modal.style.display = 'block';
    }

    showCalendarModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        const appointments = this.memories.filter(m => !m.completed && ['appointment', 'event', 'deadline'].includes(m.type));
        
        if (appointments.length === 0) {
            modalBody.innerHTML = '<p>No appointments or events to create calendar entries for. Tell me about an upcoming event first!</p>';
            modal.style.display = 'block';
            return;
        }
        
        modalBody.innerHTML = `
            <h3>Create Calendar Event</h3>
            <form id="calendarForm">
                <label>Select memory:</label>
                <select id="memorySelect" required>
                    ${appointments.map(m => `<option value="${m.id}">${m.content}</option>`).join('')}
                </select>
                
                <label>Date & Time:</label>
                <input type="datetime-local" id="eventDateTime" required>
                
                <label>Duration (minutes):</label>
                <input type="number" id="duration" value="60" min="15" required>
                
                <button type="submit">Create Calendar File</button>
            </form>
        `;
        
        modal.style.display = 'block';
        
        document.getElementById('calendarForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCalendarEvent();
        });
    }

    createCalendarEvent() {
        const memoryId = document.getElementById('memorySelect').value;
        const memory = this.memories.find(m => m.id == memoryId);
        const eventDateTime = document.getElementById('eventDateTime').value;
        const duration = document.getElementById('duration').value;
        
        const startDate = new Date(eventDateTime);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${memory.content}
DTSTART:${this.formatICSDate(startDate)}
DTEND:${this.formatICSDate(endDate)}
DESCRIPTION:Created by your memory friend
END:VEVENT
END:VCALENDAR`;
        
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-${memory.id}.ics`;
        a.click();
        
        document.getElementById('modal').style.display = 'none';
        this.addMessage('assistant', 'Calendar event created! Just open the downloaded file to add it to your calendar app. 📅');
    }

    formatICSDate(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    showReminderModal() {
        // Similar to original but with conversational style
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <h3>Email Reminder Setup</h3>
            <form id="reminderForm">
                <p>I can send you regular email summaries of what you need to remember!</p>
                
                <label>Your email:</label>
                <input type="email" id="emailInput" required placeholder="your@email.com">
                
                <label>When should I remind you?</label>
                <select id="reminderTime" required>
                    <option value="daily">Every morning at 9 AM</option>
                    <option value="weekly">Weekly on Mondays</option>
                    <option value="custom">Custom schedule</option>
                </select>
                
                <button type="submit">Set up reminders</button>
            </form>
            <p class="note">Note: Requires the server component to actually send emails.</p>
        `;
        
        modal.style.display = 'block';
        
        document.getElementById('reminderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReminderSettings();
        });
    }

    saveReminderSettings() {
        const email = document.getElementById('emailInput').value;
        localStorage.setItem('reminderEmail', email);
        document.getElementById('modal').style.display = 'none';
        this.addMessage('assistant', `Perfect! I'll send reminders to ${email}. Make sure the server is running to receive them! 📧`);
    }

    startPeriodicCheck() {
        // Check for time-sensitive reminders every hour
        setInterval(() => {
            this.checkForReminders();
        }, 3600000); // 1 hour
    }

    checkForReminders() {
        const now = new Date();
        const todaysMemories = this.memories.filter(memory => {
            if (memory.dueDate) {
                const dueDate = new Date(memory.dueDate);
                return dueDate.toDateString() === now.toDateString() && !memory.reminded;
            }
            return false;
        });
        
        if (todaysMemories.length > 0) {
            todaysMemories.forEach(memory => {
                memory.reminded = true;
                this.addMessage('assistant', `⏰ Hey! Just a reminder: "${memory.content}" is scheduled for today!`);
            });
            this.saveData();
        }
    }

    detectAndParseList(message) {
        // Detect various list formats
        const listPatterns = [
            // Numbered lists: 1. item, 2. item
            /(?:^|\n)\s*\d+\.\s*([^\n]+)/g,
            // Bullet points: - item, * item, • item
            /(?:^|\n)\s*[-*•]\s*([^\n]+)/g,
            // Simple comma separated: item1, item2, item3
            /([^,\n]+),\s*([^,\n]+)(?:,\s*([^,\n]+))+/g,
            // "and" separated: item1 and item2 and item3
            /([^,\n]+)\s+and\s+([^,\n]+)(?:\s+and\s+([^,\n]+))+/g,
            // Line breaks as separators (multiple items on separate lines)
            /^(.+)$/gm
        ];

        let items = [];
        
        // Try numbered/bulleted lists first
        for (let i = 0; i < 2; i++) {
            let match;
            const pattern = listPatterns[i];
            while ((match = pattern.exec(message)) !== null) {
                const item = match[1].trim();
                if (item.length > 2) { // Avoid very short items
                    items.push(item);
                }
            }
            if (items.length > 1) return items;
        }
        
        // Try comma separated
        const commaMatch = message.match(listPatterns[2]);
        if (commaMatch) {
            items = message.split(',').map(item => item.trim()).filter(item => item.length > 2);
            if (items.length > 1) return items;
        }
        
        // Try "and" separated
        const andMatch = message.match(listPatterns[3]);
        if (andMatch) {
            items = message.split(/\s+and\s+/).map(item => item.trim()).filter(item => item.length > 2);
            if (items.length > 1) return items;
        }
        
        // Check for multiple lines that might be a list
        const lines = message.split('\n').map(line => line.trim()).filter(line => line.length > 2);
        if (lines.length > 2 && lines.length < 10) { // Reasonable list size
            // Check if lines look like list items (not conversational)
            const listLikeLines = lines.filter(line => 
                !line.includes('?') && // Not questions
                !line.includes('I ') && // Not personal statements
                !line.includes('you ') && // Not addressing someone
                line.length < 100 && // Not too long
                line.length > 3 // Not too short
            );
            if (listLikeLines.length > 1) return listLikeLines;
        }
        
        return [];
    }

    handleListInput(originalMessage, listItems) {
        let response = `I found a list in your message! Let me organize this for you:\n\n`;
        
        const processedItems = listItems.map((item, index) => {
            const processed = this.analyzeListItem(item);
            
            // Store each item as a memory
            const memoryObj = {
                id: Date.now() + index,
                content: processed.cleanText,
                type: processed.category,
                urgency: processed.urgency,
                priority: this.urgencyToPriority(processed.urgency),
                createdAt: new Date().toISOString(),
                completed: false,
                listId: Date.now(), // Group items from same list
                originalText: item
            };
            
            this.memories.push(memoryObj);
            return { ...processed, memoryObj };
        });
        
        // Sort by urgency for display
        processedItems.sort((a, b) => b.urgency - a.urgency);
        
        processedItems.forEach((item, index) => {
            const emoji = this.getCategoryEmoji(item.category);
            const urgencyColor = this.getUrgencyColor(item.urgency);
            const urgencyText = this.getUrgencyText(item.urgency);
            
            response += `<div class="list-item" style="border-left: 4px solid ${urgencyColor}; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.8); border-radius: 8px;">`;
            response += `<strong>${index + 1}. ${emoji} ${item.cleanText}</strong><br>`;
            response += `<small style="color: #666;">Category: ${item.category} • Urgency: ${urgencyText}</small>`;
            response += `</div>`;
        });
        
        response += `\n\nI've organized your ${listItems.length} items by urgency and saved them all to my memory! 🧠✨`;
        
        this.saveData();
        this.updateMemoryPanel();
        this.addMessage('assistant', response);
        
        // Offer additional help
        setTimeout(() => {
            this.addMessage('assistant', "Would you like me to create calendar events for any time-sensitive items, or set up reminders?");
        }, 2000);
    }

    analyzeListItem(item) {
        const cleanText = item.replace(/^\d+\.\s*|-\s*|\*\s*|•\s*/, '').trim();
        const lowerText = cleanText.toLowerCase();
        
        // Determine category
        const category = this.determineCategory(lowerText);
        
        // Determine urgency (1-5 scale)
        const urgency = this.determineUrgency(lowerText);
        
        return {
            cleanText,
            category,
            urgency,
            originalText: item
        };
    }

    determineCategory(text) {
        const categories = {
            work: ['meeting', 'deadline', 'project', 'email', 'call', 'presentation', 'report', 'work', 'office', 'boss', 'client', 'contract'],
            personal: ['dentist', 'doctor', 'appointment', 'birthday', 'anniversary', 'family', 'friend', 'personal', 'self'],
            shopping: ['buy', 'get', 'pick up', 'purchase', 'store', 'groceries', 'shopping', 'amazon', 'order'],
            health: ['exercise', 'gym', 'workout', 'run', 'walk', 'doctor', 'dentist', 'medication', 'health', 'medical'],
            finance: ['pay', 'bill', 'tax', 'bank', 'money', 'budget', 'invoice', 'payment', 'finance'],
            home: ['clean', 'repair', 'fix', 'maintenance', 'house', 'home', 'garden', 'yard', 'laundry'],
            learning: ['read', 'study', 'learn', 'course', 'book', 'research', 'education', 'training'],
            social: ['party', 'dinner', 'lunch', 'meet', 'hangout', 'event', 'social', 'friend', 'family'],
            travel: ['trip', 'vacation', 'flight', 'hotel', 'travel', 'book', 'pack', 'passport', 'visa']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    determineUrgency(text) {
        let urgency = 3; // Default medium urgency
        
        // High urgency indicators
        const highUrgencyWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline', 'due today', 'overdue', 'late'];
        const timeIndicators = ['today', 'tonight', 'this morning', 'this afternoon', 'now', 'soon'];
        
        // Medium-high urgency
        const mediumHighWords = ['important', 'priority', 'tomorrow', 'this week', 'by friday', 'due'];
        
        // Low urgency indicators
        const lowUrgencyWords = ['someday', 'eventually', 'when possible', 'maybe', 'consider', 'think about'];
        const distantTime = ['next month', 'next year', 'sometime', 'later'];
        
        if (highUrgencyWords.some(word => text.includes(word)) || timeIndicators.some(word => text.includes(word))) {
            urgency = 5;
        } else if (mediumHighWords.some(word => text.includes(word))) {
            urgency = 4;
        } else if (lowUrgencyWords.some(word => text.includes(word)) || distantTime.some(word => text.includes(word))) {
            urgency = 2;
        }
        
        // Adjust based on category
        if (text.includes('deadline') || text.includes('due')) urgency = Math.max(urgency, 4);
        if (text.includes('bill') || text.includes('pay')) urgency = Math.max(urgency, 4);
        if (text.includes('doctor') || text.includes('medical')) urgency = Math.max(urgency, 4);
        
        return Math.min(5, Math.max(1, urgency));
    }

    urgencyToPriority(urgency) {
        if (urgency >= 4) return 'high';
        if (urgency >= 3) return 'medium';
        return 'low';
    }

    getCategoryEmoji(category) {
        const emojis = {
            work: '💼',
            personal: '👤',
            shopping: '🛒',
            health: '🏥',
            finance: '💰',
            home: '🏠',
            learning: '📚',
            social: '👥',
            travel: '✈️',
            general: '📝'
        };
        return emojis[category] || '📝';
    }

    getUrgencyColor(urgency) {
        const colors = {
            5: '#e53e3e', // Red - Critical
            4: '#ff6b35', // Orange-Red - High
            3: '#ffa500', // Orange - Medium
            2: '#32cd32', // Green - Low
            1: '#87ceeb'  // Light Blue - Very Low
        };
        return colors[urgency] || '#ffa500';
    }

    getUrgencyText(urgency) {
        const texts = {
            5: 'Critical',
            4: 'High',
            3: 'Medium',
            2: 'Low',
            1: 'Very Low'
        };
        return texts[urgency] || 'Medium';
    }

    showOrganizedList() {
        const allItems = this.memories.filter(m => !m.completed);
        if (allItems.length === 0) {
            this.addMessage('assistant', "You don't have any items in your memory right now. Tell me what you need to remember!");
            return;
        }
        
        // Group by urgency and sort
        const grouped = allItems.reduce((groups, item) => {
            const urgency = item.urgency || 3;
            if (!groups[urgency]) groups[urgency] = [];
            groups[urgency].push(item);
            return groups;
        }, {});
        
        let response = "Here's your organized list by urgency:\n\n";
        
        // Show from highest to lowest urgency
        for (let urgency = 5; urgency >= 1; urgency--) {
            if (grouped[urgency] && grouped[urgency].length > 0) {
                const urgencyText = this.getUrgencyText(urgency);
                const urgencyColor = this.getUrgencyColor(urgency);
                
                response += `<div style="margin: 15px 0;">`;
                response += `<h4 style="color: ${urgencyColor}; margin-bottom: 10px;">${urgencyText} Priority (${grouped[urgency].length} items)</h4>`;
                
                grouped[urgency].forEach((item, index) => {
                    const emoji = this.getCategoryEmoji(item.type);
                    response += `<div class="list-item" style="border-left: 4px solid ${urgencyColor}; margin: 5px 0; padding: 8px; background: rgba(255,255,255,0.8); border-radius: 6px;">`;
                    response += `${index + 1}. ${emoji} ${item.content}`;
                    response += `</div>`;
                });
                
                response += `</div>`;
            }
        }
        
        this.addMessage('assistant', response);
    }

    saveData() {
        localStorage.setItem('friendMemories', JSON.stringify(this.memories));
        localStorage.setItem('conversations', JSON.stringify(this.conversations.slice(-50))); // Keep last 50 messages
    }
}

window.assistant = new FriendlyAssistant();