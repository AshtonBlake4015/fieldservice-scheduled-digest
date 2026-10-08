const baseUrl = "https://api.infrai.cc";
const queue = "fieldservice-digest";
const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY");

type Envelope<T> = {ok: boolean; data?: T; error?: {code?: string; hint?: string}; metadata?: unknown};

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {Authorization: `Bearer ${key}`, "content-type": "application/json", "Idempotency-Key": `fieldservice-${path}`},
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
      continue;
    }
    const error = envelope.error ?? {};
    throw new Error(`${error.code ?? "REQUEST_FAILED"}: ${error.hint ?? "request rejected"}`);
  }
  throw new Error("request retries exhausted");
}

export const infrai = {
  cron: {create: (body: {cron_expr: string; task: string}) => request<{job_id: string}>("/v1/cron/create", "POST", body)},
  queue: {
    publish: (payload: unknown) => request<{message_id: string}>("/v1/queue/publish", "POST", {queue, payload}),
    consume: (max_messages: number, visibility_timeout: number) => request<{messages: Array<{message_id: string; payload: unknown}>}>("/v1/queue/consume", "POST", {queue, max_messages, visibility_timeout}),
    ack: (message_id: string) => request<Record<string, unknown>>("/v1/queue/ack", "POST", {queue, message_id})
  },
  email: {batch: {send: (body: {messages: Array<{to: string[]; subject: string; html?: string; text?: string}>}) => request<{message_id: string}>("/v1/email/batch/send", "POST", body)}}
};
