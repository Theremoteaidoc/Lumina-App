# Base de Conocimiento de Lumina

## Propósito

Esta carpeta contiene toda la base de conocimiento curada que alimenta a Lumina como asistente de belleza y autocuidado. Los datos aquí están pensados para:

1. Ser inyectados como contexto en cada llamada a Claude API (Fase 3 — backend de chat).
2. Garantizar que las respuestas de Lumina estén ancladas en fuentes verificables.
3. Proteger a la usuaria: los `safety_notes_es` de cada topic son obligatorios en la respuesta del modelo cuando el topic es relevante.

La base fue construida por 5 agentes de investigación especializados (sprint 1) y consolidada por el agente backend (sprint 2).

---

## Estructura de archivos

```
src/data/knowledge/
├── README.md                   # Este archivo
│
├── visagism.json               # 14 topics — visagismo, formas faciales, proporciones
├── colorTheory.json            # 14 topics — colorimetría personal, subtonos, estaciones
├── skincare.json               # 25 topics — tipos de piel, activos, rutinas por edad
├── makeup.json                 # 16 topics — técnicas, herramientas, seguridad ocular
├── trends.json                 # 21 topics — tendencias culturales, impacto psicológico
│
├── sources/
│   ├── visagism_sources.json   # 16 fuentes del dominio visagismo
│   ├── colorTheory_sources.json# 11 fuentes del dominio colorimetría
│   ├── skincare_sources.json   # 24 fuentes del dominio skincare
│   ├── makeup_sources.json     # 15 fuentes del dominio maquillaje
│   └── trends_sources.json     # 36 fuentes del dominio tendencias
│
├── sources.json                # MERGE MAESTRO — todas las 102 fuentes unificadas
│                               # (no reemplaza los archivos por dominio; complementa)
│
├── personality.js              # System prompt de Lumina + SAFETY_REDIRECTS
├── luminaContext.js            # Helper: buildSystemPrompt(), findRelevantTopics(), etc.
│
├── index.js                    # Re-exporta todo (existente)
├── boundaries.js               # Reglas de límites adicionales (existente)
└── [dominio].js                # Wrappers JS por dominio (existentes, para React)
```

---

## Stats actuales

| Dominio       | Topics | Fuentes |
|---------------|--------|---------|
| visagism      | 14     | 16      |
| colorTheory   | 14     | 11      |
| skincare      | 25     | 24      |
| makeup        | 16     | 15      |
| trends        | 21     | 36      |
| **TOTAL**     | **90** | **102** |

Ultima actualización: 2026-06-09

---

## Schema de un topic

```json
{
  "id": "skin_teen_basic_routine",
  "title": "Rutina básica para piel adolescente — qué necesitas realmente",
  "summary_es": "Texto conversacional de 2-5 oraciones que Lumina puede citar.",
  "key_findings_es": ["Array de hallazgos específicos con datos concretos."],
  "applicable_user_scenarios": ["Cuando la usuaria pregunta X", "Cuando Y"],
  "safety_notes_es": ["Nota de seguridad OBLIGATORIA en respuesta cuando aplique."],
  "source_ids": ["skin_2024_011", "skin_2024_008"]
}
```

Los campos `safety_notes_es` son opcionales en el JSON pero **OBLIGATORIOS en la respuesta de Lumina** cuando el topic es relevante. El campo existe solo en topics con implicaciones de seguridad reales.

## Schema de una fuente

```json
{
  "id": "skin_2024_011",
  "domain": "skincare",
  "title": "Título completo de la fuente",
  "authors": ["Apellido, Nombre"],
  "year": 2024,
  "type": "clinical_guideline | peer_reviewed | book | journalism | industry_report | ...",
  "doi_or_url": "https://...",
  "accessed_date": "2026-06-09",
  "summary_es": "Qué dice esta fuente y por qué importa para Lumina.",
  "reliability_note": "Tier 1/2 y por qué se puede (o no se puede) confiar en ella."
}
```

---

## Cómo agregar un nuevo topic

