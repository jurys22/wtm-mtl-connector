# WTM MTL Connector – Web App PRD

## Goal

Build a web application called **WTM MTL Connector** to help attendees of WTM MTL events connect with each other for networking.

## Users

- Attendees who want to:
  - Search for a job.
  - Search for a hire.
  - Just chat / casually network.

## Core data model (user profile)

Each user has:

- Email (used for login).
- Password (stored securely, e.g., hashed).
- Display name.
- Networking intention (exactly one of):
  - "Searching for a job"
  - "Searching for a hire"
  - "Just chat"
- Industry (chosen from a predefined list, e.g.:
  - Software / SaaS
  - Finance
  - Healthcare
  - Education
  - Government
  - Gaming
  - Hardware / IoT
  - Consulting
  - Other)
- Top 3 tech skills (chosen from a predefined list spanning STEM / tech, e.g.:
  - Backend (Node, Python, Java, etc.)
  - Frontend (React, Vue, etc.)
  - Data Engineering
  - Data Science / ML
  - DevOps / Cloud
  - Mobile
  - Security
  - Product Analytics
- Top 3 soft skills (chosen from a predefined list, e.g.:
  - Communication
  - Leadership
  - Mentoring
  - Public Speaking
  - Problem Solving
  - Collaboration
  - Initiative)

## Core flows / features

### 1. Registration & login

- User can register with:
  - Email
  - Password (with confirmation)
  - Display name
  - Networking intention (radio/select)
  - Industry (dropdown)
  - Top 3 tech skills (multi-select, max 3)
  - Top 3 soft skills (multi-select, max 3)
- User can log in with email + password.
- Basic session handling so a logged-in user stays authenticated during the event.

### 2. Matching / suggested connections

- For a logged-in user, the system suggests other users to connect with.
- Matching logic (v1):
  - Prefer users with the **same networking intention**.
  - Prefer users with the **same industry** when possible.
  - If no users share the same industry, fall back to matching only on networking intention + skills.
  - Use overlapping tech and soft skills as tie-breakers / ranking signal.
- UI:
  - Show a list of suggested matches with:
    - Display name
    - Networking intention
    - Industry
    - Shared skills (tech + soft)
- Users should not see themselves in the list.

### 3. Conference schedule and availability

- There is a list of conference sessions for the day (we can hard-code them in v1).
- Each session has:
  - Title
  - Start time
  - End time
  - Location (e.g., Room A, Room B, Main Stage)
- Logged-in user can mark which sessions they plan to attend.
- When a user has marked a session as attending, they should **not** appear as available for meetings during that session’s time slot.

### 4. Meeting requests (simple, no chat)

- There is an internal “meeting request” system with no free-form chat.
- For a given suggested match, user can send a meeting request with:
  - Proposed time (pick a time slot not overlapping with either user’s selected sessions).
  - Proposed place: “Main corridor” or “Garden”.
  - Optional short note (max ~200 characters).
- The other user can:
  - Accept (meeting confirmed).
  - Decline.
- For v1, we only need:
  - A simple inbox page for “Incoming requests” and “Outgoing requests”.
  - A basic status for each request: Pending, Accepted, Declined.

## Non-functional

- Web app, responsive enough for laptop + mobile.
- English only.
- Designed so we can later:
  - Add real-time chat.
  - Add admin view for organizers.

## Tech stack (suggested)

- Frontend: React + TypeScript.
- Backend: Node.js (Express or similar) with REST API.
- Database: SQLite or PostgreSQL (whichever is easier to start with).
- Auth: Email/password with hashed passwords.
- Local development only for now (no deployment in v1).

## Changes 1.1

- Change event date to April 18th, 2026
- Allow users to remove confirmation of a given meeting
- When scheduling meetings, the date field showl only be April 18th, 2026 and not changeable
- In the dashboard, the email field should properly display punctuation
- Add responsive layout in the header menu for mobile devices
- change color scheme to use the following: #2480F0, #0F7C67
- use file "Logo (EXT) (1).png" as logo in the top banner, 150px max

## Changes 1.2

- Fix error when unconfirming a meeting request
- Show a recap of selected schedule and accepted appointments in the dashboard
- Display proper error message when failing to book an appointment
- Empty database and restore 3 test users