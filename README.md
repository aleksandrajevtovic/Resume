# Portfolio

Personal portfolio built with Angular on the frontend and Spring Boot + MongoDB on the backend.

![Portfolio homepage preview](src/assets/images/page.png)

## Stack

- Frontend: Angular 20
- Animations: GSAP
- Backend: Spring Boot
- Database: MongoDB
- Admin auth: JWT
- Deploy target: Netlify + Render + MongoDB Atlas

## Project structure

- `src/` Angular app
- `backend/` Spring Boot API
- `netlify.toml` Netlify config and redirects
- `server.js` frontend server entry used by `npm start`

## Requirements

- Node `>=20.19.0`
- npm `>=10.8.2`
- Java and Maven for the backend
- MongoDB locally, or MongoDB Atlas

## Local development

Install frontend dependencies:

```bash
npm install
```

Run the Angular app:

```bash
npm run frontend:dev
```

Frontend runs on `http://localhost:4200`.

Run the backend:

```bash
cd backend
mvn spring-boot:run
```

Backend runs on `http://localhost:8081`.

## Useful scripts

- `npm run frontend:dev` start Angular dev server
- `npm run build` build the frontend
- `npm test` run frontend tests
- `npm run backend:dev` start the backend from the repo root

## Backend environment variables

Main backend config:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGIN`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `UPLOAD_DIR`

Notes:

- Admin seeding only happens when both `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set.
- If no admin is seeded, create the first one from `/admin/register`.
- Cloudinary is used for uploads when its env vars are present.
- `UPLOAD_DIR` is only a local fallback and should not be relied on in production.

## Admin

Routes:

- `/admin/register` create the first admin account if none exists yet
- `/admin/login` log in
- `/admin` manage projects and public content

## Production setup

This repo is set up for:

- Netlify for the frontend
- Render for the backend
- MongoDB Atlas for the database

### Frontend

Netlify should use:

- Base directory: `portfolio`
- Build command: `npm run build`
- Publish directory: `dist/portfolio/browser`

Before deploying, update the placeholder backend hostname in [netlify.toml](c:\Users\Aleksandra\Desktop\Projects\portfolio\netlify.toml).

### Backend

Render should point at:

- Root directory: `portfolio/backend`
- Dockerfile: [backend/Dockerfile](c:\Users\Aleksandra\Desktop\Projects\portfolio\portfolio\backend\Dockerfile)

Set the health check path to `/api/public/health`.

### Production notes

- Frontend requests use relative `/api` and `/uploads` paths in production.
- Netlify is expected to proxy those requests to Render.
- Render free instances sleep when idle, so cold starts are normal.
- Local filesystem uploads are ephemeral on hosted platforms.

## API overview

Public endpoints:

- `/api/public/projects`
- `/api/public/health`

Admin/auth endpoints:

- `/api/auth/login`
- `/api/admin/projects`

## Quick check before deploy

```bash
npm run build
```

Then verify:

1. Frontend loads
2. Public projects load
3. Admin login works
4. Uploads work if Cloudinary is configured