1. Identifica el dominio correcto: `visagism`, `colorTheory`, `skincare`, `makeup` o `trends`.
2. Abre `[dominio].json`.
3. Agrega un objeto en el array `topics` siguiendo el schema exacto.
4. Asigna un `id` descriptivo en snake_case: `[dominio_abrev]_[concepto_breve]`.
   Ejemplo: `skin_rosacea_young`, `vis_face_shapes_overview`.
5. Agrega al menos una fuente verificable referenciada en `source_ids`.
6. Si el topic tiene implicaciones de seguridad (ingredientes para menores, síntomas médicos, salud mental), agrega `safety_notes_es` obligatoriamente.
7. Después de agregar el topic, agrega sus fuentes nuevas en `sources/[dominio]_sources.json`.
8. Ejecuta el script de validación:
   ```bash
   node -e "
   const d = require('./[dominio].json');
   const s = require('./sources/[dominio]_sources.json');
   const srcIds = new Set(s.sources.map(x => x.id));
   for (const t of d.topics) {
     for (const sid of t.source_ids || []) {
       if (!srcIds.has(sid)) console.log('MISSING:', sid, 'in topic', t.id);
     }
   }
   console.log('Done');
   "
   ```
9. Regenera `sources.json` ejecutando el merge:
   ```bash
   node scripts/merge-sources.js
   ```
   (Cuando se cree ese script. Por ahora, hacerlo manualmente o con el mismo one-liner usado en el sprint 2.)

---

## Cómo agregar una nueva fuente

1. Abre `sources/[dominio]_sources.json`.
2. Agrega un objeto al array `sources`.
3. El `id` sigue la convención: `[prefijo]_[año]_[número secuencial]`.
   - Prefijos: `vis_`, `col_`, `skin_`, `mk_`, `trd_`
   - Ejemplo: `skin_2026_025`
4. Completa todos los campos: `id`, `title`, `authors`, `year`, `type`, `doi_or_url`, `accessed_date`, `summary_es`, `reliability_note`.
5. El campo `reliability_note` es obligatorio. Indica si es Tier 1 (guideline oficial, peer-reviewed de alto impacto), Tier 2 (referencia clínica, periodismo de calidad) o fuente de menor rigor (y por qué se incluye de todas formas).
6. Regenera `sources.json` (ver paso 9 de la sección anterior).
7. Referencia el nuevo `id` en al menos un topic.

---

## Reglas de oro

1. **Nunca inventar fuentes.** Si no existe una fuente verificable para un hallazgo, no se hace el hallazgo.
2. **`safety_notes_es` siempre que aplique.** Cualquier topic que involucre ingredientes activos, condiciones médicas, salud mental o menores de edad debe tener este campo.
3. **`summary_es` debe sonar a Lumina, no a Wikipedia.** Conversacional, en primera persona de posibilidad ("se puede", "es útil"), sin jerga sin explicar.
4. **No duplicar source IDs.** Los prefijos por dominio (`vis_`, `col_`, etc.) previenen colisiones entre dominios. Dentro del mismo dominio, revisar que el número no esté en uso.
5. **El tipo de fuente importa.** `peer_reviewed` y `clinical_guideline` tienen peso diferente a `journalism` o `industry_report`. El campo `reliability_note` lo aclara.
6. **Las tendencias tienen fecha de caducidad.** Los topics del dominio `trends` deben revisarse cada 3-6 meses. Las microtendencias de TikTok pueden quedar obsoletas en semanas.

---

## Topics de salud mental flagueados (coordinación con seguridad obligatoria)

Los siguientes 4 topics del dominio `trends` fueron identificados como sensibles y requieren coordinación con el agente de seguridad antes de cualquier cambio en su contenido o en los safety redirects asociados:

| ID | Título |
|---|---|
| `trend_filters_mental_health_adolescents` | Filtros y salud mental adolescente — evidencia y riesgo |
| `trend_bigorexia_male_adolescents` | Bigorexia y dismorfia muscular en adolescentes varones |
| `trend_body_positivity_vs_neutrality` | Body positivity vs body neutrality — diferencias y evidencia |
| `trend_instagram_face_critique` | Instagram face — homogeneización y crítica cultural |

