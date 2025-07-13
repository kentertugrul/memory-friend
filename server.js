const express = require('express');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

let emailTransporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

const loadReminderSettings = () => {
    try {
        const settingsPath = path.join(__dirname, 'reminder-settings.json');
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading reminder settings:', error);
    }
    return null;
};

const loadTasks = () => {
    try {
        const tasksPath = path.join(__dirname, 'tasks-backup.json');
        if (fs.existsSync(tasksPath)) {
            return JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
    return [];
};

const sendReminderEmail = async (email, tasks) => {
    if (!emailTransporter) {
        console.log('Email transporter not configured');
        return;
    }

    const incompleteTasks = tasks.filter(task => !task.completed);
    const highPriorityTasks = incompleteTasks.filter(task => task.priority === 'high');
    const mediumPriorityTasks = incompleteTasks.filter(task => task.priority === 'medium');
    const lowPriorityTasks = incompleteTasks.filter(task => task.priority === 'low');

    const emailContent = `
        <h2>Your Daily Task Reminder</h2>
        <p>You have ${incompleteTasks.length} incomplete tasks:</p>
        
        ${highPriorityTasks.length > 0 ? `
            <h3>High Priority (${highPriorityTasks.length})</h3>
            <ul>
                ${highPriorityTasks.map(task => `<li>${task.text}${task.dueDate ? ` - Due: ${new Date(task.dueDate).toLocaleString()}` : ''}</li>`).join('')}
            </ul>
        ` : ''}
        
        ${mediumPriorityTasks.length > 0 ? `
            <h3>Medium Priority (${mediumPriorityTasks.length})</h3>
            <ul>
                ${mediumPriorityTasks.map(task => `<li>${task.text}${task.dueDate ? ` - Due: ${new Date(task.dueDate).toLocaleString()}` : ''}</li>`).join('')}
            </ul>
        ` : ''}
        
        ${lowPriorityTasks.length > 0 ? `
            <h3>Low Priority (${lowPriorityTasks.length})</h3>
            <ul>
                ${lowPriorityTasks.map(task => `<li>${task.text}${task.dueDate ? ` - Due: ${new Date(task.dueDate).toLocaleString()}` : ''}</li>`).join('')}
            </ul>
        ` : ''}
        
        <p>Stay productive!</p>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Daily Task Reminder - ${incompleteTasks.length} tasks pending`,
        html: emailContent
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        console.log('Reminder email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const setupEmailReminders = () => {
    const settings = loadReminderSettings();
    if (!settings || !settings.email) {
        console.log('No reminder settings found');
        return;
    }

    if (settings.schedule === 'daily') {
        cron.schedule('0 9 * * *', () => {
            const tasks = loadTasks();
            sendReminderEmail(settings.email, tasks);
        });
        console.log('Daily reminder scheduled for 9 AM');
    } else if (settings.schedule === 'weekly') {
        cron.schedule('0 9 * * 1', () => {
            const tasks = loadTasks();
            sendReminderEmail(settings.email, tasks);
        });
        console.log('Weekly reminder scheduled for Mondays at 9 AM');
    } else if (settings.schedule === 'custom' && settings.customTime && settings.days) {
        const [hour, minute] = settings.customTime.split(':');
        const days = settings.days.join(',');
        const cronExpression = `${minute} ${hour} * * ${days}`;
        
        cron.schedule(cronExpression, () => {
            const tasks = loadTasks();
            sendReminderEmail(settings.email, tasks);
        });
        console.log(`Custom reminder scheduled: ${cronExpression}`);
    }
};

app.post('/api/reminder-settings', (req, res) => {
    const settings = req.body;
    fs.writeFileSync(path.join(__dirname, 'reminder-settings.json'), JSON.stringify(settings, null, 2));
    setupEmailReminders();
    res.json({ success: true });
});

app.post('/api/tasks-backup', (req, res) => {
    const tasks = req.body.tasks;
    fs.writeFileSync(path.join(__dirname, 'tasks-backup.json'), JSON.stringify(tasks, null, 2));
    res.json({ success: true });
});

app.get('/api/test-email', async (req, res) => {
    const settings = loadReminderSettings();
    if (!settings || !settings.email) {
        return res.json({ success: false, message: 'No email settings found' });
    }
    
    const tasks = loadTasks();
    await sendReminderEmail(settings.email, tasks);
    res.json({ success: true, message: 'Test email sent' });
});

app.listen(PORT, () => {
    console.log(`Task Manager server running on http://localhost:${PORT}`);
    setupEmailReminders();
});