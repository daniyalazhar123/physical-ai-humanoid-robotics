# Physical AI & Humanoid Robotics RAG Chatbot - Backend Deployment

## Overview
This repository contains a RAG (Retrieval-Augmented Generation) chatbot backend for the Physical AI & Humanoid Robotics textbook. The backend is built with FastAPI and deployed on Vercel.

## Chosen deployment (this repo): separate Vercel project for the backend

The backend is deployed as its **own Vercel project** with **Root Directory = `backend-api`**,
Framework Preset = **Other**, Build Command = `pip install -r requirements.txt`.
`backend-api/vercel.json` routes every path to the FastAPI ASGI app in `backend-api/api/index.py`.
The frontend remains a separate Vercel project with Root Directory = `my-website`.
No rewrites are used in the frontend project.

### Backend Vercel project env vars (names only; set values in Vercel UI)

- `GEMINI_API_KEY`
- `COHERE_API_KEY`
- `NEON_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `FRONTEND_URL`
- `GROK_API_KEY` (optional)
- `JWT_EXPIRY_HOURS` (optional)

Never commit these values. The backend reads them via `os.environ` only.

### Frontend Vercel project env var

- `NEXT_PUBLIC_API_URL` = the live backend URL (e.g. `https://<backend-project>.vercel.app`)

Redeploy the frontend after setting it. If it is missing, auth and translation show
"Backend URL not configured" instead of calling localhost.

### Exposed backend endpoints

`GET /`, `GET /health`, `GET /test`, `POST /api/v1/chat/chat`,
`GET /api/v1/chat/conversation`, `GET /api/v1/content`,
`POST /api/v1/auth/sign-up`, `POST /api/v1/auth/sign-in`,
`POST /api/translate` (Gemini Urdu translation).
Email/password only; no passkey or WebAuthn.

## Architecture
- **FastAPI**: Web framework for the API
- **Cohere**: For generating text embeddings
- **Qdrant**: Vector database for semantic search
- **Google Gemini**: For answer generation
- **Neon Postgres**: For conversation history persistence
- **Vercel**: Cloud platform for deployment

## Deployment to Vercel

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Have a Vercel account
3. Prepare API keys for all required services

### Environment Variables
Set the following environment variables in your Vercel project:

```
COHERE_API_KEY=your_cohere_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
GEMINI_API_KEY=your_gemini_api_key
NEON_URL=your_neon_postgres_connection_string
API_TOKEN=your_api_token_for_authentication
```

### Deployment Steps

1. **Link your Vercel project**:
   ```bash
   vercel link
   ```

2. **Set environment variables**:
   ```bash
   vercel env add
   ```
   Add each of the environment variables listed above.

3. **Deploy the backend**:
   ```bash
   vercel --prod
   ```

### Alternative: Using the deployment script
Run the provided deployment script:
```bash
./deploy-backend.sh
```

## API Endpoints

### Chat Endpoints
- `POST /api/v1/chat/chat` - Main chat endpoint
- `GET /api/v1/chat/health` - Health check
- `POST /api/v1/chat/conversation/start` - Start new conversation
- `GET /api/v1/chat/conversation/{id}/history` - Get conversation history

### Headers Required
- `x-api-token`: Your API authentication token

## Local Development

1. Install dependencies:
   ```bash
   cd backend-api
   pip install -r requirements.txt
   ```

2. Set up environment variables in `.env` file

3. Run the application:
   ```bash
   cd backend-api
   uvicorn main:app --reload --port=8000
   ```

## Initialization

Before using the RAG system, you need to initialize the database and index the content:

1. Run the initialization script:
   ```bash
   python initialize.py
   ```

This will:
- Create the database tables
- Index the Docusaurus documentation content into Qdrant

## Features

- **RAG-powered responses**: Answers based on textbook content
- **Selected text mode**: Answer only from user-selected text
- **Conversation history**: Persistent chat history
- **Streaming responses**: Real-time response streaming
- **Urdu translation**: Optional Urdu translation of responses
- **Health checks**: Comprehensive health monitoring

## Frontend Integration

The backend is designed to work with the Docusaurus frontend. The frontend can call the backend API endpoints with proper authentication.

## Troubleshooting

1. **Environment variables not loaded**: Make sure all required environment variables are set in Vercel dashboard
2. **Database connection issues**: Verify your Neon Postgres connection string
3. **Vector search not working**: Check that Cohere and Qdrant credentials are correct and content has been indexed
4. **API token errors**: Ensure the x-api-token header is included in all requests

## Support

For issues with deployment or functionality, please check:
- API documentation at `/docs` and `/redoc`
- Server logs in the Vercel dashboard
- Ensure all external service credentials are valid