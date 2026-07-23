import { CONFIG } from './config.js';
import { supabaseClient } from './supabase.js';

const CATEGORIES = ['Entradas', 'Filetes', 'Mariscos', 'Bebidas', 'Postres'];

const loginForm = document.getElementById('login-form');
const dashboard = document.getElementById('admin-dashboard');

if (loginForm) initLogin();
if (dashboard) initDashboard();

function initLogin() {
  const statusEl = document.getElementById('login-status');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;

    if (error) {
      statusEl.textContent = 'Correo o contraseña incorrectos.';
      statusEl.classList.add('error');
      return;
    }

    window.location.href = 'dashboard.html';
  });
}

async function initDashboard() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  supabaseClient.auth.onAuthStateChange((_event, newSession) => {
    if (!newSession) window.location.href = 'index.html';
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  });

  initSidebarNav();
  initMenuSection();
  initGaleriaSection();
  initPromocionesSection();
  initEmpleadosSection();
  initReservacionesSection();
}

function initSidebarNav() {
  const buttons = document.querySelectorAll('.admin-nav-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-section').forEach((s) => s.classList.add('hidden'));
      document.getElementById(`section-${btn.dataset.section}`).classList.remove('hidden');
    });
  });
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Error al subir la imagen');
  return data.secure_url;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function openModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-box').innerHTML = '';
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});

/* ================= MENÚ ================= */

function initMenuSection() {
  document.getElementById('add-menu-item-btn').addEventListener('click', () => openMenuItemModal());
  loadMenuItems();
}

async function loadMenuItems() {
  const list = document.getElementById('menu-items-list');
  const { data, error } = await supabaseClient.from('menu_items').select('*').order('categoria');

  if (error) {
    list.innerHTML = '<p class="empty-state">Error al cargar el menú.</p>';
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<p class="empty-state">No hay platillos todavía.</p>';
    return;
  }

  list.innerHTML = CATEGORIES.map((cat) => {
    const items = data.filter((i) => i.categoria === cat);
    if (items.length === 0) return '';
    return `
      <div class="admin-category-group">
        <h3>${cat}</h3>
        <div class="admin-card-grid">
          ${items.map((item) => `
            <div class="admin-card">
              ${item.imagen_url ? `<img src="${item.imagen_url}" alt="${escapeHtml(item.nombre_es)}">` : ''}
              <strong>${escapeHtml(item.nombre_es)}</strong> / ${escapeHtml(item.nombre_en)}
              <p>$${Number(item.precio_mxn).toFixed(2)} MXN</p>
              <div class="admin-card-actions">
                <button class="admin-action-btn edit" data-id="${item.id}">Editar</button>
                <button class="admin-action-btn delete" data-id="${item.id}">Eliminar</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.admin-action-btn.edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = data.find((i) => i.id === btn.dataset.id);
      openMenuItemModal(item);
    });
  });
  list.querySelectorAll('.admin-action-btn.delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este platillo?')) return;
      await supabaseClient.from('menu_items').delete().eq('id', btn.dataset.id);
      loadMenuItems();
    });
  });
}

