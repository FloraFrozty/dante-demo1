export const oidcConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.APP_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_DOMAIN,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  session: {
    // leave cookie.name etc default unless you’ve customized it
    cookie: {
      sameSite: 'none',  // allow cross-site requests from Vercel -> Render
      secure: true       // required for SameSite=None cookies
    }
  }
};