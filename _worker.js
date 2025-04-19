import { handleAuth } from './functions/auth.js';
import { handleState } from './functions/state.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Handle API routes
        if (url.pathname.startsWith('/api/')) {
            if (url.pathname === '/api/login' || 
                url.pathname === '/api/change-password' || 
                url.pathname === '/api/users') {
                return handleAuth({ request, env });
            } else if (url.pathname === '/api/state') {
                return handleState({ request, env });
            }
        }
        
        // Serve static files
        return env.ASSETS.fetch(request);
    }
}; 