Estos topics activan los `SAFETY_REDIRECTS` definidos en `personality.js`. Cualquier modificación a sus trigger_patterns o response_templates requiere revisión del agente `lumina-security`.

---

## Guardrail AAD 2024 — Retinoides en menores de 16

La American Academy of Dermatology (2024) establece explícitamente que:

- **Retinol cosmético antienvejecimiento**: NO recomendado para menores — causa irritación, daño de barrera y fotosensibilidad sin beneficio en piel joven.
- **Vitamina C concentrada (>5%)**: NO recomendada para menores.
- **AHA/BHA fuertes**: NO recomendados para menores como rutina. Excepción: ácido salicílico 0.5-2% para acné (FDA categoría OTC segura).
- **Retinoides tópicos para acné** (adapaleno, tretinoína): SÍ se pueden usar desde los 10 años bajo supervisión dermatológica — esto es diferente al retinol cosmético.

Fuente primaria: `skin_2024_011` (AAD skincare guide by age) y `skin_2024_001` (AAD Acne Guidelines 2024).

Este guardrail está codificado en `personality.js` (LUMINA_PERSONALITY) y en `buildSystemPrompt()` cuando `profile.ageRange` es '13-15' o '16-18'. **No se puede desactivar sin revisión del orquestador.**

---

## Inconsistencias conocidas (pendiente de decisión del orquestador)

**1 fuente huérfana detectada en sprint 2:**

- `skin_2024_003` en `skincare_sources.json` — "Inside the 2024 AAD Acne Guidelines: New Therapies Join Old Standbys" (MDedge Dermatology, Barbieri & Reynolds 2024) — no es referenciada por ningún topic de skincare.

**Decision necesaria del orquestador:** eliminar la fuente, o identificar a qué topic existente agregar la referencia (candidato más probable: `skin_acne_classification_treatment` o `skin_teen_hormonal_acne`).

---

## Próximos pasos recomendados

### Cuándo migrar a embeddings (v2 de `findRelevantTopics`)

La búsqueda por keywords en `luminaContext.js` es funcional para el MVP pero tiene limitaciones: no detecta sinónimos ("granos" vs "acné"), no entiende intención, y degrada con queries complejas. Migrar a embeddings cuando:

- La base supere 150 topics, o
- Se detecte que Lumina frecuentemente elige topics irrelevantes, o
- Se implemente el backend de Fase 3 en Vercel Serverless con acceso a Supabase pgvector.

**Stack sugerido para v2:** Supabase `pgvector`, embeddings con `text-embedding-3-small` de OpenAI o `embed-multilingual-v3.0` de Cohere (mejor para español). El campo `summary_es` + `applicable_user_scenarios` es el texto óptimo para vectorizar.

### Cuándo añadir más dominios

Posibles dominios futuros según roadmap de Lumina:

- `fragrance` — perfumería, familias olfativas, cómo elegir fragancia por subtono
- `haircare` — cuidado del cabello según porosidad y tipo de rizos
- `wellness` — nutrición para piel, sueño y estrés (con cuidado extremo en menores)
- `nails` — cuidado básico de uñas, colores según colorimetría

Cada dominio nuevo requiere: archivo JSON de topics, archivo de sources, validación cruzada, y revisión de seguridad si involucra menores.

### Backend de chat (Fase 3)

El flujo de integración previsto es:

```
1. Usuario envía mensaje
2. Backend detecta safety triggers (SAFETY_REDIRECTS patterns)
   → Si trigger: respuesta directa sin Claude (latencia 0)
3. findRelevantTopics(message, { maxResults: 3 }) → topics
4. buildSystemPrompt(userProfile) → systemPrompt
5. formatTopicsAsContext(topics) → contextBlock
6. Claude API call:
   system: systemPrompt
   messages: [
     { role: 'user', content: contextBlock + '\n\n' + userMessage },
     ...historial previo
   ]
7. Respuesta de Claude → cliente
```

Las funciones en `luminaContext.js` ya están listas para el paso 3, 4 y 5. El paso 2 necesita implementación en el backend (pattern matching sobre SAFETY_REDIRECTS).
