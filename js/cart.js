// cart.js - cleaned: category removed, image path normalization kept

// Normalize image path to site root (/anh_cac_mon/...)
function normalizeImagePath(p) {
    if (!p) return '';
    p = String(p).replace(/\\/g, '/').trim();

    // absolute or protocol-relative URLs -> keep
    if (p.startsWith('http') || p.startsWith('//') || p.startsWith('/')) return p;

    // remove leading ./ or ../
    p = p.replace(/^(\.\/)+/, '').replace(/^(\.\.\/)+/, '');

    // if contains anh_cac_mon, ensure leading slash
    if (p.includes('anh_cac_mon')) {
        if (!p.startsWith('/')) p = '/' + p;
        return p;
    }

    // fallback default folder
    return '/anh_cac_mon/' + p;
}

class CartSystem {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.defaultImage = '/anh_cac_mon/default-food.jpg';
        this.init();
    }

    init() {
        this.setupAddToCartButtons();
        this.setupCartPage();
        this.setupCartEvents();
        this.updateCartCount();
    }

    setupAddToCartButtons() {
        // Delegated listener (works on menu pages and others)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-to-cart');
            if (!btn) return;
            this.addToCart(btn);
        });
    }

    addToCart(button) {
        if (!button) return;

        // Resolve image: prefer data-image, otherwise find nearest img in .menu-item
        let imgPath = button.dataset.image ? String(button.dataset.image).trim() : '';
        if (!imgPath) {
            const menuItem = button.closest('.menu-item');
            const imgEl = menuItem ? menuItem.querySelector('img') : null;
            imgPath = imgEl ? (imgEl.getAttribute('src') || '').trim() : '';
        }

        // Build product object (no category)
        const product = {
            id: String(button.dataset.id || '').trim() || ('p_' + Math.random().toString(36).slice(2,9)),
            name: String(button.dataset.name || '').trim() || 'Sản phẩm',
            price: parseInt(String(button.dataset.price || '0').replace(/\D/g, '')) || 0,
            image: imgPath ? normalizeImagePath(imgPath) : this.defaultImage
        };

        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartCount();
        this.showAddToCartAnimation(button);
        this.showNotification(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
    }

    setupCartPage() {
        if (!window.location.pathname.includes('cart.html')) return;
        this.loadCartItems();
        this.setupCheckoutProcess();
    }

    loadCartItems() {
        const container = document.getElementById('cart-items');
        if (!container) return;

        if (!this.cart || this.cart.length === 0) {
            this.showEmptyCart(container);
            this.updateCartSummary();
            return;
        }

        this.renderCartItems(container);
        this.updateCartSummary();
    }

    renderCartItems(container) {
        container.innerHTML = this.cart.map((item) => {
            const safeImg = item.image ? item.image : this.defaultImage;
            return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${safeImg}" alt="${(item.name || '').replace(/"/g, '&quot;')}" loading="lazy" onerror="this.onerror=null;this.src='${this.defaultImage}'">
                </div>
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">${this.formatCurrency(item.price)}</p>
                </div>
                <div class="cart-item-quantity" data-id="${item.id}">
                    <button class="quantity-btn" data-action="decrease" data-id="${item.id}" aria-label="Giảm số lượng">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display" data-id="${item.id}">${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-id="${item.id}" aria-label="Tăng số lượng">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total" data-id="${item.id}">
                    ${this.formatCurrency(item.price * item.quantity)}
                </div>
                <div class="cart-item-actions">
                    <button class="btn-remove" data-action="remove" data-id="${item.id}" title="Xóa sản phẩm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    setupCartEvents() {
        const container = document.getElementById('cart-items');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.quantity-btn, .btn-remove');
            if (!btn) return;

            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (!action || !id) return;

            if (action === 'increase') {
                this.changeQuantity(id, 1);
            } else if (action === 'decrease') {
                this.changeQuantity(id, -1);
            } else if (action === 'remove') {
                this.removeItem(id);
            }
        });
    }

    changeQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        item.quantity = (item.quantity || 1) + change;

        if (item.quantity <= 0) {
            if (confirm('Số lượng xuống 0 — bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                this.cart = this.cart.filter(it => it.id !== productId);
            } else {
                item.quantity = 1;
            }
        }

        this.saveCart();
        this.loadCartItems();
        this.updateCartCount();
    }

    removeItem(productId) {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.loadCartItems();
        this.updateCartCount();
        this.showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0);
        const discount = this.calculateDiscount(subtotal);
        const total = subtotal - discount;

        const elSubtotal = document.getElementById('cart-subtotal');
        const elDiscount = document.getElementById('cart-discount');
        const elTotal = document.getElementById('cart-total');

        if (elSubtotal) elSubtotal.textContent = this.formatCurrency(subtotal);
        if (elDiscount) elDiscount.textContent = `-${this.formatCurrency(discount)}`;
        if (elTotal) elTotal.textContent = this.formatCurrency(total);
    }

    calculateDiscount(subtotal) {
        if (subtotal > 500000) return 50000;
        if (subtotal > 300000) return 30000;
        return 0;
    }

    showEmptyCart(container) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3>Giỏ hàng của bạn đang trống</h3>
                <p>Hãy thêm những món ăn ngon vào giỏ hàng nhé!</p>
                <a href="menu.html" class="btn btn-primary">
                    <i class="fas fa-utensils"></i>
                    Khám phá thực đơn
                </a>
            </div>
        `;
    }

    setupCheckoutProcess() {
        const checkoutBtn = document.querySelector('.checkout-btn');
        const promoForm = document.querySelector('.promo-code');

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }

        if (promoForm) {
            promoForm.addEventListener('submit', (e) => this.applyPromoCode(e));
        }
    }

    handleCheckout() {
        if (!this.cart || this.cart.length === 0) {
            this.showNotification('Giỏ hàng của bạn đang trống!', 'error');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            if (confirm('Bạn cần đăng nhập để thanh toán. Chuyển đến trang đăng nhập?')) {
                window.location.href = 'login.html?redirect=cart';
            }
            return;
        }

        this.showCheckoutModal();
    }

    applyPromoCode(e) {
        e.preventDefault();
        const input = e.target.querySelector('input');
        const code = input ? input.value.trim() : '';

        if (!code) {
            this.showNotification('Vui lòng nhập mã giảm giá', 'error');
            return;
        }

        const promoCodes = {
            'HUONGQUE10': 0.1,
            'HUONGQUE50K': 50000,
            'WELCOME15': 0.15
        };

        if (promoCodes[code]) {
            this.showNotification('Áp dụng mã giảm giá thành công!', 'success');
        } else {
            this.showNotification('Mã giảm giá không hợp lệ!', 'error');
        }

        if (input) input.value = '';
    }

    saveCart() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        } catch (e) {
            console.error('Lưu cart vào localStorage thất bại:', e);
        }
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((total, item) => total + (item.quantity || 0), 0);
        document.querySelectorAll('.cart-count').forEach(element => {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showAddToCartAnimation(button) {
        const cartIcon = document.querySelector('.cart-icon');
        if (!cartIcon || !button) return;

        const rect = button.getBoundingClientRect();
        const animation = document.createElement('div');
        animation.className = 'add-to-cart-animation';
        animation.innerHTML = '🛒';
        animation.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            font-size: 20px;
            z-index: 10000;
            pointer-events: none;
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        document.body.appendChild(animation);

        requestAnimationFrame(() => {
            const cartRect = cartIcon.getBoundingClientRect();
            animation.style.left = `${cartRect.left + cartRect.width / 2}px`;
            animation.style.top = `${cartRect.top}px`;
            animation.style.opacity = '0';
            animation.style.transform = 'scale(0.5)';
        });

        setTimeout(() => {
            animation.remove();
        }, 800);
    }

    showCheckoutModal() {
        const modal = document.createElement('div');
        modal.className = 'checkout-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h3>Xác nhận đơn hàng</h3>
                <p>Bạn có muốn tiếp tục thanh toán?</p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="this.closest('.checkout-modal').remove()" class="btn" style="background: #95a5a6;">Hủy</button>
                    <button onclick="cartSystem.processPayment()" class="btn btn-primary">Thanh toán</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    processPayment() {
        this.showNotification('Thanh toán thành công! Cảm ơn bạn đã mua hàng.', 'success');

        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        this.loadCartItems();

        document.querySelector('.checkout-modal')?.remove();

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Safe initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.cartSystem = new CartSystem();
    } catch (err) {
        console.error('CartSystem initialization error:', err);
    }
});
