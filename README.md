# StudyMate AI 🎓🇳🇬

**StudyMate AI** is an intelligent learning platform engineered for Nigerian secondary-school (JSS 1–3, SS 1–3) and university students. Powered by **Google Gemma 4 E2B Instruct**, it helps students master difficult academic subjects, practise examination questions (WAEC/WASSCE, NECO, JAMB/UTME, University Semester Exams), and elevate their performance through personalised AI tutoring.

---

## 🌟 Core Features

1. **AI Tutor (`POST /api/ai/chat`)**
   - Interactive subject tutoring across 8 core Nigerian subjects.
   - Tailored explanations for **JSS 1–3**, **SS 1–3 (WAEC/JAMB)**, and **University** levels.
   - Dedicated quick prompt modes:
     - 💡 *Practical Nigerian Example* (Naira, markets, local infrastructure, local ecosystems)
     - 🔢 *Step-by-Step Derivation* (Formulae, working steps, intermediate verification)
     - ⚡ *Simplify for Me* (Plain-English intuitive analogies)
     - 📖 *WAEC/JAMB Examination Past Question Style*

2. **AI Quiz Generator (`POST /api/ai/quiz`)**
   - Configurable subject, topic, difficulty (Easy, Medium, Hard), and question count (3, 5, 10).
   - Realistic multiple-choice & short-answer drills.
   - Interactive timed test player with real-time progress.
   - Instant scoring with distinction badges, confetti celebration, and question-by-question explanations with distractor analysis.

3. **AI Theory & Essay Answer Evaluator (`POST /api/ai/evaluate`)**
   - Input any exam question and student's attempted answer.
   - Rubric-based scoring out of 10 marks.
   - Identifies correct points, omissions/lost marks, and conceptual mistakes.
   - Provides an A* Model Answer and examiner advice for WAEC/NECO/University boards.

4. **Student Dashboard**
   - Personalized study stats: questions solved, average accuracy %, study streak, and study hours.
   - Subject mastery progress bars.
   - Recommended high-yield examination topics.
   - One-click launchpads into tutoring, quizzes, and answer grading.

5. **Nigerian Subject Library**
   - 8 core subjects: *Mathematics, Further Mathematics, Physics, Chemistry, Biology, English Language, Economics, Computer Studies*.
   - Curriculum units with WAEC & JAMB syllabus exam weightings.

6. **Profile & Gemma AI Configuration**
   - Real-time connection status check for Google Gemma 4 E2B Instruct.
   - Configurable `GEMMA_API_URL` backend parameter.

---

## 🚀 Running Locally

### 1. Prerequisites
- **Node.js** (v18.0.0 or later)
- **npm** (v9.0.0 or later)

### 2. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 3. Environment Variables & Gemma 4 Gradio Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set `GEMMA_API_URL` to your live public Gradio URL:
```env
GEMMA_API_URL="https://5d086c7fc6184718a6.gradio.live"
PORT=3000
```

> **Important Notes for Kaggle Gradio Users:**
> - When running Google Gemma 4 E2B Instruct on Kaggle with `demo.launch(share=True)`, Gradio generates a public live URL (e.g., `https://<hash>.gradio.live`).
> - Gradio public tunnels remain active for up to 72 hours while the Kaggle notebook session is active.
> - If you restart your Kaggle notebook, Gradio may generate a new live URL. Simply update `GEMMA_API_URL` in your `.env` file (or your deployment environment) with the new link and restart the server (`npm run dev`).
> - No frontend rebuild is required when changing `GEMMA_API_URL` as the connection is managed exclusively by the backend Express server.

### 4. Start the Application
Start the unified full-stack server (Node.js/Express backend + Vite React frontend):
```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## 🌐 Deploying to Render (Full-Stack Web Service)

Deploy StudyMate AI frontend and backend together as a single Node.js Web Service on [Render](https://render.com).

### Render Configuration Settings:
- **Environment:** `Node`
- **Region:** Any (e.g. Frankfurt, Oregon, Ohio)
- **Branch:** `main`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

### Environment Variables on Render:
| Variable Name | Required | Description | Example |
|---|---|---|---|
| `GEMMA_API_URL` | **Yes** (for AI) | Public Gradio live URL from your running Kaggle notebook | `https://<unique-hash>.gradio.live` |
| `NODE_ENV` | Recommended | Sets Node to production mode | `production` |
| `PORT` | Auto-set | Render automatically provides this variable | `10000` (Render default) |

> **Note on Kaggle Gradio Uptime:**
> The Express backend will start immediately and pass Render health checks even if your Kaggle notebook is temporarily offline. When your Kaggle session restarts and provides a new Gradio URL, simply update `GEMMA_API_URL` in the Render Environment tab (no build step or rebuild needed).

---

## 🏗️ Architecture

```
├── server.ts                  # Express backend & Gemma 4 E2B API proxy / engine
├── src/
│   ├── components/
│   │   ├── AITutor.tsx        # Interactive tutoring chat interface
│   │   ├── AnswerEvaluator.tsx# Rubric grading & model answer generator
│   │   ├── Dashboard.tsx      # Student metrics & recommended topics
│   │   ├── Header.tsx         # Top bar contract header
│   │   ├── ProfileSettings.tsx# Student profile & Gemma backend inspector
│   │   ├── QuizGenerator.tsx  # Timed quiz runner & review
│   │   ├── Sidebar.tsx        # Responsive navigation & level switcher
│   │   └── SubjectLibrary.tsx # 8-subject Nigerian curriculum explorer
│   ├── context/
│   │   └── StudyContext.tsx   # Global state, persistence & history
│   ├── data/
│   │   └── curriculumData.ts  # JSS, SS & University syllabus repository
│   ├── services/
│   │   └── aiService.ts       # Frontend API client
│   ├── types/
│   │   └── index.ts           # Shared TypeScript interfaces
│   ├── App.tsx                # App root shell
│   └── main.tsx               # Client entry point
```
