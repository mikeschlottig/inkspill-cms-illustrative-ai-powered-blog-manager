import type { SessionInfo, PostStatus } from '../../worker/types';
export async function getPosts(): Promise<SessionInfo[]> {
  const response = await fetch('/api/sessions');
  const result = await response.json();
  return result.success ? result.data : [];
}
export async function createPost(title?: string): Promise<SessionInfo | null> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, status: 'draft', tags: [] }),
  });
  const result = await response.json();
  return result.success ? result.data : null;
}
export async function updatePostMetadata(sessionId: string, metadata: Partial<SessionInfo>): Promise<boolean> {
  const response = await fetch(`/api/sessions/${sessionId}/metadata`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  const result = await response.json();
  return result.success;
}
export async function deletePost(sessionId: string): Promise<boolean> {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  return result.success;
}
export async function getPostContent(sessionId: string): Promise<{ title: string; content: string } | null> {
  const response = await fetch(`/api/chat/${sessionId}/document`);
  const result = await response.json();
  return result.success ? result.data : null;
}
export async function updatePostContent(sessionId: string, data: { title?: string; content?: string }): Promise<boolean> {
  const response = await fetch(`/api/chat/${sessionId}/document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  return result.success;
}