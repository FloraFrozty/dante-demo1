import { Router } from 'express';

const auth0LogoutRoute = Router();

auth0LogoutRoute.get('/logout', (_req, res) => {
  res.oidc.logout({ returnTo: 'https://dante-demo1.vercel.app' });
});

export default auth0LogoutRoute;
