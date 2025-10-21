class AuthSystem {
  constructor() {
    this.currentTab = "login";
    this.init();
  }

  init() {
    this.setupTabSwitching();
    this.setupFormHandlers();
    this.setupSocialLogin();
    this.setupPasswordVisibility();

    this.switchTab(this.currentTab);
  }

  setupTabSwitching() {
    const authTabs = document.querySelectorAll(".auth-tab");
    authTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  switchTab(tabName) {
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.toggle("active", form.id === `${tabName}-tab`);
    });

    this.currentTab = tabName;
  }

  setupFormHandlers() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
      this.setupRealTimeValidation(loginForm);
    }

    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e));
      this.setupRealTimeValidation(registerForm);
    }
  }

  setupRealTimeValidation(form) {
    const fields = form.querySelectorAll("input[required]");
    fields.forEach((field) => {
      field.addEventListener("blur", () => this.validateField(field));
      field.addEventListener("input", () => this.clearFieldError(field));
    });
  }

  setupPasswordVisibility() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach((input) => this.addPasswordToggle(input));
  }

  addPasswordToggle(passwordField) {
    if (!passwordField) return;

    const formGroup =
      passwordField.closest(".form-group") || passwordField.parentNode;
    if (!formGroup) return;

    if (formGroup.querySelector(".password-toggle")) return;

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "password-toggle";
    toggleBtn.setAttribute("aria-label", "Toggle password visibility");
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';

    formGroup.appendChild(toggleBtn);

    toggleBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const type =
        passwordField.getAttribute("type") === "password" ? "text" : "password";
      passwordField.setAttribute("type", type);
      toggleBtn.innerHTML =
        type === "password"
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    });
  }

  validateField(field) {
    const value = (field.value || "").trim();
    let isValid = true;
    let message = "";

    switch (field.type) {
      case "email":
        isValid = this.isValidEmail(value);
        message = "Email không hợp lệ";
        break;
      case "tel":
        isValid = this.isValidPhone(value);
        message = "Số điện thoại không hợp lệ";
        break;
      case "password":
        isValid = value.length >= 6;
        message = "Mật khẩu phải có ít nhất 6 ký tự";
        break;
      default:
        isValid = value.length > 0;
        message = "Trường này là bắt buộc";
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
    field.classList.add("error");

    const errorElement = document.createElement("div");
    errorElement.className = "field-error";
    errorElement.textContent = message;

    if (field.nextSibling) {
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    } else {
      field.parentNode.appendChild(errorElement);
    }
  }

  clearFieldError(field) {
    field.classList.remove("error");
    const existingError = field.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = (formData.get("email") || "").trim();
    const password = formData.get("password") || "";
    const rememberMe = formData.get("remember");

    // Validation
    if (!this.isValidEmail(email)) {
      this.showNotification("Email không hợp lệ", "error");
      return;
    }

    if (password.length < 6) {
      this.showNotification("Mật khẩu phải có ít nhất 6 ký tự", "error");
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';
      submitBtn.disabled = true;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const loginResult = this.loginUser(email, password);

      if (loginResult.success) {
        this.handleLoginSuccess(loginResult.user);
      } else {
        this.showNotification("Email hoặc mật khẩu không đúng!", "error");
      }
    } catch (error) {
      this.showNotification("Có lỗi xảy ra, vui lòng thử lại!", "error");
      console.error(error);
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  async handleRegister(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = {
      name: (formData.get("name") || "").trim(),
      email: (formData.get("email") || "").trim(),
      phone: (formData.get("phone") || "").trim(),
      password: formData.get("password") || "",
      confirmPassword: formData.get("confirm-password") || "",
    };

    if (!this.validateRegisterData(userData)) {
      return;
    }

    const { confirmPassword, ...userToSave } = userData;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';
      submitBtn.disabled = true;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const registerResult = this.registerUser(userToSave);

      if (registerResult.success) {
        this.handleRegisterSuccess(userToSave);
      } else {
        this.showNotification(
          registerResult.message || "Email đã được sử dụng!",
          "error"
        );
      }
    } catch (error) {
      this.showNotification("Có lỗi xảy ra, vui lòng thử lại!", "error");
      console.error(error);
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  validateRegisterData(data) {
    if (!data.name || !data.name.trim()) {
      this.showNotification("Vui lòng nhập họ tên", "error");
      return false;
    }

    if (!this.isValidEmail(data.email)) {
      this.showNotification("Email không hợp lệ", "error");
      return false;
    }

    if (!this.isValidPhone(data.phone)) {
      this.showNotification("Số điện thoại không hợp lệ", "error");
      return false;
    }

    if (data.password.length < 6) {
      this.showNotification("Mật khẩu phải có ít nhất 6 ký tự", "error");
      return false;
    }

    return true;
  }

  isValidEmail(email) {
    if (!email) return false;
    const value = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  isValidPhone(phone) {
    if (!phone) return false;
    const value = phone.trim();
    const phoneRegex = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/;
    return phoneRegex.test(value);
  }

  registerUser(userData) {
    let users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.find((user) => user.email === userData.email)) {
      return { success: false, message: "Email đã được sử dụng" };
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
      role: "customer",
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    return { success: true, user: newUser };
  }

  loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(
      (user) => user.email === email && user.password === password
    );

    if (user) {
      const userInfo = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem("currentUser", JSON.stringify(userInfo));
      return { success: true, user: userInfo };
    }

    return { success: false, message: "Email hoặc mật khẩu không đúng" };
  }

  handleLoginSuccess(userData) {
    this.showNotification(
      "Đăng nhập thành công! Chào mừng bạn trở lại.",
      "success"
    );

    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");

    setTimeout(() => {
      if (redirect === "booking") {
        window.location.href = "booking.html";
      } else {
        window.location.href = "index.html";
      }
    }, 1200);
  }

  handleRegisterSuccess(userData) {
    const loginResult = this.loginUser(userData.email, userData.password);
    if (loginResult.success) {
      this.showNotification(
        "Đăng ký thành công! Tự động đăng nhập...",
        "success"
      );

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);
    }
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    const icon =
      type === "success"
        ? "check"
        : type === "info"
        ? "info-circle"
        : "exclamation-circle";

    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;

    document.body.appendChild(notification);

    const removeFn = () => {
      if (notification.parentElement) {
        notification.remove();
      }
    };
    const timeoutId = setTimeout(removeFn, 5000);

    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      clearTimeout(timeoutId);
      removeFn();
    });
  }

  setupSocialLogin() {
    const googleBtn = document.querySelector(".btn-google");
    if (googleBtn) {
      googleBtn.addEventListener("click", () => {
        this.showNotification(
          "Tính năng đăng nhập Google đang được phát triển",
          "info"
        );
      });
    }

    const facebookBtn = document.querySelector(".btn-facebook");
    if (facebookBtn) {
      facebookBtn.addEventListener("click", () => {
        this.showNotification(
          "Tính năng đăng nhập Facebook đang được phát triển",
          "info"
        );
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AuthSystem();
});
document.addEventListener("DOMContentLoaded", function () {
  const passwordToggles = document.querySelectorAll(".password-toggle");

  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const passwordInput = document.getElementById(targetId);
      const icon = this.querySelector("i");

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        passwordInput.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });
});
