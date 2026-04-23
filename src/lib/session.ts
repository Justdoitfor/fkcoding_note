export const SESSION_TTL = 60 * 60 * 24 * 7; // 7天

export async function createSession(kv: KVNamespace, userId: string) {
  const sessionId = crypto.randomUUID();
  await kv.put(`session:${sessionId}`, userId, { expirationTtl: SESSION_TTL });
  return sessionId;
}

export async function getSession(kv: KVNamespace, sessionId: string) {
  return kv.get(`session:${sessionId}`);
}

export async function deleteSession(kv: KVNamespace, sessionId: string) {
  await kv.delete(`session:${sessionId}`);
}
