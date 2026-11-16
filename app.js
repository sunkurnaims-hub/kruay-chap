// Product Data (กล้วยทั่วไปคัดพิเศษ 4 รสชาติ ราคา 10 บาท)
const products = [
    { id: 1, name: "กล้วยฉาบรสเคลือบน้ำตาล", price: 10, icon: "🍌🍯" },
    { id: 2, name: "กล้วยฉาบรสโนริสาหร่าย", price: 10, icon: "🍌🌿" },
    { id: 3, name: "กล้วยฉาบรสปาปริก้า", price: 10, icon: "🍌🌶️" },
    { id: 4, name: "กล้วยฉาบรสวิงซ์แซ่บ", price: 10, icon: "🍌🔥" }
];

let cart = [];
let orders = JSON.parse(localStorage.getItem('banana_orders')) || [];
let adminPassword = localStorage.getItem('banana_admin_pwd') || '1234';
let currentSlipData = null;

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const adminBtn = document.getElementById('admin-btn');
const adminModal = document.getElementById('admin-modal');
const closeAdmin = document.getElementById('close-admin');
const adminLoginSection = document.getElementById('admin-login-section');
const adminDashboardSection = document.getElementById('admin-dashboard-section');
const adminPasswordInput = document.getElementById('admin-password-input');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const adminOrdersBody = document.getElementById('admin-orders-body');
const statTodaySales = document.getElementById('stat-today-sales');
const statTotalOrders = document.getElementById('stat-total-orders');

const changePwdBtn = document.getElementById('change-pwd-btn');
const passwordModal = document.getElementById('password-modal');
const closePwd = document.getElementById('close-pwd');
const newPasswordInput = document.getElementById('new-password-input');
const saveNewPwdBtn = document.getElementById('save-new-pwd-btn');

const fulfillmentRadios = document.getElementsByName('fulfillment');
const addressBox = document.getElementById('address-box');
const paymentRadios = document.getElementsByName('payment');
const qrcodeBox = document.getElementById('qrcode-box');
const qrImage = document.getElementById('qr-image');
const qrTotalAmount = document.getElementById('qr-total-amount');
const slipFile = document.getElementById('slip-file');
const slipStatus = document.getElementById('slip-status');
const orderDateInput = document.getElementById('order-date');

// Initialize Store
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    setupEventListeners();
    orderDateInput.valueAsDate = new Date();
});

