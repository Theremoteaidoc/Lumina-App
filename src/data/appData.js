// ═══════════════════════════════════════════════
// AFFIRMATION CARDS (Amor Propio)
// ═══════════════════════════════════════════════
export const AFFIRMATION_CARDS = [
  { affirmation: "Soy única y valiosa por quien soy.", verse: '"Te alabo porque soy una creación admirable. ¡Tus obras son maravillosas!" — Salmo 139:14' },
  { affirmation: "Mi belleza viene de adentro y brilla hacia afuera.", verse: '"Que su belleza sea la del interior, la que no se marchita." — 1 Pedro 3:3-4' },
  { affirmation: "Merezco cuidarme con amor y sin culpa.", verse: '"¿No saben que su cuerpo es templo del Espíritu Santo?" — 1 Corintios 6:19' },
  { affirmation: "Soy fuerte, capaz y llena de luz.", verse: '"Todo lo puedo en Cristo que me fortalece." — Filipenses 4:13' },
  { affirmation: "No me comparo, celebro lo que me hace diferente.", verse: '"Porque somos hechura de Dios, creados en Cristo Jesús." — Efesios 2:10' },
  { affirmation: "Mi piel cuenta mi historia y es hermosa.", verse: '"Tú creaste mis entrañas; me formaste en el vientre de mi madre." — Salmo 139:13' },
  { affirmation: "Hoy elijo ser amable conmigo misma.", verse: '"Sobre toda cosa guardada, guarda tu corazón." — Proverbios 4:23' },
  { affirmation: "Soy digna de amor, respeto y cuidado.", verse: '"Porque de tal manera amó Dios al mundo..." — Juan 3:16' },
];

// ═══════════════════════════════════════════════
// COLORIMETRÍA
// ═══════════════════════════════════════════════
export const COLORIMETRIA_QUESTIONS = [
  {
    question: "¿De qué color son las venas de tu muñeca a la luz natural?",
    options: [
      { text: "Azuladas o moradas", value: "frio" },
      { text: "Verdosas", value: "calido" },
      { text: "Una mezcla de ambas", value: "neutro" },
    ],
  },
  {
    question: "¿Qué joyería te favorece más?",
    options: [
      { text: "Plata y oro blanco", value: "frio" },
      { text: "Oro y dorado", value: "calido" },
      { text: "Ambas me quedan bien", value: "neutro" },
    ],
  },
  {
    question: "¿Cómo reacciona tu piel al sol?",
    options: [
      { text: "Me quemo fácilmente", value: "frio" },
      { text: "Me bronceo con facilidad", value: "calido" },
      { text: "Me quemo un poco y luego me bronceo", value: "neutro" },
    ],
  },
  {
    question: "¿Qué color de labial te favorece más?",
    options: [
      { text: "Rosa, cereza, ciruela", value: "frio" },
      { text: "Coral, durazno, terracota", value: "calido" },
      { text: "Nude rosado o mauve", value: "neutro" },
    ],
  },
  {
    question: "¿Cuál es el color natural de tus ojos?",
    options: [
      { text: "Azul, gris o verde azulado", value: "frio" },
      { text: "Marrón cálido, ámbar o avellana", value: "calido" },
      { text: "Marrón oscuro o negro", value: "neutro" },
    ],
  },
];

export const COLORIMETRIA_RESULTS = {
  frio: {
    title: "Subtono Frío",
    desc: "Tu piel tiene matices rosados, rojizos o azulados. Los colores fríos resaltan tu belleza natural.",
    colors: ["#4A6FA5", "#8B5E83", "#C75B7A", "#2E4057", "#D4A5A5", "#6B4C6E"],
    tips: "Los tonos joya como zafiro, esmeralda, rubí y amatista son tus aliados. En maquillaje, opta por bases con subtono rosado y labiales en tonos berry.",
  },
  calido: {
    title: "Subtono Cálido",
    desc: "Tu piel tiene matices dorados, melocotón o amarillentos. Los tonos tierra y cálidos te iluminan.",
    colors: ["#D4A373", "#E07A5F", "#F2CC8F", "#81B29A", "#C17817", "#A68A64"],
    tips: "Los tonos tierra como terracota, coral, dorado y verde oliva te favorecen. En bases, busca subtonos amarillos o dorados.",
  },
  neutro: {
    title: "Subtono Neutro",
    desc: "Tu piel tiene un equilibrio entre tonos cálidos y fríos. ¡Casi todo te queda bien!",
    colors: ["#B5838D", "#6D6875", "#FFCDB2", "#E5989B", "#7C9885", "#D4A373"],
    tips: "Puedes usar colores cálidos y fríos. Los tonos suaves y medios son especialmente favorecedores. Nude rosado y malva son tus básicos.",
  },
};