function openMenuItemModal(item) {
  const isEdit = !!item;
  openModal(`
    <h3>${isEdit ? 'Editar' : 'Nuevo'} Platillo</h3>
    <form id="menu-item-form">
      <div class="form-group"><label>Nombre (ES)</label><input type="text" id="mi-nombre-es" required value="${item ? escapeHtml(item.nombre_es) : ''}"></div>
      <div class="form-group"><label>Nombre (EN)</label><input type="text" id="mi-nombre-en" required value="${item ? escapeHtml(item.nombre_en) : ''}"></div>
      <div class="form-group"><label>Descripción</label><input type="text" id="mi-descripcion" value="${item ? escapeHtml(item.descripcion) : ''}"></div>
      <div class="form-group"><label>Ingredientes</label><input type="text" id="mi-ingredientes" value="${item ? escapeHtml(item.ingredientes) : ''}"></div>
      <div class="form-group"><label>Precio (MXN)</label><input type="number" step="0.01" id="mi-precio" required value="${item ? item.precio_mxn : ''}"></div>
      <div class="form-group">
        <label>Categoría</label>
        <select id="mi-categoria" required>
          ${CATEGORIES.map((c) => `<option value="${c}" ${item && item.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Imagen</label>
        <input type="file" id="mi-imagen" accept="image/*">
        <span class="field-hint">Deja vacío para conservar la imagen actual.</span>
        ${item && item.imagen_url ? `<img src="${item.imagen_url}" class="thumb-preview">` : ''}
      </div>
      <p class="form-status" id="mi-status"></p>
      <div class="modal-actions">
        <button type="button" class="btn" id="mi-cancel">Cancelar</button>
        <button type="submit" class="btn btn-solid">Guardar</button>
      </div>
    </form>
  `);

  document.getElementById('mi-cancel').addEventListener('click', closeModal);
  document.getElementById('menu-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('mi-status');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    statusEl.textContent = 'Guardando…';
    statusEl.className = 'form-status';

    try {
      let imagenUrl = item ? item.imagen_url : null;
      const fileInput = document.getElementById('mi-imagen');
      if (fileInput.files[0]) {
        imagenUrl = await uploadToCloudinary(fileInput.files[0]);
      }

      const payload = {
        nombre_es: document.getElementById('mi-nombre-es').value.trim(),
        nombre_en: document.getElementById('mi-nombre-en').value.trim(),
        descripcion: document.getElementById('mi-descripcion').value.trim(),
        ingredientes: document.getElementById('mi-ingredientes').value.trim(),
        precio_mxn: parseFloat(document.getElementById('mi-precio').value),
        categoria: document.getElementById('mi-categoria').value,
        imagen_url: imagenUrl,
      };

      if (isEdit) {
        await supabaseClient.from('menu_items').update(payload).eq('id', item.id);
      } else {
        await supabaseClient.from('menu_items').insert([payload]);
      }

      closeModal();
      loadMenuItems();
    } catch (err) {
      statusEl.textContent = err.message || 'Error al guardar.';
      statusEl.classList.add('error');
      submitBtn.disabled = false;
    }
  });
}

/* ================= GALERÍA ================= */

function initGaleriaSection() {
  document.getElementById('add-galeria-btn').addEventListener('click', () => openGaleriaModal());
  loadGaleria();
}

async function loadGaleria() {
  const list = document.getElementById('galeria-list');
  const { data, error } = await supabaseClient.from('galeria').select('*').order('orden');

  if (error || !data || data.length === 0) {
    list.innerHTML = '<p class="empty-state">No hay imágenes todavía.</p>';
    return;
  }

  list.innerHTML = data.map((item) => `
    <div class="admin-card">
      <img src="${item.imagen_url}" alt="Imagen de galería">
      <p>Orden: ${item.orden ?? 0}</p>
      <div class="admin-card-actions">
        <button class="admin-action-btn delete" data-id="${item.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.admin-action-btn.delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta imagen?')) return;
      await supabaseClient.from('galeria').delete().eq('id', btn.dataset.id);
      loadGaleria();
    });
  });
}

function openGaleriaModal() {
  openModal(`
    <h3>Nueva Imagen de Galería</h3>
    <form id="galeria-form">
      <div class="form-group"><label>Imagen</label><input type="file" id="gal-imagen" accept="image/*" required></div>
      <div class="form-group"><label>Orden</label><input type="number" id="gal-orden" value="0"></div>
      <p class="form-status" id="gal-status"></p>
      <div class="modal-actions">
        <button type="button" class="btn" id="gal-cancel">Cancelar</button>
        <button type="submit" class="btn btn-solid">Guardar</button>
      </div>
    </form>
  `);

  document.getElementById('gal-cancel').addEventListener('click', closeModal);
  document.getElementById('galeria-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('gal-status');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    statusEl.textContent = 'Guardando…';
    statusEl.className = 'form-status';

    try {
      const file = document.getElementById('gal-imagen').files[0];
      const imagenUrl = await uploadToCloudinary(file);
      const orden = parseInt(document.getElementById('gal-orden').value, 10) || 0;
      await supabaseClient.from('galeria').insert([{ imagen_url: imagenUrl, orden }]);
      closeModal();
      loadGaleria();
    } catch (err) {
      statusEl.textContent = err.message || 'Error al guardar.';
      statusEl.classList.add('error');
      submitBtn.disabled = false;
    }
  });
}

