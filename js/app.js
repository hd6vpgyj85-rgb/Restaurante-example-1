import { CONFIG } from './config.js';
import { supabaseClient } from './supabase.js';

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

initNav();
initReservationForm();
initMenuOverlay();
loadGallery();
loadPromociones();
loadMenuItemDetail();

function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const close = document.getElementById('nav-close');
  const links = document.getElementById('nav-links');

  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.add('open'));
  }
  if (close && links) {
    close.addEventListener('click', () => links.classList.remove('open'));
  }
  if (links) {
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }
}

function initReservationForm() {
  const form = document.getElementById('reservation-form');
  if (!form) return;

  const statusEl = document.getElementById('res-status');

  if (window.emailjs && CONFIG.EMAILJS_PUBLIC_KEY) {
    window.emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    const nombre = form.nombre.value.trim();
    const fecha = form.fecha.value;
    const hora = form.hora.value;
    const personas = parseInt(form.personas.value, 10);
    const telefono = form.telefono.value.trim();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const { error } = await supabaseClient.from('reservaciones').insert([
        {
          nombre_cliente: nombre,
          fecha,
          hora,
          personas,
          telefono,
        },
      ]);

      if (error) throw error;

      if (window.emailjs) {
        try {
          await window.emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
            nombre_cliente: nombre,
            fecha,
            hora,
            personas,
            telefono,
          });
        } catch (emailError) {
          // La reservación ya se guardó; el correo es un canal adicional.
        }
      }

      const whatsappMessage = `Hola, quiero reservar una mesa en Obsidiana.%0A` +
        `Nombre: ${nombre}%0A` +
        `Fecha: ${fecha}%0A` +
        `Hora: ${hora}%0A` +
        `Personas: ${personas}%0A` +
        `Teléfono: ${telefono}`;
      window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${whatsappMessage}`, '_blank');

      statusEl.textContent = 'Reservación enviada. ¡Te esperamos!';
      statusEl.classList.add('success');
      form.reset();
    } catch (err) {
      statusEl.textContent = 'No se pudo enviar la reservación. Intenta de nuevo.';
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function loadGallery() {
  const track = document.getElementById('gallery-track');
  if (!track) return;

  const { data, error } = await supabaseClient
    .from('galeria')
    .select('*')
    .order('orden', { ascending: true });

  if (error || !data || data.length === 0) {
    track.parentElement.classList.add('hidden');
    return;
  }

  const items = [...data, ...data];
  track.innerHTML = items
    .map((item) => `
      <div class="gallery-card">
        <img src="${item.imagen_url}" alt="Imagen de la galería de Obsidiana" loading="lazy">
      </div>
    `)
    .join('');
}

async function loadPromociones() {
  const grid = document.getElementById('promo-grid');
  if (!grid) return;

  const { data, error } = await supabaseClient
    .from('promociones')
    .select('*')
    .eq('activa', true)
    .order('creado_en', { ascending: false });

  if (error || !data || data.length === 0) {
    grid.innerHTML = '<p class="empty-state">No hay promociones activas por el momento.</p>';
    return;
  }

  grid.innerHTML = data
    .map((promo) => `
      <div class="promo-card">
        ${promo.imagen_url ? `<img src="${promo.imagen_url}" alt="${escapeHtml(promo.titulo)}" loading="lazy">` : ''}
        <div class="promo-card-body">
          <h3>${escapeHtml(promo.titulo)}</h3>
          <p>${escapeHtml(promo.descripcion || '')}</p>
        </div>
      </div>
    `)
    .join('');
}

const menuState = {
  items: [],
  lang: 'es',
  currency: 'MXN',
  category: 'Entradas',
};

function initMenuOverlay() {
  const overlay = document.getElementById('menu-overlay');
  if (!overlay) return;

  const openBtns = [
    document.getElementById('menu-open-btn'),
    document.getElementById('menu-open-btn-hero'),
  ].filter(Boolean);
  const closeBtn = document.getElementById('menu-close');
  const langToggle = document.getElementById('lang-toggle');
  const currencyToggle = document.getElementById('currency-toggle');
  const categoryButtons = document.querySelectorAll('.category-btn');

  openBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (menuState.items.length === 0) {
        await loadMenuItems();
      }
      renderMenuItems();
    });
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });

  langToggle.addEventListener('click', () => {
    menuState.lang = menuState.lang === 'es' ? 'en' : 'es';
    langToggle.textContent = menuState.lang === 'es' ? 'EN' : 'ES';
    langToggle.classList.toggle('active', menuState.lang === 'en');
    renderMenuItems();
  });

  currencyToggle.addEventListener('click', () => {
    menuState.currency = menuState.currency === 'MXN' ? 'USD' : 'MXN';
    currencyToggle.textContent = menuState.currency === 'MXN' ? 'USD' : 'MXN';
    currencyToggle.classList.toggle('active', menuState.currency === 'USD');
    renderMenuItems();
  });

  categoryButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      menuState.category = btn.dataset.category;
      renderMenuItems();
    });
  });
}

async function loadMenuItems() {
  const { data, error } = await supabaseClient.from('menu_items').select('*');
  if (!error && data) {
    menuState.items = data;
  }
}

function renderMenuItems() {
  const grid = document.getElementById('menu-items-grid');
  if (!grid) return;

  const filtered = menuState.items.filter((item) => item.categoria === menuState.category);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty-state">No hay platillos en esta categoría.</p>';
    return;
  }

  grid.innerHTML = filtered
    .map((item) => {
      const nombre = menuState.lang === 'es' ? item.nombre_es : item.nombre_en;
      const precio = formatPrice(item.precio_mxn, menuState.currency);
      return `
        <a class="menu-item-card" href="menu-item.html?id=${item.id}">
          ${item.imagen_url ? `<img src="${item.imagen_url}" alt="${escapeHtml(nombre)}" loading="lazy">` : ''}
          <div class="menu-item-card-body">
            <h4>${escapeHtml(nombre)}</h4>
            <p>${escapeHtml(item.descripcion || '')}</p>
            <span class="menu-item-price">${precio}</span>
          </div>
        </a>
      `;
    })
    .join('');
}

function formatPrice(priceMxn, currency) {
  if (currency === 'USD') {
    const usd = priceMxn / CONFIG.EXCHANGE_RATE_MXN_USD;
    return `$${usd.toFixed(2)} USD`;
  }
  return `$${Number(priceMxn).toFixed(2)} MXN`;
}

async function loadMenuItemDetail() {
  const container = document.getElementById('item-content');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    container.innerHTML = '<p class="empty-state">Platillo no encontrado.</p>';
    return;
  }

  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    container.innerHTML = '<p class="empty-state">Platillo no encontrado.</p>';
    return;
  }

  const usdPrice = (data.precio_mxn / CONFIG.EXCHANGE_RATE_MXN_USD).toFixed(2);

  document.title = `${data.nombre_es} — Obsidiana`;

  container.innerHTML = `
    ${data.imagen_url ? `<img src="${data.imagen_url}" alt="${escapeHtml(data.nombre_es)}">` : ''}
    <h1>${escapeHtml(data.nombre_es)}</h1>
    <p class="item-name-en">${escapeHtml(data.nombre_en || '')}</p>
    <p class="item-prices">$${Number(data.precio_mxn).toFixed(2)} MXN &nbsp;/&nbsp; $${usdPrice} USD</p>
    <div class="item-block">
      <h3>Descripción</h3>
      <p>${escapeHtml(data.descripcion || '')}</p>
    </div>
    <div class="item-block">
      <h3>Ingredientes</h3>
      <p>${escapeHtml(data.ingredientes || '')}</p>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
