# AI-Powered Resume Grader (MERN + Gemini)

A full-stack web app that evaluates resumes against a job description and returns an
ATS-style grade, score, missing skills, feedback, and improvement suggestions —
powered by **Google Gemini**.

## Features

- **Guest mode** — analyze resumes with no sign-up (results are not saved).
- **Authenticated mode** — JWT register/login, saved history, download, and delete.
- **Resume parsing** — PDF (`pdf-parse`), DOCX (`mammoth`), images via OCR (`tesseract.js`), or pasted text.
- **AI analysis** — Gemini returns strict JSON: `grade`, `score`, `missingSkills`, `feedback`, `suggestions`.
- **Resume validation** — non-resume content (story, code, gibberish) is rejected with "Give a proper resume".
- **Cloud storage** — authenticated users' resume files are stored on **Cloudinary**; download and delete supported.
- **Strong passwords** — min 8 chars with upper, lower, number, and special character.
- **Modern dark UI** — React + Tailwind + React Router + Zustand + Axios.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React, Tailwind CSS, React Router, Zustand, Axios (Vite) |
| Backend  | Node.js, Express, Mongoose, JWT, Multer |
| Database | MongoDB (Atlas or local) |
| AI       | Google Gemini (`gemini-2.5-flash`) |
| Storage  | Cloudinary |

## Project structure

```
AI-Resume-Grader/
├── server/          # Express API (ES Modules)
│   ├── config/      # db, cloudinary
│   ├── controllers/ # auth, analysis
│   ├── middleware/  # auth (JWT), upload (multer)
│   ├── models/      # User, Analysis
│   ├── routes/      # auth.routes, analysis.routes
│   ├── services/    # extractText, geminiService, prompt
│   ├── utils/       # validatePassword
│   └── index.js
└── client/          # React (Vite)
    └── src/{components, pages, store, lib}
```

## Setup

### Prerequisites
Node.js 18+ · a MongoDB URI · a Gemini API key · (optional) a Cloudinary account.

### 1. Backend
```bash
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
```
Fill in `server/.env`:

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | yes | Atlas or local connection string |
| `JWT_SECRET` | yes | Any long random string |
| `GEMINI_API_KEY` | yes | https://aistudio.google.com/app/apikey |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.5-flash` |
| `CLOUDINARY_*` | optional | Enables resume file storage/download |

```bash
npm run dev               # http://localhost:5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev               # http://localhost:5173 (proxies /api -> backend)
```

> Note: the backend does not auto-start with the client. Run both, or you'll get
> "Cannot reach the server" errors.

## API reference

### Auth
- `POST /api/auth/register` → `{ name, email, password }` → `{ token, user }`
- `POST /api/auth/login` → `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me` *(Bearer)* → `{ user }`

### Analysis
- `POST   /api/analyze` *(optional Bearer)* — `resume` file or `resumeText` + `jobDescription`, `jobTitle`.
  Guests get results only; authenticated users get Cloudinary upload + saved history.
- `GET    /api/analyze/history` *(Bearer)* — current user's analyses.
- `GET    /api/analyze/history/:id/download` *(Bearer)* — download the stored resume.
- `DELETE /api/analyze/history/:id` *(Bearer)* — delete analysis + Cloudinary file.

### AI response shape
```json
{
  "grade": "A",
  "score": 84,
  "missingSkills": ["Docker", "AWS"],
  "feedback": "Strong MERN stack knowledge but lacks deployment experience.",
  "suggestions": ["Add cloud-related projects", "Include measurable achievements"]
}
```

## Grading scale
`90–100 → O · 80–89 → A · 70–79 → B · 60–69 → C · 50–59 → D · below 50 → F`
The numeric score always determines the letter grade.

## Notes
- Secrets live in `.env` (gitignored). Never commit real credentials; rotate any that were shared.
- Resume files are stored as Cloudinary `raw` assets so PDF/DOCX downloads work reliably.
