import { getTopicsByDomain } from './knowledge/luminaContext.js';

// ═══════════════════════════════════════════════
// AFFIRMATION CARDS (Amor Propio)
// moods: 'happy' | 'grateful' | 'hopeful' | 'tired' | 'anxious' | 'down'
//        | 'lonely' | 'insecure' | 'overwhelmed' | 'empowered' | 'inspired' | 'peaceful'
// themes: 'skin' | 'body' | 'identity' | 'faith' | 'strength'
// ═══════════════════════════════════════════════
export const AFFIRMATION_CARDS = [
  {
    id: 'not_everything_today',
    affirmation: "No tengo que ser todo para todos, todo el tiempo. Hoy puedo solo ser yo.",
    verse: '"Bástate mi gracia, porque mi poder se perfecciona en la debilidad." — 2 Corintios 12:9',
    moods: ['overwhelmed', 'tired', 'insecure'],
    themes: ['strength', 'identity'],
  },
  {
    id: 'face_is_face',
    affirmation: "Mi cara no es un proyecto. Es mi cara.",
    verse: '"Te alabo porque soy una creación admirable. ¡Tus obras son maravillosas!" — Salmo 139:14',
    moods: ['insecure', 'down'],
    themes: ['identity', 'body'],
  },
  {
    id: 'survived_more',
    affirmation: "He sobrevivido a cosas que pensé que no iba a poder. Eso ya cuenta.",
    verse: '"Esfuérzate y sé valiente; no temas ni desmayes." — Josué 1:9',
    moods: ['anxious', 'down', 'empowered'],
    themes: ['strength'],
  },
  {
    id: 'social_media_trap',
    affirmation: "Las redes están diseñadas para que me sienta menos. Hoy no juego ese juego.",
    verse: '"No os conforméis a este siglo, sino transformaos por la renovación de vuestro entendimiento." — Romanos 12:2',
    moods: ['insecure', 'down', 'anxious'],
    themes: ['identity'],
  },
  {
    id: 'best_friend_voice',
    affirmation: "Hoy me hablo como le hablaría a mi mejor amiga si estuviera en mi lugar.",
    verse: '"Sed bondadosos unos con otros, misericordiosos." — Efesios 4:32',
    moods: ['anxious', 'insecure', 'tired'],
    themes: ['identity', 'strength'],
  },
  {
    id: 'rest_is_strategy',
    affirmation: "Descansar no es debilidad. Es estrategia.",
    verse: '"Venid a mí todos los que estáis cansados, y yo os haré descansar." — Mateo 11:28',
    moods: ['tired', 'overwhelmed'],
    themes: ['body', 'strength'],
  },
  {
    id: 'three_breaths',
    affirmation: "Respiro tres veces lento. El mundo puede esperar tres respiraciones.",
    verse: '"En quietud y confianza está vuestra fortaleza." — Isaías 30:15',
    moods: ['anxious', 'overwhelmed'],
    themes: ['strength'],
  },
  {
    id: 'tomorrow_different',
    affirmation: "Hoy es solo hoy. Mañana puede ser distinto y no tengo que adelantarme.",
    verse: '"Las misericordias del Señor son nuevas cada mañana." — Lamentaciones 3:23',
    moods: ['down', 'tired', 'hopeful'],
    themes: ['faith'],
  },
  {
    id: 'exist_counts',
    affirmation: "Hoy no tengo que ser productiva. Existir ya cuenta.",
    verse: '"Estad quietos, y conoced que yo soy Dios." — Salmo 46:10',
    moods: ['tired', 'down', 'overwhelmed'],
    themes: ['body', 'faith'],
  },
  {
    id: 'enough_as_is',
    affirmation: "No tengo que ser más para merecer estar aquí.",
    verse: '"Bástate mi gracia." — 2 Corintios 12:9',
    moods: ['insecure', 'peaceful', 'down'],
    themes: ['identity'],
  },
  {
    id: 'compare_trap',
    affirmation: "Comparar mi detrás de cámaras con el highlight reel de otra es trampa.",
    verse: '"Cada uno examine su propia obra, y entonces tendrá motivo de gloriarse." — Gálatas 6:4',
    moods: ['insecure', 'anxious'],
    themes: ['identity'],
  },
  {
    id: 'body_thanks',
    affirmation: "Gracias a mi cuerpo por seguir aquí, especialmente los días que lo critiqué.",
    verse: '"Tú creaste mis entrañas; me formaste en el vientre de mi madre." — Salmo 139:13',
    moods: ['grateful', 'tired'],
    themes: ['body', 'skin'],
  },
  {
    id: 'small_step',
    affirmation: "No tengo que tener todo claro hoy. Suficiente con dar un paso.",
    verse: '"Lámpara es a mis pies tu palabra, y lumbrera a mi camino." — Salmo 119:105',
    moods: ['hopeful', 'overwhelmed', 'anxious'],
    themes: ['strength', 'faith'],
  },
  {
    id: 'different_self',
    affirmation: "Soy diferente a quien era el año pasado. Voy a serlo otra vez el siguiente.",
    verse: '"Las cosas viejas pasaron; he aquí todas son hechas nuevas." — 2 Corintios 5:17',
    moods: ['hopeful', 'inspired'],
    themes: ['identity', 'strength'],
  },
  {
    id: 'laughed_today',
    affirmation: "Hoy me reí sin pensarlo. Eso también es éxito.",
    verse: '"Este es el día que hizo el Señor; regocijémonos y alegrémonos en él." — Salmo 118:24',
    moods: ['happy', 'grateful'],
    themes: ['identity'],
  },
  {
    id: 'save_feeling',
    affirmation: "Voy a guardar esta sensación. La voy a necesitar otro día.",
    verse: '"Dad gracias en todo, porque esta es la voluntad de Dios." — 1 Tesalonicenses 5:18',
    moods: ['happy', 'peaceful', 'grateful'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'own_company',
    affirmation: "Estar conmigo misma también es buena compañía. La estoy aprendiendo a disfrutar.",
    verse: '"Hay un amigo más cercano que un hermano." — Proverbios 18:24',
    moods: ['lonely', 'peaceful'],
    themes: ['identity', 'strength'],
  },
  {
    id: 'understand_myself',
    affirmation: "No siempre voy a encontrar a alguien que me entienda al 100%. Yo sí me entiendo. Empiezo por ahí.",
    verse: '"Antes que te formase en el vientre te conocí." — Jeremías 1:5',
    moods: ['lonely', 'insecure'],
    themes: ['identity'],
  },
  {
    id: 'one_thing_time',
    affirmation: "Una cosa a la vez. La siguiente puede esperar tres minutos.",
    verse: '"Por lo tanto, no os preocupéis por el día de mañana." — Mateo 6:34',
    moods: ['overwhelmed', 'anxious'],
    themes: ['strength'],
  },
  {
    id: 'voice_matters',
    affirmation: "Mi voz importa antes de que sepa exactamente qué decir.",
    verse: '"Te he dado un espíritu de poder, de amor y de dominio propio." — 2 Timoteo 1:7',
    moods: ['empowered', 'insecure'],
    themes: ['identity', 'strength'],
  },
  {
    id: 'move_no_size',
    affirmation: "Voy a hacer algo hoy aunque sea pequeño. El movimiento no tiene tamaño.",
    verse: '"No menosprecies este pequeño comienzo." — Zacarías 4:10',
    moods: ['inspired', 'hopeful'],
    themes: ['strength'],
  },
  {
    id: 'this_moment',
    affirmation: "Este momento es suficiente. No tiene que ser nada más.",
    verse: '"Todo tiene su tiempo, y todo lo que se quiere debajo del cielo tiene su hora." — Eclesiastés 3:1',
    moods: ['peaceful', 'grateful'],
    themes: ['faith', 'identity'],
  },
  {
    id: 'face_what_comes',
    affirmation: "Lo peor que imagino casi nunca pasa. Y si pasa, sé manejarlo cuando llega.",
    verse: '"Por lo tanto, no temáis." — Mateo 10:31',
    moods: ['empowered', 'anxious'],
    themes: ['strength', 'faith'],
  },
  {
    id: 'happy_no_reason',
    affirmation: "Estar bien no necesita justificación. Hoy estoy bien sin más.",
    verse: '"Alegraos en el Señor siempre. Otra vez digo: ¡Alegraos!" — Filipenses 4:4',
    moods: ['happy', 'peaceful'],
    themes: ['identity'],
  },
  {
    id: 'belong_here',
    affirmation: "Pertenezco a este mundo aunque no siempre lo sienta. Tomar mi lugar también es amarme.",
    verse: '"Sois piedras vivas en una casa espiritual." — 1 Pedro 2:5',
    moods: ['lonely', 'empowered'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'idea_today',
    affirmation: "Una idea me visitó hoy. No la dejo ir sin haberle hecho caso aunque sea un poco.",
    verse: '"Toda buena dádiva y todo don perfecto desciende de lo alto." — Santiago 1:17',
    moods: ['inspired', 'happy', 'hopeful'],
    themes: ['identity', 'strength'],
  },

  // ── Expansión: cobertura mood 10+ ──

  // HAPPY (+6)
  {
    id: 'sun_on_skin',
    affirmation: "Salí y el sol me cayó de sorpresa. No lo busqué, pero lo voy a anotar como momento bueno del día.",
    verse: '"La luz es dulce, y reconforta los ojos ver el sol." — Eclesiastés 11:7',
    moods: ['happy', 'peaceful', 'grateful'],
    themes: ['body', 'identity'],
  },
  {
    id: 'laugh_stupid_thing',
    affirmation: "Me reí de algo que nadie más hubiera encontrado gracioso. Ese es mi sentido del humor y no lo cambio.",
    verse: '"Hay un tiempo para reír." — Eclesiastés 3:4',
    moods: ['happy', 'peaceful'],
    themes: ['identity'],
  },
  {
    id: 'morning_drink',
    affirmation: "La primera taza de la mañana fue perfecta. Hay días en que eso ya lo es todo.",
    verse: '"Él hace que brote la hierba para el ganado, y las plantas para el servicio del hombre." — Salmo 104:14',
    moods: ['happy', 'grateful', 'peaceful'],
    themes: ['body', 'identity'],
  },
  {
    id: 'message_right_time',
    affirmation: "Alguien me escribió justo cuando lo necesitaba. Eso no siempre es coincidencia.",
    verse: '"El corazón del hombre traza su camino, pero el Señor dirige sus pasos." — Proverbios 16:9',
    moods: ['happy', 'grateful'],
    themes: ['faith', 'identity'],
  },
  {
    id: 'cook_for_me',
    affirmation: "Prepararme algo rico para mí misma también es cuidado. No necesito cocinarlo para alguien más para que valga.",
    verse: '"Anda, come tu pan con alegría, y bebe tu vino con corazón contento." — Eclesiastés 9:7',
    moods: ['happy', 'empowered'],
    themes: ['body', 'identity'],
  },
  {
    id: 'good_for_no_reason',
    affirmation: "Hoy me siento bien y no sé exactamente por qué. Voy a dejar de buscarle explicación y solo recibirlo.",
    verse: '"¿O pensáis que la Escritura dice en vano que el Espíritu que ha puesto su morada en nosotros nos anhela celosamente?" — Santiago 4:5',
    moods: ['happy', 'peaceful'],
    themes: ['faith', 'identity'],
  },

  // GRATEFUL (+5)
  {
    id: 'body_survived_week',
    affirmation: "Mi cuerpo aguantó esta semana entera. Le debo un poco de agradecimiento, no solo crítica.",
    verse: '"¿No saben que su cuerpo es templo del Espíritu Santo?" — 1 Corintios 6:19',
    moods: ['grateful', 'tired', 'peaceful'],
    themes: ['body', 'faith'],
  },
  {
    id: 'friends_appeared',
    affirmation: "Hay personas que llegaron sin que yo las pidiera en oración. A veces la vida hace eso.",
    verse: '"En todo tiempo ama el amigo." — Proverbios 17:17',
    moods: ['grateful', 'lonely'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'pain_taught',
    affirmation: "Aprendí algo de lo que dolió. No fue gratis, pero tampoco fue en vano.",
    verse: '"Porque esta leve tribulación momentánea produce en nosotros un cada vez más excelente y eterno peso de gloria." — 2 Corintios 4:17',
    moods: ['grateful', 'hopeful', 'down'],
    themes: ['strength', 'faith'],
  },
  {
    id: 'roof_and_food',
    affirmation: "Tengo donde dormir y algo que comer hoy. Esto no es poca cosa, aunque lo haya normalizado.",
    verse: '"Sea el contentamiento con lo que tenéis." — Hebreos 13:5',
    moods: ['grateful', 'peaceful'],
    themes: ['faith', 'identity'],
  },
  {
    id: 'just_today',
    affirmation: "El simple hecho de que hoy existió, de que lo viví, ya es algo que agradecer.",
    verse: '"Bendice, alma mía, al Señor, y no olvides ninguno de sus beneficios." — Salmo 103:2',
    moods: ['grateful', 'peaceful', 'hopeful'],
    themes: ['faith'],
  },

  // HOPEFUL (+5)
  {
    id: 'trust_before_evidence',
    affirmation: "Confiar antes de tener pruebas no es ingenuidad. Es decidir no cerrarme antes de tiempo.",
    verse: '"La fe es la certeza de lo que se espera, la convicción de lo que no se ve." — Hebreos 11:1',
    moods: ['hopeful', 'anxious', 'empowered'],
    themes: ['faith', 'strength'],
  },
  {
    id: 'seed_phase',
    affirmation: "Estoy en la fase de semilla. Que no se vea nada todavía no significa que no esté pasando nada.",
    verse: '"Si el grano de trigo no cae en la tierra y muere, queda solo; pero si muere, lleva mucho fruto." — Juan 12:24',
    moods: ['hopeful', 'down', 'inspired'],
    themes: ['faith', 'strength'],
  },
  {
    id: 'obvious_later',
    affirmation: "Hay decisiones que solo se vuelven claras después. Todavía no estoy en el después.",
    verse: '"Fíate del Señor con todo tu corazón, y no te apoyes en tu propia prudencia." — Proverbios 3:5',
    moods: ['hopeful', 'anxious'],
    themes: ['faith', 'identity'],
  },
  {
    id: 'future_has_room',
    affirmation: "El futuro tiene espacio para cosas que todavía no imagino. No todo está escrito.",
    verse: '"Porque yo sé los pensamientos que tengo acerca de vosotros, dice el Señor, pensamientos de bienestar." — Jeremías 29:11',
    moods: ['hopeful', 'inspired'],
    themes: ['faith'],
  },
  {
    id: 'first_step_counts',
    affirmation: "No necesito ver toda la escalera. El primer peldaño ya me pone un nivel más arriba.",
    verse: '"El que es fiel en lo muy poco, también en lo más es fiel." — Lucas 16:10',
    moods: ['hopeful', 'empowered', 'overwhelmed'],
    themes: ['strength', 'faith'],
  },

  // TIRED (+4)
  {
    id: 'body_talking',
    affirmation: "Mi cuerpo no me está fallando. Me está hablando. Aprendo a escucharlo en vez de callarlo.",
    verse: '"Él da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas." — Isaías 40:29',
    moods: ['tired', 'peaceful'],
    themes: ['body', 'faith'],
  },
  {
    id: 'tomorrow_not_today',
    affirmation: "Lo que no pude hacer hoy puede esperar mañana. Mañana y hoy son días distintos.",
    verse: '"¿Quién de vosotros, por más que se afane, puede añadir un codo a su estatura?" — Mateo 6:27',
    moods: ['tired', 'overwhelmed'],
    themes: ['faith', 'strength'],
  },
  {
    id: 'tiredness_is_info',
    affirmation: "El cansancio me está diciendo algo. En vez de ignorarlo, le voy a hacer caso aunque sea un poco.",
    verse: '"El sabio de corazón acepta los mandamientos, pero el necio de labios caerá." — Proverbios 10:8',
    moods: ['tired', 'overwhelmed'],
    themes: ['body', 'identity'],
  },
  {
    id: 'permission_to_stop',
    affirmation: "Me doy permiso de parar antes de llegar al fondo. Parar a tiempo también es una decisión inteligente.",
    verse: '"Venid vosotros aparte a un lugar desierto, y descansad un poco." — Marcos 6:31',
    moods: ['tired', 'overwhelmed', 'peaceful'],
    themes: ['body', 'strength'],
  },

  // DOWN (+4)
  {
    id: 'still_here_counts',
    affirmation: "Estar mal y seguir aquí de todas formas ya cuenta. No es poco. Es bastante.",
    verse: '"Aunque caiga el justo, no quedará postrado, porque el Señor lo sostiene con su mano." — Salmo 37:24',
    moods: ['down', 'tired', 'empowered'],
    themes: ['strength', 'faith'],
  },
  {
    id: 'days_do_pass',
    affirmation: "Los días pasan aunque se sientan eternos cuando los estás viviendo.",
    verse: '"No hay memoria de lo que precedió, ni tampoco de lo que sucederá habrá memoria." — Eclesiastés 1:11',
    moods: ['down', 'hopeful'],
    themes: ['faith', 'identity'],
  },
  {
    id: 'not_fix_everything',
    affirmation: "No tengo que repararlo todo de una. Puedo dejar que algunas cosas sigan rotas por ahora.",
    verse: '"Echad toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros." — 1 Pedro 5:7',
    moods: ['down', 'overwhelmed', 'anxious'],
    themes: ['faith', 'strength'],
  },
  {
    id: 'cry_doesnt_break',
    affirmation: "Llorar no me rompe. A veces es la única manera honesta de procesar algo real.",
    verse: '"Los que sembraron con lágrimas, con regocijo segarán." — Salmo 126:5',
    moods: ['down', 'grateful'],
    themes: ['strength', 'identity'],
  },

  // LONELY (+8) — PRIORIDAD
  {
    id: 'crowd_still_alone',
    affirmation: "Hay veces que estoy rodeada de gente y me siento sola. Eso no dice nada malo de mí. Solo es honesto.",
    verse: '"Señor, toda mi esperanza está en ti." — Salmo 39:7',
    moods: ['lonely', 'down'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'silent_group_chat',
    affirmation: "El grupo de WhatsApp en silencio no es un indicador de cuánto valgo. Solo es un grupo en silencio.",
    verse: '"¿Está alguno de vosotros afligido? Ore." — Santiago 5:13',
    moods: ['lonely', 'insecure'],
    themes: ['identity'],
  },
  {
    id: 'chosen_vs_felt',
    affirmation: "Hay una diferencia entre la soledad que elijo y la que simplemente me cae encima. Hoy entiendo cuál es cuál.",
    verse: '"Tú conoces mi sentarme y mi levantarme." — Salmo 139:2',
    moods: ['lonely', 'peaceful'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'alone_near_others',
    affirmation: "Sentirme sola con personas cerca no es un defecto mío. Es una señal de que necesito conexión real, no solo presencia.",
    verse: '"Dios hace habitar en familia a los solitarios." — Salmo 68:6',
    moods: ['lonely', 'down'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'my_own_company_valid',
    affirmation: "Mi propia compañía es compañía. No es un premio de consolación.",
    verse: '"El que tiene al Hijo tiene la vida." — 1 Juan 5:12',
    moods: ['lonely', 'empowered', 'peaceful'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'not_every_gap',
    affirmation: "No todos los huecos tienen que llenarse con alguien. Algunos solo necesitan tiempo.",
    verse: '"El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente." — Salmo 91:1',
    moods: ['lonely', 'peaceful', 'overwhelmed'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'connect_bigger',
    affirmation: "Cuando no hay nadie cerca que me entienda, hay algo más grande al que me puedo acercar.",
    verse: '"Acercaos a Dios, y él se acercará a vosotros." — Santiago 4:8',
    moods: ['lonely', 'hopeful', 'peaceful'],
    themes: ['faith', 'identity'],
  },
  {
    id: 'learning_my_company',
    affirmation: "Aprender a estar conmigo misma sin querer huir es el trabajo silencioso que nadie ve pero que más me transforma.",
    verse: '"Porque Tú eres mi roca y mi fortaleza." — Salmo 71:3',
    moods: ['lonely', 'empowered', 'peaceful'],
    themes: ['identity', 'strength'],
  },

  // INSECURE (+3)
  {
    id: 'different_in_light',
    affirmation: "Me veo distinta según la luz, el espejo, el ángulo, el día. La foto no me define. Tampoco el espejo.",
    verse: '"El hombre mira lo que está delante de sus ojos, pero el Señor mira el corazón." — 1 Samuel 16:7',
    moods: ['insecure', 'down'],
    themes: ['body', 'identity'],
  },
  {
    id: 'trembling_voice',
    affirmation: "Mi voz tembló cuando hablé. Pero habló. Eso es lo que cuenta.",
    verse: '"De la boca de los pequeños y de los que maman perfeccionaste la alabanza." — Mateo 21:16',
    moods: ['insecure', 'empowered'],
    themes: ['identity', 'strength'],
  },
  {
    id: 'said_wrong_thing',
    affirmation: "Tal vez dije algo que no sonó bien. No necesito reproducir la conversación entera esta noche.",
    verse: '"El amor cubre multitud de pecados." — 1 Pedro 4:8',
    moods: ['insecure', 'anxious'],
    themes: ['identity'],
  },

  // OVERWHELMED (+4)
  {
    id: 'decide_what_not',
    affirmation: "Hoy decido qué NO hacer. La lista de lo que queda fuera también es una decisión.",
    verse: '"Todo lo que os sea honesto, pensad en esto." — Filipenses 4:8',
    moods: ['overwhelmed', 'empowered'],
    themes: ['strength', 'identity'],
  },
  {
    id: 'inbox_metaphor',
    affirmation: "Mi cabeza tiene muchas pestañas abiertas ahora mismo. Voy a cerrar algunas aunque no estén terminadas.",
    verse: '"La paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones." — Filipenses 4:7',
    moods: ['overwhelmed', 'anxious', 'peaceful'],
    themes: ['strength', 'faith'],
  },
  {
    id: 'no_as_love',
    affirmation: "Decir que no a algo es decir que sí a mi tiempo, mi energía y mi paz. Ambas cosas cuentan.",
    verse: '"Sea vuestro sí, sí; y vuestro no, no." — Mateo 5:37',
    moods: ['overwhelmed', 'empowered'],
    themes: ['strength', 'identity'],
  },
  {
    id: 'only_next_step',
    affirmation: "No tengo que resolver todo hoy. Solo el siguiente paso. Uno.",
    verse: '"Así que, hermanos, os ruego que presentéis vuestros cuerpos como sacrificio vivo." — Romanos 12:1',
    moods: ['overwhelmed', 'anxious', 'hopeful'],
    themes: ['strength', 'faith'],
  },

  // EMPOWERED (+6) — PRIORIDAD
  {
    id: 'no_no_explanation',
    affirmation: "Dije que no y no lo expliqué. No siempre debo una razón.",
    verse: '"Manteneos firmes en la libertad con que Cristo nos hizo libres." — Gálatas 5:1',
    moods: ['empowered', 'overwhelmed'],
    themes: ['identity', 'strength'],
  },
  {
    id: 'standing_my_ground',
    affirmation: "Hay cosas en las que no me muevo. No porque sea rígida, sino porque sé cuáles son.",
    verse: '"Velad, estad firmes en la fe, portaos varonilmente, y esforzaos." — 1 Corintios 16:13',
    moods: ['empowered', 'insecure'],
    themes: ['identity', 'strength'],
  },
  {
    id: 'do_the_scary',
    affirmation: "Hice lo que me asustaba. No desapareció el miedo, pero lo hice igual. Eso es lo que importa.",
    verse: '"No temas, que yo estoy contigo." — Isaías 41:10',
    moods: ['empowered', 'anxious'],
    themes: ['strength', 'faith'],
  },
  {
    id: 'take_up_space',
    affirmation: "Ocupar mi espacio no requiere permiso. Ya tengo derecho a estar aquí.",
    verse: '"El Señor tu Dios está en medio de ti; él es poderoso y te salvará." — Sofonías 3:17',
    moods: ['empowered', 'lonely', 'insecure'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'confidence_as_verb',
    affirmation: "La confianza no es algo que se siente primero. Es algo que se hace y después se siente.",
    verse: '"Todo lo puedo en Cristo que me fortalece." — Filipenses 4:13',
    moods: ['empowered', 'hopeful'],
    themes: ['strength', 'faith'],
  },
  {
    id: 'body_moving',
    affirmation: "Mi cuerpo en movimiento es poderoso sin importar cómo se vea moviéndose.",
    verse: '"Glorificad, pues, a Dios en vuestro cuerpo." — 1 Corintios 6:20',
    moods: ['empowered', 'happy', 'insecure'],
    themes: ['body', 'strength'],
  },

  // INSPIRED (+8) — PRIORIDAD
  {
    id: 'song_reaches_me',
    affirmation: "Una canción me llegó diferente hoy. No sé explicar por qué. No hace falta.",
    verse: '"Cantad al Señor un cántico nuevo." — Salmo 96:1',
    moods: ['inspired', 'happy', 'peaceful'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'see_work_want_create',
    affirmation: "Ver lo que alguien más creó me dio ganas de crear. Eso no es envidia — es que tengo algo adentro que quiere salir.",
    verse: '"Dios puso eternidad en el corazón de ellos." — Eclesiastés 3:11',
    moods: ['inspired', 'hopeful'],
    themes: ['identity', 'strength'],
  },
  {
    id: 'shower_ideas',
    affirmation: "Las mejores ideas me llegan en la ducha. Cuando el cerebro para de correr, algo creativo puede entrar.",
    verse: '"El que me escuche habitará seguro, y vivirá tranquilo, sin temor del mal." — Proverbios 1:33',
    moods: ['inspired', 'peaceful'],
    themes: ['identity'],
  },
  {
    id: 'fertile_silence',
    affirmation: "El silencio de hoy no es vacío. Es el tipo de silencio en el que se forman cosas.",
    verse: '"El Señor está en su santo templo; calle delante de él toda la tierra." — Habacuc 2:20',
    moods: ['inspired', 'peaceful'],
    themes: ['identity', 'faith'],
  },
  {
    id: 'sentence_made_me_pause',
    affirmation: "Leí algo que me hizo parar. Me quedé en esa página. Eso no pasa todos los días.",
    verse: '"¡Cuán dulces son a mi paladar tus palabras! Más que la miel a mi boca." — Salmo 119:103',
    moods: ['inspired', 'grateful', 'peaceful'],
    themes: ['faith', 'identity'],
  },
  {
    id: 'dawn_again',
    affirmation: "El amanecer volvió a pasar aunque ayer fue un día difícil. No preguntó si merecía otro.",
    verse: '"El sol conoce su ocaso." — Salmo 104:19',
    moods: ['inspired', 'hopeful', 'grateful'],
    themes: ['faith'],
  },
  {
    id: 'want_to_start_something',
    affirmation: "Tengo ganas de empezar algo. Eso en sí ya es energía. No dejo que se enfríe.",
    verse: '"El que comenzó en vosotros la buena obra, la perfeccionará." — Filipenses 1:6',
    moods: ['inspired', 'empowered', 'hopeful'],
    themes: ['strength', 'identity'],
  },
  {
    id: 'creativity_comes_back',
    affirmation: "La creatividad se fue un tiempo. Pero siempre vuelve si la espero sin presionarla.",
    verse: '"El Señor restaura a los abatidos." — Salmo 147:3',
    moods: ['inspired', 'down', 'hopeful'],
    themes: ['identity', 'faith'],
  },

  // PEACEFUL (+5)
  {
    id: 'after_the_storm',
    affirmation: "Después de la tormenta no siempre hay arcoíris inmediato. A veces hay solo calma, y eso ya es suficiente.",
    verse: '"Reinó la calma, y las aguas se sosegaron." — Salmo 107:29',
    moods: ['peaceful', 'hopeful', 'down'],
    themes: ['faith', 'strength'],
  },
  {
    id: 'accept_no_control',
    affirmation: "Hay cosas que no dependen de mí. Soltarlas no es rendirme, es ser realista.",
    verse: '"Confía en el Señor y haz el bien." — Salmo 37:3',
    moods: ['peaceful', 'anxious', 'overwhelmed'],
    themes: ['faith', 'strength'],
  },
  {
    id: 'slow_sunday',
    affirmation: "Un día lento no es un día perdido. A veces el descanso es el trabajo más importante.",
    verse: '"Descansó el séptimo día de toda la obra que había hecho." — Génesis 2:2',
    moods: ['peaceful', 'tired', 'happy'],
    themes: ['body', 'faith'],
  },
  {
    id: 'breath_as_anchor',
    affirmation: "Cuando todo se mueve, mi respiración no se mueve. Vuelvo a ella.",
    verse: '"Aunque un ejército acampe contra mí, no temerá mi corazón." — Salmo 27:3',
    moods: ['peaceful', 'anxious'],
    themes: ['body', 'strength'],
  },
  {
    id: 'here_right_now',
    affirmation: "Ahora mismo no pasa nada que no pueda manejar. Ahora mismo estoy bien.",
    verse: '"El Señor es mi pastor, nada me faltará." — Salmo 23:1',
    moods: ['peaceful', 'anxious', 'grateful'],
    themes: ['faith', 'identity'],
  },
];

// ═══════════════════════════════════════════════
// COLORIMETRÍA
// ═══════════════════════════════════════════════
export const COLORIMETRIA_QUESTIONS = [
  {
    question: "Tu pelo natural, sin tintes ni mechas. ¿Qué tono base tienes?",
    hint: "Si tienes el pelo teñido, piensa en cómo lucía antes.",
    options: [
      { text: "Negro intenso o castaño muy oscuro con reflejos azulados", value: "frio" },
      { text: "Rubio platino, ceniza o castaño cenizo", value: "frio" },
      { text: "Rubio dorado o miel, castaño con reflejos cálidos", value: "calido" },
      { text: "Pelirrojo, cobrizo o rubio fresa", value: "calido" },
      { text: "Castaño medio sin matices extremos", value: "neutro" },
    ],
  },
  {
    question: "Mírate los ojos a la luz natural. ¿Qué describe mejor el tuyo?",
    hint: "Acerca el espejo. Observa el iris alrededor de la pupila.",
    options: [
      { text: "Azul, gris o verde fresco", value: "frio" },
      { text: "Café claro con destellos dorados, ámbar o avellana", value: "calido" },
      { text: "Café oscuro casi negro", value: "neutro" },
      { text: "Verde profundo o azul con reflejos cálidos", value: "neutro" },
    ],
  },
  {
    question: "Test de muñeca: voltea tu brazo y mira las venas a luz natural.",
    hint: "Es la prueba más reveladora — tus venas son una ventana directa al subtono.",
    options: [
      { text: "Se ven azuladas o moradas", value: "frio" },
      { text: "Se ven verdosas o aceitunadas", value: "calido" },
      { text: "Una mezcla, no logro decidir", value: "neutro" },
    ],
  },
  {
    question: "En vacaciones sin protector solar, tu piel reacciona así:",
    hint: "Piensa en la primera exposición fuerte después de meses sin sol.",
    options: [
      { text: "Me quemo rápido (rojo o rosa) y casi no me bronceo", value: "frio" },
      { text: "Me bronceo de forma uniforme sin quemarme", value: "calido" },
      { text: "Me quemo un poco al inicio y después bronceo", value: "neutro" },
    ],
  },
  {
    question: "Mírate los labios sin lápiz ni gloss. El color natural se inclina hacia:",
    hint: "Si acabas de comer o beber algo caliente, espera unos minutos para ver el tono real.",
    options: [
      { text: "Rosa frío, frambuesa o casi malva", value: "frio" },
      { text: "Durazno, coral o terracota suave", value: "calido" },
      { text: "Nude rosado, equilibrado, ni frío ni cálido", value: "neutro" },
    ],
  },
  {
    question: "Baja suavemente tu párpado inferior con un dedo. El borde rosado interno revela tu subtono real.",
    hint: "Esa zona (la waterline) está protegida del sol y muestra el subtono más puro. Es la prueba favorita de las dermatólogas.",
    options: [
      { text: "Se ve rosa frío, frambuesa o tirando a violeta", value: "frio" },
      { text: "Se ve anaranjado, melocotón o salmón", value: "calido" },
      { text: "Un rosa medio difícil de clasificar", value: "neutro" },
    ],
  },
  {
    question: "Mira la parte interior de tu antebrazo, donde la piel casi no recibe sol. ¿Qué tono base observas?",
    hint: "Esta zona refleja tu pigmentación más pura, sin influencia del bronceado.",
    options: [
      { text: "Porcelana, rosado o levemente azulado", value: "frio" },
      { text: "Dorado, amarillento, melocotón o aceitunado", value: "calido" },
      { text: "Beige neutro, sin matiz dominante", value: "neutro" },
    ],
  },
];

export const COLORIMETRIA_RESULTS = {
  frio: {
    title: "Subtono Frío",
    desc: "Tu piel tiene matices rosados, rojizos o azulados. Los colores fríos resaltan tu belleza natural.",
    colors: [
      { hex: "#4A6FA5", name: "Azul zafiro" },
      { hex: "#8B5E83", name: "Violeta amatista" },
      { hex: "#C75B7A", name: "Rosa rubí" },
      { hex: "#2E4057", name: "Azul medianoche" },
      { hex: "#D4A5A5", name: "Rosa hielo" },
      { hex: "#6B4C6E", name: "Ciruela" },
    ],
    tips: "Los tonos joya como zafiro, esmeralda, rubí y amatista son tus aliados. En maquillaje, opta por bases con subtono rosado y labiales en tonos berry.",
    recommendations: {
      blush: {
        desc: "Busca rosas con base fría: frambuesa, mauve y berry suave. El coral y el melocotón apagan tu luz — déjalos pasar.",
        swatches: [
          { hex: "#C2547A", name: "Frambuesa" },
          { hex: "#A8768A", name: "Mauve frío" },
          { hex: "#8B3A62", name: "Berry" },
          { hex: "#D4809A", name: "Rosa frío" },
        ],
      },
      eyeshadow: {
        desc: "Los metales fríos y los morados iluminan tu mirada. La plata hace que tus ojos brillen como no lo hace ningún otro tono.",
        swatches: [
          { hex: "#C0C0C0", name: "Plata" },
          { hex: "#8A8A9A", name: "Gris humo" },
          { hex: "#9B8EC4", name: "Lila" },
          { hex: "#9B7A8A", name: "Mauve" },
          { hex: "#1C2951", name: "Medianoche" },
        ],
      },
      lipstick: {
        desc: "Tu boca pide profundidad y drama frío. Desde nude rosado para el día hasta ciruela intensa para la noche — todo con base fría.",
        swatches: [
          { hex: "#9B2335", name: "Cereza" },
          { hex: "#6B2D5E", name: "Ciruela" },
          { hex: "#7B1E3C", name: "Berry" },
          { hex: "#5C1A2E", name: "Vino" },
          { hex: "#D4899A", name: "Nude rosado" },
        ],
      },
      jewelry: {
        desc: "Los metales fríos son tu mejor amiga — iluminan tu piel sin pelear con ella. El oro amarillo puede darte aspecto cansado.",
        favor: ["Plata", "Oro blanco", "Platino", "Diamantes", "Perlas blancas", "Zafiros", "Amatistas", "Aguamarinas"],
        avoid: ["Oro amarillo", "Bronce", "Cobre", "Oro rosa intenso"],
      },
      hair: {
        desc: "En el cabello, los tonos fríos acentúan tu armonía natural y hacen que tu piel se vea más luminosa y descansada.",
        blonde: ["Rubio platino", "Rubio cenizo", "Rubio ártico", "Rubio plateado"],
        brown: ["Castaño cenizo", "Espresso frío", "Chocolate frío", "Negro azulado"],
        red: ["Borgoña", "Caoba ciruela", "Cereza profundo"],
        avoid: "Evita dorados, miel, cobre y caramelo — estos tonos cálidos crean contraste con tu piel y la hacen ver apagada.",
      },
      clothing: {
        desc: "Viste con la intensidad de tu subtono. Los joya son tus básicos de lujo; el negro y el blanco puro son tus neutros ganadores.",
        favor: [
          { hex: "#1E3A8A", name: "Azul zafiro" },
          { hex: "#047857", name: "Esmeralda" },
          { hex: "#C026D3", name: "Magenta" },
          { hex: "#A78BFA", name: "Lavanda" },
          { hex: "#FFFFFF", name: "Blanco puro" },
          { hex: "#0F0F0F", name: "Negro" },
          { hex: "#36454F", name: "Gris carbón" },
          { hex: "#D04C77", name: "Rosa frambuesa" },
        ],
        avoid: [
          { hex: "#FB923C", name: "Naranja brillante" },
          { hex: "#D4A017", name: "Mostaza" },
          { hex: "#D2B48C", name: "Beige cálido" },
          { hex: "#6F4E37", name: "Marrón tabaco" },
          { hex: "#FFF8DC", name: "Crema amarillenta" },
        ],
      },
      glasses: {
        desc: "Elige marcos en plata, plateado, negro mate, tortuga oscura o transparentes con tinte rosa o azul — todos armonizan con tu subtono frío.",
      },
    },
  },
  calido: {
    title: "Subtono Cálido",
    desc: "Tu piel tiene matices dorados, melocotón o amarillentos. Los tonos tierra y cálidos te iluminan.",
    colors: [
      { hex: "#D4A373", name: "Caramelo dorado" },
      { hex: "#E07A5F", name: "Terracota coral" },
      { hex: "#F2CC8F", name: "Mostaza suave" },
      { hex: "#81B29A", name: "Verde oliva" },
      { hex: "#C17817", name: "Bronce ámbar" },
      { hex: "#A68A64", name: "Cacao" },
    ],
    tips: "Los tonos tierra como terracota, coral, dorado y verde oliva te favorecen. En bases, busca subtonos amarillos o dorados.",
    recommendations: {
      blush: {
        desc: "Tu mejilla pide calidez: melocotón, coral y terracota suave crean ese efecto de piel bronceada natural que te encantará. Los rosas fríos te dan aspecto pálido.",
        swatches: [
          { hex: "#FFAD80", name: "Melocotón" },
          { hex: "#E8735A", name: "Coral" },
          { hex: "#D4856A", name: "Durazno" },
          { hex: "#C47060", name: "Terracota suave" },
        ],
      },
      eyeshadow: {
        desc: "Los metales dorados y los tonos tierra despiertan tu mirada. El bronce y el cobre son tus colores estrella para cualquier ocasión.",
        swatches: [
          { hex: "#D4AF37", name: "Oro" },
          { hex: "#CD7F32", name: "Bronce" },
          { hex: "#B87333", name: "Cobre" },
          { hex: "#C17767", name: "Terracota" },
          { hex: "#6B7C45", name: "Verde oliva" },
        ],
      },
      lipstick: {
        desc: "Coral, terracota y brick son tus colores de poder. Para el día, durazno cálido; para la noche, un marrón con fondo dorado que nadie más puede llevar como tú.",
        swatches: [
          { hex: "#E8602C", name: "Coral" },
          { hex: "#C4634F", name: "Terracota" },
          { hex: "#A0522D", name: "Brick" },
          { hex: "#E8955A", name: "Durazno cálido" },
          { hex: "#7B4A2D", name: "Marrón cálido" },
        ],
      },
      jewelry: {
        desc: "El oro amarillo fue hecho para ti — amplifica el dorado natural de tu piel. La plata puede darte un aspecto grisáceo.",
        favor: ["Oro amarillo", "Oro rosa", "Bronce", "Ámbar", "Topacio", "Turquesa", "Coral", "Marfil", "Jaspe dorado"],
        avoid: ["Plata", "Platino", "Oro blanco", "Diamantes fríos"],
      },
      hair: {
        desc: "El cabello cálido y dorado es tu arma secreta — crea un halo de luz alrededor de tu rostro que ningún filtro puede replicar.",
        blonde: ["Rubio dorado", "Rubio miel", "Rubio caramelo", "Rubio mantequilla"],
        brown: ["Chocolate cálido", "Caramelo", "Mocha cálido", "Castaño cobrizo"],
        red: ["Pelirrojo natural", "Cobrizo", "Auburn", "Paprika"],
        avoid: "Evita los tonos cenizos, plata y negro azulado — pelean con tu calidez y pueden hacer que tu piel se vea apagada o verdosa.",
      },
      clothing: {
        desc: "Viste en el universo de la tierra y el sol. Los tonos que recuerdan otoño te favorecen casi todos — disfruta esa libertad.",
        favor: [
          { hex: "#B8553A", name: "Terracota" },
          { hex: "#D4A017", name: "Mostaza" },
          { hex: "#DAA520", name: "Oro" },
          { hex: "#708238", name: "Verde oliva" },
          { hex: "#FFCBA4", name: "Durazno" },
          { hex: "#FFFFF0", name: "Marfil" },
          { hex: "#CC5500", name: "Naranja quemado" },
          { hex: "#8B4513", name: "Marrón cálido" },
        ],
        avoid: [
          { hex: "#F8C8D9", name: "Rosa frío" },
          { hex: "#6E7B8B", name: "Gris azulado" },
          { hex: "#FFFFFF", name: "Blanco puro" },
          { hex: "#FF00FF", name: "Magenta brillante" },
        ],
      },
      glasses: {
        desc: "Los marcos en tortuga cálida, dorado, oro mate, marrón ámbar y terracota armonizan perfectamente con tu subtono — son como si fueran hechos para ti.",
      },
    },
  },
  neutro: {
    title: "Subtono Neutro",
    desc: "Tu piel tiene un equilibrio entre tonos cálidos y fríos. ¡Casi todo te queda bien!",
    colors: [
      { hex: "#B5838D", name: "Rosa palo" },
      { hex: "#6D6875", name: "Lila gris" },
      { hex: "#FFCDB2", name: "Beige champagne" },
      { hex: "#E5989B", name: "Rosa durazno" },
      { hex: "#7C9885", name: "Verde salvia" },
      { hex: "#D4A373", name: "Arena dorada" },
    ],
    tips: "Puedes usar colores cálidos y fríos. Los tonos suaves y medios son especialmente favorecedores. Nude rosado y malva son tus básicos.",
    recommendations: {
      blush: {
        desc: "Tienes el privilegio de usar el espectro medio: rosa palo, durazno suave y mauve neutro te sientan igual de bien. El nude rosado es tu comodín perfecto.",
        swatches: [
          { hex: "#D4A0A8", name: "Rosa palo" },
          { hex: "#E8B090", name: "Durazno suave" },
          { hex: "#B08898", name: "Mauve neutro" },
          { hex: "#E0B0B8", name: "Nude rosado" },
        ],
      },
      eyeshadow: {
        desc: "Los taupe, beige rosado y dorado rosado son tus neutros de referencia. Puedes ir hacia lo frío o lo cálido según tu outfit — ambos funcionan.",
        swatches: [
          { hex: "#A89880", name: "Taupe" },
          { hex: "#D4B8B0", name: "Beige rosado" },
          { hex: "#C4A080", name: "Marrón medio" },
          { hex: "#D4A898", name: "Dorado rosado" },
          { hex: "#A88898", name: "Mauve neutro" },
        ],
      },
      lipstick: {
        desc: "El mauve y el nude rosado son tus colores de cabecera — nunca fallan. Para ocasiones especiales, un rojo equilibrado o berry suave lucen perfectos en ti.",
        swatches: [
          { hex: "#C4849A", name: "Nude rosado" },
          { hex: "#9B6878", name: "Mauve" },
          { hex: "#B83040", name: "Rojo equilibrado" },
          { hex: "#8B5068", name: "Berry suave" },
          { hex: "#8B6060", name: "Pink-brown" },
        ],
      },
      jewelry: {
        desc: "Eres la única que puede mezclar metales con gracia — el oro rosa es tu pieza estrella porque une lo mejor de ambos mundos.",
        favor: ["Oro rosa", "Oro amarillo", "Plata satinada", "Perlas", "Gemas pasteles", "Cuarzo rosa", "Ópalo", "Granate suave"],
        avoid: ["Excesos de un solo metal — la variedad es tu superpoder"],
      },
      hair: {
        desc: "Tu zona de confort está en los tonos equilibrados: ni demasiado fríos ni demasiado cálidos. Los balayages te sientan de maravilla porque combinan ambos mundos.",
        blonde: ["Rubio beige", "Rubio sandy", "Rubio neutro", "Rubio nude"],
        brown: ["Castaño medio", "Balayage equilibrado", "Chocolate neutro"],
        red: ["Rojo borgoña", "Vino balanceado"],
        avoid: "Evita los extremos: ni platino helado ni cobrizo intenso — los tonos polarizados crean desarmonía con tu subtono equilibrado.",
      },
      clothing: {
        desc: "Tu paleta es la más versátil de las tres — vive en los tonos medios y suaves, y cuando quieras dramatismo, casi cualquier color funciona con moderación.",
        favor: [
          { hex: "#F4C2C2", name: "Rosa palo" },
          { hex: "#B0C4DE", name: "Azul polvo" },
          { hex: "#FFFDD0", name: "Blanco crema" },
          { hex: "#808080", name: "Gris medio" },
          { hex: "#9CAF88", name: "Verde salvia" },
          { hex: "#8C7B6B", name: "Taupe" },
          { hex: "#A88896", name: "Mauve" },
          { hex: "#F5E6CC", name: "Beige champagne" },
        ],
        avoid: [
          { hex: "#FFFF00", name: "Neones" },
          { hex: "#FF8C00", name: "Naranja saturado" },
          { hex: "#FF00FF", name: "Magenta brillante" },
        ],
      },
      glasses: {
        desc: "Oro rosa, plata satinada, tortuga balanceada y marcos en tonos mauve son tus opciones más favorecedoras — todos complementan tu equilibrio natural.",
      },
    },
  },
};

// ═══════════════════════════════════════════════
// TEST DE PIEL — SISTEMA BAUMANN (age-adaptive)
//
// Cada pregunta mide UN eje del Baumann Skin Type Indicator (Dra. Leslie
// Baumann, 2008): hidratación (O/D), sensibilidad (S/R), pigmentación (P/N)
// y firmeza (W/T — solo para 26+, NUNCA mostrada a menores).
// La lógica de puntuación vive en src/utils/baumann.js (computeBaumannCode).
// Las 2 últimas preguntas son multi-select de PREFERENCIAS de producto y no
// tienen `axis` — se ignoran al calcular el código Baumann.
// ═══════════════════════════════════════════════
export const SKIN_QUESTIONS = [
  // ── Hidratación: O (grasa) vs D (seca) ──
  {
    question: "A media tarde, ¿cómo está tu piel en la zona T (frente, nariz y barbilla)?",
    hint: "Tócate suavemente sin lavarte antes — es la prueba más simple de hidratación.",
    axis: "hydration",
    options: [
      { text: "Brillante, como si tuviera una capa de aceite", value: "O" },
      { text: "Con puntos negros o poros muy abiertos", value: "O" },
      { text: "Tirante, áspera o con líneas de resequedad", value: "D" },
      { text: "Apagada, sin nada de brillo, algo escamosa", value: "D" },
    ],
  },
  {
    question: "Al despertar, antes de lavarte la cara, ¿cómo se siente tu piel?",
    hint: "Igual que con el test de venas de colorimetría: obsérvate sin productos encima.",
    axis: "hydration",
    options: [
      { text: "Grasosa o brillante, como si necesitara lavado ya", value: "O" },
      { text: "Los poros se notan bien abiertos, sobre todo en la nariz", value: "O" },
      { text: "Tirante, como si se fuera a agrietar al sonreír", value: "D" },
      { text: "Suave pero sin ningún brillo, casi como papel", value: "D" },
    ],
  },
  // ── Sensibilidad: S (sensible) vs R (resistente) ──
  {
    question: "Cuando pruebas un producto nuevo (crema, protector solar, maquillaje), ¿qué suele pasar?",
    axis: "sensitivity",
    options: [
      { text: "Se enrojece o arde casi de inmediato", value: "S" },
      { text: "A veces reacciona, depende del ingrediente", value: "S" },
      { text: "Rara vez reacciona, tolera casi todo", value: "R" },
      { text: "Nunca ha tenido una reacción que yo note", value: "R" },
    ],
  },
  {
    question: "¿Cómo reacciona tu piel al sol, al viento frío o a cambios bruscos de clima?",
    hint: "Piensa en la última vez que estuviste mucho tiempo afuera sin protección.",
    axis: "sensitivity",
    options: [
      { text: "Se enrojece o siente ardor con facilidad", value: "S" },
      { text: "Se irrita o se pone roja en parches", value: "S" },
      { text: "No cambia mucho, se adapta sin drama", value: "R" },
      { text: "Se broncea o se adapta sin molestias", value: "R" },
    ],
  },
  // ── Pigmentación: P (pigmentada) vs N (no pigmentada) ──
  {
    question: "Cuando te sale un grano o una lastimadura pequeña, ¿qué pasa después de que sana?",
    axis: "pigmentation",
    options: [
      { text: "Queda una mancha oscura que tarda semanas en irse", value: "P" },
      { text: "Se nota una marca café por un tiempo", value: "P" },
      { text: "El tono vuelve a verse parejo casi enseguida", value: "N" },
      { text: "No suele dejar marca visible", value: "N" },
    ],
  },
  {
    question: "Después de estar al sol sin protector, ¿tu piel...?",
    hint: "Como la prueba de bronceado del test de colores, pero pensando en manchas, no en subtono.",
    axis: "pigmentation",
    options: [
      { text: "Le salen manchas o pecas nuevas con facilidad", value: "P" },
      { text: "Se le oscurecen zonas de forma desigual", value: "P" },
      { text: "Se broncea o enrojece de forma uniforme, sin manchas", value: "N" },
      { text: "Vuelve a su tono normal sin dejar marcas", value: "N" },
    ],
  },
  // ── Firmeza: W (arrugas) vs T (tersa) — SOLO se muestra a 26+ ──
  {
    question: "Cuando sonríes o gesticulas, ¿qué notas en tu piel?",
    axis: "firmness",
    options: [
      { text: "Se quedan líneas finas marcadas incluso al relajar el gesto", value: "W" },
      { text: "Noto arruguitas alrededor de ojos o boca", value: "W" },
      { text: "La piel vuelve a su lugar lisa, sin marcas", value: "T" },
      { text: "Se siente firme y elástica al tacto", value: "T" },
    ],
  },
  {
    question: "En el último tiempo, ¿cómo sientes la firmeza general de tu piel?",
    axis: "firmness",
    options: [
      { text: "Ha perdido un poco de rebote, se siente más flácida", value: "W" },
      { text: "Noto líneas de expresión más marcadas que antes", value: "W" },
      { text: "Se mantiene tersa y firme como siempre", value: "T" },
      { text: "No noto pérdida de firmeza", value: "T" },
    ],
  },
  {
    question: "¿Qué tipos de productos prefieres? Puedes elegir varios.",
    hint: "Esto nos ayuda a sugerirte rutinas que se ajusten a tus valores y estilo.",
    multi: true,
    category: "likes",
    options: [
      { text: "🌿 Naturales u orgánicos", value: "natural" },
      { text: "💊 De farmacia o dermo-cosméticos", value: "pharmacy" },
      { text: "✨ K-beauty (coreanos)", value: "k_beauty" },
      { text: "🐰 Cruelty-free (sin testeo animal)", value: "cruelty_free" },
      { text: "🌱 Veganos", value: "vegan" },
      { text: "⚗️ Con ingredientes activos potentes", value: "potent" },
      { text: "🌸 Suaves y minimalistas", value: "minimal" },
      { text: "💰 Económicos y accesibles", value: "affordable" },
      { text: "👩‍⚕️ Recomendados por dermatólogo", value: "derm_approved" },
    ],
  },
  {
    question: "¿Hay algo que prefieras evitar?",
    hint: "Puedes elegir varios, o seguir sin seleccionar si no tienes preferencia.",
    multi: true,
    optional: true,
    category: "avoid",
    options: [
      { text: "🌺 Fragancias o perfumes", value: "fragrance" },
      { text: "🍷 Alcohol", value: "alcohol" },
      { text: "🧪 Parabenos y sulfatos", value: "parabens_sulfates" },
      { text: "🐭 Testeo en animales", value: "animal_tested" },
      { text: "⚠️ Químicos agresivos", value: "harsh_chemicals" },
      { text: "💧 Texturas aceitosas", value: "oily_texture" },
      { text: "🔬 Activos fuertes (retinol, ácidos)", value: "strong_actives" },
      { text: "🧬 Ingredientes sintéticos", value: "synthetic" },
    ],
  },
];

export const SKIN_RESULTS = {
  seca: {
    title: "Piel Seca", icon: "💧",
    desc: "Tu piel tiende a perder hidratación rápidamente.",
    tips: ["Limpiadores suaves sin sulfatos", "Sérum de ácido hialurónico sobre piel húmeda", "Hidratante rica en ceramidas mañana y noche", "SPF 50 diario (fórmulas cremosas)"],
    vitamins: ["Vitamina E — Antioxidante y reparadora", "Omega 3 — Fortalece barrera cutánea", "Vitamina D — Regeneración celular"],
    girlTip: "Aplica tu sérum de ácido hialurónico sobre piel HÚMEDA, nunca seca — el agua atrapada bajo el sérum multiplica la hidratación. Es el truco silencioso de las dermatólogas coreanas.",
    goodHabits: [
      "Hidrata dentro de los primeros 60 segundos después de lavarte la cara",
      "Usa humidificador en tu cuarto, sobre todo en invierno",
      "Cierra tu rutina nocturna con una crema rica o un aceite facial",
      "Bebe al menos 2 litros de agua al día",
      "Lávate la cara con agua tibia (nunca caliente)",
    ],
    badHabits: [
      "Bañarte con agua muy caliente — destruye tu barrera",
      "Exfoliar más de 1 vez por semana",
      "Usar limpiadores con sulfatos o jabón corporal en la cara",
      "Saltarte el SPF pensando que la piel seca no se daña",
      "Aplicar la crema sobre piel completamente seca — ya perdiste el agua",
    ],
  },
  grasa: {
    title: "Piel Grasa", icon: "✨",
    desc: "Tu piel produce más sebo del necesario.",
    tips: ["Limpiador con ácido salicílico (BHA)", "Tónico con niacinamida para controlar brillo", "Hidratante gel oil-free", "SPF 50 matificante"],
    vitamins: ["Zinc — Regula producción de sebo", "Vitamina A (Retinol) — Renueva la piel", "Niacinamida (B3) — Minimiza poros"],
    girlTip: "Tu piel grasa tiene una ventaja oculta: envejece más lento que cualquier otro tipo. Tu sebo natural te protege de arrugas. No la odies — regúlala con niacinamida, no la elimines con alcohol.",
    goodHabits: [
      "Limpia 2 veces al día (mañana y noche, ni una más)",
      "Hidrata SIEMPRE, aunque sientas que no lo necesitas",
      "Incorpora niacinamida — es tu mejor aliada para regular el sebo",
      "Lava las fundas de almohada cada 3-4 días",
      "Usa papel matificante en vez de polvos a media tarde",
    ],
    badHabits: [
      "Lavar la cara más de 2 veces al día — provoca rebote de sebo",
      "Usar productos con alcohol para 'secar' la piel",
      "Tocarte la cara constantemente",
      "Apretar espinillas o puntos negros con los dedos",
      "Saltarte la hidratación pensando 'ya tengo grasa suficiente'",
    ],
  },
  mixta: {
    title: "Piel Mixta", icon: "🌿",
    desc: "Tu zona T es más grasa mientras tus mejillas tienden a secarse.",
    tips: ["Limpiador suave de pH balanceado", "Sérum de niacinamida en zona T", "Hidratante ligera para todo el rostro", "SPF 50 de textura fluida"],
    vitamins: ["Niacinamida (B3) — Equilibra la piel", "Vitamina C — Luminosidad pareja", "Probióticos — Microbioma saludable"],
    girlTip: "El secreto está en aplicar productos DIFERENTES en cada zona: tu zona T quiere niacinamida y gel ligero, tus mejillas quieren crema rica. Tratar todo el rostro igual es la trampa más común con piel mixta.",
    goodHabits: [
      "Aplica niacinamida o BHA solo en zona T (no en mejillas)",
      "Usa hidratante ligera en mejillas y gel-cream en zona T",
      "Limpia con productos pH balanceados (5.5)",
      "Exfolia con BHA 1-2 veces por semana, solo donde brilla",
      "Hidrata todo el rostro siempre — ambas zonas necesitan agua",
    ],
    badHabits: [
      "Tratar toda la cara como si fuera piel grasa (las mejillas pagan)",
      "Usar productos agresivos solo para 'secar' la zona T",
      "Saltarte la hidratación en mejillas",
      "Cambiar de productos cada semana buscando el milagro único",
      "Usar mascarillas potentes en toda la cara — usa multi-mask",
    ],
  },
  normal: {
    title: "Piel Normal", icon: "🌸",
    desc: "¡Tu piel está en equilibrio natural!",
    tips: ["Limpiador suave diario", "Sérum antioxidante (Vitamina C)", "Hidratante ligera", "SPF 50 diario"],
    vitamins: ["Vitamina C — Mantiene luminosidad", "Vitamina E — Protección antioxidante", "Colágeno — Previene envejecimiento"],
    girlTip: "Eres parte del 5% afortunado. Tu trabajo no es transformar tu piel — es PRESERVARLA. Empieza por prevención: SPF estricto + antioxidantes desde joven. Tu piel a los 40 te lo agradecerá.",
    goodHabits: [
      "SPF 50 todos los días, sin excepción (incluso lluvia o nublado)",
      "Vitamina C en la mañana para protección antioxidante",
      "Mantén una rutina simple y constante",
      "Duerme 7-8 horas — la piel se regenera en sueño profundo",
      "Hidrátate por dentro: agua > productos caros",
    ],
    badHabits: [
      "Probar productos nuevos sin necesidad — pierdes el equilibrio",
      "Asumir que no necesitas SPF porque no tienes problemas visibles",
      "Saltarte el cuidado de noche pensando que tu piel se cuida sola",
      "Empezar con activos fuertes (retinol) muy joven sin necesidad",
      "Imitar rutinas de 10 pasos cuando tu piel solo necesita 3",
    ],
  },
  sensible: {
    title: "Piel Sensible", icon: "🩹",
    desc: "Tu piel reacciona con facilidad a estímulos externos.",
    tips: ["Limpiador micelar sin fragancia", "Sérum calmante con centella asiática", "Hidratante con avena coloidal", "SPF mineral (óxido de zinc)"],
    vitamins: ["Vitamina B5 — Calmante y reparadora", "Aloe Vera — Antiinflamatorio natural", "Omega 6 — Refuerza la barrera"],
    girlTip: "Tu súperpoder es el minimalismo. Menos productos = menos riesgo. Una rutina de 3 pasos puede darte mejores resultados que una de 10. Tu piel se agradece cada producto que NO le aplicas.",
    goodHabits: [
      "Haz parche-test (detrás de la oreja, 48h) antes de cualquier producto nuevo",
      "Mantén rutina mínima: limpiar, hidratar, proteger",
      "Busca ingredientes calmantes: avena coloidal, centella asiática, pantenol",
      "Usa SPF mineral (zinc, titanio) — los químicos pueden irritar",
      "Lleva una lista de ingredientes que te irritan",
    ],
    badHabits: [
      "Cambiar productos frecuentemente — cada cambio es un riesgo",
      "Usar tratamientos con fragancia o alcohol",
      "Exfoliar (mecánico o químico fuerte) — el rojo viene rápido",
      "Mezclar muchos activos a la vez (vit C + retinol + AHA es too much)",
      "Tocar tu cara con manos sucias o usar pinceles compartidos",
    ],
  },
};

// ═══════════════════════════════════════════════
// BAUMANN AXES — contenido por polo, fundamentado en skincare.json
//
// Sistema Baumann (Dra. Leslie Baumann, 2008 — topic "skin_baumann_16_types"):
// 4 ejes binarios independientes. El eje `firmness` SOLO se muestra a
// usuarias de 26+ (ver SkinTestScreen.jsx) — nunca se le sugiere a una
// adolescente. El resto de los ejes son válidos para cualquier edad, y su
// contenido respeta el guardrail AAD: nada de retinol / vitamina C
// concentrada / AHA fuertes como rutina "antiedad" fuera del eje firmness.
// ═══════════════════════════════════════════════
const _skincareTopics = getTopicsByDomain('skincare');
function _skinTopic(id) {
  return _skincareTopics.find((t) => t.id === id) || null;
}
function _sourceTitles(ids) {
  return ids.map((id) => _skinTopic(id)?.title).filter(Boolean);
}

export const BAUMANN_AXES = {
  hydration: {
    O: {
      label: "Grasa", letter: "O", icon: "✨",
      desc: "Tu piel produce sebo de más, sobre todo en frente, nariz y barbilla (zona T). No es 'piel mala' — según la dermatología, la piel grasa solo necesita regularse, nunca secarse a la fuerza.",
      routine: [
        "Limpiador suave 2 veces al día — lavar más solo provoca rebote de grasa",
        "Niacinamida (2-5%) para regular el sebo y afinar poros sin resecar",
        "Si tienes comedones, ácido salicílico (BHA) 0.5-2%, 2-3 veces por semana",
        "Hidratante en gel oil-free — saltarte esto empeora la grasa",
        "SPF 30-50 en fórmula matificante o en gel",
      ],
      tips: [
        "El sebo también protege: la piel grasa suele mostrar arrugas más tarde que otros tipos.",
        "El alcohol y los productos que prometen 'secar' dan efecto rebote — tu piel produce aún más grasa para compensar.",
        "Lava las fundas de almohada cada 3-4 días: acumulan grasa y bacterias.",
      ],
      girlTip: "Tu piel grasa tiene una ventaja oculta: envejece más lento que casi cualquier otro tipo. No la castigues con alcohol — regúlala con niacinamida.",
      goodHabits: [
        "Hidrata siempre, aunque sientas que 'ya tienes grasa suficiente'",
        "Incorpora niacinamida — es tu aliada número uno para el sebo",
        "Usa papel matificante en vez de retocar con más polvo",
        "Cambia de funda de almohada cada pocos días",
      ],
      badHabits: [
        "Lavar la cara más de 2 veces al día",
        "Usar productos con alcohol para 'secar' la piel",
        "Apretar espinillas o puntos negros con los dedos",
        "Saltarte la hidratación pensando que no la necesitas",
      ],
      sourceTopicIds: ["skin_classification_basic", "skin_active_niacinamide", "skin_active_salicylic_bha"],
      get sources() { return _sourceTitles(this.sourceTopicIds); },
    },
    D: {
      label: "Seca", letter: "D", icon: "💧",
      desc: "Tu piel produce poco sebo y retiene poca agua: tirantez, opacidad y descamación fina son tus señales típicas. La clave está en reforzar tu barrera, no solo en 'poner más crema'.",
      routine: [
        "Limpiador cremoso sin sulfatos — nunca jabón corporal en la cara",
        "Sérum de ácido hialurónico sobre piel húmeda, para atrapar agua",
        "Hidratante rica en ceramidas mañana y noche",
        "SPF 30-50 en fórmula cremosa o con emolientes",
      ],
      tips: [
        "Aplica tu sérum de ácido hialurónico sobre piel HÚMEDA, nunca seca — el agua atrapada bajo el sérum multiplica la hidratación.",
        "Las ceramidas son el 'cemento' de tu barrera cutánea — sin ellas, cualquier crema se queda corta.",
        "El agua muy caliente disuelve tus lípidos naturales — lávate con agua tibia.",
      ],
      girlTip: "Aplica tu hidratante dentro del primer minuto después de lavarte — es cuando tu piel todavía tiene agua que puedes 'sellar' en vez de dejar que se evapore.",
      goodHabits: [
        "Hidrata dentro de los primeros 60 segundos después de lavarte la cara",
        "Usa humidificador en tu cuarto, sobre todo en época de frío o calefacción",
        "Cierra tu rutina nocturna con crema rica o un aceite facial",
        "Lávate la cara con agua tibia, nunca caliente",
      ],
      badHabits: [
        "Bañarte con agua muy caliente — destruye tu barrera",
        "Exfoliar más de 1 vez por semana",
        "Usar limpiadores con sulfatos o jabón corporal en la cara",
        "Aplicar la crema sobre piel ya completamente seca",
      ],
      sourceTopicIds: ["skin_classification_basic", "skin_active_ceramides", "skin_active_hyaluronic_acid"],
      get sources() { return _sourceTitles(this.sourceTopicIds); },
    },
  },
  sensitivity: {
    S: {
      label: "Sensible", letter: "S", icon: "🩹",
      desc: "Tu piel reacciona con facilidad: ardor, picazón o enrojecimiento ante productos nuevos, sol o cambios de clima. Tu súperpoder es el minimalismo — menos productos, menos riesgo.",
      routine: [
        "Haz un parche de prueba (detrás de la oreja, 48h) antes de cualquier producto nuevo",
        "Rutina mínima: limpiar, hidratar, proteger — nada más por ahora",
        "Busca ingredientes calmantes: avena coloidal, centella asiática, pantenol",
        "SPF mineral (óxido de zinc / dióxido de titanio) — suele irritar menos que el químico",
      ],
      tips: [
        "Introduce un producto nuevo a la vez y espera 1-2 semanas antes de sumar otro.",
        "Evita fragancia, alcohol y exfoliantes mecánicos — son los gatillos más comunes.",
        "Enrojecimiento persistente con vasitos visibles o ardor sin causa clara: coméntalo con un dermatólogo, no todo es 'piel sensible' cosmética.",
      ],
      girlTip: "Tu súperpoder es el minimalismo. Una rutina de 3 pasos bien elegida te da mejores resultados que una de 10 — tu piel te lo agradece con cada producto que NO le aplicas.",
      goodHabits: [
        "Lleva una lista de ingredientes que te han irritado antes",
        "Mantén rutina mínima y constante",
        "Usa SPF mineral en vez de químico si notas ardor",
        "Cambia tus productos de forma gradual, nunca todos a la vez",
      ],
      badHabits: [
        "Cambiar de productos muy seguido — cada cambio es un riesgo nuevo",
        "Usar tratamientos con fragancia o alcohol",
        "Exfoliar mecánico o con ácidos fuertes",
        "Mezclar muchos activos a la vez",
      ],
      sourceTopicIds: ["skin_sensitive_skin", "skin_overexfoliation", "skin_rosacea_young"],
      get sources() { return _sourceTitles(this.sourceTopicIds); },
    },
    R: {
      label: "Resistente", letter: "R", icon: "🛡️",
      desc: "Tu piel tolera bien productos nuevos, sol y cambios de clima sin reaccionar fácilmente. Es una ventaja real, pero no un pase libre para saltarte lo básico.",
      routine: [
        "Aprovecha para incorporar activos con buena evidencia (niacinamida, ácido hialurónico) sin tanto miedo a irritarte",
        "Aun así, introduce productos nuevos de uno en uno para detectar el que sí te cae mal",
        "SPF diario — la resistencia a la irritación no es protección contra el sol",
        "No te saltes la hidratación solo porque 'todo te cae bien'",
      ],
      tips: [
        "Ser resistente no significa piel invulnerable para siempre — sigue dándole a tu piel lo esencial.",
        "Aprovecha tu tolerancia para ser constante con la rutina, no para acumular productos sin sentido.",
      ],
      girlTip: "Tu piel resistente es un privilegio real, pero la barrera cutánea se cansa si abusas de activos sin necesidad. Lo básico y constante sigue ganando, incluso para ti.",
      goodHabits: [
        "Mantén limpiador, hidratante y SPF como base innegociable",
        "Introduce activos nuevos de forma gradual igual que cualquier otra piel",
        "Aprovecha tu tolerancia para ser constante, no para acumular productos",
      ],
      badHabits: [
        "Saltarte el SPF pensando que 'tu piel aguanta todo'",
        "Combinar muchos activos fuertes solo porque no te irritan de inmediato",
        "Descuidar la hidratación por sentir que no la necesitas",
      ],
      sourceTopicIds: ["skin_classification_basic", "skin_double_cleansing"],
      get sources() { return _sourceTitles(this.sourceTopicIds); },
    },
  },
  pigmentation: {
    P: {
      label: "Pigmentada", letter: "P", icon: "🌗",
      desc: "Tu piel tiende a dejar marcas oscuras después de un grano, una lastimadura o el sol — se llama hiperpigmentación postinflamatoria (PIH), es muy común y nada de qué avergonzarse.",
      routine: [
        "SPF 50 de amplio espectro todos los días — sin esto, ningún tratamiento de manchas funciona",
        "Niacinamida para ayudar a emparejar el tono con el tiempo",
        "Ácido azelaico si tu piel lo tolera — actúa en manchas y en acné a la vez",
        "Evita reventar granos: cada lastimadura nueva es una mancha futura",
      ],
      tips: [
        "Las manchas oscuras pueden tardar meses en aclarar incluso haciendo todo bien — la paciencia es parte del tratamiento.",
        "Evita 'recetas caseras' con limón o vinagre para las manchas: pueden quemar la piel y empeorarlas.",
      ],
      girlTip: "El SPF diario no es opcional para ti: es literalmente el tratamiento de manchas más efectivo que existe, y es gratis comparado con cualquier sérum.",
      goodHabits: [
        "SPF 50 todos los días, incluso en interiores con ventana o pantalla",
        "Deja que el acné sane solo — no lo aprietes ni lo rasques",
        "Sé constante: el resultado en manchas se ve en meses, no en días",
      ],
      badHabits: [
        "Saltarte el SPF por no ver el sol directo",
        "Reventar granos o lastimaduras",
        "Usar remedios caseros abrasivos (limón, bicarbonato) sobre las manchas",
      ],
      sourceTopicIds: ["skin_pih_dark_marks", "skin_active_azelaic_acid", "skin_sunscreen_essentials", "skin_fitzpatrick_phototypes"],
      get sources() { return _sourceTitles(this.sourceTopicIds); },
    },
    N: {
      label: "No pigmentada", letter: "N", icon: "🌕",
      desc: "Tu piel vuelve a su tono parejo después de una espinilla o el sol, sin dejar marcas con facilidad. Aun así, la protección solar sigue siendo no negociable para cualquier tipo de piel.",
      routine: [
        "SPF 30-50 diario, incluso en días nublados",
        "Antioxidantes suaves si quieres mantener luminosidad a futuro",
        "No necesitas productos despigmentantes — tu enfoque es prevención, no corrección",
      ],
      tips: [
        "Que no te salgan manchas ahora no te hace inmune al daño solar acumulado — el SPF sigue siendo tu mejor inversión.",
        "Aprovecha que tu piel no marca fácil para no tener miedo de tratar el acné a tiempo.",
      ],
      girlTip: "No dejar marcas fácil es una ventaja real, pero no te confíes: el daño solar se acumula igual, aunque no se note todavía.",
      goodHabits: [
        "Mantén el SPF diario aunque tu piel 'no muestre' el daño solar",
        "Aprovecha para tratar el acné a tiempo sin miedo a que deje marca",
      ],
      badHabits: [
        "Saltarte el SPF por pensar que 'tu piel no mancha'",
        "Confundir 'no deja marca' con 'no necesita cuidado'",
      ],
      sourceTopicIds: ["skin_sunscreen_essentials", "skin_classification_basic"],
      get sources() { return _sourceTitles(this.sourceTopicIds); },
    },
  },
  firmness: {
    // Solo se muestra a usuarias de 26+ — ver includeFirmness en SkinTestScreen.jsx.
    W: {
      label: "Con líneas de expresión", letter: "W", icon: "〰️",
      desc: "Empiezas a notar líneas de expresión que se quedan marcadas o una piel con menos rebote. A partir de tu edad, la prevención activa hace una diferencia real y medible.",
      routine: [
        "Retinoide (retinol, o tretinoína con receta) de noche, empezando gradual: 1-2 veces por semana y subiendo según tolerancia",
        "Vitamina C en la mañana como antioxidante y para estimular colágeno",
        "Ácido hialurónico para dar volumen y rebote inmediato",
        "SPF 30-50 diario — es el 'antiarrugas' más efectivo que existe",
        "Hidratación rica y constante, sobre todo si tu piel también es seca",
      ],
      tips: [
        "El retinol puede irritar al inicio — sube la frecuencia poco a poco, no lo apliques a diario desde el primer día.",
        "El SPF diario previene más arrugas nuevas que cualquier crema, por cara que sea.",
      ],
      girlTip: "A esta edad, la piel responde muy bien a la constancia: retinoide + antioxidante + SPF, sostenidos por meses, hacen más que cualquier producto milagro.",
      goodHabits: [
        "Introduce el retinoide gradualmente y de noche",
        "Usa antioxidante (vitamina C) en la mañana, bajo el SPF",
        "Sé constante — los resultados de firmeza se ven en 8-12 semanas, no en días",
      ],
      badHabits: [
        "Empezar el retinoide todos los días desde el inicio",
        "Combinar retinoide y ácidos exfoliantes la misma noche",
        "Saltarte el SPF mientras usas activos que dan fotosensibilidad",
      ],
      sourceTopicIds: ["skin_active_retinoids", "skin_active_vitamin_c", "skin_active_hyaluronic_acid", "skin_sunscreen_essentials"],
      get sources() { return _sourceTitles(this.sourceTopicIds); },
    },
    T: {
      label: "Tersa", letter: "T", icon: "🌸",
      desc: "Tu piel se mantiene firme y elástica todavía. A tu edad, el trabajo inteligente es mantenimiento y prevención, no reparación.",
      routine: [
        "SPF diario estricto — es tu mejor inversión de largo plazo",
        "Antioxidante (vitamina C) en la mañana para proteger el colágeno que ya tienes",
        "Puedes incorporar un retinoide suave 1-2 veces por semana como prevención, sin prisa",
        "Hidratación constante para sostener la elasticidad",
      ],
      tips: [
        "Prevenir cuesta mucho menos esfuerzo que corregir — este es el mejor momento para empezar hábitos que sostengas por años.",
        "No necesitas una rutina de 10 pasos: SPF + antioxidante + hidratación cubren la mayor parte del trabajo.",
      ],
      girlTip: "Estás en el momento ideal para prevenir sin necesidad de corregir nada todavía. SPF constante ahora vale más que cualquier tratamiento después.",
      goodHabits: [
        "SPF todos los días, sin excepción",
        "Vitamina C en la mañana para proteger el colágeno existente",
        "Empieza un retinoide suave de forma preventiva si quieres adelantarte",
      ],
      badHabits: [
        "Asumir que 'no lo necesitas todavía' y saltarte el SPF",
        "Esperar a ver arrugas para empezar a cuidarte",
      ],
      sourceTopicIds: ["skin_sunscreen_essentials", "skin_active_vitamin_c", "skin_active_hyaluronic_acid"],
      get sources() { return _sourceTitles(this.sourceTopicIds); },
    },
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
