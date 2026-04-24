import { Session } from '../types/mantis';
import { streamingManager } from '../streaming/streaming-manager';

export abstract class ExpertAgent {
    abstract id: string;
    abstract name: string;
    abstract type: string;
    abstract capabilities: string[];

    async execute(message: any, session: Session, sessionId?: string): Promise<any> {
        const idToStream = sessionId || session.id;

        streamingManager.streamThinking(idToStream, `${this.name} is planning how to handle your request...`);

        const context = await this.extractRelevantContext(message, session);

        streamingManager.streamThinking(idToStream, `${this.name} is executing...`);

        const result = await this.run(message, context, idToStream);

        streamingManager.streamThinking(idToStream, `${this.name} finished processing.`);

        return result;
    }

    protected abstract run(message: any, context: any, sessionId: string): Promise<any>;

    protected async extractRelevantContext(message: any, session: Session): Promise<any> {
        return session ? session.context : new Map();
    }
}
