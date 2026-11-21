# AI Physical Humanoids Robotics Engineering

🚀 **Live Website:**
👉 [https://my-website-phi-puce.vercel.app](https://my-website-phi-puce.vercel.app)

A Docusaurus-based interactive textbook and learning platform for **AI Physical Humanoids Robotics Engineering**.
Features a RAG (Retrieval-Augmented Generation) chatbot backend for intelligent Q&A about the textbook content.

---

## Features

- 📚 Structured textbook chapters for AI Physical Humanoids Robotics Engineering
- 🌐 Fast global deployment via **Vercel**
- 🤖 RAG-based chatbot with semantic search capabilities
- 🔗 Integration with Google Gemini and Grok (fallback)
- 💾 Conversation history persistence with Neon Postgres + pgvector
- 🌍 Multilingual support (English + Urdu)
- 🔧 Modular architecture (frontend Docusaurus + backend FastAPI)

---

## Architecture

- **Frontend**: Docusaurus-based documentation website (`my-website/`)
- **Backend**: FastAPI RAG chatbot (`backend-api/`)
- **Database**: Neon Postgres with pgvector for embeddings and conversation history
- **AI Services**: Google Gemini for responses, Grok as fallback

---

## Backend Deployment

The RAG chatbot backend can be deployed to Vercel. See [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) for detailed instructions.

### Prerequisites
- Vercel account
- API keys for Google Gemini, Grok, and Neon Postgres

### Environment Variables (for backend)
- `GEMINI_API_KEY`
- `GROK_API_KEY`
- `NEON_URL`

---

## Frontend Development & Deployment

### Local Development
1. Navigate to the website directory:
   ```bash
   cd my-website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Frontend Deployment
The Docusaurus frontend is automatically deployed to Vercel via the existing GitHub integration.

---

## Backend Development

### Setup
1. Navigate to the backend directory:
   ```bash
   cd backend-api
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables in `.env`

4. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```

---

## API Routes (Verified)

- `GET /` - Root status check
- `GET /health` - Health check
- `GET /test` - Test endpoint
- `POST /api/v1/chat/chat` - Main chat functionality
- Auth routes: `POST /api/v1/auth/signup`, `POST /api/v1/auth/signin`, `POST /api/v1/auth/signout`, `GET /api/v1/auth/profile`

API documentation available at `/docs` when backend is running.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

This project is licensed under the 【entity-MIT¦canonical_name=MIT】 License.
