# GigiCheck

## Register

product

## Users

Herramienta personal, no oficial, para una trabajadora de farmacia que registra faltantes durante su turno desde un iPhone. La plataforma principal es una web instalable desde Safari en la pantalla de inicio. Quien recibe el reporte puede leer el PDF sin instalar la app.

## Product Purpose

Registrar productos faltantes con foto opcional y cantidad escrita por la usuaria, conservar conteos e historial localmente y compartir un PDF. El flujo principal funciona sin conexión después de la primera carga completa. La IA es opcional: sugiere identidad editable de un solo producto por foto; la usuaria revisa y confirma. Nunca infiere cantidades ni decisiones médicas.

## Platform Decision

La aclaración posterior de la usuaria sustituye el objetivo Android/Expo del PRD: React, Vite y TypeScript estricto para una PWA en Safari de iPhone, sin publicación en App Store. IndexedDB conserva registros y fotos; un service worker conserva los recursos necesarios para abrirla sin conexión. Las credenciales del proveedor de IA permanecen en el servidor. HTTPS es necesario para las funciones web protegidas.

El almacenamiento del navegador puede borrarse desde Ajustes o por sus políticas de almacenamiento. Solicitar persistencia cuando esté disponible, gestionar errores de cuota y mantener la exportación PDF accesible. La instalación y las pruebas en un iPhone físico siguen siendo necesarias para validar cámara, modo sin conexión y compartir.

## Brand Personality

Cercana, ordenada, tranquila. Interfaz en español con instrucciones breves, cantidades legibles y confirmaciones explícitas. La referencia visual elegida por la usuaria es “Tinta violeta”.

## Anti-references

Evitar la apariencia de un sistema corporativo oficial, tablas de inventario complejas y paneles administrativos. No añadir cuentas, sincronización, integración de farmacia, códigos de barras ni inferencia automática de existencias al MVP.

## Design Principles

- Capturar un faltante debe requerir pocos pasos durante un turno real.
- Mostrar siempre qué escribió la usuaria y qué sugirió la IA.
- Conservar el control humano antes de agregar un producto.
- Priorizar lectura, persistencia local y recuperación de errores.
- Compartir un documento claro, independiente de la app.

## Accessibility & Inclusion

Usar etiquetas accesibles, contraste suficiente y controles táctiles de al menos 48 píxeles CSS. Admitir ampliación de texto, evitar información transmitida solo por color y respetar movimiento reducido. La cantidad es un entero de 1 a 999 unidades de venta.

## Sources

- [PRD](PRD_GigiCheck.docx).
- [Referencia visual guardada](docs/design/gigicheck-tinta-violeta-reference.png).
- [Sistema visual](DESIGN.md).
- [Instalación web en iPhone, Apple](https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios/26).
- [Política de almacenamiento de WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/).
