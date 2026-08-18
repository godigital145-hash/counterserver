import { sign, verify } from "hono/jwt";

const EXP_SECONDS = 30 * 24 * 60 * 60; // 30 jours

export async function signPatronToken(patronId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign({ sub: patronId, iat: now, exp: now + EXP_SECONDS }, secret);
}

export async function verifyPatronToken(token: string, secret: string): Promise<string> {
  const payload = await verify(token, secret, "HS256");
  return payload.sub as string;
}