// ═══════════════════════════════════════════════
// TEST DE PIEL
// ═══════════════════════════════════════════════
export const SKIN_QUESTIONS = [
  {
    question: "¿Cómo se siente tu piel al despertar?",
    options: [
      { text: "Tirante y seca", value: "seca" },
      { text: "Brillosa en toda la cara", value: "grasa" },
      { text: "Brillosa en la zona T, seca en mejillas", value: "mixta" },
      { text: "Cómoda, sin exceso de grasa ni sequedad", value: "normal" },
    ],
  },
  {
    question: "¿Cómo lucen tus poros?",
    options: [
      { text: "Casi invisibles", value: "seca" },
      { text: "Grandes y visibles en toda la cara", value: "grasa" },
      { text: "Visibles solo en nariz y frente", value: "mixta" },
      { text: "Pequeños y uniformes", value: "normal" },
    ],
  },
  {
    question: "A media tarde, tu piel luce...",
    options: [
      { text: "Escamosa o con parches secos", value: "seca" },
      { text: "Muy brillante", value: "grasa" },
      { text: "Brillante solo en la zona T", value: "mixta" },
      { text: "Fresca y equilibrada", value: "normal" },
    ],
  },
  {
    question: "¿Con qué frecuencia tienes brotes de acné?",
    options: [
      { text: "Rara vez, pero tengo descamación", value: "seca" },
      { text: "Frecuentemente, especialmente puntos negros", value: "grasa" },
      { text: "A veces, solo en frente y nariz", value: "mixta" },
      { text: "Ocasionalmente", value: "normal" },
    ],
  },
  {
    question: "¿Tu piel reacciona fácilmente a productos nuevos?",
    options: [
      { text: "Sí, se irrita y enrojece", value: "sensible" },
      { text: "No, tolera casi todo", value: "normal" },
      { text: "A veces, depende del producto", value: "mixta" },
      { text: "Solo si tienen alcohol o fragancia", value: "seca" },
    ],
  },
];

export const SKIN_RESULTS = {
  seca: {
    title: "Piel Seca", icon: "💧",
    desc: "Tu piel tiende a perder hidratación rápidamente.",
    tips: ["Limpiadores suaves sin sulfatos", "Sérum de ácido hialurónico sobre piel húmeda", "Hidratante rica en ceramidas mañana y noche", "SPF 50 diario (fórmulas cremosas)"],
    vitamins: ["Vitamina E — Antioxidante y reparadora", "Omega 3 — Fortalece barrera cutánea", "Vitamina D — Regeneración celular"],
  },
  grasa: {
    title: "Piel Grasa", icon: "✨",
    desc: "Tu piel produce más sebo del necesario.",
    tips: ["Limpiador con ácido salicílico (BHA)", "Tónico con niacinamida para controlar brillo", "Hidratante gel oil-free", "SPF 50 matificante"],
    vitamins: ["Zinc — Regula producción de sebo", "Vitamina A (Retinol) — Renueva la piel", "Niacinamida (B3) — Minimiza poros"],
  },
  mixta: {
    title: "Piel Mixta", icon: "🌿",
    desc: "Tu zona T es más grasa mientras tus mejillas tienden a secarse.",
    tips: ["Limpiador suave de pH balanceado", "Sérum de niacinamida en zona T", "Hidratante ligera para todo el rostro", "SPF 50 de textura fluida"],
    vitamins: ["Niacinamida (B3) — Equilibra la piel", "Vitamina C — Luminosidad pareja", "Probióticos — Microbioma saludable"],
  },
  normal: {
    title: "Piel Normal", icon: "🌸",
    desc: "¡Tu piel está en equilibrio natural!",
    tips: ["Limpiador suave diario", "Sérum antioxidante (Vitamina C)", "Hidratante ligera", "SPF 50 diario"],
    vitamins: ["Vitamina C — Mantiene luminosidad", "Vitamina E — Protección antioxidante", "Colágeno — Previene envejecimiento"],
  },
  sensible: {
    title: "Piel Sensible", icon: "🩹",
    desc: "Tu piel reacciona con facilidad a estímulos externos.",
    tips: ["Limpiador micelar sin fragancia", "Sérum calmante con centella asiática", "Hidratante con avena coloidal", "SPF mineral (óxido de zinc)"],
    vitamins: ["Vitamina B5 — Calmante y reparadora", "Aloe Vera — Antiinflamatorio natural", "Omega 6 — Refuerza la barrera"],
  },
};

