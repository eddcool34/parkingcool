const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'shipments.db'));

// Crear tabla de envíos
db.exec(`
  CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Información del remitente
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,

    -- Información del destinatario
    recipient_name TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_postal_code TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_state TEXT NOT NULL,

    -- Información del servicio
    service_type TEXT NOT NULL CHECK(service_type IN ('Nacional', 'Internacional')),
    carrier TEXT NOT NULL CHECK(carrier IN ('DHL', 'FedEx', 'Estafeta')),

    -- Información financiera
    price REAL NOT NULL,
    iva REAL NOT NULL,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,

    -- Metadatos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    date TEXT NOT NULL
  )
`);

// Funciones de base de datos
const dbFunctions = {
  // Insertar un nuevo envío
  insertShipment: (shipment) => {
    const stmt = db.prepare(`
      INSERT INTO shipments (
        sender_name, sender_phone,
        recipient_name, recipient_address, recipient_postal_code,
        recipient_phone, recipient_state,
        service_type, carrier,
        price, iva, discount, total, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      shipment.sender_name,
      shipment.sender_phone,
      shipment.recipient_name,
      shipment.recipient_address,
      shipment.recipient_postal_code,
      shipment.recipient_phone,
      shipment.recipient_state,
      shipment.service_type,
      shipment.carrier,
      shipment.price,
      shipment.iva,
      shipment.discount,
      shipment.total,
      shipment.date
    );

    return result.lastInsertRowid;
  },

  // Obtener envío por ID
  getShipmentById: (id) => {
    const stmt = db.prepare('SELECT * FROM shipments WHERE id = ?');
    return stmt.get(id);
  },

  // Obtener todos los envíos
  getAllShipments: () => {
    const stmt = db.prepare('SELECT * FROM shipments ORDER BY created_at DESC');
    return stmt.all();
  },

  // Obtener envíos por fecha
  getShipmentsByDate: (date) => {
    const stmt = db.prepare('SELECT * FROM shipments WHERE date = ? ORDER BY created_at DESC');
    return stmt.all(date);
  },

  // Obtener reporte diario
  getDailyReport: (date) => {
    const shipments = db.prepare('SELECT * FROM shipments WHERE date = ?').all(date);

    const totalCollected = shipments.reduce((sum, s) => sum + s.total, 0);

    const serviceBreakdown = shipments.reduce((acc, s) => {
      const key = `${s.service_type} - ${s.carrier}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      date,
      total_shipments: shipments.length,
      total_collected: totalCollected,
      service_breakdown: serviceBreakdown,
      shipments
    };
  },

  // Obtener estadísticas por rango de fechas
  getStatsByDateRange: (startDate, endDate) => {
    const stmt = db.prepare(`
      SELECT
        date,
        COUNT(*) as shipment_count,
        SUM(total) as daily_total,
        service_type,
        carrier
      FROM shipments
      WHERE date BETWEEN ? AND ?
      GROUP BY date, service_type, carrier
      ORDER BY date DESC
    `);
    return stmt.all(startDate, endDate);
  }
};

module.exports = { db, ...dbFunctions };
