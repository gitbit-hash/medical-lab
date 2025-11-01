export class SyncService {
  static async triggerSync(): Promise<boolean> {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sync triggered successfully:', result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sync trigger failed:', error);
      return false;
    }
  }

  static async getSyncStatus() {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/sync`);

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }
}