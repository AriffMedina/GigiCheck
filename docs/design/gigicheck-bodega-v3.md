# GigiCheck · Bodega v3

Estado: propuesta visual, sin implementar. Imagen generada con `image_gen` integrado.

[Imagen](gigicheck-bodega-v3.png). La referencia original permanece intacta.

## Flujo

1. Preparar lista: agregar fotos, productos y unidades previstas. «Iniciar conteo» abre el panel operativo.
2. En bodega: la pantalla principal permite registrar las unidades bajadas con controles táctiles.
3. Terminado: confirmar el cierre; puede admitirse terminar con pendientes mediante confirmación explícita.

## Panel operativo

- Progreso semicircular por unidades, nunca por cantidad de productos.
- Ejemplo: Electrolit 2 de 6 y Antiflu-Des 2 de 4 son 4 de 10, 40% completado y 6 pendientes.
- Cada toque en + registra una unidad y la guarda; − corrige y Deshacer revierte el último movimiento.
- Rango de cada contador: cero a su objetivo. Desactivar + al llegar al objetivo y − en cero.
- Mantener las filas en su posición para evitar cambios bajo el dedo; señalar las completas con ✓.
- El nombre del producto no completa ni reinicia su contador.
- Sin teclado ni botón Registrar en el uso habitual.
- «Compartir conteo» aparece al pie, sin preview PDF, y no cierra el conteo.
- Snoopy acompaña el progreso y la confirmación final sin competir con los controles.
- Conservar tinta violeta, superficies ciruela suaves, controles lavanda y jerarquía cómoda para iPhone.

## Dirección de generación

El prompt siguiente es la dirección base entregada por el subagente. El agente principal la amplió para la generación final; no se presenta como transcripción exacta de su llamada.

Create one polished horizontal presentation containing TWO large complete iPhone app screens side by side, identical scale, restrained titanium frames, accurate safe areas and highly readable Spanish typography. GigiCheck, dark violet ink #100D17, soft plum elevated surfaces, off-white text, light lavender primary actions, refined Apple-quality spacing and comfortable one-handed controls. Small recognizable black-and-white Snoopy in classic Peanuts style, holding a clipboard, friendly and secondary to the task. No Apple logos.

Screen 1 “Preparar lista”: date “16 nov · Vespertino”, two product rows with realistic small thumbnails: “Electrolit Fresa · 625 ml”, “6 unidades”; “Antiflu-Des · 24 cápsulas”, “4 unidades”; summary “2 productos · 10 unidades”, secondary “Agregar producto”, large bottom primary “Iniciar conteo”.

Screen 2 “En bodega”: an elegant lavender semicircular progress gauge, exact text “40% completado”, “4 de 10 unidades bajadas”, “Faltan 6”; Snoopy small beside the gauge. Product row 1 “Electrolit Fresa”, “Bajadas 2 de 6”, “Faltan 4”; row 2 “Antiflu-Des”, “Bajadas 2 de 4”, “Faltan 2”. Each row has large clearly tappable minus, count 2, plus controls, with the plus the strongest affordance. Quiet saved confirmation. One unobtrusive full-width outlined “Compartir conteo” button below the list. Compact bottom navigation “Conteo” selected, “Historial” unselected. No PDF preview, no keyboard, no Registrar button, no export controls at the top. Calm, delightful, clear hierarchy, generous touch areas, no crowded cards or decorative charts.
