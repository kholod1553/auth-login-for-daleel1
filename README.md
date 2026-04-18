# Daleel Auth Login API

Backend API for the Daleel project using Express and Supabase.

## What Was Fixed

- Fixed protected routes so they use the logged-in user's token with Supabase.
- Fixed `DELETE /services/:id`, which was incorrectly nested inside the update route.
- Added a real `GET /categories` endpoint.
- Added fallback sample data for `GET /services` and `GET /categories`.
- Improved request validation and error messages in auth endpoints.
- Added local startup support while keeping Vercel compatibility.
- Removed an unused duplicated auth middleware file.
- Added `supabase/setup.sql` to create categories, seed data, and fix RLS policies for authenticated CRUD on services.

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
- `POST /services`
- `PUT /services/:id`
- `DELETE /services/:id`

### Categories

- `GET /categories`

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

Run the SQL in [supabase/setup.sql](C:/Users/pc/Documents/Codex/2026-04-18-https-github-com-kholod1553-auth-login/repo/supabase/setup.sql) inside the Supabase SQL editor for this project.

That script will:

- create the `categories` table if it does not exist
- seed categories
- seed services when the table is empty
- allow public reads for services and categories
- allow authenticated users to insert, update, and delete services

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


