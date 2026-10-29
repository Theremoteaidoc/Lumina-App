// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE INDEX — Helpers para ensamblar el system prompt de Lumina
// Versión: 1.0 | Sprint 1
//
// Este módulo se consume en el BACKEND (serverless function),
// NO directamente en componentes React del cliente.
// La razón: el contenido total puede superar los 25K tokens,
// lo que no debe enviarse al cliente — el backend lo tiene en
// memoria y solo envía la respuesta final.
//
// Uso previsto:
//   const { systemPrompt } = buildFullContext(profile, results, userMessage);
//   // → enviar a Anthropic API como messages[0].system
// ═══════════════════════════════════════════════════════════════

import { LUMINA_PERSONALITY } from './personality.js';
import { VISAGISM } from './visagism.js';
import { COLOR_THEORY } from './colorTheory.js';
import { SKINCARE } from './skincare.js';
import { MAKEUP } from './makeup.js';
import { TRENDS } from './trends.js';
import { BOUNDARIES } from './boundaries.js';

// ─── Mapeo de topics a conocimiento serializado ───────────────────────────────

/**
 * Serializa un objeto de conocimiento a string de forma recursiva.
 * Convierte la estructura JS a texto plano con jerarquía clara.
 * Esto permite que Claude reciba el conocimiento como texto sin necesidad
 * de parsear JSON en el prompt.
 */
function serializeKnowledge(obj, depth = 0) {
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item, i) => `  ${depth > 0 ? '  '.repeat(depth) : ''}- ${serializeKnowledge(item, depth + 1)}`).join('\n');
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj)
      .map(([key, value]) => {
        const header = `${'#'.repeat(Math.min(depth + 2, 4))} ${key}\n`;
        const content = serializeKnowledge(value, depth + 1);
        return `${header}${content}`;
      })
      .join('\n\n');
  }
  return String(obj);
}

// ─── getSystemPrompt ─────────────────────────────────────────────────────────

/**
 * Ensambla el system prompt completo para la Claude API.
 *
 * @param {Object|null} profile - Perfil del usuario desde localStorage/Supabase
 *   Propiedades esperadas:
 *   - name: string
 *   - ageRange: '13-15' | '16-18' | '19-25' | '26-35' | '35+'
 *   - goals: string[]  ('skincare', 'colorimetry', 'makeup', 'selflove', 'face', 'explore')
 *   - skinType: 'grasa' | 'seca' | 'mixta' | 'sensible' | 'normal' | 'desconocido'
 *   - concerns: string[]  ('acne', 'dark_spots', 'expression_lines', 'dryness', 'oiliness', 'sensitivity', 'none')
 *   - hairColor: 'blonde' | 'light_brown' | 'dark_brown' | 'black' | 'red' | 'other'
 *   - eyeColor: 'blue' | 'green' | 'hazel' | 'light_brown' | 'dark_brown' | 'black'
 *
 * @param {Object|null} results - Resultados de tests de la app
 *   Propiedades esperadas:
 *   - faceShape: 'ovalado' | 'redondo' | 'cuadrado' | 'corazon' | 'alargado' | 'diamante'
 *   - eyeShape: 'almendra' | 'redondo' | 'rasgado' | 'caido' | 'encapotado'
 *   - colorSeason: 'frio' | 'calido' | 'neutro'  (resultado del test de colorimetría)
 *   - skinTypeFromTest: string  (resultado del test de piel de la app)
 *
 * @returns {string} System prompt completo para Claude API
 */
export function getSystemPrompt(profile, results) {
  const sections = [];

  // ── 1. Identidad y filosofía central ─────────────────────────────────────
  sections.push(`# Sistema: Personalidad de Lumina\n\n${LUMINA_PERSONALITY}`);

  // ── 2. Límites y redirecciones ───────────────────────────────────────────
  sections.push(`# Sistema: Límites de conversación\n\n${formatBoundaries()}`);

  // ── 3. Contexto del usuario ──────────────────────────────────────────────
  sections.push(`# Tu usuaria\n\n${formatUserContext(profile, results)}`);

  // ── 4. Instrucciones operativas ───────────────────────────────────────────
  sections.push(OPERATIONAL_INSTRUCTIONS);

  return sections.join('\n\n---\n\n');
}

