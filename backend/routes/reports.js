const express = require('express');
const router = express.Router();
const db = require('../database');

// Obtener reporte diario
router.get('/daily/:date', (req, res) => {
  try {
    const report = db.getDailyReport(req.params.date);
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error al obtener reporte diario:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener reporte de hoy
router.get('/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const report = db.getDailyReport(today);
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error al obtener reporte de hoy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener estadísticas por rango de fechas
router.get('/range/:startDate/:endDate', (req, res) => {
  try {
    const stats = db.getStatsByDateRange(req.params.startDate, req.params.endDate);
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
