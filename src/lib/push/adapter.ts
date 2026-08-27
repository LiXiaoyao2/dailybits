import { randomUUID } from "node:crypto";
import type { DigestPushPayload, KnowledgePushPayload, PushPayload } from "../../types";

type AnyPushPayload = PushPayload | DigestPushPayload | KnowledgePushPayload;
type PushProvider = "generic" | "card-service" | "messaging";
type MessagingCardContent = string | string[] | Record<string, string>;

type CardServiceQaRequest = {
  receiver: string;
  authorId: string;
  domain: string;
  question: string;
  answer: "a" | "b" | "c" | "d";
  choices: Record<"a" | "b" | "c" | "d", string>;
  analysis: string;
  scene?: string;
  source_system: string;
  business_id?: string;
  answerCallbackUrl?: string;
  answerCallbackSecret?: string;
  answerCallbackSecretHeader?: string;
};

type MessagingCardRequest = {
  recipient: string;
  content: MessagingCardContent;
};

type MessagingCardResponse = {
  messageId?: string;
  status?: string;
  recipient?: string;
  recipientType?: string;
  cardType?: string;
  sentAt?: string;
};

type MessagingError = {
  code?: string;
  message?: string;
  requestId?: string;
};

const ANSWERS = ["a", "b", "c", "d"] as const;
const DEFAULT_MESSAGING_MOCK_BASE_URL = "http://127.0.0.1:4010";
const DEFAULT_MESSAGING_CARD_PATH = "/messaging/v1/cards/send";
const DEFAULT_MESSAGING_TIMEOUT_MS = 15000;
const DEFAULT_MESSAGING_RETRY_ATTEMPTS = 3;
const DEFAULT_MESSAGING_RETRY_BASE_MS = 1000;
const DEFAULT_MESSAGING_MAX_RETRY_DELAY_MS = 30000;
const MAX_MESSAGING_PAGES = 20;
const MAX_MESSAGING_PAGE_CHARS = 20000;
const MAX_MESSAGING_TOTAL_CHARS = 100000;

function pushProvider(): PushProvider {
  const configured = process.env.PUSH_PROVIDER?.trim().toLowerCase();
  if (configured === "card-service") return "card-service";
  if (configured === "messaging" || configured === "inner-messaging") return "messaging";
  if (configured === "generic") return "generic";
  return process.env.CARD_SERVICE_API_BASE?.trim() ? "card-service" : "generic";
}

function isQuestionPayload(payload: AnyPushPayload): payload is PushPayload {
  return "question" in payload && "correctAnswer" in payload;
}

function isDigestPayload(payload: AnyPushPayload): payload is DigestPushPayload {
  return "digestType" in payload && "digestDate" in payload;
}

function isKnowledgePayload(payload: AnyPushPayload): payload is KnowledgePushPayload {
  return "knowledgeBankId" in payload && "knowledgePointId" in payload;
}

function normalizeAnswer(value: string): CardServiceQaRequest["answer"] | null {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^[a-d](?=$|[\s.、:：）\)])/);
  if (!match) return null;
  return match[0] as CardServiceQaRequest["answer"];
}

function normalizeChoices(options: unknown): CardServiceQaRequest["choices"] | null {
  let values: string[] = [];
  if (Array.isArray(options)) {
    values = options.map((item) => (typeof item === "string" ? item.trim() : ""));
  } else if (options && typeof options === "object") {
    const record = options as Record<string, unknown>;
    values = ANSWERS.map((key) => {
      const value = record[key] ?? record[key.toUpperCase()];
      return typeof value === "string" ? value.trim() : "";
    });
  }

  if (values.length !== 4 || values.some((item) => !item)) return null;
  return {
    a: values[0],
    b: values[1],
    c: values[2],
    d: values[3],
  };
}

