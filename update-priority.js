const fs = require('fs');
const path = require('path');

// Ruta correcta al archivo
const filePath = path.join(__dirname, 'data', 'projects.json');

console.log('📂 Leyendo archivo:', filePath);

// Leer projects.json
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`📊 Total de proyectos: ${data.projects.length}`);

// Agregar priorityNumber a proyectos que no lo tienen
let updated = 0;
data.projects.forEach((project, index) => {
    if (!project.priorityNumber) {
        project.priorityNumber = index + 1;
        updated++;
    }
});

console.log(`✅ Proyectos actualizados con priorityNumber: ${updated}`);

// Guardar de vuelta
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ Archivo projects.json actualizado correctamente');