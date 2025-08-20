# 🎯 Project takeiteasy — RollX: Real-Time Smart Attendance Platform

## 🚀 1. Core Concept & Mission

**RollX** is a flexible, real-time attendance tracking platform designed for both **academic** and **professional** settings.  
Its mission is to provide an **intuitive**, **reliable**, and **cheat-resistant** way for **Hosts** (teachers, organizers) to take attendance from **Participants** (students, attendees) using a simple, **time-sensitive code-based system**.

The platform is built as a **modern, full-stack web application** with a dedicated **real-time component**.

---

## 👥 2. User Personas & Core Journeys

### 🧑‍🏫 The Host (Teacher/Organizer)

- **Goal:** Create a persistent community, manage members, and run on-demand attendance sessions with minimal friction.
- **Journey:**
  1. Signs up and creates a **Group** (e.g., _CS101 – Fall Semester_).
  2. Gets a unique **Join Code** and shares it with participants.
  3. Starts an attendance session → a **time-limited (60s) QR code or text code** is generated.
  4. Watches a live list of attendees populate in real-time.
  5. Views reports, makes manual edits, and **exports to CSV**.

### 👩‍🎓 The Participant (Student/Attendee)

- **Goal:** Join relevant groups and mark attendance **quickly and reliably**.
- **Journey:**
  1. Signs up and joins a group using the Host’s **Join Code**.
  2. When the Host starts a session, a **"Give Attendance"** button appears.
  3. Submits attendance by scanning the QR code or typing the text code.
  4. Gets **immediate feedback** (success/failure).

---

## 🏗️ 3. Architecture & Technology Stack

### **Frontend & API Backend (Monolith)**

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** TailwindCSS v4
- **Role:** Serves the UI + REST API (`/api/...`) with all business logic.

### **Real-Time Component**

- **Library:** Socket.IO
- **Design:** Custom `server.ts` bootstraps both **Next.js** and **WebSockets** on the same port.
- **Role:** Manages live sessions via **rooms** (`groupId`, `sessionId`), broadcasting events between Host & Participants.

### **Database**

- **Type:** NoSQL
- **Service:** MongoDB (Atlas preferred)
- **ODM:** Mongoose (`User`, `Group`, `AttendanceSession`).

### **Authentication**

- **Library:** NextAuth.js
- **Strategy:** Custom email/password credentials provider.
- **Sessions:** Secure, HTTP-only cookies.

### **Deployment**

- **Method:** Docker + Docker Compose
- **Environment:** Works both in local dev & VPS/cloud production.

---

## ⚡ 4. Key Workflows & Mechanisms

### 🔄 Real-Time Attendance Flow

1. **Waiting:** Participants connect via WebSocket → join `groupId` room.
2. **Trigger:** Host calls `POST /api/attendance/start` → session created.
3. **Broadcast #1:** Server emits `session:started` → participants’ UI activates.
4. **Submission:** Participant submits code → validated via API.
5. **Broadcast #2:** On success → server emits `participant:joined` → Host dashboard updates live.

### 🔑 WebSocket Authentication

- Each user gets a **short-lived JWT "ticket"** from `/api/ws/token`.
- Token is passed in the **WebSocket handshake**.
- The server verifies & authorizes the connection securely.

### 🛡️ Anti-Cheating Strategy

- **Codes expire in 60 seconds** (hard rule).
- Host decides when to start the timer + what method to display (QR/Text).
- Makes proxying/sharing codes impractical.

---

## 🛣️ 5. Development Roadmap

- **Foundation (Docker):**  
  Containerized monorepo (`rollx` + WebSocket integration).

- **Authentication:**  
  User identity with NextAuth.js (signup/login/protected routes).

- **Group Management:**  
  API + UI for creating/joining persistent groups.

- **Real-Time Core:**  
  End-to-end live session: DB models, API, and WebSocket events.

- **Polish & Production:**  
  Manual edits, regenerate codes, CSV export, deployment-ready setup.

---

## 📦 Project Structure

```plaintext
/takeiteasy
│── /rollx # Next.js frontend + API backend (full-stack monolith)
│── /ws-server # WebSocket server (Socket.IO, Node.js, TypeScript)
│── docker-compose.yml
│── .env
│── README.md
```

## 🐳 Deployment with Docker

```bash
# Build and start all services
docker-compose up --build

# RollX app: http://localhost:3000
# WebSocket server: ws://localhost:3001
```