// ─── formatBoundaries (interno) ──────────────────────────────────────────────

function formatBoundaries() {
  const b = BOUNDARIES;
  const lines = [];

  lines.push(`## Temas que NO discutes:\n`);
  b.topicsLuminaDoesNotDiscuss.forEach((item, i) => {
    lines.push(`${i + 1}. ${item}`);
  });

  lines.push(`\n## Señales de redirección médica:\n`);
  b.topicsLuminaRedirectsToProfessional.medical.triggers.forEach(t => {
    lines.push(`- ${t}`);
  });

  lines.push(`\n## Señales de redirección salud mental:\n`);
  b.topicsLuminaRedirectsToProfessional.mental.triggers.forEach(t => {
    lines.push(`- ${t}`);
  });

  lines.push(`\n## Cómo redirigir:\n`);
  lines.push(`**Médico:** ${b.redirectionLanguage.medical}`);
  lines.push(`**Salud mental:** ${b.redirectionLanguage.mental}`);
  lines.push(`**Nutrición:** ${b.redirectionLanguage.nutrition}`);
  lines.push(`**Cirugía general:** ${b.redirectionLanguage.surgery}`);
  lines.push(`**Cirugía menor de edad:** ${b.redirectionLanguage.surgeryMinor}`);

  lines.push(`\n## Reglas internas:\n`);
  lines.push(`**Nunca decir:** ${b.internalGuidelines.neverSay.join(' / ')}`);
  lines.push(`**Siempre hacer:** ${b.internalGuidelines.alwaysDo.join(' / ')}`);

  return lines.join('\n');
}

// ─── formatUserContext (interno) ─────────────────────────────────────────────

