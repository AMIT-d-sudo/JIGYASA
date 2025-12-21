// ===== CONFIGURATION =====
const CONFIG = {
    STORAGE_KEY: 'secure_file_sharing_system',
    PASSWORD_KEY: 'file_system_password',
    VISITORS_KEY: 'file_system_visitors',
    MAX_STORAGE: 10 * 1024 * 1024 * 1024, // 10GB in bytes
    MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB per file
    MAX_VIDEO_DURATION: 5 * 60, // 5 minutes in seconds
    ITEMS_PER_PAGE: 12,
    SUPPORTED_TYPES: {
        'pdf': ['pdf'],
        'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
        'document': ['doc', 'docx', 'rtf', 'odt'],
        'spreadsheet': ['xls', 'xlsx', 'csv'],
        'presentation': ['ppt', 'pptx', 'key'],
        'text': ['txt', 'md', 'json', 'xml', 'html', 'css', 'js'],
        'video': ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'],
        'audio': ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
        'archive': ['zip', 'rar', '7z', 'tar', 'gz']
    },
    DEFAULT_PASSWORD: 'admin123'
};

// ===== STATE =====
let state = {
    isLoggedIn: false,
    files: [],
    selectedFiles: [],
    currentPage: 1,
    searchQuery: '',
    sortBy: 'newest',
    stats: {
        totalFiles: 0,
        totalSize: 0,
        totalViews: 0,
        totalDownloads: 0,
        visitors: 0
    },
    currentPreviewFile: null,
    sessionStart: null
};

