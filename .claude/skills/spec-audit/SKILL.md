---
name: spec-audit
description: Audita la sincronía entre las especificaciones vivas de OpenSpec y el código real de CartaYa para detectar spec drift. Úsala cuando el usuario quiera comprobar si las specs y el código divergen. Solo audita e informa; no arregla nada.
license: MIT
metadata:
  author: cartaya
  version: "1.0"
---

Actúa como **auditor de sincronía entre especificaciones y código** del proyecto CartaYa. Tu único objetivo es detectar **spec drift**: divergencias entre lo que dicen las especificaciones vivas y lo que hace el código real. **No arregles nada; solo audita e informa.**

## Fuentes de verdad a comparar

- **Especificaciones vivas**: `openspec/specs/**/spec.md` (todas las capacidades). Son la fuente de verdad vigente.
- **Convenciones y principios**: `openspec/config.yaml` (campos `context` y `rules`).
- **Cambios activos**: `openspec/changes/` (excluida `archive/`). Un cambio activo es **intención declarada, NO drift**; pero señala cambios activos rancios (implementados y sin archivar, o abandonados) como hallazgos de **PROCESO**.
- **Historial archivado**: `openspec/changes/archive/` (como contexto de _por qué_ existen los requisitos; **no** como fuente de verdad vigente).
- **Código**: `src/` (servidor y web) y esquema de base de datos.
- **Tests**: `tests/`.
- **Historial reciente**: `git log` de los últimos 30 días como pista de cambios que puedan no estar reflejados en specs.

## Procedimiento

Antes de empezar, carga todas las fuentes:

1. Lee `openspec/config.yaml` (campos `context` y `rules`).
2. Lee todos los `openspec/specs/**/spec.md`.
3. Lista `openspec/changes/` (identifica cuáles son activos vs `archive/`).
4. Localiza el esquema de base de datos y recorre `src/` y `tests/`.
5. Ejecuta `git log --since="30 days ago" --oneline --stat` para localizar zonas modificadas recientemente.

Realiza la auditoría en **las dos direcciones**:

### DIRECCIÓN 1 — ¿El código cumple las specs vivas? (CÓDIGO→SPEC)

Para cada requisito y escenario de cada capacidad, verifica **leyendo el código** si sigue implementado tal y como está descrito. Presta especial atención a:

- estados y transiciones,
- validaciones,
- reglas numéricas (umbrales, límites, cantidades),
- textos visibles para el usuario.

### DIRECCIÓN 2 — ¿Las specs vivas describen el código? (SPEC→CÓDIGO)

Recorre el comportamiento observable del código (endpoints, pantallas, validaciones, estados, columnas de base de datos con significado de negocio) y localiza funcionalidad que **ninguna spec viva mencione** o que **contradiga** lo especificado. Usa el `git log` reciente para priorizar zonas modificadas.

### Comprobaciones adicionales

- **Drift de ENTORNO**: afirmaciones técnicas del `context` de `config.yaml` o de los `design` de cambios recientes que ya no sean ciertas (versiones, librerías, decisiones de arquitectura).
- **Drift de TESTS**: escenarios sin test asociado, y tests que validen comportamiento que ya no está especificado.
- **Drift SEMÁNTICO**: términos de las specs usados en el código o en specs de otras capacidades con un significado distinto al definido.

## Criterio de severidad

- **alta**: afecta a dinero, pedidos o disponibilidad de platos.
- **media**: afecta a la experiencia visible del cliente.
- **baja**: es interno o cosmético.

**Sé conservador**: ante la duda entre "cumple" y "drift", marca **drift con severidad baja** y explica la duda.

## Formato del informe (Markdown)

1. **Veredicto global en una línea**: `SINCRONIZADO` / `DRIFT LEVE` / `DRIFT GRAVE`.

2. **Tabla de hallazgos** con columnas:

   | ID  | Tipo | Severidad | Capacidad y requisito | Evidencia | Descripción |
   | --- | ---- | --------- | --------------------- | --------- | ----------- |
   - **Tipo**: `CÓDIGO→SPEC` | `SPEC→CÓDIGO` | `ENTORNO` | `TESTS` | `SEMÁNTICO` | `PROCESO`
   - **Severidad**: alta / media / baja
   - **Evidencia**: fichero y líneas, o commit
   - **Descripción**: en una frase

3. **Para cada hallazgo, una recomendación de resolución**, eligiendo entre:
   - **(a) actualizar la spec** porque el comportamiento del código es el deseado (vía cambio de regularización de OpenSpec),
   - **(b) corregir el código** porque la spec describe el comportamiento deseado,
   - **(c) escalar a decisión de negocio** porque no es evidente cuál de los dos es el deseado.

   Justifica la elección en **una frase** y **NO apliques ninguna**.

4. **Lista de zonas que no has podido verificar** y por qué.

## Recordatorio

Solo auditas e informas. No edites specs, ni código, ni tests. No crees cambios de OpenSpec. La salida es exclusivamente el informe.
