import { WebSocket } from 'ws';

async function simulate() {
    console.log('--- Mantis End-to-End Simulation ---');

    // 1. Initial Orchestrator Request (Simulated)
    console.log('[Client] Sending Goal: Formulate Market Expansion Strategy');

    // 2. Mock connecting to gateway to broadcast updates
    const ws = new WebSocket('ws://localhost:18789');

    ws.on('open', () => {
        console.log('[Gateway] WS connected. Simulating workflow...');

        let step = 0;
        const interval = setInterval(() => {
            step++;

            if (step === 1) {
                console.log('[Orchestrator] Decomposed goal into 3 tasks.');
                ws.send(JSON.stringify({
                    type: 'orchestrator.task.update',
                    status: 'decomposed',
                    tasks: [
                        { id: '1', name: 'Analyze Competitors', status: 'pending' },
                        { id: '2', name: 'Identify Audience', status: 'pending' }
                    ]
                }));
            } else if (step === 2) {
                console.log('[WorkflowExecutor] Executing Task 1...');
                ws.send(JSON.stringify({
                    type: 'orchestrator.task.update',
                    taskId: '1',
                    status: 'in_progress'
                }));
            } else if (step === 3) {
                console.log('[ExpertAgent] Task 1 Completed. Sent for Validation.');
                ws.send(JSON.stringify({
                    type: 'orchestrator.task.update',
                    taskId: '1',
                    status: 'validating'
                }));
            } else if (step === 4) {
                console.log('[ValidatorAgent] Task 1 validated and published.');
                ws.send(JSON.stringify({
                    type: 'orchestrator.task.update',
                    taskId: '1',
                    status: 'completed'
                }));
            } else if (step >= 5) {
                console.log('--- Simulation Complete ---');
                clearInterval(interval);
                ws.close();
            }

        }, 1500);
    });

    ws.on('error', (err) => {
        console.error('WebSocket Error. Is Mantis Gateway running?', err);
    });
}

simulate();
