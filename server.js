require('dotenv').config(); // Carga las variables de entorno desde .env

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Configuración de la conexión a MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, // Añade esta opción para manejar conexiones simultáneas
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection()
    .then(() => {
        console.log('Conexión exitosa a la base de datos');
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1); // Detener el servidor si no se puede conectar
    });

// Validación de datos
function validateAgentData(data) {
    const { grado, nombre, credencial, cuil, sector } = data;

    if (!grado || !nombre || !credencial || !cuil || !sector) {
        return 'Faltan campos obligatorios';
    }

    if (!/^\d+$/.test(credencial)) {
        return 'La credencial debe ser numérica';
    }

    // Validar que el CUIL sea un número de 11 dígitos
    if (!/^\d{11}$/.test(cuil)) {
        return 'El Cuil debe ser un número de 11 dígitos';
    }

    return null;
}

// Rutas CRUD
app.get('/api/agentes', async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        const [results] = await db.execute(`
            SELECT * FROM agentes 
            WHERE grado LIKE ? OR nombre LIKE ? OR credencial LIKE ? OR cuil LIKE ? OR sector LIKE ?
        `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/agentes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await db.execute('SELECT * FROM agentes WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/agentes', async (req, res) => {
    const error = validateAgentData(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    const { grado, nombre, credencial, cuil, sector } = req.body;
    try {
        const [result] = await db.execute('INSERT INTO agentes (grado, nombre, credencial, cuil, sector) VALUES (?, ?, ?, ?, ?)', [grado, nombre, credencial, cuil, sector]);
        res.json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/agentes/:id', async (req, res) => {
    const { id } = req.params;
    const error = validateAgentData(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    const { grado, nombre, credencial, cuil, sector } = req.body;
    try {
        await db.execute('UPDATE agentes SET grado = ?, nombre = ?, credencial = ?, cuil = ?, sector = ? WHERE id = ?', [grado, nombre, credencial, cuil, sector, id]);
        res.json({ message: 'Registro actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/agentes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM agentes WHERE id = ?', [id]);
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});