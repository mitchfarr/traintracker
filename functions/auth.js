export async function handleAuth(context) {
    const { request } = context;
    const { method } = request;
    const kv = context.env.TRAIN_TRACKER_KV;

    if (method === 'POST') {
        const data = await request.json();
        
        if (request.url.endsWith('/api/login')) {
            // Handle login
            const { username, password } = data;
            
            // Get stored credentials
            const storedCredentials = await kv.get('admin-credentials', 'json') || {
                username: 'admin',
                password: 'admin123'
            };
            
            if (username === storedCredentials.username && password === storedCredentials.password) {
                const token = Buffer.from(JSON.stringify({
                    username: storedCredentials.username,
                    role: 'admin',
                    timestamp: Date.now()
                })).toString('base64');
                
                return new Response(JSON.stringify({
                    token,
                    username: storedCredentials.username,
                    role: 'admin'
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
            } else {
                return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
            }
        } else if (request.url.endsWith('/api/change-password')) {
            // Handle password change
            const { currentPassword, newPassword } = data;
            const token = request.headers.get('Authorization')?.split(' ')[1];
            
            if (!token) {
                return new Response(JSON.stringify({ error: 'No token provided' }), {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
            }
            
            try {
                const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                
                // Get stored credentials
                const storedCredentials = await kv.get('admin-credentials', 'json') || {
                    username: 'admin',
                    password: 'admin123'
                };
                
                if (currentPassword === storedCredentials.password) {
                    // Update password
                    await kv.put('admin-credentials', JSON.stringify({
                        username: storedCredentials.username,
                        password: newPassword
                    }));
                    
                    return new Response(JSON.stringify({ success: true }), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type'
                        }
                    });
                } else {
                    return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type'
                        }
                    });
                }
            } catch (error) {
                return new Response(JSON.stringify({ error: 'Invalid token' }), {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
            }
        }
    } else if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    return new Response('Method not allowed', { status: 405 });
} 