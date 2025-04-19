import { onRequest } from './functions/state.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        if (url.pathname === '/api/state') {
            return onRequest({ request, env });
        }
        
        // For all other requests, serve the static files
        return env.ASSETS.fetch(request);
    }
}; 