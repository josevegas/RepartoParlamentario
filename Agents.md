# Agents.md - Reparto Parlamentario

Este documento describe las reglas y la lógica para el reparto de escaños en las cámaras de Senadores y Diputados.

## Cámara: Senadores
### Estructura
- **Distritos Totales**: 28
- **Reparto de Escaños por Distrito**:
  - Distrito 1: 30 escaños.
  - Distrito 2: 4 escaños.
  - Distritos 3 al 28: 1 escaño cada uno.

### Reglas de Asignación
1. **Distritos de 1 Escaño**: El partido que obtenga la mayor votación en el distrito gana el escaño (Ganador único).
2. **Distrito de 4 Escaños**: Los escaños se reparten de manera proporcional entre todos los partidos según sus votos en el distrito.
3. **Distrito de 30 Escaños**: 
   - Solo participan los partidos que obtengan el **5% o más** de los votos en este distrito específico.
   - Los escaños se reparten proporcionalmente entre los partidos elegibles.
4. **Totalización**: Se suman los escaños obtenidos por cada partido en todos los distritos.

### Verificación Final (Por Partido)
Un partido conserva sus escaños solo si cumple con **TODAS** las siguientes condiciones:
- **Umbral Nacional**: Más del 5% del total de votos nacionales.
- **Umbral de Escaños**: Al menos 3 escaños obtenidos.
- **Representación Geográfica**: Escaños en al menos 2 distritos diferentes.

**Redistribución**: Si un partido no cumple con las condiciones anteriores, sus escaños se retiran y se reparten de manera proporcional entre los partidos que **sí** cumplen con todas las condiciones.

---

## Cámara: Diputados
### Estructura
- **Distritos Totales**: 27
- **Reparto de Escaños**: Variable por distrito.

### Reglas de Asignación
1. **Reparto Proporcional**: En cada distrito, los escaños se reparten de manera proporcional a los votos alcanzados por los partidos en ese distrito.
2. **Totalización**: Se suman los escaños obtenidos por cada partido en todos los distritos.

### Verificación Final (Por Partido)
Un partido conserva sus escaños solo si cumple con **TODAS** las siguientes condiciones:
- **Umbral Nacional**: Más del 5% del total de votos nacionales.
- **Umbral de Escaños**: Al menos 7 escaños obtenidos.
- **Representación Geográfica**: Escaños en al menos 2 distritos diferentes.

**Redistribución**: Si un partido no cumple con las condiciones anteriores, sus escaños se retiran y se reparten de manera proporcional entre los partidos que **sí** cumplen con todas las condiciones.
