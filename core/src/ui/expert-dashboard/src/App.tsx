import { useState, useEffect } from 'react'
import './App.css'

function App() {
    const [token, setToken] = useState('mantis-super-expert-token');
    const [authenticated, setAuthenticated] = useState(false);
    const [queue, setQueue] = useState<any[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:18789');

        socket.onopen = () => {
            console.log('Connected to Mantis Gateway');
            setWs(socket);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.id && pendingRequests.has(data.id)) {
                pendingRequests.get(data.id)!(data.result || data.error);
                pendingRequests.delete(data.id);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected');
            setWs(null);
        };

        return () => socket.close();
    }, []);

    // Simple RPC helper
    const pendingRequests = new Map();
    const callRpc = (method: string, params: any) => {
        return new Promise((resolve, reject) => {
            if (!ws) return reject('No WebSocket connection');
            const id = Math.random().toString(36).substring(7);
            pendingRequests.set(id, resolve);
            ws.send(JSON.stringify({
                jsonrpc: '2.0',
                id,
                method,
                params
            }));
        });
    };

    const handleAuth = async () => {
        try {
            const res: any = await callRpc('expert.authenticate', { token });
            if (res?.authenticated) {
                setAuthenticated(true);
                fetchQueue();
            }
        } catch (e) {
            console.error('Auth failed', e);
        }
    };

    const fetchQueue = async () => {
        try {
            const res: any = await callRpc('expert.getQueue', { token });
            if (res?.queue) {
                setQueue(res.queue);
            }
        } catch (e) {
            console.error('Fetch queue failed', e);
        }
    };

    const submitReview = async (commitId: string, status: 'approved' | 'rejected') => {
        try {
            const res: any = await callRpc('expert.submitReview', {
                token,
                commitId,
                status,
                feedback: status === 'rejected' ? 'Manual review rejected' : 'Looks good'
            });
            if (res?.success) {
                alert(`Successfully ${status} commit ${commitId}`);
                fetchQueue(); // Refresh
            }
        } catch (e) {
            console.error('Submit review failed', e);
        }
    };

    if (!authenticated) {
        return (
            <div className="auth-container">
                <h1>Mantis Expert Dashboard</h1>
                <p>Status: {ws ? 'Connected' : 'Connecting...'}</p>
                <div className="auth-box">
                    <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Expert Token"
                    />
                    <button onClick={handleAuth} disabled={!ws}>Authenticate</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header>
                <h1>Mantis Expert Dashboard</h1>
                <button onClick={() => fetchQueue()}>Refresh Queue</button>
            </header>

            <main>
                <h2>Pending Reviews</h2>
                {queue.length === 0 ? (
                    <p>No commits pending review.</p>
                ) : (
                    <div className="queue-list">
                        {queue.map((item) => (
                            <div key={item.commitId} className="queue-item">
                                <h3>Commit: {item.commitId}</h3>
                                <p><strong>Type:</strong> {item.type}</p>
                                <div className="actions">
                                    <button className="approve" onClick={() => submitReview(item.commitId, 'approved')}>Approve</button>
                                    <button className="reject" onClick={() => submitReview(item.commitId, 'rejected')}>Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default App
