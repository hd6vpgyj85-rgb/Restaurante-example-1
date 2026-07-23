// ============================================================
// CONFIGURACIÓN DEL SITIO — REEMPLAZA LOS VALORES PLACEHOLDER
// ============================================================
// Sustituye cada valor marcado con "REEMPLAZAR" por tus
// credenciales reales antes de usar el sitio en producción.

export const CONFIG = {
  // --- Supabase ---
  // Project Settings > API
  SUPABASE_URL: 'REEMPLAZAR_SUPABASE_URL', // ej: https://xxxxxxxx.supabase.co
  SUPABASE_ANON_KEY: 'REEMPLAZAR_SUPABASE_ANON_KEY',

  // --- EmailJS ---
  // https://dashboard.emailjs.com
  EMAILJS_SERVICE_ID: 'REEMPLAZAR_EMAILJS_SERVICE_ID',
  EMAILJS_TEMPLATE_ID: 'REEMPLAZAR_EMAILJS_TEMPLATE_ID',
  EMAILJS_PUBLIC_KEY: 'REEMPLAZAR_EMAILJS_PUBLIC_KEY',

  // --- Cloudinary ---
  // Necesitas un "unsigned upload preset" creado en tu cuenta de Cloudinary
  // (Settings > Upload > Upload presets > Add upload preset > Signing mode: Unsigned)
  CLOUDINARY_CLOUD_NAME: 'REEMPLAZAR_CLOUDINARY_CLOUD_NAME',
  CLOUDINARY_UPLOAD_PRESET: 'REEMPLAZAR_CLOUDINARY_UPLOAD_PRESET',

  // --- WhatsApp ---
  // Formato internacional, solo dígitos, sin "+" ni espacios (ej: 5215512345678)
  WHATSAPP_NUMBER: 'REEMPLAZAR_WHATSAPP_NUMBER',

  // --- Tipo de cambio fijo MXN -> USD ---
  EXCHANGE_RATE_MXN_USD: 16,
};
