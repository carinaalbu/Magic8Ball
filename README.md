# Magic 8 Ball

An interactive web version of the classic Magic 8 Ball fortune-telling toy. Ask a yes/no question and receive mysterious answers.

## Tech Stack

**Frontend**
- React 19
- Tailwind CSS 4
- Vite

**Backend**
- Node.js with Express 5
- SQLite database
- CORS enabled

## Getting Started

1. Install root dependencies: `npm install`
2. Configure environment variables (see section below)
3. Run backend server: `cd server && npm run dev`
4. Run frontend client: `cd client && npm run dev`

---

## 🧪 Testing Environment Setup

### Environment Variables

1. In the `/server` directory, copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your values:

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default: 3001) |
| `CLIENT_ORIGIN` | Frontend application URL |
| `SMTP_HOST` | Email server hostname |
| `SMTP_PORT` | SMTP port (587 for TLS) |
| `SMTP_USER` | **Your full Gmail address** (e.g. yourname@gmail.com) |
| `SMTP_PASS` | Gmail App Password (NOT your regular account password) |
| `SMTP_FROM` | Sender address for outgoing emails |

---

### Gmail App Password Setup

To use Gmail SMTP:

1.  First enable **2-Step Verification** on your Google Account (required for App Passwords)
2.  Visit: https://myaccount.google.com/apppasswords
3.  Sign in with your Gmail account
4.  Select app: `Mail`
5.  Select device: `Other (Custom name)`
6.  Enter name: `Magic 8 Ball Server`
7.  Click **Generate**
8.  Copy the 16-character password that appears
9.  Paste this password into `SMTP_PASS` in your `.env` file

✅ Use these values for Gmail:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

> ❗ **Important**: Regular Google account passwords will no longer work with SMTP. You **must** create an App Password.
