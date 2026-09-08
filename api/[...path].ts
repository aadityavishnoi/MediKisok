let appInstance: any = null;

export default async function handler(req: any, res: any) {
  if (!appInstance) {
    const { createApp } = await import('../apps/backend/src/app.js');
    appInstance = createApp();
  }
  return appInstance(req, res);
}
