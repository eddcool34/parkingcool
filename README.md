# 📦 Sistema de Gestión de Envíos

Sistema completo para gestionar envíos de paquetería con generación automática de PDFs y tickets de impresión.

## 🚀 Características

- ✅ **Registro de envíos** con información completa de remitente y destinatario
- 📄 **Generación de PDFs** profesionales para comprobantes
- 🎫 **Tickets de impresión** en formato térmico (80mm)
- 📊 **Reportes diarios** con estadísticas de ventas
- 💰 **Cálculo automático** de IVA, descuentos y totales
- 🗄️ **Base de datos SQLite** para almacenamiento local
- 🌐 **Interfaz web moderna** y responsive

## 📋 Información Recolectada

### Remitente
- Nombre completo
- Teléfono

### Destinatario
- Nombre completo
- Dirección completa
- Código postal
- Estado
- Teléfono

### Servicio
- Tipo: Nacional / Internacional
- Paquetería: DHL / FedEx / Estafeta

### Información Financiera
- Precio
- IVA (configurable)
- Descuento
- Total (calculado automáticamente)

## 🛠️ Instalación

### Requisitos Previos
- Node.js (v14 o superior)
- npm o yarn

### Pasos de Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd parkingcool
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor:
```bash
npm start
```

4. Abrir el navegador en:
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
parkingcool/
├── backend/
│   ├── routes/
│   │   ├── shipments.js      # Rutas de envíos
│   │   └── reports.js         # Rutas de reportes
│   ├── utils/
│   │   └── pdfGenerator.js    # Generación de PDFs y tickets
│   ├── database.js            # Configuración de base de datos
│   └── server.js              # Servidor Express
├── public/
│   ├── css/
│   │   └── styles.css         # Estilos de la interfaz
│   ├── js/
│   │   └── app.js             # Lógica del frontend
│   └── index.html             # Página principal
├── package.json
└── README.md
```

## 🎯 Uso del Sistema

### 1. Registrar un Nuevo Envío

1. Completa el formulario con la información del remitente
2. Ingresa los datos completos del destinatario
3. Selecciona el tipo de servicio y paquetería
4. Ingresa el precio (el IVA y total se calculan automáticamente)
5. Haz clic en "Registrar Envío"

### 2. Generar Documentos

Después de registrar un envío, puedes:
- **Descargar PDF**: Comprobante completo en formato A4
- **Descargar Ticket**: Ticket de impresión térmica (80mm)

### 3. Ver Historial

- Accede a la pestaña "Historial"
- Filtra por fecha o ve todos los envíos
- Descarga PDFs o tickets de envíos anteriores

### 4. Reportes Diarios

- Accede a la pestaña "Reportes"
- Genera reportes por fecha específica o del día actual
- Visualiza:
  - Total de envíos del día
  - Total cobrado
  - Desglose por tipo de servicio
  - Detalle completo de cada envío

## 🔧 API Endpoints

### Envíos

- `POST /api/shipments` - Crear nuevo envío
- `GET /api/shipments` - Obtener todos los envíos
- `GET /api/shipments/:id` - Obtener envío por ID
- `GET /api/shipments/:id/pdf` - Descargar PDF del envío
- `GET /api/shipments/:id/ticket` - Descargar ticket del envío
- `GET /api/shipments/date/:date` - Obtener envíos por fecha

### Reportes

- `GET /api/reports/today` - Reporte del día actual
- `GET /api/reports/daily/:date` - Reporte de fecha específica
- `GET /api/reports/range/:startDate/:endDate` - Estadísticas por rango

## 📊 Base de Datos

El sistema utiliza SQLite con la siguiente estructura:

```sql
CREATE TABLE shipments (
  id INTEGER PRIMARY KEY,
  sender_name TEXT,
  sender_phone TEXT,
  recipient_name TEXT,
  recipient_address TEXT,
  recipient_postal_code TEXT,
  recipient_phone TEXT,
  recipient_state TEXT,
  service_type TEXT,
  carrier TEXT,
  price REAL,
  iva REAL,
  discount REAL,
  total REAL,
  created_at DATETIME,
  date TEXT
)
```

## 💻 Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en modo desarrollo (con nodemon)

## 🎨 Personalización

### Cambiar el IVA por defecto

Edita `public/index.html` línea con `id="iva_percent"`:
```html
<input type="number" id="iva_percent" value="16" step="0.01" min="0">
```

### Agregar más paqueterías

Edita `public/index.html` en el select de `carrier`:
```html
<option value="NuevaPaqueteria">Nueva Paquetería</option>
```

Y actualiza la validación en `backend/database.js`.

## 📝 Licencia

ISC

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📧 Soporte

Para reportar bugs o solicitar nuevas características, abre un issue en el repositorio.