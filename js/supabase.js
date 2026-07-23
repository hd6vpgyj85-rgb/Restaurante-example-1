import { CONFIG } from './config.js';

// Si el SDK de Supabase (CDN) no llegó a cargar (red lenta, bloqueador, etc.)
// evitamos que esto rompa el resto del sitio: el resto de app.js/admin.js
// sigue funcionando y cada función que use Supabase falla de forma aislada.
export const supabaseClient = window.supabase
  ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
  : null;
