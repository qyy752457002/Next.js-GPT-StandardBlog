import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";

export default handleAuth({
  async callback(req, res) {
    try {
      await handleCallback(req, res);
    } catch (error) {
      // User clicked Decline on Auth0 consent, or another OAuth error occurred.
      console.error("Auth0 callback error:", error?.message || error);
      res.writeHead(302, { Location: "/" });
      res.end();
    }
  },
});
