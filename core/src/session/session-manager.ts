import { Session, Config } from '../types/mantis';
import { VerifiedContextStore } from './verified-context';

export class SessionManager {
    private sessions = new Map<string, Session>();

    async createSession(id: string, config: Config): Promise<Session> {
        const session: Session = {
            id,
            config,
            previousWorkflows: [],
            verifiedContext: new VerifiedContextStore(id),
            queue: { dequeue: async () => null },
            gateway: { send: () => { } },
            context: new Map(),
            sendResponse: async (msg: any) => { console.log(msg); }
        };
        this.sessions.set(id, session);
        return session;
    }

    getSession(id: string): Session | undefined {
        return this.sessions.get(id);
    }
}

export const sessionManager = new SessionManager();
