import { onRequest } from './functions/state.js';
import { handleAuth } from './functions/auth.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        if (url.pathname === '/api/state') {
            return onRequest({ request, env });
        }
        
        if (url.pathname === '/api/login' || url.pathname === '/api/change-password') {
            return handleAuth({ request, env });
        }
        
        // For all other requests, serve the static files
        return env.ASSETS.fetch(request);
    }
}; 