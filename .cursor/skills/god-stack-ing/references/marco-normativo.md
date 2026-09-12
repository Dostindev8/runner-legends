# MARCO NORMATIVO DE CALIDAD DE SOFTWARE
## GOD-STACK-ING v8.0 · Fuente: PDF Edición Normativa 2.0 (LCS)

> Autor: Dostin Santana — Logic Code Spot  
> “Generar código no es lo mismo que construir software de calidad, seguro, mantenible y gobernable.  
> **El token produce código; la ingeniería produce software que puede sobrevivir en producción.**”

Esta capa **no es opcional**: cada entregable —desde un fix de 5 líneas hasta una arquitectura— se filtra contra estos estándares antes de “terminado”.

---

## ISO/IEC 25010 (SQuaRE) — Calidad del Producto

| # | Característica | Pregunta de validación obligatoria |
|---|---|---|
| 1 | Adecuación funcional | ¿Hace exactamente lo que el requisito pide, ni más ni menos? |
| 2 | Eficiencia de desempeño | ¿Tiempo de respuesta, recursos y capacidad dentro de presupuesto (CWV, latencia p99)? |
| 3 | Compatibilidad | ¿Coexiste e interoperá sin conflicto (APIs, formatos)? |
| 4 | Usabilidad | ¿Reconocible, aprendible, operable y accesible (WCAG 2.2)? |
| 5 | Fiabilidad | ¿Madurez, disponibilidad, tolerancia a fallos, recuperabilidad (SLA/SLO)? |
| 6 | Seguridad | ¿Confidencialidad, integridad, no-repudio, autenticidad, accountability? |
| 7 | Mantenibilidad | ¿Modularidad, reusabilidad, analizabilidad, modificación y testeo? |
| 8 | Portabilidad | ¿Adaptabilidad, instalabilidad, reemplazo entre entornos? |

**Regla:** todo PR/entrega nombra en 1 línea qué característica(s) mejora o pone en riesgo. Si no se puede nombrar ninguna, la tarea no está bien definida.

---

## ISO/IEC/IEEE 12207 — Ciclo de Vida

```
├── Procesos de Acuerdo      → Qué se contrata/entrega, alcance
├── Procesos Habilitantes    → Gestión de proyecto, calidad, config, infraestructura
├── Procesos Técnicos        → Requisitos → Análisis → Diseño → Construcción →
│                              Integración → Pruebas → Transición → Operación →
│                              Mantenimiento → Disposición
└── Gestión de Proyecto      → Planificación, control, riesgo, decisión, información
```

**Regla:** ningún Feature Build omite trazabilidad requisito → diseño → código → prueba. Si el usuario no da el requisito, declararlo en 1 línea antes de construir.

---

## ISO/IEC/IEEE 29119 — Testing

| Parte | Enfoque | Aplicación en este skill |
|---|---|---|
| 1 | Conceptos | Vocabulario común |
| 2 | Procesos | Plan → Monitor → Analysis → Design → Impl → Exec → Completion |
| 3 | Documentación | Test Plan, Cases, Log, Incident, Completion Report |
| 4 | Técnicas | Equivalence / boundary / branch / exploratory |
| 5 | Keyword-driven | E2E/regresión (Playwright/Cypress) |

**Pirámide mapeada:**
- Unit → equivalence partitioning + branch coverage (29119-4)
- Integración → boundary value (29119-4)
- E2E → keyword-driven (29119-5)
- Por release (si hay suite): Test Plan + Test Summary Report (29119-3)

---

## ISO/IEC 27001 — SGSI

```
├── Contexto y alcance      → Activos de información y riesgo aceptado
├── Evaluación de riesgo    → Identificar, analizar, evaluar de forma sistemática
├── Anexo A (controles)     → 93 controles: Organizacionales, Personas, Físicos, Tecnológicos
├── Mejora continua (PDCA)  → Plan-Do-Check-Act del SGSI
└── Auditoría               → Evidencia de cumplimiento
```

**Regla:** sistemas con PII/datos sensibles → mini análisis de riesgo (activo → amenaza → vulnerabilidad → impacto → control) **antes** de implementar.

---

## NIST SSDF (SP 800-218)

| Grupo | Sigla | Enfoque | Ejemplo en este skill |
|---|---|---|---|
| Prepare the Organization | PO | Personas, procesos, tools | Security by default, `.env.example`, secret scanning |
| Protect the Software | PS | Proteger componentes | Commit signing, SBOM, acceso CI/CD |
| Produce Well-Secured Software | PW | Diseño/código/test seguro | Threat modeling, SAST/DAST, security review |
| Respond to Vulnerabilities | RV | Remediación post-release | Disclosure, parcheo por CVSS, RCA |

**Regla:** modo Pentest mapea hallazgos a **PW** (diseño/código) o **RV** (post-release).

---

## CMMI — Madurez de Proceso

| Nivel | Nombre | Lectura |
|---|---|---|
| 1 | Inicial | Ad hoc / héroes |
| 2 | Gestionado | Planificado y controlado por proyecto |
| 3 | Definido | Proceso estándar organizacional |
| 4 | Gestionado cuantitativamente | Control estadístico |
| 5 | Optimización | Mejora continua cuantitativa |

**Regla:** en System Architecture declarar nivel CMMI del proceso propuesto. MVP sano ≈ Nivel 2; exigir 4–5 a un equipo de 2 es sobre-ingeniería.

---

## OWASP + DevSecOps

La sección Security by Default + CI/CD DevSecOps = implementación técnica de **NIST SSDF (PW)** e **ISO 27001 Anexo A (tecnológicos)** — evidencia de marco, no “buenas intenciones”.

---

## Quality Gate normativo (previo a “terminado”)

```
□ ISO 25010: característica(s) impactada(s) nombrada(s)
□ ISO 12207: requisito → diseño → código → prueba trazable en 1 línea
□ ISO 29119: técnica de prueba declarada
□ ISO 27001: si hay datos sensibles, riesgo evaluado antes
□ NIST SSDF: práctica PO/PS/PW/RV identificada
□ CMMI: nivel adecuado al tamaño/criticidad (ni más ni menos)
□ OWASP Top 10 + DevSecOps: sin regresión de seguridad conocida
```
