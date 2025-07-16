# BotSpark

BotSpark is a web-based AI Interview Bot designed to simulate intelligent, human-like interviews using advanced AI and CSP (Constraint Satisfaction Problem) logic. It dynamically selects questions based on topic balance, difficulty, and time constraints, and integrates voice interaction for a realistic, accessible experience. Built with React (frontend) and Django (backend), BotSpark is a modern, extensible platform for HR, EdTech, and online assessment.

## Features
- **CSP-driven Interview Logic:** Dynamic question selection using MRV/LCV heuristics for balanced, adaptive interviews.
- **Voice Input/Output:** Candidates can answer by voice and listen to questions (Web Speech API).
- **Responsive, Modern UI:** Mobile-first, dark mode, and smooth animations.
- **Admin Panel:** Manage questions, view sessions, analytics, and bulk import/export.
- **Session Tracking & Analytics:** Review answers, download reports, and view performance stats.
- **JWT Authentication:** Secure login for candidates and admins.

## Architecture
- **Frontend:** React.js, Bootstrap, CSS Modules, Web Speech API
- **Backend:** Django, Django REST Framework, python-constraint (CSP engine)
- **Database:** SQLite3 (default, easy to swap)

## Setup Instructions

### 1. Backend (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # create an admin user
python manage.py runserver
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm start
```

- The frontend runs on `http://localhost:3000` and the backend on `http://localhost:8000` by default.
- Update API URLs in `frontend/src/api/axios.js` if needed.

## Usage
- **Register/Login** as candidate or admin.
- **Start Interview:** Answer questions by typing or speaking. Review and edit answers before submitting.
- **Admin Dashboard:** Add/edit/delete questions, import/export CSV, view analytics.
- **Session Summary:** Review your answers, download CSV report.
- **Dark Mode:** Toggle from the Navbar.

## Tech Stack
- React, Bootstrap, CSS Modules
- Django, Django REST Framework
- python-constraint (CSP logic)
- Web Speech API (voice)

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
MIT
