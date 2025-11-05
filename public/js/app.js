// API Base URL
const API_BASE = '/api';

// Estado de la aplicación
let currentShipmentId = null;

// Estado de conexión Bluetooth
let bluetoothStatus = {
    connected: false,
    deviceName: null
};

// Elementos del DOM
const views = {
    form: document.getElementById('form-view'),
    list: document.getElementById('list-view'),
    reports: document.getElementById('reports-view')
};

const navButtons = document.querySelectorAll('.nav-btn');
const shipmentForm = document.getElementById('shipment-form');
const successActions = document.getElementById('success-actions');
const shipmentIdSpan = document.getElementById('shipment-id');

// Navegación entre vistas
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewName = btn.dataset.view;
        switchView(viewName);
    });
});

function switchView(viewName) {
    // Actualizar botones de navegación
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Mostrar vista correspondiente
    Object.keys(views).forEach(key => {
        views[key].classList.toggle('active', key === viewName);
    });

    // Cargar datos según la vista
    if (viewName === 'list') {
        loadShipments();
    } else if (viewName === 'reports') {
        loadTodayReport();
    }
}

// ==================== FORMULARIO ====================

// Calcular total automáticamente
document.getElementById('price').addEventListener('input', calculateTotal);
document.getElementById('iva_percent').addEventListener('input', calculateTotal);
document.getElementById('discount').addEventListener('input', calculateTotal);

