# Memory Friend 🧠✨

Your personal conversational memory assistant that remembers everything you tell it, organizes your thoughts, and helps you stay productive.

## Features

🤖 **Conversational Interface**
- Chat naturally like talking to a friend
- Personalized greetings based on time of day
- Remembers your name and context

🧠 **Intelligent Memory**
- Automatically detects and parses lists from conversation
- Smart categorization (work, health, shopping, etc.)
- Urgency detection with color-coded priorities
- Numbered organization with emoji categories

📱 **Cross-Platform**
- Works as web app on any device
- iOS "Add to Home Screen" for native app experience
- Mac app wrapper included
- Offline functionality with service worker

🎯 **Smart Organization**
- Priority levels: Critical (red), High (orange), Medium (yellow), Low (green)
- Category icons: 💼 Work, 🛒 Shopping, 🏥 Health, 💰 Finance, etc.
- Automatic sorting by urgency and importance

📅 **Productivity Tools**
- Calendar event creation (.ics files)
- Email reminder setup
- Task completion tracking
- Export/import functionality

## Quick Start

### Web App (Recommended)
Visit your deployed URL and start chatting with your Memory Friend!

### Local Development
1. Clone this repository
2. Open `index.html` in your browser
3. Start talking to your memory assistant

### iOS Installation
1. Open the web app in Safari
2. Tap Share button → "Add to Home Screen"
3. Enjoy native app experience!

### Mac Application
1. Run `./create-mac-app.sh` to create Mac app bundle
2. Drag "Memory Friend.app" to Applications folder

## Usage Examples

**Natural List Input:**
```
"I need to buy groceries, call the dentist, and finish my project deadline today"
```

**Memory Queries:**
```
"What did I tell you about my doctor appointment?"
"Show me my organized list"
"What should I do today?"
```

**Direct Commands:**
```
"Remember I have a meeting tomorrow at 2pm"
"Delete my grocery shopping task"
"Create a calendar event for my dentist appointment"
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: localStorage (client-side)
- **PWA**: Service Worker for offline functionality
- **Icons**: Custom-generated with multiple sizes
- **Deployment**: Vercel with automatic GitHub integration

## Deployment

This app is configured for easy deployment on Vercel:

1. Push to GitHub repository
2. Connect to Vercel
3. Automatic deployments on every commit
4. HTTPS enabled for PWA features

## License

Open source - feel free to customize and improve!

---

*Your thoughts and tasks are safe with Memory Friend - everything stays private in your browser's local storage.*