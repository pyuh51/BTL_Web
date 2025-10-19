// Enhanced Booking System với Real-time Validation
class BookingSystem {
    constructor() {
        this.availableTimes = [
            '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
        ];
        this.init();
    }

    init() {
        this.setupBookingForm();
        this.setupDateValidation();
        this.setupTimeSlots();
    }

    setupBookingForm() {
        const form = document.getElementById('booking-form');
        if (!form) return;

        this.setDefaultDateTime();
        
        form.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        
        // Real-time validation
        this.setupRealTimeValidation(form);
    }

    setDefaultDateTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateInput = document.getElementById('date');
        const timeInput = document.getElementById('time');
        
        if (dateInput) {
            dateInput.min = new Date().toISOString().split('T')[0];
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }
        
        if (timeInput) {
            timeInput.value = '18:00';
        }
    }

    setupDateValidation() {
        const dateInput = document.getElementById('date');
        if (!dateInput) return;

        dateInput.addEventListener('change', () => {
            const selectedDate = new Date(dateInput.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                utils.showNotification('Không thể đặt bàn trong quá khứ!', 'error');
                dateInput.value = today.toISOString().split('T')[0];
            }

            this.updateTimeSlots(selectedDate);
        });
    }

    setupTimeSlots() {
        const timeInput = document.getElementById('time');
        if (!timeInput) return;

        // Tạo dropdown cho time slots
        timeInput.innerHTML = this.availableTimes.map(time => 
            `<option value="${time}">${time}</option>`
        ).join('');
    }

    updateTimeSlots(selectedDate) {
        // Có thể implement logic để ẩn các khung giờ đã kín
        const today = new Date();
        if (selectedDate.toDateString() === today.toDateString()) {
            // Ẩn các khung giờ đã qua trong ngày hôm nay
            const currentHour = today.getHours();
            const currentMinute = today.getMinutes();
            
            const timeInput = document.getElementById('time');
            timeInput.innerHTML = this.availableTimes
                .filter(time => {
                    const [hours, minutes] = time.split(':').map(Number);
                    return hours > currentHour || (hours === currentHour && minutes > currentMinute);
                })
                .map(time => `<option value="${time}">${time}</option>`)
                .join('');
        }
    }

    setupRealTimeValidation(form) {
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');
        const guestsInput = document.getElementById('guests');

        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }

        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                if (emailInput.value && !this.isValidEmail(emailInput.value)) {
                    this.showFieldError(emailInput, 'Email không hợp lệ');
                } else {
                    this.clearFieldError(emailInput);
                }
            });
        }

        if (guestsInput) {
            guestsInput.addEventListener('change', () => {
                const guests = parseInt(guestsInput.value);
                if (guests > 20) {
                    utils.showNotification('Số lượng khách tối đa là 20 người', 'info');
                    guestsInput.value = '20';
                }
            });
        }
    }

    async handleBookingSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const bookingData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            date: formData.get('date'),
            time: formData.get('time'),
            guests: formData.get('guests'),
            message: formData.get('message')
        };

        if (!this.validateBookingData(bookingData)) {
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const booking = this.saveBooking(bookingData);
            this.showBookingConfirmation(booking);
            ultis.showNotification('Đặt bàn thành công!', 'success');
            e.target.reset();
            this.setDefaultDateTime();
            
        } catch (error) {
            utils.showNotification('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateBookingData(data) {
        if (!data.name?.trim()) {
            utils.showNotification('Vui lòng nhập họ tên', 'error');
            return false;
        }

        if (!data.phone?.trim()) {
            utils.showNotification('Vui lòng nhập số điện thoại', 'error');
            return false;
        }

        if (!this.isValidPhone(data.phone)) {
            utils.showNotification('Số điện thoại không hợp lệ', 'error');
            return false;
        }

        if (data.email && !this.isValidEmail(data.email)) {
            utils.showNotification('Email không hợp lệ', 'error');
            return false;
        }

        if (!data.date || !data.time) {
            utils.showNotification('Vui lòng chọn ngày và giờ', 'error');
            return false;
        }

        if (!data.guests || parseInt(data.guests) < 1) {
            utils.showNotification('Vui lòng chọn số lượng khách', 'error');
            return false;
        }

        // Check if booking is in the past
        const bookingDateTime = new Date(`${data.date}T${data.time}`);
        if (bookingDateTime < new Date()) {
            utils.showNotification('Không thể đặt bàn trong quá khứ!', 'error');
            return false;
        }
        return true;
    }

    saveBooking(bookingData) {
        const booking = {
            ...bookingData,
            id: 'BK' + Date.now(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            bookingCode: this.generateBookingCode()
        };

        let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));

        return booking;
    }

    generateBookingCode() {
        return 'HQB' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    showBookingConfirmation(booking) {
        const modal = document.createElement('div');
        modal.className = 'booking-confirmation-modal';
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
                    <p><strong>Ngày:</strong> ${this.formatDate(booking.date)}</p>
                    <p><strong>Giờ:</strong> ${booking.time}</p>
                    <p><strong>Số khách:</strong> ${booking.guests} người</p>
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
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
}

// Khởi tạo booking system
document.addEventListener('DOMContentLoaded', () => {
    new BookingSystem();
});