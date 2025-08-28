// Este script se encarga de subir datos de libros a un endpoint API.
// Utiliza la API fetch para realizar una solicitud POST.
// Ha sido modificado para enriquecer los datos del libro
// usando múltiples APIs de búsqueda de libros para una mayor precisión.

/**
 * Función asincrónica para subir datos de libros a una API.
 * @param {string} endpoint - La URL de la API a la que se enviarán los datos.
 * @param {string} userId - El ID del usuario que crea los libros.
 * @param {string} dataString - Una cadena de texto con los datos de los libros.
 * Cada línea debe contener el título y el enlace, separados por un espacio.
 * Los campos opcionales como autor y tipo de archivo se infieren.
 */
async function uploadBooks(endpoint, userId, dataString) {
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
     * Realiza una búsqueda en la API de Google Books para obtener metadatos de un libro.
     * @param {string} query - El término de búsqueda (ej. título del libro).
     * @returns {object|null} Un objeto con los metadatos del libro, o null si no se encuentra.
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
            // Usar 'large' si está disponible, de lo contrario, usar 'thumbnail'
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
     * Realiza una búsqueda en la API de Open Library para obtener metadatos de un libro.
     * @param {string} query - El término de búsqueda (ej. título del libro).
     * @returns {object|null} Un objeto con los metadatos del libro, o null si no se encuentra.
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
            // Usar 'L' para obtener una imagen de mayor resolución
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
  
      // --- Lógica de sanitización para mejorar la búsqueda y el título del libro ---
      let bookTitle = nombreArchivoCompleto.trim();
  
      // Quitar la extensión del archivo (la parte después del último punto)
      const lastDotIndex = bookTitle.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        bookTitle = bookTitle.substring(0, lastDotIndex);
      }
  
      // Reemplazar guiones y guiones bajos con espacios
      bookTitle = bookTitle.replace(/[-_]/g, ' ');
  
      // Eliminar cualquier texto entre paréntesis (como "(1)")
      bookTitle = bookTitle.replace(/\s*\(\d+\)\s*/g, '');
  
      // Decodificar caracteres especiales como 'ón'
      bookTitle = bookTitle.replace('c3b3n', 'ón');
  
      // Si la cadena de entrada incluía un autor, removerlo de la búsqueda
      if (autor) {
        const autorKeyword = "autor " + autor.trim();
        const index = bookTitle.toLowerCase().indexOf(autorKeyword.toLowerCase());
        if (index !== -1) {
          bookTitle = bookTitle.substring(0, index).trim();
        }
      }
  
      // Obtener datos enriquecidos de la API de Google Books
      let enrichedData = await searchGoogleBooks(bookTitle);
  
      // Si Google Books no devuelve resultados, probar con Open Library
      if (!enrichedData) {
        enrichedData = await searchOpenLibrary(bookTitle);
      }
      
      // Asignar el autor y la portada si los datos enriquecidos existen y son fiables
      const autorFinal = (enrichedData && enrichedData.autor !== 'Autor Desconocido') ? enrichedData.autor : 'Autor Desconocido';
      const portadaFinal = (enrichedData && enrichedData.portada !== 'https://placehold.co/600x400/000000/FFFFFF?text=Sin+Portada') ? enrichedData.portada : 'https://placehold.co/600x400/000000/FFFFFF?text=Sin+Portada';
      const sinopsisFinal = enrichedData ? enrichedData.sinopsis : 'Sin sinopsis disponible.';
      const categoriasFinal = enrichedData ? enrichedData.categorias : ['Sin Categoria'];
  
      // Crear el objeto del libro, combinando los datos enriquecidos con los predeterminados y los de la entrada.
      const bookData = {
        titulo: bookTitle,
        portada: portadaFinal,
        sinopsis: sinopsisFinal,
        autor: autorFinal,
        categorias: categoriasFinal,
        link: link.trim(),
        fileType: nombreArchivoCompleto.split('.').pop().toUpperCase() || 'UNKNOWN',
        creator: userId,
      };
  
      try {
        // Realizar la solicitud POST a la API
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookData),
        });
  
        // Verificar si la respuesta es exitosa
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
  
        const result = await response.json();
        console.log(`Libro subido con éxito: "${bookData.titulo}"`, result);
  
      } catch (error) {
        console.error(`Error al subir el libro "${bookData.titulo}":`, error);
      }
    }
  }
  
  // --- CONFIGURACIÓN Y EJECUCIÓN ---
  
  // Reemplaza esta URL con el endpoint de tu API
  const API_ENDPOINT = 'http://localhost:3000/books/';
  // Reemplaza este valor con el ID de usuario real
  const USER_ID = '68af7730a043f5bcd5cae2e5';
  
  // Datos de los libros a subir. Puedes agregar más líneas.
  const bookDataString = `Fotografía artística autor Daniel Enrique Monje.pdf https://drive.google.com/file/d/1T_mbDOEpzyHOF702e_Doyk6QVZyZAWjs/view?usp=drivesdk
  Técnica Fotográfica. Fotografía Nocturna I autor Jggomez.eu.pdf https://drive.google.com/file/d/1S1sQbI89DHjWj5qC6W2XEZsphvdX2nZU/view?usp=drivesdk
  Photography Module 2, CBSE.pdf https://drive.google.com/file/d/1mvLcI1aCSf2ipCBAvZ1rhoPJHGkuK7Vb/view?usp=drivesdk
  Ajsustes de la Cámara, Fundación Colorearte.pdf https://drive.google.com/file/d/13thNNv3I7fCALsdlBttamo7EX-mUbqyk/view?usp=drivesdk
  Producción fotográfica de alimentos autor Ricardo R. Aguilar.pdf https://drive.google.com/file/d/1yGtwa-nSL6fCuTJ1TzSXRmnWyMcywqus/view?usp=drivesdk
  Fotografía con Móvil, La Cámara Roja.pdf https://drive.google.com/file/d/1iNS_anvSh90-hBIyt1UrCe-TVziqpBBt/view?usp=drivesdk
  Curso de fotografía digital (presentación) autor Jose I. Moral Rodríguez.pdf https://drive.google.com/file/d/11hqnv8w83dkwx4dvMpyrCWCildm9qvDB/view?usp=drivesdk
  Manual Práctico de Fotografía, Departamento de Fotografía de I.N.I.C.E..pdf https://drive.google.com/file/d/1jYsJRb_fsC4Zk9Lcwt3P3dPJgWN6IzZq/view?usp=drivesdk
  Dirección de fotografía. Basic training autor Proa.es.pdf https://drive.google.com/file/d/1oIH1dXCDN48ySseX4iYCqPLuHepQ-reu/view?usp=drivesdk
  Cámara e Iluminación, Javier Valenzuela.pdf https://drive.google.com/file/d/1bcSDUBlVoYopdPD9oFDJBI69ruuKrv2v/view?usp=drivesdk
  Taller de composición e iluminación de estudio autor Alfonso Bustos Toldos.pdf https://drive.google.com/file/d/17pWrP1OfNOfvFyvDVgHiAFLHVZwqRC1M/view?usp=drivesdk
  Iluminación de retrato en estudio autor Efraím Sánchez-Gil Morente.pdf https://drive.google.com/file/d/14x7EDr9Okza6nEwoHdDQ1valCnKPtyuH/view?usp=drivesdk
  Consejos para Realizar Fotos de Comidas Tentadoras autor Alison Lyons.pdf https://drive.google.com/file/d/1m03vGQ1mPUUjMTW_7guifnudbrdJe98V/view?usp=drivesdk
  Fotografía de Productos, Instituto de Formación Femenina Integral.pdf https://drive.google.com/file/d/1BwhikcoFzpOa6snXuczi4o18jjv8B5nP/view?usp=drivesdk
  Introducción a la Fotografía Digital,Repositorio CATIE.pdf https://drive.google.com/file/d/1ZbKqy55S2Qc7lA9ZJ517szCDH7YHnenT/view?usp=drivesdk
  7 errores fatales del fotógrafo amateur autor Luis Angel Cruz.pdf https://drive.google.com/file/d/1LRqOkWeKu7FBOpC0gxKyFJHAhqYUrKxF/view?usp=drivesdk
  Edición y Corrección Fotográfica, Luis Gabriel Mondragón Torres.pdf https://drive.google.com/file/d/15LPowywDpPqHhuzz0mU-jIvQDH8FKaOV/view?usp=drivesdk
  Domina tu réflex autor El mundo a traves de un visor.pdf https://drive.google.com/file/d/1pGk4_BVO3gnpGkzj2bA6Gq6Zid7HyPsG/view?usp=drivesdk
  Cómo hacer mejores fotos digitales autor Olga Díez Fernández y Alicia García Holgado. https://drive.google.com/file/d/1djMVG1CLW_ihQMXjiQh7A8UHW6MMIGVS/view?usp=drivesdk
  Manejo de la cámara, pierde el miedo al modo manual autor Germán Gutiérrez.pdf https://drive.google.com/file/d/1CuAeh-FUXqpVHTqZvjAmPkEbl_nAYCu4/view?usp=drivesdk
  Fundamentos básicos de la fotografía, Beatriz Guerrero González-Valerio y Daniel Cabahttps://drive.google.com/file/d/1si6WcQL2Ipfj2grd67zM3z8t5VBRbkON/view?usp=drivesdk
  Curso de Macrofotografía, Fran Nieto.pdf https://drive.google.com/file/d/1MmRUukC-efz5gY9ChcXqFoZ-3Nx9lbfy/view?usp=drivesdk
  La Cámara Digital, Antoni Marín Amatller.pdf https://drive.google.com/file/d/1IFO1EsBKKrav-Og5fyiPizjtaEGxH8x8/view?usp=drivesdk
  Fundamentos de fotografía digital autor Efraín García y Rubén Osuna.pdf https://drive.google.com/file/d/11weLCfMo23PmeEjoeAkW3wXHUN8JRBVp/view?usp=drivesdk
  Apuntes de un curso de fotografía para niños autor Nacho Montorio.pdf https://drive.google.com/file/d/1zNIgAwZxGWzt_8J0c8Qs-f_IUAy4DoQa/view?usp=drivesdk
  Fotografía avanzada de arquitectura, Jose Manuel Rodríguez Román.pdf https://drive.google.com/file/d/1xt-UCBT9zlDgz5zucN5b8Azv1NYN1RMZ/view?usp=drivesdk
  Introducción a la fotografía digital autor Universidad Veracruzana.pdf https://drive.google.com/file/d/1J4E_-2g9yRhB47HIyOSuAxl-Iba-24UF/view?usp=drivesdk
  El arte de la composición, Runbenguo.pdf https://drive.google.com/file/d/18Rxvm0fSun_f5VWSZkUMETkFOiTyxeyA/view?usp=drivesdk
  El Arte de la Fotografía, Premis Recerca UVic.pdf https://drive.google.com/file/d/1Z8IQWS7nqn-o_6rH4T7wiH2mYzR4T60P/view?usp=drivesdk
  Cómo tomar fotografías de productos por ti mismo autor Holly Cardew.pdf https://drive.google.com/file/d/1dBfcZPQam1AtIDGYbejsFE_Q8lCgtoOP/view?usp=drivesdk
  Historia de la fotografía de moda autor Concha Casajus.pdf https://drive.google.com/file/d/1-aid2enGV4QibtHUlW1hx9c_8yJCtJeh/view?usp=drivesdk
  La fotografía digital a su alcance autor Canon.pdf https://drive.google.com/file/d/1gse300Cjbfy2JtOp3yDhcDmgAfumYCT-/view?usp=drivesdk
  Introduccion a la Fotografía Macro, Juan Cesar Jover.pdf https://drive.google.com/file/d/1yCVla4EzW1apbyZ-h7xxrz1XT1z5nD_M/view?usp=drivesdk
  La fotografía como objeto autor Jaime Munárriz.pdf https://drive.google.com/file/d/1idGNmIFvB02SRFWyEKfhsIcNZNsPKsgT/view?usp=drivesdk
  Curso de Fotografía Digital autor Jesús Rodriguez Martin.pdf https://drive.google.com/file/d/1WyseOc502QGIXhltaUkLtJgefFM8JC2b/view?usp=drivesdk
  Fotografía Digital autor Carlos Martino.pdf https://drive.google.com/file/d/1kpjcjBnoque12TyunsVQNE-iyepfe9lm/view?usp=drivesdk
  El potencial educativo de la fotografía autor Consejo Nacional de la Cultura y Artes.pdf https://drive.google.com/file/d/1gXh_6rsEClnrJjg8z6W1QCx04Q47a7nL/view?usp=drivesdk
  Curso de Fotografía Digital autor Alfonso Bustos Toldos.pdf https://drive.google.com/file/d/1dSk0DgufxW_BEUFhFcsjcOxeK9GP0RSu/view?usp=drivesdk
  apariciyotros_la-imagen.pdf https://drive.google.com/file/d/1y2lXFYQh9Fi7tIASE4fjb10tWvhY_cZA/view?usp=drivesdk
  Aprende a Hacer Mejores Fotos en 31 Días.pdf https://drive.google.com/file/d/1AZMxkYM6c09dGeXf7nkjHXwVJ3IT-BMq/view?usp=drivesdk
  Curso de Desnudo Artístico.pdf https://drive.google.com/file/d/1Aem09N_NnNIoduVQ2C8viui4-F1qHRrz/view?usp=drivesdk
  Curso de Fotografía de Larga Exposición.pdf https://drive.google.com/file/d/13hWlN3AGTyOr7rmtU2nj8CbAB-YHMQW1/view?usp=drivesdk
  Curso de Fotografia de Moda.pdf https://drive.google.com/file/d/1Izu0acsDo5rSmYQWsiadIDlHi7s5mQMu/view?usp=drivesdk
  Guía Didáctica de la Fotografía Digital.pdf https://drive.google.com/file/d/1tYcf76AhQlBm9XIeZ8BG73UeN3qhBF4A/view?usp=drivesdk
  El Ojo del Fotógrafo.pdf https://drive.google.com/file/d/1qjeccOeYduiF3Ar1xohPIEN1fIczGhDJ/view?usp=drivesdk
  LasSieteDecisionesdelBuenFotografo.pdf https://drive.google.com/file/d/1vLwfNndKR3zZ2NGt6esT3QmppCLHMtlY/view?usp=drivesdk
  Fotografía Digital para Dummies.pdf https://drive.google.com/file/d/1n2KjNHwO1aM0XUcXK21KPXL1-AcynTCt/view?usp=drivesdk
  El Gran Libro de la Fotografía.pdf https://drive.google.com/file/d/1BDFj1jcfIDpNn7gH90AldXOvW1OC8kvH/view?usp=drivesdk
  Fotografía Cinematográfica Tomo 2.pdf https://drive.google.com/file/d/1YpKaUt_L44iDik64LfRoqA0IWYuDphdw/view?usp=drivesdk
  Diplomatura en Fotografía Fotoperiodismo y Fotodocumentalismo Módulo 2.ppt https://docs.google.com/presentation/d/1qWTS09H7Jv83KebjRJ528p0rWCwgugBr/edit?usp=drivesdk&ouid=111820477606749717286&rtpof=true&sd=true
  Fundamentosfotoperiod.pdf https://drive.google.com/file/d/1YzosYuuisSXmY1QZD4CjQwjZwIW3uP2r/view?usp=drivesdk
  clase3optica.pdf https://drive.google.com/file/d/1HW5FVbr7mMjB-EjS1xv7rgE9ZD_EZi39/view?usp=drivesdk
  Ws Bodas.pdf https://drive.google.com/file/d/10Nu-Bs4Xz1LEIv-r1S5L10SFFJ4bF2UK/view?usp=drivesdk
  50_pel_culas_con_las_que_hacerse_mayor_-_Giuseppe_Tornatore.pdf https://drive.google.com/file/d/1II5y-FEjVIf86tP-likR83TR5aShGInH/view?usp=drivesdk
  Hacer cine - Alexander Mackendrick.epub https://drive.google.com/file/d/1I1_fLUadBPNlqQz6mg_zXLBnjKQeGmMb/view?usp=drivesdk
  Curso de retoque fotográfico (Photoshop) autor Alfonso Bustos Toldos.pdf https://drive.google.com/file/d/1S7n5XlCHnILCZuCnxxzPoTEfIhlJfKPy/view?usp=drivesdk
  Aprender a iluminar en fotografía autor Luis Gonzaga Vicedo.pdf https://drive.google.com/file/d/1S4OmAOVkEEH83oJVnItC10k5OEmZIUav/view?usp=drivesdk
  Toma y Composición Fotográficaleido.pdf https://drive.google.com/file/d/1U1rlRy4XbgSHIeOf_TRvaJIzHK-ii9_w/view?usp=drivesdk
  Tipos de Cámarasleido.pdf https://drive.google.com/file/d/1U11wGVzLAtN1adyDnwhspUxEZxMZizf7/view?usp=drivesdk
  Sacar Fotosleido.pdf https://drive.google.com/file/d/1U0dkWS0lida40z99xFekbbCjpYKgomQl/view?usp=drivesdk
  Qué es y Cómo Funciona un Objetivoleido.pdf https://drive.google.com/file/d/1TtfjrdL-BG7P7f3XDdWRA-NQOWdVL1mP/view?usp=drivesdk
  Psicologia del color - Eva Heller.epub https://drive.google.com/file/d/1Ts1p5-16KsheFNqREcPYqmOCsgsp6I-c/view?usp=drivesdk
  Psicologia-del-Color.pdf https://drive.google.com/file/d/1ToyegUr14mhSfUBLH7PlsMu2m8ZqlPiM/view?usp=drivesdk
  Megapíxelleido.pdf https://drive.google.com/file/d/1ToBBOV0AVK8y0m6tLedYX7XXVVyAKXC9/view?usp=drivesdk
  Los Objetivosleido.pdf https://drive.google.com/file/d/1TjegyMn3wdeOUIAusD1QmxolBFazFIKo/view?usp=drivesdk
  El Tamaño del Sensorleido.pdf https://drive.google.com/file/d/1TdkrvihP93EX6cvDlJSj7ODj-NOUJaX_/view?usp=drivesdk
  Cómo Lograr una Correcta Exposición - Cámaras Profesionalesleido.pdf https://drive.google.com/file/d/1TYHmbOrGxfNEYxKXu3ynDRhKA1wVNjd7/view?usp=drivesdk
  Cámaras y Modosleido.pdf https://drive.google.com/file/d/1TVAdTH7VlON4d5ohytjbbI4x3KpPecYA/view?usp=drivesdk
  Bases de la Fotografía.pdf https://drive.google.com/file/d/1TUGQ_W-dMwF33gpO7KvubfSWBFeRdI0p/view?usp=drivesdk
  CURSO DE FOTOGRAFIA DIGITAL - ALFONSO BUSTOS.pdf https://drive.google.com/file/d/1Pwf-R0X0bgGaxv9Kam7OOikTTCHm1D0q/view?usp=drivesdk
  50 POSES DE BODA por David Gang.pdf https://drive.google.com/file/d/1UFiS4Khh5dlpU0HT0AvRLFCSsHVGGt0I/view?usp=drivesdk
  Guia_Acreditacion_Prensa_Oasis_2025.docx https://docs.google.com/document/d/1UAGJN9pLR6N9I4Xk9qDLsFWaUIOT4VQc/edit?usp=drivesdk&ouid=111820477606749717286&rtpof=true&sd=true
  Guia_Acreditacion_Prensa_Oasis_2025 (1).pdf https://drive.google.com/file/d/1U6XrW06V92RGMdZ0CeBBFbBzP0AqcjpV/view?usp=drivesdk
  Sobre la fotografia - Susan Sontag.epub https://drive.google.com/file/d/1RxyTsU6zgS_4NUktDTugdPqt6QMoPdCA/view?usp=drivesdk
  La camara lucida - Roland Barthes.epub https://drive.google.com/file/d/1RvuToN3CfvTdcWyaAgVU7bDVjWh0XMmy/view?usp=drivesdk
  FOTOGRAFIA CREATIVA - ALFONSO BUSTOS.pdf https://drive.google.com/file/d/1Rs3rlm01tpEY8K5yqPQmbLIBYI3q_9Lj/view?usp=drivesdk
  COMO LEER LA FOTOGRAFIA - IAN JEFFREY.pdf https://drive.google.com/file/d/1RrXAy21ibtDuoFWsWAHRO-ua2kYjedqf/view?usp=drivesdk
  FOTOGRAFIA CONCEPTOS Y PROCEDIMIENTOS - JOAN FONTCUBERTA.pdf https://drive.google.com/file/d/1Ra4b9zzMhyIZRNwrgMY8yXw7GbpSNoor/view?usp=drivesdk
  FOTOGRAFIA CON FLASH - JAVIER AGUILAR.pdf https://drive.google.com/file/d/1RYodPCc8Faq5DHlDmgRzVysAUZ3Vm1JX/view?usp=drivesdk
  FOTOGRAFIA DE PAISAJES EQUIPO BASICO - OTROS.pdf https://drive.google.com/file/d/1RSI3EvrK6g8wUitzFfW7D8LcAEGjucB4/view?usp=drivesdk
  FOTOGRAFIA DE DESNUDO.pdf https://drive.google.com/file/d/1RNtbDPU64Z3LUyC5ZR9bnECB4pFb4wWx/view?usp=drivesdk
  ESQUEMAS DE ILUMINACION EN EL CINE - CARLOS CUENCA.pdf https://drive.google.com/file/d/1RK1XsVN87WwgQxws-I4NXTd_2OmV7JNf/view?usp=drivesdk
  ESTRATEGIAS DE LUZ.pdf https://drive.google.com/file/d/1R52bmGLex8HS7g9yJT5Sr04C6ocPP_SM/view?usp=drivesdk
  FOTOGRAFIA DE MODA - ALEX LARG.pdf https://drive.google.com/file/d/1R4RdQJWl2tc_w0INILgPTvM5jwFqZUxo/view?usp=drivesdk
  EXPOSICION SOCIAL - SAKIS GONZALEZ.pdf https://drive.google.com/file/d/1R31gTcLrAaGmRG9IHZJYGIXVYBiUmSGw/view?usp=drivesdk
  FOTOGRAFIA - MOONLIGHT.pdf https://drive.google.com/file/d/1QwVNRasuQjULDMIdciyJHtavrD53JUeJ/view?usp=drivesdk
  FOTOGRAFIA DE ALTA CALIDAD - JOSE MELLADO.pdf https://drive.google.com/file/d/1QuAnYX2mWE3tfbIwfyJ8DnNxOsOjOrmJ/view?usp=drivesdk
  FOTOGRAFIA - PAULA DIAZ.pdf https://drive.google.com/file/d/1Qns8sNyBeg6qKk9mUkFpuxPrTibHvgBS/view?usp=drivesdk
  FOTOGRAFIA AVANZADA DESNUDO ARTISTICO - CARLOS CANDIA.pdf https://drive.google.com/file/d/1Qn_jdjSxyAE1x2FDZkcgV2Ig1I_Pzix5/view?usp=drivesdk
  EL MEJOR ESTUDIO PARA LA FOTOGRAFIA EN BLANCO Y NEGRO.pdf https://drive.google.com/file/d/1Qfyl06jIfJbWE7ZQPUg49os4-DD-tFdV/view?usp=drivesdk
  EL MENSAJE FOTOGRAFICO - ROLAND BARTHES.pdf https://drive.google.com/file/d/1QceFUth7qeg7d3TP9qcPGvNshl8e_w_f/view?usp=drivesdk
  FOTO POSE - JESUS BERNARDO.pdf https://drive.google.com/file/d/1QYJPmvdL3w4xiBGzeoHOGOnZOpp9oAU6/view?usp=drivesdk
  EL GRAN LIBRO DE FOTOGRAFIA EN BLANCO Y NEGRO.pdf https://drive.google.com/file/d/1QN0B2WxZ8-WDulw4CMg8P3GIEFVSMbAO/view?usp=drivesdk
  EL OJO MIRADA - NICOLAS GUIGOU.pdf https://drive.google.com/file/d/1QLiauF4RIqCgx-GXYqtMtLtlBMcv3c6V/view?usp=drivesdk
  EL MONTAJE ESPACIO Y TIEMPO DEL FILM - VINCENT PINEL.pdf https://drive.google.com/file/d/1QLgAPMWf-SgUk8e9s60rnU1MPHdYH9dA/view?usp=drivesdk
  EL LIBRO DE LA FOTOGRAFIA BOUDOR - JESUS BERNARDO.pdf https://drive.google.com/file/d/1QD7rJc2L4NsYEXRV9Bwx3ROHn4xXI3Iw/view?usp=drivesdk
  FOTOGRAFIA CINEMATOGRAFICA - CATALINA ACUÑA.pdf https://drive.google.com/file/d/1Q7woVaYclWPWKbKtY698xPQ3KTlgp04s/view?usp=drivesdk
  CURSO DE FOTOGRAFIA DIGITAL - JESUS RODRIGUEZ.pdf https://drive.google.com/file/d/1Q4reFhAtWgfNvUKWn94ouGhqtdHsCRJH/view?usp=drivesdk
  EL SABOR DE LA IMAGEN - REVBECA MONROY.pdf https://drive.google.com/file/d/1Q4mdC5O1ZRstJJlAhjXei1p6Tt712Tvm/view?usp=drivesdk
  CURSO DE FOTOGRAFIA NOCTURNA.pdf https://drive.google.com/file/d/1Pxmic7_nxWV65f6Gu6CqlBRrUZUqojoL/view?usp=drivesdk
  DE LA CULTURA KODAK A LA IMAGEN EN RED.pdf https://drive.google.com/file/d/1PjDJYDjXVhIY_Ct7BCpPX8BHc4qM4P8m/view?usp=drivesdk
  CURSO DE MACROFOTOGRAFIA - FRAN NIETO.pdf https://drive.google.com/file/d/1PSAhQrNBUFu13AkaajyNn0DsOw_ha0KN/view?usp=drivesdk
  ENSAYOS SOBRE FOTOGRAFIA - RAUL BECEYRO.pdf https://drive.google.com/file/d/1PRsx08UuxoJRwL_lN9os_hjwS5ycn7Cm/view?usp=drivesdk
  COMPOSICION FOTOGRAFICA - JOSE QUEVEDO.pdf https://drive.google.com/file/d/1PGv0TVqB2M76TbNN9MvPw8YeAM-Z_GeB/view?usp=drivesdk
  CURSO DE FOTOGRAFIA PARA AFICIONADOS - NEGRET.pdf https://drive.google.com/file/d/1PCMqQ333yN3Yflnzv_As81bg1NlkrmkY/view?usp=drivesdk
  COMPOSICION Y SINTAXIS EN FOTOGRAFIA - FRANCISCO TENLLADO.pdf https://drive.google.com/file/d/1P9bf8m3Gm_0jyAFP8URsGKFfRa0Htrnr/view?usp=drivesdk
  DESNUDO EN FOTOGRAFIA - PETER ZEEMEIJER.pdf https://drive.google.com/file/d/1OwkV0uYEdHgUIw49hdqEQw4h5cYJyByl/view?usp=drivesdk
  CURSO BASICO DE ADOBE PHOTOSHOP ORIENTADO A FOTOGRAFIA DIGITAL - Dhttps://drive.google.com/file/d/1Oqirl_PruS5qC7HsEqsqNsxCZ0ftQVIq/view?usp=drivesdk
  CURSO DE FOTOGRAFIA CON ANDROID.pdf https://drive.google.com/file/d/1OlSxEWspOpeHzJzx9kACiArCnS8wW4F5/view?usp=drivesdk
  COMPOSICION FOTOGRAFICA - JOSE PARIENTE.pdf https://drive.google.com/file/d/1Ohn62wCdV2ovAIIGTid3-z3FRB6Gv64-/view?usp=drivesdk
  CURSO DE FOTOGRAFIA - FACUNDO GALELLA.pdf https://drive.google.com/file/d/1Oh1HoZystgYRVOD5fvqk55EZhlG7u-Hp/view?usp=drivesdk
  CONVERSACIONES CON FOTOGRAFOS MEXICANOS - CLAUDI CARRERAS.pdf https://drive.google.com/file/d/1Oee9fLHaGGPrdo6wwy7y4RHoLYrKk_2d/view?usp=drivesdk
  EL GRAN LIBRO DE FOTOGRAFIA DE VIAJES - DIGITAL SURVIVAL.pdf https://drive.google.com/file/d/1OeAkVvx_IF2HwADU357ZDL5kTKAZNOoB/view?usp=drivesdk
  500 POSES PARA FOTOGRAFIA - MICHELLE PERKINS.pdf https://drive.google.com/file/d/1OY2CZkK01XdzDsTcSvkMr-6oKluqgO1W/view?usp=drivesdk
  365 CONSEJOS DE FOTOGRAFIA - MARIO PEREZ.pdf https://drive.google.com/file/d/1OXtyUTrB8-YvaNXGr1PZmjfhISbRuAH4/view?usp=drivesdk
  500 POSES PARA FOTOGRAFIA MUJER - MICHELLE PERKINS.pdf https://drive.google.com/file/d/1OU562Qif5h1X8TZq72FBAa1PkaXZBwu5/view?usp=drivesdk
  APRENDE A ILUMINAR EN FOTOGRAFIA - LUIS GONZAGA.pdf https://drive.google.com/file/d/1OQTkb39-I_0CmyxJVxC6THkeZQP_S_si/view?usp=drivesdk
  COMPOSICION - DAVID PRAKEL.pdf https://drive.google.com/file/d/1ONWGTubnQ9RPmy752vRFZYa8y5JZRrpC/view?usp=drivesdk
  BREVE HISTORIA DE LA FOTOGRAFIA AL DESNUDO - RICARDO MACIEL.pdf https://drive.google.com/file/d/1OJkaDycH2YOWVCo8fIMj20d_40GkKAwq/view?usp=drivesdk
  CAMARA OBSCURA - ROLLAND BARBES.pdf https://drive.google.com/file/d/1OHeJPdmcBj2bZg2Db01Vs5xWXZe2i4cM/view?usp=drivesdk
  LOS VISIBLE Y LO INVISIBLE EN LA IMAGEN FOTOGRAFICA - NELLY SCHNAITH.pdhttps://drive.google.com/file/d/1OFYlawm4Gx45zIuFBw4AhOyISlX4gD_H/view?usp=drivesdk
  CURSO DE FOTOGRAFIA DE MODA - ELIOT SIEGEL.pdf https://drive.google.com/file/d/1OCXzyaD-t9kA0wcoPLf3fHqs3KGax_my/view?usp=drivesdk
  LOS SECRETOS DEL RETRATO PERFECTO.pdf https://drive.google.com/file/d/1OBhmoAuSO-8d1-hVsFAhe3cDe5pfOeMS/view?usp=drivesdk
  COMPOSICION DE BUENAS FOTOS A FOTOS INCREIBLES.pdf https://drive.google.com/file/d/1O9SkYD6CrnNVAQ7mo13lHIrle0ld7FWB/view?usp=drivesdk
  MANUAL DE MONTAJE - RAY THOMPSON.pdf https://drive.google.com/file/d/1O4anU0Rt0rUpGEP3CmHlKFy0iSAwrYbr/view?usp=drivesdk
  74 POSES CLASICAS PARA FOTOGRAFIAR EN ESTUDIO.pdf https://drive.google.com/file/d/1O2xj0P4yOXyUcUTKvLgD281-3VSWVc_Z/view?usp=drivesdk
  100 EJERCICIOS DE FOTOGRAFIA.pdf https://drive.google.com/file/d/1O0819Gx6v7gtr88jTwZ_ZUNCl342ex5e/view?usp=drivesdk
  MANUAL DE LA ILUMINACION.pdf https://drive.google.com/file/d/1NzcWOicbbNMZjQqnSzaVPlIKU-qVaupA/view?usp=drivesdk
  MANUAL DE FOTOGRAFIA - JOSE NOGUERA.pdf https://drive.google.com/file/d/1Nz2wQ_WAAtkX04YMVIVJi8QijEuorNo_/view?usp=drivesdk
  LA SIMPLICIDAD DE LA ILUMINACION ESPIRITUAL - ROY EUGENE.pdf https://drive.google.com/file/d/1NwWTaGPmcjgEXkDPbauBupSyccfso7Hh/view?usp=drivesdk
  LA UBICUIDAD DE LA IMAGEN.pdf https://drive.google.com/file/d/1NmILvvBVA5Lddw4U2-7cBi8p9h11017E/view?usp=drivesdk
  LA LECTURA DE LA IMAGEN - LORENZO VILCHES.pdf https://drive.google.com/file/d/1NiWhJWVKPy3d-5p6zdjM_eEWI_soSuR-/view?usp=drivesdk
  LO QUE NO TE ENSEÑAN EN NINGUNA ESCUELA DE FOTOGRAFIA.pdf https://drive.google.com/file/d/1Ni8Yn_5XwgwMu-LH5i7pkyW3Q5B90My8/view?usp=drivesdk
  LOS 7 ERRORES FATALES DEL FOTOGRAFO AMATEUR - LUIS CRUZ.pdf https://drive.google.com/file/d/1Ne-AfSFyNyfB_ABkAACqyO5E0ECZqGD3/view?usp=drivesdk
  LO FOTOGRAFICO - ROSALIND KRAUSS.pdf https://drive.google.com/file/d/1Ndb3fX_czVPFv9Xjn_y6Ueygr90AFC-Z/view?usp=drivesdk
  NARRATIVA VISUAL - BRUCE BLOCK.pdf https://drive.google.com/file/d/1Nc6vutJoq3CwQYaErhb--4dhj36yhyP1/view?usp=drivesdk
  LA FOTOGRAFIA UN ARTE INTERMEDIO - PIERRE BOURDIEU.pdf https://drive.google.com/file/d/1Nc-d8gW8RfvYDePbQvdeStU7mBomaIc5/view?usp=drivesdk
  LA FOTOGRAFIA Y CINE COMO DOCUMENTOS SOCIALES.pdf https://drive.google.com/file/d/1Na1SSFoBZnjDIWlC5y6BdAxEn2CZbqrv/view?usp=drivesdk
  LA FOTOGRAFIA SOCIAL.pdf https://drive.google.com/file/d/1NVnAXi_e_ZftHGBj7fOA2b6uAYH9eeTr/view?usp=drivesdk
  LOS 11 MEJORES EFECTOS DE RETOQUE EN UN SOLO PDF.pdf https://drive.google.com/file/d/1NU3nae9_TblMPIQGXzCeohBAuOAVmh22/view?usp=drivesdk
  LA IMAGEN FOTOGRAFICA EN LA CULTURA DIGITAL - MARTIN LISTER.pdf https://drive.google.com/file/d/1NTGh766-UgR69gLNkoTb7_QLZ3Kfm4_l/view?usp=drivesdk
  LA GUIA DEFINITIVA DE LA COMPOSICION FOTOGRAFICA.pdf https://drive.google.com/file/d/1NQEpdwUnGMRRsByfnoQwQ0BMa2SuXMZP/view?usp=drivesdk
  LA SOMBRA Y EL TIEMPO LA FOTOGRAFIA COMO ARTE - JEAN CLAUDE.pdf https://drive.google.com/file/d/1NOUneZJQBvhPJByMCtdS-yNsI4DN9QHi/view?usp=drivesdk
  INTRODUCCION A LA FOTOGRAFIA DE PAISAJES.pdf https://drive.google.com/file/d/1NI6UY2S4IVZL5cE_hJu_tjvC1nFEHXUG/view?usp=drivesdk
  LA INVENCION DE LA FOTOGRAFIA - QUENTIN BAJAC.pdf https://drive.google.com/file/d/1NAx18dSPSzuomcbeytKfgZr8DOUHs64X/view?usp=drivesdk
  INTRODUCCION AL ANALISIS DE LA IMAGEN - MARTINE JOLY.pdf https://drive.google.com/file/d/1N8eO9xgcCBJV3jGZdwGo0gmrgmxx3MT8/view?usp=drivesdk
  LA IMAGEN COMPLEJA - JOSEP CATALA.pdf https://drive.google.com/file/d/1N7xOdl4N2ooiOvEtkp9G_nhIrJs8JMky/view?usp=drivesdk
  LA FOTOGRAFIA DIGITAL A SU ALCANCE.pdf https://drive.google.com/file/d/1N7YiHao8Os04GEJzYgAGRU4hs_yMPR-6/view?usp=drivesdk
  LA COMPOSICION FOTOGRAFICA - PACCO ALEXANDRE.pdf https://drive.google.com/file/d/1Mzem5pyVMMIBIsB-eXJGUZOcBFAwroOl/view?usp=drivesdk
  LA IMAGEN DIGITAL DE LA TECNOLOGIA A LA ESTETICA - LAURENT JULLIER.pdf https://drive.google.com/file/d/1Mp1q24RnGFvfQNAHWYEl6mMETKf-0x15/view?usp=drivesdk
  LA CAMARA DE PANDORA - JOAN FONTCUBERTA.pdf https://drive.google.com/file/d/1MmCwnmPnU0E3aGioS8ELPO78-gfJg7b3/view?usp=drivesdk
  KUBE STUDIO DEL BLOG AL PAPEL.pdf https://drive.google.com/file/d/1MixQ8gH8x3e9geI8DvlowhsEl_y_oEPQ/view?usp=drivesdk
  LA FOTOGRAFIA PASTICA UN ARTE PARADOJICO - DOMINIQUE BAQUE .pdf https://drive.google.com/file/d/1MbrC_hg3TJsj0OeDpYLx2exiFTOJBpW5/view?usp=drivesdk
  HACIA UNA FILOSOFIA DE LA FOTOGRAFIA.pdf https://drive.google.com/file/d/1MarCzDrB0n8XIC9es6p6pAm3IEOh_604/view?usp=drivesdk
  FOTOGRAFO NOCTURNO.pdf https://drive.google.com/file/d/1MZ2nzwxF16AeGlG_AQHwgjZMvYyriR7u/view?usp=drivesdk
  GUIA COMPLETA DE LUZ E IMAGINANCION EN FOTOGRAFIA DIGITAL - MICHAEL Fhttps://drive.google.com/file/d/1MVbD4tc_8bPQNDKkFnKr304jSHgI5DOa/view?usp=drivesdk
  LA FOTOGRAFIA PASO A PASO CURSO COMPLETO - MICHAEL LANGFORD.pdf https://drive.google.com/file/d/1MVYOM1hGHJfVK2mx1a_3uh1n1WvMuLaS/view?usp=drivesdk
  GUIA DE FOTOGRAFIA DE PAISAJES - ROBERT CAPUTO.pdf https://drive.google.com/file/d/1MSENBtkw-gGBEzX353KPwUzwmB1pbZAp/view?usp=drivesdk
  INTRODUCCION A LA FOTOGRADIA MACRO.pdf https://drive.google.com/file/d/1MHi_W98JMngWVMy1QWX_FUDLGTf5A_Cc/view?usp=drivesdk
  ILUMINACION DE RETRATO EN ESTUDIO - EFRALM SANCHEZ.pdf https://drive.google.com/file/d/1MEOHjTMz8YOEX-zeYKzCmIbX-kGYzMh9/view?usp=drivesdk
  FOTOGRAFIA HDR AL DESCUBIERTO.pdf https://drive.google.com/file/d/1LvKeQt0iC8hROnNGs5LeCL79Hkdx4A6q/view?usp=drivesdk
  FOTOGRAFIA DIGITAL DESDE CERO.pdf https://drive.google.com/file/d/1LmydpfqVKk--o1Upb2XSeCPNMFCvrMtR/view?usp=drivesdk
  FOTOGRAFIA NOCTURNA DE LARGA EXPOSICION - IVAN SANCHEZ.pdf https://drive.google.com/file/d/1Lfd7IhHwkkD8iWQp30E3EmLIhU8xQSB5/view?usp=drivesdk
  FOTOGRAFIA Y FOTOPERIODISMO DE GUERRA.pdf https://drive.google.com/file/d/1LekREs5GyQY6FIHkCpFNaUzL2GRPZ_IU/view?usp=drivesdk
  FOTOGRAFIAR DEL NATURAL - HENRI CARTIER.pdf https://drive.google.com/file/d/1LeaPQX8UvGeq3nc5VuvmzBGSUkL10WvP/view?usp=drivesdk
  FOTOGRAFIA Y VERDAD - JOAN FONTCUBERTA.pdf https://drive.google.com/file/d/1LYA2ODOwr9ACM2GrkQd68KIWgQeaIEQC/view?usp=drivesdk
  FOTOGRAFIA DE PAISAJES.pdf https://drive.google.com/file/d/1LUfL9ZY_7E91Dg8ACfm_kVpXk3QH06BJ/view?usp=drivesdk
  HISTORIA DE LA FOTOGRAFIA - JEAN CLAUDE.pdf https://drive.google.com/file/d/1LOuesYETUTcH6k8nlslssM1iTdLOXOOS/view?usp=drivesdk
  ILUMINACION - DAVID PRAKEI.pdf https://drive.google.com/file/d/1LLZHB9e1RNlxVH7HN6Xcekl8szyOZq2l/view?usp=drivesdk
  FOTOGRAFIA DIGITAL CAMARAS REFLEX - MICHAEL FREEMAN.pdf https://drive.google.com/file/d/1LIxMZZEr4_eBLIj8Fu-t63885wpTJOLM/view?usp=drivesdk
  TALLER DE COMPOSICION E ILUMINACION DE ESTUDIO - ALFONSO BUSTOS.pdf https://drive.google.com/file/d/1LEydplSyHTffQLRyv-vXEGwFhN4pS_-R/view?usp=drivesdk
  TEORIA DE LA MIRADA - PETER WOLLEN.pdf https://drive.google.com/file/d/1LEmEnM8nG47LABqGH1OkKtMkxCuwcl2m/view?usp=drivesdk
  TODOS LOS SECRETOS DE LA FOTOGRAFIA HFR EN 7 FANTASTICOS ARTIVULOShttps://drive.google.com/file/d/1KnLsniF0QvvMAX40IY1eSVRAkfpzeY4R/view?usp=drivesdk
  TEORIA DE LA IMAGEN PERIODISTICA - LORENZO VILCHES.pdf https://drive.google.com/file/d/1Kn6-FIAMWouFse85jgl2ReeSxNz__XlC/view?usp=drivesdk
  TU PRIMEROS PASOS EN FOTOGRAFIA REFLEX.pdf https://drive.google.com/file/d/1Kmn1PUkEgyubuDUPnwv4cC0pPxejHYzx/view?usp=drivesdk
  NITIDEZ EN FOTOGRAFIA DIGITAL - JUAN JOVER.pdf https://drive.google.com/file/d/1KjeA_JdJhCL83J39faX2XqJAWiog6ikQ/view?usp=drivesdk
  REVISTA FOTOGRAFO NOCTURNO ESPECIAL.pdf https://drive.google.com/file/d/1KfS-ZUDUilHnxJ8U3cJfmUFgHgeXbvyD/view?usp=drivesdk
  PLENITUD LA MIRADA DEL NAHUAL - BERT HELLINGER.pdf https://drive.google.com/file/d/1Kc5wP-tlkKXztFy4fEWDsDIj9rGKsFQ9/view?usp=drivesdk
  PLANTILLAS DE ILUMINACION - BENJAMIN BERGERY.pdf https://drive.google.com/file/d/1KbXE70kNiSjnu5Hacf-kpyJTpaGo5lEq/view?usp=drivesdk
  POLITICAS DE LA MIRADA Y LA MEMORIA EN LA CAPTURA - CLEOPATRA BARRIOhttps://drive.google.com/file/d/1KaUApPQw8fvVfOc4rVe25yEmxesxA9al/view?usp=drivesdk
  PROCESOS FOTOGRAFICOS ARTESANALES Y LIBRO DEL ARTISTA.pdf https://drive.google.com/file/d/1KWUBpEhb8JcXgBtxZRdF6wuZDhgkqglx/view?usp=drivesdk
  RECETAS DE FOTOGRAFIA.pdf https://drive.google.com/file/d/1KTnCFMmMPq22QmeTVFbLzeF8Td4jmIJQ/view?usp=drivesdk
  FOTOGRAFIA DIGITAL DE ALTA CALIDAD - JOSE MELLADO.pdf https://drive.google.com/file/d/1KQVTcGYb7O3crzSAAR4yZeGQQd1R6Dsg/view?usp=drivesdk
  FOTOGRAFIA DIGITAL CREATIVA EFECTOS CON PHOTOSHOP - CONCEPCION AL https://drive.google.com/file/d/1KPtX2MDv0dyaTQc-MzQwXuBhahtErqyu/view?usp=drivesdk
  PRINCIPIOS BASICOS DE ILUMINACION EN FOTOGRAFIA - CHRIS WESTON.pdf https://drive.google.com/file/d/1KP8ENsoa1MrNzxCOI0mXjVdXGhOl6GxO/view?usp=drivesdk
  FOTOGRAFIA DIGITAL LUZ E ILUMINACION - MICHAEL FREEMAN.pdf https://drive.google.com/file/d/1KOaSCO8xZBGwfaYANokIPz2PYrNca8vg/view?usp=drivesdk`;
  
  // Llamar a la función principal para iniciar el proceso de carga
  uploadBooks(API_ENDPOINT, USER_ID, bookDataString);