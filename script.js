// ------------------------------
// Datos iniciales
// ------------------------------
if (!localStorage.getItem('menu')) {
    const menu = [
        { id: 1, nombre: "Pizza Margarita", precio: 25, categoria: "Pizzas" },
        { id: 2, nombre: "Hamburguesa Clásica", precio: 18, categoria: "Hamburguesas" },
        { id: 3, nombre: "Soda", precio: 5, categoria: "Bebidas" }
    ];
    localStorage.setItem('menu', JSON.stringify(menu));
}

if (!localStorage.getItem('oferta')) {
    localStorage.setItem('oferta', "2x1 en Hamburguesas hasta las 16h!");
}

if (!localStorage.getItem('pedidos')) {
    localStorage.setItem('pedidos', JSON.stringify([]));
}

// ------------------------------
// Cliente
// ------------------------------
if (document.title.includes("Restaurante Online")) {
    cargarMenu();
    cargarOferta();
}

function cargarMenu() {
    const productos = JSON.parse(localStorage.getItem('menu'));
    const contenedor = document.getElementById('productos');
    contenedor.innerHTML = "";
    productos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${p.nombre}</h3>
                          <p>Precio: $${p.precio}</p>
                          <button onclick="agregarAlCarrito(${p.id})">Agregar al carrito</button>`;
        contenedor.appendChild(div);
    });
}

function cargarOferta() {
    document.getElementById('ofertaTexto').innerText = localStorage.getItem('oferta');
}

let carrito = [];

function agregarAlCarrito(id) {
    const producto = JSON.parse(localStorage.getItem('menu')).find(p => p.id === id);
    carrito.push(producto);
    actualizarCarrito();
    mostrarNotificacion("Agregado al carrito");
}

function actualizarCarrito() {
    document.getElementById('cartCount').innerText = carrito.length;
}

function showCart() {
    const items = document.getElementById('cartItems');
    items.innerHTML = "";
    let total = 0;
    carrito.forEach((p, i) => {
        items.innerHTML += `<p>${p.nombre} - $${p.precio} <button onclick="eliminarDelCarrito(${i})">❌</button></p>`;
        total += p.precio;
    });
    document.getElementById('cartTotal').innerText = total.toFixed(2);
    document.getElementById('carrito').classList.remove('hidden');
}

function hideCart() {
    document.getElementById('carrito').classList.add('hidden');
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
    showCart();
}

function confirmarPedido() {
    const nombre = document.getElementById('nombreCliente').value.trim();
    const telefono = document.getElementById('telefonoCliente').value.trim();
    const direccion = document.getElementById('direccionCliente').value.trim();
    if (!nombre || !telefono || !direccion) {
        alert("Por favor completa tus datos antes de confirmar el pedido.");
        return;
    }

    const total = carrito.reduce((sum, p) => sum + p.precio, 0);

    const pedidos = JSON.parse(localStorage.getItem('pedidos'));
    pedidos.push({
        nombre, telefono, direccion,
        id: Date.now(),
        productos: carrito,
        estado: "Pendiente",
        total: total
    });
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    alert("Pedido enviado");
    carrito = [];
    actualizarCarrito();
    hideCart();
}

// ------------------------------
// Dashboard
// ------------------------------
if (document.title.includes("Dashboard")) {
    cargarPedidos();
    cargarOfertaDashboard();
    cargarMenuDashboard();

    // Actualiza automáticamente cada 5 segundos
    setInterval(cargarPedidos, 5000);
}

function mostrarSeccion(seccion) {
    document.getElementById('seccionPedidos').classList.add('hidden');
    document.getElementById('seccionOfertas').classList.add('hidden');
    document.getElementById('seccionMenu').classList.add('hidden');
    document.getElementById(`seccion${seccion.charAt(0).toUpperCase() + seccion.slice(1)}`).classList.remove('hidden');
}

function cargarPedidos() {
    const pedidos = JSON.parse(localStorage.getItem('pedidos'));
    const contenedor = document.getElementById('listaPedidos');
    contenedor.innerHTML = "";
    pedidos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'card';
        const productos = p.productos.map(pr => pr.nombre).join(", ");
        const cliente = `👤 ${p.nombre} | 📞 ${p.telefono} | 📍 ${p.direccion}`;
        div.innerHTML = `<p>Pedido #${p.id}</p><p>${cliente}</p>
                          <p>Productos: ${productos}</p>
                          <p>Estado: ${p.estado}</p>
                          <button onclick="cambiarEstadoPedido(${p.id}, 'Aceptado')">Aceptar</button>
                          <button onclick="cambiarEstadoPedido(${p.id}, 'Cancelado')">Cancelar</button>
                          ${p.estado === 'Aceptado' ? `<button onclick="cambiarEstadoPedido(${p.id}, 'Finalizado')">Finalizar</button>` : ''}
                          <button onclick="eliminarPedido(${p.id})">🗑 Eliminar</button>`;
        contenedor.appendChild(div);
    });
}

function cambiarEstadoPedido(id, estado) {
    const pedidos = JSON.parse(localStorage.getItem('pedidos'));
    const pedido = pedidos.find(p => p.id === id);
    pedido.estado = estado;
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    cargarPedidos();
}

function eliminarPedido(id) {
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const nuevosPedidos = pedidos.filter(p => p.id !== id);
    localStorage.setItem('pedidos', JSON.stringify(nuevosPedidos));
    cargarPedidos();
}

function cargarOfertaDashboard() {
    document.getElementById('inputOferta').value = localStorage.getItem('oferta');
}

function guardarOferta() {
    const texto = document.getElementById('inputOferta').value;
    localStorage.setItem('oferta', texto);
    alert("Oferta guardada");
}

function cargarMenuDashboard() {
    const menu = JSON.parse(localStorage.getItem('menu'));
    const contenedor = document.getElementById('listaMenu');
    contenedor.innerHTML = "";
    menu.forEach(p => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<p>${p.nombre} - $${p.precio} (${p.categoria})</p>
                          <button onclick="eliminarProducto(${p.id})">Eliminar</button>`;
        contenedor.appendChild(div);
    });
}

