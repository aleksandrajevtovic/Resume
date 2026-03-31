# Portfolio

Personal portfolio built with Angular on the frontend and Spring Boot + MongoDB on the backend.

![Portfolio homepage preview](src/assets/images/page.png)

## Stack

- Frontend: Angular 20
- Animations: GSAP
- Backend: Spring Boot
- Database: MongoDB
- Admin auth: JWT
- Languages: English / German
- Deploy target: Netlify + Render + MongoDB Atlas

## Features

- Responsive layout for desktop and mobile
- Scroll-based animations and page transitions with GSAP
- Admin area for managing projects and public content
- Image and CV uploads

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

- Admin seeding only happens when both `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set.
- If no admin is seeded, create the first one from `/admin/register`.
- Cloudinary is used for uploads when its env vars are present.
- `UPLOAD_DIR` is only a local fallback and should not be relied on in production.

## Admin

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

- Frontend requests use relative `/api` and `/uploads` paths in production.
- Netlify is expected to proxy those requests to Render.
- Render free instances sleep when idle, so cold starts are normal.
- Local filesystem uploads are ephemeral on hosted platforms.
