// Enhanced Main JavaScript với Error Handling và Performance Optimization
class AppState {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.user = JSON.parse(localStorage.getItem('user')) || null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartCount();
        this.checkAuthStatus();
        this.setupScrollEffects();
    }

    setupEventListeners() {
        // Mobile menu với better touch handling
        const menuToggle = document.querySelector('.menu-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });

            // Close menu khi click outside
            document.addEventListener("DOMContentLoaded", () => {
            if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
                 gsap.registerPlugin(ScrollTrigger);

    // hiệu ứng hiện dần khi cuộn
         gsap.utils.toArray(".region-card").forEach((el, i) => {
              gsap.to(el, {
              y: 0,
            duration: 0.8,
           ease: "power3.out",
          scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      });
    });

    // lazy load background
    document.querySelectorAll(".region-card").forEach(card => {
      const reveal = card.querySelector(".region-reveal");
      const bg = card.dataset.bg;
      card.addEventListener("mouseenter", () => {
        reveal.style.backgroundImage = `url('${bg}')`;
      });
    });
  }
});


            // Prevent menu close khi click inside menu
            navMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Header scroll effect
        window.addEventListener('scroll', this.throttle(this.handleScroll, 100));
    }

    handleScroll = () => {
        const header = document.querySelector('header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    updateCartCount() {
        try {
            const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
            document.querySelectorAll('.cart-count').forEach(element => {
                element.textContent = totalItems;
                element.style.display = totalItems > 0 ? 'flex' : 'none';
            });
        } catch (error) {
            console.error('Error updating cart count:', error);
        }
    }

    checkAuthStatus() {
        const loginButton = document.querySelector('.btn-login');
        if (!loginButton) return;

        if (this.user) {
            loginButton.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Xin chào, ${this.user.name}</span>
                <i class="fas fa-chevron-down"></i>
            `;
            
            // Thêm dropdown menu
            this.createUserDropdown(loginButton);
        }
    }

    createUserDropdown(button) {
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <a href="profile.html" class="dropdown-item">
                <i class="fas fa-user-circle"></i>
                Thông tin tài khoản
            </a>
            <a href="booking-history.html" class="dropdown-item">
                <i class="fas fa-history"></i>
                Lịch sử đặt bàn
            </a>
            <a href="order-history.html" class="dropdown-item">
                <i class="fas fa-receipt"></i>
                Lịch sử đơn hàng
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item logout" onclick="appState.logout()">
                <i class="fas fa-sign-out-alt"></i>
                Đăng xuất
            </a>
        `;

        button.style.position = 'relative';
        button.appendChild(dropdown);

        // Toggle dropdown
        button.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('show');
        });

        // Close dropdown khi click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-login')) {
                dropdown.classList.remove('show');
            }
        });
    }

    logout() {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            localStorage.removeItem('user');
            localStorage.removeItem('cart');
            window.location.href = 'index.html';
        }
    }
}

// Khởi tạo app
const appState = new AppState();

// Utility functions
const utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
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
    }
};