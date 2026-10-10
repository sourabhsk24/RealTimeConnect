# RealTimeConnect 🎥💬

**A Real-Time Video Calling and Communication Application**

RealTimeConnect is a web-based communication application developed as part of the CodeAlpha Full Stack Development Internship. It enables users to authenticate, create or join meeting rooms, communicate through live chat, and connect through real-time audio and video using WebRTC.

## ✨ Features

- **User Authentication** — User registration, login, and logout.
- **Meeting Rooms** — Create and join meeting rooms.
- **Real-Time Video Calling** — Audio and video communication powered by WebRTC.
- **Screen Sharing** — Share your screen during a meeting.
- **Live Chat** — Exchange messages with other meeting participants.
- **Responsive Interface** — A modern, dark-themed interface designed for a better user experience.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Django | Web framework and authentication |
| HTML5 & CSS3 | User interface and styling |
| JavaScript | Client-side interactions |
| WebRTC | Real-time audio and video |
| Socket.IO | Real-time signaling and communication |
| Node.js | Signaling server |
| SQLite | Development database |
| Git & GitHub | Version control and project hosting |

## 📁 Project Structure

```text
RealTimeConnect/
├── chat/
│   ├── migrations/
│   ├── static/
│   ├── templates/
│   ├── models.py
│   ├── views.py
│   └── urls.py
├── realtimechat/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── signaling/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── manage.py
└── .gitignore
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the project:

- Python 3.12 or compatible
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/sourabhsk24/RealTimeConnect.git
cd RealTimeConnect
```

### 2. Create and activate a Python virtual environment

**Windows PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install the backend dependencies

```powershell
python -m pip install django
```

If additional Python dependencies are required by your local setup, install them before starting the application.

### 4. Apply database migrations

```powershell
python manage.py migrate
```

### 5. Start the Django server

```powershell
python manage.py runserver
```

Open `http://127.0.0.1:8000/` in your browser.

### 6. Start the signaling server

Open a second terminal:

```powershell
cd signaling
npm install
node server.js
```

Make sure the frontend's Socket.IO signaling URL matches the address where the signaling server is running. For testing across different devices or networks, configure the appropriate reachable URL.

## 🔒 Security Notes

- Configure Django's `SECRET_KEY` through an environment variable for deployment.
- Set `DEBUG = False` and configure appropriate allowed hosts before production deployment.
- Use HTTPS and secure signaling/media configurations when deploying publicly.
- Never commit passwords, API keys, private credentials, or production secrets.

## 🚀 Future Enhancements

- Reliable file sharing between meeting participants.
- Collaborative whiteboard.
- Improved meeting controls and participant management.
- Production deployment and additional security hardening.

## 🎓 Project Information

**Project:** RealTimeConnect  
**Purpose:** CodeAlpha Full Stack Development Internship  
**Category:** Real-Time Communication Web Application

## 👨‍💻 Author

**SOURABH KAMBLE**

GitHub: [@sourabhsk24](https://github.com/sourabhsk24)

## 📜 License

This project is intended for educational and portfolio purposes. Add a formal open-source license if you decide to distribute it under specific reuse terms.