function agregarProducto() {
    const nombre = document.getElementById('nombreProd').value;
    const precio = parseFloat(document.getElementById('precioProd').value);
    const categoria = document.getElementById('categoriaProd').value;
    if (!nombre || !precio || !categoria) {
        alert("Rellena todos los campos");
        return;
    }
    const menu = JSON.parse(localStorage.getItem('menu'));
    menu.push({ id: Date.now(), nombre, precio, categoria });
    localStorage.setItem('menu', JSON.stringify(menu));
    cargarMenuDashboard();
}

function eliminarProducto(id) {
    let menu = JSON.parse(localStorage.getItem('menu'));
    menu = menu.filter(p => p.id !== id);
    localStorage.setItem('menu', JSON.stringify(menu));
    cargarMenuDashboard();
}

// ------------------------------
// Generar reporte de pedidos finalizados
// ------------------------------
function generarReporte() {
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const pedidosFinalizados = pedidos.filter(p => p.estado === 'Finalizado');

    let texto = `📄 Reporte de Pedidos Finalizados - ${new Date().toLocaleDateString()}\n\n`;
    texto += `Total de pedidos: ${pedidosFinalizados.length}\n`;

    const totalVentas = pedidosFinalizados.reduce((sum, p) => sum + p.total, 0);
    texto += `Monto total vendido: $${totalVentas}\n\n`;

    pedidosFinalizados.forEach(p => {
        texto += `🆔 Pedido: ${p.id}\n`;
        texto += `Cliente: ${p.nombre} | Tel: ${p.telefono} | Dir: ${p.direccion}\n`;
        texto += `Productos: ${p.productos.map(pr => pr.nombre).join(', ')}\n`;
        texto += `Total: $${p.total}\n`;
        texto += `-------------------------------\n`;
    });

    const blob = new Blob([texto], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reporte_pedidos_finalizados.txt';
    link.click();
}

// ------------------------------
// Notificación agregar al carrito
// ------------------------------
function mostrarNotificacion(mensaje) {
    const notif = document.createElement('div');
    notif.className = 'notificacion';
    notif.innerText = mensaje;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.remove();
    }, 2000);
}
