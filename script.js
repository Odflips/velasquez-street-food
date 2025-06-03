// ------------------------------
// 🔥 Conexión a Firebase
// ------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvcpCXIQa9tlTgb5Xk7me4BKesSmsPoNo",
  authDomain: "jaime-restaurant.firebaseapp.com",
  projectId: "jaime-restaurant",
  storageBucket: "jaime-restaurant.appspot.com",  // ✔️ Corregido
  messagingSenderId: "582421284418",
  appId: "1:582421284418:web:4e057918b72b8f7f4f8fdb",
  measurementId: "G-2CBJCP2YF2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ------------------------------
// Datos iniciales (solo locales)
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
    mostrarNotificacion("✅ Agregado al carrito");
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

async function confirmarPedido() {
    const nombre = document.getElementById('nombreCliente').value.trim();
    const telefono = document.getElementById('telefonoCliente').value.trim();
    const direccion = document.getElementById('direccionCliente').value.trim();

    if (!nombre || !telefono || !direccion) {
        alert("Por favor completa tus datos antes de confirmar el pedido.");
        return;
    }

    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    const total = carrito.reduce((sum, p) => sum + p.precio, 0);

    try {
        await addDoc(collection(db, "pedidos"), {
            nombre,
            telefono,
            direccion,
            productos: carrito,
            estado: "Pendiente",
            total: total,
            fecha: new Date().toISOString()
        });

        mostrarNotificacion("✅ Pedido enviado correctamente");
        alert("Pedido enviado exitosamente");

        carrito = [];
        actualizarCarrito();
        hideCart();
    } catch (error) {
        console.error("❌ Error al enviar el pedido:", error);
        alert("❌ Error al enviar el pedido. Revisa la consola.");
    }
}

// ------------------------------
// Dashboard con Firebase 🔥
// ------------------------------
if (document.title.includes("Dashboard")) {
    cargarPedidosRealtime();
    cargarOfertaDashboard();
    cargarMenuDashboard();
}

function mostrarSeccion(seccion) {
    document.getElementById('seccionPedidos').classList.add('hidden');
    document.getElementById('seccionOfertas').classList.add('hidden');
    document.getElementById('seccionMenu').classList.add('hidden');
    document.getElementById(`seccion${seccion.charAt(0).toUpperCase() + seccion.slice(1)}`).classList.remove('hidden');
}

function cargarPedidosRealtime() {
    const contenedor = document.getElementById('listaPedidos');
    const pedidosRef = collection(db, "pedidos");
    onSnapshot(pedidosRef, (snapshot) => {
        contenedor.innerHTML = "";
        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const id = docSnap.id;
            const productos = p.productos.map(pr => pr.nombre).join(", ");
            const cliente = `👤 ${p.nombre} | 📞 ${p.telefono} | 📍 ${p.direccion}`;

            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `<p>Pedido #${id}</p><p>${cliente}</p>
                              <p>Productos: ${productos}</p>
                              <p>Estado: ${p.estado}</p>
                              <p>Total: $${p.total}</p>
                              <button onclick="cambiarEstadoPedido('${id}', 'Aceptado')">Aceptar</button>
                              <button onclick="cambiarEstadoPedido('${id}', 'Cancelado')">Cancelar</button>
                              ${p.estado === 'Aceptado' ? `<button onclick="cambiarEstadoPedido('${id}', 'Finalizado')">Finalizar</button>` : ''}
                              <button onclick="eliminarPedido('${id}')">🗑 Eliminar</button>`;
            contenedor.appendChild(div);
        });
    });
}

async function cambiarEstadoPedido(id, estado) {
    const pedidoRef = doc(db, "pedidos", id);
    await updateDoc(pedidoRef, { estado: estado });
}

async function eliminarPedido(id) {
    await deleteDoc(doc(db, "pedidos", id));
}

async function generarReporte() {
    const snapshot = await getDocs(collection(db, "pedidos"));
    const pedidos = [];
    snapshot.forEach(docSnap => {
        const p = docSnap.data();
        if (p.estado === 'Finalizado') {
            pedidos.push(p);
        }
    });

    const totalPedidos = pedidos.length;
    const totalVentas = pedidos.reduce((sum, p) => sum + (p.total || 0), 0);

    let texto = `📄 Reporte de Pedidos Finalizados - ${new Date().toLocaleDateString()}\n\n`;
    texto += `Total de pedidos: ${totalPedidos}\n`;
    texto += `Monto total vendido: $${totalVentas}\n\n`;

    pedidos.forEach(p => {
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
// Ofertas y Menú (Local)
// ------------------------------
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
// Notificación agregar al carrito
// ------------------------------
function mostrarNotificacion(mensaje) {
    const notif = document.createElement('div');
    notif.className = 'notificacion';
    notif.innerText = mensaje;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.remove();
    }, 3000);
}

// ------------------------------
// Hacer funciones accesibles al HTML
// ------------------------------
window.cargarMenu = cargarMenu;
window.cargarOferta = cargarOferta;
window.agregarAlCarrito = agregarAlCarrito;
window.showCart = showCart;
window.hideCart = hideCart;
window.eliminarDelCarrito = eliminarDelCarrito;
window.confirmarPedido = confirmarPedido;

window.cargarPedidosRealtime = cargarPedidosRealtime;
window.cambiarEstadoPedido = cambiarEstadoPedido;
window.eliminarPedido = eliminarPedido;
window.generarReporte = generarReporte;

window.mostrarSeccion = mostrarSeccion;
window.cargarOfertaDashboard = cargarOfertaDashboard;
window.guardarOferta = guardarOferta;
window.cargarMenuDashboard = cargarMenuDashboard;
window.agregarProducto = agregarProducto;
window.eliminarProducto = eliminarProducto;