function formatUserContext(profile, results) {
  if (!profile && !results) {
    return `No hay perfil disponible. Tratar a la usuaria con calidez general. Si hace preguntas específicas sobre su piel o colorimetría, puedes sugerir gentilmente que haga los tests de la app para una respuesta más personalizada.`;
  }

  const lines = [];

  // Nombre
  if (profile?.name) {
    lines.push(`**Nombre:** ${profile.name}`);
  }

  // Rango de edad con nota de tono
  if (profile?.ageRange) {
    lines.push(`**Rango de edad:** ${profile.ageRange} años`);
    if (profile.ageRange === '13-15') {
      lines.push(`**Nota de tono:** Usuaria muy joven. Usar lenguaje especialmente cálido y simple. Enfatizar que los cambios hormonales son normales. Máximo cuidado con temas de imagen corporal. Activos potentes (retinol, ácidos altos) no son adecuados para esta edad. No discutir cirugías estéticas en ningún caso.`);
    } else if (profile.ageRange === '16-18') {
      lines.push(`**Nota de tono:** Usuaria adolescente. Tono de amiga mayor. No discutir cirugías estéticas. Retinol solo si hay recomendación médica previa mencionada por ella.`);
    }
  }

  // Goals
  if (profile?.goals?.length > 0) {
    const goalLabels = {
      skincare: 'cuidado de piel',
      colorimetry: 'encontrar sus colores',
      makeup: 'aprender maquillaje',
      selflove: 'trabajar su autoestima',
      face: 'conocer su rostro',
      explore: 'explorar',
    };
    const goalsText = profile.goals.map(g => goalLabels[g] || g).join(', ');
    lines.push(`**Sus metas en Lumina:** ${goalsText}`);
  }

  // Tipo de piel (declarado en onboarding)
  if (profile?.skinType && profile.skinType !== 'desconocido') {
    lines.push(`**Tipo de piel (autodeclarado):** ${profile.skinType}`);
  }

  // Tipo de piel (del test)
  if (results?.skinTypeFromTest) {
    lines.push(`**Tipo de piel (resultado del test de Lumina):** ${results.skinTypeFromTest}`);
  }

  // Preocupaciones
  if (profile?.concerns?.length > 0 && !profile.concerns.includes('none')) {
    const concernLabels = {
      acne: 'acné/espinillas',
      dark_spots: 'manchas/hiperpigmentación',
      expression_lines: 'líneas de expresión',
      dryness: 'resequedad/descamación',
      oiliness: 'brillo/poros visibles',
      sensitivity: 'sensibilidad/rojeces',
    };
    const concernsText = profile.concerns.map(c => concernLabels[c] || c).join(', ');
    lines.push(`**Preocupaciones de piel:** ${concernsText}`);
  }

  // Color de cabello
  if (profile?.hairColor) {
    const hairLabels = {
      blonde: 'rubio',
      light_brown: 'castaño claro',
      dark_brown: 'castaño oscuro',
      black: 'negro',
      red: 'pelirrojo/rojizo',
      other: 'otro',
    };
    lines.push(`**Color de cabello natural:** ${hairLabels[profile.hairColor] || profile.hairColor}`);
  }

  // Color de ojos
  if (profile?.eyeColor) {
    const eyeLabels = {
      blue: 'azul',
      green: 'verde',
      hazel: 'avellana',
      light_brown: 'café claro',
      dark_brown: 'café oscuro',
      black: 'negro',
    };
    lines.push(`**Color de ojos:** ${eyeLabels[profile.eyeColor] || profile.eyeColor}`);
  }

  // Resultados de tests
  if (results) {
    lines.push(`\n**Resultados de tests de la app:**`);

    if (results.faceShape) {
      const shapeLabels = {
        ovalado: 'Ovalado',
        redondo: 'Redondo',
        cuadrado: 'Cuadrado',
        corazon: 'Corazón',
        alargado: 'Alargado',
        diamante: 'Diamante',
      };
      lines.push(`- Forma de rostro (escaneo): ${shapeLabels[results.faceShape] || results.faceShape}`);
    }

    if (results.eyeShape) {
      const eyeShapeLabels = {
        almendra: 'Almendra',
        redondo: 'Redondo',
        rasgado: 'Rasgado',
        caido: 'Caído',
        encapotado: 'Encapotado',
      };
      lines.push(`- Forma de ojos (escaneo): ${eyeShapeLabels[results.eyeShape] || results.eyeShape}`);
    }

    if (results.colorSeason) {
      const seasonLabels = {
        frio: 'Subtono frío',
        calido: 'Subtono cálido',
        neutro: 'Subtono neutro',
      };
      lines.push(`- Colorimetría (test): ${seasonLabels[results.colorSeason] || results.colorSeason}`);
    }
  }

  lines.push(`\n**Instrucción de uso del contexto:** No recites estos datos literalmente ("veo que tienes piel mixta..."). Incorpóralos naturalmente cuando sean relevantes para la conversación. Si la usuaria pregunta algo que el contexto puede responder mejor con sus datos específicos, úsalos sin anunciarlos.`);

  return lines.join('\n');
}

// ─── Instrucciones operativas (constante) ────────────────────────────────────

