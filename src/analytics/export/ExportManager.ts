export class ExportManager {
  private static instance: ExportManager;

  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager();
    }
    return ExportManager.instance;
  }

  async exportToJSON(): Promise<string> {
    return JSON.stringify({});
  }
}

export const exportManager = ExportManager.getInstance();
