# GigiCheck · Tinta violeta

## Reference

[Imagen original elegida por la usuaria](docs/design/gigicheck-tinta-violeta-reference.png). Se conserva completa, sin recortes ni modificaciones. Es la fuente visual principal para el MVP web instalable en iPhone; los textos y datos de ejemplo no son datos iniciales del producto.

## Atmosphere

Una trabajadora registra faltantes con una mano durante su turno en farmacia. La referencia solicitada fija una superficie oscura de tinta violeta, lectura clara, acentos lavanda y un tono amable. El contenido y la acción principal predominan sobre la decoración.

## Colors

Estrategia restringida: superficies oscuras teñidas de violeta y un acento para acciones y selección. Valores sRGB de referencia y equivalentes OKLCH para la implementación web:

| Rol | sRGB | OKLCH |
| --- | --- | --- |
| Fondo tinta | `#100D17` | `oklch(0.1680 0.0211 297.87)` |
| Superficie elevada | `#1B1525` | `oklch(0.2111 0.0320 300.93)` |
| Texto principal | `#F8F4FC` | `oklch(0.9725 0.0114 308.33)` |
| Texto secundario | `#D5C3ED` | `oklch(0.8455 0.0607 304.57)` |
| Acción primaria | `#8E50C8` | `oklch(0.5597 0.1823 305.04)` |
| Lavanda clara | `#C9ACE8` | `oklch(0.7901 0.0889 306.47)` |
| Separador violeta | `#8B6CAC` | `oklch(0.5869 0.1011 305.76)` |

Texto principal sobre acción primaria supera 4.5:1. Usar texto oscuro sobre lavanda clara. Los separadores no sirven como texto secundario. Verificar contraste al introducir nuevos estados.

## Typography

- Serif expresiva solo en el saludo de conteo y título del PDF, como en la referencia; preferir Georgia disponible o una serif distribuida con licencia verificada.
- Sans del sistema para navegación, formularios, botones, listas y cifras. Mantener una sola familia funcional.
- Título editorial 2.5–2.75 rem; encabezados funcionales 1.375–1.5 rem; texto y botones 1–1.125 rem; metadatos 0.875–1 rem. Cantidad central 3.5–4 rem.
- Respetar escalado de texto y permitir saltos sin cortar etiquetas ni acciones.

## Layout and Components

- Márgenes laterales de 20–24 píxeles CSS y escala de espaciado de 4, 8, 12, 16, 24 y 32 píxeles CSS.
- Conteo: marca discreta, saludo serif, fecha y turno, resumen de productos/unidades, lista con separadores finos y acciones al pie.
- Fila de producto: miniatura cuadrada de 56–64 píxeles CSS con radio 12, nombre y presentación, cantidad alineada al extremo. Evitar tarjetas anidadas.
- Botón primario violeta sólido de al menos 52 píxeles CSS de alto y radio 12. Secundario con contorno lavanda de 1 píxel CSS. Iconos del mismo estilo de trazo.
- Captura: usar el selector de cámara/foto del iPhone y una revisión visible antes de guardar. La entrada manual debe estar siempre disponible. Mostrar permisos/errores y cancelar sin perder el borrador.
- Revisión: foto pequeña, sugerencia de IA identificada cuando exista, campos editables, cantidad manual con botones menos/más y confirmación final.
- PDF: hoja clara, tipografía oscura, encabezado editorial, tabla legible, separadores violetas y total. El color nunca es necesario para comprenderlo impreso.
- Navegación inferior con Conteo e Historial; selección lavanda y etiqueta visible. Evitar información importante bajo zonas seguras.
- Usar `viewport-fit=cover`, zonas seguras con `env(safe-area-inset-*)` y altura dinámica del viewport. Los formularios deben seguir accesibles con el teclado abierto y al ampliar texto.
- La instalación en iPhone se explica como Safari → Compartir → Agregar a inicio → Abrir como app web. No depender de una invitación automática de instalación.
- Generar el PDF antes de ofrecer Compartir: la hoja nativa requiere un toque directo. Ofrecer abrir o descargar cuando compartir archivos no esté disponible.

## States and Motion

El conteo vacío explica cómo agregar el primer producto. Guardado, carga, error y deshabilitado deben tener texto o affordance reconocible. La IA nunca se presenta como resultado confirmado. Transiciones de 150–250 ms y ninguna animación imprescindible para entender el flujo; respetar movimiento reducido.

## Illustration

La referencia contiene un personaje ilustrado reconocible. Conservar la imagen como guía visual; no extraer ni distribuir ese personaje como asset de la app sin confirmar los derechos de uso. Usar decoración propia discreta si se necesita ilustración.

## Verification

Comparar Conteo, Captura, Revisión y PDF con la referencia. Revisar Safari y modo instalado en iPhone, pantalla pequeña, texto ampliado, controles de 48 píxeles CSS, teclado abierto, estados vacíos/errores y contraste. Probar recarga sin conexión y recuperación de fotos/borradores. Mantener íntegro el original con SHA-256 `7EAA15BCD154746B05F1B1100E2D03F596AF59A0CBDD79F901B2D5D779771895`.
