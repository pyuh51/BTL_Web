class CartSystem {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("cart")) || [];
    this.defaultImage = "../images/default-food.jpg";
    this.init();
  }

  init() {
    this.setupAddToCartButtons();
    this.setupCartPage();
    this.setupCartEvents();
    this.updateCartCount();
  }

  setupAddToCartButtons() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-cart");
      if (!btn) return;
      this.addToCart(btn);
    });
  }

  addToCart(button) {
    if (!button) return;

    let imgPath = button.dataset.image
      ? String(button.dataset.image).trim()
      : "";
    if (!imgPath) {
      const menuItem = button.closest(".menu-item");
      const imgEl = menuItem ? menuItem.querySelector("img") : null;
      imgPath = imgEl ? (imgEl.getAttribute("src") || "").trim() : "";
    }

    const product = {
      id:
        String(button.dataset.id || "").trim() ||
        "p_" + Math.random().toString(36).slice(2, 9),
      name: String(button.dataset.name || "").trim() || "Sản phẩm",
      price:
        parseInt(String(button.dataset.price || "0").replace(/\D/g, "")) || 0,
      image: imgPath ? this.normalizeImagePath(imgPath) : this.defaultImage,
    };

    const existingItem = this.cart.find((item) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      this.cart.push({
        ...product,
        quantity: 1,
      });
    }

    this.saveCart();
    this.updateCartCount();
    this.showAddToCartAnimation(button);
    this.showNotification(
      ` Đã thêm "${product.name}" vào giỏ hàng!`,
      "success"
    );
  }

  normalizeImagePath(path) {
    if (!path) return "";
    path = String(path).replace(/\\/g, "/").trim();

    if (
      path.startsWith("http") ||
      path.startsWith("//") ||
      path.startsWith("../")
    )
      return path;

    if (path.includes("images")) {
      if (!path.startsWith("../")) return "../" + path;
      return path;
    }

    return "../images/" + path;
  }

  setupCartPage() {
    if (!window.location.pathname.includes("cart.html")) return;
    this.loadCartItems();
    this.setupCheckoutProcess();
  }

  loadCartItems() {
    const container = document.getElementById("cart-items");
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
    container.innerHTML = this.cart
      .map((item) => {
        const safeImg = item.image ? item.image : this.defaultImage;
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${safeImg}" alt="${this.escapeHtml(
          item.name
        )}" loading="lazy" onerror="this.onerror=null;this.src='${
          this.defaultImage
        }'">
                </div>
                <div class="cart-item-details">
                    <h3>${this.escapeHtml(item.name)}</h3>
                    <p class="cart-item-price">${this.formatCurrency(
                      item.price
                    )}</p>
                </div>
                <div class="cart-item-quantity" data-id="${item.id}">
                    <button class="quantity-btn" data-action="decrease" data-id="${
                      item.id
                    }" aria-label="Giảm số lượng">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display" data-id="${item.id}">${
          item.quantity
        }</span>
                    <button class="quantity-btn" data-action="increase" data-id="${
                      item.id
                    }" aria-label="Tăng số lượng">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total" data-id="${item.id}">
                    ${this.formatCurrency(item.price * item.quantity)}
                </div>
                <div class="cart-item-actions">
                    <button class="btn-remove" data-action="remove" data-id="${
                      item.id
                    }" title="Xóa sản phẩm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
      })
      .join("");
  }

  setupCartEvents() {
    const container = document.getElementById("cart-items");
    if (!container) return;

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".quantity-btn, .btn-remove");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (!action || !id) return;

      if (action === "increase") {
        this.changeQuantity(id, 1);
      } else if (action === "decrease") {
        this.changeQuantity(id, -1);
      } else if (action === "remove") {
        this.removeItem(id);
      }
    });
  }

  changeQuantity(productId, change) {
    const item = this.cart.find((item) => item.id === productId);
    if (!item) return;

    item.quantity = (item.quantity || 1) + change;

    if (item.quantity <= 0) {
      if (
        confirm(
          "Số lượng xuống 0 — bạn có muốn xóa sản phẩm này khỏi giỏ hàng?"
        )
      ) {
        this.cart = this.cart.filter((it) => it.id !== productId);
      } else {
        item.quantity = 1;
      }
    }

    this.saveCart();
    this.loadCartItems();
    this.updateCartCount();
  }

  removeItem(productId) {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) return;
    this.cart = this.cart.filter((item) => item.id !== productId);
    this.saveCart();
    this.loadCartItems();
    this.updateCartCount();
    this.showNotification(" Đã xóa sản phẩm khỏi giỏ hàng", "info");
  }

  updateCartSummary() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + item.price * (item.quantity || 0),
      0
    );
    const discount = this.calculateDiscount(subtotal);
    const total = subtotal - discount;

    const elSubtotal = document.getElementById("cart-subtotal");
    const elDiscount = document.getElementById("cart-discount");
    const elTotal = document.getElementById("cart-total");

    if (elSubtotal) elSubtotal.textContent = this.formatCurrency(subtotal);
    if (elDiscount)
      elDiscount.textContent = `-${this.formatCurrency(discount)}`;
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
    const checkoutBtn = document.querySelector(".checkout-btn");
    const promoForm = document.querySelector(".promo-code");

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.handleCheckout());
    }

    if (promoForm) {
      promoForm.addEventListener("submit", (e) => this.applyPromoCode(e));
    }
  }

  handleCheckout() {
    if (!this.cart || this.cart.length === 0) {
      this.showNotification("🛒 Giỏ hàng của bạn đang trống!", "error");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      this.showLoginModal();
      return;
    }

    this.showCheckoutModal();
  }

  showLoginModal() {
    const modal = document.createElement("div");
    modal.className = "checkout-modal";
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

    modal.innerHTML = `
            <div style="background: linear-gradient(135deg, var(--white), var(--light-color)); padding: 40px 30px; border-radius: 20px; max-width: 450px; width: 90%; text-align: center; box-shadow: var(--shadow-lg); border: 1px solid var(--muted-border);">
                <div style="font-size: 4rem; color: var(--primary-color); margin-bottom: 20px;">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 style="margin-bottom: 15px; color: var(--dark-color); font-size: 1.5rem;">Đăng nhập để thanh toán</h3>
                <p style="color: var(--text-color); margin-bottom: 30px; line-height: 1.6; font-size: 1rem;">
                    Vui lòng đăng nhập để hoàn tất thanh toán và theo dõi đơn hàng của bạn.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="this.closest('.checkout-modal').remove()" class="btn" style="background: var(--text-muted); color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer;">
                        <i class="fas fa-times"></i> Hủy bỏ
                    </button>
                    <button onclick="window.location.href='login.html?redirect=cart'" class="btn" style="background: var(--primary-color); color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-sign-in-alt"></i> Đăng nhập ngay
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    const closeOnEscape = (e) => {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", closeOnEscape);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
  }

  showCheckoutModal() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const total = this.calculateTotal();

    const modal = document.createElement("div");
    modal.className = "checkout-modal";
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

    modal.innerHTML = `
            <div style="background: linear-gradient(135deg, var(--white), var(--light-color)); padding: 30px; border-radius: 20px; max-width: 500px; width: 90%; box-shadow: var(--shadow-lg); border: 1px solid var(--muted-border);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                    <div style="font-size: 2rem; color: var(--primary-color);">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <h3 style="margin: 0; color: var(--dark-color);">Xác nhận thanh toán</h3>
                </div>
                
                <div style="background: var(--light-color); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-color);">Khách hàng:</span>
                        <strong style="color: var(--dark-color);">${this.escapeHtml(
                          currentUser.name
                        )}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-color);">Email:</span>
                        <span style="color: var(--text-color);">${this.escapeHtml(
                          currentUser.email
                        )}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold;">
                        <span style="color: var(--dark-color);">Tổng tiền:</span>
                        <span style="color: var(--primary-color);">${this.formatCurrency(
                          total
                        )}</span>
                    </div>
                </div>

                <div style="background: var(--light-color); padding: 15px; border-radius: 10px; margin-bottom: 25px;">
                    <h4 style="margin: 0 0 10px 0; color: var(--dark-color);">Sản phẩm trong giỏ:</h4>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${this.cart
                          .map(
                            (item) => `
                            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--muted-border);">
                                <span style="color: var(--text-color);">${this.escapeHtml(
                                  item.name
                                )} x${item.quantity}</span>
                                <span style="color: var(--text-color);">${this.formatCurrency(
                                  item.price * item.quantity
                                )}</span>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="this.closest('.checkout-modal').remove()" class="btn" style="background: var(--text-muted); color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer;">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                    <button onclick="cartSystem.processPayment()" class="btn" style="background: var(--primary-color); color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-check"></i> Xác nhận thanh toán
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  processPayment() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      this.showNotification("❌ Vui lòng đăng nhập để thanh toán!", "error");
      return;
    }

    const order = {
      id: "ORD_" + Date.now(),
      items: [...this.cart],
      total: this.calculateTotal(),
      user: {
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
      },
      status: "completed",
      paymentMethod: "credit_card",
      createdAt: new Date().toISOString(),
      orderNumber: Math.floor(100000 + Math.random() * 900000),
    };

    this.saveOrder(order);

    this.showNotification(
      " Thanh toán thành công! Cảm ơn bạn đã mua hàng.",
      "success"
    );

    this.cart = [];
    this.saveCart();
    this.updateCartCount();
    this.loadCartItems();

    document.querySelector(".checkout-modal")?.remove();

    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);
  }

  saveOrder(order) {
    try {
      let orders = JSON.parse(localStorage.getItem("userOrders")) || [];
      orders.unshift(order);
      localStorage.setItem("userOrders", JSON.stringify(orders));
    } catch (e) {
      console.error("Lưu đơn hàng thất bại:", e);
    }
  }

  calculateTotal() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + item.price * (item.quantity || 0),
      0
    );
    const discount = this.calculateDiscount(subtotal);
    return subtotal - discount;
  }

  applyPromoCode(e) {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const code = input ? input.value.trim().toUpperCase() : "";

    if (!code) {
      this.showNotification(" Vui lòng nhập mã giảm giá", "error");
      return;
    }

    const promoCodes = {
      HUONGQUE10: 0.1,
      HUONGQUE50K: 50000,
      WELCOME15: 0.15,
      FIRSTORDER: 0.2,
    };

    if (promoCodes[code]) {
      this.showNotification(" Áp dụng mã giảm giá thành công!", "success");
    } else {
      this.showNotification("❌ Mã giảm giá không hợp lệ!", "error");
    }

    if (input) input.value = "";
  }

  saveCart() {
    try {
      localStorage.setItem("cart", JSON.stringify(this.cart));
    } catch (e) {
      console.error("Lưu giỏ hàng thất bại:", e);
    }
  }

  updateCartCount() {
    const totalItems = this.cart.reduce(
      (total, item) => total + (item.quantity || 0),
      0
    );
    document.querySelectorAll(".cart-count").forEach((element) => {
      element.textContent = totalItems;
      element.style.display = totalItems > 0 ? "flex" : "none";
    });
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  showNotification(message, type = "success") {
    document
      .querySelectorAll(".notification")
      .forEach((notif) => notif.remove());

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    const icon =
      type === "success"
        ? "check-circle"
        : type === "error"
        ? "exclamation-circle"
        : "info-circle";

    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

    document.body.appendChild(notification);

    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      notification.remove();
    });

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  showAddToCartAnimation(button) {
    const cartIcon = document.querySelector(".cart-icon");
    if (!cartIcon || !button) return;

    const rect = button.getBoundingClientRect();
    const animation = document.createElement("div");
    animation.className = "add-to-cart-animation";
    animation.innerHTML = "🛒";
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
      animation.style.opacity = "0";
      animation.style.transform = "scale(0.5)";
    });

    setTimeout(() => {
      animation.remove();
    }, 800);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    window.cartSystem = new CartSystem();
  } catch (err) {
    console.error("CartSystem initialization error:", err);
  }
});

function saveOrderToHistory(cartItems, totalAmount, note = "") {
  const orders = JSON.parse(localStorage.getItem("orderHistory")) || [];

  const newOrder = {
    id: "ORD" + Date.now(),
    date: new Date().toLocaleDateString("vi-VN"),
    time: new Date().toLocaleTimeString("vi-VN"),
    status: "Đang xử lý",
    total: totalAmount,
    note: note,
    items: cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  orders.push(newOrder);
  localStorage.setItem("orderHistory", JSON.stringify(orders));

  return newOrder;
}