// ===== DOM ELEMENTS =====
const elements = {
    // Password Modal
    passwordModal: document.getElementById('passwordModal'),
    passwordInput: document.getElementById('passwordInput'),
    loginBtn: document.getElementById('loginBtn'),
    togglePassword: document.getElementById('togglePassword'),
    changePasswordBtn: document.getElementById('changePasswordBtn'),
    changePasswordForm: document.getElementById('changePasswordForm'),
    oldPassword: document.getElementById('oldPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    savePasswordBtn: document.getElementById('savePasswordBtn'),
    cancelChangeBtn: document.getElementById('cancelChangeBtn'),
    passwordError: document.getElementById('passwordError'),
    
    // Loading
    loadingScreen: document.getElementById('loadingScreen'),
    
    // Storage
    usedStorage: document.getElementById('usedStorage'),
    totalStorage: document.getElementById('totalStorage'),
    freeStorage: document.getElementById('freeStorage'),
    usedPercent: document.getElementById('usedPercent'),
    storageMeter: document.getElementById('storageMeter'),
    
    // Stats
    totalFiles: document.getElementById('totalFiles'),
    totalViews: document.getElementById('totalViews'),
    totalDownloads: document.getElementById('totalDownloads'),
    visitorsCount: document.getElementById('visitorsCount'),
    
    // Upload
    fileInput: document.getElementById('fileInput'),
    browseBtn: document.getElementById('browseBtn'),
    uploadArea: document.getElementById('uploadArea'),
    dropArea: document.getElementById('dropArea'),
    selectedFiles: document.getElementById('selectedFiles'),
    selectedCount: document.getElementById('selectedCount'),
    filesListPreview: document.getElementById('filesListPreview'),
    uploadProgress: document.getElementById('uploadProgress'),
    progressFill: document.getElementById('progressFill'),
    progressPercent: document.getElementById('progressPercent'),
    currentFile: document.getElementById('currentFile'),
    uploadSpeed: document.getElementById('uploadSpeed'),
    uploadBtn: document.getElementById('uploadBtn'),
    
    // Files
    filesGrid: document.getElementById('filesGrid'),
    emptyState: document.getElementById('emptyState'),
    searchBox: document.getElementById('searchBox'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    sortSelect: document.getElementById('sortSelect'),
    
    // Pagination
    pagination: document.getElementById('pagination'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    pageNumbers: document.getElementById('pageNumbers'),
    
    // Modals
    previewModal: document.getElementById('previewModal'),
    closePreviewBtn: document.getElementById('closePreviewBtn'),
    previewBody: document.getElementById('previewBody'),
    previewFileName: document.getElementById('previewFileName'),
    previewFileSize: document.getElementById('previewFileSize'),
    previewFileDate: document.getElementById('previewFileDate'),
    previewFileViews: document.getElementById('previewFileViews'),
    downloadPreviewBtn: document.getElementById('downloadPreviewBtn'),
    sharePreviewBtn: document.getElementById('sharePreviewBtn'),
    deletePreviewBtn: document.getElementById('deletePreviewBtn'),
    
    // Other
    clearAllBtn: document.getElementById('clearAllBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    helpModal: document.getElementById('helpModal'),
    closeHelpBtn: document.getElementById('closeHelpBtn'),
    footerVisitors: document.getElementById('footerVisitors')
};

// ===== UTILITY FUNCTIONS =====
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    for (const [type, extensions] of Object.entries(CONFIG.SUPPORTED_TYPES)) {
        if (extensions.includes(ext)) return type;
    }
    return 'other';
}

function getFileIcon(type) {
    const icons = {
        'pdf': 'fa-file-pdf',
        'image': 'fa-file-image',
        'document': 'fa-file-word',
        'spreadsheet': 'fa-file-excel',
        'presentation': 'fa-file-powerpoint',
        'text': 'fa-file-alt',
        'video': 'fa-file-video',
        'audio': 'fa-file-audio',
        'archive': 'fa-file-archive',
        'other': 'fa-file'
    };
    return icons[type] || 'fa-file';
}

function getFileColor(type) {
    const colors = {
        'pdf': '#ff6b6b',
        'image': '#4cc9f0',
        'document': '#2a8fff',
        'spreadsheet': '#21bf73',
        'presentation': '#f9c74f',
        'text': '#adb5bd',
        'video': '#ff6b6b',
        'audio': '#4cc9f0',
        'archive': '#f8961e',
        'other': '#757575'
    };
    return colors[type] || '#757575';
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('hi-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} दिन पहले`;
    if (hours > 0) return `${hours} घंटे पहले`;
    if (minutes > 0) return `${minutes} मिनट पहले`;
    return 'अभी';
}

// ===== PASSWORD MANAGEMENT =====
function initPasswordSystem() {
    // Set default password if not exists
    if (!localStorage.getItem(CONFIG.PASSWORD_KEY)) {
        localStorage.setItem(CONFIG.PASSWORD_KEY, CONFIG.DEFAULT_PASSWORD);
    }
    
    // Initialize visitors count
    if (!localStorage.getItem(CONFIG.VISITORS_KEY)) {
        localStorage.setItem(CONFIG.VISITORS_KEY, '1');
        state.stats.visitors = 1;
    } else {
        state.stats.visitors = parseInt(localStorage.getItem(CONFIG.VISITORS_KEY)) + 1;
        localStorage.setItem(CONFIG.VISITORS_KEY, state.stats.visitors.toString());
    }
    
    updateVisitorsDisplay();
    
    // Check if already logged in
    const session = localStorage.getItem('file_session');
    if (session) {
        const sessionData = JSON.parse(session);
        const now = new Date();
        const sessionTime = new Date(sessionData.timestamp);
        
        // Check if session is valid (24 hours)
        if (now - sessionTime < 24 * 60 * 60 * 1000) {
            state.isLoggedIn = true;
            state.sessionStart = new Date();
            elements.passwordModal.style.display = 'none';
            initApp();
            return;
        }
    }
    
    // Show password modal
    elements.passwordModal.style.display = 'flex';
    
    // Login button
    elements.loginBtn.addEventListener('click', handleLogin);
    
    // Enter key on password input
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Toggle password visibility
    elements.togglePassword.addEventListener('click', () => {
        const type = elements.passwordInput.getAttribute('type');
        elements.passwordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
        elements.togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
    
    // Change password button
    elements.changePasswordBtn.addEventListener('click', () => {
        elements.changePasswordForm.style.display = 'block';
    });
    
    // Save new password
    elements.savePasswordBtn.addEventListener('click', handleChangePassword);
    
    // Cancel change
    elements.cancelChangeBtn.addEventListener('click', () => {
        elements.changePasswordForm.style.display = 'none';
        clearPasswordForm();
    });
    
    // Logout button
    elements.logoutBtn.addEventListener('click', handleLogout);
}

function handleLogin() {
    const password = elements.passwordInput.value;
    const savedPassword = localStorage.getItem(CONFIG.PASSWORD_KEY);
    
    if (password === savedPassword) {
        state.isLoggedIn = true;
        state.sessionStart = new Date();
        
        // Save session
        localStorage.setItem('file_session', JSON.stringify({
            timestamp: new Date().toISOString()
        }));
        
        elements.passwordModal.style.display = 'none';
        showNotification('लॉगिन सफल!', 'success');
        initApp();
    } else {
        elements.passwordError.textContent = 'गलत पासवर्ड!';
        elements.passwordInput.value = '';
        elements.passwordInput.focus();
    }
}

function handleChangePassword() {
    const oldPass = elements.oldPassword.value;
    const newPass = elements.newPassword.value;
    const confirmPass = elements.confirmPassword.value;
    const savedPassword = localStorage.getItem(CONFIG.PASSWORD_KEY);
    
    if (oldPass !== savedPassword) {
        showNotification('पुराना पासवर्ड गलत है', 'error');
        return;
    }
    
    if (newPass.length < 4) {
        showNotification('नया पासवर्ड कम से कम 4 अक्षर का होना चाहिए', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        showNotification('पासवर्ड मेल नहीं खा रहे', 'error');
        return;
    }
    
    localStorage.setItem(CONFIG.PASSWORD_KEY, newPass);
    elements.changePasswordForm.style.display = 'none';
    clearPasswordForm();
    showNotification('पासवर्ड बदल गया!', 'success');
}

function clearPasswordForm() {
    elements.oldPassword.value = '';
    elements.newPassword.value = '';
    elements.confirmPassword.value = '';
    elements.passwordError.textContent = '';
}

function handleLogout() {
    if (confirm('क्या आप लॉगआउट करना चाहते हैं?')) {
        localStorage.removeItem('file_session');
        state.isLoggedIn = false;
        location.reload();
    }
}

function updateVisitorsDisplay() {
    elements.visitorsCount.textContent = state.stats.visitors;
    elements.footerVisitors.textContent = state.stats.visitors;
}

// ===== STORAGE MANAGEMENT =====
function saveToStorage() {
    try {
        const data = {
            files: state.files,
            stats: state.stats,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        updateStorageDisplay();
        return true;
    } catch (error) {
        console.error('Storage error:', error);
        showNotification('स्टोरेज में सेव करने में त्रुटि', 'error');
        return false;
    }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            state.files = data.files || [];
            state.stats = data.stats || {
                totalFiles: 0,
                totalSize: 0,
                totalViews: 0,
                totalDownloads: 0,
                visitors: state.stats.visitors
            };
            
            // Update stats
            updateStats();
            updateStorageDisplay();
            return true;
        }
    } catch (error) {
        console.error('Load error:', error);
    }
    return false;
}

function updateStorageDisplay() {
    const used = state.stats.totalSize;
    const free = CONFIG.MAX_STORAGE - used;
    const percent = (used / CONFIG.MAX_STORAGE) * 100;
    
    elements.usedStorage.textContent = formatFileSize(used);
    elements.totalStorage.textContent = '10 GB';
    elements.freeStorage.textContent = formatFileSize(free);
    elements.usedPercent.textContent = percent.toFixed(1) + '%';
    elements.storageMeter.style.width = Math.min(percent, 100) + '%';
    
    // Update meter color based on usage
    if (percent > 90) {
        elements.storageMeter.style.background = 'linear-gradient(90deg, #f72585, #ff6b6b)';
    } else if (percent > 75) {
        elements.storageMeter.style.background = 'linear-gradient(90deg, #f8961e, #f9c74f)';
    } else {
        elements.storageMeter.style.background = 'linear-gradient(90deg, #4cc9f0, #4361ee)';
    }
}

function updateStats() {
    // Update from files array
    state.stats.totalFiles = state.files.length;
    state.stats.totalSize = state.files.reduce((sum, file) => sum + file.size, 0);
    state.stats.totalViews = state.files.reduce((sum, file) => sum + file.views, 0);
    state.stats.totalDownloads = state.files.reduce((sum, file) => sum + file.downloads, 0);
    
    // Update DOM
    elements.totalFiles.textContent = state.stats.totalFiles;
    elements.totalViews.textContent = state.stats.totalViews;
    elements.totalDownloads.textContent = state.stats.totalDownloads;
}

// ===== FILE UPLOAD =====
function initUpload() {
    // Browse button
    elements.browseBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    // File input change
    elements.fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Drag and drop
    elements.dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropArea.classList.add('dragover');
    });
    
    elements.dropArea.addEventListener('dragleave', () => {
        elements.dropArea.classList.remove('dragover');
    });
    
    elements.dropArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        elements.dropArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            await handleFiles(e.dataTransfer.files);
        }
    });
    
    // Upload button
    elements.uploadBtn.addEventListener('click', startUpload);
}

async function handleFiles(fileList) {
    const files = Array.from(fileList);
    let validFiles = 0;
    
    for (const file of files) {
        // Check file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            showNotification(`${file.name} - 500MB से बड़ी फाइल नहीं अपलोड कर सकते`, 'error');
            continue;
        }
        
        // Check total storage
        const newTotalSize = state.stats.totalSize + file.size;
        if (newTotalSize > CONFIG.MAX_STORAGE) {
            showNotification('10GB स्टोरेज पूरी हो गई! कुछ फाइलें डिलीट करें', 'error');
            continue;
        }
        
        // Check file type
        const type = getFileType(file.name);
        if (type === 'other') {
            showNotification(`${file.name} - यह फाइल टाइप सपोर्टेड नहीं है`, 'error');
            continue;
        }
        
        // Check video duration for video files
        if (type === 'video') {
            try {
                const duration = await getVideoDuration(file);
                if (duration > CONFIG.MAX_VIDEO_DURATION) {
                    showNotification(`${file.name} - 5 मिनट से लंबा वीडियो नहीं अपलोड कर सकते`, 'error');
                    continue;
                }
            } catch (error) {
                console.error('Video duration error:', error);
                showNotification(`${file.name} - वीडियो चेक करने में त्रुटि`, 'error');
                continue;
            }
        }
        
        // Add to selected files
        const fileData = {
            id: 'temp_' + Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            type: type,
            progress: 0
        };
        
        state.selectedFiles.push(fileData);
        validFiles++;
    }
    
    if (validFiles > 0) {
        updateSelectedFilesUI();
        showNotification(`${validFiles} फाइलें चुन ली गईं`, 'success');
    }
}

