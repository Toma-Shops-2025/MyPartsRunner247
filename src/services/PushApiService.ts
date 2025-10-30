export class PushApiService {
  static async sendToUsers(userIds: string[], payload: { title: string; body: string; data?: any }): Promise<boolean> {
    try {
      const res = await fetch('/.netlify/functions/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, ...payload })
      });
      if (!res.ok) {
        console.error('send-push failed', await res.text());
        return false;
      }
      const json = await res.json();
      console.log('send-push result', json);
      return true;
    } catch (e) {
      console.error('send-push error', e);
      return false;
    }
  }
}

export default PushApiService;

