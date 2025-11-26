const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const changeImageBtn = document.getElementById('changeImageBtn');
const predictBtn = document.getElementById('predictBtn');
const resultSection = document.getElementById('resultSection');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

let selectedFile = null;

// Click to upload
uploadBox.addEventListener('click', () => {
    fileInput.click();
});

// File selection
fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

// Drag and drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('drag-over');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('drag-over');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
    handleFileSelect(e.dataTransfer.files[0]);
});

// Handle file selection
function handleFileSelect(file) {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
        showError('Invalid file type. Please upload PNG, JPG, JPEG, or BMP images.');
        return;
    }
    
    // Validate file size (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showError('File size exceeds 16MB. Please upload a smaller image.');
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        uploadBox.style.display = 'none';
        previewSection.style.display = 'block';
        resultSection.style.display = 'none';
        hideError();
    };
    reader.readAsDataURL(file);
}

// Change image button
changeImageBtn.addEventListener('click', () => {
    previewSection.style.display = 'none';
    uploadBox.style.display = 'block';
    resultSection.style.display = 'none';
    selectedFile = null;
    fileInput.value = '';
});

// Predict button
predictBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showError('Please select an image first.');
        return;
    }
    
    // Show loading
    loading.style.display = 'block';
    resultSection.style.display = 'none';
    hideError();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        // Send prediction request
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        loading.style.display = 'none';
        
        if (data.success) {
            displayResults(data);
        } else {
            showError(data.error || 'Prediction failed. Please try again.');
        }
    } catch (error) {
        loading.style.display = 'none';
        showError('Network error. Please check your connection and try again.');
        console.error('Error:', error);
    }
});

// Display results
function displayResults(data) {
    const bloodGroupBadge = document.getElementById('bloodGroupBadge');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceText = document.getElementById('confidenceText');
    const allPredictions = document.getElementById('allPredictions');
    
    // Blood group
    bloodGroupBadge.textContent = data.blood_group;
    
    // Confidence
    confidenceFill.style.width = `${data.confidence}%`;
    confidenceText.textContent = `${data.confidence}% Confidence`;
    
    // All predictions
    allPredictions.innerHTML = '<h4>Detailed Predictions:</h4>';
    const sorted = Object.entries(data.all_predictions).sort((a, b) => b[1] - a[1]);
    
    sorted.forEach(([label, prob]) => {
        const item = document.createElement('div');
        item.className = 'prediction-item';
        item.innerHTML = `
            <span class="prediction-label">${label}</span>
            <span class="prediction-value">${prob.toFixed(2)}%</span>
        `;
        allPredictions.appendChild(item);
    });
    
    resultSection.style.display = 'block';
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide error
function hideError() {
    errorMessage.style.display = 'none';
}
```

---

## 📁 Complete Project Structure
```
blood_group_detection/
│
├── app.py                                ← Main Flask app (provided)
├── requirements.txt                      ← Dependencies (above)
│
├── blood_group_model_savedmodel/         ← Model folder from Colab
│   ├── saved_model.pb
│   ├── keras_metadata.pb
│   ├── variables/
│   │   ├── variables.data-00000-of-00001
│   │   └── variables.index
│   └── assets/
│
├── static/
│   ├── css/
│   │   └── style.css                     ← Styling (above)
│   ├── js/
│   │   └── script.js                     ← Frontend logic (above)
│   └── uploads/                          ← Auto-created, leave empty
│
└── templates/
    └── index.html                        ← Main page (above)