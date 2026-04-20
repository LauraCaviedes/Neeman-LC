// ==========================================
// FUNCIONES DE INTERFAZ (BOTONES Y MENÚS)
// ==========================================

function toggleInfo(id) {
    const card = document.getElementById(id);
    const button = card.querySelector('.btn-toggle');
    
    card.classList.toggle('expanded');
    
    if (card.classList.contains('expanded')) {
      button.textContent = 'Menos info ↑';
    } else {
      button.textContent = 'Más info →';
    }
}

function toggleMenu() {
    const nav = document.getElementById('navMenu');
    nav.classList.toggle('show');
}

function toggleFormulario(id) {
    const contenedorForm = document.getElementById(id);
    const button = contenedorForm.nextElementSibling; 
    
    contenedorForm.classList.toggle('expanded');
    
    if (contenedorForm.classList.contains('expanded')) {
        button.textContent = 'Ocultar formulario ↑';
    } else {
        if (id === 'contacto-formulario') {
             button.textContent = 'Cerrar formulario'; 
        }
    }
}

// ==========================================
// CARGA DINÁMICA DE COMPONENTES (NAVBAR Y FORM)
// ==========================================

fetch(ROOT_PATH + "navbar.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("navbar").innerHTML = data;
    
    // Corregir rutas del menú
    const enlacesMenu = document.querySelectorAll('#navbar a');
    enlacesMenu.forEach(enlace => {
        const rutaOriginal = enlace.getAttribute('href');
        if (rutaOriginal && !rutaOriginal.startsWith('#') && !rutaOriginal.startsWith('http')) {
            enlace.setAttribute('href', ROOT_PATH + rutaOriginal);
        }
    });
  })
  .catch(err => console.error("Error cargando el navbar:", err));

fetch(ROOT_PATH + "formulario.html")
  .then(res => res.text())
  .then(data => {
    const formContainer = document.getElementById("formulario");
    if(formContainer) {
        formContainer.innerHTML = data;

        // Cargar modal después del formulario
        fetch(ROOT_PATH + "politica_privacidad.html")
          .then(res => res.text())
          .then(modalData => {
              const contenedorModal = document.getElementById("politica_privacidad");
              if (contenedorModal) {
                  contenedorModal.outerHTML = modalData; 
              }
          })
          .catch(err => console.error("Error cargando la política:", err));
    }
  })
  .catch(err => console.error("Error cargando el formulario:", err));

// ==========================================
// LÓGICA DEL BLOG (CARGA DE ARTÍCULOS)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  // 1. Cargar artículo por defecto al abrir la página (Portadas)
  const container = document.getElementById('blog-article-container');
  
  if (container) {
      // Solo hace este fetch si estamos en la página del blog
      fetch(ROOT_PATH + 'Articles-blog/articulo1.html')
        .then(response => {
            if (!response.ok) throw new Error('Error de red');
            return response.text();
        })
        .then(data => {
          container.innerHTML = data;
          if (window.MathJax) {
            MathJax.typesetPromise(); 
          }
        })
        .catch(err => {
          console.error("Error cargando el artículo por defecto:", err);
          container.innerHTML = '<p>Error al cargar el artículo.</p>';
        });
  }

  // 2. Funcionalidad de los enlaces de la barra lateral
  const links = document.querySelectorAll('.nav-links-blog a');

  links.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const url = link.getAttribute('data-articulo');

      if (url && container) {
        // Se agregó el ROOT_PATH que faltaba aquí
        fetch(url)
          .then(response => {
              if (!response.ok) throw new Error('Error de red');
              return response.text();
          })
          .then(data => {
            container.innerHTML = data;
            
            if (window.MathJax) {
              MathJax.typesetPromise();
            }

            // Ejecutar simulador si es el artículo del sonido
            if (url.includes('articulo2_sonido') && typeof initSpectrometer === 'function') {
                initSpectrometer();
            }
          })
          .catch(() => {
            container.innerHTML = '<p>Error al cargar el artículo seleccionado.</p>';
          });
      }
    });
  });
});

// ==========================================
// FUNCIONES GLOBALES DEL MODAL DE PRIVACIDAD
// ==========================================

window.openModal = function() {
    const modal = document.getElementById("politica_privacidad");
    if (modal) {
        modal.style.display = "block";
    }
};

window.closeModal = function() {
    const modal = document.getElementById("politica_privacidad");
    if (modal) {
        modal.style.display = "none";
    }
};

window.addEventListener("click", function (event) {
    const modal = document.getElementById("politica_privacidad");
    if (event.target === modal) {
        window.closeModal();
    }
});