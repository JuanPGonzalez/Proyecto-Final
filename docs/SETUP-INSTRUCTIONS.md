# Hardware Haven 2026 - Guía de Instalación y Ejecución

Esta guía contiene los pasos necesarios para desplegar y correr localmente todo el ecosistema de **Hardware Haven**, que incluye tu Base de Datos nativa, el Backend en Node.js y el Frontend interactivo en React.

---

## 🛠️ Requisitos del Sistema
1. **Node.js** (Versión 18 o superior).
2. **Git** para clonar dependencias si fuese necesario.
3. **Servidor MySQL** ejecutándose en el puerto `3306` (ej. XAMPP, Workbench o Docker). 
   - Debes asegurarte de que tu base de datos esté nombrada `hardware_haven`.
   - La base de datos debe contemplar tus tablas nativas (`user`, `componente`, `compra`, etc.) tal como se diagramó en tu arquitectura inicial. Si aún no las tienes, el sistema las agregará vacías en el primer booteo.

---

## 🚀 1. Configuración del Backend

1. Abre una nueva terminal y dirígete a la carpeta `/backend`:
   ```bash
   cd c:\Users\Juampo\Documents\GitHub\Proyecto-Final\backend
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Verifica el archivo `.env`. Si tu servidor MySQL tiene contraseña para el usuario "root", debes indicarla aquí (actualmente está configurada vacía):
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASS=tu_contraseña_si_aplica
   DB_NAME=hardware_haven
   ```
4. **NO** corras `npm run seed`. El módulo de formateo fue suprimido intencionalmente para cuidar la integridad estructural de tus viejas tablas y datos.
5. Inicia el servidor backend:
   ```bash
   npm run dev
   ```
   > Observarás en la consola que el ORM de Sequelize conecta exitosamente y el *Cron Job* de Precios Automáticos arranca silenciosamente en background cada 5 minutos.

---

## 🎨 2. Configuración del Frontend

1. Abre *otra* terminal paralela y dirígete al entorno del cliente:
   ```bash
   cd c:\Users\Juampo\Documents\GitHub\Proyecto-Final\frontend
   ```
2. Instala los enormes paquetes gráficos y lógicos:
   ```bash
   npm install
   ```
3. Levanta el ecosistema de Vite en tu navegador:
   ```bash
   npm run dev
   ```
4. Ingresa a `http://localhost:5173`. 

---

## 💡 3. ¿Cómo testear el flujo integral?

### Como Cliente
1. Ingresa a **Armá tu PC** (BudgetView) para probar el cotizador. Selecciona componentes hipotéticos y presiona "Añadir al Carrito".
2. Ve al logo del carrito en el navbar superior. Procedé a "Finalizar Compra".
3. Pasarás por la pantalla interactiva de envío (`/envio`) para elegir tu paquetería.
4. Concluye y recibe el código de simulación de cobro.
5. Usa el Chatbot IA flotante en la esquina en cualquier momento.

### Como Administrador
1. Regístrate o usa una cuenta seteada con `tipoUsuario = 'admin'` en la tabla MySQL local.
2. Accede al ícono de engranaje (Settings) para observar el nuevo **Dashboard BI** que consolida ventas y métricas avanzadas.
3. Ve a **Inventario** (`/admin/productos`) para agregar nuevo hardware a la BD con sólo un clic, el cual inmediatamente podrá ser buscado por los clientes.

Cualquier inconveniente en conexiones de red (ej. CORS) o configuraciones ausentes de red, revisa que los puertos `5000` y `5173` estén liberados localmente.

### Tecnologias Utilizadas
Backend Node.js con Express (framework web) Sequelize (ORM para base de datos) MySQL2 (driver MySQL) JWT (autenticación con tokens) Bcrypt (encriptación de contraseñas) Axios (cliente HTTP) CORS (cross-origin resource sharing) node-cron (tareas programadas) dotenv (variables de entorno) Nodemon (recarga automática en desarrollo) Frontend React 19.2.5 Vite (build tool/bundler) React Router DOM (enrutamiento) Axios (cliente HTTP) Chart.js + react-chartjs-2 (gráficos) Lucide React (iconos) ESLint (linting) Base de Datos MySQL con Sequelize ORM
