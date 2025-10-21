class AppState {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("cart")) || [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateCartCount();
    this.checkAuthStatus();
    this.setupScrollEffects();
  }

  setupEventListeners() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (menuToggle) {
      menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        navMenu.classList.toggle("active");
        menuToggle.classList.toggle("active");
      });

      document.addEventListener("click", (e) => {
        if (
          !e.target.closest(".nav-menu") &&
          !e.target.closest(".menu-toggle")
        ) {
          navMenu.classList.remove("active");
          menuToggle.classList.remove("active");
        }
      });
      navMenu.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    window.addEventListener("scroll", this.throttle(this.handleScroll, 100));
  }

  handleScroll = () => {
    const header = document.querySelector("header");
    if (window.scrollY > 100) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  updateCartCount() {
    try {
      const totalItems = this.cart.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );
      document.querySelectorAll(".cart-count").forEach((element) => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? "flex" : "none";
      });
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }

  checkAuthStatus() {
    const loginButton = document.querySelector(".btn-login");
    if (!loginButton) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (currentUser) {
      const firstName = currentUser.name.split(" ")[0];
      const avatarLetter = firstName.charAt(0).toUpperCase();

      const userMenuHTML = `
                <li class="user-menu">
                    <button class="user-icon">
                        <div class="user-avatar">${avatarLetter}</div>
                        <span class="user-name">${firstName}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown">
                        <div class="user-info">
                            <strong>${currentUser.name}</strong>
                            <span>${currentUser.email}</span>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="profile.html" class="dropdown-item">
                            <i class="fas fa-user"></i>
                            Tài khoản
                        </a>
                        <a href="booking-history.html" class="dropdown-item">
                            <i class="fas fa-calendar"></i>
                            Lịch sử đặt bàn
                        </a>
                        <a href="order-history.html" class="dropdown-item">
                            <i class="fas fa-receipt"></i>
                            Đơn hàng
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            Đăng xuất
                        </a>
                    </div>
                </li>
            `;

      const loginLi = loginButton.closest("li");
      if (loginLi) {
        loginLi.outerHTML = userMenuHTML;

        this.setupUserMenu();
      }
    }
  }

  setupUserMenu() {
    const userIcon = document.querySelector(".user-icon");
    const dropdown = document.querySelector(".user-dropdown");
    const logoutBtn = document.querySelector(".logout-btn");

    if (userIcon && dropdown) {
      userIcon.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle("show");
      });

      document.addEventListener("click", (e) => {
        if (!e.target.closest(".user-menu")) {
          dropdown.classList.remove("show");
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          dropdown.classList.remove("show");
        }
      });
    }

    const dropdownItems = document.querySelectorAll(".dropdown-item");
    dropdownItems.forEach((item) => {
      if (item.classList.contains("logout-btn")) return;

      item.addEventListener("click", (e) => {
        const href = item.getAttribute("href");

        if (href === "profile.html" || href === "booking-history.html") {
          e.preventDefault();
          dropdown.classList.remove("show");
          this.showNotification("Tính năng đang được phát triển!", "info");
        }
      });
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  logout() {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("currentUser");
      this.showNotification("Đã đăng xuất thành công!", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
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

  setupScrollEffects() {
    document.addEventListener("DOMContentLoaded", () => {
      if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);

        gsap.utils.toArray(".region-card").forEach((el, i) => {
          gsap.to(el, {
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });

        document.querySelectorAll(".region-card").forEach((card) => {
          const reveal = card.querySelector(".region-reveal");
          const bg = card.dataset.bg;
          card.addEventListener("mouseenter", () => {
            reveal.style.backgroundImage = `url('${bg}')`;
          });
        });
      }
    });
  }
}

const utils = {
  formatCurrency: (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  },

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

const appState = new AppState();
