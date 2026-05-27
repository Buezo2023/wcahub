// ─── Reusable form validators ─────────────────────────────────────
// Single source of truth for input validation across the app.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email || typeof email !== "string") return "Email requerido";
  const trimmed = email.trim();
  if (trimmed.length === 0) return "Email requerido";
  if (trimmed.length > 254) return "Email demasiado largo";
  if (!EMAIL_RE.test(trimmed)) return "Email inválido";
  return null; // valid
}

// E.164-flexible: accepts +50499998888, 9999-8888, (504) 9999-8888, etc.
// Must contain 7+ digits when stripped of separators.
export function validatePhone(phone, { required = false } = {}) {
  if (!phone || phone.trim() === "") {
    return required ? "Teléfono requerido" : null;
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return "Teléfono demasiado corto";
  if (digits.length > 15) return "Teléfono demasiado largo";
  return null;
}

export function validateName(name) {
  if (!name || typeof name !== "string") return "Nombre requerido";
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Nombre demasiado corto";
  if (trimmed.length > 100) return "Nombre demasiado largo";
  // Block only obvious garbage — single chars, only numbers, etc.
  if (/^\d+$/.test(trimmed)) return "Ingresá un nombre real";
  return null;
}

export function validatePrice(price, { min = 0, max = 100000 } = {}) {
  const n = Number(price);
  if (Number.isNaN(n)) return "Precio inválido";
  if (n < min) return `Precio mínimo $${min}`;
  if (n > max) return `Precio máximo $${max}`;
  return null;
}

// Validate multiple fields at once — returns { field: error } or null if all valid
export function validateFields(fields) {
  const errors = {};
  for (const [key, [value, validator]] of Object.entries(fields)) {
    const err = validator(value);
    if (err) errors[key] = err;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