const OPERATIONAL_INSTRUCTIONS = `# Instrucciones operativas

**Idioma:** Responde en el idioma en que te escribe la usuaria. Por defecto, español. Si cambia de idioma a mitad de conversación, sigue en el nuevo idioma sin comentarlo.

**Longitud de respuesta:**
- Default: 2-4 oraciones. Directo y cálido.
- Explicaciones técnicas: hasta 6-8 oraciones o lista breve si la estructura suma.
- Nunca bloques de texto densos sin saltos de línea.
- Un emoji máximo por mensaje, solo si aporta calidez genuina.

**Formato:**
- Texto plano preferido para respuestas conversacionales.
- Markdown ligero (negrillas, listas con guión) solo cuando organiza información compleja.
- No usar encabezados H1/H2 en respuestas al chat — es una conversación, no un artículo.

**Preguntas de seguimiento:**
- Si la pregunta de la usuaria puede responderse mejor con más contexto, hacer UNA pregunta de seguimiento, no varias.
- No interrogar a la usuaria con múltiples preguntas seguidas.

**Cuando no sabes algo:**
- Admítelo con naturalidad: "No tengo información precisa sobre eso" o "Para eso necesitarías consultar a alguien especializado en [X]".
- Nunca inventes datos técnicos, nombres de ingredientes o estudios.

**Consistencia de carácter:**
- Siempre Lumina. Nunca romper el personaje para actuar como "asistente de IA genérico".
- Si alguien pregunta quién te creó: "Soy Lumina, creada por Valery. Soy una mentora digital de belleza consciente."
- Si alguien pregunta si eres IA: sí, con honestidad y sin drama.`;

// ─── getKnowledgeContext ──────────────────────────────────────────────────────

/**
 * Devuelve el conocimiento técnico de los topics solicitados como string.
 * Para la Claude API, este contenido va en el system prompt o como
 * contexto adicional en el primer turn si es muy largo.
 *
 * @param {string[]} topics - Array de topics: 'visagism' | 'color' | 'skincare' | 'makeup' | 'trends' | 'all'
 * @returns {string} Conocimiento serializado
 */
export function getKnowledgeContext(topics) {
  const requested = (!topics || topics.length === 0 || topics.includes('all'))
    ? ['visagism', 'color', 'skincare', 'makeup', 'trends']
    : topics;

  const parts = [];

  if (requested.includes('visagism')) {
    parts.push(`# Conocimiento: Visagismo\n\n${formatVisagism()}`);
  }

  if (requested.includes('color')) {
    parts.push(`# Conocimiento: Colorimetría\n\n${formatColorTheory()}`);
  }

  if (requested.includes('skincare')) {
    parts.push(`# Conocimiento: Cuidado de piel\n\n${formatSkincare()}`);
  }

  if (requested.includes('makeup')) {
    parts.push(`# Conocimiento: Maquillaje\n\n${formatMakeup()}`);
  }

  if (requested.includes('trends')) {
    parts.push(`# Conocimiento: Tendencias\n\n${formatTrends()}`);
  }

  return parts.join('\n\n---\n\n');
}

// ─── Formateadores de conocimiento (internos) ─────────────────────────────────

function formatVisagism() {
  const v = VISAGISM;
  const parts = [];
  parts.push(v.introduction);
  parts.push(`\n## Base científica\n${v.scientificBasis}`);
  parts.push(`\n## Mediciones clave\n- WHR: ${v.measurements.whr}\n- JFR: ${v.measurements.jfr}\n- CJR: ${v.measurements.cjr}`);

  parts.push(`\n## Formas de rostro\n`);
  Object.entries(v.faceShapes).forEach(([key, shape]) => {
    parts.push(`### ${shape.name} (${key})\n**Proporciones:** ${shape.proportions}\n**Lo que armoniza:** ${shape.harmonious}\n**Cómo jugar:** ${shape.play}\n**Referencias:** ${shape.famousExamples}\n**Nota importante:** ${shape.notRules}`);
  });

  parts.push(`\n## Conceptos erróneos comunes\n${v.commonMisconceptions.map(m => `- ${m}`).join('\n')}`);
  parts.push(`\n## Filosofía\n${v.philosophy}`);
  return parts.join('\n');
}

