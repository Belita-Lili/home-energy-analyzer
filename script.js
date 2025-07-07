document.addEventListener('DOMContentLoaded', function() {
    // Configuración inicial
    const config = {
        costoPorKwh: 0.15,
        co2PorKwh: 0.5,
        dispositivos: [
            {
                id: 1,
                nombre: "Refrigerador",
                potencia: 150,
                horasUso: 24,
                eficiencia: 70,
                prioridad: "alta"
            },
            {
                id: 2,
                nombre: "Aire Acondicionado",
                potencia: 1000,
                horasUso: 8,
                eficiencia: 50,
                prioridad: "alta"
            },
            {
                id: 3,
                nombre: "Iluminación LED",
                potencia: 10,
                horasUso: 12,
                eficiencia: 85,
                prioridad: "media"
            },
            {
                id: 4,
                nombre: "Televisor",
                potencia: 120,
                horasUso: 6,
                eficiencia: 75,
                prioridad: "media"
            },
            {
                id: 5,
                nombre: "Lavadora",
                potencia: 500,
                horasUso: 1,
                eficiencia: 65,
                prioridad: "baja"
            }
        ]
    };

    // Elementos del DOM
    const elementos = {
        agregarBtn: document.getElementById('agregar-dispositivo'),
        formularioSection: document.getElementById('formulario-dispositivo'),
        overlay: document.createElement('div'),
        cancelarBtn: document.getElementById('cancelar'),
        dispositivoForm: document.getElementById('nuevo-dispositivo-form'),
        listaDispositivos: document.getElementById('lista-dispositivos'),
        listaRecomendaciones: document.getElementById('lista-recomendaciones'),
        tituloFormulario: document.getElementById('titulo-formulario'),
        dispositivoId: document.getElementById('dispositivo-id'),
        consumoTotal: document.getElementById('consumo-total'),
        costoTotal: document.getElementById('costo-total'),
        eficienciaTotal: document.getElementById('eficiencia-total'),
        nivelEficiencia: document.getElementById('nivel-eficiencia'),
        co2Total: document.getElementById('co2-total'),
        tarifaValor: document.getElementById('tarifa-valor'),
        editarTarifaBtn: document.getElementById('editar-tarifa')
    };

    // Inicializar gráficos
    const ctxConsumo = document.getElementById('consumo-chart').getContext('2d');
    const ctxEficiencia = document.getElementById('eficiencia-chart').getContext('2d');
    
    const consumoChart = new Chart(ctxConsumo, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Consumo diario (kWh)',
                data: [],
                backgroundColor: '#2f87af',
                borderColor: '#19759c',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'kWh/día'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)} kWh`;
                        }
                    }
                }
            }
        }
    });
    
    const eficienciaChart = new Chart(ctxEficiencia, {
        type: 'doughnut',
        data: {
            labels: ['Alta eficiencia', 'Media eficiencia', 'Baja eficiencia'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#1dd1a1',
                    '#feca57',
                    '#ff6b6b'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} dispositivos`;
                        }
                    }
                }
            }
        }
    });

    // Crear overlay
    elementos.overlay.className = 'overlay';
    document.body.appendChild(elementos.overlay);

    // Cargar dispositivos iniciales
    cargarDispositivos();
    actualizarAnalisisTotal();
    generarRecomendaciones();

    // Event listeners
    elementos.agregarBtn.addEventListener('click', mostrarFormulario);
    elementos.cancelarBtn.addEventListener('click', ocultarFormulario);
    elementos.dispositivoForm.addEventListener('submit', guardarDispositivo);
    elementos.editarTarifaBtn.addEventListener('click', editarTarifa);

    // Función para cargar dispositivos en la lista
    function cargarDispositivos() {
        elementos.listaDispositivos.innerHTML = '';
        
        config.dispositivos.forEach(dispositivo => {
            const consumoKwh = calcularConsumo(dispositivo);
            const costo = consumoKwh * config.costoPorKwh;
            const co2 = consumoKwh * config.co2PorKwh;
            
            const dispositivoElement = document.createElement('div');
            dispositivoElement.className = 'dispositivo';
            dispositivoElement.dataset.id = dispositivo.id;
            dispositivoElement.innerHTML = `
                <h3>${dispositivo.nombre} <span class="prioridad ${dispositivo.prioridad}">${dispositivo.prioridad}</span></h3>
                <p><strong>Potencia:</strong> ${dispositivo.potencia} W</p>
                <p><strong>Uso diario:</strong> ${dispositivo.horasUso} horas</p>
                <p><strong>Eficiencia:</strong> ${dispositivo.eficiencia}%</p>
                <p class="consumo"><strong>Consumo:</strong> ${consumoKwh.toFixed(2)} kWh/día - <strong>Costo:</strong> $${costo.toFixed(2)} - <strong>CO₂:</strong> ${co2.toFixed(2)} kg</p>
                <div class="acciones">
                    <button class="btn-editar" data-id="${dispositivo.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${dispositivo.id}">Eliminar</button>
                </div>
            `;
            
            elementos.listaDispositivos.appendChild(dispositivoElement);
        });
        
        // Agregar eventos a los botones de editar y eliminar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', editarDispositivo);
        });
        
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', eliminarDispositivo);
        });
        
        actualizarGraficos();
    }

    // Función para calcular el consumo de un dispositivo
    function calcularConsumo(dispositivo) {
        return (dispositivo.potencia * dispositivo.horasUso * (100/dispositivo.eficiencia)) / 1000;
    }

    // Función para actualizar el análisis total
    function actualizarAnalisisTotal() {
        let totalKwh = 0;
        let totalEficiencia = 0;
        
        config.dispositivos.forEach(dispositivo => {
            const consumo = calcularConsumo(dispositivo);
            totalKwh += consumo;
            totalEficiencia += dispositivo.eficiencia;
        });
        
        const promedioEficiencia = totalEficiencia / config.dispositivos.length;
        const totalCosto = totalKwh * config.costoPorKwh;
        const totalCo2 = totalKwh * config.co2PorKwh;
        
        elementos.consumoTotal.textContent = `${totalKwh.toFixed(2)} kWh`;
        elementos.costoTotal.textContent = `$${totalCosto.toFixed(2)}`;
        elementos.eficienciaTotal.textContent = `${Math.round(promedioEficiencia)}/100`;
        elementos.nivelEficiencia.style.width = `${promedioEficiencia}%`;
        elementos.co2Total.textContent = `${totalCo2.toFixed(2)} kg CO₂`;
        elementos.tarifaValor.textContent = config.costoPorKwh.toFixed(2);
    }

    // Función para actualizar los gráficos
    function actualizarGraficos() {
        // Gráfico de consumo
        const nombres = config.dispositivos.map(d => d.nombre);
        const consumos = config.dispositivos.map(calcularConsumo);
        
        consumoChart.data.labels = nombres;
        consumoChart.data.datasets[0].data = consumos;
        consumoChart.update();
        
        // Gráfico de eficiencia
        const altaEficiencia = config.dispositivos.filter(d => d.eficiencia >= 80).length;
        const mediaEficiencia = config.dispositivos.filter(d => d.eficiencia >= 50 && d.eficiencia < 80).length;
        const bajaEficiencia = config.dispositivos.filter(d => d.eficiencia < 50).length;
        
        eficienciaChart.data.datasets[0].data = [altaEficiencia, mediaEficiencia, bajaEficiencia];
        eficienciaChart.update();
    }

    // Función para generar recomendaciones inteligentes
    function generarRecomendaciones() {
        elementos.listaRecomendaciones.innerHTML = '';
        
        // 1. Recomendaciones basadas en eficiencia
        const dispositivosBajaEficiencia = config.dispositivos.filter(d => d.eficiencia < 60);
        
        dispositivosBajaEficiencia.forEach(dispositivo => {
            const consumo = calcularConsumo(dispositivo);
            
            const recomendacion = document.createElement('div');
            recomendacion.className = 'recomendacion importante';
            
            let mensaje = `Considera reemplazar tu ${dispositivo.nombre} por un modelo más eficiente (actual: ${dispositivo.eficiencia}%). `;
            
            if (consumo > 5) {
                mensaje += `Este dispositivo es uno de los que más consume en tu hogar (${consumo.toFixed(2)} kWh/día).`;
            } else if (consumo > 2) {
                mensaje += `Este dispositivo tiene un consumo significativo (${consumo.toFixed(2)} kWh/día).`;
            }
            
            recomendacion.innerHTML = `<p>${mensaje}</p>`;
            elementos.listaRecomendaciones.appendChild(recomendacion);
        });
        
        // 2. Recomendaciones para dispositivos de alta prioridad
        const dispositivosAltaPrioridad = config.dispositivos.filter(d => d.prioridad === "alta" && d.horasUso > 4);
        
        dispositivosAltaPrioridad.forEach(dispositivo => {
            const recomendacion = document.createElement('div');
            recomendacion.className = 'recomendacion importante';
            
            let mensaje = `El ${dispositivo.nombre} tiene un uso prolongado (${dispositivo.horasUso} horas/día). `;
            
            if (dispositivo.nombre.toLowerCase().includes('aire acondicionado')) {
                mensaje += "Reduce su tiempo de uso o busca alternativas más eficientes. Usa ventiladores o abre ventanas cuando sea posible.";
            } else if (dispositivo.nombre.toLowerCase().includes('refrigerador')) {
                mensaje += "Asegúrate de mantener una temperatura óptima (4°C para refrigerador, -18°C para freezer) y revisa los sellos de las puertas.";
            }
            
            recomendacion.innerHTML = `<p>${mensaje}</p>`;
            elementos.listaRecomendaciones.appendChild(recomendacion);
        });
        
        // 3. Recomendaciones generales de ahorro
        const recomendacionesGenerales = [
            {
                mensaje: "Programa el uso de dispositivos de alto consumo en horas de menor demanda eléctrica (generalmente por la noche).",
                tipo: "ahorro"
            },
            {
                mensaje: "Desconecta los dispositivos que no estés usando para evitar consumo fantasma.",
                tipo: "ahorro"
            },
            {
                mensaje: "Realiza mantenimiento periódico a tus dispositivos para mantener su eficiencia.",
                tipo: "ahorro"
            }
        ];
        
        recomendacionesGenerales.forEach(rec => {
            const recomendacion = document.createElement('div');
            recomendacion.className = `recomendacion ${rec.tipo}`;
            recomendacion.innerHTML = `<p>${rec.mensaje}</p>`;
            elementos.listaRecomendaciones.appendChild(recomendacion);
        });
    }

    // Funciones para el formulario
    function mostrarFormulario() {
        elementos.tituloFormulario.textContent = "Agregar Nuevo Dispositivo";
        elementos.dispositivoId.value = "";
        elementos.dispositivoForm.reset();
        elementos.formularioSection.style.display = "block";
        elementos.overlay.style.display = "block";
    }

    function ocultarFormulario() {
        elementos.formularioSection.style.display = "none";
        elementos.overlay.style.display = "none";
    }

    function editarDispositivo(e) {
        const id = parseInt(e.target.dataset.id);
        const dispositivo = config.dispositivos.find(d => d.id === id);
        
        if (dispositivo) {
            elementos.tituloFormulario.textContent = "Editar Dispositivo";
            elementos.dispositivoId.value = dispositivo.id;
            document.getElementById('nombre').value = dispositivo.nombre;
            document.getElementById('potencia').value = dispositivo.potencia;
            document.getElementById('horas-uso').value = dispositivo.horasUso;
            document.getElementById('eficiencia').value = dispositivo.eficiencia;
            document.getElementById('prioridad').value = dispositivo.prioridad;
            
            elementos.formularioSection.style.display = "block";
            elementos.overlay.style.display = "block";
        }
    }

    function guardarDispositivo(e) {
        e.preventDefault();
        
        const dispositivo = {
            id: elementos.dispositivoId.value ? parseInt(elementos.dispositivoId.value) : generarNuevoId(),
            nombre: document.getElementById('nombre').value,
            potencia: parseFloat(document.getElementById('potencia').value),
            horasUso: parseFloat(document.getElementById('horas-uso').value),
            eficiencia: parseFloat(document.getElementById('eficiencia').value),
            prioridad: document.getElementById('prioridad').value
        };
        
        if (elementos.dispositivoId.value) {
            // Editar dispositivo existente
            const index = config.dispositivos.findIndex(d => d.id === dispositivo.id);
            if (index !== -1) {
                config.dispositivos[index] = dispositivo;
            }
        } else {
            // Agregar nuevo dispositivo
            config.dispositivos.push(dispositivo);
        }
        
        ocultarFormulario();
        cargarDispositivos();
        actualizarAnalisisTotal();
        generarRecomendaciones();
    }

    function generarNuevoId() {
        return config.dispositivos.length > 0 ? 
            Math.max(...config.dispositivos.map(d => d.id)) + 1 : 1;
    }

    function eliminarDispositivo(e) {
        const id = parseInt(e.target.dataset.id);
        config.dispositivos = config.dispositivos.filter(d => d.id !== id);
        
        cargarDispositivos();
        actualizarAnalisisTotal();
        generarRecomendaciones();
    }

    function editarTarifa() {
        const nuevaTarifa = prompt("Ingresa el nuevo costo por kWh:", config.costoPorKwh.toFixed(2));
        
        if (nuevaTarifa !== null && !isNaN(parseFloat(nuevaTarifa))) {
            config.costoPorKwh = parseFloat(nuevaTarifa);
            actualizarAnalisisTotal();
            cargarDispositivos();
        }
    }
});