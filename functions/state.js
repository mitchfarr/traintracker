export async function onRequest(context) {
    const { request } = context;
    const { method } = request;
    const kv = context.env.TRAIN_TRACKER_KV;

    // Check authentication
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return new Response(JSON.stringify({ error: 'No token provided' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        if (!decoded.username || !decoded.role || !decoded.timestamp) {
            throw new Error('Invalid token structure');
        }

        // Check if token is expired (24 hours)
        const tokenAge = Date.now() - decoded.timestamp;
        if (tokenAge > 24 * 60 * 60 * 1000) {
            throw new Error('Token expired');
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    if (method === 'GET') {
        // Get the current state
        const state = await kv.get('train-tracker-state', 'json');
        return new Response(JSON.stringify(state || {}), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    } else if (method === 'POST') {
        // Update the state
        const state = await request.json();
        await kv.put('train-tracker-state', JSON.stringify(state));
        return new Response(JSON.stringify({ success: true }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    } else if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    return new Response('Method not allowed', { status: 405 });
} 