function getVideoDuration(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        
        video.onerror = () => {
            reject(new Error('Invalid video file'));
        };
        
        video.src = URL.createObjectURL(file);
    });
}

function updateSelectedFilesUI() {
    elements.selectedCount.textContent = state.selectedFiles.length;
    elements.filesListPreview.innerHTML = '';
    
    if (state.selectedFiles.length === 0) {
        elements.uploadBtn.disabled = true;
        elements.selectedFiles.style.display = 'none';
        return;
    }
    
    elements.uploadBtn.disabled = false;
    elements.selectedFiles.style.display = 'block';
    
    state.selectedFiles.forEach((fileData, index) => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item-preview';
        fileElement.innerHTML = `
            <div class="file-info-small">
                <div class="file-icon-small ${fileData.type}" style="background: ${getFileColor(fileData.type)}20; color: ${getFileColor(fileData.type)};">
                    <i class="fas ${getFileIcon(fileData.type)}"></i>
                </div>
                <div class="file-details-small">
                    <h5 title="${fileData.name}">${fileData.name}</h5>
                    <p>${formatFileSize(fileData.size)} • ${fileData.type}</p>
                </div>
            </div>
            <button class="btn-remove-file" onclick="removeSelectedFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        elements.filesListPreview.appendChild(fileElement);
    });
}

function removeSelectedFile(index) {
    state.selectedFiles.splice(index, 1);
    updateSelectedFilesUI();
}

async function startUpload() {
    if (state.selectedFiles.length === 0) return;
    
    elements.uploadProgress.style.display = 'block';
    elements.uploadBtn.disabled = true;
    
    const totalFiles = state.selectedFiles.length;
    let completed = 0;
    
    for (let i = 0; i < state.selectedFiles.length; i++) {
        const fileData = state.selectedFiles[i];
        
        // Update progress UI
        elements.currentFile.textContent = fileData.name;
        elements.progressPercent.textContent = `${Math.round((completed / totalFiles) * 100)}%`;
        elements.progressFill.style.width = `${(completed / totalFiles) * 100}%`;
        
        try {
            // Read file as Data URL
            const dataUrl = await readFileAsDataURL(fileData.file);
            
            // Create file object
            const fileObj = {
                id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: fileData.name,
                type: fileData.type,
                size: fileData.size,
                uploadDate: new Date().toISOString(),
                views: 0,
                downloads: 0,
                data: dataUrl
            };
            
            // Add to files array
            state.files.unshift(fileObj);
            
            // Update stats
            state.stats.totalSize += fileData.size;
            
            completed++;
            
            // Update progress
            elements.progressPercent.textContent = `${Math.round((completed / totalFiles) * 100)}%`;
            elements.progressFill.style.width = `${(completed / totalFiles) * 100}%`;
            
        } catch (error) {
            console.error('Upload error:', error);
            showNotification(`${fileData.name} अपलोड में त्रुटि`, 'error');
        }
    }
    
    // Complete
    elements.progressPercent.textContent = '100%';
    elements.progressFill.style.width = '100%';
    elements.currentFile.textContent = 'सभी फाइलें अपलोड हो गईं';
    
    // Save to storage
    updateStats();
    saveToStorage();
    
    // Reset
    setTimeout(() => {
        state.selectedFiles = [];
        elements.uploadProgress.style.display = 'none';
        elements.uploadBtn.disabled = false;
        updateSelectedFilesUI();
        loadFiles();
        
        showNotification(`${totalFiles} फाइलें सफलतापूर्वक अपलोड हो गईं`, 'success');
    }, 1000);
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== FILE MANAGEMENT =====
function loadFiles() {
    // Apply search
    let filteredFiles = state.files.filter(file => 
        file.name.toLowerCase().includes(state.searchQuery.toLowerCase())
    );
    
    // Apply sort
    filteredFiles.sort((a, b) => {
        switch (state.sortBy) {
            case 'newest':
                return new Date(b.uploadDate) - new Date(a.uploadDate);
            case 'oldest':
                return new Date(a.uploadDate) - new Date(b.uploadDate);
            case 'largest':
                return b.size - a.size;
            case 'smallest':
                return a.size - b.size;
            case 'name':
                return a.name.localeCompare(b.name);
            case 'type':
                return a.type.localeCompare(b.type);
            default:
                return 0;
        }
    });
    
    // Update UI
    if (filteredFiles.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.filesGrid.style.display = 'none';
        elements.pagination.style.display = 'none';
    } else {
        elements.emptyState.style.display = 'none';
        elements.filesGrid.style.display = 'grid';
        renderFilesGrid(filteredFiles);
        
        // Pagination
        const totalPages = Math.ceil(filteredFiles.length / CONFIG.ITEMS_PER_PAGE);
        if (totalPages > 1) {
            elements.pagination.style.display = 'flex';
            renderPagination(totalPages, filteredFiles);
        } else {
            elements.pagination.style.display = 'none';
        }
    }
}

function renderFilesGrid(files) {
    elements.filesGrid.innerHTML = '';
    
    // Get current page files
    const start = (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const end = start + CONFIG.ITEMS_PER_PAGE;
    const pageFiles = files.slice(start, end);
    
    pageFiles.forEach(file => {
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        fileCard.innerHTML = `
            <div class="file-card-header">
                <div class="file-card-icon ${file.type}" style="background: ${getFileColor(file.type)}20; color: ${getFileColor(file.type)};">
                    <i class="fas ${getFileIcon(file.type)}"></i>
                </div>
                <div class="file-card-title">
                    <h4 title="${file.name}">${file.name}</h4>
                    <p>${getTimeAgo(file.uploadDate)}</p>
                </div>
            </div>
            <div class="file-card-body">
                <div class="file-card-meta">
                    <div class="meta-item">
                        <span class="label">साइज</span>
                        <span class="value">${formatFileSize(file.size)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">व्यू</span>
                        <span class="value">${file.views}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">डाउनलोड</span>
                        <span class="value">${file.downloads}</span>
                    </div>
                </div>
                <div class="file-card-actions">
                    <button class="file-card-btn view" onclick="previewFile('${file.id}')">
                        <i class="fas fa-eye"></i>
                        <span>देखें</span>
                    </button>
                    <button class="file-card-btn download" onclick="downloadFile('${file.id}')">
                        <i class="fas fa-download"></i>
                        <span>डाउनलोड</span>
                    </button>
                    <button class="file-card-btn share" onclick="shareFile('${file.id}')">
                        <i class="fas fa-share-alt"></i>
                        <span>शेयर</span>
                    </button>
                    <button class="file-card-btn delete" onclick="deleteFile('${file.id}')">
                        <i class="fas fa-trash"></i>
                        <span>डिलीट</span>
                    </button>
                </div>
            </div>
        `;
        elements.filesGrid.appendChild(fileCard);
    });
}

function renderPagination(totalPages, filteredFiles) {
    elements.pageNumbers.innerHTML = '';
    
    // Previous button
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.prevPageBtn.onclick = () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            loadFiles();
        }
    };
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('span');
        pageBtn.className = `page-number ${i === state.currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            state.currentPage = i;
            loadFiles();
        };
        elements.pageNumbers.appendChild(pageBtn);
    }
    
    // Next button
    elements.nextPageBtn.disabled = state.currentPage === totalPages;
    elements.nextPageBtn.onclick = () => {
        if (state.currentPage < totalPages) {
            state.currentPage++;
            loadFiles();
        }
    };
}

// ===== FILE ACTIONS =====
function previewFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (!file) return;
    
    // Update view count
    file.views++;
    state.stats.totalViews++;
    saveToStorage();
    updateStats();
    
    // Set current file
    state.currentPreviewFile = file;
    
    // Update preview info
    elements.previewFileName.textContent = file.name;
    elements.previewFileSize.textContent = formatFileSize(file.size);
    elements.previewFileDate.textContent = formatDate(file.uploadDate);
    elements.previewFileViews.textContent = `${file.views} व्यू`;
    
    // Clear previous content
    elements.previewBody.innerHTML = '';
    
    // Show appropriate preview
    if (file.type === 'image') {
        // Image preview
        elements.previewBody.innerHTML = `
            <div class="preview-image-container">
                <img src="${file.data}" alt="${file.name}" id="previewImg">
            </div>
        `;
        
        // Initialize image viewer
        const viewer = new Viewer(document.getElementById('previewImg'), {
            inline: false,
            toolbar: {
                zoomIn: true,
                zoomOut: true,
                oneToOne: true,
                reset: true,
                prev: false,
                play: false,
                next: false,
                rotateLeft: true,
                rotateRight: true,
                flipHorizontal: true,
                flipVertical: true,
            }
        });
        
    } else if (file.type === 'video') {
        // Video preview
        elements.previewBody.innerHTML = `
            <div class="preview-video-container">
                <video controls id="previewVideo">
                    <source src="${file.data}" type="video/mp4">
                    आपका ब्राउज़र वीडियो सपोर्ट नहीं करता।
                </video>
            </div>
        `;
        
        // Initialize video player
        const video = document.getElementById('previewVideo');
        video.onloadedmetadata = () => {
            video.play().catch(e => console.log('Auto-play prevented:', e));
        };
        
    } else if (file.type === 'audio') {
        // Audio preview
        elements.previewBody.innerHTML = `
            <div class="preview-other-container">
                <i class="fas fa-file-audio"></i>
                <h4>ऑडियो फाइल</h4>
                <audio controls style="width: 100%; margin-top: 1rem;">
                    <source src="${file.data}" type="audio/mpeg">
                    आपका ब्राउज़र ऑडियो सपोर्ट नहीं करता।
                </audio>
            </div>
        `;
        
    } else if (file.type === 'text') {
        // Text preview
        try {
            // Extract text from data URL
            const base64Data = file.data.split(',')[1];
            const text = atob(base64Data);
            elements.previewBody.innerHTML = `
                <div class="preview-text-container">
                    <pre>${text.substring(0, 5000)}${text.length > 5000 ? '\n\n... (आगे का कंटेंट डाउनलोड करके देखें)' : ''}</pre>
                </div>
            `;
        } catch (e) {
            elements.previewBody.innerHTML = `
                <div class="preview-other-container">
                    <i class="fas fa-file-alt"></i>
                    <h4>टेक्स्ट फाइल</h4>
                    <p>इस फाइल को डाउनलोड करके देखें</p>
                </div>
            `;
        }
    } else {
        // Other file types
        elements.previewBody.innerHTML = `
            <div class="preview-other-container">
                <i class="fas ${getFileIcon(file.type)}"></i>
                <h4>${file.type.toUpperCase()} फाइल</h4>
                <p>इस फाइल को डाउनलोड करके देखें</p>
                <p><small>फाइल साइज: ${formatFileSize(file.size)}</small></p>
            </div>
        `;
    }
    
    // Set up action buttons
    elements.downloadPreviewBtn.onclick = () => downloadFile(file.id);
    elements.sharePreviewBtn.onclick = () => shareFile(file.id);
    elements.deletePreviewBtn.onclick = () => {
        deleteFile(file.id);
        elements.previewModal.style.display = 'none';
    };
    
    // Show modal
    elements.previewModal.style.display = 'flex';
}

function downloadFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (!file) {
        showNotification('फाइल नहीं मिली', 'error');
        return;
    }
    
    try {
        // Create download link
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update download count
        file.downloads++;
        state.stats.totalDownloads++;
        saveToStorage();
        updateStats();
        loadFiles();
        
        showNotification(`${file.name} डाउनलोड शुरू हो गया`, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification('डाउनलोड में त्रुटि', 'error');
    }
}

function shareFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (!file) return;
    
    // Generate share URL (simulated)
    const shareUrl = `${window.location.href}#file=${fileId}`;
    
    if (navigator.share) {
        // Use Web Share API if available
        navigator.share({
            title: file.name,
            text: `${file.name} फाइल देखें`,
            url: shareUrl
        }).then(() => {
            showNotification('फाइल शेयर की गई', 'success');
        }).catch(() => {
            copyToClipboard(shareUrl);
        });
    } else {
        copyToClipboard(shareUrl);
    }
}

function deleteFile(fileId) {
    if (!confirm('क्या आप वाकई इस फाइल को डिलीट करना चाहते हैं?')) {
        return;
    }
    
    const fileIndex = state.files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;
    
    const file = state.files[fileIndex];
    
    // Remove file
    state.files.splice(fileIndex, 1);
    
    // Update stats
    state.stats.totalSize -= file.size;
    state.stats.totalViews -= file.views;
    state.stats.totalDownloads -= file.downloads;
    
    // Save and reload
    saveToStorage();
    updateStats();
    loadFiles();
    
    showNotification('फाइल डिलीट हो गई', 'success');
}