// ═══════════════════════════════════════════════
// FACE SHAPE RECOMMENDATIONS (Visagismo)
// ═══════════════════════════════════════════════
export const FACE_DATA = {
  ovalado: {
    title: "Rostro Ovalado", emoji: "🥚",
    desc: "Tu rostro tiene proporciones equilibradas. Los pómulos son la zona más ancha y la mandíbula se estrecha suavemente.",
    makeup: ["Contouring suave en pómulos para definir", "Iluminador en arco de Cupido, puente nasal y pómulos altos", "Blush en la manzana de las mejillas hacia las sienes", "Cejas con arco natural suave"],
    haircuts: ["Prácticamente cualquier corte te favorece", "Capas largas que enmarquen el rostro", "Bob a la altura de la mandíbula", "Flequillo lateral o cortina"],
    necklines: ["Cuello en V", "Escote corazón", "Cuello redondo", "Off-shoulder", "Halter"],
    contourZones: "Bronzer suave bajo pómulos. Iluminador en frente, nariz y mentón.",
  },
  redondo: {
    title: "Rostro Redondo", emoji: "🌕",
    desc: "Tu rostro tiene ancho y largo similares, con mejillas llenas y mandíbula suavemente redondeada.",
    makeup: ["Contorno en laterales de frente y bajo pómulos", "Iluminador en centro de frente y puente nasal", "Blush en diagonal hacia las sienes", "Cejas con arco definido para añadir ángulos"],
    haircuts: ["Capas largas por debajo del mentón", "Volumen en la coronilla", "Raya lateral profunda", "Evitar bobs a la altura de la mejilla"],
    necklines: ["Cuello en V profundo", "Escote en pico", "Cuello asimétrico", "Evitar cuellos redondos"],
    contourZones: "Contorno fuerte en laterales. Iluminar solo la zona central.",
  },
  cuadrado: {
    title: "Rostro Cuadrado", emoji: "⬜",
    desc: "Frente, pómulos y mandíbula de ancho similar, con ángulos marcados y mandíbula fuerte.",
    makeup: ["Contorno en esquinas de frente y mandíbula", "Iluminador en el centro del rostro", "Blush en pómulos altos hacia arriba", "Cejas con curva suave"],
    haircuts: ["Capas suaves que suavicen ángulos", "Ondas sueltas y rizos", "Flequillo cortina largo", "Evitar cortes geométricos"],
    necklines: ["Escote redondo", "Cuello scoop", "Off-shoulder", "Evitar cuellos cuadrados"],
    contourZones: "Contorno en las 4 esquinas (frente lateral + mandíbula). Iluminar centro.",
  },
  corazon: {
    title: "Rostro Corazón", emoji: "💛",
    desc: "Tu frente es la parte más ancha, con pómulos prominentes y mentón estrecho y delicado.",
    makeup: ["Contorno en sienes y laterales de frente", "Iluminador en mentón para equilibrar", "Blush horizontal en las mejillas", "Cejas con arco redondeado"],
    haircuts: ["Bob largo con volumen en las puntas", "Capas a la altura del mentón", "Flequillo lateral", "Evitar volumen excesivo arriba"],
    necklines: ["Escote en V", "Cuello barco", "Escote corazón", "Strapless"],
    contourZones: "Contorno en sienes y frente lateral. Iluminar mentón y mejillas bajas.",
  },
  alargado: {
    title: "Rostro Alargado", emoji: "📐",
    desc: "Tu rostro es significativamente más largo que ancho, con frente alta y mejillas rectas.",
    makeup: ["Contorno en frente superior y punta del mentón", "Iluminador lateral en pómulos", "Blush horizontal para crear ancho", "Cejas rectas o con arco bajo"],
    haircuts: ["Flequillo recto o cortina", "Ondas y volumen lateral", "Bob hasta la mandíbula", "Evitar cabello largo y lacio"],
    necklines: ["Cuello barco", "Escote bandeau", "Off-shoulder amplio", "Evitar V muy profundo"],
    contourZones: "Contorno horizontal en frente y mentón. Iluminar lateralmente en pómulos.",
  },
  diamante: {
    title: "Rostro Diamante", emoji: "💎",
    desc: "Tus pómulos son claramente la parte más ancha, con frente y mentón más estrechos.",
    makeup: ["Iluminador en frente para ampliar", "Contorno suave bajo pómulos", "Blush en mejillas hacia arriba", "Iluminador en mentón"],
    haircuts: ["Flequillo lateral para ampliar frente", "Volumen en coronilla y mandíbula", "Bob con textura", "Evitar peinados que ensanchen pómulos"],
    necklines: ["Cuello en V", "Escote corazón", "Cuello alto (turtleneck)", "Collares statement"],
    contourZones: "Contorno sutil bajo pómulos. Iluminar frente, mentón y lados de mandíbula.",
  },
};
