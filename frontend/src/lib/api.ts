export function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchConversationsApi(token: string): Promise<any[]> {
  const res = await fetch('/conversations', { headers: authHeaders(token) })
  if (res.ok) return res.json()
  return []
}

export async function createConversationApi(token: string, title = 'New Consultation'): Promise<any | null> {
  const res = await fetch('/conversations', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  return res.ok ? res.json() : null
}

export async function deleteConversationApi(token: string, id: string): Promise<boolean> {
  const res = await fetch(`/conversations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return res.ok
}

export async function fetchMessagesApi(token: string, convId: string): Promise<any[]> {
  const res = await fetch(`/conversations/${convId}/messages`, { headers: authHeaders(token) })
  return res.ok ? res.json() : []
}

export async function sendChatMessageApi(
  token: string,
  convId: string,
  body: Record<string, unknown>
): Promise<any | null> {
  const res = await fetch(`/conversations/${convId}/chat`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok ? res.json() : null
}

export async function sendGuestChatApi(body: Record<string, unknown>): Promise<any | null> {
  const res = await fetch('/conversations/guest-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok ? res.json() : null
}

export async function rephraseApi(
  token: string, convId: string, messageId: string, level: string
): Promise<any | null> {
  const res = await fetch(`/conversations/${convId}/rephrase`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message_id: messageId, level }),
  })
  return res.ok ? res.json() : null
}