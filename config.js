/**
 * config.js
 * Configuration file for LIFF Time Tracking App
 * 
 * ใช้สำหรับกำหนดค่าต่างๆ ของแอป เพื่อให้ง่ายต่อการจัดการ
 */

// Main Configuration
const CONFIG = {
  // LIFF Configuration
  LIFF_ID: '***********', // แทนที่ด้วย LIFF ID ของคุณ 
  
  // Backend Configuration
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwP1unVjCIrmb8UfMfjgHmGVVJ6k00ZS01pmpZVtG1k4EEPtCYMn-Mc0BakROSvToYR/exec',
  API_SECRET_KEY: 'MySecretKey123!@#', // เพิ่ม API Key ถ้าใช้ใน Backend
  
  // App Settings
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  
  // UI Settings
  LOADING_TIMEOUT: 30000, // 30 seconds
  AUTO_CLOSE_DELAY: 5000, // 5 seconds
  
  // Validation Rules
  VALIDATION: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    PHONE_PATTERN: /^[0-9]{9,10}$/,
    PLATE_MIN_LENGTH: 2,
    PLATE_MAX_LENGTH: 10,
    MILEAGE_MIN: 0,
    MILEAGE_MAX: 999999,
    TRIPS_MIN: 0,
    TRIPS_MAX: 50,
    DELIVERIES_MIN: 0,
    DELIVERIES_MAX: 999
  }
};

/**
 * Enhanced API caller with retry logic and proper error handling
 */
class ApiClient {
  static async serverCall(action, args = [], options = {}) {
    const { 
      timeout = CONFIG.LOADING_TIMEOUT,
      retries = CONFIG.MAX_RETRY_ATTEMPTS,
      showLoading = true 
    } = options;
    
    let attempt = 0;
    
    while (attempt < retries) {
      try {
        attempt++;
        
        if (showLoading) {
          LoadingManager.show(`กำลังประมวลผล... (${attempt}/${retries})`);
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add API Key if configured
        if (CONFIG.API_SECRET_KEY) {
          headers['X-API-Key'] = CONFIG.API_SECRET_KEY;
        }
        
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
          method: 'POST',
          headers: headers,
          mode: 'cors',
          body: JSON.stringify({ action, args }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'error') {
          throw new Error(result.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
        }
        
        if (showLoading) {
          LoadingManager.hide();
        }
        
        return result.response;
        
      } catch (error) {
        console.error(`API call attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          if (showLoading) {
            LoadingManager.hide();
          }
          
          // Check error type and provide appropriate message
          if (error.name === 'AbortError') {
            throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่');
          } else if (error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
          } else {
            throw error;
          }
        }
        
        // Wait before retry
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
        }
      }
    }
  }
}

/**
 * Enhanced Loading Manager
 */
class LoadingManager {
  static overlay = null;
  
  static show(message = 'กำลังโหลด...') {
    this.hide(); // Remove existing overlay
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'loading-overlay';
    this.overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    
    // Add CSS if not already added
    if (!document.getElementById('loading-styles')) {
      const style = document.createElement('style');
      style.id = 'loading-styles';
      style.textContent = `
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: Kanit, sans-serif;
        }
        .loading-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #06C755;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }
        .loading-text {
          color: #333;
          font-weight: 500;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  static hide() {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
  }
  
  static updateMessage(message) {
    if (this.overlay) {
      const textElement = this.overlay.querySelector('.loading-text');
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }
}

/**
 * Enhanced Input Validator
 */
class InputValidator {
  static validateName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('กรุณากรอกชื่อ-นามสกุล');
    }
    
    const trimmed = name.trim();
    if (trimmed.length < CONFIG.VALIDATION.NAME_MIN_LENGTH) {
      throw new Error(`ชื่อ-นามสกุลต้องมีอย่างน้อย ${CONFIG.VALIDATION.NAME_MIN_LENGTH} ตัวอักษร`);
    }
    
    if (trimmed.length > CONFIG.VALIDATION.NAME_MAX_LENGTH) {
      throw new Error(`ชื่อ-นามสกุลต้องไม่เกิน ${CONFIG.VALIDATION.NAME_MAX_LENGTH} ตัวอักษร`);
    }
    
    return trimmed;
  }
  
  static validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      throw new Error('กรุณากรอกเบอร์ติดต่อ');
    }
    
    const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
    if (!CONFIG.VALIDATION.PHONE_PATTERN.test(cleaned)) {
      throw new Error('กรุณากรอกเบอร์ติดต่อให้ถูกต้อง (9-10 หลัก)');
    }
    
    return cleaned;
  }
  
  static validatePlate(plate) {
    if (!plate || typeof plate !== 'string') {
      throw new Error('กรุณากรอกทะเบียนรถ');
    }
    
    const trimmed = plate.trim();
    if (trimmed.length < CONFIG.VALIDATION.PLATE_MIN_LENGTH) {
      throw new Error(`ทะเบียนรถต้องมีอย่างน้อย ${CONFIG.VALIDATION.PLATE_MIN_LENGTH} ตัวอักษร`);
    }
    
    if (trimmed.length > CONFIG.VALIDATION.PLATE_MAX_LENGTH) {
      throw new Error(`ทะเบียนรถต้องไม่เกิน ${CONFIG.VALIDATION.PLATE_MAX_LENGTH} ตัวอักษร`);
    }
    
    return trimmed.toUpperCase();
  }
  
  static validateBranch(branch) {
    if (!branch || typeof branch !== 'string') {
      throw new Error('กรุณาเลือกสาขา');
    }
    
    const trimmed = branch.trim();
    if (trimmed.length < 1) {
      throw new Error('กรุณาเลือกสาขา');
    }
    
    return trimmed;
  }
  
  static validateTime(time) {
    if (!time) {
      throw new Error('กรุณาเลือกเวลา');
    }
    
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(time)) {
      throw new Error('รูปแบบเวลาไม่ถูกต้อง');
    }
    
    return time;
  }
  
  static validateMileage(mileage) {
    const num = Number(mileage);
    if (isNaN(num) || num < CONFIG.VALIDATION.MILEAGE_MIN || num > CONFIG.VALIDATION.MILEAGE_MAX) {
      throw new Error(`เลขไมล์ต้องเป็นตัวเลขระหว่าง ${CONFIG.VALIDATION.MILEAGE_MIN}-${CONFIG.VALIDATION.MILEAGE_MAX}`);
    }
    
    return num;
  }
  
  static validateTrips(trips) {
    const num = Number(trips);
    if (isNaN(num) || num < CONFIG.VALIDATION.TRIPS_MIN || num > CONFIG.VALIDATION.TRIPS_MAX) {
      throw new Error(`จำนวนรอบต้องเป็นตัวเลขระหว่าง ${CONFIG.VALIDATION.TRIPS_MIN}-${CONFIG.VALIDATION.TRIPS_MAX}`);
    }
    
    return num;
  }
  
  static validateDeliveries(deliveries) {
    const num = Number(deliveries);
    if (isNaN(num) || num < CONFIG.VALIDATION.DELIVERIES_MIN || num > CONFIG.VALIDATION.DELIVERIES_MAX) {
      throw new Error(`จำนวนจุดส่งต้องเป็นตัวเลขระหว่าง ${CONFIG.VALIDATION.DELIVERIES_MIN}-${CONFIG.VALIDATION.DELIVERIES_MAX}`);
    }
    
    return num;
  }
  
  static validateImage(file) {
    if (!file) {
      throw new Error('กรุณาเลือกรูปภาพ');
    }
    
    if (!CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF)');
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      const maxSizeMB = CONFIG.MAX_FILE_SIZE / (1024 * 1024);
      throw new Error(`ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB}MB`);
    }
    
    return true;
  }
}

/**
 * File handling utilities
 */
class FileHandler {
  static async readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        InputValidator.validateImage(file);
      } catch (error) {
        reject(error);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  }
  
