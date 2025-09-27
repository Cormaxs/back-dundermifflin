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
const API_ENDPOINT = 'http://localhost:3000/books/';
// Reemplaza este valor con el ID de usuario real
const USER_ID = '68af7730a043f5bcd5cae2e5';

// Datos de los documentos a subir. Puedes agregar más líneas.
const bookDataString = ``;

// Llamar a la función principal para iniciar el proceso de carga
uploadBooksAndComics(API_ENDPOINT, USER_ID, bookDataString);