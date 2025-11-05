/**
 * Servicio de Impresora Bluetooth
 * Mantiene una conexión persistente con la impresora Bluetooth
 * que no se interrumpe al cambiar de vista en la aplicación
 */

class BluetoothPrinterService {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
        this.listeners = [];

        // UUIDs estándar para impresoras Bluetooth (Serial Port Profile)
        this.SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'; // Serial Service
        this.CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'; // TX Characteristic

        // ESC/POS comandos
        this.ESC = '\x1B';
        this.GS = '\x1D';

        // Mantener conexión al cargar la página
        this.initAutoReconnect();
    }

    /**
     * Conectar a impresora Bluetooth
     */
    async connect() {
        try {
            console.log('Solicitando dispositivo Bluetooth...');

            // Solicitar dispositivo Bluetooth con filtros amplios
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    this.SERVICE_UUID,
                    '49535055-fe7d-4ae5-8fa9-9fafd205e455', // Alternativo 1
                    '000018f0-0000-1000-8000-00805f9b34fb', // Alternativo 2
                    'e7810a71-73ae-499d-8c15-faa9aef0c3f2'  // BLE Serial
                ]
            });

            // Escuchar desconexiones
            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            console.log('Conectando a GATT Server...');
            const server = await this.device.gatt.connect();

            // Intentar múltiples UUIDs de servicio
            let service = null;
            const serviceUUIDs = [
                this.SERVICE_UUID,
                '49535055-fe7d-4ae5-8fa9-9fafd205e455',
                'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
            ];

            for (const uuid of serviceUUIDs) {
                try {
                    service = await server.getPrimaryService(uuid);
                    console.log(`Servicio encontrado: ${uuid}`);
                    break;
                } catch (e) {
                    console.log(`Servicio ${uuid} no disponible`);
                }
            }

            if (!service) {
                throw new Error('No se pudo encontrar ningún servicio compatible');
            }

            console.log('Obteniendo característica...');
            const characteristicUUIDs = [
                this.CHARACTERISTIC_UUID,
                '00002af1-0000-1000-8000-00805f9b34fb',
                'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f'
            ];

            for (const uuid of characteristicUUIDs) {
                try {
                    this.characteristic = await service.getCharacteristic(uuid);
                    console.log(`Característica encontrada: ${uuid}`);
                    break;
                } catch (e) {
                    console.log(`Característica ${uuid} no disponible`);
                }
            }

            if (!this.characteristic) {
                throw new Error('No se pudo encontrar ninguna característica compatible');
            }

            this.isConnected = true;
            this.notifyListeners('connected');

            // Guardar nombre del dispositivo en localStorage para reconexión
            if (this.device.name) {
                localStorage.setItem('lastPrinterName', this.device.name);
            }

            console.log('Conectado exitosamente a:', this.device.name);
            return { success: true, deviceName: this.device.name };

        } catch (error) {
            console.error('Error al conectar:', error);
            this.isConnected = false;
            this.notifyListeners('error', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Desconectar impresora
     */
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
            console.log('Desconectado manualmente');
        }
        this.isConnected = false;
        this.device = null;
        this.characteristic = null;
        this.notifyListeners('disconnected');
    }

    /**
     * Manejador de desconexión
     */
    onDisconnected() {
        console.log('Dispositivo desconectado');
        this.isConnected = false;
        this.characteristic = null;
        this.notifyListeners('disconnected');

        // Intentar reconectar automáticamente después de 2 segundos
        setTimeout(() => {
            if (this.device && !this.isConnected) {
                console.log('Intentando reconectar...');
                this.reconnect();
            }
        }, 2000);
    }

    /**
     * Reconectar a dispositivo previo
     */
    async reconnect() {
        if (!this.device) {
            console.log('No hay dispositivo previo para reconectar');
            return { success: false, error: 'No hay dispositivo previo' };
        }

        try {
            console.log('Reconectando...');
            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(this.SERVICE_UUID);
            this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);
            this.isConnected = true;
            this.notifyListeners('connected');
            console.log('Reconectado exitosamente');
            return { success: true };
        } catch (error) {
            console.error('Error al reconectar:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Inicializar reconexión automática
     */
    initAutoReconnect() {
        // Intentar mantener la conexión activa
        setInterval(() => {
            if (this.device && this.device.gatt.connected && !this.isConnected) {
                this.isConnected = true;
                this.notifyListeners('connected');
            }
        }, 5000);
    }

    /**
     * Imprimir ticket
     */
    async printTicket(shipment) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('No hay conexión con la impresora');
        }

        try {
            // Comandos ESC/POS para ticket
            let commands = '';

            // Inicializar impresora
            commands += this.ESC + '@';

            // Centrar texto
            commands += this.ESC + 'a' + '\x01';

            // Título en negrita y tamaño grande
            commands += this.ESC + 'E' + '\x01'; // Negrita ON
            commands += this.GS + '!' + '\x11'; // Tamaño 2x
            commands += 'TICKET DE ENVIO\n';
            commands += this.GS + '!' + '\x00'; // Tamaño normal
            commands += this.ESC + 'E' + '\x00'; // Negrita OFF

            commands += '\n';
            commands += `Folio: #${shipment.id}\n`;
            commands += `${shipment.date || new Date().toLocaleDateString()}\n`;
            commands += '--------------------------------\n\n';

            // Alinear a la izquierda
            commands += this.ESC + 'a' + '\x00';

            // Remitente
            commands += this.ESC + 'E' + '\x01'; // Negrita ON
            commands += 'REMITENTE\n';
            commands += this.ESC + 'E' + '\x00'; // Negrita OFF
            commands += `${shipment.sender_name}\n`;
            commands += `Tel: ${shipment.sender_phone}\n\n`;

            // Destinatario
            commands += this.ESC + 'E' + '\x01'; // Negrita ON
            commands += 'DESTINATARIO\n';
            commands += this.ESC + 'E' + '\x00'; // Negrita OFF
            commands += `${shipment.recipient_name}\n`;
            commands += `${shipment.recipient_address}\n`;
            commands += `CP: ${shipment.recipient_postal_code}\n`;
            commands += `${shipment.recipient_state}\n`;
            commands += `Tel: ${shipment.recipient_phone}\n\n`;

            // Servicio
            commands += this.ESC + 'E' + '\x01'; // Negrita ON
            commands += 'SERVICIO\n';
            commands += this.ESC + 'E' + '\x00'; // Negrita OFF
            commands += `${shipment.service_type}\n`;
            commands += `${shipment.carrier}\n\n`;

            // Línea
            commands += '--------------------------------\n';

            // Precios
            commands += `Precio:     $${shipment.price.toFixed(2)}\n`;
            commands += `IVA:        $${shipment.iva.toFixed(2)}\n`;
            commands += `Descuento: -$${shipment.discount.toFixed(2)}\n\n`;

            // Total en negrita
            commands += this.ESC + 'E' + '\x01'; // Negrita ON
            commands += this.GS + '!' + '\x11'; // Tamaño 2x
            commands += `TOTAL: $${shipment.total.toFixed(2)}\n`;
            commands += this.GS + '!' + '\x00'; // Tamaño normal
            commands += this.ESC + 'E' + '\x00'; // Negrita OFF

            commands += '\n';

            // Centrar footer
            commands += this.ESC + 'a' + '\x01';
            commands += 'Gracias por su preferencia\n\n\n';

            // Cortar papel (si la impresora lo soporta)
            commands += this.GS + 'V' + '\x01';

            // Enviar comandos a la impresora
            await this.writeToCharacteristic(commands);

            console.log('Ticket impreso exitosamente');
            return { success: true };

        } catch (error) {
            console.error('Error al imprimir:', error);
            throw error;
        }
    }

    /**
     * Escribir datos a la característica
     */
    async writeToCharacteristic(data) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);

        // Dividir en chunks de 20 bytes (límite común de BLE)
        const chunkSize = 20;
        for (let i = 0; i < encoded.length; i += chunkSize) {
            const chunk = encoded.slice(i, Math.min(i + chunkSize, encoded.length));
            await this.characteristic.writeValue(chunk);
            // Pequeña pausa entre chunks
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    /**
     * Verificar si Web Bluetooth API está disponible
     */
    isBluetoothAvailable() {
        return 'bluetooth' in navigator;
    }

    /**
     * Obtener estado de conexión
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            deviceName: this.device ? this.device.name : null,
            isAvailable: this.isBluetoothAvailable()
        };
    }

    /**
     * Agregar listener para eventos
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remover listener
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Notificar a todos los listeners
     */
    notifyListeners(event, data = null) {
        this.listeners.forEach(callback => {
            callback(event, data);
        });
    }
}

// Crear instancia global única (singleton)
const bluetoothPrinter = new BluetoothPrinterService();

// Exponer globalmente
window.bluetoothPrinter = bluetoothPrinter;
