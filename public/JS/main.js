//fronted de retail aseo, usa la API RES del back end para mostrar productos, manejar el carrito y permitir registro/login/log out
const API = "/api"

//Estado de la aplicacion-------------------------------------------------
const state ={
    products: [],
    cart: JSON.parse(localStorage.getItem("cart") || "[]"), //recupera el carrito, token y usuario de la memoria
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user") || "null")
}

//Ayudantes de fetch-----------------------------------------------------
async function apiFetch(endpoint, options = {}) {
    const headers = {'Content-Type': 'application/json', ...options.headers};

    if(state.token){
        headers["Authorization"] = `Bearer ${state.token}` //añade la token a los headers si esta existe
    }

    const res = await fetch(`${API}${endpoint}`, {...options, headers});
    const data = await res.json();
    return {ok: res.ok, status: res.status, data};
}

//Toast notificaciones--------------------------------------------------
function showToast(message, type = "success"){
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`
    setTimeout(() => toast.classList.remove("show"), 3200);
}

//Guardar/Limpiar sesion------------------------------------------------
function saveSesion (token,user){
    state.token = token;
    state.user = user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user))
    updateAuthButton();
}

function clearSesion(){
    state.token = null;
    state.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    updateAuthButton()
}

function updateAuthButton(){
    const btn = document.getElementById("btn-login")
    if(state.user){
        btn.textContent = `👤 ${state.user.nombre.split(' ')[0]}`;
        btn.onclick = () =>{
            if(confirm("Cerrar sesion")){
                clearSesion();
                showToast("Sesion cerrada", "warning");
            }
        }
    }else {
        btn.textContent = "Iniciar sesión";
        btn.onclick = () => openModal("login-modal");
    }
}

//Modales--------------------------------------------------------------
function openModal(id){
    document.getElementById(id).classList.add("open")
}

function closeModal(id){
    document.getElementById(id).classList.remove("open")
}

document.getElementById("close-cart").onclick = () => closeModal("cart-modal")
document.getElementById("close-login").onclick = () => closeModal("login-modal")
document.querySelectorAll(".modal-overlay").forEach(m => m.addEventListener("click", e=> {
    if(e.target === m){
        m.classList.remove("open");
    }
}))

//Carrito-------------------------------------------------------------
function saveCart(){
    localStorage.setItem("cart", JSON.stringify(state.cart))
}

function addToCart(product){
    const existing = state.cart.find(i => i.id === product.id);

    if(existing){
        if(existing.qty >= product.stock){
            showToast("Stock maximo alcanzado.", "warning")
            return
        }
        existing.qty++
    }else{
        state.cart.push({id: product.id, nombre: product.nombre, precio: product.precio, qty:1, stock: product.stock})
    }

    saveCart();
    updateCartCount();
    showToast(`"${product.nombre}" agregado al carrito.`)
}

function updateCartCount(){
    const total = state.cart.reduce((acc,i) => acc + i.qty, 0);
    document.getElementById("cart-count").textContent = total;
}

function renderCart(){
    const body = document.getElementById("cart-body")
    const footer = document.getElementById("cart-footer")

    if(state.cart.length === 0){
        body.innerHTML = `<p class="empty-cart">Tu carrito esta vacío.</p>`
        footer.style.display = "none"
        return
    }

    footer.style.display = "flex";

    body.innerHTML = state.cart.map(item =>
        `<div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nombre}</div>
                <div class="cart-item-price">$${Number(item.precio).toLocaleString("es-CL")} c/u</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                <span class="qty-display">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">🗑</button>
            </div>
        </div>`
    ).join("");

    const total = state.cart.reduce((acc,i) => acc + i.precio * i.qty, 0);
    document.getElementById("cart-total").textContent = `$${total.toLocaleString("es-CL")}`; 
}

window.changeQty = (id, delta) => {
    const item = state.cart.find(i => i.id === id)

    if(!item){
        return
    }

    item.qty+=delta;

    if(item.qty <=0){
        removeFromCart(id);
        return
    }

    if(item.qty > item.stock){
        item.qty = item.stock;
        showToast("Stock maximo alcanzado.", "warning")
    }
    saveCart();
    renderCart();
    updateCartCount();
}

window.removeFromCart = (id) => {
    state.cart = state.cart.filter(i => i.id !== id);

    saveCart();
    renderCart();
    updateCartCount();
}

document.getElementById("cart-btn").onclick = () => {
    renderCart();
    openModal("cart-modal")
}

//toggle input de direccion para despacho
document.querySelectorAll('[name = "tipoEntrega"]').forEach(radio => {
    radio.addEventListener("change", e => {
        document.getElementById("address-section").style.display = e.target.value === "despacho" ? "block":"none"
    })
})

//Checkout-----------------------------------------------------------------
document.getElementById("checkout-btn").onclick = async () => {
    if(!state.token){
        closeModal("cart-modal");
        openModal("login-modal");
        showToast("Debes iniciar sesion para comprar.", "warning");
        return
    }

    const tipoEntrega = document.querySelector('[name="tipoEntrega"]:checked').value;
    const direccionEntrega = document.getElementById("address-input").value.trim();

    if(tipoEntrega === "despacho" && !direccionEntrega){
        showToast("Debes ingresar una dirección de entrega.", "warning");
        return
    }

    const payload = {
        tipoEntrega,
        direccionEntrega: tipoEntrega === "despacho"?direccionEntrega:null,
        items: state.cart.map(i => ({productId: i.id, cantidad: i.qty}))
    };

    const {ok, data} = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if(ok){
        state.cart = [];

        saveCart();
        updateCartCount();
        closeModal("cart-modal");
        showToast(`✅ Pedido #${data.data.id} confirmado. ¡Gracias por us compra!`, "success");
        loadProducts();
    }else{
        showToast(data.message || `Error al procesar el pedido`, "error")
    }
}

