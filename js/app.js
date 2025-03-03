const apiUrl = 'http://localhost:5000/api/agentes'; 
let agentesData = [];
let currentPage = 1;
let rowsPerPage = 5;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});

async function cargarDatos() {
    const searchTerm = document.getElementById('search').value.trim(); // Obtener el término de búsqueda
    mostrarCargando(true);
    try {
        const response = await fetch(`${apiUrl}?search=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        agentesData = data; // Guardar los datos recibidos de la API
        currentPage = 1; // Reiniciar la paginación con cada nueva búsqueda
        renderizarTabla();
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        alert('Error al cargar los datos');
    } finally {
        mostrarCargando(false);
    }
}

function renderizarTabla() {
    const tbody = document.querySelector('#agentesTableBody');
    const paginationDiv = document.getElementById('pageButtons');
    const infoDiv = document.getElementById('info');

    totalPages = Math.ceil(agentesData.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const end = currentPage * rowsPerPage;
    const paginatedData = agentesData.slice(start, end);

    tbody.innerHTML = '';
    paginatedData.forEach(agente => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${agente.id}</td>
            <td>${agente.grado || ''}</td>
            <td>${agente.nombre || ''}</td>
            <td>${agente.credencial || ''}</td>
            <td>${agente.cuil || ''}</td>
            <td>${agente.sector || ''}</td>
            <td>
                <button onclick="editarAgentes(${agente.id})" class="btn btn-sm btn-warning">Editar</button>
                <button onclick="eliminarAgentes(${agente.id})" class="btn btn-sm btn-danger">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    actualizarPaginacion();
}

function actualizarPaginacion() {
    const paginationDiv = document.getElementById('pageButtons');
    paginationDiv.innerHTML = ''; // Limpiar los botones existentes

    if (totalPages <= 5) {
        // Si hay 5 o menos páginas, mostrar todos los botones
        for (let i = 1; i <= totalPages; i++) {
            paginationDiv.appendChild(crearBotonPagina(i));
        }
    } else {
        // Mostrar botones dinámicos con puntos suspensivos
        if (currentPage > 3) {
            // Botón para la primera página
            paginationDiv.appendChild(crearBotonPagina(1));
            if (currentPage > 4) {
                // Agregar "..." después de la primera página si estamos más allá de la página 3
                paginationDiv.appendChild(crearPuntosSuspensivos());
            }
        }

        // Mostrar dos botones alrededor de la página actual
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            paginationDiv.appendChild(crearBotonPagina(i));
        }

        if (currentPage < totalPages - 2) {
            // Agregar "..." antes de la última página si no estamos cerca del final
            paginationDiv.appendChild(crearPuntosSuspensivos());
        }

        // Botón para la última página
        paginationDiv.appendChild(crearBotonPagina(totalPages));
    }
}

// Función auxiliar para crear un botón de página
function crearBotonPagina(page) {
    const button = document.createElement('button');
    button.textContent = page;
    button.onclick = () => cambiarPagina(page);
    button.className = 'btn btn-outline-primary rounded-pill me-2';
    if (page === currentPage) button.classList.add('active'); // Resaltar la página actual
    return button;
}

// Función auxiliar para crear puntos suspensivos
function crearPuntosSuspensivos() {
    const span = document.createElement('span');
    span.textContent = '...';
    span.className = 'me-2'; // Añadir margen para separar los puntos suspensivos
    return span;
}

function cambiarPagina(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderizarTabla();
    }
}

function cambiarRegistrosPorPagina() {
    rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
    currentPage = 1;
    renderizarTabla();
}
// Ir a la primera página
function irAPrimeraPagina() {
    if (currentPage > 1) {
        currentPage = 1;
        renderizarTabla();
    }
}

// Ir a la página anterior
function irAPaginaAnterior() {
    if (currentPage > 1) {
        currentPage--;
        renderizarTabla();
    }
}

// Ir a la página siguiente
function irAPaginaSiguiente() {
    if (currentPage < totalPages) {
        currentPage++;
        renderizarTabla();
    }
}

// Ir a la última página
function irAUltimaPagina() {
    if (currentPage < totalPages) {
        currentPage = totalPages;
        renderizarTabla();
    }
}

function mostrarCargando(mostrar) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = mostrar ? 'block' : 'none';
    }
}

document.getElementById('agentesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const id = document.getElementById('id').value;
    const grado = document.getElementById('grado').value;
    const nombre = document.getElementById('nombre').value;
    const credencial = document.getElementById('credencial').value;
    const cuil = document.getElementById('cuil').value.replace(/-/g, ''); // Eliminar guiones
    const sector = document.getElementById('sector').value;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${apiUrl}/${id}` : apiUrl;

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grado, nombre, credencial, cuil, sector })
        });
        if (response.ok) {
            limpiarFormulario();
            cargarDatos();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
        }
    } catch (error) {
        console.error(error);
        alert('Error al comunicarse con el servidor');
    }
});

async function editarAgentes(id) {
    try {
        const response = await fetch(`${apiUrl}/${id}`);
        if (!response.ok) throw new Error(`Error al obtener el registro con ID ${id}`);
        const agente = await response.json();
        
        document.getElementById('id').value = agente.id || '';
        document.getElementById('grado').value = agente.grado || '';
        document.getElementById('nombre').value = agente.nombre || '';
        document.getElementById('credencial').value = agente.credencial || '';
        document.getElementById('cuil').value = agente.cuil || '';
        document.getElementById('sector').value = agente.sector || '';
        
        // Seleccionar el valor correcto en el menú desplegable "Grado"
        const gradoSelect = document.getElementById('grado');
        for (let option of gradoSelect.options) {
            if (option.value === agente.grado) {
                option.selected = true;
                break;
            }
        }
        
        // Seleccionar el valor correcto en el menú desplegable "Sector"
        const sectorSelect = document.getElementById('sector');
        for (let option of sectorSelect.options) {
            if (option.value === agente.sector) {
                option.selected = true;
                break;
            }
        }

    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
}

async function eliminarAgentes(id) {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
        const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            cargarDatos();
        } else {
            alert('Error al eliminar el registro');
        }
    }
}

function limpiarFormulario() {
    document.getElementById('id').value = '';
    document.getElementById('grado').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('credencial').value = '';
    document.getElementById('cuil').value = '';
    document.getElementById('sector').value = '';
}

function validarFormulario() {
    const grado = document.getElementById('grado').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const credencial = document.getElementById('credencial').value.trim();
    const cuil = document.getElementById('cuil').value.trim();
    const sector = document.getElementById('sector').value.trim();

    if (!grado || !nombre || !credencial || !cuil || !sector) {
        alert('Todos los campos son obligatorios.');
        return false;
    }
    return true;
}
