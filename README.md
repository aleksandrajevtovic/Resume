# Personal Portfolio Website

![Alt text](https://i.imgur.com/z87uwVA.jpg "Personal portfolio image")

Personal website made using Angular, animations using GSAP library, hosted on Netflify.

This project now targets Angular 20.

## Full-stack architecture

- Frontend: Angular (`/`)
- Backend: Java Spring Boot + MongoDB (`/backend`)
- Admin auth: JWT login (`/api/auth/login`)
- Protected CRUD: `/api/admin/projects`
- Public data: `/api/public/projects`

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
- `CORS_ALLOWED_ORIGIN` (default `http://localhost:4200`)
- `ADMIN_USERNAME` (default `admin`)
- `ADMIN_PASSWORD` (default `admin123!`)

Default admin user is auto-seeded on first backend run. Change credentials immediately for real deployment.

## Admin dashboard

1. Start frontend: `npm install && npm run ng -- serve`
2. Open `http://localhost:4200/admin/login`
3. Login with admin credentials.
4. Use `/admin` dashboard to:
   - add/edit/delete projects

## Development server

Run `npm install` first, then run `npm start` (or `npm run ng -- serve`) for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

- `npm run build` for default build
- `npm run build:prod` for production build

## Running unit tests

- `npm test` for interactive/watch mode
- `npm run test:ci` for one-shot headless test run (useful for upgrade validation)

## Local upgrade verification checklist

Use this exact order after pulling dependency changes:

1. Ensure Node/npm versions match project requirements:
   - `node -v`
   - `npm -v`
2. Install dependencies:
   - `npm install`
3. Verify Angular and toolchain:
   - `npm run ng -- version`
4. Run validation checks:
   - `npm run verify:local`
5. Smoke-test locally:
   - `npm start`
   - Open the app and navigate key pages/components.

## If something goes wrong

### Quick rollback to previous commit

```bash
git log --oneline -n 5
git reset --hard <last-known-good-commit>
npm install
```

### Keep your current work but undo only dependency changes

```bash
git checkout -- package.json package-lock.json
npm install
```

### Diagnose dependency issues

## Running end-to-end tests
```bash
npm ls
npm run ng -- version
```

If `npm install` fails due peer dependency conflicts, share the output of `npm ls` and we can pin/replace specific packages.

## Further help

To get more help on the Angular CLI use `npm run ng -- help` or check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