function buildCardServiceQaPayload(
  payload: PushPayload,
): CardServiceQaRequest | null {
  const answer = normalizeAnswer(payload.correctAnswer);
  const choices = normalizeChoices(payload.options);
  if (!answer || !choices) return null;

  return {
    receiver: payload.receiver,
    authorId: payload.authorId ?? payload.receiver,
    domain: payload.domain ?? payload.title,
    question: payload.question,
    answer,
    choices,
    analysis: payload.explanation,
    scene: payload.scene ?? payload.title,
    source_system: "dailybits",
    business_id: payload.businessId,
    ...(process.env.CARD_SERVICE_QA_ANSWER_CALLBACK_URL?.trim()
      ? {
          answerCallbackUrl: process.env.CARD_SERVICE_QA_ANSWER_CALLBACK_URL.trim(),
          answerCallbackSecret: process.env.CARD_SERVICE_EVENT_SECRET?.trim(),
          answerCallbackSecretHeader:
            process.env.CARD_SERVICE_EVENT_SECRET_HEADER?.trim() ||
            "X-Card-Event-Secret",
        }
      : {}),
  };
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function positiveIntegerEnv(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function messagingApiBaseUrl(allowDevDefault: boolean): string | null {
  const configured =
    process.env.MESSAGING_API_BASE_URL?.trim() ||
    process.env.INNER_API_BASE_URL?.trim();
  if (configured) return trimTrailingSlash(configured);
  if (allowDevDefault && process.env.NODE_ENV !== "production") {
    return DEFAULT_MESSAGING_MOCK_BASE_URL;
  }
  return null;
}

function messagingSendUrl(allowDevDefault: boolean): string | null {
  const base = messagingApiBaseUrl(allowDevDefault);
  if (!base) return null;
  const path = process.env.MESSAGING_CARD_SEND_PATH?.trim() || DEFAULT_MESSAGING_CARD_PATH;
  return new URL(path, `${base}/`).toString();
}

function truncateMarkdown(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function normalizeMessagingPages(pages: string[]): string[] {
  const normalized: string[] = [];
  let totalChars = 0;

  for (const rawPage of pages.slice(0, MAX_MESSAGING_PAGES)) {
    const trimmed = rawPage.trim();
    if (!trimmed) continue;
    const remaining = MAX_MESSAGING_TOTAL_CHARS - totalChars;
    if (remaining <= 0) break;
    const page = truncateMarkdown(
      trimmed,
      Math.min(MAX_MESSAGING_PAGE_CHARS, remaining),
    );
    if (!page) continue;
    normalized.push(page);
    totalChars += page.length;
  }

  return normalized;
}

function formatMessagingPage(input: {
  title: string;
  body: string;
  footer?: string;
}): string {
  return [
    `## ${input.title}`,
    "",
    input.body.trim(),
    input.footer ? "" : undefined,
    input.footer,
  ]
    .filter((part): part is string => part !== undefined)
    .join("\n");
}

function buildDigestMessagingContent(payload: DigestPushPayload): string[] {
  const pages = normalizeMessagingPages(payload.items);
  const total = pages.length;
  return normalizeMessagingPages(
    pages.map((page, index) =>
      formatMessagingPage({
        title: payload.title,
        body: page,
        footer: `${payload.digestDate} · ${index + 1}/${total}`,
      }),
    ),
  );
}

function buildQuestionMessagingContent(payload: PushPayload): string {
  const options = payload.options
    .map((option, index) => {
      const label = ANSWERS[index]?.toUpperCase();
      return label ? `${label}. ${option}` : undefined;
    })
    .filter((item): item is string => !!item)
    .join("\n");

  return truncateMarkdown(
    formatMessagingPage({
      title: payload.title,
      body: [
        payload.question,
        "",
        options,
        "",
        `答案：${payload.correctAnswer}`,
        payload.explanation ? `解析：${payload.explanation}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    }),
    MAX_MESSAGING_PAGE_CHARS,
  );
}

function buildMessagingCardRequest(payload: AnyPushPayload): MessagingCardRequest | null {
  if (isDigestPayload(payload)) {
    const content = buildDigestMessagingContent(payload);
    if (content.length === 0) return null;
    return { recipient: payload.receiver, content };
  }

  if (isKnowledgePayload(payload)) {
    const page = normalizeMessagingPages([
      formatMessagingPage({
        title: payload.title,
        body: payload.items.join("\n\n"),
      }),
    ])[0];
    return page ? { recipient: payload.receiver, content: page } : null;
  }

  if (isQuestionPayload(payload)) {
    return {
      recipient: payload.receiver,
      content: buildQuestionMessagingContent(payload),
    };
  }

  return null;
}

function messagingIdempotencyKey(payload: AnyPushPayload): string {
  const configured = payload.idempotencyKey?.trim();
  return configured ? configured.slice(0, 128) : randomUUID();
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }
  return undefined;
}

function shouldRetryMessagingStatus(status: number): boolean {
  return status === 429 || status === 503;
}

function messagingRetryDelayMs(response: Response | null, attemptIndex: number): number {
  const maxDelay = positiveIntegerEnv(
    "MESSAGING_MAX_RETRY_DELAY_MS",
    DEFAULT_MESSAGING_MAX_RETRY_DELAY_MS,
  );
  const retryAfter = parseRetryAfterMs(response?.headers.get("Retry-After") ?? null);
  if (retryAfter !== undefined) return Math.min(retryAfter, maxDelay);

  const base = positiveIntegerEnv(
    "MESSAGING_RETRY_BASE_MS",
    DEFAULT_MESSAGING_RETRY_BASE_MS,
  );
  return Math.min(base * 2 ** attemptIndex, maxDelay);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readMessagingError(response: Response): Promise<MessagingError> {
  const headerRequestId = response.headers.get("X-Request-Id") ?? undefined;
  try {
    const data = (await response.json()) as { error?: MessagingError };
    return {
      code: data.error?.code,
      requestId: data.error?.requestId ?? headerRequestId,
    };
  } catch {
    return { requestId: headerRequestId };
  }
}

function logMessagingFailure(
  response: Response,
  error: MessagingError,
): void {
  const details = [
    `HTTP ${response.status} ${response.statusText}`,
    error.code ? `code=${error.code}` : undefined,
    error.requestId ? `requestId=${error.requestId}` : undefined,
  ].filter(Boolean);
  console.error(`[Push] messaging card failed: ${details.join(" ")}`);
}

function cardServiceSendUrl(): string | null {
  const base = process.env.CARD_SERVICE_API_BASE?.trim();
  if (!base) return null;
  const path = process.env.CARD_SERVICE_QA_PATH?.trim() || "/send/qa";
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}

async function pushGeneric(payload: AnyPushPayload): Promise<boolean> {
  const url = process.env.PUSH_API_URL;
  if (!url) {
    console.log("[PUSH MOCK]", JSON.stringify(payload, null, 2));
    return true;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.ok;
}

async function pushMessagingCard(
  payload: AnyPushPayload,
  allowDevDefault = false,
): Promise<boolean> {
  const url = messagingSendUrl(allowDevDefault);
  if (!url) {
    console.error("[Push] INNER_API_BASE_URL is required for Messaging card pushes");
    return false;
  }

  const request = buildMessagingCardRequest(payload);
  if (!request) {
    console.error("[Push] Cannot map payload to Messaging card shape");
    return false;
  }

  const apiKey = process.env.MESSAGING_INNER_API_KEY?.trim()
    || process.env.INNER_API_KEY?.trim();
  const apiKeyHeader = process.env.MESSAGING_INNER_API_KEY_HEADER?.trim()
    || process.env.INNER_API_KEY_HEADER?.trim()
    || "X-Inner-API-Key";
  const idempotencyKey = messagingIdempotencyKey(payload);
  const attempts = Math.min(
    positiveIntegerEnv("MESSAGING_RETRY_ATTEMPTS", DEFAULT_MESSAGING_RETRY_ATTEMPTS),
    5,
  );
  const timeoutMs = positiveIntegerEnv(
    "MESSAGING_TIMEOUT_MS",
    DEFAULT_MESSAGING_TIMEOUT_MS,
  );

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response: Response | null = null;
    try {
      response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
            ...(apiKey ? { [apiKeyHeader]: apiKey } : {}),
          },
          body: JSON.stringify(request),
        },
        timeoutMs,
      );

      if (response.status === 202) {
        const data = (await response.json().catch(() => null)) as MessagingCardResponse | null;
        if (data?.status === "accepted") return true;
        console.error("[Push] messaging card returned 202 without accepted status");
        return false;
      }

      const error = await readMessagingError(response);
      if (!shouldRetryMessagingStatus(response.status) || attempt === attempts - 1) {
        logMessagingFailure(response, error);
        return false;
      }
    } catch (error) {
      if (attempt === attempts - 1) {
        const message = error instanceof Error ? error.name : String(error);
        console.error(`[Push] messaging card failed after network retry: ${message}`);
        return false;
      }
    }

    await sleep(messagingRetryDelayMs(response, attempt));
  }

  return false;
}

async function pushCardServiceQa(payload: PushPayload): Promise<boolean> {
  const url = cardServiceSendUrl();
  if (!url) {
    console.error("[Push] CARD_SERVICE_API_BASE is required for card-service provider");
    return false;
  }

  const apiKey = process.env.CARD_SERVICE_SEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[Push] CARD_SERVICE_SEND_API_KEY is required for card-service provider");
    return false;
  }

  const request = buildCardServiceQaPayload(payload);
  if (!request) {
    console.error("[Push] Cannot map question payload to card-service QA shape");
    return false;
  }

  const keyHeader = process.env.CARD_SERVICE_SEND_API_KEY_HEADER?.trim()
    || "X-Card-Service-Key";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [keyHeader]: apiKey,
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      `[Push] card-service QA failed: HTTP ${response.status} ${response.statusText}` +
        (body ? ` ${body.slice(0, 300)}` : ""),
    );
  }
  return response.ok;
}

export async function pushToTarget(payload: AnyPushPayload): Promise<boolean> {
  const provider = pushProvider();
  if (provider === "generic") {
    return pushGeneric(payload);
  }

  if (provider === "messaging") {
    return pushMessagingCard(payload, true);
  }

  if (isQuestionPayload(payload)) return pushCardServiceQa(payload);
  return pushMessagingCard(payload, true);
}
