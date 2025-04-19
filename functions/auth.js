export async function handleAuth(context) {
    const { request } = context;
    const { method } = request;
    const kv = context.env.TRAIN_TRACKER_KV;
    const url = new URL(request.url);

    // Helper function to log user activity
    async function logActivity(username, action, details = {}) {
        console.log('Activity:', { username, action, details });
    }

    if (method === 'POST') {
        try {
            const data = await request.json();
            
            if (url.pathname === '/api/login') {
                // Handle login
                const { username, password } = data;
                
                // Hardcoded default user for testing
                const defaultUser = {
                    username: 'Mitch',
                    password: 'Mitch',
                    role: 'admin'
                };
                
                console.log('Login attempt:', { username, password });
                console.log('Default user:', defaultUser);
                
                if (username === defaultUser.username && password === defaultUser.password) {
                    const tokenData = {
                        username: defaultUser.username,
                        role: defaultUser.role,
                        timestamp: Date.now()
                    };
                    const token = btoa(JSON.stringify(tokenData));
                    
                    // Log successful login
                    await logActivity(username, 'login', { success: true });
                    
                    return new Response(JSON.stringify({
                        token,
                        username: defaultUser.username,
                        role: defaultUser.role
                    }), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                        }
                    });
                } else {
                    // Log failed login attempt
                    await logActivity(username, 'login', { 
                        success: false,
                        attemptedUsername: username,
                        passwordMatch: password === defaultUser.password
                    });
                    
                    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                        }
                    });
                }
            } else if (url.pathname === '/api/change-password') {
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
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                        }
                    });
                }
                
                try {
                    const decoded = JSON.parse(atob(token));
                    const users = await kv.get('users', 'json') || {
                        admin: {
                            username: 'admin',
                            password: 'admin123',
                            role: 'admin'
                        }
                    };
                    
                    const user = users[decoded.username];
                    if (currentPassword === user.password) {
                        // Update password
                        users[decoded.username].password = newPassword;
                        await kv.put('users', JSON.stringify(users));
                        
                        // Log password change
                        await logActivity(decoded.username, 'password_change', { success: true });
                        
                        return new Response(JSON.stringify({ success: true }), {
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                            }
                        });
                    } else {
                        // Log failed password change attempt
                        await logActivity(decoded.username, 'password_change', { success: false });
                        
                        return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
                            status: 401,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                        }
                    });
                }
            } else if (url.pathname === '/api/users') {
                // Handle user management
                const token = request.headers.get('Authorization')?.split(' ')[1];
                
                if (!token) {
                    return new Response(JSON.stringify({ error: 'No token provided' }), {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                        }
                    });
                }
                
                try {
                    const decoded = JSON.parse(atob(token));
                    if (decoded.role !== 'admin') {
                        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                            status: 403,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                            }
                        });
                    }
                    
                    const users = await kv.get('users', 'json') || {
                        admin: {
                            username: 'admin',
                            password: 'admin123',
                            role: 'admin'
                        }
                    };
                    
                    if (data.action === 'list') {
                        // Return list of users without passwords
                        const userList = Object.entries(users).map(([username, user]) => ({
                            username: user.username,
                            role: user.role
                        }));
                        return new Response(JSON.stringify({ users: userList }), {
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                            }
                        });
                    } else if (data.action === 'create') {
                        const { username, password } = data;
                        if (users[username]) {
                            return new Response(JSON.stringify({ error: 'User already exists' }), {
                                status: 400,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                                }
                            });
                        }
                        
                        users[username] = {
                            username,
                            password,
                            role: 'user'
                        };
                        
                        await kv.put('users', JSON.stringify(users));
                        
                        // Log user creation
                        await logActivity(decoded.username, 'create_user', { username, success: true });
                        
                        return new Response(JSON.stringify({ success: true }), {
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                            }
                        });
                    } else if (data.action === 'delete') {
                        const { username } = data;
                        if (!users[username]) {
                            return new Response(JSON.stringify({ error: 'User not found' }), {
                                status: 404,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                                }
                            });
                        }
                        
                        if (username === 'admin') {
                            return new Response(JSON.stringify({ error: 'Cannot delete admin user' }), {
                                status: 400,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                                }
                            });
                        }
                        
                        delete users[username];
                        await kv.put('users', JSON.stringify(users));
                        
                        // Log user deletion
                        await logActivity(decoded.username, 'delete_user', { username, success: true });
                        
                        return new Response(JSON.stringify({ success: true }), {
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                            }
                        });
                    } else if (data.action === 'get_logs') {
                        // Return activity logs
                        const logs = await kv.get('activity_logs', 'json') || [];
                        return new Response(JSON.stringify({ logs }), {
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error processing request:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    } else if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    return new Response('Method not allowed', { status: 405 });
} 