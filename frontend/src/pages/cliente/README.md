# 📁 pages/cliente — Área "Mi Cuenta" del cliente (WIP)

Estas páginas son la **futura sección de autoservicio del cliente** (perfil, pedidos,
direcciones, métodos de pago, notificaciones, puntos de fidelidad, centro de ayuda).

## Estado actual: MOCKUPS ⚠️
Hoy son **prototipos estáticos**: datos hardcodeados, layout propio inline, sin rutas
en `App.jsx` y sin conexión a la API (Axios). Se movieron aquí desde `pages/` durante
la limpieza de incongruencias para dejar de mezclar el área admin con el área cliente.

## Pendiente para cablearlas (feature futura)
- [ ] Crear un layout compartido de cliente (hoy cada archivo duplica su propio sidebar).
- [ ] Migrar los estilos inline a Tailwind + `ThemeContext` (como el resto del admin).
- [ ] Conectar cada página a su servicio en `src/api/` (patrón `customerService`, etc.).
- [ ] Mover la lógica/fetch a hooks (`src/hooks/`), no dentro del componente.
- [ ] Registrar sus rutas en `App.jsx`.

## Archivos
| Archivo | Pantalla |
|---|---|
| `MisPedidos.jsx` | Pedidos del cliente |
| `Recibidos.jsx` | Pedidos recibidos |
| `DetallesCuenta.jsx` | Datos de la cuenta |
| `Direcciones.jsx` | Direcciones de entrega |
| `MetodoPago.jsx` | Métodos de pago |
| `Notificaciones.jsx` | Preferencias de notificación |
| `PuntosFidelidad.jsx` | Puntos de fidelidad (loyalty) |
| `CentroAyuda.jsx` | Centro de ayuda |
