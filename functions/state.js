export async function handleState(context) {
    const { request } = context;
    const { method } = request;
    const kv = context.env.TRAIN_TRACKER_KV;

    // Helper function to log train activity
    async function logTrainActivity(username, action, details = {}) {
        const logs = await kv.get('activity_logs', 'json') || [];
        logs.push({
            timestamp: new Date().toISOString(),
            username,
            action,
            details
        });
        // Keep only the last 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        await kv.put('activity_logs', JSON.stringify(logs));
    }

    if (method === 'GET') {
        try {
            const state = await kv.get('state', 'json') || {
                trainPositions: {},
                trackStatuses: {},
                trackNotes: {}
            };
            return new Response(JSON.stringify(state), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Failed to load state' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }
    } else if (method === 'POST') {
        try {
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

            const decoded = JSON.parse(atob(token));
            const data = await request.json();
            
            // Log train movements
            if (data.trainPositions) {
                const oldState = await kv.get('state', 'json') || {
                    trainPositions: {},
                    trackStatuses: {},
                    trackNotes: {}
                };
                
                // Compare old and new positions to find moved trains
                Object.entries(data.trainPositions).forEach(([trainId, newTrack]) => {
                    const oldTrack = oldState.trainPositions[trainId];
                    if (oldTrack !== newTrack) {
                        logTrainActivity(decoded.username, 'move_train', {
                            trainId,
                            from: oldTrack || 'pool',
                            to: newTrack,
                            success: true
                        });
                    }
                });
            }
            
            // Log track status changes
            if (data.trackStatuses) {
                const oldState = await kv.get('state', 'json') || {
                    trainPositions: {},
                    trackStatuses: {},
                    trackNotes: {}
                };
                
                Object.entries(data.trackStatuses).forEach(([trackId, newStatus]) => {
                    const oldStatus = oldState.trackStatuses[trackId];
                    if (oldStatus !== newStatus) {
                        logTrainActivity(decoded.username, 'change_track_status', {
                            trackId,
                            from: oldStatus || 'none',
                            to: newStatus,
                            success: true
                        });
                    }
                });
            }
            
            // Log track note changes
            if (data.trackNotes) {
                const oldState = await kv.get('state', 'json') || {
                    trainPositions: {},
                    trackStatuses: {},
                    trackNotes: {}
                };
                
                Object.entries(data.trackNotes).forEach(([trackId, newNote]) => {
                    const oldNote = oldState.trackNotes[trackId];
                    if (oldNote !== newNote) {
                        logTrainActivity(decoded.username, 'update_track_notes', {
                            trackId,
                            success: true
                        });
                    }
                });
            }
            
            await kv.put('state', JSON.stringify(data));
            return new Response(JSON.stringify({ success: true }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Failed to save state' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }
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