function renderProducts() {
    productGrid.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-img">${p.icon}</div>
            <div class="product-info">
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">${p.price} บาท / ถุง</div>
                <button class="btn btn-primary" onclick="addToCart(${p.id})">เพิ่มลงตะกร้า</button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalCount;

    cartItemsContainer.innerHTML = cart.length === 0 ? '<p class="text-sm">ไม่มีสินค้าในตะกร้า</p>' : 
        cart.map(item => `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <span class="text-sm">${item.price} บาท × ${item.qty}</span>
                </div>
                <div>
                    <button class="btn btn-outline" onclick="changeQty(${item.id}, -1)">-</button>
                    <span style="margin: 0 8px;">${item.qty}</span>
                    <button class="btn btn-outline" onclick="changeQty(${item.id}, 1)">+</button>
                </div>
            </div>
        `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const isDelivery = document.querySelector('input[name="fulfillment"]:checked').value === 'delivery';
    const deliveryFee = (isDelivery && cart.length > 0) ? 25 : 0;
    const grandTotal = subtotal + deliveryFee;

    cartTotal.textContent = grandTotal;
    qrTotalAmount.textContent = grandTotal;

    // Generate PromptPay QR Code using public QR API with PromptPay payload string
    // PromptPay ID: 0828347938
    const ppNumber = "0828347938";
    const amountStr = grandTotal.toFixed(2);
    // Simple QR data text representation for demo/testing or QR generator URL
    const qrText = `PromptPay:${ppNumber}|Amount:${amountStr}`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrText)}`;
}

function changeQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
    }
    updateCartUI();
}

function setupEventListeners() {
    cartBtn.onclick = () => cartModal.style.display = 'flex';
    closeCart.onclick = () => cartModal.style.display = 'none';

    adminBtn.onclick = () => {
        adminModal.style.display = 'flex';
        adminLoginSection.classList.remove('hidden');
        adminDashboardSection.classList.add('hidden');
        adminPasswordInput.value = '';
    };
    closeAdmin.onclick = () => adminModal.style.display = 'none';

    changePwdBtn.onclick = () => passwordModal.style.display = 'flex';
    closePwd.onclick = () => passwordModal.style.display = 'none';

    window.onclick = (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
        if (e.target === adminModal) adminModal.style.display = 'none';
        if (e.target === passwordModal) passwordModal.style.display = 'none';
    };

    fulfillmentRadios.forEach(radio => {
        radio.onchange = (e) => {
            if (e.target.value === 'delivery') {
                addressBox.classList.remove('hidden');
            } else {
                addressBox.classList.add('hidden');
            }
            updateCartUI();
        };
    });

    paymentRadios.forEach(radio => {
        radio.onchange = (e) => {
            if (e.target.value === 'promptpay') {
                qrcodeBox.classList.remove('hidden');
            } else {
                qrcodeBox.classList.add('hidden');
            }
        };
    });

    slipFile.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(uploadEvent) {
                currentSlipData = uploadEvent.target.result;
                slipStatus.textContent = "แนบสลิปเรียบร้อยแล้ว ✓";
                slipStatus.style.color = "green";
            };
            reader.readAsDataURL(file);
        }
    };

    adminLoginBtn.onclick = () => {
        if (adminPasswordInput.value === adminPassword) {
            adminLoginSection.classList.add('hidden');
            adminDashboardSection.classList.remove('hidden');
            renderAdminDashboard();
        } else {
            alert('รหัสผ่านไม่ถูกต้อง');
        }
    };

    adminLogoutBtn.onclick = () => {
        adminLoginSection.classList.remove('hidden');
        adminDashboardSection.classList.add('hidden');
    };

    saveNewPwdBtn.onclick = () => {
        const newPwd = newPasswordInput.value.trim();
        if (newPwd) {
            adminPassword = newPwd;
            localStorage.setItem('banana_admin_pwd', adminPassword);
            alert('เปลี่ยนรหัสผ่านสำเร็จ');
            passwordModal.style.display = 'none';
            newPasswordInput.value = '';
        } else {
            alert('กรุณากรอกรหัสผ่านใหม่');
        }
    };

    checkoutBtn.onclick = () => {
        if (cart.length === 0) {
            alert('กรุณาเลือกสินค้าในตะกร้าก่อนครับ');
            return;
        }

        const fulfillment = document.querySelector('input[name="fulfillment"]:checked').value;
        const address = document.getElementById('customer-address').value.trim();
        const payment = document.querySelector('input[name="payment"]:checked').value;
        const orderDate = orderDateInput.value;

        if (fulfillment === 'delivery' && !address) {
            alert('กรุณากรอกที่อยู่จัดส่ง เนื่องจากเลือกวิธีจัดส่งตามที่อยู่');
            return;
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const deliveryFee = (fulfillment === 'delivery') ? 25 : 0;
        const total = subtotal + deliveryFee;

        const newOrder = {
            id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            date: orderDate,
            items: [...cart],
            fulfillment: fulfillment === 'pickup' ? 'นัดรับที่วิทยาลัยชุมชนสงขลา' : 'จัดส่งตามที่อยู่ (' + address + ')',
            payment: payment === 'promptpay' ? 'พร้อมเพย์ QR' : 'เงินสด / จ่ายตอนรับสินค้า',
            total: total,
            slip: currentSlipData,
            status: payment === 'promptpay' && currentSlipData ? 'ชำระแล้ว (รอตรวจสอบ)' : 'รอชำระเงิน'
        };

        orders.unshift(newOrder);
        localStorage.setItem('banana_orders', JSON.stringify(orders));

        alert('สั่งซื้อสินค้าสำเร็จ! ขอบคุณที่อุดหนุนร้านกล้วยฉาบคุณสุครับ');
        cart = [];
        currentSlipData = null;
        slipStatus.textContent = "ยังไม่ได้แนบสลิป";
        document.getElementById('customer-address').value = '';
        updateCartUI();
        cartModal.style.display = 'none';
    };
}

function renderAdminDashboard() {
    statTotalOrders.textContent = orders.length + ' รายการ';
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = orders
        .filter(o => o.date === todayStr)
        .reduce((sum, o) => sum + o.total, 0);
    statTodaySales.textContent = todaySales + ' บาท';

    adminOrdersBody.innerHTML = orders.length === 0 ? '<tr><td colspan="7" style="text-align:center;">ยังไม่มีรายการออเดอร์</td></tr>' :
        orders.map((o, index) => `
            <tr>
                <td><strong>${o.id}</strong><br><span class="text-sm">${o.date}</span></td>
                <td>${o.items.map(i => `${i.name} (${i.qty})`).join(', ')}</td>
                <td>${o.fulfillment}</td>
                <td>${o.payment}</td>
                <td><strong>${o.total}</strong> บาท</td>
                <td>${o.slip ? `<a href="${o.slip}" target="_blank">ดูสลิป</a>` : '<span class="text-sm">ไม่มีสลิป</span>'}</td>
                <td>
                    <select onchange="updateOrderStatus(${index}, this.value)" class="form-control" style="padding: 4px;">
                        <option value="รอชำระเงิน" ${o.status === 'รอชำระเงิน' ? 'selected' : ''}>รอชำระเงิน</option>
                        <option value="ชำระแล้ว (รอตรวจสอบ)" ${o.status === 'ชำระแล้ว (รอตรวจสอบ)' ? 'selected' : ''}>ชำระแล้ว (รอตรวจสอบ)</option>
                        <option value="กำลังจัดเตรียม / ส่งมอบ" ${o.status === 'กำลังจัดเตรียม / ส่งมอบ' ? 'selected' : ''}>กำลังจัดเตรียม / ส่งมอบ</option>
                        <option value="สำเร็จ" ${o.status === 'สำเร็จ' ? 'selected' : ''}>สำเร็จ</option>
                    </select>
                </td>
            </tr>
        `).join('');
}

window.updateOrderStatus = function(index, newStatus) {
    orders[index].status = newStatus;
    localStorage.setItem('banana_orders', JSON.stringify(orders));
};