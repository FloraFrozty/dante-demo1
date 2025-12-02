// backend/index.ts
import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { auth, requiresAuth } from 'express-openid-connect';
import { oidcConfig } from './module/auth';
import { userVerifyRoute } from './route/user/verify';
import auth0LogoutRoute from './route/auth0/logout';
import auth0LoginRoute from './route/auth0/login';
// import { assistantThreadRoute } from './route/assistant/thread';
import { route } from './route/index';

async function main() {
  const app = express();

  // ── CORS allowlist (frontends you actually visit from the browser)
  const ALLOWED_ORIGINS = [
    'http://localhost:3000'
  ];

  const corsOptions: cors.CorsOptions = {
    origin(origin, cb) {
      // Auth callbacks or curl may have no Origin → allow
      if (!origin) return cb(null, true);
      cb(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    optionsSuccessStatus: 204,
    maxAge: 86400,
  };

  // + If you run behind a reverse proxy (nginx/Traefik), trust it for correct host/scheme
  if (process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  // 1) CORS FIRST (so preflights get proper headers)
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // ✨ ADDED: ensure credentials are permitted in all responses
  app.use((req, res, next) => {
    res.header('Vary', 'Origin');
    next();
  });

  // 2) Parsers
  app.use(express.json());

  // 3) Auth (express-openid-connect) — baseURL must be http://localhost:8080
  app.use(auth(oidcConfig));

  // 4) Routes
  app.use('/user', userVerifyRoute);
  app.use('/auth0', auth0LogoutRoute);
  app.use('/auth0', auth0LoginRoute);
  // app.use('/assistant/thread', assistantThreadRoute);
  app.use(route);

  // Protected health check (verifies session works)
  app.get('/health', requiresAuth(), (_req, res) => {
    res.json({ status: 'OK' });
  });

  app.get('/login-test', (req, res) => {
    res.json({ isAuthed: req.oidc.isAuthenticated() });
  });

  http.createServer(app).listen(8080, () => {
    console.log('⚡ listening on http://localhost:8080');
  });
}

main().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
