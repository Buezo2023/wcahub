-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub LMS — Contenido VA (5 módulos × 5 actividades)
-- Ejecutar DESPUÉS de lms-schema.sql
-- ═══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  u1 uuid; u2 uuid; u3 uuid; u4 uuid; u5 uuid;
BEGIN

-- ── Insertar unidades VA ─────────────────────────────────────────
INSERT INTO public.units (program_id, level, unit_number, title, topic, published)
VALUES
  ('va', 'A1',  1, 'Fundamentos del Asistente Virtual',           'Rol, ética y entorno del VA',              true),
  ('va', 'A1',  2, 'Competencias Digitales y Productividad',      'Google Workspace, Trello, Asana, Notion',  true),
  ('va', 'A1',  3, 'Soporte Administrativo y Atención al Cliente','Comunicación bilingüe y protocolos',       true),
  ('va', 'A1',  4, 'Marketing Digital y Redes Sociales',          'Canva, contenido, métricas y estrategia',  true),
  ('va', 'A1',  5, 'Marca Personal, Trabajo Remoto y Emprendimiento', 'LinkedIn, CV, pitch y freelance',      true)
ON CONFLICT (program_id, level, unit_number) DO UPDATE SET title = EXCLUDED.title, published = true;

SELECT id INTO u1 FROM public.units WHERE program_id='va' AND unit_number=1;
SELECT id INTO u2 FROM public.units WHERE program_id='va' AND unit_number=2;
SELECT id INTO u3 FROM public.units WHERE program_id='va' AND unit_number=3;
SELECT id INTO u4 FROM public.units WHERE program_id='va' AND unit_number=4;
SELECT id INTO u5 FROM public.units WHERE program_id='va' AND unit_number=5;

-- ════════════════════════════════════════════════════════════════
-- MÓDULO 1 — Fundamentos del VA
-- ════════════════════════════════════════════════════════════════

