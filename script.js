// ============================================
// DermaAI - Main JavaScript
// ============================================

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const previewImg = document.getElementById('previewImg');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = document.getElementById('btnText');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const detectedClass = document.getElementById('detectedClass');
const confidenceEl = document.getElementById('confidence');
const geminiResponse = document.getElementById('geminiResponse');

let selectedFile = null;

// ============================================
// Toast Notification System
// ============================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('remove');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// File Upload Handlers
// ============================================

// Click to upload
uploadArea.addEventListener('click', () => {
  imageInput.click();
});

// Drag & drop handlers
['dragover', 'dragenter'].forEach(evt => {
  uploadArea.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drop-zone-active');
  });
});

['dragleave', 'dragend', 'drop'].forEach(evt => {
  uploadArea.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drop-zone-active');
  });
});

// Handle dropped files
uploadArea.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  if (files.length) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      imageInput.files = files;
      handleImage(file);
      showToast('✅ Image loaded successfully!', 'success');
    } else {
      showToast('❌ Please upload an image file', 'error');
    }
  }
});

// Handle file input change
imageInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    const file = e.target.files[0];
    if (file.type.startsWith('image/')) {
      handleImage(file);
      showToast('✅ Image loaded successfully!', 'success');
    } else {
      showToast('❌ Please upload an image file', 'error');
      imageInput.value = '';
    }
  }
});

// ============================================
// Image Handler
// ============================================

function handleImage(file) {
  selectedFile = file;
  
  // Create object URL for preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    preview.classList.remove('hidden');
    analyzeBtn.classList.remove('opacity-0', 'pointer-events-none');
    result.classList.add('hidden');
    uploadArea.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// ============================================
// Image Analysis
// ============================================

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) {
    showToast('❌ Please upload an image first', 'error');
    return;
  }

  // Show loading state
  btnText.classList.add('hidden');
  loading.classList.remove('hidden');
  analyzeBtn.disabled = true;

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('image', selectedFile);

    // Send to server
    const res = await fetch('/analyze', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    // Handle "no detection" case
    if (data.disease === "no-detection") {
      displayHealthyResult();
      showToast('✅ Analysis complete: No issues detected', 'success');
    } else {
      displayDiseaseResult(data);
      showToast('✅ Analysis complete!', 'success');
    }

    // Scroll to results
    setTimeout(() => {
      result.classList.remove('hidden');
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);

  } catch (err) {
    console.error('Analysis Error:', err);
    showToast('❌ ' + err.message, 'error');
    alert("Error analyzing image:\n" + err.message + "\n\nCheck if your Gemini API key is correct!");
  } finally {
    // Hide loading state
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
});

// ============================================
// Result Display Functions
// ============================================

function displayHealthyResult() {
  detectedClass.innerHTML = '✅ No Skin Condition Detected';
  detectedClass.className = 'disease-badge';
  confidenceEl.innerHTML = '<span class="text-green-600 font-bold">Healthy skin detected</span>';
  geminiResponse.innerHTML = '<p class="text-green-700">✓ No significant skin disease was detected. Keep maintaining good skincare habits!</p>';
}

function displayDiseaseResult(data) {
  const confidence = (data.confidence * 100).toFixed(1);
  
  // Format disease name
  const diseaseName = data.disease
    .replace(/-/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Update disease badge
  detectedClass.innerHTML = diseaseName;
  detectedClass.className = 'disease-badge';

  // Update confidence display with bar
  confidenceEl.innerHTML = `
    <div class="mt-3">
      <span class="text-blue-600 font-bold">Confidence: ${confidence}%</span>
      <div class="confidence-bar mt-2">
        <div class="confidence-bar-fill" style="--confidence: ${confidence}%"></div>
      </div>
    </div>
  `;

  // Update explanation
  geminiResponse.innerHTML = data.explanation.replace(/\n/g, '<br>');
}

// ============================================
// Keyboard Shortcuts
// ============================================

document.addEventListener('keydown', (e) => {
  // Enter key to analyze
  if (e.key === 'Enter' && 
      !analyzeBtn.disabled && 
      !analyzeBtn.classList.contains('opacity-0')) {
    analyzeBtn.click();
  }

  // Escape key to clear
  if (e.key === 'Escape' && selectedFile) {
    clearAnalysis();
  }
});

// ============================================
// Clear/Reset Functionality
// ============================================

function clearAnalysis() {
  selectedFile = null;
  imageInput.value = '';
  preview.classList.add('hidden');
  result.classList.add('hidden');
  uploadArea.classList.remove('hidden');
  analyzeBtn.classList.add('opacity-0', 'pointer-events-none');
  previewImg.src = '';
}

// Add clear button functionality if needed
document.addEventListener('DOMContentLoaded', () => {
  // Welcome message
  showToast('👋 Welcome to DermaAI! Upload a skin image to analyze.', 'info');
});

// ============================================
// Performance Optimizations
// ============================================

// Debounce function for resize events
function debounce(func, wait) {
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

// Handle window resize for responsive design
window.addEventListener('resize', debounce(() => {
  // Add any resize-related updates here
}, 250));

// ============================================
// Error Handling
// ============================================

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// ============================================
// Export for use in other modules (if needed)
// ============================================

const DermaAI = {
  showToast,
  clearAnalysis,
  displayHealthyResult,
  displayDiseaseResult
};
