// Este script se encarga de subir datos de libros y cómics a un endpoint API.
// Utiliza la API fetch para realizar una solicitud POST.
// Ha sido modificado para enriquecer los datos del libro/cómic
// usando múltiples APIs de búsqueda de libros y cómics para una mayor precisión.

/**
 * Función asincrónica para subir datos de libros y cómics a una API.
 * @param {string} endpoint - La URL de la API a la que se enviarán los datos.
 * @param {string} userId - El ID del usuario que crea los documentos.
 * @param {string} dataString - Una cadena de texto con los datos.
 * Cada línea debe contener el título y el enlace, separados por un espacio.
 * Los campos opcionales como autor y tipo de archivo se infieren.
 */
async function uploadBooksAndComics(endpoint, userId, dataString) {
  // Manejo de errores para la URL del endpoint
  if (!endpoint) {
    console.error("Error: Se requiere una URL de endpoint.");
    return;
  }

  // Manejo de errores para el ID de usuario
  if (!userId) {
    console.error("Error: Se requiere un ID de usuario.");
    return;
  }

  // Dividir la cadena de datos en líneas
  const lines = dataString.split('\n').filter(line => line.trim() !== '');

  /**
   * Realiza una búsqueda en la API de Google Books para obtener metadatos.
   * @param {string} query - El término de búsqueda (ej. título del documento).
   * @returns {object|null} Un objeto con los metadatos, o null si no se encuentra.
   */
  async function searchGoogleBooks(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0].volumeInfo;
        const resultTitle = item.title ? item.title.toLowerCase() : '';
        const queryLower = query.toLowerCase();

        // Verificación de similitud básica del título
        if (resultTitle.includes(queryLower) || queryLower.includes(resultTitle)) {
          const portada = item.imageLinks?.large || item.imageLinks?.thumbnail || 'https://placehold.co/600x400/000000/FFFFFF?text=Sin+Portada';
          return {
            titulo: item.title || 'Título Desconocido',
            portada: portada,
            sinopsis: item.description || 'Sin sinopsis disponible.',
            autor: item.authors?.join(', ') || 'Autor Desconocido',
            categorias: item.categories || ['Sin Categoria'],
          };
        }
      }
    } catch (error) {
      console.error("Error al buscar en la API de Google Books:", error);
    }
    return null;
  }

  /**
   * Realiza una búsqueda en la API de Open Library para obtener metadatos.
   * @param {string} query - El término de búsqueda (ej. título del documento).
   * @returns {object|null} Un objeto con los metadatos, o null si no se encuentra.
   */
  async function searchOpenLibrary(query) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.docs && data.docs.length > 0) {
        const item = data.docs[0];
        const resultTitle = item.title ? item.title.toLowerCase() : '';
        const queryLower = query.toLowerCase();

        // Verificación de similitud básica del título
        if (resultTitle.includes(queryLower) || queryLower.includes(resultTitle)) {
          const portada = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : 'https://placehold.co/600x400/000000/FFFFFF?text=Sin+Portada';
          return {
            titulo: item.title || 'Título Desconocido',
            portada: portada,
            sinopsis: item.subtitle || 'Sin sinopsis disponible.',
            autor: item.author_name?.join(', ') || 'Autor Desconocido',
            categorias: item.subject || ['Sin Categoria'],
          };
        }
      }
    } catch (error) {
      console.error("Error al buscar en la API de Open Library:", error);
    }
    return null;
  }

  /**
   * Realiza una búsqueda en la API de Comic Vine para obtener metadatos y portadas de cómics.
   * @param {string} query - El término de búsqueda (ej. título del cómic).
   * @returns {object|null} Un objeto con los metadatos, o null si no se encuentra.
   */
  async function searchComicVine(query) {
    // Reemplaza 'TU_API_KEY_AQUI' con la clave que obtengas de Comic Vine
    const apiKey = 'TU_API_KEY_AQUI'; 
    const url = `https://comicvine.gamespot.com/api/search/?api_key=${apiKey}&format=json&resources=issue&query=${encodeURIComponent(query)}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const item = data.results[0];
            const portada = item.image?.original_url || 'https://placehold.co/600x400/000000/FFFFFF?text=Sin+Portada';
            
            return {
                titulo: item.volume?.name || 'Título Desconocido',
                portada: portada,
                sinopsis: item.description || 'Sin sinopsis disponible.',
                autor: 'Autor Desconocido', // La API de Comic Vine maneja los créditos de manera más compleja
                categorias: ['Cómic', item.volume?.publisher?.name].filter(Boolean),
            };
        }
    } catch (error) {
        console.error("Error al buscar en la API de Comic Vine:", error);
    }
    return null;
  }

  // Procesar cada línea de forma asincrónica
  for (const line of lines) {
    // Expresión regular para extraer el nombre de archivo completo, el autor (opcional) y el enlace.
    const regex = /(.*?)(?:autor\s(.*))?\s(https:\/\/.*)/;
    const match = line.match(regex);

    // Si la línea no coincide con el formato esperado, se salta
    if (!match) {
      console.warn(`Advertencia: La línea no tiene el formato esperado y será omitida: "${line}"`);
      continue;
    }

    // Desestructuración de los grupos capturados por la expresión regular
    const [, nombreArchivoCompleto, autor, link] = match;

    // --- Lógica de sanitización para mejorar la búsqueda del título y capturar el número de ejemplar ---
    let searchTitle = nombreArchivoCompleto.trim();
    let issueNumber = null;
    let fileExtension = '';

    // Separar el nombre del archivo de su extensión
    const lastDotIndex = searchTitle.lastIndexOf('.');
    if (lastDotIndex !== -1) {
        fileExtension = searchTitle.substring(lastDotIndex + 1);
        searchTitle = searchTitle.substring(0, lastDotIndex);
    }
    
    // Buscar y capturar el número del cómic (ej. #141)
    const issueRegex = /#(\d+)/;
    const issueMatch = searchTitle.match(issueRegex);
    if (issueMatch) {
      issueNumber = parseInt(issueMatch[1], 10);
      // Reemplazar '#número' por ' número' para el nombre de archivo final
      searchTitle = searchTitle.replace(issueRegex, ` ${issueNumber}`);
    }

    // Eliminar texto entre paréntesis (ej. "(1986)", "(Vol 1)")
    searchTitle = searchTitle.replace(/\s*\([^)]*\)\s*/g, ' ');

    // Eliminar texto entre corchetes (ej. "[Digital]", "[DC Comics]")
    searchTitle = searchTitle.replace(/\s*\[[^\]]*\]\s*/g, ' ');

    // Eliminar números de serie (ej. "01", "002") al inicio del nombre si no es un número de ejemplar
    if (!issueNumber) {
        searchTitle = searchTitle.replace(/^\s*\d{1,3}\s*/, ' ');
    }
    
    // Reemplazar guiones, guiones bajos, y puntos con espacios
    searchTitle = searchTitle.replace(/[-_.]/g, ' ');

    // Si la cadena de entrada incluía un autor, removerlo de la búsqueda
    if (autor) {
      const autorKeyword = "autor " + autor.trim();
      const index = searchTitle.toLowerCase().indexOf(autorKeyword.toLowerCase());
      if (index !== -1) {
        searchTitle = searchTitle.substring(0, index).trim();
      }
    }
    
    // Limpiar espacios extra
    searchTitle = searchTitle.trim();
    
    let enrichedData = null;
    const fileTypeUpper = fileExtension.toUpperCase();
    const isComic = fileTypeUpper === 'CBR' || fileTypeUpper === 'CBZ';

    // Lógica de búsqueda mejorada: usar Comic Vine para cómics
    if (isComic) {
        enrichedData = await searchComicVine(searchTitle);
    }
    
    // Si la búsqueda inicial no funcionó o no era un cómic, probar con Google Books
    if (!enrichedData) {
      enrichedData = await searchGoogleBooks(searchTitle);
    }

    // Si Google Books no devuelve resultados, probar con Open Library
    if (!enrichedData) {
      enrichedData = await searchOpenLibrary(searchTitle);
    }

    // Asignar el autor y la portada si los datos enriquecidos existen
    const autorFinal = (enrichedData && enrichedData.autor !== 'Autor Desconocido') ? enrichedData.autor : 'Autor Desconocido';
    const portadaFinal = (enrichedData && enrichedData.portada !== 'https://placehold.co/600x400/000000/FFFFFF?text=Sin+Portada') ? enrichedData.portada : 'https://placehold.co/600x400/000000/FFFFFF?text=Sin+Portada';
    const sinopsisFinal = enrichedData ? enrichedData.sinopsis : 'Sin sinopsis disponible.';
    const categoriasFinal = enrichedData ? enrichedData.categorias : ['Sin Categoria'];

    // Crear el nombre de archivo formateado
    const formattedFileName = `${searchTitle} ${issueNumber ? issueNumber : ''}.${fileExtension}`.trim();
    
    // Crear el objeto del libro/cómic, combinando los datos enriquecidos con los de la entrada.
    const documentData = {
      titulo: searchTitle, // Usamos el título sanitizado para la búsqueda
      portada: portadaFinal,
      sinopsis: sinopsisFinal,
      autor: autorFinal,
      categorias: categoriasFinal,
      link: link.trim(),
      fileType: fileTypeUpper || 'PDF',
      creator: userId,
      issueNumber: issueNumber,
      // Nuevo campo para el nombre de archivo formateado
      formattedFileName: formattedFileName,
    };

    try {
      // Realizar la solicitud POST a la API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Documento subido con éxito: "${documentData.titulo}"`);
      console.log(`Nombre de archivo formateado: "${documentData.formattedFileName}"`);

    } catch (error) {
      console.error(`Error al subir el documento "${documentData.titulo}":`, error);
    }
  }
}

