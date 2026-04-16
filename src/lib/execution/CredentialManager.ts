import prisma from '../prisma';

export class CredentialManager {
  /**
   * Mock Encryption for Build Stability
   */
  private encrypt(data: any): string {
    return JSON.stringify(data);
  }
  
  /**
   * Mock Decryption
   */
  private decrypt(encryptedData: string): any {
    try {
      return JSON.parse(encryptedData);
    } catch {
      return {};
    }
  }
  
  /**
   * Save credentials to Postgres
   */
  async saveCredential(
    userId: string,
    name: string,
    type: string,
    data: any
  ): Promise<string> {
    const encrypted = this.encrypt(data);
    
    const credential = await prisma.credential.create({
      data: {
        userId,
        name,
        type,
        data: encrypted
      }
    });
    
    return credential.id;
  }
  
  /**
   * Get credentials by ID (safeguarded by userId)
   */
  async getCredential(
    credentialId: string,
    userId: string
  ): Promise<any> {
    const credential = await prisma.credential.findFirst({
      where: {
        id: credentialId,
        userId
      }
    });
    
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found or unauthorized`);
    }
    
    return this.decrypt(credential.data as string);
  }
  
  /**
   * Get all credentials of a specific type
   */
  async getCredentialsByType(
    userId: string,
    type: string
  ): Promise<Array<{ id: string; name: string; data: any }>> {
    const credentials = await prisma.credential.findMany({
      where: {
        userId,
        type
      }
    });
    
    return credentials.map((cred: any) => ({
      id: cred.id,
      name: cred.name,
      data: this.decrypt(cred.data as string)
    }));
  }
  
  /**
   * Delete credential
   */
  async deleteCredential(credentialId: string, userId: string): Promise<void> {
    await prisma.credential.deleteMany({
      where: {
        id: credentialId,
        userId
      }
    });
  }
}
