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

// ═══════════════════════════════════════════════
// EYE SHAPE RECOMMENDATIONS (Maquillaje de ojos)
// Based on: AI-Driven Makeup Suggestions (Technomedia Journal 2024)
// + IPSY, Maybelline, L'Oréal, Patrick Ta professional guidelines
// ═══════════════════════════════════════════════
export const EYE_DATA = {
  almendra: {
    title: "Ojos Almendra", emoji: "🌰",
    desc: "Tus ojos tienen forma ovalada con extremos ligeramente afinados. Es la forma más versátil — casi cualquier técnica te funciona.",
    eyeliner: [
      "Wing clásico: sigue la línea natural de tu párpado inferior hacia arriba",
      "Delineado fino en la línea de las pestañas superiores",
      "Puedes delinear arriba y abajo sin que se vea pesado",
    ],
    eyeshadow: [
      "Degradado desde la línea de pestañas hasta la cuenca del ojo",
      "Tono claro en todo el párpado, medio en el pliegue, oscuro en V externa",
      "Iluminador en el lagrimal y bajo la ceja",
    ],
    tips: [
      "Tienes libertad total — experimenta con smokey eyes, cut crease o halo eye",
      "El delineado con wing moderado resalta tu forma natural",
      "Pestañas postizas con más volumen al centro abren la mirada",
    ],
  },
  redondo: {
    title: "Ojos Redondos", emoji: "👁️",
    desc: "Tus ojos son grandes y abiertos, con forma circular que les da un look juvenil y expresivo.",
    eyeliner: [
      "Alarga el delineado hacia la esquina externa en forma de ala",
      "Evita delinear completamente alrededor (exagera la redondez)",
      "Difumina la línea inferior solo en el tercio externo",
    ],
    eyeshadow: [
      "Tono oscuro en la esquina externa formando una V y difuminando hacia afuera",
      "Tono medio en el pliegue para dar profundidad",
      "Evita sombra brillante en todo el párpado — úsala solo en el lagrimal",
    ],
    tips: [
      "Técnica de elongación: difumina todo hacia afuera para alargar visualmente",
      "Smokey eye con énfasis en las esquinas externas es tu look estrella",
      "Pestañas postizas con más largo en las puntas externas",
    ],
  },
  rasgado: {
    title: "Ojos Rasgados", emoji: "😺",
    desc: "Las esquinas externas de tus ojos apuntan hacia arriba, creando un efecto felino natural muy favorecedor.",
    eyeliner: [
      "Sigue la línea natural ascendente — ya tienes un cat eye incorporado",
      "Un delineado fino que trace la línea de pestañas es suficiente",
      "Puedes delinear la línea inferior también para un efecto más intenso",
    ],
    eyeshadow: [
      "Tonos oscuros en la esquina externa siguiendo la línea ascendente",
      "Sombra media en el pliegue difuminada hacia arriba",
      "Iluminador en el lagrimal para abrir la mirada",
    ],
    tips: [
      "Tu forma natural ya es muy deseada — acentúala con un delineado sutil",
      "Evita wings excesivamente dramáticos que hagan la mirada demasiado intensa",
      "Pestañas postizas con distribución uniforme complementan muy bien",
    ],
  },
  caido: {
    title: "Ojos Caídos", emoji: "🕊️",
    desc: "Las esquinas externas de tus ojos caen ligeramente, dando un look dulce y melancólico muy romántico.",
    eyeliner: [
      "Wing hacia ARRIBA — no sigas la línea natural del ojo, levanta la esquina",
      "Comienza el delineado más grueso a partir de 2/3 del ojo hacia afuera",
      "Evita delinear la esquina externa inferior (acentúa la caída)",
    ],
    eyeshadow: [
      "Tonos claros en el párpado y tonos oscuros en la esquina externa dirigidos HACIA ARRIBA",
      "Difumina la sombra con ángulo ascendente, nunca siguiendo la caída",
      "Iluminador en el lagrimal y bajo la ceja en la esquina externa",
    ],
    tips: [
      "El objetivo es crear un efecto lifting visual — todo va hacia arriba",
      "Rizador de pestañas es tu herramienta esencial",
      "Pestañas postizas con más volumen y largo en las esquinas externas levantan la mirada",
    ],
  },
  encapotado: {
    title: "Ojos Encapotados", emoji: "🧢",
    desc: "Tu párpado superior tiene un pliegue de piel que cubre parte del ojo. Es muy común y tiene trucos específicos para resaltar tus ojos.",
    eyeliner: [
      "Aplica el delineado con los ojos ABIERTOS para ver dónde cae el pliegue",
      "Usa delineador más grueso para que se vea cuando el ojo está abierto",
      "El wing debe empezar más arriba de lo normal y ser más pronunciado",
    ],
    eyeshadow: [
      "Aplica la sombra SOBRE el pliegue — la cuenca debe verse con el ojo abierto",
      "Usa sombras mate en el pliegue — las brillantes acentúan el capuchón",
      "Sombra de transición por encima del pliegue natural para crear profundidad",
    ],
    tips: [
      "Regla de oro: maquíllate siempre con los ojos abiertos para verificar la visibilidad",
      "Cut crease y half-cut crease son técnicas que te favorecen mucho",
      "Usa primer para ojos — los párpados encapotados tienden a mover el maquillaje",
      "Las pestañas rizadas y con volumen abren mucho la mirada",
    ],
  },
};

// ═══════════════════════════════════════════════
// COMBINED FACE + EYE TIPS
// ═══════════════════════════════════════════════
export const COMBINED_TIPS = {
  // Tips que combinan forma de rostro + forma de ojos
  "redondo+caido": "Con rostro redondo y ojos caídos, enfócate en crear líneas ascendentes en los ojos y diagonales en el contorno facial para alargar y levantar.",
  "redondo+redondo": "Rostro y ojos redondos — usa técnicas de elongación tanto en el contorno facial (diagonales) como en los ojos (difuminar hacia afuera).",
  "cuadrado+encapotado": "Suaviza los ángulos de tu rostro con contorno redondeado y abre tus ojos aplicando sombra sobre el pliegue natural.",
  "ovalado+almendra": "¡Combinación muy versátil! Tienes libertad total para experimentar con cualquier estilo de maquillaje.",
  "corazon+rasgado": "Tu look natural ya es muy llamativo — contorno en sienes + delineado sutil que siga tu cat eye natural.",
  "alargado+encapotado": "Crea ancho visual con blush horizontal y abre los ojos con sombra sobre el pliegue y pestañas con volumen.",
};
