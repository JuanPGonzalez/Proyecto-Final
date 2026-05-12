<div align="center">
  <h1>🚀 Hardware Haven</h1>
  <p><strong>Plataforma E-Commerce Premium de Hardware & Componentes Informáticos</strong></p>

  <img src="https://img.shields.io/badge/Built%20With-React-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green?style=for-the-badge&logo=nodedotjs" />
  <img src="https://img.shields.io/badge/Database-MySQL%20%7C%20Sequelize-orange?style=for-the-badge&logo=mysql" />
  <img src="https://img.shields.io/badge/AI%20Features-Chatbot%20%26%20BI-purple?style=for-the-badge" />
</div>

---

## 📖 Acerca del Proyecto

**Hardware Haven** es una solución integral de e-commerce diseñada específicamente para la comercialización de hardware de alta gama y periféricos. 

Esta plataforma no solo ofrece una experiencia de usuario moderna con estética **Glassmorphism**, sino que también incorpora potentes herramientas de administración: un motor de precios dinámicos, un dashboard de Business Intelligence, asistente virtual de soporte y una robusta gestión de stocks e inventarios masivos.

---

## ✨ Características Principales

### 🛒 Para el Cliente
- **Catálogo Inteligente**: Navegación fluida de productos con filtrado avanzado por rangos de precios, categorías y marcas.
- **Armador de PC**: Asistente dinámico que valida la compatibilidad entre componentes y presupuesta configuraciones a medida.
- **Chatbot Predictivo**: Asistente virtual integrado capaz de procesar lenguaje natural, recomendar productos alternativos por falta de stock y guiar el flujo de compra.
- **Checkout Seguro**: Proceso de checkout paso a paso con múltiples métodos de pago (Transferencia, Efectivo en local) y carga de comprobantes.
- **Seguimiento de Pedido**: Vista de perfil histórica con resumen en PDF y notificaciones de estado en tiempo real.

### 📊 Para el Administrador
- **Dashboard BI interactivo**: Visualización de ingresos, productos más vendidos y tendencias de ventas a través de gráficos analíticos.
- **Motor de Precios Dinámicos**: Ajuste algorítmico automático de precios en función de las vistas, la demanda y el monitoreo de MercadoLibre.
- **Gestión de Inventario Masivo**: Exportación e importación de stock y precios mediante Excel (.xlsx) con validación de datos integrada.
- **Sistema de Tickets de Soporte**: Central de mensajería para gestionar reclamos y consultas de los usuarios.
- **Control de Roles y Seguridad**: Diferenciación estricta entre Clientes y Administradores, blindando el acceso a rutas y APIs sensibles.

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React.js**: Interfaces reactivas y SPA (Single Page Application).
- **Tailwind CSS**: Estilización utilitaria con diseño responsivo adaptado a todos los dispositivos.
- **Lucide React / React Icons**: Paquetes de iconos vectoriales.
- **SweetAlert2 / Sonner**: Sistema elegante de notificaciones y alertas visuales.
- **Axios**: Gestión de solicitudes HTTP hacia la API centralizada.

### Backend
- **Node.js & Express**: Servidor RESTful escalable.
- **Sequelize ORM**: Capa de abstracción para modelado, relaciones y migraciones de bases de datos SQL.
- **JWT (JSON Web Tokens)**: Autenticación sin estado y segura.
- **Bcrypt.js**: Encriptación robusta de contraseñas unidireccional.
- **Multer**: Middleware para la gestión y subida segura de imágenes y comprobantes de pago.
- **PDFKit**: Generación nativa de documentos de preparación e informes en formato PDF.

### Base de Datos
- **MySQL / MariaDB**: Persistencia relacional con integridad referencial estricta y disparadores de optimización.

---

## 🏗️ Estructura del Repositorio

```bash
HardwareHaven/
├── 📂 frontend/           # Aplicación React (Vite / CRA)
│   ├── 📂 src/components  # Componentes reutilizables (Botones, Cards)
│   ├── 📂 src/pages       # Vistas de Usuario y Panel Admin
│   └── 📂 src/utils       # Helpers y configuraciones globales
├── 📂 backend/            # Servidor API Express
│   ├── 📂 config/         # Configuración DB y Variables
│   ├── 📂 models/         # Modelos Sequelize (Order, Product, User)
│   ├── 📂 routes/         # Endpoints API segmentados por contexto
│   └── 📂 services/       # Lógica de negocio (Pricing Engine, PDFs)
└── 📄 package.json        # Script centralizado para Concurrently
```

---

## ⚙️ Instalación y Despliegue Local

Sigue estos pasos para levantar el ecosistema completo en tu máquina local:

### 1. Requisitos Previos
- Tener instalado [Node.js](https://nodejs.org/) (v16 o superior).
- Instancia activa de servidor de Base de Datos (MySQL / MariaDB / XAMPP).

### 2. Clonación y Dependencias
Clona el repositorio e instala las dependencias para el nodo central, el frontend y el backend en una sola corrida:
```bash
git clone https://github.com/JuanPGonzalez/Proyecto-Final.git
cd Proyecto-Final
npm run install-all
```

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del directorio `/backend` con las credenciales de tu base de datos:
```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_NAME=hardware_haven
JWT_SECRET=tu_clave_secreta_super_segura
```

### 4. Levantar Servidores
Hardware Haven utiliza `concurrently` para encender la API REST y la interfaz de usuario simultáneamente desde un único comando en la raíz del proyecto:
```bash
npm run dev
```
* El **Frontend** estará disponible en: `http://localhost:5173` (o 3000).
* El **Backend** escuchará consultas en: `http://localhost:5000`.

---

## 👨‍💻 Autor
Desarrollado con ❤️ por **Juan Pablo González**.

---
<p align="center">
  <sub>Este proyecto fue creado como Proyecto Final Universitario para demostrar capacidades fullstack modernas.</sub>
</p>
