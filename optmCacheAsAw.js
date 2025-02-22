////////////////////////////////////////////////////////////////////////
//
//
// PLANTILLA: OPTIMIZACION CACHE (version con async/await)
// sirve para decargar libreria q5 en memoria local
//
// version sin comentarios (menos spam, pero se pierde el chisme):
// https://github.com/mj-una/tutorial-q5-iframes/blob/limpio/optmCacheAsAw.js 
//
//////////////////////////////////

/* ~ */ /* ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  **  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ */ /* ~ */
/* ~ */ /* ~ ~ ~ ~ ~ ~ ~ Ajuste De La Url ~ ~ ~ ~ ~ ~ ~ */ /* ~ */
/* ~ */ /*                                              */ /* ~ */
/* ~ */ /*                                              */ /* ~ */
/* ~ */ /*     Copia y pega el link de q5, que esta     */ /* ~ */
/* ~ */ /*  en la etiqueta <script> del head tus html.  */ /* ~ */
/* ~ */                                                    /* ~ */
const URL_Q5 = "https://q5js.org/q5.js";
/* ~ */                                                    /* ~ */
/* ~ */ /*                                              */ /* ~ */
/* ~ */ /*     P.D: estoy preparando otro codigo        */ /* ~ */
/* ~ */ /*    con un worker multitasking precarizado    */ /* ~ */
/* ~ */ /*   que maneje varios links al mismo tiempo,   */ /* ~ */
/* ~ */ /*     pero voy paso a paso, pq asincronia.     */ /* ~ */
/* ~ */ /*                                              */ /* ~ */
/* ~ */ /*                                              */ /* ~ */
/* ~ */ /* ~ El Event Loop De JS Es Una Obra De Harte ~ */ /* ~ */
/* ~ */ /* ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  **  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ */ /* ~ */

//////////////////////////////////
// manejador evento install
async function escribirCache(evento) {
  
  // waitUntil asegura que todas las tareas se terminen de ejecutar
  // antes de que termine el evento install. en este caso descargar q5
  evento.waitUntil( // *recibe una promesa (aprender "asincronia") !!!
    (async () => { // *invocacion inmediata (aprender "funciones iife")

      // el objeto "caches" es parte de la api "cache storage"
      // y permite escribir/leer recursos en memoria local del navegador.
      // es en plural ("caches") porque contiene varios compartimientos...
      // ...diferenciables segun un nombre (en este caso: "cache-q5-iframes")
      const cache = await caches.open("cache-q5-iframes"); // #PROMESA
      console.log("[wrkr log: 1] cache abierta! agregando la librería!");

      // descarga codigo desde la url y lo guarda en memoria
      // (internamente hace: "fetch" y luego "cache.put")
      return await cache.add(URL_Q5); // #PROMESA FINAL que recibe waitUntil
    })() // * funcion iife
  );
};

//////////////////////////////////
// manejador evento fetch
async function interceptarSolicitud(evento) {

  // verificar destino de la solicitud.
  // en caso que NO se trate del link de la libreria: se continua fetch
  if (evento.request.url !== URL_Q5) return;

  // en caso contrario (la url coincide): se intercepta la solicitud
  // y se intenta responder con informacion desde la cache (sin fetch)

  evento.respondWith( // *recibe una promesa (aprender "asincronia")
    (async () => { // *invocacion inmediata (aprender "funciones iife")

      // revisa que exista la misma solicitud
      const respuesta0 = await caches.match(evento.request); // #PROMESA 0

      // si existe...
      if (respuesta0) {
        console.log(`[wrkr log: 2] leyendo ${evento.request.url} desde cache!`);
        return respuesta0; // ...se retorna la copia de cache
      }

      // si no existe, hubo algun error...
      console.log(`[wrkr log: 3] error con ${evento.request.url}. manejo:`);
      
      // ...y se intenta resolver con un nuevo fetch
      try { // #caso okiii

				// repetir solicitud
        const respuesta1 = await fetch(evento.request); // #PROMESA 1
        console.log("[wrkr log: 3.1] resolviendo. nueva solicitud enviada!");

        // intenta acceder al compartimiento de la cache...
        const cache = await caches.open("cache-q5-iframes"); // #PROMESA 2
        console.log("[wrkr log: 3.2] resolviendo. almacenando respuesta!");

        // ...y lo sobreescribe. se usa clone para fijar texto temporal
        // pq fetch ("respuesta1") es un flujo de datos, para una sola lectura
        await cache.put(evento.request, respuesta1.clone()); // #PROMESA 3
        console.log("[wrkr log: 3.3] todo oki. problema resuelto!");

        // se resuleve fetch con nueva respuesta recibida
        return respuesta1; // finalmente respondWith recibe PROMESA 1
      }
			catch (error) { // #caso nottt
        console.error("[wrkr log: 3] no se pudo resolver. error:\n", error);
      }
    })() // *funcion iife
  );
};

//////////////////////////////////
// EVENTOS INICIADORES DE EJECUCION

// instalacion del worker (primera solicitud)
self.addEventListener("install", escribirCache);

// intercepcion solicitudes de red (para evitar repeticion)
self.addEventListener("fetch", interceptarSolicitud);

//
//
// fin de la plantilla <3
//
////////////////////////////////////////////////////////////////////////