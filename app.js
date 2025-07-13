class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.updateDate();
        this.renderTasks();
        this.attachEventListeners();
    }

    updateDate() {
        const dateElement = document.getElementById('currentDate');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }

    attachEventListeners() {
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });

        document.getElementById('calendarBtn').addEventListener('click', () => {
            this.showCalendarModal();
        });

        document.getElementById('reminderBtn').addEventListener('click', () => {
            this.showReminderModal();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportTasks();
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const dueDate = document.getElementById('dueDate');

        const task = {
            id: Date.now(),
            text: taskInput.value,
            priority: prioritySelect.value,
            dueDate: dueDate.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();

        taskInput.value = '';
        dueDate.value = '';
        prioritySelect.value = 'medium';
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const newText = prompt('Edit task:', task.text);
            if (newText && newText.trim()) {
                task.text = newText.trim();
                this.saveTasks();
                this.renderTasks();
            }
        }
    }

    getFilteredTasks() {
        if (this.currentFilter === 'all') {
            return this.tasks;
        } else if (this.currentFilter === 'completed') {
            return this.tasks.filter(t => t.completed);
        } else {
            return this.tasks.filter(t => t.priority === this.currentFilter && !t.completed);
        }
    }

    sortTasksByPriority(tasks) {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return tasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();
        const sortedTasks = this.sortTasksByPriority(filteredTasks);

        taskList.innerHTML = '';

        if (sortedTasks.length === 0) {
            taskList.innerHTML = '<li class="empty-state">No tasks found. Add one above!</li>';
            return;
        }

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
            
            const dueInfo = task.dueDate ? `<span class="due-date">Due: ${new Date(task.dueDate).toLocaleString()}</span>` : '';
            
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="taskManager.toggleTask(${task.id})">
                    <span class="task-text">${task.text}</span>
                    ${dueInfo}
                </div>
                <div class="task-actions">
                    <button onclick="taskManager.editTask(${task.id})" class="edit-btn">Edit</button>
                    <button onclick="taskManager.deleteTask(${task.id})" class="delete-btn">Delete</button>
                </div>
            `;
            
            taskList.appendChild(li);
        });
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    showCalendarModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        const incompleteTasks = this.tasks.filter(t => !t.completed);
        
        if (incompleteTasks.length === 0) {
            alert('No tasks to add to calendar!');
            return;
        }

        modalBody.innerHTML = `
            <h3>Create Calendar Event</h3>
            <form id="calendarForm">
                <label>Select Task:</label>
                <select id="taskSelect" required>
                    ${incompleteTasks.map(task => 
                        `<option value="${task.id}">${task.text} (${task.priority} priority)</option>`
                    ).join('')}
                </select>
                
                <label>Event Date & Time:</label>
                <input type="datetime-local" id="eventDateTime" required>
                
                <label>Duration (minutes):</label>
                <input type="number" id="duration" value="30" min="15" required>
                
                <button type="submit">Create Calendar Event</button>
            </form>
        `;

        modal.style.display = 'block';

        document.getElementById('calendarForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCalendarEvent();
        });
    }

    createCalendarEvent() {
        const taskId = document.getElementById('taskSelect').value;
        const task = this.tasks.find(t => t.id == taskId);
        const eventDateTime = document.getElementById('eventDateTime').value;
        const duration = document.getElementById('duration').value;

        const startDate = new Date(eventDateTime);
        const endDate = new Date(startDate.getTime() + duration * 60000);

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${task.text}
DTSTART:${this.formatICSDate(startDate)}
DTEND:${this.formatICSDate(endDate)}
DESCRIPTION:Priority: ${task.priority}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task-${task.id}.ics`;
        a.click();

        document.getElementById('modal').style.display = 'none';
        alert('Calendar event created! Open the downloaded .ics file to add to your calendar.');
    }

    formatICSDate(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    showReminderModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <h3>Email Reminder Setup</h3>
            <form id="reminderForm">
                <label>Your Email:</label>
                <input type="email" id="emailInput" required placeholder="your@email.com">
                
                <label>Reminder Time:</label>
                <select id="reminderTime" required>
                    <option value="daily">Daily at 9 AM</option>
                    <option value="weekly">Weekly on Mondays</option>
                    <option value="custom">Custom Schedule</option>
                </select>
                
                <div id="customSchedule" style="display:none;">
                    <label>Custom Time:</label>
                    <input type="time" id="customTime" value="09:00">
                    
                    <label>Days:</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="days" value="0"> Sunday</label>
                        <label><input type="checkbox" name="days" value="1" checked> Monday</label>
                        <label><input type="checkbox" name="days" value="2"> Tuesday</label>
                        <label><input type="checkbox" name="days" value="3"> Wednesday</label>
                        <label><input type="checkbox" name="days" value="4"> Thursday</label>
                        <label><input type="checkbox" name="days" value="5"> Friday</label>
                        <label><input type="checkbox" name="days" value="6"> Saturday</label>
                    </div>
                </div>
                
                <button type="submit">Save Reminder Settings</button>
            </form>
            <p class="note">Note: To actually send emails, you'll need to run the server component with proper email configuration.</p>
        `;

        modal.style.display = 'block';

        document.getElementById('reminderTime').addEventListener('change', (e) => {
            document.getElementById('customSchedule').style.display = 
                e.target.value === 'custom' ? 'block' : 'none';
        });

        document.getElementById('reminderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReminderSettings();
        });
    }

    saveReminderSettings() {
        const email = document.getElementById('emailInput').value;
        const reminderTime = document.getElementById('reminderTime').value;
        
        const settings = {
            email,
            schedule: reminderTime
        };

        if (reminderTime === 'custom') {
            settings.customTime = document.getElementById('customTime').value;
            settings.days = Array.from(document.querySelectorAll('input[name="days"]:checked'))
                .map(cb => cb.value);
        }

        localStorage.setItem('reminderSettings', JSON.stringify(settings));
        document.getElementById('modal').style.display = 'none';
        alert('Reminder settings saved! Make sure the server is running to receive emails.');
    }

    exportTasks() {
        const exportData = {
            tasks: this.tasks,
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }
}

const taskManager = new TaskManager();