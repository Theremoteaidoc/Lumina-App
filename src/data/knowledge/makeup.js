// ═══════════════════════════════════════════════════════════════
// MAQUILLAJE — Base de conocimiento para el backend de chat
// Versión: 1.0 | Sprint 1
// Fuentes: principios de maquillaje profesional (Charlotte Tilbury,
// Lisa Eldridge), técnicas adaptadas por forma de rostro y ojo,
// referencias de educación en belleza inclusiva.
// ═══════════════════════════════════════════════════════════════

export const MAKEUP = {

  introduction: `El maquillaje es un lenguaje de expresión personal, no un uniforme de corrección. En su mejor versión, es juego: una forma de experimentar con la identidad, resaltar lo que uno siente bonito y celebrar los rasgos propios. En su versión menos útil, se convierte en una herramienta de "arreglo" impulsada por inseguridades. Lumina trabaja desde la primera perspectiva. Las técnicas aquí descritas son herramientas — no obligaciones.`,

  philosophy: `El maquillaje bien aplicado no se nota como "maquillaje excesivo" — se nota como "esa persona se ve muy bien". El objetivo no es ocultar sino revelar. La piel bien cuidada es la mejor base. El dominio de dos o tres técnicas básicas supera en resultado a una colección de productos sin técnica. Y el mejor look siempre es el que hace que quien lo lleva se sienta a gusto consigo misma.`,

  principles: {
    lessIsMore: `Cada producto adicional que se añade a un look tiene el potencial de restar naturalidad. Empezar con poco y añadir es más fácil que corregir el exceso. La regla no escrita del maquillaje profesional: si puedes verlo claramente en foto, probablemente es demasiado para uso cotidiano.`,
    enhanceNotMask: `Los productos están para realzar, no para crear una máscara. Una base que coincide perfectamente con la piel la hace verse mejor, no diferente. El contouring suave que acentúa los pómulos existentes es más favorecedor que uno que remodela visualmente toda la estructura facial.`,
    skinFirst: `Ningún maquillaje funciona bien sobre piel mal preparada. Hidratación adecuada, SPF y un buen primer hacen que cualquier base — incluso la más accesible — se vea mucho mejor y dure más.`,
    blendingMatters: `El difuminado es la habilidad número uno del maquillaje. Un producto de gama media perfectamente difuminado supera en resultado a un producto de lujo mal aplicado. Las líneas duras casi siempre son error de difuminado, no de producto.`,
    ownYourFeatures: `Las técnicas de contouring, corrección y "sculpting" son opciones, no normas. Muchas personas llevan años sin usarlos y tienen looks impecables. Que exista una técnica "para tu forma de rostro" no significa que debas usarla — significa que está disponible si quieres explorarla.`,
  },

  techniques: {
    foundation: {
      description: `La base de maquillaje unifica el tono, cubre imperfecciones y crea el "lienzo" sobre el que aplican otros productos. Existe en distintas coberturas (ligera, media, total) y fórmulas (fluida, crema, mousse, en barra, polvo).`,
      application: `La clave es la mezcla: esponja húmeda (tipo beauty blender) para un acabado más natural, brocha plana para cobertura y brocha kabuki para polvo. Aplicar desde el centro del rostro hacia afuera. Trabajar en capas finas — una segunda capa fina siempre es mejor que una primera capa gruesa.`,
      colorMatching: `Probar la base en la mandíbula o el cuello, nunca en la mano. Tomar la muestra bajo luz natural. La base correcta desaparece sobre la piel — no se ve ni más clara ni más oscura. El subtono de la base debe coincidir con el subtono de la piel.`,
      tips: [
        `Para piel grasa: bases de larga duración o matificantes, finishing en polvo suelto translúcido, fijador en spray`,
        `Para piel seca: bases hidratantes o de acabado luminoso, mezclar una gota de aceite facial si la base queda muy seca`,
        `Para piel sensible: bases sin fragancia, con SPF incorporado opcional, probadas antes en una zona pequeña`,
        `La "no base" también es un look: tinte de labios, máscara y corrector puntual pueden ser suficientes para un look natural impecable`,
      ],
    },

    concealer: {
      description: `El corrector tiene cobertura más alta que la base y se usa para áreas específicas: ojeras, granitos, imperfecciones puntuales, enrojecimiento localizado.`,
      application: `Para ojeras: aplicar en forma de triángulo invertido bajo el ojo y difuminar bien — la mayoría del corrector de ojeras falla por exceso de producto y difuminado insuficiente. Para granitos: aplicar con pincel pequeño sobre el grano ya cubierto con base, sellar con polvo traslúcido.`,
      colorMatching: `Para ojeras: ligeramente más claro que el tono de piel — no más de dos tonos. Para granitos: igual al tono de base. El corrector demasiado claro bajo los ojos genera el efecto "panda" inverso que también se nota.`,
      tips: [
        `El corrector de ojeras color naranja o salmón es útil para ojeras muy oscuras o azuladas (neutraliza el pigmento frío) — pero necesita base o corrector de tono sobre él`,
        `No aplicar demasiado corrector: acumula en líneas y arrugas y se cuartea a lo largo del día`,
      ],
    },

    blush: {
      description: `El rubor (blush) devuelve color al rostro y crea un efecto de salud y vitalidad. Es uno de los productos que más diferencia visible hace con la menor cantidad de producto.`,
      application: `La zona clásica: la manzana de las mejillas (la parte que se levanta al sonreír) difuminando hacia la sien. Para un efecto más moderno: aplicar en diagonal desde el pómulo hacia la sien. Para un efecto "flush" natural: aplicar ligeramente en nariz y frente también.`,
      byTone: `Piel clara: rosas, melocotón, nude. Piel media: coral, durazno, mauve. Piel morena: terracota, ladrillo, rosa profundo, naranja cálido. Piel oscura profunda: berry intenso, cobre, bronce rojizo. Estas son orientaciones — el color de rubor favorito es el que se ve bien y genera la sensación buscada.`,
      tips: [
        `El blush es casi imposible de "equivocar" si se usa en cantidad moderada y se difumina bien`,
        `Un rubor en polvo va mejor sobre base en polvo; uno en crema va mejor sobre base fluida o desnuda`,
        `El "blush draping" (técnica 2024-2025): rubor amplio desde el pómulo hasta el contorno del ojo. Favorece especialmente a pómulos altos.`,
      ],
    },

    bronzer: {
      description: `El bronceador simula el efecto del sol — crea dimensión y calidez en el rostro. A diferencia del contouring (que crea sombra), el bronceador añade calidez dorada.`,
      application: `Zonas donde el sol toca naturalmente: frente, punta de la nariz, pómulos, punta del mentón. Técnica del 3: trazar un "3" desde la sien por el pómulo hasta la mandíbula a cada lado. Brocha grande y esponjosa para difuminado amplio.`,
      tips: [
        `El bronceador ideal tiene un tono 1-2 más oscuro que la piel natural con base dorada/cálida — no gris o ceniza`,
        `El bronceador con partículas brillantes funciona para salidas nocturnas; para uso diario, bronceador mate o muy sutil en shimmer`,
      ],
    },

    contour: {
      description: `El contouring usa productos oscuros (sombra fría, no caliente) para crear la ilusión de sombra en el rostro, añadiendo profundidad y definición. Técnicamente es una técnica de trompe l'œil (engaño visual). No es obligatorio, no es básico, y no es para uso diario a menos que se busque ese efecto.`,
      application: `Las zonas de contorno son las que naturalmente están en sombra: debajo de los pómulos, los lados de la nariz, el contorno de la frente, bajo la mandíbula. Aplicar con brocha en ángulo y difuminar hasta que no haya línea visible.`,
      byFaceShape: `Ver sección byFaceShape para recomendaciones por forma de rostro.`,
      tips: [
        `El contorno más natural es un maquillaje bronceador oscuro mate — los sticks grises o muy fríos son para fotografía o escenario, no para uso cotidiano`,
        `El contorno mal difuminado es peor que no hacer contorno — si no hay tiempo para difuminar bien, mejor omitirlo`,
        `Muchas personas que creen que "necesitan" contorno en realidad solo necesitan un blush bien aplicado`,
      ],
    },

    highlight: {
      description: `El iluminador (highlighter) captura la luz y la refleja, creando el efecto de zonas que "salen" hacia adelante visualmente. Es el complemento natural del contouring pero puede usarse solo.`,
      application: `Zonas naturalmente iluminadas: pómulos altos (el punto más alto), arco de Cupido, puente de la nariz, lagrimal del ojo, centro del mentón, sien. Aplicar después de todos los polvos con brocha pequeña en abanico o con el dedo.`,
      tips: [
        `El iluminador en polvo da más intensidad; en crema o líquido, un brillo más natural y fusionado con la piel`,
        `Para looks de piel radiante sin maquillaje pesado: mezclar una gota de iluminador líquido con la base o la hidratante`,
        `Menos es más — el iluminador en exceso puede verse "plástico" o metalizado más que luminoso`,
      ],
    },

    eyeshadow: {
      description: `Las sombras de ojos son el producto más versátil y técnico del maquillaje. Permiten crear profundidad, dimensión, expresión y cualquier estado de ánimo.`,
      basicTechnique: `La técnica del degradado clásico: tono claro en todo el párpado (base), tono medio en el pliegue difuminado hacia arriba, tono oscuro en la esquina externa o en la línea de pestañas. El difuminado entre tonos es la clave.`,
      finishes: `Mate: sin brillo, ideal para el pliegue y la transición. Satinado: semiabrillante, bueno para el párpado móvil en looks medios. Shimmer/Glitter: brillante, para la zona central del párpado o lagrimal en looks más elaborados.`,
      tips: [
        `Aplicar primer para ojos antes — hace que las sombras duren más, los colores sean más intensos y evita la migración`,
        `Las sombras mate tienen la curva de aprendizaje más fácil; los shimmers, aunque brillantes, son más forgiving`,
        `Para ojos de color (verdes, azules, avellana): la sombra del color complementario los hace vibrar — rojo cobre para ojos verdes, naranja dorado para ojos azules, morado para ojos verdes`,
      ],
    },

    eyeliner: {
      description: `El delineado define los ojos, los hace parecer más grandes o más pequeños, y puede cambiar completamente la expresión del look.`,
      types: `Lápiz: más fácil para principiantes, se difumina bien para looks ahumados. Líquido: línea precisa y definida, requiere práctica. Gel/kajal: versátil, puede ser preciso o difuminado. Kohl: pigmentado y muy difuminable, ideal para el ojo inferior.`,
      application: `Para principiantes: empezar con línea fina en el párpado superior siguiendo la línea natural de las pestañas. El wing: trazar primero la "cola" apuntando hacia el extremo de la ceja, luego conectar con el ojo. Truco: hacer pequeñas marcas y luego unirlas.`,
      byEyeShape: `Ver sección byEyeShape para técnicas específicas.`,
      tips: [
        `El delineado interno (waterline superior) hace los ojos verse más pequeños; el inferior blanco o nude los agranda`,
        `Si el pulso no es firme: apoyar el codo en una superficie fija mientras se delinea`,
        `El delineado imperfecto puede corregirse con un hisopo con un poco de corrector o desmaquillante`,
      ],
    },

    mascara: {
      description: `La máscara de pestañas es el producto de maquillaje con mayor impacto por unidad de tiempo aplicado — transforma los ojos con un solo paso.`,
      application: `Aplicar desde la raíz de las pestañas en movimiento en zig-zag hacia las puntas. Para más volumen: aplicar segunda capa antes de que la primera seque. Para más longitud: aplicar en movimiento recto y lento desde la raíz.`,
      types: `Volumen: añade grosor. Longitud: alarga. Curvante: levanta las pestañas. Waterproof: resistente al agua, más difícil de remover. Para uso diario, una fórmula no waterproof es más fácil de quitar y menos dañina para las pestañas.`,
      tips: [
        `Rizar las pestañas antes de la máscara, nunca después — evita que se quiebren`,
        `Para el párpado inferior, usar la punta de la varita en vertical para mayor control`,
        `Remover siempre con desmaquillante específico para ojos — frotar las pestañas genera pérdida`,
      ],
    },

    brows: {
      description: `Las cejas son el elemento que más estructura facial puede añadir o quitar en el maquillaje. Una ceja bien definida levanta visualmente el párpado y da expresión al rostro. Pero "bien definida" no equivale a "perfecta" — las cejas tienen asimetrías naturales que forman parte del carácter.`,
      application: `Primero cepillar las cejas hacia arriba y afuera para ver su forma natural. Rellenar con trazos finos imitando pelos naturales, comenzando por el centro y terminando en la cola. El inicio de la ceja debe ser más suave; la cola, más definida.`,
      products: `Lápiz de ceja: más control, ideal para rellenar zonas específicas. Pomada o gel: más longitud durable. Polvo de ceja: el más natural, para rellenar con brocha. Gel fijador de cejas: esencial para cejas gruesas o muy activas.`,
      tips: [
        `La forma de las cejas debe seguir la estructura natural — no siempre la moda del momento`,
        `Para cejas escasas: construir en capas finas usando lápiz + polvo`,
        `La regla del hilo: inicio de ceja en línea vertical desde la aleta nasal, arco sobre el extremo del iris, cola en diagonal desde la aleta nasal al extremo externo del ojo — es una guía, no una medida fija`,
      ],
    },

    lipstick: {
      description: `El labial es el producto más versátil del maquillaje — puede transformar un look completo en segundos. Desde los nude más silenciosos hasta los rojos más declarativos.`,
      application: `Con pincel de labios para mayor precisión y duración. Directamente del tubo para uso más espontáneo. Rellenar el interior después de perfilar el borde.`,
      finishes: `Cremoso: cómodo, jugoso, menor duración. Mate: look sofisticado, mayor duración, puede resecar. Satinado: punto medio ideal para uso diario. Gloss: brillo máximo, sensación húmeda, menor duración. Tinte de labios: color sutil y natural, larga duración.`,
      tips: [
        `Un toque de corrector alrededor de los labios define el borde y hace que el color dure más`,
        `Para labios más carnosos visualmente: iluminador en el arco de Cupido`,
        `El labial rojo clásico es el color con más historia en el maquillaje — hay un tono de rojo para cada subtono de piel (con base naranja para cálidos, con base azulada para fríos)`,
      ],
    },

    lipLiner: {
      description: `El delineador de labios (lip liner) define el contorno, previene que el color se corra y aumenta la duración del labial. También puede crear la ilusión de labios más voluminosos o más definidos.`,
      application: `Delinear siguiendo el borde natural de los labios o ligeramente por fuera para añadir volumen. Rellenar el interior con el mismo delineador antes del labial aumenta la duración significativamente.`,
      tips: [
        `El color del delineador debe ser igual o ligeramente más oscuro que el labial — jamás visiblemente diferente`,
        `Para el "lip liner look" de tendencia: delinear el labio sin labial encima, añadir solo un toque de gloss en el centro`,
        `Un delineador nude en el tono exacto de la piel es el delineador "invisible" que define sin añadir color`,
      ],
    },
  },

  byFaceShape: {
    oval: `Rostro ovalado: tiene la mayor flexibilidad. Contouring suave en pómulos para añadir definición. Blush en la manzana de las mejillas hacia las sienes en diagonal. Iluminador en los puntos altos: frente, puente nasal, pómulos, punta del mentón.`,
    round: `Rostro redondo: crear la ilusión de mayor longitud y ángulos. Contouring en laterales de la frente, debajo de los pómulos y a los lados de la mandíbula. Blush en diagonal ascendente hacia la sien (no circular en la manzana). Iluminador en el centro: frente, nariz, mentón. Cejas con arco definido para añadir "altura" visual.`,
    square: `Rostro cuadrado: suavizar las esquinas o acentuarlas según preferencia. Para suavizar: contouring difuminado en las cuatro esquinas (sienes y ángulos de la mandíbula). Blush circular y suave. Para acentuar: dejar las esquinas naturales y trabajar los ojos con técnica que añada dramaturgia.`,
    heart: `Rostro corazón: equilibrar la frente ancha con el mentón más estrecho. Contouring en las sienes y los lados de la frente. Iluminador en el mentón para añadir anchura visual. Blush horizontal en las mejillas más bajas.`,
    long: `Rostro alargado: crear la ilusión de más anchura. Contouring horizontal en frente y punta del mentón (acortan visualmente). Blush aplicado horizontalmente y amplio. Iluminador en los lados de los pómulos, no en el centro. Cejas más rectas o con arco muy suave.`,
    diamond: `Rostro diamante: añadir volumen en frente y mentón. Iluminador en la frente y el mentón para ampliar las zonas estrechas. Contouring suave debajo de los pómulos para no exagerarlos más. Blush desde los pómulos hacia arriba.`,
  },

  byEyeShape: {
    almendra: `Ojos almendra: la forma más versátil. Casi cualquier técnica funciona. El wing clásico sigue la línea natural ascendente. El smokey eye, el cut crease, el halo eye — todos son opciones válidas.`,
    redondo: `Ojos redondos: las técnicas de elongación horizontal crean equilibrio. Sombra oscura en la esquina externa difuminada hacia afuera y hacia arriba. Delineado con cola. Evitar sombra brillante en todo el párpado y delineado completo alrededor (exageran la redondez).`,
    rasgado: `Ojos rasgados (comisura externa hacia arriba): el cat eye ya está incorporado en la forma natural. Seguir la línea ascendente con delineado fino. Para looks más expresivos, un ala moderada que no contraste con el ángulo natural.`,
    caido: `Ojos caídos (comisura externa hacia abajo): técnicas de lifting visual. Delineado con wing dirigido hacia ARRIBA, contrario a la caída. Sombra oscura en la esquina externa difuminada ascendentemente. Iluminador en la esquina interna. Rizador de pestañas indispensable.`,
    encapotado: `Ojos encapotados (párpado superior con pliegue que cubre el móvil): todo se aplica sobre el pliegue visible. El maquillaje debe verse con el ojo abierto — aplicar más arriba de lo que parece necesario cuando el ojo está cerrado. Sombra mate en la cuenca. Cut crease y half-cut crease son técnicas que funcionan muy bien. Primer de ojos es fundamental.`,
  },

  byOccasion: {
    daytime: `Maquillaje de día: piel unificada o BB cream, corrector puntual, blush suave, rímel, labial o gloss. El foco es frescura y naturalidad. Nada que requiera más de 10 minutos o retoque cada hora.`,
    evening: `Maquillaje de noche: se puede intensificar cualquier elemento del look de día. Más contouring, más sombra, delineado más marcado, labial más intenso. La piel puede tener más cobertura. El factor diferencial nocturno es la intensidad, no la complejidad.`,
    natural: `Look natural: la piel como protagonista. Hidratante tintada o BB cream, corrector solo donde sea necesario, gel de cejas, rímel, bálsamo de labios con color. El objetivo es "esa persona se ve muy bien sin maquillaje" — aunque sí lleva maquillaje.`,
    bold: `Look bold / artístico: aquí las reglas convencionales se suspenden. Labial rojo dramático, delineado gráfico, sombra de color intenso. La coherencia interna del look importa más que seguir las guías convencionales. El bold bien ejecutado es confianza, no exceso.`,
    photographs: `Para fotografías: las cámaras aplastan la dimensión, así que el contouring y el iluminador se pueden intensificar moderadamente. El flash blanquea y puede hacer que bases con SPF inorgánico produzcan un "flashback" blanco — buscar bases photo-ready o sin partículas que reflejen el flash. Los labios definidos aparecen mejor en foto que los difuminados.`,
  },

  forTeens: {
    description: `Para quien empieza con el maquillaje, la curva de aprendizaje más importante no es técnica sino conceptual: el maquillaje no te "arregla" nada que necesite arreglo. Es un juego, una forma de expresión, una exploración de quién quieres parecer en diferentes momentos. Los primeros años con maquillaje son de experimentación, no de perfección.`,
    starterKit: [
      `BB cream o tinte de piel con SPF — unifica el tono sin sentirse pesado`,
      `Corrector en el tono exacto de la piel — para los días que hay algo puntual`,
      `Máscara de pestañas en negro — el producto con mayor impacto al menor costo`,
      `Blush en crema o polvo en un tono natural (melocotón, rosa suave o según el subtono)`,
      `Bálsamo de labios con color — o un labial nude muy cercano al tono natural`,
      `Gel de cejas — definición sin relleno adicional`,
    ],
    keyPrinciples: [
      `Empezar con un producto a la vez — agregar uno nuevo cada 2-3 semanas para aprender a usarlo bien`,
      `Ver tutoriales de técnica en lugar de tutoriales de productos específicos`,
      `Quitar el maquillaje siempre antes de dormir — es el hábito más importante para la salud de la piel`,
      `No maquillarse para los demás — hacerlo para una misma cambia completamente la experiencia`,
      `Los errores son parte del aprendizaje — todo el mundo tiene fotos de sus primeros intentos y son parte de la historia`,
    ],
  },
};
