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
        // Fallback: broadcast in-app event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mpr:inapp-notification', { detail: payload }));
        }
        return false;
      }
      const json = await res.json();
      console.log('send-push result', json);
      const success = typeof json?.sent === 'number' ? json.sent > 0 : true;
      if (!success && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mpr:inapp-notification', { detail: payload }));
      }
      return success;
    } catch (e) {
      console.error('send-push error', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mpr:inapp-notification', { detail: payload }));
      }
      return false;
    }
  }
}

export default PushApiService;

