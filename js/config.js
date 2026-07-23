// ============================================================
// CONFIGURACIÓN DEL SITIO — REEMPLAZA LOS VALORES PLACEHOLDER
// ============================================================
// Sustituye cada valor marcado con "REEMPLAZAR" por tus
// credenciales reales antes de usar el sitio en producción.

export const CONFIG = {
  // --- Supabase ---
  // Project Settings > API
  SUPABASE_URL: 'https://wkxyjuccjhzoijuxgshh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreHlqdWNjamh6b2lqdXhnc2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MzczMTcsImV4cCI6MjEwMDQxMzMxN30.Pk7_M8NO3Vhdm455kBrOMBkwCokVC_ulh8DYFtl4xwk',

  // --- EmailJS ---
  // https://dashboard.emailjs.com
  EMAILJS_SERVICE_ID: 'REEMPLAZAR_EMAILJS_SERVICE_ID',
  EMAILJS_TEMPLATE_ID: 'REEMPLAZAR_EMAILJS_TEMPLATE_ID',
  EMAILJS_PUBLIC_KEY: 'REEMPLAZAR_EMAILJS_PUBLIC_KEY',

  // --- Cloudinary ---
  // Necesitas un "unsigned upload preset" creado en tu cuenta de Cloudinary
  // (Settings > Upload > Upload presets > Add upload preset > Signing mode: Unsigned)
  CLOUDINARY_CLOUD_NAME: 'xjf1e9zs',
  CLOUDINARY_UPLOAD_PRESET: 'restaurantexample1',

  // --- WhatsApp ---
  // Formato internacional, solo dígitos, sin "+" ni espacios (ej: 5215512345678)
  WHATSAPP_NUMBER: 'REEMPLAZAR_WHATSAPP_NUMBER',

  // --- Tipo de cambio fijo MXN -> USD ---
  EXCHANGE_RATE_MXN_USD: 16,
};
