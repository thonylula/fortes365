import crypto from "node:crypto";

export const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
];

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const AGGREGATE_URL =
  "https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate";

export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
};

export type DailyMetric = {
  date: string; // YYYY-MM-DD
  steps: number | null;
  active_kcal: number | null;
  resting_hr: number | null;
};

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var ${key}`);
  return v;
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
    redirect_uri: env("GOOGLE_OAUTH_REDIRECT_URI"),
    response_type: "code",
    scope: GOOGLE_FIT_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function signState(userId: string): string {
  const nonce = crypto.randomBytes(8).toString("hex");
  const secret = env("OAUTH_STATE_SECRET");
  const payload = `${userId}.${nonce}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyState(state: string): string | null {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [userId, nonce, sig] = parts;
  const secret = env("OAUTH_STATE_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${userId}.${nonce}`)
    .digest("hex");
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  return userId;
}

export async function exchangeCodeForTokens(code: string): Promise<Tokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
      redirect_uri: env("GOOGLE_OAUTH_REDIRECT_URI"),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Tokens;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<Omit<Tokens, "refresh_token">> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Omit<Tokens, "refresh_token">;
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
    method: "POST",
  });
}

type AggregateResponse = {
  bucket: Array<{
    startTimeMillis: string;
    endTimeMillis: string;
    dataset: Array<{
      dataSourceId: string;
      point: Array<{
        dataTypeName: string;
        value: Array<{ intVal?: number; fpVal?: number }>;
      }>;
    }>;
  }>;
};

export async function fetchDailyAggregates(
  accessToken: string,
  startMs: number,
  endMs: number,
): Promise<DailyMetric[]> {
  const body = {
    aggregateBy: [
      { dataTypeName: "com.google.step_count.delta" },
      { dataTypeName: "com.google.calories.expended" },
      { dataTypeName: "com.google.heart_rate.bpm" },
    ],
    bucketByTime: { durationMillis: 86_400_000 },
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  };
  const res = await fetch(AGGREGATE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Aggregate failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as AggregateResponse;

  return data.bucket.map((bucket) => {
    const start = new Date(Number(bucket.startTimeMillis));
    const date = start.toISOString().slice(0, 10);
    let steps: number | null = null;
    let activeKcal: number | null = null;
    let restingHr: number | null = null;

    for (const dataset of bucket.dataset) {
      const point = dataset.point[0];
      if (!point) continue;
      if (point.dataTypeName === "com.google.step_count.delta") {
        steps = point.value[0]?.intVal ?? null;
      } else if (point.dataTypeName === "com.google.calories.expended") {
        const kcal = point.value[0]?.fpVal;
        activeKcal = kcal != null ? Math.round(kcal) : null;
      } else if (point.dataTypeName === "com.google.heart_rate.bpm") {
        const bpm = point.value[0]?.fpVal;
        restingHr = bpm != null ? Math.round(bpm) : null;
      }
    }

    return { date, steps, active_kcal: activeKcal, resting_hr: restingHr };
  });
}
