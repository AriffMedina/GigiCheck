# Servicio opcional de identificación

El conteo manual y el PDF funcionan sin este servicio. Node 24 o posterior.
No hay despliegue ni llamadas reales realizadas como parte de esta implementación.

```powershell
cd server
npm ci
Copy-Item .env.example .env
node scripts/create-device.mjs
# Editar .env con el registro hash del dispositivo y los orígenes exactos de la PWA.
node --env-file=.env --import tsx src/index.ts
```

`AI_MODE=mock` solo está permitido en desarrollo. Devuelve identidad vacía y una advertencia
de simulación, con `X-GigiCheck-Mode: mock`; nunca representa un producto reconocido.
Para IA real configurar `AI_MODE=gemini`, `GEMINI_API_KEY` y `GEMINI_MODEL` (un modelo de Gemini con
entrada de imagen y salida JSON Schema). Clave y modelo permanecen en el servidor; una sola llamada sin
reintentos. En el nivel gratuito de la API de Gemini, Google puede usar el contenido para mejorar sus productos.

## Despliegue en Vercel

Crear un proyecto de Vercel con *Root Directory* `server/`. `api/identify-product.ts` es la función y
`vercel.json` reescribe `/v1/identify-product` hacia ella; Vercel aporta el HTTPS. Variables de entorno:
`AI_MODE=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `DEVICE_TOKENS_JSON` y `CORS_ORIGINS_JSON` con la URL
exacta de la PWA. Los límites diarios y de concurrencia viven en memoria de cada instancia, así que en
Vercel son aproximados.

El token se genera por dispositivo y el servidor solo recibe su SHA-256 en configuración.
Revocar: marcar `enabled:false` y reiniciar. Rotar: generar otro token, reemplazar el hash,
reiniciar y actualizar el dispositivo; no compartir tokens entre teléfonos. La PWA transmite
`Authorization: Bearer …`. No introducir claves del proveedor en el navegador.

Producción exige `NODE_ENV=production`, certificado válido y `TLS_KEY_PATH`/`TLS_CERT_PATH`.
La PWA debe usar HTTPS para cámara, instalación, service worker y acceso al servicio.
`CORS_ORIGINS_JSON` contiene únicamente orígenes exactos, sin rutas ni comodines.
En desarrollo permite `http://localhost:5173`; para un iPhone usa una URL HTTPS alcanzable
desde el teléfono y añádela a la lista. No desplegar `server/` en un hosting estático.

## Contrato

`POST /v1/identify-product`, multipart con exactamente `image` (JPEG/PNG), `requestId`,
`draftId`, `imageRevision` (entero no negativo como texto) y `schemaVersion` (`1`).
IDs de 1–100 caracteres alfanuméricos, guion o guion bajo. No enviar cantidad ni datos del turno.
Límites: 2 MiB de imagen, lado mayor 1600 px, una petición simultánea por dispositivo,
100 intentos/día UTC. El servidor decodifica y reencodifica para eliminar EXIF antes del proveedor.
Timeout de lectura/análisis de 30 segundos. Procesamiento exclusivamente en memoria.

Respuesta: `{requestId,imageRevision,status,suggestion:{name,brand,presentation,category,warnings}}`.
Las cuatro propiedades de identidad admiten `null`; textos de hasta 200 caracteres y máximo
cinco advertencias. Nunca hay cantidad, inventario ni confianza numérica. Todos los campos
son obligatorios, se rechazan extras. `identified` necesita un nombre no vacío.
Errores: 400 datos, 401 token, 403 revocado/origen, 413 tamaño, 415 formato, 429 cuota,
502 proveedor/JSON inválido, 504 timeout. Cuerpo `{error:{code,requestId?}}` sin diagnósticos sensibles.

Limitación actual: cuotas y exclusión concurrente residen en memoria de una única instancia.
Un reinicio reinicia la cuota; antes de exponer el servicio a un piloto compartido, incorporar
un almacén de cuota persistente y un límite global en el proxy. No se registra foto, identidad,
respuestas, token ni cantidades. Solo se imprime modo/puerto de inicio y código fijo de fallo.

```powershell
npm run typecheck
npm test
npm audit --omit=dev
```

Documentación usada: [Gemini: comprensión de imágenes](https://ai.google.dev/gemini-api/docs/image-understanding),
[Gemini: salida estructurada](https://ai.google.dev/gemini-api/docs/structured-output),
[eliminación de metadatos con sharp](https://sharp.pixelplumbing.com/api-output/).