// --- CONFIGURACIÓN Y EJECUCIÓN ---

// Reemplaza esta URL con el endpoint de tu API
const API_ENDPOINT = 'http://localhost:3001/books/';
// Reemplaza este valor con el ID de usuario real
const USER_ID = '68af7730a043f5bcd5cae2e5';

// Datos de los documentos a subir. Puedes agregar más líneas.
const bookDataString = `Programaci-n-con-PHP-Christian-Pelissier-Q.pdf	https://drive.google.com/file/d/12xqZMCbpbamnBe97U8VrLlxeVfJZ0aIe/view?usp=drivesdk
Introducci-n-a-la-Programaci-n-Javier-Pino-Herrera-Patricia-Mart-nez-Moreno.pdf	https://drive.google.com/file/d/1NouutC9Op8CmQElBOMDJPH9Xk7P8QlHX/view?usp=drivesdk
programacion-en-php-a-traves-de-ejemplos-ingenieria-tecnica-en-informatica-de-gestion-5393.pdf	https://drive.google.com/file/d/1D7KFlONz6gYJo7agt5BQw_1fg71tmXdZ/view?usp=drivesdk
fundamentos-basicos-de-programacion-en-c-francisco-martinez-del-rio-5392.pdf	https://drive.google.com/file/d/1IztdyVeSWUdTRYgmXZ1FDfuEVqQ4yB0N/view?usp=drivesdk
Gu-a-de-aprendizaje-de-Programacion-Joe-Llerena-Izquierdo.pdf	https://drive.google.com/file/d/1ciMoI7q9Y4Yvik_pRY6Zx0qPKNVEcm5C/view?usp=drivesdk
Algoritmos-y-programaci-n-gu-a-para-docentes-Juan-Carlos-L-pez-Garc-a.pdf	https://drive.google.com/file/d/1Mxw4mJaX9yiQrFw-5J9CZSjTXW2Zq8ov/view?usp=drivesdk
algoritmos-y-estructuras-de-datos-en-python-walter-bel-uader-5384.pdf	https://drive.google.com/file/d/1Y9W9tnNhIvl47tAue4ceKADIAYEDUk-O/view?usp=drivesdk
Fundamentos-iniciales-de-l-gica-de-programaci-n-I-Jairo-Hernando-Ram-rez-Mar-n.pdf	https://drive.google.com/file/d/1Xv365Js_1Tjfy1fsL9eCydN3_ZUWEgNF/view?usp=drivesdk
Introducci-n-a-la-Programaci-n-Aristides-Dasso-Ana-Funes.pdf	https://drive.google.com/file/d/1wY3_noI8WUOFaC3LDYgbSzVfQCgCS9Gh/view?usp=drivesdk
El-Lenguaje-de-programaci-n-C-Universidade-da-Coru-a.pdf	https://drive.google.com/file/d/1OTZ0LirzgL2dntV9bsOXme9COnIb7v02/view?usp=drivesdk
Programaci-n-I-Aprender-programaci-n-orientada-a-objetos-desde-cero-Dra.-Ing.-In-s-Friss-de-Kereki.pdf	https://drive.google.com/file/d/1oOE0egrYVL574a_-gVs-LyIKgo_FrhQx/view?usp=drivesdk
Introducci-n-a-JavaScript-Javier-Egu-luz-P-rez.pdf	https://drive.google.com/file/d/18llR5Kplr5KDb7Vy_7RVmmHbDKOJNjmO/view?usp=drivesdk
Algoritmos-resueltos-con-Python-Enrique-Edgardo-Condor-Tinoco-Marco-Antonio-De-la-cruz-Rocca.pdf	https://drive.google.com/file/d/1IBdo6Ar1WMYaRcJq7LWtVenhK3MUAhJn/view?usp=drivesdk
01.-Lenguajes-de-programaci-n-autor-Virtuniversidad.pdf	https://drive.google.com/file/d/1PBAhar7WSvujYAYiFUroXeKCpPyZTF89/view?usp=drivesdk
fundamentos-de-la-programacion-en-java-javier-pino-patricia-martinez-jose-antonio-vergara-5389.pdf	https://drive.google.com/file/d/10D7oQQjKiOgfPEdCfs6d_Brjjg0qXGCI/view?usp=drivesdk
02.-Lenguaje-C-autor-Enrique-Vicente-Bonet-Esteban.pdf	https://drive.google.com/file/d/1aWJpFP0sAtGFxa-gd5bCUmPUYHc0tZ4e/view?usp=drivesdk
programacion-orientada-a-objetos-ricardo-perez-lopez-5383.pdf	https://drive.google.com/file/d/1qSZ5VaZ1x0F5wn7oUnaWM73UlqQZQm3f/view?usp=drivesdk
12.-JavaScript-autor-Rafael-Men-ndez-Barzanallana-Asensio.pdf	https://drive.google.com/file/d/1ISlb0x5fUKM-Iu7xoqzoAgl3XHW-M5N6/view?usp=drivesdk
Aprenda-a-Pensar-Como-un-Programador-con-Python-Allen-Downey-Jeffrey-Elkner-Chris-Meyers.pdf	https://drive.google.com/file/d/1oZssbWXp51IbhZb-1z4NvrkdpKNneGva/view?usp=drivesdk
algoritmos-resueltos-con-diagramas-de-flujo-y-pseudocodigo-francisco-javier-pinales-delgado-cesar-eduardo-velazquez-amador-5386.pdf	https://drive.google.com/file/d/1wfed7V49Li2w01-Lr-QNPCqg1_4mb0vn/view?usp=drivesdk
javascript-desde-cero-elhacker-info-5391.pdf	https://drive.google.com/file/d/1heJqxBZQNtuCdFztGJ0n4A8WwhM8h9bX/view?usp=drivesdk
Orientacion-a-Objetos-en-Javascript-Marcos-Gonz-lez-Sancho-Vicent-Moncho-Mas-Jordi-Ustrell-Garrig-s.pdf	https://drive.google.com/file/d/1d1-tO47Az0eM8oNJep_3aKZrsj7eOoRZ/view?usp=drivesdk
programacion-orientada-a-objetos-usando-java-hector-arturo-florez-fernandez-5380.pdf	https://drive.google.com/file/d/12FrCswFItLKWE-NfM5vztdePFv-3Q6KF/view?usp=drivesdk
Manipulando-el-DOM-con-Javascript-Vicent-Moncho-Mas-Gemma-Subirana-Grau.pdf	https://drive.google.com/file/d/1G1fIjhIW4c_hx11ezwFZOJZ_ApS5fAdk/view?usp=drivesdk
Programaci-n-Web-del-Frontend-al-Backend-Ricardo-Javier-Cel-P-rraga-Miguel-Fabricio-Bon-Andrade-Aldo-Patricio-Mora-Olivero.pdf	https://drive.google.com/file/d/1UX-271UQrZzcIPf153fuc9gK0GrpDRjS/view?usp=drivesdk
Fundamentos-de-la-programaci-n-Luis-Hern-ndez-Y-nez.pdf	https://drive.google.com/file/d/1SLosGYuaIGHVrtsprcrXyog-TSslD2L_/view?usp=drivesdk
10.-Java2-autor-Jorge-S-nchez.pdf	https://drive.google.com/file/d/1ptZz9LbR7GV-QJhEVdt8Kt4Yq5zkajRR/view?usp=drivesdk
apuntes-de-estructuras-de-datos-y-algoritmos-javier-campos-5387.pdf	https://drive.google.com/file/d/1eFbe36uCw8ZAypgiFgUgtKfnRzSJ4XUo/view?usp=drivesdk
20.-Programador-PHP-Eugenia-Bahit.pdf	https://drive.google.com/file/d/1pjlmq9Atv6-6qb7mPCUy_1SAtF1y6OWG/view?usp=drivesdk
08.-Fundamentos-de-programaci-n-en-Java-autor-Jorge-Martinez-Ladr-n-de-Guevara.pdf	https://drive.google.com/file/d/1w_t_KI88KXxLSNUNvrUm1-V66yF4bODp/view?usp=drivesdk
Fundamentos-l-gicos-de-la-programaci-n-J.-I.-Garc-a-Garc-a-P.-A.-Garc-a-Sanchez-J.-M.-Urbano-Blanco.pdf	https://drive.google.com/file/d/11WZ-9FBNTcEFR5lesvuSDAb0AzQty9vs/view?usp=drivesdk
Introduccion-a-la-Programaci-n-lvarez-Escudero-Juan-Jes-s-Andrade-Rodr-guez-Silvia-Alejandra-Becerril-Palma-Marco-Antonio.pdf	https://drive.google.com/file/d/13GoU9qWWEKW_v3XeJWmuPaeo0ZuK131Y/view?usp=drivesdk
21.-Taller-de-PHP-autor-Tutoriales.com.pdf	https://drive.google.com/file/d/1PW3Q1DOG5x5dW8sNeKb2snASfmw6Fhuh/view?usp=drivesdk
24.-Introducci-n-a-la-Programaci-n-con-Python-autor-Andr-s-Marzal-e-Isabel-Gracia.pdf	https://drive.google.com/file/d/1-FUcl9xR9Xn0VR6hOZT1oBX9sVADZfNh/view?usp=drivesdk
Lenguaje-C-Eduardo-Grosclaude.pdf	https://drive.google.com/file/d/1e7-27BEHdP3Bpm3XSqGH4ZnKG8_StiS8/view?usp=drivesdk
L-gica-de-programaci-n-Camilo-Augusto-Cardona-Pati-o.pdf	https://drive.google.com/file/d/1uu5OP2qOzpK0ABIx96f_JxKmlEDKaOjt/view?usp=drivesdk
fundamentos-de-programacion-orientada-a-objetos-poo-andres-marcelo-salinas-copo-et-al-5382.pdf	https://drive.google.com/file/d/1sjg4JqSZM_I9q39W3o4wJUvcQKI_GKBf/view?usp=drivesdk
Python-para-todos-Ra-l-Gonz-lez-Duque.pdf	https://drive.google.com/file/d/1vnkyyjqXKaIceqHPKVw1VWCX7ojlQgZA/view?usp=drivesdk
Gu-a-te-rica-de-l-gica-de-programaci-n-Uneweb.pdf	https://drive.google.com/file/d/12cJRF48ikWv2sJnPm--zNV45O1-6VUSM/view?usp=drivesdk
09.-Java-desde-Cero-autor-UNAM.pdf	https://drive.google.com/file/d/15AxwVBdO_-C1bqL5fiHYxzhvJ4XqOtSn/view?usp=drivesdk
Aprende-Python-Sergio-Delgado-Quintero.pdf	https://drive.google.com/file/d/1JEK28wKWLdAWlsh1pobvsB2mcENhOSYT/view?usp=drivesdk
Introducci-n-a-la-programaci-n-con-Python-3-Andr-s-Marzal-Var-Isabel-Gracia-Luengo-Pedro-Garc-a-Sevilla.pdf	https://drive.google.com/file/d/17IGRTVhnZKUrP8oOOZToQB8mwKsDZ10r/view?usp=drivesdk
java-basico-para-aprendices-editorial-eidec-5390.pdf	https://drive.google.com/file/d/1bXLxNvF7HFRnfmCUyZpPSnLhA-mpb6p4/view?usp=drivesdk
aprende-logica-de-programacion-jesus-ormaza-5388.pdf	https://drive.google.com/file/d/1SgMg_nv1TnlYaUCzK2yaJpxAOJxKGm3K/view?usp=drivesdk
algoritmos-y-estructuras-de-datos-mario-storti-jorge-d-elia-rodrigo-paz-lisandro-dalcin-martin-pucheta-5385.pdf	https://drive.google.com/file/d/14q3lFva3EuYElwv98-JZuv72AGPPWEaX/view?usp=drivesdk
05.-Curso-de-programaci-n-en-C-autor-Sergio-Talens-Oliag.pdf	https://drive.google.com/file/d/1Tm0X9CSwLsuIasuHC1cO6Lf-20YTLf7D/view?usp=drivesdk
Caminando-junto-al-lenguaje-C-Mart-n-Goin.pdf	https://drive.google.com/file/d/1eC0SXGE5eooD75frsqELP-edEG1ueC_n/view?usp=drivesdk
23.-Python-para-todos-autor-Charles-R.-Severance.pdf	https://drive.google.com/file/d/1ODfF3M2CixluYrqlOwPx2lrqyPd0BKus/view?usp=drivesdk
Introducci-n-a-los-lenguajes-y-paradigmas-de-programaci-n-Corso-Cynthia-Frias-Pablo-Guzman-Analia.pdf	https://drive.google.com/file/d/1LaB2cB5dAGCrI9DR1yvlsuCOKN7hwGsk/view?usp=drivesdk
Programaci-n-en-C-para-ingenieros-electr-nicos-Ana-Estela-Ruiz-Linares.pdf	https://drive.google.com/file/d/1ltY8kwHYRbUGMAB_xey7Gsco29tHa9Ds/view?usp=drivesdk
	`;

// Llamar a la función principal para iniciar el proceso de carga
uploadBooksAndComics(API_ENDPOINT, USER_ID, bookDataString);