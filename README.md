# JobHuntHQ

JobHuntHQ is a job-search workspace for keeping applications, hiring emails, companies, and resumes organized in one place.

## App overview

The app is built around a simple flow:

1. review incoming job-related emails
2. save useful ones into your applications pipeline
3. track each application across hiring stages
4. keep the right resume linked to each submission
5. monitor progress from a clean dashboard

## Main features

- **Dashboard** for quick search visibility and recent activity
- **Applications board** with drag-and-drop status tracking
- **Email review queue** for Gmail-imported job messages
- **Companies page** to review employer history at a glance
- **Resumes page** with linked-application counts per resume
- **Dark mode**, responsive layout, and friendly loading/error states

## Main pages

| Route | What it shows |
| --- | --- |
| `/` | Dashboard and top-level job search metrics |
| `/applications` | Kanban board for your applications |
| `/review` | Job email review and approval queue |
| `/companies` | Company activity and application history |
| `/resumes` | Resume library and usage counts |

## Core records

- **Application** — company, role, stage, date applied, notes, resume used
- **ImportedEmail** — Gmail message details, preview, confidence score, review state
- **Company** — saved employer record with related applications
- **Resume** — resume name, file link, and linked applications

## Application stages

- `wishlist`
- `applied`
- `interview`
- `offer`
- `rejected`
- `withdrawn`

## Experience goals

JobHuntHQ is designed to feel:

- **clear** for non-technical users
- **fast** for everyday tracking
- **compact** with only what you need
- **calm** with subtle motion and helpful fallbacks

