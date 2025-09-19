This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


# 🎉 Event-Sync Frontend

The frontend for **Event-Sync**, a web-based event coordination and RSVP platform. Built with **Next.js**, it connects with the backend API to manage event invites, guest lists, email reminders, and more.

---

## ⚙️ Tech Stack

- **Next.js** 14 (App Router)
- **React** 18
- **SendGrid Mail API** (client-side trigger)
- **Google Sheets API** (for integration & sync)
- **React Toastify** (for user notifications)
- **Handlebars** (for templating email content)

---

## 📁 Project Structure

```

event-sync/
├── public/               # Static assets (SVGs, audio, logos)
├── src/
│   ├── app/              # App router pages and API endpoints
│   │   ├── \[eventID]/    # Dynamic event page logic (RSVP, portal)
│   │   ├── api/          # API routes (connected to backend or 3rd-party)
│   │   ├── lib/          # Google Sheets helpers
│   │   ├── utils/        # Date parsers and helper functions
│   │   ├── layout.js     # Global layout
│   │   ├── page.js       # Landing/home page
│   ├── components/       # UI and layout components
│   ├── hooks/            # Custom React hooks (e.g., animation)
├── package.json
├── next.config.mjs
└── jsconfig.json

````

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/event-sync.git
cd event-sync
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` to view the app.

---

## ✉️ Features

* 📝 Dynamic event portals with unique URLs
* ✅ RSVP form with real-time updates
* 📧 Email invites, reminders, and updates
* 📊 Integrated Google Sheets backend
* 🔐 Simple auth flow for event organizers
* 🧠 Smart countdown reminders
* 🔄 Serverless function triggers

---

## 🔐 Environment Variables

Set the following variables in a `.env.local` file if applicable:

```env
SENDGRID_API_KEY=your_sendgrid_key
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEET_ID=...
```

---

## 🧪 Testing

This project currently does not have automated frontend tests. You can add:

* **Jest** + **React Testing Library** for unit/component tests
* **Cypress** for E2E tests

---

## 📤 Deployment

Built for deployment on **Vercel** (recommended), but can also be hosted on **Netlify**, **Render**, or any Node.js-compatible host.

```bash
npm run build
npm start
```

---

## 📚 API Routes

Routes under `/app/api/` handle frontend-triggered functions (e.g., email, RSVP). These are separate from the main backend and act as middleware or proxy functions.

---

## 📎 License

TODO

---

## 👥 Authors

* **Burhanuddin Mogul** – Full Stack Developer

---

