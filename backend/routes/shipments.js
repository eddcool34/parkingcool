const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { generateShipmentPDF, generateTicket } = require('../utils/pdfGenerator');

// Crear directorio para PDFs temporales si no existe
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Crear un nuevo envío
router.post('/', async (req, res) => {
  try {
    const shipmentData = {
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0]
    };

    const shipmentId = db.insertShipment(shipmentData);

    res.json({
      success: true,
      shipment_id: shipmentId,
      message: 'Envío registrado exitosamente'
    });

  } catch (error) {
    console.error('Error al crear envío:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener todos los envíos
router.get('/', (req, res) => {
  try {
    const shipments = db.getAllShipments();
    res.json({
      success: true,
      shipments
    });
  } catch (error) {
    console.error('Error al obtener envíos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener un envío por ID
router.get('/:id', (req, res) => {
  try {
    const shipment = db.getShipmentById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado'
      });
    }

    res.json({
      success: true,
      shipment
    });
  } catch (error) {
    console.error('Error al obtener envío:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generar PDF de un envío
router.get('/:id/pdf', async (req, res) => {
  try {
    const shipment = db.getShipmentById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado'
      });
    }

    const fileName = `shipment_${shipment.id}_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    await generateShipmentPDF(shipment, filePath);

    res.download(filePath, `Envio_${shipment.id}.pdf`, (err) => {
      // Eliminar archivo temporal después de la descarga
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (err) {
        console.error('Error al descargar PDF:', err);
      }
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generar ticket de un envío
router.get('/:id/ticket', async (req, res) => {
  try {
    const shipment = db.getShipmentById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Envío no encontrado'
      });
    }

    const fileName = `ticket_${shipment.id}_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    await generateTicket(shipment, filePath);

    res.download(filePath, `Ticket_${shipment.id}.pdf`, (err) => {
      // Eliminar archivo temporal después de la descarga
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (err) {
        console.error('Error al descargar ticket:', err);
      }
    });

  } catch (error) {
    console.error('Error al generar ticket:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener envíos por fecha
router.get('/date/:date', (req, res) => {
  try {
    const shipments = db.getShipmentsByDate(req.params.date);
    res.json({
      success: true,
      shipments
    });
  } catch (error) {
    console.error('Error al obtener envíos por fecha:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
