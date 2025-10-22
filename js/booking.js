class BookingSystem {
  constructor() {
    this.availableTimes = [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
      "21:30",
      "22:00",
    ];
    this.init();
  }

  init() {
    if (!this.checkAuth()) {
      return;
    }

    this.setupBookingForm();
    this.setupDateValidation();
    this.setupTimeSlots();
    this.prefillUserInfo();
  }

  checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      this.showAuthRequiredNotification();
      return false;
    }
    return true;
  }

  showAuthRequiredNotification() {
    const notification = document.createElement("div");
    notification.className = "notification warning";
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Vui lòng đăng nhập để đặt bàn</span>
            </div>
            <div class="notification-actions">
                <a href="login.html?redirect=booking" class="btn btn-sm">Đăng nhập ngay</a>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      window.location.href = "login.html?redirect=booking";
    }, 3000);

    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      notification.remove();
      window.location.href = "login.html?redirect=booking";
    });
  }

  prefillUserInfo() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      const nameField = document.getElementById("name");
      const phoneField = document.getElementById("phone");
      const emailField = document.getElementById("email");

      if (nameField) nameField.value = currentUser.name || "";
      if (phoneField) phoneField.value = currentUser.phone || "";
      if (emailField) emailField.value = currentUser.email || "";
    }
  }

  setupBookingForm() {
    const form = document.getElementById("booking-form");
    if (!form) return;

    this.setDefaultDateTime();

    form.addEventListener("submit", (e) => this.handleBookingSubmit(e));

    this.setupRealTimeValidation(form);
  }

  setDefaultDateTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");

    if (dateInput) {
      dateInput.min = new Date().toISOString().split("T")[0];
      dateInput.value = tomorrow.toISOString().split("T")[0];
    }

    if (timeInput) {
      timeInput.value = "18:00";
    }
  }

  setupDateValidation() {
    const dateInput = document.getElementById("date");
    if (!dateInput) return;

    dateInput.addEventListener("change", () => {
      const selectedDate = new Date(dateInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        this.showNotification("Không thể đặt bàn trong quá khứ!", "error");
        dateInput.value = today.toISOString().split("T")[0];
      }

      this.updateTimeSlots(selectedDate);
    });
  }

  setupTimeSlots() {
    const timeInput = document.getElementById("time");
    if (!timeInput) return;

    timeInput.innerHTML = this.availableTimes
      .map((time) => `<option value="${time}">${time}</option>`)
      .join("");
  }

  updateTimeSlots(selectedDate) {
    const today = new Date();
    if (selectedDate.toDateString() === today.toDateString()) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();

      const timeInput = document.getElementById("time");
      timeInput.innerHTML = this.availableTimes
        .filter((time) => {
          const [hours, minutes] = time.split(":").map(Number);
          return (
            hours > currentHour ||
            (hours === currentHour && minutes > currentMinute)
          );
        })
        .map((time) => `<option value="${time}">${time}</option>`)
        .join("");
    }
  }

  setupRealTimeValidation(form) {
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const guestsInput = document.getElementById("guests");

    if (phoneInput) {
      phoneInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
      });
    }

    if (emailInput) {
      emailInput.addEventListener("blur", () => {
        if (emailInput.value && !this.isValidEmail(emailInput.value)) {
          this.showFieldError(emailInput, "Email không hợp lệ");
        } else {
          this.clearFieldError(emailInput);
        }
      });
    }

    if (guestsInput) {
      guestsInput.addEventListener("change", () => {
        const guests = parseInt(guestsInput.value);
        if (guests > 20) {
          this.showNotification("Số lượng khách tối đa là 20 người", "info");
          guestsInput.value = "20";
        }
      });
    }
  }

  async handleBookingSubmit(e) {
    e.preventDefault();

    if (!this.checkAuth()) {
      return;
    }

    const formData = new FormData(e.target);
    const bookingData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      branch: formData.get("branch"),
      date: formData.get("date"),
      time: formData.get("time"),
      guests: formData.get("guests"),
      message: formData.get("message"),
      userId: JSON.parse(localStorage.getItem("currentUser")).id,
    };

    if (!this.validateBookingData(bookingData)) {
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    submitBtn.disabled = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const booking = this.saveBooking(bookingData);
      this.showBookingConfirmation(booking);
      this.showNotification("Đặt bàn thành công!", "success");
      e.target.reset();
      this.setDefaultDateTime();
    } catch (error) {
      this.showNotification("Có lỗi xảy ra, vui lòng thử lại!", "error");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  validateBookingData(data) {
    if (!data.name?.trim()) {
      this.showNotification("Vui lòng nhập họ tên", "error");
      return false;
    }

    if (!data.phone?.trim()) {
      this.showNotification("Vui lòng nhập số điện thoại", "error");
      return false;
    }

    if (!this.isValidPhone(data.phone)) {
      this.showNotification("Số điện thoại không hợp lệ", "error");
      return false;
    }

    if (data.email && !this.isValidEmail(data.email)) {
      this.showNotification("Email không hợp lệ", "error");
      return false;
    }

    if (!data.date || !data.time) {
      this.showNotification("Vui lòng chọn ngày và giờ", "error");
      return false;
    }

    if (!data.guests || parseInt(data.guests) < 1) {
      this.showNotification("Vui lòng chọn số lượng khách", "error");
      return false;
    }

    const bookingDateTime = new Date(`${data.date}T${data.time}`);
    if (bookingDateTime < new Date()) {
      this.showNotification("Không thể đặt bàn trong quá khứ!", "error");
      return false;
    }
    return true;
  }

  saveBooking(bookingData) {
    const booking = {
      ...bookingData,
      id: "BK" + Date.now(),
      status: "pending",
      createdAt: new Date().toISOString(),
      bookingCode: this.generateBookingCode(),
    };

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    bookings.push(booking);
    localStorage.setItem("bookings", JSON.stringify(bookings));

    return booking;
  }

  generateBookingCode() {
    return "HQB" + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  showBookingConfirmation(booking) {
    const modal = document.createElement("div");
    modal.className = "booking-confirmation-modal";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Đặt bàn thành công!</h3>
                <div class="booking-details">
                    <p><strong>Mã đặt bàn:</strong> ${booking.bookingCode}</p>
                    <p><strong>Họ tên:</strong> ${booking.name}</p>
                    <p><strong>Số điện thoại:</strong> ${booking.phone}</p>
                    <p><strong>Ngày:</strong> ${this.formatDate(
                      booking.date
                    )}</p>
                    <p><strong>Giờ:</strong> ${booking.time}</p>
                    <p><strong>Số khách:</strong> ${booking.guests} người</p>
                    ${
                      booking.branch
                        ? `<p><strong>Chi nhánh:</strong> ${this.getBranchName(
                            booking.branch
                          )}</p>`
                        : ""
                    }
                </div>
                <div class="booking-note">
                    <p><i class="fas fa-info-circle"></i> Chúng tôi sẽ liên hệ với bạn để xác nhận đặt bàn.</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="this.closest('.booking-confirmation-modal').remove()">
                        Đóng
                    </button>
                    <button class="btn btn-outline" onclick="window.print()">
                        <i class="fas fa-print"></i> In xác nhận
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
  }

  getBranchName(branchCode) {
    const branches = {
      hanoi_1: "Hà Nội - Ba Đình",
      hanoi_2: "Hà Nội - Cầu Giấy",
      hanoi_3: "Hà Nội - Tây Hồ",
      haiphong: "Hải Phòng",
      quangninh: "Quảng Ninh",
      hue: "Huế",
      danang_1: "Đà Nẵng - Sơn Trà",
      danang_2: "Đà Nẵng - Hải Châu",
      nhatrang: "Nha Trang",
      hcm_1: "TP.HCM - Quận 1",
      hcm_2: "TP.HCM - Phú Nhuận",
      hcm_3: "TP.HCM - Thủ Đức",
      hcm_4: "TP.HCM - Bình Thạnh",
      cantho: "Cần Thơ",
      vungtau: "Vũng Tàu",
    };
    return branches[branchCode] || branchCode;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phone);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  showFieldError(field, message) {
    this.clearFieldError(field);
    field.classList.add("error");

    const errorElement = document.createElement("div");
    errorElement.className = "field-error";
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
  }

  clearFieldError(field) {
    field.classList.remove("error");
    const existingError = field.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
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
}

document.addEventListener("DOMContentLoaded", () => {
  new BookingSystem();
});
