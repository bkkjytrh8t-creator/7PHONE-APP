import 'server-only';

import crypto from 'crypto';
import {cookies} from 'next/headers';

const sessionCookieName = 'sevenphone_admin_session';
const defaultEmail = 'admin@7phone.app';
const defaultPasswordSalt = '7phone-admin-2026-temp';
const defaultPasswordHash = 'b264302818905ff7ca8cef450ae25ec9c3467884bfe562b2fd47a645f218deae';
const defaultSessionSecret = 'temporary-7phone-admin-session-secret-change-in-vercel';
const sessionMaxAgeSeconds = 60 * 60 * 8;

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || defaultEmail;
}

function getPasswordSalt() {
  return process.env.ADMIN_PASSWORD_SALT || defaultPasswordSalt;
}

function getPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || defaultPasswordHash;
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || defaultSessionSecret;
}

function hashPassword(password: string) {
  return crypto.pbkdf2Sync(password, getPasswordSalt(), 310000, 32, 'sha256').toString('hex');
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex');
}

export function validateAdminCredentials(email: string, password: string) {
  const isEmailValid = email.trim().toLowerCase() === getAdminEmail().toLowerCase();
  const isPasswordValid = safeCompare(hashPassword(password.trim()), getPasswordHash());

  return isEmailValid && isPasswordValid;
}

export function createAdminSessionValue() {
  const payload = JSON.stringify({
    email: getAdminEmail(),
    exp: Date.now() + sessionMaxAgeSeconds * 1000
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function isAdminSessionValid(sessionValue?: string) {
  if (!sessionValue) {
    return false;
  }

  const [encodedPayload, signature] = sessionValue.split('.');

  if (!encodedPayload || !signature || signature !== sign(encodedPayload)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      email?: string;
      exp?: number;
    };

    return payload.email === getAdminEmail() && Number(payload.exp) > Date.now();
  } catch {
    return false;
  }
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return isAdminSessionValid(cookieStore.get(sessionCookieName)?.value);
}

export async function setAdminSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, createAdminSessionValue(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAgeSeconds
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export function getAdminAuthStatus() {
  return {
    email: getAdminEmail(),
    temporary: !process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_SESSION_SECRET
  };
}
