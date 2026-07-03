# 🛒 Cartify - Tienda La 635 (E-commerce & POS System)

**Cartify** es una plataforma moderna de E-commerce y Punto de Venta (POS) diseñada a la medida para "Tienda La 635". Este proyecto está construido con el stack MERN (MongoDB, Express, React, Node.js) y se enfoca en ofrecer una experiencia de usuario sumamente pulida, dinámica y segura.

El sistema administra dos grandes áreas (Módulos): **Tienda** (productos físicos) e **Impresiones** (servicios o productos digitales), con lógicas de negocio diferentes que se adaptan en tiempo real.

---

## Características Principales

### Gestión de Inventario Dinámico (Cascada)
- **Módulos**: Clasificación principal (Tienda vs. Impresiones) que cambia el comportamiento del sistema.
- **Categorías (Product Types)**: Dependientes directamente del módulo seleccionado.
- **Proveedores y Marcas**: Los proveedores distribuyen marcas específicas. Al seleccionar un proveedor, solo se muestran sus marcas.
- **Formulario Inteligente**: El formulario de creación/edición de productos se adapta; por ejemplo, la asignación de Proveedor es obligatoria para "Tienda", pero opcional para "Impresiones".

### Productos
- Control completo del **Stock** y cálculo automático de `maxQuantity` como límite inicial.
- Generación automática de **Códigos de Barras**.
- Integración con **Cloudinary** para subir y gestionar las imágenes de los productos en la nube de forma optimizada.
- Previsualizaciones en vivo de la imagen cargada y validación de campos obligatorios.

### Administración Completa (CRUD)
- Gestión de **Proveedores** (Suppliers) con múltiples marcas asociadas.
- Gestión de **Marcas** (Brands).
- Gestión de **Categorías** (Product Types) asignadas a módulos específicos.
- Gestión de **Empleados** y **Clientes**.
- Opción universal de activación/inactivación (`isActive`) en todos los catálogos.

### Autenticación y Seguridad
- Diseño preparado para **Autenticación en Dos Pasos (2FA)** mediante envío de códigos por correo electrónico.
- Diferenciación clara entre accesos de **Administración / Empleados** y el E-commerce para **Clientes**.

---

## Tecnologías Utilizadas

### Frontend (Cliente)
- **React.js**: Biblioteca principal para la construcción de interfaces interactivas.
- **Vite**: Entorno de desarrollo ultrarrápido y empaquetador.
- **Tailwind CSS**: Framework de utilidad para un diseño visual completamente a medida y responsivo.
- **Framer Motion**: Biblioteca de animaciones para transiciones fluidas de páginas, animaciones de entrada/salida en modales y microinteracciones.
- **React Router DOM**: Enrutamiento para crear una Single Page Application (SPA).
- **React Hook Form**: Manejo eficiente y optimizado de formularios complejos.
- **Axios**: Para la comunicación HTTP con el backend.
- **Lucide React**: Biblioteca de iconos consistentes y modernos.
- **React Hot Toast**: Notificaciones amigables y no intrusivas en pantalla.

### Backend (Servidor)
- **Node.js + Express**: Servidor rápido y escalable.
- **MongoDB + Mongoose**: Base de datos NoSQL y ODM para modelar relaciones y referencias (ObjectId) entre colecciones.
- **Cloudinary (SDK)**: Carga y almacenamiento en la nube de imágenes para ahorrar espacio y ancho de banda en el servidor local.
- **Multer**: Middleware para el manejo de archivos `multipart/form-data` (subida de imágenes).
- **Nodemon**: Para el reinicio automático del servidor en desarrollo.

---

## Arquitectura de la Base de Datos

El proyecto se sustenta en un esquema relacional dentro de un entorno NoSQL para permitir consultas avanzadas:

1. **Modules**: Configuración principal de la interfaz (`Tienda`, `Impresiones`).
2. **ProductTypes (Categorías)**: Contienen la referencia a `moduleId` y a los `supplierIds` que las surten.
3. **Brands (Marcas)**: Marcas existentes en el sistema.
4. **Suppliers (Proveedores)**: Contienen su información de contacto y referencias múltiples a `brandIds` (las marcas que distribuyen).
5. **Products**: Unifica todas las entidades y contiene campos como `stock`, `maxQuantity`, `barCode`, `priceCost`, `salePrice`, `expirationDate`, y URLs de imagen.

---

## Instalación y Configuración Local

Si deseas correr este proyecto en tu entorno local, sigue estos pasos:

### 1. Clonar o descargar el repositorio
Asegúrate de tener ambas carpetas: `frontend/` y `backend/`.

### 2. Configurar el Backend
```bash
cd backend
npm install
```
Crea un archivo `.env` en la carpeta raíz del backend con las siguientes variables (ajusta los valores según tus credenciales):
```env
PORT=4000
MONGODB_URI=tu_cadena_de_conexion_mongodb
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```
Inicia el servidor backend:
```bash
npm run dev
```

### 3. Configurar el Frontend
Abre una nueva terminal:
```bash
cd frontend
npm install
```
Asegúrate de que tus peticiones en Axios apunten a `http://localhost:4000/api` (o al puerto configurado en el backend).
Inicia el frontend:
```bash
npm run dev
```

### 4. Acceder
Abre tu navegador e ingresa a `http://localhost:5173` (o el puerto que te indique Vite).

---

## Decisiones de Diseño (UI/UX)
- Se optó por una paleta de colores rica, basada en tonos tierra (Marrón, Naranja oscuro, Blanco, y colores madera) para dar un toque Premium y "Artesanal".
- Bordes redondeados (`rounded-xl`, `rounded-2xl`, `rounded-full`) en tarjetas, botones y modales para un aspecto amigable y moderno.
- Animaciones fluidas utilizando **Framer Motion** para transiciones y elevación de tarjetas, combinadas con efectos sutiles (`transition-colors`, `backdrop-blur-[1px]`) para retroalimentación visual sin saturar el rendimiento del navegador.

---

*Desarrollado con amor para Tienda La 635*
