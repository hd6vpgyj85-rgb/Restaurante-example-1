import { CONFIG } from './config.js';
import { supabaseClient } from './supabase.js';

const currentYear = new Date().getFullYear();
document.querySelectorAll('#year, .menu-footer-year').forEach((el) => {
  el.textContent = currentYear;
});

const CATEGORIES = ['Entradas', 'Filetes', 'Mariscos', 'Bebidas', 'Postres'];

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
  if (!track || !supabaseClient) {
    if (track) track.parentElement.classList.add('hidden');
    return;
  }

  try {
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

    startGalleryAutoScroll(track.parentElement, track);
  } catch (err) {
    track.parentElement.classList.add('hidden');
  }
}

function startGalleryAutoScroll(wrapper, track) {
  const SPEED = 0.5;
  let paused = false;
  let resumeTimer;

  const step = () => {
    if (!paused) {
      const halfWidth = track.scrollWidth / 2;
      wrapper.scrollLeft += SPEED;
      if (wrapper.scrollLeft >= halfWidth) {
        wrapper.scrollLeft -= halfWidth;
      }
    }
    requestAnimationFrame(step);
  };

  const pause = () => {
    paused = true;
    clearTimeout(resumeTimer);
  };

  const scheduleResume = () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      paused = false;
    }, 2500);
  };

  wrapper.addEventListener('touchstart', pause, { passive: true });
  wrapper.addEventListener('touchend', scheduleResume);
  wrapper.addEventListener('wheel', () => {
    pause();
    scheduleResume();
  }, { passive: true });

  // Arrastrar con el mouse para desplazar manualmente en escritorio
  // (el touch nativo ya funciona en móvil gracias a overflow-x: auto).
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;

  wrapper.addEventListener('dragstart', (e) => e.preventDefault());

  wrapper.addEventListener('mousedown', (e) => {
    isDragging = true;
    pause();
    dragStartX = e.pageX;
    dragStartScrollLeft = wrapper.scrollLeft;
    wrapper.classList.add('dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    wrapper.scrollLeft = dragStartScrollLeft - (e.pageX - dragStartX);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    wrapper.classList.remove('dragging');
    scheduleResume();
  });

  requestAnimationFrame(step);
}

async function loadPromociones() {
  const grid = document.getElementById('promo-grid');
  if (!grid) return;

  if (!supabaseClient) {
    grid.innerHTML = '<p class="empty-state">No hay promociones activas por el momento.</p>';
    return;
  }

  try {
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
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">No hay promociones activas por el momento.</p>';
  }
}

const menuState = {
  items: [],
  lang: 'es',
  currency: 'MXN',
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
  const ctaReserveBtn = document.getElementById('menu-cta-reserve');
  const footerLinks = overlay.querySelectorAll('.menu-footer-link');

  const openMenu = async () => {
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (menuState.items.length === 0) {
      await loadMenuItems();
    }
    renderMenuItems();
  };

  const closeMenu = () => {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openBtns.forEach((btn) => {
    btn.addEventListener('click', openMenu);
  });

  closeBtn.addEventListener('click', closeMenu);

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

  ctaReserveBtn.addEventListener('click', () => {
    closeMenu();
    document.getElementById('reservar').scrollIntoView({ behavior: 'smooth' });
  });

  footerLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

async function loadMenuItems() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('menu_items').select('*');
    if (!error && data) {
      menuState.items = data;
    }
  } catch (err) {
    // El menú se mostrará vacío; renderMenuItems ya maneja la lista vacía.
  }
}

function renderMenuItems() {
  const grid = document.getElementById('menu-items-grid');
  if (!grid) return;

  if (menuState.items.length === 0) {
    grid.innerHTML = '<p class="empty-state">El menú no está disponible por el momento.</p>';
    return;
  }

  const blocks = CATEGORIES.map((category) => {
    const items = menuState.items.filter((item) => item.categoria === category);
    if (items.length === 0) return '';

    const rows = items
      .map((item) => {
        const nombre = menuState.lang === 'es' ? item.nombre_es : item.nombre_en;
        const precio = formatPrice(item.precio_mxn, menuState.currency);
        return `
          <a class="menu-list-item" href="menu-item.html?id=${item.id}">
            <div class="menu-list-item-row">
              <h4>${escapeHtml(nombre)}</h4>
              <span class="menu-list-item-price">${precio}</span>
            </div>
            ${item.descripcion ? `<p class="menu-list-item-desc">${escapeHtml(item.descripcion)}</p>` : ''}
          </a>
        `;
      })
      .join('');

    return `
      <div class="menu-category-block">
        <h3 class="menu-category-title">${category}</h3>
        ${rows}
      </div>
    `;
  }).join('');

  grid.innerHTML = blocks || '<p class="empty-state">El menú no está disponible por el momento.</p>';
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

  if (!id || !supabaseClient) {
    container.innerHTML = '<p class="empty-state">Platillo no encontrado.</p>';
    return;
  }

  let data;
  try {
    const result = await supabaseClient
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (result.error || !result.data) {
      container.innerHTML = '<p class="empty-state">Platillo no encontrado.</p>';
      return;
    }
    data = result.data;
  } catch (err) {
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