//Productos-----------------------------------------------------------------

function formatExpiry(dateStr){
    if(!dateStr){
        return
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const expiry = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil((expiry-today)/(1000 * 60 * 60 *24));

    if(diff < 0){
        return `<span class="product-expiry expiry-expired">⛔ Vencido</span>`
    }

    if(diff <= 30){
        return `<span class="product-expiry expiry-soon">⚠️ Vence en ${diff} días</span>`
    }

    return `<span class="product-expiry expiry-ok">✅ Vigente</span>`
}

function renderProducts(products){
    const grid = document.getElementById("products-grid")

    if(products.length === 0){
        grid.innerHTML = `<p class="loading-msg">No se encontraron productos.</p>`
        return
    }

    grid.innerHTML = products.map(p => {
        const imgContent = p.image ? `<img src="${p.image}" alt="${p.nombre}"/>`: `🧴`;

        return `<div class="product-card">
                    <div class="product-img">${imgContent}</div>
                    <div class="product-body">
                        <span class="product-category">${p.category?.nombre || "Sin Categoría"}</span>
                        <div class="product-name">${p.nombre}</div>
                        ${p.descripcion? `<div class="product-stock" style="color: var(--clr-gray-600); font-size: 0.85rem">${p.descripcion.substring(0,80)}${p.descripcion.length > 80?"...":""}</div>`:""}
                        ${formatExpiry(p.fechaVencimiento)}
                        <div class="product-price">$${Number(p.precio).toLocaleString("es-CL")}</div>
                        <div class="product-stock">Stock: ${p.stock} unidades</div>
                    </div>
                    <div class="product-footer">
                        <button class="btn btn-primary btn-sm btn-block" onclick="addToCart(${JSON.stringify({id:p.id, nombre:p.nombre, precio: Number(p.precio), stock: p.stock})})" ${p.stock === 0 ? "disabled": ""}>
                            ${p.stock === 0 ? "Sin Stock": "🛒 Agregar"}
                        </button>
                    </div>
                </div>`
    }).join("")
}

async function loadProducts(){
    const search = document.getElementById("search-input").value.trim();
    const category = document.getElementById("category-filter").value;
    const hideExpired = document.getElementById("hide-expired").checked;

    let endpoint = "/products?";

    if(search){
        endpoint += `search=${encodeURIComponent(search)}&`
    }

    if(category){
        endpoint+= `category=${category}`
    }

    const {ok, data} = await apiFetch(endpoint);

    if(!ok){
        showToast("Error al cargar productos", "error")
        return
    }

    let products = data.data || [];

    //filtrar los vencidos
    if(hideExpired){
        const today = new Date();
        today.setHours(0,0,0,0);
        products = products.filter(p => {
            if(!p.fechaVencimiento){
                return true
            }
            return new Date(p.fechaVencimiento + "T00:00:00") >= today;
        })
    }

    state.products = products;
    renderProducts(products)
}

async function loadCategories(){
    const {ok, data} = await apiFetch("/categories");

    if(!ok){
        return
    }

    const select = document.getElementById("category-filter");
    data.data.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.nombre;
        select.appendChild(opt)
    })
}

