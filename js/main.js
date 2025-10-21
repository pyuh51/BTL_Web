// Enhanced Main JavaScript với Error Handling và Performance Optimization
class AppState {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
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
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav-menu') && !e.target.closest('.menu-toggle')) {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
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
            const totalItems = this.cart.reduce((total, item) => total + (item.quantity || 0), 0);
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

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (currentUser) {
            // Tạo avatar từ chữ cái đầu
            const firstName = currentUser.name.split(' ')[0];
            const avatarLetter = firstName.charAt(0).toUpperCase();
            
            // Thay thế nút đăng nhập bằng user menu
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
            
            // Thay thế nút login bằng user menu
            const loginLi = loginButton.closest('li');
            if (loginLi) {
                loginLi.outerHTML = userMenuHTML;
                
                // Thêm event listener cho dropdown và logout
                this.setupUserMenu();
            }
        }
    }

    setupUserMenu() {
    const userIcon = document.querySelector('.user-icon');
    const dropdown = document.querySelector('.user-dropdown');
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (userIcon && dropdown) {
        userIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                dropdown.classList.remove('show');
            }
        });

        // Đóng dropdown khi press Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.remove('show');
            }
        });
    }
    
    // Xử lý các mục trong dropdown
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        // Bỏ qua nút logout (xử lý riêng)
        if (item.classList.contains('logout-btn')) return;
        
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            
            // Kiểm tra nếu là profile hoặc booking-history thì hiển thị thông báo
            if (href === 'profile.html' || href === 'booking-history.html') {
                e.preventDefault();
                dropdown.classList.remove('show');
                this.showNotification('Tính năng đang được phát triển!', 'info');
            }
            // order-history.html sẽ được chuyển hướng bình thường
            // Các trang khác cũng sẽ hoạt động bình thường
        });
    });
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }
}

    logout() {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            localStorage.removeItem('currentUser');
            this.showNotification('Đã đăng xuất thành công!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    'info-circle';

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

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    setupScrollEffects() {
        // GSAP animations nếu có
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
    }
}

// Utility functions
const utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
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
    }
};

// Khởi tạo app
const appState = new AppState();