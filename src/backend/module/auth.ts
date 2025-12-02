const isProd = process.env.NODE_ENV === 'production';

export const oidcConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.APP_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_DOMAIN,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  session: {
    cookie: {
      sameSite: isProd ? 'None' : 'Lax', // allow cross-site requests from Vercel -> Render
      secure: isProd       // required for SameSite=None cookies
    }
  }
};