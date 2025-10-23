/**
 * config-v3.js
 * CORS-Free Configuration using text/plain trick - Version 3
 * 
 * ✨ The Magic Formula to avoid CORS:
 * headers: { 'Content-Type': 'text/plain;charset=utf-8' }
 */

// Main Configuration
const CONFIG = {
  // LIFF Configuration
  LIFF_ID: '2008315151-QEwrGORr', // แทนที่ด้วย LIFF ID ของคุณ
  
  // Backend Configuration  
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzPFolmPFiGqFH8g2E3VhyKbPuZ8H0VQrzTc9xjSZHnu9E3rUyb1v9nD8kdNrtSIzkH/exec',
  
  // App Settings
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  
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
 * 🎯 THE MAGIC FUNCTION - ฟังก์ชันพระเอกที่หลีกเลี่ยง CORS 
 * 
 * เคล็ดลับสำคัญ:
 * - ใช้ Content-Type: text/plain เพื่อทำให้เบราว์เซอร์คิดว่าเป็น "Simple Request"
 * - เบราว์เซอร์จะไม่ส่ง Preflight (OPTIONS) Request
 * - ข้อมูล JSON ยังส่งได้ปกติผ่าน body
 * - Backend สามารถ parse JSON ได้เหมือนเดิม
 */
function serverCall(action, ...args) {
    const url = CONFIG.GAS_WEB_APP_URL; 
    const payload = { action: action, args: args };

    return fetch(url, { 
        method: 'POST', 
        body: JSON.stringify(payload), 
        // ★★★★★★★  บรรทัดนี้คือหัวใจสำคัญ ★★★★★★★
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => { 
        if(data.status === 'error') { 
            throw new Error(data.message); 
        } 
        return data.response; 
    });
}

/**
 * Enhanced Input Validator
 */
class InputValidator {
  static validateName(name) {
    if (!name || name.trim().length < CONFIG.VALIDATION.NAME_MIN_LENGTH) {
      return 'กรุณาใส่ชื่อให้ถูกต้อง (อย่างน้อย 2 ตัวอักษร)';
    }
    if (name.trim().length > CONFIG.VALIDATION.NAME_MAX_LENGTH) {
      return 'ชื่อยาวเกินไป (ไม่เกิน 50 ตัวอักษร)';
    }
    return null;
  }
  
  static validatePhone(phone) {
    if (!phone || !CONFIG.VALIDATION.PHONE_PATTERN.test(phone.trim())) {
      return 'กรุณาใส่เบอร์โทรให้ถูกต้อง (9-10 หลัก)';
    }
    return null;
  }
  
  static validatePlate(plate) {
    if (!plate || plate.trim().length < CONFIG.VALIDATION.PLATE_MIN_LENGTH) {
      return 'กรุณาใส่ทะเบียนรถให้ถูกต้อง';
    }
    if (plate.trim().length > CONFIG.VALIDATION.PLATE_MAX_LENGTH) {
      return 'ทะเบียนรถยาวเกินไป';
    }
    return null;
  }
  
  static validateMileage(mileage) {
    const num = Number(mileage);
    if (isNaN(num) || num < CONFIG.VALIDATION.MILEAGE_MIN || num > CONFIG.VALIDATION.MILEAGE_MAX) {
      return 'กรุณาใส่เลขไมล์ให้ถูกต้อง (0-999999)';
    }
    return null;
  }
  
  static validateTrips(trips) {
    const num = Number(trips);
    if (isNaN(num) || num < CONFIG.VALIDATION.TRIPS_MIN || num > CONFIG.VALIDATION.TRIPS_MAX) {
      return 'กรุณาใส่จำนวนเที่ยวให้ถูกต้อง (0-50)';
    }
    return null;
  }
  
  static validateDeliveries(deliveries) {
    const num = Number(deliveries);
    if (isNaN(num) || num < CONFIG.VALIDATION.DELIVERIES_MIN || num > CONFIG.VALIDATION.DELIVERIES_MAX) {
      return 'กรุณาใส่จำนวนการส่งให้ถูกต้อง (0-999)';
    }
    return null;
  }
  
  static validateIncome(income) {
    const num = Number(income);
    if (isNaN(num) || num < 0) {
      return 'กรุณาใส่รายได้ให้ถูกต้อง';
    }
    return null;
  }
}

/**
 * Simple Loading Manager
 */
function showLoading(message = 'กำลังโหลด...') {
  // Remove any existing loading
  const existingLoading = document.querySelector('.loading-overlay');
  if (existingLoading) {
    existingLoading.remove();
  }
  
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-overlay';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    color: white;
    font-family: 'Kanit', sans-serif;
    font-size: 16px;
  `;
  
  loadingDiv.innerHTML = `
    <div style="text-align: center;">
      <div style="width: 40px; height: 40px; border: 4px solid #ffffff30; border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
      <div>${message}</div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  document.body.appendChild(loadingDiv);
}

function hideLoading() {
  const loadingDiv = document.querySelector('.loading-overlay');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

/**
 * Simple Image Utilities
 */
class ImageUtils {
  static async resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  static validateImageFile(file) {
    if (!file) {
      return 'กรุณาเลือกไฟล์รูปภาพ';
    }
    
    if (!CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return 'รองรับเฉพาะไฟล์ JPG, PNG, GIF เท่านั้น';
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return 'ไฟล์รูปภาพใหญ่เกินไป (ไม่เกิน 5MB)';
    }
    
    return null;
  }
}
