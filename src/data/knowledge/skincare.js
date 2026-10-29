// ═══════════════════════════════════════════════════════════════
// SKINCARE — Base de conocimiento para el backend de chat
// Versión: 1.0 | Sprint 1
// Fuentes: Escala de Fitzpatrick (dermatología clínica),
// Sistema Baumann de tipos de piel, literatura de dermocosmética
// (Zoe Diana Draelos, Leslie Baumann), ingredientes activos INCI.
// ═══════════════════════════════════════════════════════════════

export const SKINCARE = {

  introduction: `El cuidado de la piel es una práctica de salud y bienestar, no de corrección. La piel es el órgano más grande del cuerpo — una barrera viva que nos protege, regula la temperatura, sintetiza vitamina D e interactúa con el entorno a cada momento. Cuidarla bien significa respetar su funcionamiento natural, no interferir con él. La dermocosmética moderna ofrece herramientas poderosas para apoyar esa barrera, pero el exceso de productos o el uso equivocado puede hacer más daño que bien. La información de esta sección está basada en dermocosmética científica, no en marketing de marcas.`,

  philosophy: `Tres principios guían todo el enfoque de skincare de Lumina: constancia sobre cantidad (una rutina simple que haces todos los días supera a una rutina de 12 pasos que abandonas en dos semanas), paciencia sobre resultados inmediatos (la piel tiene un ciclo de renovación de 28 a 45 días — cualquier producto necesita al menos 6-8 semanas para mostrar resultados), y conocer antes de añadir (entender tu tipo de piel, tu barrera cutánea y tus necesidades reales antes de incorporar cualquier activo o producto nuevo).`,

  skinTypes: {
    oily: {
      description: `La piel grasa produce sebo en exceso. El sebo es saludable y necesario — el problema es la sobreproducción. Esto genera brillo constante, poros dilatados y predisposición al acné por obstrucción de folículos. La piel grasa bien cuidada tiende a envejecer más lentamente que otros tipos porque el sebo tiene propiedades protectoras.`,
      characteristics: [
        `Brillo generalizado en toda la cara, especialmente notable a media tarde`,
        `Poros dilatados y visibles, particularmente en nariz, frente y barbilla`,
        `Predisposición a puntos negros (comedones abiertos) y espinillas`,
        `El maquillaje tiende a "correrse" o a verse opaco después de pocas horas`,
        `La piel se siente pesada o grasienta al tacto`,
      ],
      commonMistakes: [
        `Sobre-limpiar: lavarse 3-4 veces al día en un intento de eliminar el brillo. Resultado: la piel produce más sebo como respuesta de compensación.`,
        `Evitar la hidratación por miedo a agravar el brillo. La piel grasa también necesita hidratación — sin ella, puede producir más sebo.`,
        `Usar productos muy agresivos (limpiadores con alcohol, exfoliantes abrasivos a diario) que irritan la barrera.`,
        `Exfoliar en exceso creyendo que los poros se "abrirán" permanentemente. Los poros no tienen músculos — su tamaño es principalmente genético.`,
      ],
      careApproach: `Limpieza suave pero efectiva, dos veces al día. Hidratación con texturas ligeras (gel, fluido). Control del sebo con niacinamida. Exfoliación química suave (BHA: ácido salicílico) 2-3 veces por semana para mantener poros limpios. SPF matificante obligatorio.`,
      keyIngredients: [`Ácido salicílico (BHA)`, `Niacinamida`, `Ácido glicólico (uso moderado)`, `Zinc`, `Retinol (para adultas, con introducción gradual)`],
      productTextures: `Geles, fluidos, emulsiones ligeras, fórmulas oil-free. Evitar cremas muy ricas o aceites sin no-comedonogenicidad probada.`,
    },

    dry: {
      description: `La piel seca produce poco sebo y tiene dificultad para retener agua en la capa superior (estrato córneo). Esto resulta en una barrera cutánea más débil, mayor vulnerabilidad a irritantes externos y sensación de tirantez o incomodidad constante. La piel seca no es sinónimo de piel sensible, aunque frecuentemente coexisten.`,
      characteristics: [
        `Sensación de tirantez, especialmente después de lavar`,
        `Aspecto opaco y apagado — le falta el brillo natural que da la hidratación`,
        `Descamación o flacidez fina visible`,
        `Líneas finas de expresión más visibles por deshidratación`,
        `Poros pequeños o casi invisibles`,
        `Puede enrojecerse o irritarse con más facilidad`,
      ],
      commonMistakes: [
        `Usar jabones de barra o limpiadores con surfactantes agresivos (sulfatos) que eliminan el poco sebo natural`,
        `No aplicar hidratante sobre piel húmeda — aplicar sobre piel seca reduce la efectividad`,
        `Usar solo un producto cuando la barrera necesita capas (serum + crema)`,
        `Creer que beber mucha agua sola resolverá el problema — la hidratación interna ayuda pero no reemplaza el cuidado tópico`,
      ],
      careApproach: `Limpiador cremoso sin sulfatos. Sérum de ácido hialurónico aplicado sobre piel húmeda. Crema rica en ceramidas para sellar. Aceite facial opcional como tercer paso (sellar sobre la crema). SPF en fórmula cremosa. Exfoliación suave y poco frecuente (máximo 1 vez por semana).`,
      keyIngredients: [`Ácido hialurónico`, `Ceramidas`, `Glicerina`, `Escualano`, `Vitamina E`, `Péptidos`],
      productTextures: `Cremas ricas, bálsamos, aceites, emulsiones densas. Evitar geles de alcohol o tónicos astringentes.`,
    },

    combination: {
      description: `La piel mixta tiene diferentes comportamientos en diferentes zonas del rostro. La zona T (frente, nariz, barbilla) tiende a ser grasa con poros visibles, mientras que las mejillas y el contorno del rostro pueden ser normales o secas. Es el tipo de piel más común — la mayoría de las personas tiene algún grado de mixtura.`,
      characteristics: [
        `Zona T brillante o con poros visibles`,
        `Mejillas cómodas, secas o ligeramente tirantes`,
        `Comedones o espinillas concentrados en la zona T`,
        `El maquillaje "se mueve" en la zona T pero permanece en las mejillas`,
        `Puede tener tendencia a la sensibilidad en las mejillas`,
      ],
      commonMistakes: [
        `Tratar toda la cara con productos para piel grasa — las mejillas se resecan`,
        `Tratar toda la cara con productos para piel seca — la zona T se agrava`,
        `Ignorar la necesidad de hidratación en zonas grasas porque "ya tienen grasa"`,
        `Cambiar de rutina constantemente pensando que el problema es el producto`,
      ],
      careApproach: `Limpiador de pH balanceado para toda la cara. Tónico suavizante opcional. Sérum de niacinamida en toda la cara (regula sebo sin resecar). Hidratante ligera de textura gel-crema para todo el rostro. Si las mejillas se resecan, puede añadirse una crema más rica solo en esa zona. SPF fluido. Exfoliación suave con BHA en zona T una vez por semana.`,
      keyIngredients: [`Niacinamida`, `Ácido hialurónico`, `Ácido salicílico (zona T)`, `Ceramidas (mejillas)`],
      productTextures: `Texturas medias — ni muy ligeras para las mejillas, ni muy ricas para la zona T. Emulsiones y gel-cremas son buenas opciones.`,
    },

    sensitive: {
      description: `La piel sensible es aquella que reacciona de manera exagerada o desproporcionada a estímulos que la piel no sensible tolera sin problema: cambios de temperatura, ciertos ingredientes cosméticos, fricción, estrés. La sensibilidad puede ser una característica permanente de la piel o una condición temporal causada por una barrera debilitada.`,
      characteristics: [
        `Enrojecimiento frecuente o prolongado después del lavado, el frío o el ejercicio`,
        `Ardor, picazón o sensación de calor con productos que otras personas toleran bien`,
        `Piel que reacciona a fragancias, alcohol, conservantes comunes`,
        `Puede presentar dermatitis de contacto, rosácea o piel atópica`,
        `Tiende a "reaccionar" en momentos de estrés o cambios hormonales`,
      ],
      commonMistakes: [
        `Probar muchos productos nuevos al mismo tiempo — imposible identificar qué causa la reacción`,
        `Usar fragancias, aceites esenciales o "ingredientes naturales" sin cuidado — muchos son irritantes potentes`,
        `Exfoliar físicamente con scrubs abrasivos`,
        `Ignorar el SPF por miedo a reaccionar — existe SPF mineral sin fragancia específico para piel sensible`,
        `Diagnosticarse condiciones como rosácea o dermatitis sin confirmación médica`,
      ],
      careApproach: `Minimalismo extremo: los menos ingredientes posible, todos con perfil de seguridad conocido. Sin fragancias, sin alcohol desecante, sin esencias. Limpieza micelar o limpiador con base de avena coloidal. Sérum calmante (centella asiática, alantolna, avenanthramides). Crema calmante con barrera protectora. SPF mineral (óxido de zinc, dióxido de titanio) que no requiere filtros químicos potencialmente irritantes.`,
      keyIngredients: [`Centella asiática (Cica)`, `Pantenol (B5)`, `Avena coloidal`, `Aloe vera`, `Ceramidas`, `Óxido de zinc`],
      productTextures: `Texturas suaves, sin calor al aplicar, sin alcohol. Leches, emulsiones ligeras, geles suaves.`,
    },

    normal: {
      description: `La piel normal tiene un equilibrio adecuado entre producción de sebo e hidratación. No es ni muy grasa ni muy seca, los poros son pequeños, la tez es pareja y la piel tiene buena tolerancia a ingredientes cosméticos. "Normal" no significa perfecta — todas las pieles tienen días buenos y malos, y la piel normal puede tener ocasionalmente brotes o sensibilidad temporal.`,
      characteristics: [
        `Tez pareja sin zonas marcadamente grasas o secas`,
        `Poros pequeños y poco visibles`,
        `Pocas o nulas reacciones a productos comunes`,
        `Aspecto luminoso y descansado cuando está bien cuidada`,
        `El maquillaje se adhiere bien y tiene duración razonable`,
      ],
      commonMistakes: [
        `Descuidar la rutina pensando que "no la necesita"`,
        `No usar SPF porque la piel "no es sensible" — el daño solar no depende de la sensibilidad`,
        `Caer en rutinas de muchos pasos innecesarias por marketing`,
      ],
      careApproach: `Limpiador suave, sérum antioxidante (vitamina C por las mañanas), hidratante ligera, SPF diario. Por las noches, limpieza y un hidratante o aceite suave. Exfoliación suave 1-2 veces por semana es todo lo que necesita para mantener la luminosidad.`,
      keyIngredients: [`Vitamina C`, `Niacinamida`, `Péptidos`, `SPF`],
      productTextures: `Alta versatilidad — puede usar casi cualquier textura. Emulsiones ligeras o medias son el punto ideal.`,
    },
  },

  fitzpatrickScale: {
    description: `La Escala de Fitzpatrick fue desarrollada por el dermatólogo Thomas B. Fitzpatrick en 1975 para clasificar la piel humana según su reacción a la radiación UV. Originalmente creada para dosificar tratamientos dermatológicos (fototerapia), hoy se usa en dermocosmética para orientar el uso de activos, el riesgo de hiperpigmentación post-inflamatoria y la elección de SPF.`,
    types: {
      I: `Fototipo I: Piel muy clara, a menudo con pecas, cabello rojo o rubio platino, ojos claros (azules, grises). Siempre se quema, nunca se broncea. Máximo riesgo de daño solar. SPF 50+ obligatorio.`,
      II: `Fototipo II: Piel clara, puede tener pecas, cabello claro o castaño claro, ojos claros o intermedios. Siempre se quema, broncea muy poco. Alto riesgo. SPF 50+ recomendado.`,
      III: `Fototipo III: Piel de tono medio, cabello castaño, ojos intermedios. A veces se quema, luego se broncea gradualmente. Riesgo moderado. SPF 30-50.`,
      IV: `Fototipo IV: Piel de tono oliva o moreno claro, cabello oscuro, ojos marrón oscuro. Raramente se quema, se broncea bien. Puede tener mayor riesgo de hiperpigmentación post-inflamatoria. SPF 30+.`,
      V: `Fototipo V: Piel morena oscura, cabello negro, ojos muy oscuros. Muy raramente se quema, broncea profusamente. Riesgo de hiperpigmentación post-inflamatoria es significativo. SPF 30+.`,
      VI: `Fototipo VI: Piel muy oscura o negra. No se quema prácticamente. Pigmentación abundante que ofrece cierta protección natural, aunque NO exime del daño solar acumulativo ni del riesgo de hiperpigmentación. SPF 30+ recomendado — buscar fórmulas que no dejen cast blanco.`,
    },
    importantNote: `El Fitzpatrick no determina la "belleza" ni la "salud" de una piel — describe solo la respuesta a UV. Pieles de todos los fototipos pueden tener cualquier tipo de piel (grasa, seca, sensible, etc.) y cualquier preocupación. Los fototipos más oscuros (IV-VI) tienen mayor riesgo de hiperpigmentación post-inflamatoria, lo que hace especialmente importante el manejo cuidadoso del acné, las lesiones y los activos potencialmente irritantes.`,
  },

  basicRoutine: {
    morning: [
      `1. Limpieza suave (o solo agua si la piel está bien y no hubo sudoración nocturna)`,
      `2. Tónico o esencia si se usa`,
      `3. Sérum activo según necesidad (vitamina C antioxidante es la elección matutina ideal para la mayoría)`,
      `4. Hidratante adecuado al tipo de piel`,
      `5. SPF — el paso más importante de toda la rutina, sin excepción`,
    ],
    evening: [
      `1. Doble limpieza si se usó SPF o maquillaje: primero aceite o agua micelar, luego limpiador espumoso`,
      `2. Tónico o esencia si se usa`,
      `3. Sérum activo según necesidad (retinol, ácidos, niacinamida son ingredientes nocturnos por excelencia)`,
      `4. Contorno de ojos si se desea`,
      `5. Hidratante o crema facial — puede ser más rica que la de mañana`,
      `6. Aceite facial opcional como último paso sellador`,
    ],
  },

  ingredients: {
    retinol: {
      whatItDoes: `El retinol es una forma de vitamina A que promueve la renovación celular acelerada, estimula la producción de colágeno y elastina, y mejora la textura de la piel, las líneas finas y la hiperpigmentación con uso prolongado. Es el ingrediente anti-edad con más evidencia científica acumulada.`,
      bestFor: `Piel con líneas de expresión, textura irregular, poros dilatados, hiperpigmentación leve. En piel adolescente grasa con acné, algunas versiones suaves (retinaldehído o retinol de baja concentración) pueden ser beneficiosas, pero con mucho cuidado y supervisión.`,
      howToUse: `Siempre de noche — es fotosensible. Comenzar con concentraciones muy bajas (0.025-0.05%) y frecuencia baja (1-2 noches por semana), aumentando gradualmente. Aplicar sobre piel limpia y completamente seca. Usar hidratante encima. Siempre SPF al día siguiente.`,
      cautions: `Puede causar irritación, enrojecimiento, descamación y sensibilidad inicial (la "purga del retinol"). No usar si se está embarazada o lactando. No recomendado para piel sensible sin guía dermatológica. No usar la misma noche que ácidos exfoliantes (puede aumentar la irritación). Para adolescentes menores de 16 años, no es necesario ni recomendable salvo prescripción médica.`,
      pairingNotes: `Bien con: niacinamida (puede usarse juntos o en capas separadas), péptidos, ceramidas, ácido hialurónico (como hidratante encima). Evitar combinar la misma noche con: ácido glicólico, salicílico, vitamina C ácida, benzoílo de peróxido a concentraciones altas.`,
    },

    vitaminC: {
      whatItDoes: `La vitamina C (en sus diversas formas, siendo el ácido L-ascórbico el más potente y estudiado) es el antioxidante tópico con más evidencia científica. Neutraliza los radicales libres generados por UV y contaminación, inhibe la producción de melanina (mejorando manchas), y apoya la síntesis de colágeno.`,
      bestFor: `Todas las pieles en el paso matutino. Especialmente útil para hiperpigmentación, falta de luminosidad, daño solar, manchas post-acné (máculas rosadas o marrones que quedan después de una espinilla).`,
      howToUse: `Por la mañana, después de limpiar y antes de la hidratante. El ácido L-ascórbico es inestable — los productos de vitamina C se oxidan con luz y calor; guardar en lugar fresco y oscuro. Las formulaciones en serum son las más efectivas.`,
      cautions: `El ácido L-ascórbico puro puede irritar pieles sensibles. Para pieles sensibles, existen formas derivadas más estables y menos irritantes (ascorbil glucosida, vitamina C encapsulada). No es incompatible con el SPF — al contrario, potencia su protección.`,
      pairingNotes: `Bien con: SPF (sinergia antioxidante), vitamina E (potencia la acción), niacinamida (fue controversia antigua, ya superada — sí se pueden usar juntos). Usar antes de la niacinamida en la rutina. No es necesario separar de ácidos exfoliantes aunque puede ser más irritante combinarlos si hay sensibilidad.`,
    },

    niacinamide: {
      whatItDoes: `La niacinamida (vitamina B3) es uno de los ingredientes más versátiles en skincare. Regula la producción de sebo, minimiza la apariencia de los poros, mejora la barrera cutánea, reduce la hiperpigmentación post-inflamatoria, calma la inflamación y tiene acción antioxidante. Es tolerada por casi todos los tipos de piel, incluyendo pieles sensibles.`,
      bestFor: `Prácticamente todos los tipos de piel y preocupaciones. Especialmente piel grasa o mixta con poros dilatados, piel con manchas post-acné, piel sensible que busca un activo tolerado.`,
      howToUse: `Puede usarse mañana y noche. En sérum o crema. Concentraciones efectivas desde 2% (calmante) hasta 10% (reguladora de sebo, anti-hiperpigmentación). Más de 10% puede causar enrojecimiento temporal en algunos.`,
      cautions: `Muy bien tolerada. A concentraciones muy altas (>10%) puede causar rubor temporal en pieles muy sensibles. Algunos informes anecdóticos de breakouts con ciertas formulaciones — pero no es un efecto documentado clínicamente.`,
      pairingNotes: `Compatible con prácticamente todo: retinol, vitamina C, ácidos, ceramidas, péptidos. Es uno de los ingredientes más "amigables" del skincare moderno.`,
    },

    hyaluronicAcid: {
      whatItDoes: `El ácido hialurónico es una molécula que se produce naturalmente en el cuerpo y tiene capacidad de retener hasta 1000 veces su peso en agua. En skincare tópico, actúa como humectante — atrae el agua del ambiente y de las capas más profundas hacia el estrato córneo, aumentando la hidratación de la piel. Existen versiones de distintos pesos moleculares: las moléculas pequeñas penetran más, las grandes actúan en superficie.`,
      bestFor: `Todos los tipos de piel, pero especialmente seca, deshidratada, mixta y sensible. No genera brillo ni obstrucción en pieles grasas.`,
      howToUse: `Aplicar sobre piel húmeda (recién lavada, con unas gotitas de agua o bruma en el rostro) para que tenga agua que atraer. Siempre sellar con una crema encima — si el ambiente es muy seco, el HA puede extraer agua de la propia piel en lugar del ambiente.`,
      cautions: `No tiene efectos adversos documentados. No causa sensibilidad. El riesgo es solo no sellarlo adecuadamente en ambientes secos.`,
      pairingNotes: `Compatible con todo. Va bien en cualquier punto de la rutina pero típicamente antes de la crema hidratante.`,
    },

    salicylicAcid: {
      whatItDoes: `El ácido salicílico es un BHA (Beta-Hydroxy Acid) que exfolia el interior del poro — es liposoluble, lo que le permite disolver el sebo que obstruye los folículos. Es el activo más efectivo para la limpieza de poros y la prevención del acné comedogénico.`,
      bestFor: `Piel grasa y mixta, acné comedogénico (puntos negros y blancos), poros dilatados, piel con tendencia a la obstrucción.`,
      howToUse: `En limpiador o tónico (uso diario posible a bajas concentraciones) o en sérum tratamiento (uso 2-3 veces por semana). Siempre con SPF porque aumenta la fotosensibilidad. Comenzar con frecuencia baja para evaluar tolerancia.`,
      cautions: `Puede causar sequedad e irritación si se usa en exceso. No es recomendable para piel muy seca o sensible sin adaptación. En embarazo, consultar al médico (el uso tópico a bajas concentraciones generalmente se considera seguro pero hay variación de criterios clínicos).`,
      pairingNotes: `No mezclar en la misma sesión con retinol o ácidos exfoliantes como el glicólico (puede sobreexfoliar). Bien con niacinamida que puede calmar la irritación potencial. Bien con ácido hialurónico como hidratante compensador.`,
    },

    glycolicAcid: {
      whatItDoes: `El ácido glicólico es el AHA (Alpha-Hydroxy Acid) de molécula más pequeña, lo que le da la mayor capacidad de penetración entre los AHAs. Exfolia la superficie de la piel disolviendo los enlaces entre células muertas, mejora la textura, reduce la hiperpigmentación y estimula la síntesis de colágeno con uso prolongado.`,
      bestFor: `Piel con textura irregular, manchas, piel opaca, líneas finas. También funciona bien en piel grasa como complemento al salicílico.`,
      howToUse: `Generalmente de noche. En tónico (5-7%), sérum o crema. Comenzar con concentraciones bajas y frecuencia de 2-3 veces por semana. Siempre SPF al día siguiente.`,
      cautions: `Aumenta significativamente la fotosensibilidad. No usar sin SPF riguroso. Puede irritar pieles sensibles. No compatible la misma noche con retinol (sobreexfoliación). En pieles de fototipo IV-VI, usar con precaución — puede desencadenar hiperpigmentación post-inflamatoria si se irrita la piel.`,
      pairingNotes: `Bien con hidratantes que reparen la barrera (ceramidas, ácido hialurónico) para contrarrestar la exfoliación. No en la misma sesión que retinol, salicílico concentrado, ni vitamina C ácida.`,
    },

    ceramides: {
      whatItDoes: `Las ceramidas son lípidos (grasas) que constituyen una parte esencial de la barrera cutánea — son el "mortero" entre las células de la epidermis. Una barrera con suficientes ceramidas retiene agua, resiste irritantes y se recupera mejor del daño. La producción de ceramidas disminuye con la edad y con el uso de productos agresivos.`,
      bestFor: `Cualquier piel, pero especialmente piel seca, sensible, atópica o con barrera debilitada por sobreexfoliación o uso excesivo de activos.`,
      howToUse: `Generalmente en la crema hidratante o como crema barrera en el último paso de la rutina. También disponibles en sérums específicos.`,
      cautions: `No tienen efectos adversos conocidos. Son ingredientes restauradores, no activos agresivos.`,
      pairingNotes: `Se combinan perfectamente con casi todo, especialmente con ácido hialurónico (complemento: HA atrae agua, ceramidas la retienen), niacinamida y péptidos. También son el par ideal después de sesiones de retinol o ácidos para restaurar la barrera.`,
    },

    peptides: {
      whatItDoes: `Los péptidos son cadenas cortas de aminoácidos que actúan como señales en la piel. Dependiendo de su tipo, pueden estimular la síntesis de colágeno (péptidos de señalización), inhibir la contracción muscular (péptidos neuroactivos, como el Argireline), o transportar minerales y otros activos (péptidos de transporte). Su efecto es gradual y requiere uso constante.`,
      bestFor: `Piel con líneas de expresión, falta de firmeza, piel que busca un ingrediente activo sin irritación. También como complemento al retinol.`,
      howToUse: `Mañana o noche. En sérum o crema. No requieren precauciones especiales de uso.`,
      cautions: `No tienen efectos adversos conocidos. Son de los ingredientes más tolerados. El mayor riesgo es esperar resultados inmediatos — su acción es gradual.`,
      pairingNotes: `Bien con casi todo. Pueden usarse con retinol (se complementan) y con niacinamida. La combinación ácido hialurónico + péptidos + ceramidas es una de las más completas y seguras para cualquier tipo de piel.`,
    },

    sunscreen: {
      whatItDoes: `El protector solar es el ingrediente de skincare con más evidencia científica de beneficio a largo plazo. Previene el daño por radiación UV (UVA, que envejece la piel, y UVB, que quema), reduce significativamente el riesgo de cáncer de piel, previene la hiperpigmentación y el daño solar acumulativo. El 80% del envejecimiento visible de la piel es causado por la exposición solar — no por el tiempo.`,
      bestFor: `Absolutamente todas las pieles, todos los fototipos, todos los días, incluso en días nublados y en interiores (la UVA atraviesa los cristales).`,
      howToUse: `Es el último paso antes del maquillaje por las mañanas. Aplicar generosamente — la cantidad estándar para el rostro es aproximadamente media cucharadita (1/4 de cucharadita si se incluye cuello). Reaplicar cada 2 horas de exposición solar directa. En días normales de interior, la aplicación matutina suele ser suficiente.`,
      cautions: `No existe SPF "demasiado alto" — usar 50+ es lo más eficiente. Los filtros minerales (óxido de zinc, dióxido de titanio) son los más tolerados por pieles sensibles pero pueden dejar cast blanco en pieles oscuras — buscar "tinted" o fórmulas desarrolladas para pieles de tono profundo. Los filtros químicos son transparentes pero algunos pueden irritar pieles muy sensibles.`,
      pairingNotes: `Va encima de todo en la rutina matutina. La vitamina C potencia su efecto protector. Nunca mezclar directamente con el SPF — aplicar primero los activos, esperar unos minutos y luego el SPF como capa final.`,
    },
  },

  concerns: {
    acne: {
      description: `El acné es una condición inflamatoria crónica del folículo pilosebáceo que involucra varios factores simultáneos: producción excesiva de sebo, acumulación de células muertas, proliferación de la bacteria Cutibacterium acnes y respuesta inflamatoria. Existe en distintos grados y tipos: comedónico (puntos negros y blancos), inflamatorio (granos rojos, pápulas, pústulas) y nódulo-quístico (el más severo, que puede dejar cicatrices).`,
      commonCauses: [
        `Fluctuaciones hormonales (pubertad, ciclo menstrual, PCOS, cambio de anticonceptivos)`,
        `Genética: la predisposición al acné es hereditaria`,
        `Productos comedogénicos en piel predispuesta`,
        `Estrés (aumenta la producción de cortisol que estimula el sebo)`,
        `Fricción mecánica (ropa, cascos, el hábito de apoyar la cara en la mano)`,
        `Ciertos medicamentos`,
      ],
      lifestyleFactors: `El estrés tiene impacto documentado en el acné. El sueño insuficiente también. La dieta puede tener influencia en personas específicas (evidencia moderada sobre lácteos y alimentos con alto índice glucémico), aunque la relación no es universal. La higiene excesiva o la manipulación de los granos empeora el acné y puede generar cicatrices.`,
      topicalApproaches: `Para acné comedogénico: ácido salicílico para limpiar los poros, niacinamida para el control del sebo y la inflamación. Para acné inflamatorio leve-moderado: benzoílo de peróxido (efectivo pero puede irritar — empezar con concentraciones bajas, 2.5-5%), ácido azelaico (también anti-inflamatorio y anti-hiperpigmentación). Retinol para prevenir la formación de comedones con uso regular. Siempre: SPF para prevenir que la hiperpigmentación post-inflamatoria se agrave.`,
      whenToConsultDoctor: `Acné nódulo-quístico profundo y doloroso. Acné que no mejora después de 3-4 meses de rutina consistente. Acné que deja cicatrices activamente. Acné severo en adultas sin causa aparente (puede señalar condición hormonal subyacente).`,
    },

    darkSpots: {
      description: `Las manchas oscuras (hiperpigmentación) son áreas donde la melanina se deposita en exceso. Los tipos principales son: máculas post-inflamatorias (manchas rosadas o marrones que quedan después de inflamación como acné), melasma (manchas difusas generalmente en mejillas, frente y labio superior, frecuentemente hormonales), manchas solares (léntigos actínicos, causados por exposición UV acumulada) y post-procedimiento.`,
      commonCauses: [
        `Inflamación previa (acné, picaduras, pequeñas heridas)`,
        `Exposición solar sin protección adecuada`,
        `Fluctuaciones hormonales (especialmente en melasma: embarazo, anticonceptivos orales)`,
        `Genética: fototipos IV-VI tienen mayor predisposición`,
      ],
      lifestyleFactors: `La exposición solar es el factor más determinante en la persistencia y oscurecimiento de manchas. Sin SPF riguroso, cualquier tratamiento activo tendrá efectividad limitada porque la mancha se sigue estimulando.`,
      topicalApproaches: `SPF como piedra angular obligatoria. Vitamina C (inhibe la tirosinasa, enzima clave en la producción de melanina). Niacinamida (interfiere con la transferencia de melanina). Ácido kójico (alternativa suave a la hidroquinona). Ácido azelaico (útil también para melasma y manchas post-acné). Ácido glicólico y otros AHAs (aceleran la renovación de la piel y sacan la melanina acumulada). El tratamiento de manchas requiere paciencia: mínimo 8-12 semanas para ver resultados visibles.`,
      whenToConsultDoctor: `Lunares que cambian de forma, color o borde. Manchas que sangran o crecen. Sospecha de melasma severo (puede requerir prescripción de hidroquinona o tratamiento combinado). Manchas que no responden a ningún activo tras 6 meses.`,
    },

    dryness: {
      description: `La sequedad de la piel puede ser una característica permanente (tipo de piel seco) o temporal (deshidratación, que puede afectar a cualquier tipo de piel, incluyendo piel grasa). La sequedad permanente tiene que ver con la producción de sebo; la deshidratación tiene que ver con la falta de agua en el estrato córneo.`,
      commonCauses: [
        `Predisposición genética al tipo de piel seco`,
        `Ambiente seco (baja humedad, aire acondicionado, calefacción)`,
        `Productos agresivos que eliminan la barrera natural`,
        `Exceso de exfoliación`,
        `Agua muy caliente al lavar el rostro`,
        `Cambios de estación`,
        `Medicamentos (isotretinoína, antihistamínicos, diuréticos)`,
      ],
      lifestyleFactors: `Hidratación interna (agua) apoya la piel pero no sustituye el cuidado tópico. Humidificadores en interiores secos. Duchas y lavados con agua tibia en lugar de caliente.`,
      topicalApproaches: `Limpiadores cremosos sin sulfatos. Ácido hialurónico sobre piel húmeda. Cremas ricas con ceramidas, glicerina, escualano. Aceite facial como sellador. Evitar activos agresivos hasta que la barrera esté restaurada.`,
      whenToConsultDoctor: `Sequedad severa con grietas, sangrado o eccema pronunciado. Sequedad que no responde a hidratación intensa. Prurito intenso que interfiere con la calidad de vida.`,
    },

    sensitivity: {
      description: `La sensibilidad de la piel es un espectro, no una condición binaria. Puede manifestarse como enrojecimiento reactivo, picazón, ardor o dermatitis de contacto. Puede ser permanente (característica de la piel) o adquirida (por sobreuso de activos, barrera debilitada, o condiciones como rosácea o piel atópica).`,
      commonCauses: [
        `Barrera cutánea debilitada (por sobreexfoliación, productos agresivos, genética)`,
        `Rosácea (condición crónica que requiere diagnóstico médico)`,
        `Dermatitis atópica`,
        `Alergia de contacto a ingredientes específicos`,
        `Estrés`,
      ],
      lifestyleFactors: `Temperatura extrema (calor intenso, frío, cambios bruscos), estrés, ciertos alimentos en personas con rosácea (alcohol, picante). Introducción de nuevos productos: no más de uno nuevo cada 2-3 semanas para poder identificar reacciones.`,
      topicalApproaches: `Minimalismo de rutina. Ingredientes probados: centella asiática, pantenol, avena coloidal, ceramidas. Sin fragancias, sin alcohol desnaturalizante, sin esencias. SPF mineral.`,
      whenToConsultDoctor: `Rosácea (siempre requiere diagnóstico y puede necesitar prescripción). Dermatitis atópica severa. Reacciones de urticaria o angioedema a cosméticos. Piel que no mejora después de 3-4 semanas con rutina simplificada.`,
    },

    aging: {
      description: `El envejecimiento de la piel es un proceso fisiológico normal con dos componentes: el envejecimiento intrínseco (biológico, determinado genéticamente) y el extrínseco (ambiental, causado por el sol, la contaminación, el tabaco, la inflamación crónica). El 80% del envejecimiento visible es extrínseco, lo que significa que tiene un componente prevenible muy significativo.`,
      commonCauses: [
        `Exposición solar acumulativa sin protección (el factor más importante)`,
        `Disminución de colágeno y elastina con la edad`,
        `Disminución de ceramidas y de la capacidad de retención de agua`,
        `Tabaco (vasoconstricción y daño oxidativo)`,
        `Contaminación ambiental (estrés oxidativo)`,
        `Falta de sueño crónica`,
      ],
      lifestyleFactors: `El SPF diario desde joven es la medida más efectiva de prevención. No fumar. Dormir suficiente. Antioxidantes en la dieta. Reducir exposición a contaminación cuando sea posible.`,
      topicalApproaches: `Prevención: SPF y antioxidantes (vitamina C) desde joven. Tratamiento: retinol (el más documentado para síntesis de colágeno y renovación celular), péptidos (estimulación de colágeno), ácido glicólico (renovación superficial), ceramidas (hidratación y barrera). Para piel joven, la prevención siempre es más efectiva que el tratamiento posterior.`,
      whenToConsultDoctor: `Procedimientos más avanzados (ácido hialurónico inyectable, bótox, láser) requieren profesional médico. No son una necesidad — son opciones personales que merecen asesoría especializada.`,
    },

    enlargedPores: {
      description: `Los poros no se abren ni se cierran — no tienen músculos. Lo que percibimos como "poros grandes" es la apariencia visual del diámetro del folículo pilosebáceo, que está determinado principalmente por la genética y la cantidad de sebo producido. Los poros obstruidos con sebo oxidado (puntos negros) parecen más grandes. La piel bien hidratada y exfoliada puede minimizar su apariencia.`,
      commonCauses: [
        `Genética (el principal factor)`,
        `Producción de sebo alta`,
        `Exposición solar acumulada (daña el colágeno que da soporte a los poros)`,
        `Obstrucción con sebo y células muertas`,
        `Edad (pérdida de firmeza que hace los poros más visibles)`,
      ],
      lifestyleFactors: `No exprimir puntos negros manualmente — puede ampliar el poro y generar inflamación. El maquillaje aplicado sin limpieza posterior contribuye a la obstrucción.`,
      topicalApproaches: `Ácido salicílico para limpiar el interior del poro (BHA liposoluble). Niacinamida para minimizar su apariencia visualmente (contrae el interior y reduce el sebo). Retinol para mejorar la firmeza del colágeno que rodea los poros. SPF para prevenir daño solar adicional. Exfoliación química regular sobre mecánica (los scrubs pueden irritar sin resolver el problema).`,
      whenToConsultDoctor: `Para tratamientos como láser, microagujas o peelings más profundos que sí pueden tener efecto en el diámetro del poro. Son procedimientos opcionales que requieren un dermatólogo.`,
    },
  },

  forTeens: {
    description: `La piel adolescente está atravesando cambios hormonales significativos que afectan directamente al sebo, la hidratación y la predisposición al acné. Los andrógenos que aumentan durante la pubertad estimulan las glándulas sebáceas — esto es fisiológicamente normal y no es un "problema" a corregir con rutinas agresivas. El enfoque más efectivo es simple, constante y suave.`,
    keyPrinciples: [
      `Menos es más: una rutina de 3 pasos (limpieza + hidratación + SPF) es todo lo que necesita una piel adolescente sana.`,
      `Los cambios hormonales son normales y no indican una "falla" de la piel — la tolerancia y la paciencia son más útiles que la obsesión.`,
      `El acné adolescente leve a moderado responde bien a ingredientes simples (salicílico suave, niacinamida) sin necesidad de activos agresivos.`,
      `La hidratación es necesaria incluso en piel grasa adolescente — saltarla empeora el problema al desencadenar más producción de sebo.`,
      `El SPF es la inversión más importante a largo plazo. El daño solar empieza a acumularse desde la infancia.`,
      `No exprimir granos — aumenta el riesgo de cicatrices e hiperpigmentación.`,
    ],
    whatToAvoid: [
      `Retinol antes de los 16 años salvo prescripción médica — no es necesario y puede irritar piel joven`,
      `Ácidos exfoliantes a concentraciones altas (>10% glicólico, >2% salicílico como tratamiento habitual)`,
      `Scrubs físicos abrasivos con partículas duras`,
      `Múltiples activos al mismo tiempo — la piel adolescente necesita estabilidad, no experimentos`,
      `Limpiadores con alcohol que resecan y generan rebote de sebo`,
      `Rutinas de 8-10 pasos promocionadas en redes sociales — casi siempre innecesarias y potencialmente dañinas para piel joven`,
    ],
  },

  whenToSeeDermatologist: [
    `Acné nódulo-quístico: nódulos profundos, dolorosos y que no responden a tratamiento tópico`,
    `Acné que deja cicatrices activamente`,
    `Manchas que cambian de forma, color, borde o tamaño (señal de alerta dermatológica importante)`,
    `Cualquier lesión que sangra sin causa clara`,
    `Sospecha de rosácea (enrojecimiento crónico, vasos visibles, picor persistente)`,
    `Dermatitis atópica o eccema severo`,
    `Piel que no responde a ningún tratamiento tópico después de 3-4 meses`,
    `Reacciones alérgicas severas a cosméticos`,
    `Melasma severo o hiperpigmentación que no mejora con activos OTC`,
    `Cualquier duda sobre la salud de la piel que no sea meramente cosmética — los dermatólogos son el recurso correcto, no los influencers de skincare ni los asistentes digitales`,
  ],
};