function formatColorTheory() {
  const c = COLOR_THEORY;
  const parts = [];
  parts.push(c.introduction);

  parts.push(`\n## Subtonos\n`);
  Object.entries(c.undertones).forEach(([key, ut]) => {
    parts.push(`### Subtono ${key === 'warm' ? 'cálido' : key === 'cool' ? 'frío' : 'neutro'}\n${ut.description}\n**Colores favorables:** ${ut.colorsForYou.join(', ')}\n**Menos favorables:** ${ut.colorsLessFavorable.join(', ')}\n**Metales:** ${ut.metalsAndJewelry}\n**Labiales:** ${ut.lipColors}\n**Ojos:** ${ut.eyeColors}\n**Referencias:** ${ut.examples}`);
  });

  parts.push(`\n## Sistema de 4 estaciones\n`);
  const seasonNames = { spring: 'Primavera', summer: 'Verano', autumn: 'Otoño', winter: 'Invierno' };
  Object.entries(c.seasonal).forEach(([key, season]) => {
    parts.push(`### ${seasonNames[key]}\n${season.description}\n**Colores:** ${season.colorsForYou.join(', ')}\n**Labiales:** ${season.lipColors}\n**Referencias:** ${season.examples}`);
  });

  parts.push(`\n## Sistema de 12 estaciones\n${c.seasonal12.overview}\n${c.seasonal12.note}`);

  parts.push(`\n## Cómo encontrar tu subtono\n${c.howToFindUndertone.join('\n\n')}`);

  parts.push(`\n## Filosofía\n${c.philosophy}`);
  return parts.join('\n');
}

function formatSkincare() {
  const s = SKINCARE;
  const parts = [];
  parts.push(s.introduction);
  parts.push(`\n## Filosofía\n${s.philosophy}`);

  parts.push(`\n## Tipos de piel\n`);
  const skinTypeNames = { oily: 'Grasa', dry: 'Seca', combination: 'Mixta', sensitive: 'Sensible', normal: 'Normal' };
  Object.entries(s.skinTypes).forEach(([key, st]) => {
    parts.push(`### ${skinTypeNames[key]}\n${st.description}\n**Enfoque de cuidado:** ${st.careApproach}\n**Ingredientes clave:** ${st.keyIngredients.join(', ')}\n**Texturas:** ${st.productTextures}\n**Errores comunes:** ${st.commonMistakes.join(' / ')}`);
  });

  parts.push(`\n## Escala de Fitzpatrick\n${s.fitzpatrickScale.description}\n${Object.entries(s.fitzpatrickScale.types).map(([k, v]) => `- ${v}`).join('\n')}\n${s.fitzpatrickScale.importantNote}`);

  parts.push(`\n## Rutina básica\n**Mañana:** ${s.basicRoutine.morning.join(' → ')}\n**Noche:** ${s.basicRoutine.evening.join(' → ')}`);

  parts.push(`\n## Ingredientes activos clave\n`);
  Object.entries(s.ingredients).forEach(([key, ing]) => {
    parts.push(`### ${key}\n**Qué hace:** ${ing.whatItDoes}\n**Mejor para:** ${ing.bestFor}\n**Cómo usar:** ${ing.howToUse}\n**Precauciones:** ${ing.cautions}\n**Combinaciones:** ${ing.pairingNotes}`);
  });

  parts.push(`\n## Preocupaciones comunes\n`);
  const concernNames = { acne: 'Acné', darkSpots: 'Manchas oscuras', dryness: 'Sequedad', sensitivity: 'Sensibilidad', aging: 'Envejecimiento', enlargedPores: 'Poros dilatados' };
  Object.entries(s.concerns).forEach(([key, concern]) => {
    parts.push(`### ${concernNames[key] || key}\n${concern.description}\n**Abordaje tópico:** ${concern.topicalApproaches}\n**Cuándo al médico:** ${concern.whenToConsultDoctor}`);
  });

  parts.push(`\n## Para piel adolescente\n${s.forTeens.description}\n**Principios clave:** ${s.forTeens.keyPrinciples.join(' / ')}\n**Qué evitar:** ${s.forTeens.whatToAvoid.join(' / ')}`);

  parts.push(`\n## Señales para ir al dermatólogo\n${s.whenToSeeDermatologist.map(w => `- ${w}`).join('\n')}`);

  return parts.join('\n');
}

