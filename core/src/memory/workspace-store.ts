export interface CoworkArtifact {
    id: string;
    type: 'document' | 'email_draft' | 'code' | 'dossier';
    title: string;
    content: string;
    status: 'drafting' | 'validation_pending' | 'approved' | 'rejected';
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export class WorkspaceStore {
    // SessionID -> ArtifactID -> CoworkArtifact
    private workspaces: Map<string, Map<string, CoworkArtifact>>;

    constructor() {
        this.workspaces = new Map();
    }

    /**
     * Retrieves all artifacts for a given session.
     */
    getWorkspace(sessionId: string): CoworkArtifact[] {
        const workspace = this.workspaces.get(sessionId);
        if (!workspace) return [];
        return Array.from(workspace.values());
    }

    /**
     * Creates a new artifact and mounts it in the session's workspace.
     */
    createArtifact(
        sessionId: string, 
        type: CoworkArtifact['type'], 
        title: string, 
        initialContent: string = '', 
        metadata: Record<string, any> = {}
    ): CoworkArtifact {
        let workspace = this.workspaces.get(sessionId);
        if (!workspace) {
            workspace = new Map();
            this.workspaces.set(sessionId, workspace);
        }

        const artifact: CoworkArtifact = {
            id: `art_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type,
            title,
            content: initialContent,
            status: 'drafting',
            metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        workspace.set(artifact.id, artifact);
        return artifact;
    }

    /**
     * Updates an existing artifact's content or status.
     */
    updateArtifact(
        sessionId: string, 
        artifactId: string, 
        updates: Partial<Pick<CoworkArtifact, 'content' | 'status' | 'metadata'>>
    ): CoworkArtifact | null {
        const workspace = this.workspaces.get(sessionId);
        if (!workspace) return null;

        const artifact = workspace.get(artifactId);
        if (!artifact) return null;

        Object.assign(artifact, {
            ...updates,
            updatedAt: new Date()
        });

        // Deep merge metadata if it exists
        if (updates.metadata && artifact.metadata) {
            artifact.metadata = { ...artifact.metadata, ...updates.metadata };
        } else if (updates.metadata) {
            artifact.metadata = updates.metadata;
        }

        return artifact;
    }

    /**
     * Retrieves a specific artifact.
     */
    getArtifact(sessionId: string, artifactId: string): CoworkArtifact | null {
        const workspace = this.workspaces.get(sessionId);
        return workspace?.get(artifactId) || null;
    }

    /**
     * Formats the entire workspace into a string representation injected into the LLM context.
     * This is critical for the "Claude Cowork" paradigm, where the agent sees the living document.
     */
    formatWorkspaceForPrompt(sessionId: string): string {
        const artifacts = this.getWorkspace(sessionId);
        if (artifacts.length === 0) return "WORKSPACE IS CURRENTLY EMPTY.";

        let output = "=== ACTIVE WORKSPACE ARTIFACTS ===\n\n";
        for (const art of artifacts) {
            output += `[Artifact: ${art.title}] (ID: ${art.id}) | Type: ${art.type} | Status: ${art.status}\n`;
            output += `Last Updated: ${art.updatedAt.toISOString()}\n`;
            output += `--- CONTENT START ---\n${art.content || '(empty)'}\n--- CONTENT END ---\n\n`;
        }
        return output;
    }
}

// Singleton instance for global backend usage
export const workspaceStore = new WorkspaceStore();