//Filtros-------------------------------------------------------------
let searchTimeout;

document.getElementById("search-input").addEventListener("input", () =>{
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadProducts, 350);//debounce 350ms
})

document.getElementById("category-filter").addEventListener("change", loadProducts)

document.getElementById("hide-expired").addEventListener("change", loadProducts)

//Formulario de autenticacion------------------------------------------
document.getElementById("go-to-register").onclick = (e) => {
    e.preventDefault();
    document.getElementById("login-form").style.display = "none";
    document.getElementById("register-form").style.display = "block";
    document.getElementById("auth-modal-title").textContent = "Crear cuenta";
    document.getElementById("auth-msg").textContent = "";
}

document.getElementById("go-to-login").onclick = (e) => {
    e.preventDefault();
    document.getElementById("register-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
    document.getElementById("auth-modal-title").textContent = "Iniciar Sesión";
    document.getElementById("auth-msg").textContent = "";
}

document.getElementById("submit-login").onclick = async() => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const msg = document.getElementById("auth-msg")

    if(!email || !password){
        msg.textContent = "Completa los campos.";
        msg.className = "auth-msg error";
        return
    }

    const {ok, data} = await apiFetch("/auth/login",{
        method: "POST",
        body: JSON.stringify({email, password})
    })

    if(ok){
        saveSesion(data.data.token, data.data.user);
        closeModal("login-modal");
        showToast(`¡Benvenido/a, ${data.data.user.nombre}!`);
    }else{
        msg.textContent = data.message || "credenciales inválidas"
        msg.className = "auth-msg error"
    }
}

document.getElementById("submit-register").onclick = async() =>{
    const nombre = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const telefono = document.getElementById("reg-telefono").value.trim();
    const msg = document.getElementById("auth-msg")

    if(!nombre || !email || !password){
        msg.textContent = "Nombre, Email y Contraseña obligatorios";
        msg.className = "auth-msg error"
    }

    const {ok, data } = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({nombre, email, password, telefono})
    })

    if(ok){
        saveSesion(data.data.token, data.data.user);
        closeModal("login-modal");
        showToast(`Cuenta creada. ¡Bienvenido/a ${data.data.user.nombre}!`)
    }else{
        msg.textContent = data.message || "Error al registrar";
        msg.className = "auth-msg error"
    }
}

//Verificar estado del Server------------------------------------------------------
async function checkServerStatus(){
    try{
        const res = await fetch("/status");
        const ok = res.ok;

        document.getElementById("server-status").innerHTML = ok? `<span class="ok">✓ Servidor operativo</span>`: `<span class="fail">✗ Sin Conexión</span>`
    }catch {
        document.getElementById("server-status").innerHTML = `<span class="fail">✗ Sin Conexión</span>`
    }
}

//Inicializar los procesos--------------------------------------------------------
(async function init(){
    updateAuthButton();
    updateCartCount();

    await checkServerStatus();
    await loadCategories();
    await loadProducts();
})();