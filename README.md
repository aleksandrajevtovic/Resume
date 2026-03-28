# Personal Portfolio Website

![Alt text](https://i.imgur.com/z87uwVA.jpg "Personal portfolio image")

Personal website made using Angular, with GSAP animations.

This project now targets Angular 20.

## Full-stack architecture

- Frontend: Angular (`/`)
- Backend: Java Spring Boot + MongoDB (`/backend`)
- Admin auth: JWT login (`/api/auth/login`)
- Protected CRUD: `/api/admin/projects`
- Public data: `/api/public/projects`

## Production deployment target

This repository is prepared for:

- Frontend: Netlify
- Backend API: Render
- Database: MongoDB Atlas

### Important deployment notes

- Production frontend requests use relative paths (`/api` and `/uploads`) and are expected to be proxied by Netlify.
- Update the placeholder Render hostname in `netlify.toml` before publishing the frontend.
- New image and CV uploads are stored in Cloudinary when Cloudinary env vars are configured.
- `UPLOAD_DIR=/tmp/uploads` remains as a local fallback only. This is ephemeral storage on hosted platforms, so avoid relying on it in production.
- The backend no longer accepts hardcoded admin credentials. You must set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in Render if you want a seeded admin.
- No default admin credentials are provided anymore. If `ADMIN_USERNAME` and `ADMIN_PASSWORD` are not set, no admin user is seeded.
- If no admin exists yet, you can create the first admin account from `/admin/register`. Once an admin exists, public registration closes automatically.

## Deployment checklist

Before deploying, prepare these values:

- MongoDB Atlas connection string for `MONGODB_URI`
- Strong random `JWT_SECRET`
- Netlify production URL for `CORS_ALLOWED_ORIGIN`
- Cloudinary credentials for uploads
- Render backend URL for `NETLIFY_RENDER_ORIGIN`

Recommended order:

1. Create MongoDB Atlas cluster and user
2. Create Cloudinary account
3. Deploy backend to Render
4. Update `netlify.toml` with the real Render URL
5. Deploy frontend to Netlify
6. Open `/admin/register` if you are not seeding an admin through env vars

## Deploying to MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user.
3. Allow access from `0.0.0.0/0` while testing, or restrict access once deployment is stable.
4. Copy the connection string into `MONGODB_URI`.

## Deploying the backend to Render

1. Create a new Web Service from this repository in Render.
2. Because the app lives in the `portfolio/` subfolder, either:
   - use the repo-root [render.yaml](c:/Users/Aleksandra/Desktop/Projects/portfolio/render.yaml), or
   - set Root Directory to `portfolio/backend` manually in Render
3. Choose `Docker` as the runtime and use [backend/Dockerfile](c:/Users/Aleksandra/Desktop/Projects/portfolio/portfolio/backend/Dockerfile).
4. Configure these environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRATION_MS`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `CORS_ALLOWED_ORIGIN`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_FOLDER`
   - `UPLOAD_DIR`
5. Set `CORS_ALLOWED_ORIGIN` to your Netlify site URL, for example `https://your-site.netlify.app`.
6. Set the health check path to `/api/public/health`.
7. After the first successful deploy, copy the Render service URL. You will need it in Netlify redirects.
8. Render free services spin down after inactivity and use ephemeral local storage, so cold starts are expected.

## Deploying the frontend to Netlify

1. Connect the repository to Netlify.
2. Because the app lives in the `portfolio/` subfolder, either:
   - let Netlify use the repo-root [netlify.toml](c:/Users/Aleksandra/Desktop/Projects/portfolio/netlify.toml), or
   - set Base directory to `portfolio`
3. Use:
   - Build command: `npm run build`
   - Publish directory: `dist/portfolio/browser`
4. Update the placeholder hostname in [netlify.toml](c:/Users/Aleksandra/Desktop/Projects/portfolio/netlify.toml) to your real Render service URL.
5. Deploy the site.

After deploy:

- Frontend requests to `/api/*` are proxied to Render.
- Frontend requests to `/uploads/*` are proxied to Render.
- The Angular production build uses `/api` automatically via [environment.prod.ts](c:/Users/Aleksandra/Desktop/Projects/portfolio/portfolio/src/environments/environment.prod.ts#L3).

## Backend setup (Spring Boot + MongoDB)

1. Start MongoDB locally (default expected URL: `mongodb://localhost:27017/portfolio`).
2. In a terminal:
   - `cd backend`
   - `mvn spring-boot:run`
3. API runs on `http://localhost:8081`.

### Backend environment variables

- `MONGODB_URI` (default `mongodb://localhost:27017/portfolio`)
- `JWT_SECRET` (base64 secret, set your own in production)
- `JWT_EXPIRATION_MS` (default `86400000`)
- `CORS_ALLOWED_ORIGIN` (default `http://localhost:4200`, can be comma-separated)
- `ADMIN_USERNAME` (no default, must be set together with `ADMIN_PASSWORD`)
- `ADMIN_PASSWORD` (no default, must be set together with `ADMIN_USERNAME`)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` (default `portfolio`)
- `UPLOAD_DIR` (default `uploads`, local fallback only, use `/tmp/uploads` on Render)

Default admin user is only auto-seeded when both `ADMIN_USERNAME` and `ADMIN_PASSWORD` are explicitly set.
If you do not seed one through env vars, open `/admin/register` to create the first admin account.

## Admin dashboard

1. Start frontend: `npm install && npm run frontend:dev`
2. Open `http://localhost:4200/admin/login`
3. Login with admin credentials.
4. Use `/admin` dashboard to:
   - add/edit/delete projects

## Development server

Run `npm install` first, then run `npm run frontend:dev` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

- `npm run build` for default build
- `npm run build -- --configuration production` for an explicit production build

## Running unit tests

- `npm test` for interactive/watch mode

## Local verification checklist

Use this exact order after pulling dependency changes:

1. Ensure Node/npm versions match project requirements:
   - `node -v`
   - `npm -v`
2. Install dependencies:
   - `npm install`
3. Verify Angular and toolchain:
   - `npm run ng -- version`
4. Run validation checks:
   - `npm run build`
5. Smoke-test locally:
   - `npm run frontend:dev`
   - Open the app and navigate key pages/components.

## If something goes wrong

### Diagnose dependency issues
```bash
npm ls
npm run ng -- version
```

If `npm install` fails due peer dependency conflicts, share the output of `npm ls` and we can pin/replace specific packages.

## Further help

To get more help on the Angular CLI use `npm run ng -- help` or check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