// ===== UI CONTROLS =====
function initUIControls() {
    // Search
    elements.searchBox.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        state.currentPage = 1;
        loadFiles();
    });
    
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchBox.value = '';
        state.searchQuery = '';
        state.currentPage = 1;
        loadFiles();
    });
    
    // Sort
    elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        state.currentPage = 1;
        loadFiles();
    });
    
    // Clear all files
    elements.clearAllBtn.addEventListener('click', () => {
        if (!confirm('क्या आप सभी फाइलें डिलीट करना चाहते हैं?\nयह एक्शन पूर्ववत नहीं किया जा सकता!')) {
            return;
        }
        
        state.files = [];
        state.stats = {
            totalFiles: 0,
            totalSize: 0,
            totalViews: 0,
            totalDownloads: 0,
            visitors: state.stats.visitors
        };
        
        saveToStorage();
        updateStats();
        loadFiles();
        
        showNotification('सभी फाइलें डिलीट हो गईं', 'success');
    });
    
    // Modal controls
    elements.closePreviewBtn.addEventListener('click', () => {
        elements.previewModal.style.display = 'none';
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.previewModal) {
            elements.previewModal.style.display = 'none';
        }
    });
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
        }
        .notification-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .notification-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .notification-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            color: inherit;
            padding: 0;
            margin-left: 10px;
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    
    // Add to DOM
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Close button
    notification.querySelector('.notification-close').onclick = () => {
        notification.remove();
    };
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('लिंक कॉपी हो गया', 'success');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('लिंक कॉपी हो गया', 'success');
    });
}

function scrollToUpload() {
    document.getElementById('upload').scrollIntoView({
        behavior: 'smooth'
    });
}

// ===== INITIALIZATION =====
function initApp() {
    // Show loading screen
    elements.loadingScreen.style.display = 'flex';
    
    setTimeout(() => {
        elements.loadingScreen.style.display = 'none';
        
        // Load data from storage
        loadFromStorage();
        
        // Initialize modules
        initUpload();
        initUIControls();
        
        // Load files
        loadFiles();
        
        // Show welcome message
        setTimeout(() => {
            if (state.files.length === 0) {
                showNotification('पहली फाइल अपलोड करने के लिए ऊपर "अपलोड" सेक्शन में जाएं', 'info');
            }
            
            // Show session info
            if (state.sessionStart) {
                const time = new Date().toLocaleTimeString('hi-IN');
                showNotification(`लॉगिन समय: ${time} | विज़िटर्स: ${state.stats.visitors}`, 'info');
            }
        }, 1000);
        
    }, 1500);
}

// ===== MAIN INITIALIZATION =====
function init() {
    // Initialize password system first
    initPasswordSystem();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);