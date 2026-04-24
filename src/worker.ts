import app from './index';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    // Serve static assets directly if they exist in the Pages project
    if (url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }
    
    // Otherwise, hand over to Hono app
    return app.fetch(request, env, ctx);
  }
};