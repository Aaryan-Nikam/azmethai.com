import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:18789', {
    headers: { Origin: 'http://127.0.0.1:18789' }
});

ws.on('open', () => {
    console.log('Connected, sending handshake...');
    ws.send(JSON.stringify({
        type: 'req',
        method: 'connect',
        id: `connect-${Date.now()}`,
        params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
                id: 'webchat-ui',
                version: '1.0.0',
                platform: 'web',
                mode: 'ui'
            },
            auth: { token: 'test' }
        }
    }));
});

ws.on('message', (data) => {
    console.log('Received payload:', data.toString());
});

ws.on('close', (code, reason) => {
    console.log('Closed', code, reason.toString());
    process.exit(0);
});

ws.on('error', (err) => {
    console.log('Error', err);
});
