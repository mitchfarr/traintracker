export async function onRequest(context) {
    const { request } = context;
    const { method } = request;
    const kv = context.env.TRAIN_TRACKER_KV;

    if (method === 'GET') {
        // Get the current state
        const state = await kv.get('train-tracker-state', 'json');
        return new Response(JSON.stringify(state || {}), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (method === 'POST') {
        // Update the state
        const state = await request.json();
        await kv.put('train-tracker-state', JSON.stringify(state));
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response('Method not allowed', { status: 405 });
} 