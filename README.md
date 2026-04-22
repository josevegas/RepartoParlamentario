# RepartoParlamentario - Simulación de Asignación de Escaños

Este proyecto permite simular el reparto de escaños en las cámaras de Senadores y Diputados de Perú, basándose en las reglas definidas en `Agents.md` y consumiendo datos reales de la ONPE.

## Características Principales

- **Consumo de Datos ONPE**: Integración con los endpoints oficiales de la ONPE para obtener resultados en tiempo real.
- **Lógica Proportional**: Implementación del método de resto mayor para la asignación de escaños.
- **Verificación de Umbrales**: Validación de requisitos nacionales (>5% votos), mínimos de escaños y representación geográfica.
- **Sincronización Automatizada**: Herramienta de sincronización que mapea automáticamente partidos y consolida votos por distrito.

## Estructura del Proyecto

- `backend/`: Servidor Node.js con Express y MongoDB.
  - `services/electoralDataService.js`: Lógica de consumo de la API de la ONPE.
  - `services/onpeSyncService.js`: Sincronización y persistencia en base de datos.
  - `utils/allocation.js`: Motor de cálculo de reparto parlamentario.
- `frontend/`: Aplicación React con una interfaz moderna y responsiva.

## Cómo Sincronizar Datos

Para cargar los votos oficiales de la ONPE:
1. Dirígete a la pestaña **Configuración**.
2. Desplázate hasta la sección **Sincronización de Datos ONPE**.
3. Haz clic en **Sincronizar Todo con ONPE**.
4. Una vez completado, los votos se cargarán automáticamente en las vistas de Senadores y Diputados.

## Requisitos Técnicos

- Node.js 18+ (utiliza `fetch` nativo).
- MongoDB (para almacenamiento de partidos, distritos y votos).

---
© 2026 Reparto Parlamentario - José Luis Vegas Márquez
