// ─── WCA Hub — API Client ─────────────────────────────────────────
// Llama a los Vercel API routes con el token de Supabase automáticamente.

import { supabase } from './supabase.js';

const BASE = '/api';

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

async function request(method, path, body) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || `Error ${res.status}`);
  return data.data;
}

// ─── Auth ─────────────────────────────────────────────────────────
export const api = {
  auth: {
    invite: (body) => request('POST', '/auth/invite', body),
    setRole: (userId, role) => request('PATCH', '/auth/role', { userId, role }),
  },

  enrollments: {
    create:  (body)   => request('POST',  '/enrollments/create',  body),
    suspend: (enrollmentId, reason) => request('PATCH', '/enrollments/suspend', { enrollmentId, action: 'suspend', reason }),
    reactivate: (enrollmentId) => request('PATCH', '/enrollments/suspend', { enrollmentId, action: 'reactivate' }),
  },

  payments: {
    record:  (body) => request('POST',  '/payments/record',  body),
    confirm: (paymentId) => request('PATCH', '/payments/confirm', { paymentId, action: 'confirm' }),
    reject:  (paymentId, reason) => request('PATCH', '/payments/confirm', { paymentId, action: 'reject', reason }),
  },

  emails: {
    welcome:   ()    => request('POST', '/emails/welcome', {}),
    reminders: (body) => request('POST', '/emails/reminders', body),
  },

  admin: {
    stats: () => request('GET', '/admin/stats'),
  },
};
