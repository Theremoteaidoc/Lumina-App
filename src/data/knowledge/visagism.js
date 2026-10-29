// ═══════════════════════════════════════════════════════════════
// VISAGISMO — Base de conocimiento para el backend de chat
// Versión: 1.0 | Sprint 1
// Fuentes: Hallawell (Face Forward), Faciometrics (Carnegie Mellon),
// principios de proporción áurea aplicados a morfología facial.
// ═══════════════════════════════════════════════════════════════

export const VISAGISM = {

  introduction: `El visagismo es el estudio de la morfología facial aplicado a decisiones estéticas: cortes de cabello, maquillaje, accesorios, escotes y más. La palabra viene del francés "visage" (rostro) y fue sistematizada principalmente por el estilista brasileño Roberto Calazans y desarrollada ampliamente por expertos como Paula Hallawell en su libro Face Forward. La premisa es sencilla: las distintas formas de rostro crean diferentes líneas visuales, y ciertos elementos estéticos armonizan con esas líneas o las contradictan. El objetivo no es homogenizar los rostros hacia un ideal único, sino entender el lenguaje de proporciones de cada uno para poder jugar con él con intención. El visagismo describe — nunca prescribe. Conocer la forma de tu rostro te da vocabulario, no restricciones.`,

  scientificBasis: `La base científica del visagismo se apoya en la geometría facial cuantitativa. Paula Hallawell sistematizó categorías morfológicas basadas en proporciones medibles. El proyecto Faciometrics de Carnegie Mellon University estableció métodos computacionales para medir proporciones clave: el índice anchura-altura del rostro (WHR, width-to-height ratio), la relación mandíbula-frente (JFR, jaw-to-forehead ratio) y la relación pómulos-mandíbula (CJR, cheekbone-to-jaw ratio). Estas métricas, combinadas con la observación de los contornos generales, permiten clasificar las formas faciales con criterios más objetivos que la sola impresión visual. Sin embargo, toda clasificación es una simplificación: la mayoría de los rostros reales son combinaciones o variantes de las categorías estándar.`,

  measurements: {
    whr: `WHR — Índice anchura-altura (Width-to-Height Ratio): Se calcula dividiendo el ancho máximo del rostro (usualmente a nivel de los pómulos) entre la altura desde el mentón hasta la mitad de la frente. Un WHR mayor indica un rostro proporcionalmente más ancho; uno menor indica más alargado. Es el indicador principal para distinguir, por ejemplo, un rostro redondo (WHR cercano a 1:1) de uno alargado (WHR más bajo).`,
    jfr: `JFR — Relación mandíbula-frente (Jaw-to-Forehead Ratio): Compara el ancho de la mandíbula con el ancho de la frente. Si la mandíbula es más ancha o igual, el rostro tiende a ser cuadrado o trapecio. Si la frente es notablemente más ancha que la mandíbula, el resultado es forma corazón o triangular. Si son similares, apunta a oval o redondo.`,
    cjr: `CJR — Relación pómulos-mandíbula (Cheekbone-to-Jaw Ratio): Mide cuánto más anchos son los pómulos respecto a la mandíbula. Un CJR muy alto — pómulos mucho más anchos que mandíbula — es la característica definitoria del rostro diamante. Un CJR moderado con mandíbula estrecha y frente también estrecha sugiere oval alargado.`,
  },

  faceShapes: {
    oval: {
      name: `Ovalado`,
      proportions: `El largo del rostro es aproximadamente 1.5 veces el ancho. Los pómulos son la zona más amplia. La frente es ligeramente más ancha que la mandíbula. El mentón se estrecha suavemente hacia abajo en una curva sin ángulos marcados. WHR típico: 0.65–0.75.`,
      personality: `Culturalmente el rostro ovalado se ha asociado con "equilibrio clásico", aunque esto refleja más la historia de los cánones de belleza occidentales que ninguna realidad intrínseca. Muchas culturas tienen sus propios ideales que no priorizan el óvalo. Lo que sí es cierto es que sus proporciones equilibradas hacen que muchos elementos estéticos — cortes, accesorios, maquillaje — funcionen sin tensión visual.`,
      harmonious: `La versatilidad es la característica principal: prácticamente cualquier corte, escote y estilo de aretes funciona. Los cortes bob a la mandíbula, las capas largas, el flequillo lateral, el recogido alto — todos se integran bien. En maquillaje, el contouring suave en pómulos y un iluminador en los puntos altos (arco de Cupido, puente nasal, pómulos) realza las proporciones sin necesidad de corrección. Los aretes de cualquier longitud funcionan.`,
      play: `Para crear más angularidad: usar contouring definido en mandíbula y sien, cabello con más volumen lateral. Para suavizar aún más: blush circular en la manzana de las mejillas, cabello con ondas suaves. El ovalado admite prácticamente cualquier dirección de "juego".`,
      famousExamples: `Beyoncé (ojos almendra + rostro ovalado), Priyanka Chopra (actriz india-estadounidense), Lupita Nyong'o (actriz keniana-mexicana). La inclusión de estos ejemplos busca mostrar que esta forma no pertenece a ningún origen étnico específico.`,
      notRules: `Muchas mujeres con rostro ovalado llevan cortes pixie, bob geométrico o recogidos que "deberían" no favorecer la forma — y se ven extraordinariamente bien. El ovalado no es garantía de que todo funcione sin criterio propio; es simplemente una forma que tiene pocas tensiones visuales evidentes. El criterio personal, la textura del cabello y el estilo de vida importan mucho más.`,
    },

    round: {
      name: `Redondo`,
      proportions: `El ancho y el largo del rostro son muy similares (WHR cercano a 1:1 o mayor). Las mejillas son la zona más llena y ancha, y los contornos son curvos sin ángulos definidos en frente ni mandíbula. El mentón es redondeado. JFR cercano a 1:1 — frente y mandíbula tienen ancho similar.`,
      personality: `El rostro redondo se asocia culturalmente con juventud y accesibilidad. En muchas culturas del este de Asia, las mejillas llenas son un marcador de salud y belleza. En occidente, históricamente se ha presionado a las personas con esta forma para "adelgazarlo" visualmente, lo cual es un prejuicio estético sin base objetiva. Lumina no parte de esa presunción.`,
      harmonious: `Los elementos que crean ilusión de longitud armonizan bien: capas largas por debajo del mentón, raya lateral profunda, recogidos altos. Los aretes alargados y en gota crean verticalidad. El delineado de ojos con énfasis en las esquinas externas. La ropa con escotes en V o en pico alarga el cuello visualmente.`,
      play: `Para crear más longitud: contorno en sienes y laterales del rostro, blush en diagonal hacia las sienes, cabello con volumen en la coronilla. Para abrazar la redondez: blush circular centrado en la manzana de las mejillas, accesorios redondeados, cortes bob a la mandíbula con volumen lateral. Ambas son opciones válidas según preferencia personal.`,
      famousExamples: `Selena Gomez, Chrissy Teigen (modelo y presentadora estadounidense de origen tailandés-noruego), Ginnifer Goodwin. También muchas modelos y actrices del cine coreano y japonés contemporáneo.`,
      notRules: `El corte bob a la altura de la mejilla "supuestamente" no favorece al rostro redondo — y sin embargo innumerables personas con esta forma lo llevan y se ven impecables. Las reglas del visagismo son puntos de partida, no sentencias.`,
    },

    square: {
      name: `Cuadrado`,
      proportions: `Frente, pómulos y mandíbula tienen anchos similares. La mandíbula es angular y definida, con esquinas marcadas. La diferencia entre el ancho y el largo es pequeña, similar al redondo, pero lo que lo distingue son los ángulos en lugar de las curvas. JFR cercano o mayor a 1 — la mandíbula es tan o más ancha que la frente.`,
      personality: `La mandíbula definida se asocia culturalmente con fortaleza y determinación. En la fotografía de moda y en el modelaje, el rostro cuadrado es muy apreciado por su "presencia en cámara". Históricamente también ha sido objeto de presión para "suavizarlo" con técnicas de maquillaje, lo que es una presunción estética que Lumina no comparte.`,
      harmonious: `Los elementos con líneas curvas y suaves contrastan de manera interesante con la angularidad natural: ondas sueltas, capas con movimiento, flequillo cortina largo. Los aretes redondos u ovalados. Los escotes redondos o con suavidad. En maquillaje, el blush aplicado hacia arriba y los ojos con técnica suavizante (smokey difuminado) crean contraste cálido.`,
      play: `Para acentuar los ángulos (muchas personas los aman): contouring recto y definido, cabello lacio con raya al centro, aretes geométricos. Para suavizarlos: contouring difuminado en las cuatro esquinas (frente lateral y mandíbula), rizos o texturas, flequillo que rompa la línea de la frente.`,
      famousExamples: `Olivia Wilde, Keira Knightley, Rosario Dawson (actriz de origen puertorriqueño-estadounidense). La mandíbula marcada es también un rasgo común en muchas mujeres de origen indígena latinoamericano.`,
      notRules: `Muchas personas con rostro cuadrado llevan cortes geométricos bob perfectamente rectos — en teoría "contraproducentes" — y crean un look de alta moda absolutamente coherente. El visagismo es una herramienta, no una regla de vida.`,
    },

    heart: {
      name: `Corazón`,
      proportions: `La frente es la zona más ancha del rostro. Los pómulos son prominentes. La mandíbula se estrecha hacia un mentón delicado y relativamente puntiagudo. El JFR es notablemente mayor a 1 — la frente es significativamente más ancha que la mandíbula. Vista de frente, la forma recuerda la silueta de un corazón invertido.`,
      personality: `Culturalmente el mentón delicado se ha asociado con delicadeza y feminidad en muchas tradiciones estéticas. En el este de Asia, esta forma es frecuentemente considerada un ideal de belleza. Lumina no jerarquiza formas sino que describe proporciones para trabajar con ellas de manera informada.`,
      harmonious: `El volumen en la zona de la mandíbula y el mentón crea equilibrio visual con la frente ancha: capas que abren hacia abajo desde la mandíbula, bobs con volumen en las puntas. Los aretes en forma de gota o triangulares apuntando hacia abajo añaden anchura en la parte baja. En maquillaje, el iluminador en el mentón y el contouring en las sienes equilibran las proporciones.`,
      play: `Para equilibrar frente y mentón: volumen bajo, aretes amplios. Para acentuar la estructura superior: flequillo lateral, recogido alto con volumen en sienes, delineado de cejas con cuerpo. Ambas opciones tienen coherencia estética propia.`,
      famousExamples: `Reese Witherspoon, Mindy Kaling (actriz y escritora de origen indio-estadounidense), Halle Berry. Esta forma también es común en muchas mujeres de origen latinoamericano y del sudeste asiático.`,
      notRules: `El flequillo recto "supuestamente" acentúa la frente ancha. Sin embargo, muchas personas con rostro corazón llevan flequillo recto y el resultado es llamativo y coherente con su estilo. El mito de que el flequillo "empeora" el rostro corazón no tiene más base que un criterio estético parcial.`,
    },

    long: {
      name: `Alargado`,
      proportions: `El largo del rostro es notablemente mayor que el ancho. WHR típico: menor a 0.65. La frente es alta, los pómulos pueden ser suaves o marcados, y la mandíbula tiende a ser estrecha. El mentón puede ser redondeado o levemente cuadrado. La principal característica es la verticalidad del conjunto.`,
      personality: `El rostro alargado es típico en muchas poblaciones de África subsahariana, Europa del norte y algunas regiones de Asia central. Se asocia en algunos contextos culturales con elegancia y distinción. En modelos de alta moda, esta forma es muy frecuente por cómo proyecta en fotografía.`,
      harmonious: `Los elementos que crean la ilusión de más anchura equilibran las proporciones: flequillo recto o de cortina (divide visualmente la frente alta), ondas y volumen lateral, bob a la mandíbula con textura. Los aretes anchos y horizontales, los collares llamativos. Los escotes barco o bandeau son particularmente favorables. El blush aplicado horizontalmente en las mejillas crea ancho.`,
      play: `Para acentuar la verticalidad: recogidos altos, escotes en V, aretes largos. Para crear más equilibrio horizontal: flequillo, volumen lateral, blush en polvo aplicado ampliamente. La elección depende del efecto deseado.`,
      famousExamples: `Ciara (cantante estadounidense de origen afroamericano), Sarah Jessica Parker, Adut Akech (modelo sudanesa radicada en Australia). El rostro alargado es una de las formas más representadas en las pasarelas internacionales.`,
      notRules: `La regla de "nunca cabello largo y lacio con rostro alargado" no tiene excepciones absolutas. Muchos modelos con esta forma llevan cabello largo y completamente liso como firma de su estilo. El contexto, la proporción del cuerpo y el estilo personal cambian todo.`,
    },

    diamond: {
      name: `Diamante`,
      proportions: `Los pómulos son la zona más ancha y prominente del rostro, claramente más anchos que la frente y que la mandíbula. CJR alto. La frente es relativamente estrecha. El mentón puede ser algo puntiagudo. Vista de frente, la silueta recuerda a un rombo o diamante. Es una de las formas menos comunes.`,
      personality: `La prominencia de los pómulos es un rasgo muy apreciado en diversas culturas a nivel global. En modelos de moda internacional, los pómulos altos y marcados son frecuentemente destacados. En muchas culturas indígenas de América, Asia y África, la prominencia de los pómulos es un marcador identitario y estético valorado.`,
      harmonious: `Los elementos que añaden ancho en frente y mentón equilibran la zona media: flequillo lateral (amplía la frente), cabello con volumen en la coronilla y en la mandíbula, corte con layers abiertos. Los aretes que cuelgan más allá del mentón crean longitud. En maquillaje, el iluminador en la frente y en el mentón añade dimensión a las zonas más estrechas.`,
      play: `Para acentuar los pómulos (que ya son naturalmente llamativos): blush difuminado hacia arriba, iluminador directamente sobre el pómulo, recogido que descubra completamente el área. Para equilibrar las proporciones: volumen en las zonas más estrechas, contouring suave bajo los pómulos.`,
      famousExamples: `Ana de Armas (actriz cubana-española), Rihanna, Thandiwe Newton (actriz zimbabuense-británica). Los pómulos marcados son un rasgo frecuente en múltiples grupos étnicos y geografías.`,
      notRules: `Nota de coordinación: MediaPipe (el clasificador facial de la app) no clasifica el rostro diamante con alta precisión — las proporciones de frente estrecha más pómulos amplios más mandíbula estrecha generan a veces clasificación ambigua entre ovalado y corazón. Si la app clasifica tu rostro como uno de esos dos, es posible que el diamante sea la descripción más precisa. Coordinar con el equipo de frontend para mejorar este caso específico en próximas versiones.`,
    },
  },

  commonMisconceptions: [
    `"Mi forma de rostro determina lo que me favorece" — El visagismo ofrece orientación, no determinismo. El tono de piel, la textura del cabello, la estructura del cuello y los hombros, el estilo personal y la confianza cambian el resultado final.`,
    `"Hay formas de rostro más bonitas que otras" — Las formas de rostro son geometrías, no jerarquías. Lo que sí existe son cánones de belleza culturales que han privilegiado ciertas formas en ciertos momentos — pero los cánones cambian y siempre han sido arbitrarios.`,
    `"Tengo que identificar una sola forma de rostro" — La mayoría de los rostros reales son combinaciones o variantes. Un rostro puede ser "ovalado tirando a cuadrado" o "corazón suave". La clasificación binaria es útil como punto de partida, no como verdad absoluta.`,
    `"Si tengo rostro redondo debo hacer contouring siempre" — El contouring es una opción creativa, no una obligación correctiva. Muchas personas con rostro redondo no usan contouring y tienen un look impecable.`,
    `"El visagismo solo aplica al maquillaje" — También guía cortes de cabello, accesorios, escotes, monturas de anteojos y otras decisiones estéticas. Es un sistema de proporciones, no una técnica de maquillaje específica.`,
    `"Después de aprender visagismo sé exactamente qué me favorece" — El aprendizaje en estética es empírico. Las guías son puntos de partida para la experimentación, no algoritmos que devuelven respuestas únicas.`,
  ],

  philosophy: `El visagismo en Lumina parte de la convicción de que conocer la arquitectura de tu rostro es un acto de autoconocimiento, no de autocorrección. Las recomendaciones de esta sección buscan darte vocabulario y herramientas para jugar con tu apariencia desde un lugar de comprensión — no para "arreglar" nada. No hay nada que arreglar. Hay mucho que explorar.`,
};
