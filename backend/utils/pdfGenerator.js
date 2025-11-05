const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateShipmentPDF(shipment, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Encabezado
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('COMPROBANTE DE ENVÍO', { align: 'center' })
         .moveDown();

      doc.fontSize(10)
         .font('Helvetica')
         .text(`Folio: #${shipment.id}`, { align: 'right' })
         .text(`Fecha: ${shipment.date || new Date().toISOString().split('T')[0]}`, { align: 'right' })
         .moveDown(2);

      // Línea divisoria
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke()
         .moveDown();

      // Información del remitente
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('INFORMACIÓN DEL REMITENTE', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(`Nombre: ${shipment.sender_name}`)
         .text(`Teléfono: ${shipment.sender_phone}`)
         .moveDown(1.5);

      // Información del destinatario
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('INFORMACIÓN DEL DESTINATARIO', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(`Nombre: ${shipment.recipient_name}`)
         .text(`Dirección: ${shipment.recipient_address}`)
         .text(`Código Postal: ${shipment.recipient_postal_code}`)
         .text(`Estado: ${shipment.recipient_state}`)
         .text(`Teléfono: ${shipment.recipient_phone}`)
         .moveDown(1.5);

      // Información del servicio
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('DETALLES DEL SERVICIO', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(`Tipo de Servicio: ${shipment.service_type}`)
         .text(`Paquetería: ${shipment.carrier}`)
         .moveDown(2);

      // Línea divisoria
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke()
         .moveDown();

      // Desglose de precios
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('DESGLOSE DE PRECIO', { underline: true })
         .moveDown(0.5);

      const priceY = doc.y;
      doc.fontSize(11)
         .font('Helvetica');

      // Columna izquierda (conceptos)
      doc.text('Precio:', 50, priceY);
      doc.text('IVA:', 50, priceY + 20);
      doc.text('Descuento:', 50, priceY + 40);

      // Línea antes del total
      doc.moveTo(50, priceY + 60)
         .lineTo(550, priceY + 60)
         .stroke();

      doc.font('Helvetica-Bold')
         .fontSize(13)
         .text('TOTAL:', 50, priceY + 70);

      // Columna derecha (montos)
      doc.font('Helvetica')
         .fontSize(11)
         .text(`$${shipment.price.toFixed(2)}`, 400, priceY, { align: 'right', width: 150 });
      doc.text(`$${shipment.iva.toFixed(2)}`, 400, priceY + 20, { align: 'right', width: 150 });
      doc.text(`-$${shipment.discount.toFixed(2)}`, 400, priceY + 40, { align: 'right', width: 150 });

      doc.font('Helvetica-Bold')
         .fontSize(13)
         .text(`$${shipment.total.toFixed(2)}`, 400, priceY + 70, { align: 'right', width: 150 });

      // Footer
      doc.moveDown(4);
      doc.fontSize(9)
         .font('Helvetica')
         .text('Gracias por su preferencia', { align: 'center' })
         .text('Este documento es un comprobante válido de su envío', { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

function generateTicket(shipment, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Ticket en formato 80mm (aprox 226 puntos de ancho)
      const doc = new PDFDocument({
        size: [226, 600],
        margin: 10
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Encabezado del ticket
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('TICKET DE ENVÍO', { align: 'center' })
         .moveDown(0.3);

      doc.fontSize(8)
         .font('Helvetica')
         .text(`Folio: #${shipment.id}`, { align: 'center' })
         .text(`${shipment.date || new Date().toISOString().split('T')[0]}`, { align: 'center' })
         .moveDown(0.5);

      // Línea
      doc.text('--------------------------------', { align: 'center' })
         .moveDown(0.3);

      // Remitente
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text('REMITENTE');
      doc.font('Helvetica')
         .fontSize(7)
         .text(`${shipment.sender_name}`)
         .text(`Tel: ${shipment.sender_phone}`)
         .moveDown(0.5);

      // Destinatario
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text('DESTINATARIO');
      doc.font('Helvetica')
         .fontSize(7)
         .text(`${shipment.recipient_name}`)
         .text(`${shipment.recipient_address}`)
         .text(`CP: ${shipment.recipient_postal_code}`)
         .text(`${shipment.recipient_state}`)
         .text(`Tel: ${shipment.recipient_phone}`)
         .moveDown(0.5);

      // Servicio
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text('SERVICIO');
      doc.font('Helvetica')
         .fontSize(7)
         .text(`${shipment.service_type} - ${shipment.carrier}`)
         .moveDown(0.5);

      // Línea
      doc.fontSize(7)
         .text('--------------------------------', { align: 'center' })
         .moveDown(0.3);

      // Precios
      doc.font('Helvetica')
         .text(`Precio: $${shipment.price.toFixed(2)}`)
         .text(`IVA: $${shipment.iva.toFixed(2)}`)
         .text(`Descuento: -$${shipment.discount.toFixed(2)}`)
         .moveDown(0.3);

      doc.font('Helvetica-Bold')
         .fontSize(9)
         .text(`TOTAL: $${shipment.total.toFixed(2)}`)
         .moveDown(0.5);

      // Footer
      doc.fontSize(6)
         .font('Helvetica')
         .text('Gracias por su preferencia', { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateShipmentPDF, generateTicket };