  static setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) {
      console.warn(`Elements ${inputId} or ${previewId} not found`);
      return;
    }
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) {
        preview.style.display = 'none';
        return;
      }
      
      try {
        const base64 = await this.readFileAsBase64(file);
        preview.src = base64;
        preview.style.display = 'block';
      } catch (error) {
        alert('Error: ' + error.message);
        input.value = ''; // Clear invalid file
        preview.style.display = 'none';
      }
    });
  }
}

/**
 * Enhanced LIFF utilities
 */
class LIFFUtils {
  static async initializeAndGetProfile() {
    try {
      LoadingManager.show('กำลังเชื่อมต่อกับ LINE...');
      
      await liff.init({ liffId: CONFIG.LIFF_ID });
      
      if (!liff.isLoggedIn()) {
        LoadingManager.hide();
        liff.login();
        return null;
      }
      
      const profile = await liff.getProfile();
      LoadingManager.hide();
      
      return profile;
      
    } catch (error) {
      LoadingManager.hide();
      console.error('LIFF initialization error:', error);
      throw new Error('ไม่สามารถเชื่อมต่อกับ LINE ได้: ' + error.message);
    }
  }
  
  static closeWindow() {
    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      // For external browser, show message
      alert('คุณสามารถปิดหน้าต่างนี้ได้แล้ว');
    }
  }
}

/**
 * Enhanced UI utilities
 */
class UIUtils {
  static showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `message message-${type}`;
    }
  }
  
  static formatDateTime(dateTime) {
    if (!dateTime) return '-';
    
    try {
      const date = new Date(dateTime);
      return date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return String(dateTime);
    }
  }
  
  static setupFormValidation(formId, validationRules) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      try {
        // Validate all fields
        for (const [fieldId, validator] of Object.entries(validationRules)) {
          const field = document.getElementById(fieldId);
          if (field) {
            validator(field.value);
          }
        }
        
        // If validation passes, trigger custom submit event
        form.dispatchEvent(new CustomEvent('validatedSubmit'));
        
      } catch (error) {
        alert('ข้อผิดพลาด: ' + error.message);
      }
    });
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, ApiClient, LoadingManager, InputValidator, FileHandler, LIFFUtils, UIUtils };
}