function formatMakeup() {
  const m = MAKEUP;
  const parts = [];
  parts.push(m.introduction);
  parts.push(`\n## Filosofía\n${m.philosophy}`);

  parts.push(`\n## Principios\n${Object.entries(m.principles).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}`);

  parts.push(`\n## Técnicas por producto\n`);
  Object.entries(m.techniques).forEach(([key, tech]) => {
    parts.push(`### ${key}\n${tech.description}\n**Aplicación:** ${tech.application || ''}\n**Tips:** ${Array.isArray(tech.tips) ? tech.tips.join(' / ') : ''}`);
  });

  parts.push(`\n## Maquillaje por forma de rostro\n${Object.entries(m.byFaceShape).map(([k, v]) => `**${k}:** ${v}`).join('\n\n')}`);

  parts.push(`\n## Maquillaje por forma de ojo\n${Object.entries(m.byEyeShape).map(([k, v]) => `**${k}:** ${v}`).join('\n\n')}`);

  parts.push(`\n## Por ocasión\n${Object.entries(m.byOccasion).map(([k, v]) => `**${k}:** ${v}`).join('\n\n')}`);

  parts.push(`\n## Para quienes empiezan\n${m.forTeens.description}\n**Kit básico:** ${m.forTeens.starterKit.join(', ')}\n**Principios:** ${m.forTeens.keyPrinciples.join(' / ')}`);

  return parts.join('\n');
}

function formatTrends() {
  const t = TRENDS;
  const parts = [];
  parts.push(t.introduction);
  parts.push(`\n**Aviso:** ${t.disclaimer}`);

  parts.push(`\n## Tendencias actuales (~2025-2026)\n`);
  Object.entries(t.current).forEach(([key, category]) => {
    parts.push(`### ${category.title}`);
    if (Array.isArray(category.trends)) {
      category.trends.forEach(trend => {
        parts.push(`**${trend.name}:** ${trend.description}\n_Perspectiva Lumina:_ ${trend.luminaNote}`);
      });
    }
  });

  parts.push(`\n## Filosofía\n${t.philosophy}`);
  return parts.join('\n');
}

// ─── detectTopics ─────────────────────────────────────────────────────────────

/**
 * Detecta los topics relevantes a partir del mensaje del usuario.
 * Heurística de keyword matching — no usa IA.
 * En producción, el backend puede mejorar esto con embeddings o clasificación.
 *
 * @param {string} userMessage
 * @returns {string[]} Array de topics detectados. Vacío si no se detecta nada específico.
 */
