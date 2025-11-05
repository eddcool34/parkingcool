# Guía de Configuración de Impresora Bluetooth

## Resumen de Cambios

Se ha implementado una **conexión Bluetooth persistente** para impresoras térmicas que **NO se interrumpe al navegar entre páginas** (Nuevo Envío, Historial, Reportes).

## Características Implementadas

### 1. Servicio Bluetooth Persistente
- **Conexión global** que se mantiene activa durante toda la sesión
- **No se desconecta** al cambiar de vista o página
- **Reconexión automática** si se pierde la conexión
- Patrón Singleton para garantizar una única instancia

### 2. Interfaz de Usuario
- **Indicador de estado** en la cabecera (punto verde/gris con animación)
- **Botones de conexión/desconexión** siempre visibles
- **Notificaciones** de estado de conexión e impresión
- **Botón de impresión Bluetooth** disponible en:
  - Formulario de registro (después de guardar)
  - Historial de envíos (cada fila)

### 3. Impresión Directa
- Protocolo **ESC/POS** para impresoras térmicas
- Formato optimizado para papel de **80mm**
- Incluye toda la información del envío

## Requisitos

### Navegador Compatible
La Web Bluetooth API solo está disponible en:
- **Google Chrome** (versión 56+)
- **Microsoft Edge** (versión 79+)
- **Opera** (versión 43+)

**NO funciona en:**
- Firefox (no soporta Web Bluetooth)
- Safari (no soporta Web Bluetooth)

### Impresora Bluetooth
- Impresora térmica con soporte Bluetooth
- Compatible con protocolo ESC/POS
- Ejemplos: Impresoras POS de 80mm comunes

## Cómo Usar

### Paso 1: Conectar la Impresora

1. Enciende tu impresora Bluetooth y asegúrate de que esté en modo de emparejamiento
2. En la aplicación web, haz clic en **"Conectar Impresora"** (esquina superior derecha)
3. Aparecerá una ventana del navegador mostrando dispositivos Bluetooth disponibles
4. Selecciona tu impresora de la lista
5. El indicador cambiará a **verde** y mostrará el nombre de la impresora

### Paso 2: Imprimir Tickets

#### Desde el Formulario de Registro:
1. Registra un nuevo envío
2. Después de guardar, aparecerá el botón **"🖨️ Imprimir Bluetooth"**
3. Haz clic para imprimir el ticket directamente

#### Desde el Historial:
1. Ve a la pestaña **"Historial"**
2. Cada envío tendrá un botón **"🖨️ Imprimir"** (si hay conexión)
3. Haz clic para reimprimir cualquier ticket

### Paso 3: Mantenimiento de Conexión

La conexión se mantiene **automáticamente**:
- ✅ Al cambiar de pestaña (Nuevo Envío → Historial → Reportes)
- ✅ Al registrar múltiples envíos
- ✅ Al navegar por el historial
- ✅ Reconexión automática si se pierde la señal

Para desconectar manualmente:
- Haz clic en **"Desconectar"** en la esquina superior derecha

## Arquitectura Técnica

### Archivos Creados/Modificados

```
parkingcool/
├── public/
│   ├── js/
│   │   ├── bluetoothPrinter.js    # ✨ NUEVO: Servicio Bluetooth
│   │   └── app.js                  # ✏️ Modificado: Integración Bluetooth
│   ├── index.html                  # ✏️ Modificado: UI Bluetooth
│   └── css/
│       └── styles.css              # ✏️ Modificado: Estilos Bluetooth
```

### Flujo de Funcionamiento

1. **Inicialización**:
   - `bluetoothPrinter.js` se carga primero
   - Crea una instancia global singleton
   - Configura listeners de eventos

2. **Conexión**:
   - Usuario hace clic en "Conectar Impresora"
   - Web Bluetooth API solicita selección de dispositivo
   - Se establece conexión GATT
   - Se buscan servicios y características compatibles

3. **Impresión**:
   - Se obtienen datos del envío desde el API
   - Se convierten a comandos ESC/POS
   - Se envían en chunks de 20 bytes (límite BLE)
   - Se muestra notificación de éxito/error

4. **Persistencia**:
   - La conexión se almacena en el objeto global `window.bluetoothPrinter`
   - No se destruye al cambiar de vista (SPA)
   - Listeners detectan desconexiones y reconectan automáticamente

## Solución de Problemas

### La impresora no aparece en la lista
- Verifica que la impresora esté encendida y en modo emparejamiento
- Asegúrate de que Bluetooth esté activado en tu dispositivo
- Intenta desemparejar y volver a emparejar desde la configuración de Bluetooth del sistema

### Error de conexión
- Verifica que uses Chrome o Edge (navegadores compatibles)
- La impresora debe ser BLE (Bluetooth Low Energy) compatible
- Algunas impresoras requieren emparejamiento previo en el sistema operativo

### La impresora se desconecta
- La reconexión automática intentará restablecer la conexión cada 2 segundos
- Si persiste, verifica el rango de señal Bluetooth
- Revisa la batería de la impresora (si es portátil)

### El texto impreso se ve cortado
- La implementación usa formato de 80mm estándar
- Verifica la configuración de papel de tu impresora
- Algunas impresoras pueden requerir ajustes en el código ESC/POS

## Comandos ESC/POS Utilizados

El servicio usa los siguientes comandos estándar:
- `ESC @` - Inicializar impresora
- `ESC a` - Alinear texto (izquierda/centro)
- `ESC E` - Activar/desactivar negrita
- `GS !` - Tamaño de fuente
- `GS V` - Cortar papel

## Próximos Pasos (Opcionales)

Para mejorar aún más la funcionalidad:

1. **Impresión de códigos de barras**:
   ```javascript
   // Agregar comando GS k en bluetoothPrinter.js
   commands += this.GS + 'k' + '\x49' + folio;
   ```

2. **Configuración de impresora**:
   - Permitir ajustar densidad de impresión
   - Configurar número de copias

3. **Logo de empresa**:
   - Agregar comando ESC * para imprimir logo
   - Requiere conversión de imagen a formato ESC/POS

## Soporte

Para más información sobre Web Bluetooth API:
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- https://web.dev/bluetooth/

Para comandos ESC/POS:
- https://reference.epson-biz.com/modules/ref_escpos/