-- 1.1 Video
INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u1,'video',1,'El mundo del Asistente Virtual',20,'{
  "youtube_id": "PLACEHOLDER_M1",
  "duration_min": 12,
  "description": "Descubrí qué es un VA, qué hace, cuánto gana y cómo es el día a día del trabajo remoto internacional.",
  "key_points": [
    "Un VA puede trabajar desde cualquier lugar del mundo",
    "Las habilidades más demandadas: comunicación, organización y tecnología",
    "Los VAs bilingües ganan entre $800–$2,500/mes como freelancers",
    "La ética digital y la puntualidad son el sello de un buen VA"
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- 1.2 Lesson
INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u1,'lesson',2,'¿Qué hace un Asistente Virtual?',15,'{
  "sections": [
    {
      "title": "Definición y perfil profesional",
      "content": "Un Asistente Virtual (VA) es un profesional independiente que brinda soporte administrativo, operativo y digital a empresas o emprendedores desde una ubicación remota. No es simplemente alguien que responde correos — es un estratega digital que libera el tiempo del cliente para que enfoque en lo que importa.",
      "highlight": "💡 Un VA profesional ahorra al cliente un promedio de 10 horas semanales."
    },
    {
      "title": "Funciones principales",
      "content": "Las tareas más comunes de un VA incluyen:\n• Gestión de agenda y calendario\n• Atención al cliente por email y chat\n• Administración de redes sociales\n• Entrada de datos y reportes\n• Coordinación de reuniones virtuales\n• Investigación y redacción de contenido",
      "highlight": "⭐ El VA que domina herramientas digitales Y habla inglés tiene acceso al mercado internacional (EEUU, Canadá, España, UK)."
    },
    {
      "title": "Ética digital y teletrabajo",
      "content": "Trabajar de forma remota requiere una disciplina especial:\n• Cumplir plazos sin supervisión directa\n• Comunicar proactivamente cualquier problema\n• Proteger la información confidencial del cliente\n• Mantener un entorno profesional en videollamadas\n• Usar contraseñas seguras y VPN cuando sea necesario",
      "highlight": "🔒 La confianza es tu activo más valioso. Un cliente no puede ver tu trabajo, pero sí puede medir tus resultados."
    },
    {
      "title": "Tu primer día como VA",
      "content": "Antes de comenzar con un nuevo cliente debés:\n1. Firmar un contrato de servicio o NDA (Non-Disclosure Agreement)\n2. Definir horarios de disponibilidad y canales de comunicación\n3. Acceder a las herramientas compartidas (Google Drive, Slack, etc.)\n4. Establecer métricas de éxito para los primeros 30 días",
      "highlight": "📋 Template gratuito: En recursos encontrás una plantilla de contrato básico de VA para usar con tus clientes."
    }
  ],
  "resources": [
    {"label": "📄 Plantilla contrato VA", "url": "#"},
    {"label": "📝 Lista de chequeo primer día", "url": "#"}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- 1.3 Matching
INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u1,'matching',3,'Herramientas esenciales del VA',25,'{
  "instructions": "Relacioná cada herramienta con su función principal. Arrastrá o seleccioná la opción correcta.",
  "pairs": [
    {"left": "Google Calendar", "right": "Gestionar la agenda y programar reuniones del cliente"},
    {"left": "Slack",           "right": "Comunicación interna del equipo en tiempo real"},
    {"left": "Zoom",            "right": "Videollamadas profesionales con clientes"},
    {"left": "LastPass",        "right": "Gestión segura de contraseñas compartidas"},
    {"left": "Loom",            "right": "Grabar videos explicativos sin reuniones en vivo"},
    {"left": "Toggl",           "right": "Registrar horas trabajadas para facturación"}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- 1.4 Roleplay
INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u1,'roleplay',4,'Primera reunión con un cliente',35,'{
  "scenario": "Es tu primera videollamada con un nuevo cliente potencial. Te escribió por Instagram interesado en contratar un VA para su tienda online. La reunión es por Zoom en 10 minutos.",
  "context": "El cliente se llama Carlos Méndez, tiene una tienda de ropa en línea con ventas en Honduras y EEUU. Necesita apoyo con atención al cliente, redes sociales y gestión de pedidos.",
  "steps": [
    {
      "situation": "Entrás a la sala de Zoom y ves que Carlos ya está esperando. ¿Cómo comenzás la reunión?",
      "options": [
        {"text": "Buenos días Carlos, ¿cómo estás? Gracias por tu tiempo hoy.", "correct": true,  "xp": 15, "feedback": "✅ Excelente. Saludar con calidez y agradecer el tiempo del cliente establece una buena primera impresión."},
        {"text": "Hola, ya estoy aquí. ¿Podemos empezar?",                      "correct": false, "xp": 0,  "feedback": "❌ Muy informal. En una reunión profesional debés usar un saludo formal y mostrar apreciación por el tiempo del cliente."},
        {"text": "Perdón por la demora, tuve problemas técnicos.",               "correct": false, "xp": 5,  "feedback": "⚠️ Empezar con una disculpa cuando no llegaste tarde debilita tu imagen. Comenzá con un saludo positivo."}
      ]
    },
    {
      "situation": "Carlos te pregunta: \"¿Cuál es tu experiencia como VA?\" Recién estás comenzando.",
      "options": [
        {"text": "Soy nueva en esto, no tengo experiencia todavía.",                                                              "correct": false, "xp": 0,  "feedback": "❌ Demasiado negativo. Todos empezamos sin experiencia — lo que importa son tus habilidades y disposición."},
        {"text": "Aunque es mi primera posición formal, tengo sólidas habilidades en organización, comunicación y herramientas digitales. Estoy comprometida a aprender rápido y entregar resultados.", "correct": true, "xp": 15, "feedback": "✅ Perfecto. Ser honesta sin minimizarte — enfocás en tus fortalezas y tu actitud profesional."},
        {"text": "He trabajado con varios clientes grandes internacionales.",                                                     "correct": false, "xp": 0,  "feedback": "❌ Nunca mentir a un cliente. La honestidad es la base de una relación profesional duradera."}
      ]
    },
    {
      "situation": "Al final Carlos dice que le interesás pero necesita que comenzés la próxima semana. Te pregunta tu tarifa. ¿Qué decís?",
      "options": [
        {"text": "Lo que usted pueda pagar está bien.",                                                                          "correct": false, "xp": 0,  "feedback": "❌ Nunca dejés que el cliente fije el precio. Esto comunica inseguridad y puede resultar en una tarifa muy baja."},
        {"text": "Mi tarifa es de $8 por hora. Incluye gestión de correos, redes y coordinación de pedidos. ¿Le parece que hablemos de un paquete de horas mensual?", "correct": true, "xp": 15, "feedback": "✅ Excelente. Presentás un precio concreto, explicás qué incluye y proponés un siguiente paso claro."},
        {"text": "Déjeme pensarlo y le escribo mañana.",                                                                         "correct": false, "xp": 5,  "feedback": "⚠️ Nunca retrasar una respuesta de precio si ya lo tenés decidido. El cliente puede perder interés o contratar a alguien más."}
      ]
    }
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- 1.5 Quiz
INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u1,'quiz',5,'Evaluación — Módulo 1',50,'{
  "pass_score": 70,
  "time_limit_min": 15,
  "questions": [
    {"q": "¿Cuál es la característica principal del trabajo de un VA?",
     "opts": ["Trabaja en una oficina física","Trabaja de forma remota y autónoma","Depende de un horario fijo de 9-5","Requiere presencia en el país del cliente"],
     "ans": 1, "explanation": "Un VA trabaja de forma remota, generalmente como freelancer, desde cualquier ubicación con internet."},
    {"q": "¿Qué es un NDA en el contexto del trabajo de VA?",
     "opts": ["Un tipo de contrato de renta","Un acuerdo de confidencialidad","Una herramienta de gestión de tareas","Un certificado de idiomas"],
     "ans": 1, "explanation": "NDA (Non-Disclosure Agreement) es un acuerdo legal para proteger la información confidencial del cliente."},
    {"q": "¿Cuál de estos comportamientos refleja ética profesional de un VA?",
     "opts": ["Compartir contraseñas del cliente con amigos","Llegar tarde a videollamadas sin avisar","Comunicar proactivamente cualquier retraso o problema","Revisar correos del cliente sin autorización"],
     "ans": 2, "explanation": "La comunicación proactiva es clave para la confianza — siempre avisá con anticipación sobre cualquier inconveniente."},
    {"q": "¿Qué herramienta usarías para registrar las horas trabajadas con un cliente?",
     "opts": ["Google Calendar","Canva","Toggl","Slack"],
     "ans": 2, "explanation": "Toggl y similares (Harvest, Clockify) son herramientas de time tracking para VAs que facturan por hora."},
    {"q": "Un VA bilingüe tiene ventaja porque:",
     "opts": ["Puede trabajar solo en Latinoamérica","Accede al mercado de clientes internacionales de habla inglesa","No necesita usar herramientas digitales","Puede cobrar menos que un VA monolingüe"],
     "ans": 1, "explanation": "El inglés abre el mercado de EEUU, Canadá, UK y Europa, donde las tarifas son significativamente más altas."},
    {"q": "¿Cuál es el primer paso antes de comenzar con un nuevo cliente?",
     "opts": ["Pedir acceso a todas sus redes sociales","Crear un perfil en LinkedIn","Firmar un contrato de servicios o NDA","Diseñar el logo del cliente"],
     "ans": 2, "explanation": "Un contrato protege tanto al VA como al cliente — define alcance, tarifa, plazos y confidencialidad."},
    {"q": "¿Qué respuesta es más profesional si un cliente pregunta tu experiencia y sos nueva?",
     "opts": ["Mentir sobre clientes anteriores","Decir que no tenés experiencia y disculparte","Enfocarte en tus habilidades y compromiso de aprender","Rechazar la pregunta"],
     "ans": 2, "explanation": "La honestidad combinada con confianza en tus habilidades es siempre más poderosa que mentir."},
    {"q": "¿Con qué frecuencia debe un VA comunicarse con su cliente?",
     "opts": ["Solo cuando hay un problema","Según lo acordado en el contrato, proactivamente","Una vez al mes","Solo por WhatsApp"],
     "ans": 1, "explanation": "La frecuencia de comunicación debe acordarse al inicio — lo importante es ser proactivo y consistente."},
    {"q": "¿Qué significa productividad en el contexto del VA?",
     "opts": ["Trabajar más horas que el cliente","Completar tareas de calidad en el menor tiempo posible","Usar muchas herramientas digitales","Tener muchos clientes al mismo tiempo"],
     "ans": 1, "explanation": "Un VA productivo entrega resultados de calidad eficientemente — el valor está en los resultados, no en las horas."},
    {"q": "¿Cuál de estas tareas NO es típica de un VA general?",
     "opts": ["Gestionar el calendario del cliente","Atender correos electrónicos","Programar el software del servidor del cliente","Coordinar reuniones virtuales"],
     "ans": 2, "explanation": "La administración de servidores es desarrollo de sistemas — requiere especialización técnica fuera del alcance de un VA general."}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- MÓDULO 2 — Competencias Digitales
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u2,'video',1,'Google Workspace: el kit del VA profesional',20,'{
  "youtube_id": "PLACEHOLDER_M2",
  "duration_min": 15,
  "description": "Tour completo por Google Workspace — las herramientas que todo VA usa a diario con sus clientes internacionales.",
  "key_points": [
    "Gmail con etiquetas y filtros para gestionar múltiples clientes",
    "Google Drive: estructura de carpetas profesional",
    "Google Docs y Sheets: colaboración en tiempo real",
    "Google Meet para reuniones y Google Calendar para agenda"
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u2,'lesson',2,'Herramientas de gestión de proyectos',15,'{
  "sections": [
    {
      "title": "Trello — Tableros Kanban",
      "content": "Trello organiza el trabajo en tableros visuales con columnas (Por hacer → En proceso → Hecho). Cada tarea es una tarjeta que podés mover entre columnas, asignar fechas, agregar checklists y adjuntar archivos.\n\n🎯 Caso de uso: Un cliente tiene una tienda online. Creás un tablero con las columnas: Pedidos Pendientes → En Proceso → Enviados → Completados.",
      "highlight": "💡 Shortcut útil: En Trello presioná Q para ver solo tus tareas asignadas."
    },
    {
      "title": "Asana — Gestión avanzada de proyectos",
      "content": "Asana es más poderoso que Trello para equipos y proyectos complejos. Tiene vistas de lista, tablero, timeline (Gantt) y calendario. Podés crear proyectos, tareas, subtareas y dependencias.\n\n🎯 Caso de uso: Un cliente lanza un nuevo producto. Creás un proyecto en Asana con todas las tareas del lanzamiento, asignadas, con fechas límite y dependencias claras.",
      "highlight": "⭐ Asana tiene una app móvil excelente — podés gestionar tareas desde cualquier lugar."
    },
    {
      "title": "Notion — Tu base de conocimiento",
      "content": "Notion es un espacio de trabajo todo-en-uno donde podés crear documentos, bases de datos, wikis y tableros. Es ideal para documentar procesos, crear manuales de operaciones y mantener información organizada.\n\n🎯 Caso de uso: Creás un 'Manual de Operaciones' en Notion para tu cliente, documentando cómo responder preguntas frecuentes, procesar pedidos y gestionar su tienda.",
      "highlight": "📚 El VA que documenta los procesos del cliente es irremplazable — nadie más sabe cómo funciona todo."
    },
    {
      "title": "CRM — Gestión de relaciones con clientes",
      "content": "Un CRM (Customer Relationship Management) registra cada interacción con los clientes del negocio. Los más comunes que usarás como VA:\n\n• HubSpot CRM (gratuito) — pipeline de ventas\n• Zoho CRM — gestión completa\n• Airtable — CRM flexible y visual\n\nComo VA, podés ser responsable de actualizar el CRM, registrar llamadas y hacer seguimiento a prospectos.",
      "highlight": "💼 Conocer aunque sea un CRM te diferencia del 80% de los VAs en el mercado."
    }
  ],
  "resources": [
    {"label": "🎥 Tutorial Trello (15 min)", "url": "#"},
    {"label": "🎥 Tutorial Asana (12 min)", "url": "#"},
    {"label": "📄 Template Notion para VA", "url": "#"}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u2,'fill_blank',3,'Creá un flujo de trabajo digital',25,'{
  "instructions": "Completá la descripción del flujo de trabajo usando las palabras del banco. Este es el proceso que seguirías para gestionar los pedidos online de un cliente.",
  "word_bank": ["Trello","confirmar","notificar","archivar","registrar","Drive","Asana","prioridad"],
  "sentences": [
    {"template": "Cuando llega un pedido nuevo, lo primero es ___ en la hoja de Google.", "answer": "registrar", "hint": "Acción de anotar datos en un sistema"},
    {"template": "Luego creo una tarjeta en ___ con los detalles del pedido.", "answer": "Trello", "hint": "Herramienta de tableros kanban"},
    {"template": "Asigno una ___ según la fecha de entrega requerida.", "answer": "prioridad", "hint": "Nivel de urgencia de una tarea"},
    {"template": "Al completar el pedido, subo el comprobante a Google ___.", "answer": "Drive", "hint": "Almacenamiento en la nube de Google"},
    {"template": "Finalmente ___ al cliente que su pedido fue procesado.", "answer": "notificar", "hint": "Comunicar o informar a alguien"}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u2,'roleplay',4,'Organizando el proyecto de un cliente',35,'{
  "scenario": "Tu cliente Sarah (emprendedora de EEUU) está lanzando un nuevo producto en 30 días y está completamente desorganizada. Te escribe por WhatsApp a las 10 PM: \"I need help. I have 47 things to do before the launch and no idea where to start!\"",
  "context": "Sos su VA hace 2 semanas. Tu tarea es ayudarla a organizar todo usando las herramientas que conocés.",
  "steps": [
    {
      "situation": "Sarah te escribe en pánico a las 10 PM. ¿Cómo respondés?",
      "options": [
        {"text": "No respondo hasta el día siguiente en horario laboral.", "correct": false, "xp": 0, "feedback": "❌ Si tu cliente está en crisis y acordaron disponibilidad extendida, ignorar el mensaje daña la confianza. Al menos confirmá que lo viste."},
        {"text": "Hi Sarah! I got your message. Let's organize everything — I'll create a project board in Asana tonight so you wake up with a clear plan. 🙌", "correct": true, "xp": 15, "feedback": "✅ Perfecto. Respondés con solución inmediata, usás su herramienta y das tranquilidad. Esto es lo que hace un VA excelente."},
        {"text": "Ok, mandame la lista de las 47 cosas.", "correct": false, "xp": 5, "feedback": "⚠️ Funcional pero frío. Podés pedir más información siendo más empático y ofreciendo valor de inmediato."}
      ]
    },
    {
      "situation": "Sarah te manda una lista desordenada de 47 tareas. ¿Cómo la organizás?",
      "options": [
        {"text": "Las copio en orden tal como las mandó.", "correct": false, "xp": 0, "feedback": "❌ Copiar sin organizar no agrega valor. Tu trabajo es transformar el caos en claridad."},
        {"text": "Las categorizo por área (Marketing, Producto, Legal, Admin), asigno fechas límite y marco cuáles bloquean otras tareas.", "correct": true, "xp": 15, "feedback": "✅ Exactamente lo que haría un project manager profesional. Categorizar + priorizar + dependencias = plan de acción claro."},
        {"text": "Le digo que son demasiadas tareas y que debe contratar más gente.", "correct": false, "xp": 0, "feedback": "❌ Tu rol es resolver problemas, no amplificarlos. Ayudála a ver qué es realmente urgente y qué puede delegarse o eliminarse."}
      ]
    }
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u2,'quiz',5,'Evaluación — Módulo 2',50,'{
  "pass_score": 70,
  "time_limit_min": 15,
  "questions": [
    {"q": "¿Para qué sirve Trello en el trabajo de un VA?",
     "opts": ["Editar fotos para redes sociales","Organizar tareas en tableros visuales tipo kanban","Hacer videollamadas con clientes","Gestionar contraseñas"],
     "ans": 1, "explanation": "Trello usa el método kanban — columnas que representan el estado de cada tarea."},
    {"q": "¿Qué ventaja tiene Notion sobre Trello y Asana?",
     "opts": ["Es más barato","Permite crear bases de datos, wikis y documentos en un mismo espacio","Tiene mejor app móvil","Se integra con más herramientas"],
     "ans": 1, "explanation": "Notion es un espacio de trabajo todo-en-uno — documentación, base de datos, tableros y más en una sola plataforma."},
    {"q": "¿Qué es un CRM?",
     "opts": ["Un tipo de contrato freelance","Un sistema para gestionar relaciones y datos de clientes","Una herramienta de diseño gráfico","Un servicio de email marketing"],
     "ans": 1, "explanation": "CRM = Customer Relationship Management. Registra interacciones, leads y el pipeline de ventas."},
    {"q": "¿Cuál es la mejor práctica al organizar archivos del cliente en Google Drive?",
     "opts": ["Guardar todo en la carpeta raíz sin subcarpetas","Crear una estructura de carpetas clara por proyecto o área","Usar solo el nombre del archivo sin carpetas","Compartir todos los archivos públicamente"],
     "ans": 1, "explanation": "Una estructura organizada permite que el cliente y el VA encuentren cualquier archivo en segundos."},
    {"q": "Un cliente te manda una lista caótica de tareas. ¿Qué hacés primero?",
     "opts": ["Las completás en el orden que llegaron","Las categorizás y priorizás por urgencia e impacto","Le decís que son demasiadas","Las ignorás hasta que el cliente las ordene"],
     "ans": 1, "explanation": "Organizar, categorizar y priorizar es el valor central de un VA — transformás el caos en un plan ejecutable."},
    {"q": "¿Qué herramienta usarías para ver el progreso de un proyecto complejo con fechas y dependencias?",
     "opts": ["Google Calendar","Trello","Asana (vista Timeline)","Slack"],
     "ans": 2, "explanation": "Asana con vista Timeline (Gantt) muestra dependencias entre tareas y el progreso del proyecto de forma visual."},
    {"q": "¿Qué es la automatización en el contexto de productividad digital?",
     "opts": ["Hacer todo manualmente pero más rápido","Configurar reglas para que las herramientas hagan tareas repetitivas automáticamente","Contratar a más personas","Trabajar más horas"],
     "ans": 1, "explanation": "Automatizaciones como Zapier o Make conectan herramientas para que tareas repetitivas ocurran sin intervención manual."},
    {"q": "¿Cuál de estos servicios es un CRM gratuito muy usado?",
     "opts": ["Canva","HubSpot CRM","Adobe Creative Cloud","Zoom"],
     "ans": 1, "explanation": "HubSpot ofrece un CRM completamente gratuito con funciones de pipeline, contactos y seguimiento de emails."},
    {"q": "¿Por qué es valioso que un VA documente los procesos del cliente?",
     "opts": ["Para poder vender la información a competidores","Porque hace al VA difícil de reemplazar y al cliente más eficiente","Para tener más trabajo que hacer","No es necesario documentar"],
     "ans": 1, "explanation": "La documentación es un activo estratégico — el VA que la mantiene se vuelve esencial para la operación del cliente."},
    {"q": "¿Cuál es la diferencia clave entre Trello y Asana?",
     "opts": ["Trello es de pago y Asana es gratuito","Asana permite gestión más avanzada con timelines, dependencias y reportes","Trello solo funciona para equipos grandes","No hay diferencia significativa"],
     "ans": 1, "explanation": "Asana tiene funciones más robustas para proyectos complejos; Trello es más simple y visual, ideal para flujos simples."}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- MÓDULO 3 — Soporte Administrativo y Atención al Cliente
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u3,'video',1,'Atención al cliente bilingüe de alto impacto',20,'{
  "youtube_id": "PLACEHOLDER_M3",
  "duration_min": 14,
  "description": "Cómo comunicarte con clientes en inglés y español de forma profesional, empática y efectiva en cualquier canal digital.",
  "key_points": [
    "El tono profesional cambia según el canal: email vs chat vs llamada",
    "Frases clave en inglés para atención al cliente",
    "Cómo manejar clientes insatisfechos sin perder la calma",
    "Tiempo de respuesta estándar por canal"
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u3,'lesson',2,'Redacción profesional bilingüe',15,'{
  "sections": [
    {
      "title": "Principios de la comunicación escrita profesional",
      "content": "Un email profesional tiene una estructura clara:\n\n1. **Saludo formal**: Dear Mr./Ms. [apellido] o Estimado/a [nombre]\n2. **Contexto**: Una oración que explica el propósito\n3. **Cuerpo**: La información o solicitud, en párrafos cortos\n4. **Llamada a la acción**: Qué esperás que haga el destinatario\n5. **Cierre**: Best regards / Atentamente + tu nombre y cargo",
      "highlight": "📧 Regla de oro: si tu email necesita más de 3 párrafos, probablemente es mejor hacer una llamada."
    },
    {
      "title": "Frases clave en inglés para atención al cliente",
      "content": "Agradecimiento:\n• \"Thank you for reaching out to us.\"\n• \"We appreciate your patience.\"\n\nDisculpas:\n• \"I sincerely apologize for the inconvenience.\"\n• \"I understand your frustration and I'm here to help.\"\n\nSolución:\n• \"I'm looking into this right now and will get back to you within [time].\"\n• \"Here's what I'll do to resolve this for you.\"\n\nCierre:\n• \"Please don't hesitate to reach out if you have any other questions.\"\n• \"Is there anything else I can assist you with today?\"",
      "highlight": "⭐ Memorizá estas frases — las usarás todos los días con clientes de habla inglesa."
    },
    {
      "title": "Gestión documental: el manual administrativo",
      "content": "Un manual administrativo documenta los procesos del negocio del cliente. Como VA, podés ser responsable de crearlo y mantenerlo actualizado. Debe incluir:\n\n• Procedimientos paso a paso de las tareas recurrentes\n• Respuestas estándar a preguntas frecuentes (FAQs)\n• Protocolos de escalamiento (¿cuándo involucrar al cliente?)\n• Información de contacto y herramientas usadas\n• Políticas de devolución, envíos o servicios",
      "highlight": "📋 Un buen manual reduce el tiempo de respuesta a clientes en un 60% — y hace que el negocio funcione aunque el dueño esté de vacaciones."
    }
  ],
  "resources": [
    {"label": "📄 Plantilla email de disculpa profesional", "url": "#"},
    {"label": "📄 Template manual administrativo", "url": "#"},
    {"label": "📝 100 frases en inglés para atención al cliente", "url": "#"}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u3,'fill_blank',3,'Redactá un email de atención al cliente',25,'{
  "instructions": "Completá este email de respuesta a un cliente insatisfecho. Elegí la opción que mejor refleje comunicación profesional y empática.",
  "context": "Un cliente escribió: \"I ordered 3 weeks ago and still haven't received my package. This is unacceptable!\"",
  "word_bank": ["sincerely apologize","understand","immediately","resolve","looking into","appreciate","patience"],
  "sentences": [
    {"template": "Dear [Name],\n\nThank you for reaching out. I ___ your frustration — waiting 3 weeks is certainly longer than expected.", "answer": "understand", "hint": "Verbo que expresa comprensión de la situación del cliente"},
    {"template": "I ___ for the inconvenience this has caused you.", "answer": "sincerely apologize", "hint": "Frase formal de disculpa"},
    {"template": "I am ___ the status of your order right now.", "answer": "looking into", "hint": "Expresión que indica acción inmediata de investigación"},
    {"template": "I will contact you ___ with an update and a solution.", "answer": "immediately", "hint": "Sin demora, de forma urgente"},
    {"template": "I ___ your ___ while we resolve this.", "answer": "appreciate", "hint": "Agradecer la comprensión del cliente"}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u3,'roleplay',4,'Manejá un cliente insatisfecho',35,'{
  "scenario": "Son las 3 PM del martes. El cliente de tu jefa (una emprendedora de Miami) te escribe furioso por chat: \"This is the THIRD time you send the wrong order! I want a full refund NOW!\"",
  "context": "Sos la VA de una tienda de velas artesanales. Tu jefa está en una reunión hasta las 5 PM y no puede ser interrumpida. Tenés acceso al sistema de pedidos pero no autorización para emitir reembolsos.",
  "steps": [
    {
      "situation": "El cliente está furioso y exige respuesta inmediata. ¿Qué hacés?",
      "options": [
        {"text": "Le decís que tu jefa está ocupada y que espere hasta las 5 PM.", "correct": false, "xp": 0, "feedback": "❌ Hacerlo esperar sin solución inmediata empeoraría la situación. Necesitás actuar dentro de tus posibilidades."},
        {"text": "Le respondés inmediatamente con empatía, reconocés el error, le explicás los pasos que seguirás y le das un tiempo específico de respuesta.", "correct": true, "xp": 15, "feedback": "✅ Perfecto. Responder rápido con empatía y un plan concreto calma al cliente aunque no tengas la solución final aún."},
        {"text": "Emitiís el reembolso sin consultar a tu jefa para resolver el problema.", "correct": false, "xp": 0, "feedback": "❌ Actuar fuera de tus autorizaciones puede causarte problemas serios. Siempre trabajá dentro de tus límites de autorización."}
      ]
    },
    {
      "situation": "El cliente responde: \"I don't want to wait. Give me my money back NOW.\" ¿Qué hacés?",
      "options": [
        {"text": "\"I completely understand your frustration. I'm escalating this to my supervisor right now — she will contact you before 5 PM today with a resolution. I'm also sending you a $10 store credit as an immediate gesture of goodwill.\"", "correct": true, "xp": 15, "feedback": "✅ Excelente manejo de crisis: reconocés la urgencia, escalás correctamente, das un tiempo concreto Y ofrecés algo de valor inmediato dentro de tu autorización."},
        {"text": "\"I understand but there''s nothing I can do right now.\"", "correct": false, "xp": 0, "feedback": "❌ Nunca digas que no podés hacer nada — siempre hay algo dentro de tu alcance. Escalá el problema y ofrecé algo concreto."},
        {"text": "Le ignorás hasta que tu jefa salga de la reunión.", "correct": false, "xp": 0, "feedback": "❌ Ignorar a un cliente furioso garantiza una reseña negativa y pérdida del cliente. Siempre respondé aunque sea para reconocer el problema."}
      ]
    }
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u3,'quiz',5,'Evaluación — Módulo 3',50,'{
  "pass_score": 70,
  "time_limit_min": 15,
  "questions": [
    {"q": "¿Cuál es la estructura correcta de un email profesional?",
     "opts": ["Hola → Texto largo → Bye","Saludo formal → Contexto → Cuerpo → CTA → Cierre","Texto directo sin saludos","Asunto → Solo el cuerpo"],
     "ans": 1, "explanation": "Un email profesional tiene estructura clara: saludo, contexto, cuerpo con la información, llamada a la acción y cierre cortés."},
    {"q": "¿Qué significa \"escalamiento\" en atención al cliente?",
     "opts": ["Aumentar el precio del servicio","Subir la queja a redes sociales","Transferir el caso a alguien con más autoridad para resolverlo","Ignorar el problema"],
     "ans": 2, "explanation": "Escalamiento es el proceso de transferir un caso a un supervisor o equipo con mayor autoridad cuando el VA no puede resolverlo directamente."},
    {"q": "¿Cuál de estas frases es más profesional para disculparse en inglés?",
     "opts": ["Sorry for the trouble","I sincerely apologize for the inconvenience caused","My bad","Oops, that was wrong"],
     "ans": 1, "explanation": "\"I sincerely apologize for the inconvenience\" es la opción más formal y apropiada para comunicación profesional."},
    {"q": "Un cliente furioso te escribe a las 8 PM. ¿Qué debés hacer?",
     "opts": ["Responder mañana en horario laboral","Ignorarlo","Responder con empatía, reconocer el problema y dar un tiempo estimado de resolución","Pedirle que se calme antes de responder"],
     "ans": 2, "explanation": "Siempre responder con empatía y un plan concreto — el tiempo de respuesta y la calidad de la primera respuesta son críticos."},
    {"q": "¿Para qué sirve un manual administrativo?",
     "opts": ["Para documentar el contrato con el cliente","Para registrar los procesos del negocio y estandarizar respuestas","Para llevar la contabilidad","Para diseñar el logo del cliente"],
     "ans": 1, "explanation": "Un manual administrativo documenta procesos, FAQs y protocolos — permite consistencia y reduce errores."},
    {"q": "¿Cuánto tiempo de respuesta es aceptable para emails en servicio al cliente?",
     "opts": ["3-5 días hábiles","1 semana","Dentro de las 24 horas hábiles (idealmente 4-8 horas)","Solo en horario del cliente"],
     "ans": 2, "explanation": "El estándar profesional es responder dentro de 24 horas hábiles — idealmente en 4-8 horas para mantener la satisfacción del cliente."},
    {"q": "¿Qué harías si no tenés autorización para resolver el problema del cliente?",
     "opts": ["Decirle que no podés ayudar","Resolver el problema de todas formas para evitar conflictos","Reconocer el problema, escalarlo a tu supervisor y dar un tiempo concreto de respuesta","Ignorar el mensaje"],
     "ans": 2, "explanation": "Actuar dentro de tus límites de autorización protege tanto al VA como al cliente — siempre escalá con comunicación clara."},
    {"q": "¿Qué es una FAQ en el contexto del manual administrativo?",
     "opts": ["Un tipo de contrato","Preguntas frecuentes con respuestas estándar","Un informe financiero","Un formato de factura"],
     "ans": 1, "explanation": "FAQ (Frequently Asked Questions) son respuestas pre-redactadas a las preguntas más comunes — ahorran tiempo y garantizan consistencia."},
    {"q": "¿Cuál es la mejor forma de manejar múltiples clientes con diferentes temperamentos?",
     "opts": ["Tratar a todos exactamente igual","Adaptar el tono y canal según las preferencias de cada cliente","Solo trabajar con clientes amables","Delegar todos los casos difíciles"],
     "ans": 1, "explanation": "La inteligencia emocional en atención al cliente incluye adaptar el estilo de comunicación a la personalidad y necesidades de cada persona."},
    {"q": "¿Qué información debe incluir siempre el cierre de un email profesional?",
     "opts": ["Emojis y colores llamativos","Tu nombre, cargo, empresa y datos de contacto","Solo tu nombre","El logo del cliente"],
     "ans": 1, "explanation": "Una firma profesional incluye nombre completo, cargo, empresa (o \"Virtual Assistant for [cliente]\") y datos de contacto relevantes."}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- MÓDULO 4 — Marketing Digital
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u4,'video',1,'Marketing digital para VAs: lo que necesitás saber',20,'{
  "youtube_id": "PLACEHOLDER_M4",
  "duration_min": 16,
  "description": "Fundamentos de marketing digital que todo VA debe manejar para apoyar a sus clientes con redes sociales, contenido y análisis de resultados.",
  "key_points": [
    "Los 4 pilares del marketing digital: contenido, SEO, redes y email",
    "Canva para crear diseños profesionales sin ser diseñador",
    "Cómo leer e interpretar métricas básicas",
    "El rol del VA en la estrategia de contenido del cliente"
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u4,'lesson',2,'Canva, redes sociales y métricas',15,'{
  "sections": [
    {
      "title": "Canva: diseño profesional sin experiencia",
      "content": "Canva es la herramienta de diseño más popular entre VAs. Con plantillas profesionales podés crear:\n• Posts para Instagram, Facebook y LinkedIn\n• Stories y Reels con animaciones\n• Presentaciones y documentos\n• Banners para sitios web\n• Thumbnails para YouTube\n\nLo más importante: mantener consistencia visual — mismos colores, fuentes y estilo de la marca del cliente.",
      "highlight": "🎨 Consejo pro: usá el Brand Kit de Canva para guardar los colores y fuentes del cliente — ahorrarás horas de trabajo."
    },
    {
      "title": "Gestión de redes sociales",
      "content": "Como VA de redes sociales tu rol puede incluir:\n\n**Creación de contenido**: diseñar posts según el calendario editorial\n**Programación**: usar Buffer, Later o Hootsuite para programar publicaciones\n**Community management**: responder comentarios y mensajes\n**Monitoreo**: reportar el desempeño semanal al cliente\n\n📅 **Regla del contenido 80/20**: 80% contenido de valor para la audiencia, 20% contenido promocional.",
      "highlight": "⚠️ Siempre pedí aprobación del cliente antes de publicar — especialmente en los primeros 3 meses."
    },
    {
      "title": "Métricas básicas que todo VA debe conocer",
      "content": "No necesitás ser experto en analytics, pero debés entender estos indicadores:\n\n• **Alcance**: cuántas personas vieron la publicación\n• **Impresiones**: cuántas veces se mostró (puede ser más que alcance)\n• **Engagement**: likes + comentarios + compartidos ÷ alcance × 100\n• **CTR (Click-Through Rate)**: % de personas que hicieron clic en un enlace\n• **Conversión**: % de personas que realizaron la acción deseada\n\nTool recomendada: Meta Business Suite (gratuito para Facebook e Instagram).",
      "highlight": "📊 Un reporte mensual de métricas bien presentado demuestra tu valor al cliente — aunque los números no sean perfectos."
    }
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u4,'matching',3,'Métricas y herramientas de marketing',25,'{
  "instructions": "Relacioná cada término o herramienta con su definición correcta.",
  "pairs": [
    {"left": "Engagement Rate",   "right": "Porcentaje de interacciones (likes, comentarios) sobre el alcance total"},
    {"left": "Buffer / Hootsuite","right": "Herramientas para programar publicaciones en múltiples redes sociales"},
    {"left": "CTR",               "right": "Porcentaje de personas que hacen clic en un enlace del anuncio o post"},
    {"left": "Copywriting",       "right": "El arte de escribir textos persuasivos para vender o generar acción"},
    {"left": "Canva Brand Kit",   "right": "Función para guardar los colores, fuentes y logo de la marca del cliente"},
    {"left": "Meta Business Suite","right": "Panel gratuito para gestionar y analizar Facebook e Instagram Business"}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u4,'roleplay',4,'Presentá un plan de contenido',35,'{
  "scenario": "Tu cliente tiene una panadería artesanal en Miami y quiere empezar en Instagram. Nunca ha tenido presencia en redes. Te pide que le presentés un plan de contenido para el primer mes.",
  "context": "Tenés 2 días para preparar la presentación. El cliente es muy visual y quiere ver resultados rápidos.",
  "steps": [
    {
      "situation": "¿Cuántas publicaciones por semana recomendás para empezar?",
      "options": [
        {"text": "20 posts por semana para crecer rápido.", "correct": false, "xp": 0, "feedback": "❌ Demasiado contenido al inicio es insostenible y reduce la calidad. Para empezar, menos es más."},
        {"text": "3-4 posts por semana: 2 posts en el feed + 3-5 Stories diarias. Consistencia sobre volumen.", "correct": true, "xp": 15, "feedback": "✅ Perfecto. Es un ritmo sostenible que permite mantener calidad y consistencia — los dos factores más importantes al inicio."},
        {"text": "1 post por semana es suficiente para empezar.", "correct": false, "xp": 5, "feedback": "⚠️ Puede ser demasiado poco para construir presencia. Las plataformas recompensan la consistencia."}
      ]
    },
    {
      "situation": "El cliente quiere que todos los posts sean sobre sus productos y precios. ¿Qué le decís?",
      "options": [
        {"text": "\"Claro, lo que usted diga.\"", "correct": false, "xp": 0, "feedback": "❌ Un VA debe asesorar al cliente cuando algo puede no funcionar — eso es parte de tu valor."},
        {"text": "\"Le recomiendo usar la regla 80/20: 80% contenido de valor (recetas, tips, behind the scenes) y 20% promocional. Vender todo el tiempo aleja a los seguidores.\"", "correct": true, "xp": 15, "feedback": "✅ Excelente asesoría. Educás al cliente con una estrategia probada y explicas el porqué — esto construye confianza."},
        {"text": "\"Las redes sociales no funcionan para vender.\"", "correct": false, "xp": 0, "feedback": "❌ Incorrecto. Las redes sí generan ventas — la clave es la estrategia correcta de contenido."}
      ]
    }
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u4,'quiz',5,'Evaluación — Módulo 4',50,'{
  "pass_score": 70,
  "time_limit_min": 15,
  "questions": [
    {"q": "¿Qué es el engagement rate en redes sociales?",
     "opts": ["El número total de seguidores","El porcentaje de interacciones sobre el alcance total","La cantidad de publicaciones por semana","El presupuesto de publicidad"],
     "ans": 1, "explanation": "Engagement rate = (likes + comentarios + compartidos) ÷ alcance × 100. Indica qué tan activa es la audiencia."},
    {"q": "¿Cuál es la regla 80/20 del contenido?",
     "opts": ["80% contenido promocional, 20% de valor","80% de valor para la audiencia, 20% promocional","80% imágenes, 20% videos","80% inglés, 20% español"],
     "ans": 1, "explanation": "Publicar principalmente contenido de valor genera confianza y retención — el 20% promocional convierte mejor cuando la audiencia ya confía en la marca."},
    {"q": "¿Para qué se usa Buffer o Hootsuite?",
     "opts": ["Editar videos profesionales","Programar publicaciones en múltiples redes sociales","Diseñar logos","Analizar competidores"],
     "ans": 1, "explanation": "Buffer y Hootsuite permiten programar y gestionar contenido en múltiples redes desde una sola plataforma."},
    {"q": "¿Qué es el CTR?",
     "opts": ["Número total de clicks","Porcentaje de personas que hacen click en un enlace vs quienes lo vieron","Costo por publicación","Cantidad de comentarios"],
     "ans": 1, "explanation": "CTR (Click-Through Rate) mide la efectividad de un enlace o CTA: clicks ÷ impresiones × 100."},
    {"q": "¿Cuál es la ventaja del Brand Kit en Canva?",
     "opts": ["Permite descargar fotos de stock gratuitas","Guarda colores, fuentes y logos de la marca para usarlos en cualquier diseño","Conecta con redes sociales automáticamente","Genera textos con inteligencia artificial"],
     "ans": 1, "explanation": "El Brand Kit centraliza la identidad visual del cliente, garantizando consistencia en todos los diseños."},
    {"q": "¿Cuándo deberías pedir aprobación al cliente antes de publicar?",
     "opts": ["Nunca, el VA tiene autonomía total","Solo en los primeros 6 meses","Siempre, especialmente al inicio de la relación laboral","Solo para publicaciones pagadas"],
     "ans": 2, "explanation": "Al inicio de trabajar con un cliente, la aprobación previa es fundamental para alinearse con su voz y evitar errores costosos."},
    {"q": "¿Qué herramienta es gratuita para analizar Facebook e Instagram Business?",
     "opts": ["Google Analytics","Meta Business Suite","HubSpot","Semrush"],
     "ans": 1, "explanation": "Meta Business Suite ofrece análisis detallados de Facebook e Instagram de forma gratuita para cuentas de negocio."},
    {"q": "¿Qué es copywriting?",
     "opts": ["Registrar derechos de autor","Escribir textos persuasivos para vender o generar una acción específica","Copiar el contenido de la competencia","Traducir textos al inglés"],
     "ans": 1, "explanation": "Copywriting es la habilidad de escribir textos que motivan al lector a actuar — comprar, suscribirse, hacer clic."},
    {"q": "¿Con qué frecuencia es ideal publicar al inicio en Instagram?",
     "opts": ["20 veces por semana","1 vez por semana","3-4 posts semanales + stories diarias","Solo cuando hay algo importante"],
     "ans": 2, "explanation": "3-4 posts semanales con stories diarias es un ritmo sostenible que el algoritmo recompensa con mayor alcance."},
    {"q": "¿Qué diferencia hay entre alcance e impresiones?",
     "opts": ["Son lo mismo","Alcance = personas únicas que vieron el post; Impresiones = veces totales que se mostró","Alcance es más grande que impresiones siempre","Impresiones solo cuenta los clicks"],
     "ans": 1, "explanation": "Alcance cuenta personas únicas. Impresiones cuenta vistas totales — si la misma persona ve el post 3 veces, suma 3 impresiones pero 1 de alcance."}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- MÓDULO 5 — Marca Personal + Trabajo Remoto + Emprendimiento
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u5,'video',1,'Construí tu marca personal como VA internacional',20,'{
  "youtube_id": "PLACEHOLDER_M5",
  "duration_min": 18,
  "description": "Cómo posicionarte como VA profesional en el mercado internacional, construir tu presencia en LinkedIn y conseguir tus primeros clientes.",
  "key_points": [
    "LinkedIn optimizado = tu mejor carta de presentación",
    "Cómo fijar tus tarifas sin subestimarte",
    "Plataformas para encontrar clientes: Upwork, Fiverr, LinkedIn",
    "Del empleo al emprendimiento: los 3 modelos de negocio del VA"
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u5,'lesson',2,'LinkedIn, CV bilingüe y emprendimiento digital',15,'{
  "sections": [
    {
      "title": "LinkedIn optimizado para VAs",
      "content": "Tu perfil de LinkedIn es tu vitrina profesional. Para un VA, los elementos más importantes son:\n\n**Foto**: profesional, buena iluminación, fondo limpio\n**Titular**: No pongas solo \"Asistente Virtual\" — pongas tu propuesta de valor. Ejemplo: \"Bilingual Virtual Assistant | Google Workspace | Social Media | Customer Success\"\n**About**: 3-5 oraciones sobre quién sos, qué hacés y a quién ayudás\n**Skills**: Google Workspace, Trello, Asana, Canva, Customer Service, Administrative Support\n**Recomendaciones**: pide a profesores, compañeros o clientes satisfechos",
      "highlight": "🔵 Los perfiles de LinkedIn con foto reciben 21x más visitas. Los que tienen resumen reciben 40x más mensajes."
    },
    {
      "title": "CV bilingüe de VA",
      "content": "Tu CV debe existir en dos versiones: español e inglés. Elementos clave:\n\n• **Resumen profesional** (3 líneas): habilidades + enfoque + propuesta de valor\n• **Herramientas dominadas**: lista concreta (Google Workspace, Canva, Trello, etc.)\n• **Experiencia**: aunque no tengas clientes pagados, incluyé proyectos académicos, voluntariado o ayuda a negocios conocidos\n• **Idiomas**: Español (nativo) + Inglés (nivel que tenés)\n• **Certificaciones**: este certificado de WCA + cualquier curso relevante\n\n💡 Para clientes de EEUU: el CV en inglés debe ser máximo 1 página.",
      "highlight": "📄 El CV en inglés se llama 'Resume' y NO incluye foto, edad ni estado civil — es ilegal pedirlo en EEUU."
    },
    {
      "title": "Los 3 modelos de negocio del VA",
      "content": "**1. Freelancer independiente** — trabajás por proyecto u hora, múltiples clientes, vos manejás todo.\n*Ingreso promedio: $500–$1,500/mes en los primeros 6 meses*\n\n**2. VA de agencia** — te unís a una agencia VA que consigue los clientes y vos hacés el trabajo.\n*Ingreso promedio: $400–$900/mes, menos estrés comercial*\n\n**3. Fundás tu propia agencia** — comenzás como VA, construís cartera de clientes, luego subcontratás otros VAs.\n*Ingreso potencial: ilimitado, pero requiere habilidades de ventas y gestión*\n\nEl camino típico: Freelancer → Especialista → Agencia propia.",
      "highlight": "💡 La mayoría de VAs exitosos empiezan cobrando $5-8/hora y en 1 año cobran $15-25/hora a medida que construyen reputación."
    },
    {
      "title": "Plataformas para conseguir clientes",
      "content": "**Upwork** — la plataforma freelance más grande del mundo. Requiere construir reputación con proyectos iniciales bien pagados.\n\n**Fiverr** — vendés paquetes de servicios a precio fijo. Bueno para servicios específicos (gestión de email, posts de redes).\n\n**LinkedIn** — prospección directa. Conectá con emprendedores y ofrecé valor antes de vender.\n\n**Redes sociales** — muchos VAs consiguen clientes en grupos de Facebook o Instagram mostrando su trabajo.\n\n**Referidos** — el canal más poderoso a largo plazo. Un cliente feliz vale 10 publicaciones.",
      "highlight": "🚀 Estrategia para el primer cliente: ofrecé 5 horas gratis a alguien conocido con un negocio. Con el testimonio, conseguís el primer cliente pagado."
    }
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u5,'fill_blank',3,'Escribí tu titular de LinkedIn',25,'{
  "instructions": "Completá los titulares de LinkedIn de estos VAs con las palabras del banco. El titular debe ser específico, incluir habilidades clave y estar en inglés.",
  "context": "Un buen titular de LinkedIn para VA tiene: rol + especialidades + herramientas o mercado objetivo",
  "word_bank": ["Bilingual","Customer","Specialist","Digital","Remote","Social Media","Google Workspace","E-commerce"],
  "sentences": [
    {"template": "___ Virtual Assistant | ___ Media Manager | Canva Expert", "answer": "Bilingual", "hint": "Que habla dos idiomas"},
    {"template": "Virtual Assistant | ___ Support | Trello & Asana Expert", "answer": "Customer", "hint": "Tipo de servicio centrado en el cliente"},
    {"template": "___ Assistant | ___ Support | Helping entrepreneurs scale", "answer": "Remote", "hint": "Trabajo desde cualquier ubicación"},
    {"template": "VA ___ | ___ & Notion | E-learning Support", "answer": "Specialist", "hint": "Experto en un área específica"}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u5,'roleplay',4,'Entrevista de trabajo internacional',35,'{
  "scenario": "Te contactó una startup de tecnología de Austin, Texas por LinkedIn. Quieren entrevistarte para una posición de VA remota 20 horas/semana. La entrevista es por Zoom en inglés.",
  "context": "El puesto paga $12/hora. Las tareas incluyen: gestión de email del CEO, coordinación de reuniones, investigación online y soporte a su equipo de 5 personas.",
  "steps": [
    {
      "situation": "El entrevistador te pregunta: \"Tell me about yourself.\"",
      "options": [
        {"text": "\"I''m María, I''m 24 years old, I''m from Honduras and I studied...\"", "correct": false, "xp": 0, "feedback": "❌ En entrevistas de trabajo no se comienza con datos personales. Se presenta el perfil profesional y propuesta de valor."},
        {"text": "\"I''m a bilingual virtual assistant specialized in administrative support and digital tools. I have strong skills in Google Workspace, Trello and customer communication. I''m passionate about helping founders and teams stay organized and focused on what matters.\"", "correct": true, "xp": 15, "feedback": "✅ Perfecto. Presentación profesional que conecta directamente con las necesidades del puesto."},
        {"text": "\"I can do everything you need.\"", "correct": false, "xp": 0, "feedback": "❌ Demasiado vago. Los entrevistadores quieren especificidad — ¿qué podés hacer exactamente?"}
      ]
    },
    {
      "situation": "Te preguntan: \"What is your expected hourly rate?\"",
      "options": [
        {"text": "\"Whatever you think is fair.\"", "correct": false, "xp": 0, "feedback": "❌ Nunca dejes que el cliente fije el precio. Comunica inseguridad sobre tu propio valor."},
        {"text": "\"I charge $10-12 per hour, depending on the scope. For this role at 20 hours/week I would be happy to discuss a monthly package.\"", "correct": true, "xp": 15, "feedback": "✅ Excelente. Das un rango alineado con lo que ofrecen, mencionás flexibilidad y proponés un formato que beneficia a ambas partes."},
        {"text": "\"$5 per hour, I''m just starting out.\"", "correct": false, "xp": 5, "feedback": "⚠️ Cobrar muy bajo daña tu mercado y el de otros VAs. Tu formación y habilidades tienen valor — cobrá acorde."}
      ]
    },
    {
      "situation": "Al final te preguntan: \"Do you have any questions for us?\"",
      "options": [
        {"text": "\"No, I think I have all the information.\"", "correct": false, "xp": 0, "feedback": "❌ No hacer preguntas comunica falta de interés. Siempre prepará al menos 2-3 preguntas inteligentes."},
        {"text": "\"Yes! Could you tell me more about the team culture and how you prefer to communicate with your VA? Also, what would success look like in the first 90 days?\"", "correct": true, "xp": 15, "feedback": "✅ Preguntas excelentes. Muestran interés genuino, inteligencia emocional y mentalidad orientada a resultados."},
        {"text": "\"When do I start and how do I get paid?\"", "correct": false, "xp": 5, "feedback": "⚠️ Preguntar sobre pago antes de recibir una oferta es prematuro y puede dar mala impresión. Guardá esas preguntas para cuando te hagan la oferta."}
      ]
    }
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
(u5,'quiz',5,'Evaluación Final — Módulo 5',50,'{
  "pass_score": 70,
  "time_limit_min": 15,
  "questions": [
    {"q": "¿Qué es lo más importante del titular de LinkedIn de un VA?",
     "opts": ["Que sea largo y detallado","Que incluya propuesta de valor + habilidades clave, no solo el cargo","Que use muchos emojis","Que esté en español para el mercado local"],
     "ans": 1, "explanation": "El titular de LinkedIn debe comunicar inmediatamente qué hacés y qué valor aportás — es lo primero que ve un cliente potencial."},
    {"q": "¿Qué diferencia hay entre un Resume y un CV en el contexto de trabajar con clientes de EEUU?",
     "opts": ["Son exactamente lo mismo","El Resume es más corto (1 página), en inglés, sin foto ni datos personales","El CV se usa para freelancers y el Resume para empleados","El Resume incluye foto y referencias"],
     "ans": 1, "explanation": "En EEUU el Resume es máximo 1 página, en inglés, y excluye foto, edad y estado civil — es ilegal solicitarlos allá."},
    {"q": "¿Cuál es la estrategia recomendada para conseguir el primer cliente?",
     "opts": ["Esperar a que te contacten por LinkedIn","Ofrecer algunas horas gratis a un conocido para conseguir testimonio","Bajar tu tarifa a $2/hora","Publicar en todos los grupos de Facebook al mismo tiempo"],
     "ans": 1, "explanation": "El primer testimonio de un cliente real es más valioso que cualquier certificado — te abre la puerta a clientes pagados."},
    {"q": "¿Qué plataforma es mejor para ofrecer servicios VA a precio fijo?",
     "opts": ["LinkedIn","Gmail","Fiverr","Google Meet"],
     "ans": 2, "explanation": "Fiverr está diseñado para servicios empaquetados a precio fijo — ideal para VAs que quieren claridad en lo que ofrecen y cuánto cobran."},
    {"q": "¿Cuál es el camino típico de un VA exitoso?",
     "opts": ["Emprendedor → Empleado → Jubilado","Freelancer → Especialista → Agencia propia","Agencia → Freelancer → Descanso","Empleado → VA → Empleado"],
     "ans": 1, "explanation": "La mayoría de VAs exitosos construyen experiencia como freelancers, se especializan en un nicho y eventualmente fundan su propia agencia."},
    {"q": "Al presentarte en una entrevista en inglés (Tell me about yourself), ¿con qué deberías empezar?",
     "opts": ["Tu edad y lugar de origen","Tu perfil profesional y propuesta de valor","Tu educación desde la primaria","Los motivos por los que dejaste tu trabajo anterior"],
     "ans": 1, "explanation": "\"Tell me about yourself\" es tu pitch profesional — empieza con quién sos profesionalmente, qué hacés y qué valor aportás."},
    {"q": "¿Por qué es un error decir \"whatever you think is fair\" cuando preguntan tu tarifa?",
     "opts": ["Porque es informal","Porque comunica inseguridad sobre tu propio valor y puede resultar en una tarifa muy baja","Porque suena muy ambicioso","Porque solo aplica para clientes de Europa"],
     "ans": 1, "explanation": "Un VA profesional conoce su valor y tiene una tarifa definida — dejar que el cliente fije el precio siempre resulta desfavorable."},
    {"q": "¿Qué deberías hacer si el entrevistador dice 'Do you have any questions?'",
     "opts": ["Decir que no tenés preguntas para no parecer difícil","Preguntar inmediatamente sobre salario y vacaciones","Hacer 2-3 preguntas inteligentes sobre el rol, el equipo y la definición de éxito","Preguntar por qué salió el último VA"],
     "ans": 2, "explanation": "Hacer preguntas inteligentes muestra interés genuino, preparación e inteligencia emocional — los tres rasgos que buscan los clientes en un VA."},
    {"q": "¿Qué hace diferente a un VA de agencia vs un freelancer independiente?",
     "opts": ["El VA de agencia trabaja más horas","La agencia consigue los clientes y el VA hace el trabajo, con menos estrés comercial","El freelancer gana más siempre","No hay diferencia práctica"],
     "ans": 1, "explanation": "En una agencia, la captación de clientes está cubierta — el VA se enfoca en el trabajo. El freelancer maneja todo, incluyendo la comercialización."},
    {"q": "¿Cuál es el canal más poderoso para conseguir nuevos clientes a largo plazo?",
     "opts": ["Publicidad pagada en Instagram","Grupos de Facebook","Los referidos de clientes satisfechos","Fiverr"],
     "ans": 2, "explanation": "Un cliente feliz que te recomienda vale más que cualquier canal de marketing — los referidos tienen la tasa de conversión más alta y el costo más bajo."}
  ]
}'::jsonb)
ON CONFLICT DO NOTHING;

RAISE NOTICE 'VA content seeded: 5 units × 5 activities = 25 activities total';
END $$;

-- Verify
SELECT u.unit_number, u.title, COUNT(a.id) as activities
FROM public.units u
JOIN public.unit_activities a ON a.unit_id = u.id
WHERE u.program_id = 'va'
GROUP BY u.unit_number, u.title
ORDER BY u.unit_number;