export function detectTopics(userMessage) {
  if (!userMessage) return [];
  const msg = userMessage.toLowerCase();
  const detected = new Set();

  // Visagismo — forma del rostro
  const visagismKeywords = [
    'rostro', 'cara', 'forma', 'pómulos', 'mandíbula', 'frente', 'mentón',
    'ovalado', 'redondo', 'cuadrado', 'corazón', 'alargado', 'diamante',
    'visagismo', 'proporciones', 'rasgos', 'armonía facial', 'faciometría',
    'ojos almendra', 'ojos rasgados', 'ojos encapotados', 'ojos caídos',
    'face shape', 'face', 'jaw', 'cheekbones',
  ];
  if (visagismKeywords.some(kw => msg.includes(kw))) {
    detected.add('visagism');
  }

  // Colorimetría — subtonos y paletas
  const colorKeywords = [
    'color', 'subtono', 'paleta', 'temporada', 'estación', 'colorimetría',
    'colorimetria', 'cálido', 'calido', 'frío', 'frio', 'neutro',
    'joya', 'platino', 'oro', 'plata', 'venas', 'primavera', 'verano',
    'otoño', 'invierno', 'color me beautiful', 'season', 'undertone',
    'qué colores me quedan', 'que colores', 'colores que me favorecen',
    'me queda bien', 'me favorece', 'combinar colores',
  ];
  if (colorKeywords.some(kw => msg.includes(kw))) {
    detected.add('color');
  }

  // Skincare — cuidado de la piel
  const skincareKeywords = [
    'piel', 'acné', 'acne', 'espinilla', 'granito', 'rutina', 'crema',
    'sérum', 'serum', 'hidratante', 'limpiador', 'tónico', 'tonico',
    'manchas', 'poros', 'brillo', 'sequedad', 'seca', 'grasa', 'mixta',
    'sensible', 'retinol', 'vitamina c', 'niacinamida', 'ácido hialurónico',
    'acido hialuronico', 'salicílico', 'salicilico', 'glicólico', 'glicolico',
    'ceramidas', 'péptidos', 'peptidos', 'protector solar', 'spf', 'fps',
    'hiperpigmentación', 'hiperpigmentacion', 'fitzpatrick', 'baumann',
    'skincare', 'skin', 'moisturizer', 'cleanser', 'toner', 'sunscreen',
    'dermatólogo', 'dermatologia', 'piel adolescente',
  ];
  if (skincareKeywords.some(kw => msg.includes(kw))) {
    detected.add('skincare');
  }

  // Maquillaje
  const makeupKeywords = [
    'maquillaje', 'makeup', 'base', 'corrector', 'rubor', 'blush',
    'sombra', 'delineador', 'eyeliner', 'rímel', 'rimel', 'mascara',
    'labial', 'lipstick', 'lip', 'brow', 'ceja', 'iluminador', 'highlight',
    'contorno', 'contour', 'bronceador', 'bronzer', 'primer',
    'smokey', 'cat eye', 'wing', 'nude', 'glam', 'natural', 'bold',
    'maquillar', 'aplicar', 'difuminar', 'blend', 'contouring',
    'técnica de maquillaje', 'look', 'make up',
  ];
  if (makeupKeywords.some(kw => msg.includes(kw))) {
    detected.add('makeup');
  }

  // Tendencias
  const trendKeywords = [
    'tendencia', 'trend', 'moda', 'aesthetic', 'viral', 'tiktok',
    'redes sociales', 'está de moda', 'de moda', 'popular',
    'latte makeup', 'glass skin', 'clean girl', 'old money',
    'balletcore', 'mob wife', 'sleepy eyes', 'blush draping',
    'cortina', 'curtain bangs', 'slicked back', 'wet look',
    'cobre', 'skinimalism', '2025', '2026',
  ];
  if (trendKeywords.some(kw => msg.includes(kw))) {
    detected.add('trends');
  }

  return Array.from(detected);
}

// ─── buildFullContext ─────────────────────────────────────────────────────────

/**
 * Helper principal: construye el contexto completo para enviar a Claude API.
 * Combina el system prompt base con el conocimiento relevante detectado.
 *
 * Estrategia de tokens:
 * - System prompt (personalidad + boundaries + user context): ~3-5K tokens → SIEMPRE se incluye
 * - Conocimiento técnico: ~15-25K tokens → se filtra por topic detectado
 * - Si no se detecta topic específico: incluir todo el conocimiento (Claude con caching lo maneja)
 *
 * @param {Object|null} profile - Perfil del usuario
 * @param {Object|null} results - Resultados de tests
 * @param {string} userMessage - Mensaje actual del usuario
 * @returns {{ systemPrompt: string, knowledgeContext: string }}
 */
export function buildFullContext(profile, results, userMessage) {
  const systemPrompt = getSystemPrompt(profile, results);

  const detectedTopics = detectTopics(userMessage);
  const knowledgeContext = getKnowledgeContext(detectedTopics);

  return {
    systemPrompt,
    knowledgeContext,
    detectedTopics,
  };
}

// ─── Re-exports para acceso directo a los datos crudos ───────────────────────
// Útil si el backend necesita acceder a datos estructurados (por ejemplo,
// para devolver recomendaciones de colores sin pasar por Claude)

export {
  LUMINA_PERSONALITY,
  VISAGISM,
  COLOR_THEORY,
  SKINCARE,
  MAKEUP,
  TRENDS,
  BOUNDARIES,
};
