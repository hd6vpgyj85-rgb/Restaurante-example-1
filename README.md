# Obsidiana — Sitio web de restaurante + panel de administración

Sitio público y panel de administración construidos con HTML, CSS y
JavaScript vanilla (sin frameworks). Usa Supabase (base de datos + auth),
Cloudinary (imágenes), EmailJS y WhatsApp (notificaciones de reservación).

## Estructura

```
index.html            Página pública principal
menu-item.html         Detalle de un platillo
admin/index.html        Login del panel de administración
admin/dashboard.html    Panel de administración
css/style.css           Estilos globales
js/config.js            Credenciales (placeholders a reemplazar)
js/supabase.js          Inicialización del cliente de Supabase
js/app.js               Lógica del sitio público
js/admin.js             Lógica del panel de administración
supabase/schema.sql      Esquema de base de datos + políticas RLS
```

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`.
   Esto crea las tablas `menu_items`, `galeria`, `promociones`,
   `empleados`, `reservaciones` y sus políticas de seguridad (RLS):
   - `menu_items`, `galeria`, `promociones`: lectura pública.
   - `empleados`, `reservaciones`: lectura solo para usuarios autenticados.
   - `reservaciones`: cualquiera puede insertar (formulario público).
3. Ve a **Authentication > Users** y crea manualmente el usuario dueño
   del restaurante (email + contraseña). Ese será el único usuario con
   acceso al panel de administración.
4. Ve a **Project Settings > API** y copia el **Project URL** y la
   **anon public key**.

## 2. Configurar Cloudinary

1. Crea una cuenta en [cloudinary.com](https://cloudinary.com).
2. Ve a **Settings > Upload > Upload presets > Add upload preset**.
3. Configura el **Signing Mode** como **Unsigned** y guarda el nombre
   del preset (necesario para subir imágenes desde el navegador sin backend).
4. Copia tu **Cloud name** desde el dashboard.

## 3. Configurar EmailJS

1. Crea una cuenta en [emailjs.com](https://www.emailjs.com).
2. Crea un **Email Service** y copia el **Service ID**.
3. Crea un **Email Template** con variables: `nombre_cliente`, `fecha`,
   `hora`, `personas`, `telefono`. Copia el **Template ID**.
4. Copia tu **Public Key** desde **Account > API Keys**.

## 4. Completar `js/config.js`

Abre `js/config.js` y reemplaza cada valor marcado como
`REEMPLAZAR_...` con tus credenciales reales de Supabase, EmailJS,
Cloudinary y el número de WhatsApp del restaurante (formato
internacional sin `+`, ej. `5215512345678`).

## 5. Ejecutar en local

Este proyecto no requiere build ni instalación de dependencias. Basta
con servir los archivos estáticos, por ejemplo:

```bash
npx serve .
```

o abrir `index.html` con la extensión Live Server de VS Code (se
recomienda servir por HTTP, no abrir el archivo directamente, para que
los módulos de JavaScript funcionen correctamente).

## 6. Despliegue

El proyecto está pensado para desplegarse en Netlify (`netlify.toml`
incluido, sin build step) conectado a un repositorio de GitHub.
