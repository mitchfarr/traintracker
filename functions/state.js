export async function onRequest(context) {
    const { request } = context;
    const { method } = request;
    const kv = context.env.TRAIN_TRACKER_KV;

    console.log('Function called with method:', method);

    if (method === 'GET') {
        // Get the current state
        const state = await kv.get('train-tracker-state', 'json');
        console.log('Retrieved state:', state);
        return new Response(JSON.stringify(state || {}), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } else if (method === 'POST') {
        // Update the state
        const state = await request.json();
        console.log('Saving state:', state);
        await kv.put('train-tracker-state', JSON.stringify(state));
        return new Response(JSON.stringify({ success: true }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } else if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    return new Response('Method not allowed', { status: 405 });
} 