/* ================= PROMOCIONES ================= */

function initPromocionesSection() {
  document.getElementById('add-promocion-btn').addEventListener('click', () => openPromocionModal());
  loadPromociones();
}

async function loadPromociones() {
  const list = document.getElementById('promociones-list');
  const { data, error } = await supabaseClient
    .from('promociones')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error || !data || data.length === 0) {
    list.innerHTML = '<p class="empty-state">No hay promociones todavía.</p>';
    return;
  }

  list.innerHTML = data.map((promo) => `
    <div class="admin-card">
      ${promo.imagen_url ? `<img src="${promo.imagen_url}" alt="${escapeHtml(promo.titulo)}">` : ''}
      <strong>${escapeHtml(promo.titulo)}</strong>
      <p>${escapeHtml(promo.descripcion || '')}</p>
      <p>${promo.activa ? 'Activa' : 'Inactiva'}</p>
      <div class="admin-card-actions">
        <button class="admin-action-btn edit" data-id="${promo.id}">Editar</button>
        <button class="admin-action-btn delete" data-id="${promo.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.admin-action-btn.edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const promo = data.find((p) => p.id === btn.dataset.id);
      openPromocionModal(promo);
    });
  });
  list.querySelectorAll('.admin-action-btn.delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta promoción?')) return;
      await supabaseClient.from('promociones').delete().eq('id', btn.dataset.id);
      loadPromociones();
    });
  });
}

function openPromocionModal(promo) {
  const isEdit = !!promo;
  openModal(`
    <h3>${isEdit ? 'Editar' : 'Nueva'} Promoción</h3>
    <form id="promo-form">
      <div class="form-group"><label>Título</label><input type="text" id="promo-titulo" required value="${promo ? escapeHtml(promo.titulo) : ''}"></div>
      <div class="form-group"><label>Descripción</label><input type="text" id="promo-descripcion" value="${promo ? escapeHtml(promo.descripcion) : ''}"></div>
      <div class="form-group">
        <label>Imagen</label>
        <input type="file" id="promo-imagen" accept="image/*">
        <span class="field-hint">Deja vacío para conservar la imagen actual.</span>
        ${promo && promo.imagen_url ? `<img src="${promo.imagen_url}" class="thumb-preview">` : ''}
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="promo-activa" ${!promo || promo.activa ? 'checked' : ''}> Activa</label>
      </div>
      <p class="form-status" id="promo-status"></p>
      <div class="modal-actions">
        <button type="button" class="btn" id="promo-cancel">Cancelar</button>
        <button type="submit" class="btn btn-solid">Guardar</button>
      </div>
    </form>
  `);

  document.getElementById('promo-cancel').addEventListener('click', closeModal);
  document.getElementById('promo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('promo-status');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    statusEl.textContent = 'Guardando…';
    statusEl.className = 'form-status';

    try {
      let imagenUrl = promo ? promo.imagen_url : null;
      const fileInput = document.getElementById('promo-imagen');
      if (fileInput.files[0]) {
        imagenUrl = await uploadToCloudinary(fileInput.files[0]);
      }

      const payload = {
        titulo: document.getElementById('promo-titulo').value.trim(),
        descripcion: document.getElementById('promo-descripcion').value.trim(),
        imagen_url: imagenUrl,
        activa: document.getElementById('promo-activa').checked,
      };

      if (isEdit) {
        await supabaseClient.from('promociones').update(payload).eq('id', promo.id);
      } else {
        await supabaseClient.from('promociones').insert([payload]);
      }

      closeModal();
      loadPromociones();
    } catch (err) {
      statusEl.textContent = err.message || 'Error al guardar.';
      statusEl.classList.add('error');
      submitBtn.disabled = false;
    }
  });
}

/* ================= EMPLEADOS ================= */

function initEmpleadosSection() {
  document.getElementById('add-empleado-btn').addEventListener('click', () => openEmpleadoModal());
  loadEmpleados();
}

async function loadEmpleados() {
  const list = document.getElementById('empleados-list');
  const { data, error } = await supabaseClient.from('empleados').select('*').order('nombre');

  if (error || !data || data.length === 0) {
    list.innerHTML = '<tr><td colspan="5" class="empty-state">No hay empleados todavía.</td></tr>';
    return;
  }

  list.innerHTML = data.map((emp) => `
    <tr>
      <td>${escapeHtml(emp.nombre)}</td>
      <td>${escapeHtml(emp.puesto)}</td>
      <td>${escapeHtml(emp.horario || '')}</td>
      <td>$${Number(emp.paga_mensual || 0).toFixed(2)}</td>
      <td>
        <button class="admin-action-btn edit" data-id="${emp.id}">Editar</button>
        <button class="admin-action-btn delete" data-id="${emp.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');

  list.querySelectorAll('.admin-action-btn.edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const emp = data.find((e) => e.id === btn.dataset.id);
      openEmpleadoModal(emp);
    });
  });
  list.querySelectorAll('.admin-action-btn.delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este empleado?')) return;
      await supabaseClient.from('empleados').delete().eq('id', btn.dataset.id);
      loadEmpleados();
    });
  });
}

