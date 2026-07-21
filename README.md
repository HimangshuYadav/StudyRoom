# StudyRoom

StudyRoom is a collaborative study room web application designed for hackathons. It integrates Node.js, Express, MongoDB (Mongoose), EJS templating, Socket.io, and the Groq AI API.

## Project Structure

```
studyroom/
├── server/
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Message.js
│   │   └── Note.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── noteRoutes.js
│   │   └── aiRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── roomController.js
│   │   ├── noteController.js
│   │   └── aiController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── sockets/
│   │   └── chatSocket.js
│   └── utils/
│       └── groqClient.js
├── views/
│   ├── partials/
│   │   ├── head.ejs
│   │   ├── navbar.ejs
│   │   └── footer.ejs
│   ├── login.ejs
│   ├── signup.ejs
│   ├── dashboard.ejs
│   └── room.ejs
├── public/
│   ├── css/
│   │   ├── main.css
│   │   ├── dashboard.css
│   │   └── room.css
│   └── js/
│       ├── auth.js
│       ├── dashboard.js
│       ├── chat.js
│       ├── notes.js
│       └── ai.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment variables template and customize details:
   ```bash
   cp .env.example .env
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
