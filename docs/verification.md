# Verificación del MVP

## Alcance vigente

La aclaración de la usuaria cambia el objetivo a una web instalable en Safari de iPhone. El PRD sigue definiendo el comportamiento del conteo; sus APIs nativas Android/Expo se sustituyen por capacidades web. No se ha probado todavía en un iPhone físico.

## Comprobaciones realizadas

- Backend: `npm test` en `server/`, 15 pruebas aprobadas después de añadir CORS y pruebas del adaptador real sin llamadas externas.
- Backend: `npm run typecheck` aprobado.
- Revisados contrato estricto de IA, autenticación revocable, límites de imagen, eliminación de EXIF, cuota y timeout del proveedor.
- La interfaz PWA está en implementación; sus pruebas, compilación y comportamiento sin conexión aún no están verificados.

## Criterios de aceptación pendientes

- IndexedDB: guardar conteo, foto y borrador; recargar y recuperar los mismos datos. Un fallo de cuota no puede anunciar guardado.
- Confirmación atómica e idempotente, un solo conteo activo, cantidades enteras de 1 a 999 y duplicados con decisión explícita.
- Edición recuperable, eliminación/deshacer durante ocho segundos, historial cerrado de solo lectura y reapertura controlada.
- Service worker: abrir y recargar sin conexión tras la primera carga, sin interceptar o almacenar fotos/respuestas de IA.
- iPhone: instalación desde Safari, cámara, cancelar captura, vista previa, zonas seguras, teclado, VoiceOver y texto ampliado.
- IA: consentimiento por envío, foto orientada sin EXIF, timeout de 30 segundos, sin reintento automático y rechazo de resultados obsoletos.
- PDF offline: casos de 1, 20 y 100 productos, acentos/nombres largos, páginas legibles, totales correctos y fotos opcionales.
- Compartir PDF mediante un toque directo; cancelar no equivale a enviar ni debe perder el documento. Ofrecer abrir/descargar como alternativa.
- Borrado local confirmado y recuperación frente a almacenamiento no disponible.

## Fuentes primarias de plataforma

- [Apple: agregar una web como app en iPhone](https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios/26).
- [WebKit: modo web app en Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
- [WebKit: almacenamiento, persistencia y errores de cuota](https://webkit.org/blog/14403/updates-to-storage-policy/).
- [W3C: compartir archivos y activación por el usuario](https://www.w3.org/TR/web-share/).
- [W3C: captura desde un selector de archivos](https://www.w3.org/TR/html-media-capture/).

La instalación no garantiza almacenamiento permanente: el navegador decide si concede persistencia. La validación automatizada no sustituye las comprobaciones de cámara, compartir y modo instalado en el teléfono objetivo.