function openEmpleadoModal(emp) {
  const isEdit = !!emp;
  openModal(`
    <h3>${isEdit ? 'Editar' : 'Nuevo'} Empleado</h3>
    <form id="empleado-form">
      <div class="form-group"><label>Nombre</label><input type="text" id="emp-nombre" required value="${emp ? escapeHtml(emp.nombre) : ''}"></div>
      <div class="form-group"><label>Puesto</label><input type="text" id="emp-puesto" required value="${emp ? escapeHtml(emp.puesto) : ''}"></div>
      <div class="form-group"><label>Horario</label><input type="text" id="emp-horario" value="${emp ? escapeHtml(emp.horario) : ''}"></div>
      <div class="form-group"><label>Paga mensual</label><input type="number" step="0.01" id="emp-paga" value="${emp ? emp.paga_mensual : ''}"></div>
      <p class="form-status" id="emp-status"></p>
      <div class="modal-actions">
        <button type="button" class="btn" id="emp-cancel">Cancelar</button>
        <button type="submit" class="btn btn-solid">Guardar</button>
      </div>
    </form>
  `);

  document.getElementById('emp-cancel').addEventListener('click', closeModal);
  document.getElementById('empleado-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('emp-status');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    statusEl.textContent = 'Guardando…';
    statusEl.className = 'form-status';

    try {
      const payload = {
        nombre: document.getElementById('emp-nombre').value.trim(),
        puesto: document.getElementById('emp-puesto').value.trim(),
        horario: document.getElementById('emp-horario').value.trim(),
        paga_mensual: parseFloat(document.getElementById('emp-paga').value) || 0,
      };

      if (isEdit) {
        await supabaseClient.from('empleados').update(payload).eq('id', emp.id);
      } else {
        await supabaseClient.from('empleados').insert([payload]);
      }

      closeModal();
      loadEmpleados();
    } catch (err) {
      statusEl.textContent = err.message || 'Error al guardar.';
      statusEl.classList.add('error');
      submitBtn.disabled = false;
    }
  });
}

/* ================= RESERVACIONES ================= */

function initReservacionesSection() {
  loadReservaciones();
}

async function loadReservaciones() {
  const list = document.getElementById('reservaciones-list');
  const { data, error } = await supabaseClient
    .from('reservaciones')
    .select('*')
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (error || !data || data.length === 0) {
    list.innerHTML = '<tr><td colspan="5" class="empty-state">No hay reservaciones todavía.</td></tr>';
    return;
  }

  list.innerHTML = data.map((res) => `
    <tr>
      <td>${escapeHtml(res.nombre_cliente)}</td>
      <td>${res.fecha}</td>
      <td>${res.hora}</td>
      <td>${res.personas}</td>
      <td>${escapeHtml(res.telefono)}</td>
    </tr>
  `).join('');
}
