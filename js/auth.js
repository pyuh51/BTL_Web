// Enhanced Authentication System
class AuthSystem {
    constructor() {
        this.currentTab = 'login';
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupFormHandlers();
        this.setupSocialLogin();
    }

    setupTabSwitching() {
        const authTabs = document.querySelectorAll('.auth-tab');
        authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;
    }

    setupFormHandlers() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            
            // Real-time validation
            this.setupRealTimeValidation(registerForm);
        }
    }

    setupRealTimeValidation(form) {
        const fields = form.querySelectorAll('input[required]');
        fields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch(field.type) {
            case 'email':
                isValid = this.isValidEmail(value);
                message = 'Email không hợp lệ';
                break;
            case 'tel':
                isValid = this.isValidPhone(value);
                message = 'Số điện thoại không hợp lệ';
                break;
            case 'password':
                isValid = value.length >= 6;
                message = 'Mật khẩu phải có ít nhất 6 ký tự';
                break;
            default:
                isValid = value.length > 0;
                message = 'Trường này là bắt buộc';
        }

        if (!isValid && value.length > 0) {
            this.showFieldError(field, message);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = formData.get('remember-me');

        // Validation
        if (!this.isValidEmail(email)) {
            utils.showNotification('Email không hợp lệ', 'error');
            return;
        }

        if (password.length < 6) {
            utils.showNotification('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (this.loginUser(email, password)) {
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
                
                utils.showNotification('Đăng nhập thành công!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                utils.showNotification('Email hoặc mật khẩu không đúng!', 'error');
            }
        } catch (error) {
            utils.showNotification('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirm-password')
        };

        // Validation
        if (!this.validateRegisterData(userData)) {
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';
        submitBtn.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (this.registerUser(userData)) {
                utils.showNotification('Đăng ký thành công! Vui lòng đăng nhập.');
                setTimeout(() => {
                    this.switchTab('login');
                    e.target.reset();
                }, 1500);
            } else {
                utils.showNotification('Email đã được sử dụng!', 'error');
            }
        } catch (error) {
            utils.showNotification('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateRegisterData(data) {
        if (!data.name.trim()) {
            utils.showNotification('Vui lòng nhập họ tên', 'error');
            return false;
        }

        if (!this.isValidEmail(data.email)) {
            utils.showNotification('Email không hợp lệ', 'error');
            return false;
        }

        if (!this.isValidPhone(data.phone)) {
            utils.showNotification('Số điện thoại không hợp lệ', 'error');
            return false;
        }

        if (data.password.length < 6) {
            utils.showNotification('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return false;
        }

        if (data.password !== data.confirmPassword) {
            utils.showNotification('Mật khẩu xác nhận không khớp', 'error');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        return phoneRegex.test(phone);
    }

    registerUser(userData) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.find(user => user.email === userData.email)) {
            return false;
        }
        
        users.push({
            id: Date.now().toString(),
            ...userData,
            createdAt: new Date().toISOString(),
            role: 'customer'
        });
        
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }

    loginUser(email, password) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(user => user.email === email && user.password === password);
        
        if (user) {
            localStorage.setItem('user', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }));
            return true;
        }
        
        return false;
    }

    setupSocialLogin() {
        // Google Login
        const googleBtn = document.querySelector('.btn-google');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                utils.showNotification('Tính năng đăng nhập Google đang được phát triển', 'info');
            });
        }

        // Facebook Login
        const facebookBtn = document.querySelector('.btn-facebook');
        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => {
                utils.showNotification('Tính năng đăng nhập Facebook đang được phát triển', 'info');
            });
        }
    }
}

// Khởi tạo hệ thống auth
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});