function calculateTotal() {
    const price = parseFloat(document.getElementById('price').value) || 0;
    const ivaPercent = parseFloat(document.getElementById('iva_percent').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;

    const iva = price * (ivaPercent / 100);
    const total = price + iva - discount;

    document.getElementById('total').value = total.toFixed(2);
}

// Enviar formulario
shipmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(shipmentForm);
    const data = Object.fromEntries(formData);

    // Calcular IVA en monto
    const price = parseFloat(data.price);
    const ivaPercent = parseFloat(document.getElementById('iva_percent').value);
    data.iva = price * (ivaPercent / 100);

    // Convertir strings a números
    data.price = parseFloat(data.price);
    data.discount = parseFloat(data.discount);
    data.total = parseFloat(data.total);

    try {
        const response = await fetch(`${API_BASE}/shipments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            currentShipmentId = result.shipment_id;
            shipmentIdSpan.textContent = `#${currentShipmentId}`;
            shipmentForm.style.display = 'none';
            successActions.style.display = 'block';
        } else {
            alert('Error al registrar el envío: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
});

// Botón limpiar formulario
document.getElementById('clear-form').addEventListener('click', () => {
    shipmentForm.reset();
    document.getElementById('iva_percent').value = '16';
    document.getElementById('discount').value = '0';
    calculateTotal();
});

// Botones de acciones después de registrar
document.getElementById('download-pdf').addEventListener('click', () => {
    window.open(`${API_BASE}/shipments/${currentShipmentId}/pdf`, '_blank');
});

document.getElementById('download-ticket').addEventListener('click', () => {
    window.open(`${API_BASE}/shipments/${currentShipmentId}/ticket`, '_blank');
});

// Botón de imprimir en Bluetooth
document.getElementById('print-bluetooth').addEventListener('click', async () => {
    if (!bluetoothStatus.connected) {
        alert('Por favor conecta primero una impresora Bluetooth');
        return;
    }
    await printTicketBluetooth(currentShipmentId);
});

document.getElementById('new-shipment').addEventListener('click', () => {
    shipmentForm.reset();
    document.getElementById('iva_percent').value = '16';
    document.getElementById('discount').value = '0';
    calculateTotal();
    shipmentForm.style.display = 'block';
    successActions.style.display = 'none';
    currentShipmentId = null;
});

// ==================== HISTORIAL ====================

async function loadShipments(date = null) {
    try {
        const url = date
            ? `${API_BASE}/shipments/date/${date}`
            : `${API_BASE}/shipments`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            displayShipments(result.shipments);
        }
    } catch (error) {
        console.error('Error al cargar envíos:', error);
    }
}

function displayShipments(shipments) {
    const tbody = document.getElementById('shipments-tbody');

    if (shipments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <h3>No hay envíos registrados</h3>
                    <p>Los envíos que registres aparecerán aquí</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = shipments.map(shipment => `
        <tr>
            <td>#${shipment.id}</td>
            <td>${shipment.date || shipment.created_at.split(' ')[0]}</td>
            <td>${shipment.sender_name}</td>
            <td>${shipment.recipient_name}</td>
            <td>${shipment.service_type}</td>
            <td>${shipment.carrier}</td>
            <td>$${shipment.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-success btn-small" onclick="downloadPDF(${shipment.id})">📄 PDF</button>
                <button class="btn btn-primary btn-small" onclick="downloadTicket(${shipment.id})">🎫 Ticket</button>
                ${bluetoothStatus.connected ? `<button class="btn btn-info btn-small" onclick="printBluetoothTicket(${shipment.id})">🖨️ Imprimir</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// Funciones globales para descargas
window.downloadPDF = (id) => {
    window.open(`${API_BASE}/shipments/${id}/pdf`, '_blank');
};

window.downloadTicket = (id) => {
    window.open(`${API_BASE}/shipments/${id}/ticket`, '_blank');
};

window.printBluetoothTicket = async (id) => {
    await printTicketBluetooth(id);
};

// Filtros
document.getElementById('filter-btn').addEventListener('click', () => {
    const date = document.getElementById('filter-date').value;
    if (date) {
        loadShipments(date);
    }
});

document.getElementById('show-all-btn').addEventListener('click', () => {
    document.getElementById('filter-date').value = '';
    loadShipments();
});

// ==================== REPORTES ====================

async function loadTodayReport() {
    try {
        const response = await fetch(`${API_BASE}/reports/today`);
        const result = await response.json();

        if (result.success) {
            displayReport(result.report);
        }
    } catch (error) {
        console.error('Error al cargar reporte:', error);
    }
}

async function loadReportByDate(date) {
    try {
        const response = await fetch(`${API_BASE}/reports/daily/${date}`);
        const result = await response.json();

        if (result.success) {
            displayReport(result.report);
        }
    } catch (error) {
        console.error('Error al cargar reporte:', error);
    }
}

function displayReport(report) {
    const reportContent = document.getElementById('report-content');

    if (report.total_shipments === 0) {
        reportContent.innerHTML = `
            <div class="empty-state">
                <h3>No hay envíos en esta fecha</h3>
                <p>Selecciona otra fecha para ver el reporte</p>
            </div>
        `;
        return;
    }

    const serviceBreakdownHTML = Object.entries(report.service_breakdown)
        .map(([service, count]) => `
            <div class="service-item">
                <span>${service}</span>
                <span>${count} envío(s)</span>
            </div>
        `).join('');

    reportContent.innerHTML = `
        <div class="report-card">
            <h3>Reporte del ${report.date}</h3>

            <div class="report-stats">
                <div class="stat-card">
                    <h4>Total de Envíos</h4>
                    <div class="value">${report.total_shipments}</div>
                </div>
                <div class="stat-card">
                    <h4>Total Cobrado</h4>
                    <div class="value">$${report.total_collected.toFixed(2)}</div>
                </div>
            </div>

            <div class="service-breakdown">
                <h4>Desglose por Servicio</h4>
                ${serviceBreakdownHTML}
            </div>

            <div style="margin-top: 30px;">
                <h4 style="margin-bottom: 15px;">Detalle de Envíos</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Folio</th>
                            <th>Remitente</th>
                            <th>Destinatario</th>
                            <th>Servicio</th>
                            <th>Paquetería</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.shipments.map(s => `
                            <tr>
                                <td>#${s.id}</td>
                                <td>${s.sender_name}</td>
                                <td>${s.recipient_name}</td>
                                <td>${s.service_type}</td>
                                <td>${s.carrier}</td>
                                <td>$${s.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Botones de reportes
document.getElementById('generate-report-btn').addEventListener('click', () => {
    const date = document.getElementById('report-date').value;
    if (date) {
        loadReportByDate(date);
    } else {
        alert('Por favor selecciona una fecha');
    }
});

document.getElementById('today-report-btn').addEventListener('click', () => {
    loadTodayReport();
});

// ==================== BLUETOOTH PRINTER ====================

/**
 * Imprimir ticket en impresora Bluetooth
 */
async function printTicketBluetooth(shipmentId) {
    try {
        // Verificar conexión
        if (!window.bluetoothPrinter || !window.bluetoothPrinter.isConnected) {
            alert('No hay conexión con la impresora Bluetooth');
            return;
        }

        // Obtener datos del envío
        const response = await fetch(`${API_BASE}/shipments/${shipmentId}`);
        const result = await response.json();

        if (!result.success) {
            alert('Error al obtener datos del envío');
            return;
        }

        // Mostrar loading
        showNotification('Imprimiendo...', 'info');

        // Imprimir en Bluetooth
        await window.bluetoothPrinter.printTicket(result.shipment);

        showNotification('Ticket impreso exitosamente', 'success');

    } catch (error) {
        console.error('Error al imprimir:', error);
        showNotification('Error al imprimir: ' + error.message, 'error');
    }
}

/**
 * Conectar impresora Bluetooth
 */
async function connectBluetoothPrinter() {
    try {
        if (!window.bluetoothPrinter) {
            alert('El servicio de Bluetooth no está disponible');
            return;
        }

        if (!window.bluetoothPrinter.isBluetoothAvailable()) {
            alert('Bluetooth no está disponible en este navegador. Usa Chrome o Edge.');
            return;
        }

        const result = await window.bluetoothPrinter.connect();

        if (result.success) {
            bluetoothStatus.connected = true;
            bluetoothStatus.deviceName = result.deviceName;
            updateBluetoothUI();
            showNotification(`Conectado a: ${result.deviceName}`, 'success');
            // Recargar lista si estamos en la vista de historial
            if (views.list.classList.contains('active')) {
                loadShipments();
            }
        } else {
            showNotification('Error al conectar: ' + result.error, 'error');
        }

    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al conectar con la impresora', 'error');
    }
}

/**
 * Desconectar impresora Bluetooth
 */
function disconnectBluetoothPrinter() {
    if (window.bluetoothPrinter) {
        window.bluetoothPrinter.disconnect();
        bluetoothStatus.connected = false;
        bluetoothStatus.deviceName = null;
        updateBluetoothUI();
        showNotification('Impresora desconectada', 'info');
        // Recargar lista si estamos en la vista de historial
        if (views.list.classList.contains('active')) {
            loadShipments();
        }
    }
}

/**
 * Actualizar UI de Bluetooth
 */
function updateBluetoothUI() {
    const statusDot = document.getElementById('bluetooth-status-dot');
    const statusText = document.getElementById('bluetooth-status-text');
    const connectBtn = document.getElementById('connect-bluetooth');
    const disconnectBtn = document.getElementById('disconnect-bluetooth');
    const printBtn = document.getElementById('print-bluetooth');

    if (bluetoothStatus.connected) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = bluetoothStatus.deviceName || 'Conectado';
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-block';
        if (printBtn) {
            printBtn.disabled = false;
        }
    } else {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Desconectado';
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        if (printBtn) {
            printBtn.disabled = true;
        }
    }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Agregar al DOM
    document.body.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Escuchar eventos de Bluetooth
if (window.bluetoothPrinter) {
    window.bluetoothPrinter.addListener((event, data) => {
        console.log('Bluetooth event:', event, data);
        switch(event) {
            case 'connected':
                bluetoothStatus.connected = true;
                bluetoothStatus.deviceName = window.bluetoothPrinter.device?.name;
                updateBluetoothUI();
                break;
            case 'disconnected':
                bluetoothStatus.connected = false;
                bluetoothStatus.deviceName = null;
                updateBluetoothUI();
                break;
            case 'error':
                showNotification('Error de Bluetooth: ' + data, 'error');
                break;
        }
    });
}

// ==================== INICIALIZACIÓN ====================

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    calculateTotal();
    updateBluetoothUI();

    // Configurar botones de Bluetooth
    const connectBtn = document.getElementById('connect-bluetooth');
    const disconnectBtn = document.getElementById('disconnect-bluetooth');

    if (connectBtn) {
        connectBtn.addEventListener('click', connectBluetoothPrinter);
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectBluetoothPrinter);
    }
});
