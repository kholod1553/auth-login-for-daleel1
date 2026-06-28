# Daleel Auth Login API

Backend API for the Daleel project using Express and Supabase.

## What Was Fixed

- Replaced the old Gemini chat route with a backend RAG chat flow based on a local dataset and optional Groq enhancement.
- Preserved backward compatibility for the previous chat path through `POST /chat/message`.
- Fixed protected routes so they use the logged-in user's token with Supabase.
- Fixed `DELETE /services/:id`, which was incorrectly nested inside the update route.
- Added a real `GET /categories` endpoint.
- Added fallback sample data for `GET /services` and `GET /categories`.
- Improved request validation and error messages in auth endpoints.
- Added local startup support while keeping Vercel compatibility.
- Removed an unused duplicated auth middleware file.
- Added `supabase/setup.sql` to create categories, seed data, and fix RLS policies for authenticated CRUD on services.
- Added `sql/chat_messages.sql` for storing chat history by session.

## Tech Stack

- Node.js
- Express
- Supabase
- Vercel

## Environment Variables

Create a `.env` file using `.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=3000
SESSION_SECRET=change-me
GROQ_API_KEY=your-groq-api-key
CHAT_MODEL=llama-3.3-70b-versatile
CHAT_TEMPERATURE=0.6
CHAT_BRAND_TONE=professional
FRONTEND_ORIGIN=http://localhost:5173
```

## Install

```bash
npm install
```

## Run Locally

```bash
npm start
```

Server default:

```text
http://localhost:3000
```

## Endpoints

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`

### Services

- `GET /services`
- `GET /services/my-services`
- `GET /services/pending`
- `POST /services`
- `PUT /services/:id`
- `DELETE /services/:id`

### Service Discussion

- `GET /comments/:serviceId`
- `POST /comments/:serviceId`
- `DELETE /comments/:commentId`
- `GET /votes/:serviceId`
- `GET /votes/:serviceId/my-vote`
- `POST /votes/:serviceId`

### Categories

- `GET /categories`

### Chat

- `POST /chat`
- `GET /chat`
- `POST /chat/message`
- `GET /chat/message`

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Use the `access_token` returned from `POST /auth/login`.

Protected endpoints:

- `GET /auth/me`
- `GET /services/my-services`
- `POST /services`
- `PUT /services/:id`
- `DELETE /services/:id`
- `POST /comments/:serviceId`
- `DELETE /comments/:commentId`
- `GET /votes/:serviceId/my-vote`
- `POST /votes/:serviceId`

## Pending Service Discussion

Users can suggest missing services through `POST /services`. Suggested services are created with `status: "pending"` and now include discussion metadata:

```json
{
  "comments": [],
  "comment_count": 0,
  "votes": {
    "upvotes": 0,
    "downvotes": 0,
    "score": 0,
    "total": 0,
    "user_vote": null
  },
  "vote_score": 0
}
```

`GET /services/pending` returns pending services with a `comments` array and Reddit-style vote counts. `POST /votes/:serviceId` accepts `vote_type: "up"` or `vote_type: "down"`. Posting the same vote again removes it; posting the opposite vote changes it.

## Chatbot

The chatbot now runs inside the backend using:

- local dataset: `data/egypt_government_services.json`
- retrieval layer: `lib/chatDataset.js`
- answer generation layer: `lib/chatService.js`
- history storage layer: `lib/chatHistoryStore.js`
- optional Groq enhancement through `GROQ_API_KEY`

If Groq is not configured, the chatbot still works from the local retrieval layer.

The chat endpoints return the new response shape, and also include `reply` for backward compatibility with older frontend code that expected a simple text field.

## Current Supabase Reality

The connected Supabase project currently exposes a `services` table with these usable columns:

- `id`
- `name`
- `description`
- `price`
- `image_url`
- `created_at`

The current project does not expose a `categories` table yet.

The current project also has row-level security blocking writes to `services`, so even valid authenticated requests cannot create, update, or delete until the policies are fixed in Supabase.

Because of that, the API now does two helpful things:

- `GET /services` returns fallback sample data when the table is empty.
- `GET /categories` returns fallback sample data when the table is missing or empty.

## Required Supabase Fix

Run the SQL in `supabase/setup.sql` inside the Supabase SQL editor for this project.

That script will:

- create the `categories` table if it does not exist
- seed categories
- seed services when the table is empty
- allow public reads for services and categories
- allow authenticated users to insert, update, and delete services

Also run `sql/chat_messages.sql` in the Supabase SQL editor to create the chat history table used by `/chat`.

Run `sql/service_discussion.sql` in the Supabase SQL editor to create the `comments` and `votes` tables and their RLS policies.

## Request Body Notes

For create and update on services:

- the API accepts `name` or `title`
- it writes to the real Supabase column `name`
- it also accepts `description`, `price`, and optional `image_url`

## Example Requests

### Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456!\",\"name\":\"Test User\",\"phone\":\"01000000000\"}"
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456!\"}"
```

### Get Services

```bash
curl http://localhost:3000/services
```

### Create Service

```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d "{\"name\":\"Home Cleaning\",\"description\":\"Cleaning service\",\"price\":250,\"image_url\":\"https://example.com/image.jpg\"}"
```

### Get Categories

```bash
curl http://localhost:3000/categories
```

## Deployment

This project is configured for Vercel through `vercel.json`.


