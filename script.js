// ===== MOBILE-FIRST CONFIGURATION =====
const CONFIG = {
    STORAGE_KEY: 'mobile_file_sharing_system',
    USER_NAME_KEY: 'file_system_user_name',
    VISITORS_KEY: 'file_system_visitors',
    MAX_STORAGE: 10 * 1024 * 1024 * 1024, // 10GB
    MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
    MAX_VIDEO_DURATION: 5 * 60, // 5 minutes
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
    }
};

// ===== STATE =====
let state = {
    isLoggedIn: false,
    userName: null,
    files: [],
    selectedFiles: [],
    currentPage: 1,
    searchQuery: '',
    sortBy: 'newest',
    viewMode: 'grid', // 'grid' or 'list'
    stats: {
        totalFiles: 0,
        totalSize: 0,
        totalViews: 0,
        totalDownloads: 0,
        visitors: 1,
        todayUploads: 0
    },
    currentPreviewFile: null,
    lastActivity: new Date().toISOString()
};

// ===== MOBILE DETECTION =====
const isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.iOS());
    }
};

// ===== DOM ELEMENTS =====
const elements = {
    // Name Modal
    nameModal: document.getElementById('nameModal'),
    userNameInput: document.getElementById('userNameInput'),
    loginBtn: document.getElementById('loginBtn'),
    nameError: document.getElementById('nameError'),
    
    // Loading
    loadingScreen: document.getElementById('loadingScreen'),
    
    // User Display
    currentUserName: document.getElementById('currentUserName'),
    userWelcome: document.getElementById('userWelcome'),
    mobileUserName: document.getElementById('mobileUserName'),
    footerUserName: document.getElementById('footerUserName'),
    
    // Storage
    usedStorage: document.getElementById('usedStorage'),
    totalStorage: document.getElementById('totalStorage'),
    freeStorage: document.getElementById('freeStorage'),
    mobileFreeStorage: document.getElementById('mobileFreeStorage'),
    usedPercent: document.getElementById('usedPercent'),
    storageMeter: document.getElementById('storageMeter'),
    footerStorage: document.getElementById('footerStorage'),
    
    // Stats
    totalFiles: document.getElementById('totalFiles'),
    totalSizeMB: document.getElementById('totalSizeMB'),
    totalDownloads: document.getElementById('totalDownloads'),
    visitorsCount: document.getElementById('visitorsCount'),
    storageTrend: document.getElementById('storageTrend'),
    lastActivity: document.getElementById('lastActivity'),
    
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
    uploadBtn: document.getElementById('uploadBtn'),
    
    // Files
    filesGrid: document.getElementById('filesGrid'),
    filesListView: document.getElementById('filesListView'),
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
    
    // Mobile Elements
    mobileMenu: document.getElementById('mobileMenu'),
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

// ===== MOBILE UTILITIES =====
function showMobileToast(message, type = 'success') {
    const toast = document.getElementById('mobileToast');
    const icon = toast.querySelector('i');
    const messageSpan = document.getElementById('toastMessage');
    
    // Set icon based on type
    icon.className = `fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}`;
    messageSpan.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showMobileMenu() {
    elements.mobileMenu.classList.add('show');
}

function hideMobileMenu() {
    elements.mobileMenu.classList.remove('show');
}

function closePreview() {
    elements.previewModal.style.display = 'none';
}

function setViewMode(mode) {
    state.viewMode = mode;
    
    // Update active button
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (mode === 'grid') {
        document.querySelector('.view-toggle-btn:nth-child(1)').classList.add('active');
        elements.filesGrid.style.display = 'grid';
        elements.filesListView.style.display = 'none';
    } else {
        document.querySelector('.view-toggle-btn:nth-child(2)').classList.add('active');
        elements.filesGrid.style.display = 'none';
        elements.filesListView.style.display = 'block';
    }
    
    loadFiles();
}

// ===== NAME-BASED LOGIN SYSTEM =====
function initNameSystem() {
    // Check if user name exists
    const savedName = localStorage.getItem(CONFIG.USER_NAME_KEY);
    
    if (savedName) {
        // Auto login with saved name
        state.userName = savedName;
        state.isLoggedIn = true;
        elements.nameModal.style.display = 'none';
        updateUserDisplay(savedName);
        initApp();
        return;
    }
    
    // Show name modal for new users
    elements.nameModal.style.display = 'flex';
    
    // Add event listeners
    elements.loginBtn.addEventListener('click', handleNameLogin);
    
    // Enter key support
    elements.userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleNameLogin();
    });
    
    // Name suggestions
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.userNameInput.value = e.target.dataset.name;
            elements.userNameInput.focus();
        });
    });
    
    // Initialize visitors count
    if (!localStorage.getItem(CONFIG.VISITORS_KEY)) {
        localStorage.setItem(CONFIG.VISITORS_KEY, '1');
        state.stats.visitors = 1;
    } else {
        state.stats.visitors = parseInt(localStorage.getItem(CONFIG.VISITORS_KEY));
        state.stats.visitors++;
        localStorage.setItem(CONFIG.VISITORS_KEY, state.stats.visitors.toString());
    }
    
    updateVisitorsDisplay();
}

function handleNameLogin() {
    const userName = elements.userNameInput.value.trim();
    
    if (userName === '') {
        elements.nameError.textContent = 'कृपया अपना नाम डालें';
        elements.userNameInput.focus();
        return;
    }
    
    if (userName.length < 2) {
        elements.nameError.textContent = 'नाम कम से कम 2 अक्षर का हो';
        elements.userNameInput.focus();
        return;
    }
    
    // Login successful
    state.userName = userName;
    state.isLoggedIn = true;
    
    // Save to localStorage
    localStorage.setItem(CONFIG.USER_NAME_KEY, userName);
    localStorage.setItem('file_session', JSON.stringify({
        timestamp: new Date().toISOString(),
        userName: userName
    }));
    
    // Hide modal
    elements.nameModal.style.display = 'none';
    
    // Update UI
    updateUserDisplay(userName);
    
    // Show welcome toast
    showMobileToast(`नमस्ते ${userName}! आपका स्वागत है`, 'success');
    
    // Initialize app
    initApp();
}

function updateUserDisplay(userName) {
    // Update all user name displays
    if (elements.currentUserName) elements.currentUserName.textContent = userName;
    if (elements.mobileUserName) elements.mobileUserName.textContent = userName;
    if (elements.footerUserName) elements.footerUserName.textContent = userName;
    
    // Show welcome section
    if (elements.userWelcome) {
        elements.userWelcome.style.display = 'flex';
    }
}

function updateVisitorsDisplay() {
    if (elements.visitorsCount) {
        elements.visitorsCount.textContent = state.stats.visitors;
    }
}

function handleLogout() {
    if (confirm('क्या आप लॉगआउट करना चाहते हैं?\nआपका नाम डिलीट हो जाएगा।')) {
        localStorage.removeItem(CONFIG.USER_NAME_KEY);
        localStorage.removeItem('file_session');
        state.userName = null;
        state.isLoggedIn = false;
        location.reload();
    }
}

// ===== STORAGE MANAGEMENT =====
function saveToStorage() {
    try {
        const data = {
            files: state.files,
            stats: state.stats,
            userName: state.userName,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        updateStorageDisplay();
        return true;
    } catch (error) {
        console.error('Storage error:', error);
        showMobileToast('स्टोरेज में सेव करने में त्रुटि', 'error');
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
                visitors: state.stats.visitors,
                todayUploads: 0
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
    
    // Update desktop display
    if (elements.usedStorage) elements.usedStorage.textContent = formatFileSize(used);
    if (elements.freeStorage) elements.freeStorage.textContent = formatFileSize(free);
    if (elements.usedPercent) elements.usedPercent.textContent = percent.toFixed(1) + '%';
    if (elements.storageMeter) {
        elements.storageMeter.style.width = Math.min(percent, 100) + '%';
        if (percent > 90) {
            elements.storageMeter.style.background = 'linear-gradient(90deg, #f72585, #ff6b6b)';
        } else if (percent > 75) {
            elements.storageMeter.style.background = 'linear-gradient(90deg, #f8961e, #f9c74f)';
        }
    }
    
    // Update mobile display
    if (elements.mobileFreeStorage) {
        elements.mobileFreeStorage.textContent = formatFileSize(free);
    }
    if (elements.footerStorage) {
        elements.footerStorage.textContent = `${formatFileSize(used)} / 10GB`;
    }
    if (elements.totalSizeMB) {
        elements.totalSizeMB.textContent = formatFileSize(used);
    }
    if (elements.storageTrend) {
        elements.storageTrend.textContent = percent.toFixed(0) + '%';
    }
}

function updateStats() {
    // Calculate from files array
    state.stats.totalFiles = state.files.length;
    state.stats.totalSize = state.files.reduce((sum, file) => sum + file.size, 0);
    state.stats.totalViews = state.files.reduce((sum, file) => sum + file.views, 0);
    state.stats.totalDownloads = state.files.reduce((sum, file) => sum + file.downloads, 0);
    
    // Update DOM
    if (elements.totalFiles) elements.totalFiles.textContent = state.stats.totalFiles;
    if (elements.totalDownloads) elements.totalDownloads.textContent = state.stats.totalDownloads;
    
    // Update activity time
    if (elements.lastActivity) {
        elements.lastActivity.textContent = getTimeAgo(state.lastActivity);
    }
}

// ===== FILE UPLOAD (MOBILE OPTIMIZED) =====
function initUpload() {
    // Browse button
    elements.browseBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    // File input change
    elements.fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Mobile upload options
    if (isMobile.any()) {
        setupMobileUpload();
    }
    
    // Drag and drop (desktop)
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

function setupMobileUpload() {
    // Camera upload
    window.openCamera = function() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showMobileToast('कैमरा सपोर्ट नहीं है', 'error');
            return;
        }
        
        // For mobile, we'll just trigger file input with camera accept
        elements.fileInput.setAttribute('accept', 'image/*');
        elements.fileInput.setAttribute('capture', 'environment');
        elements.fileInput.click();
        // Reset accept attribute
        setTimeout(() => {
            elements.fileInput.removeAttribute('accept');
            elements.fileInput.removeAttribute('capture');
        }, 100);
    };
    
    // Gallery upload
    window.openGallery = function() {
        elements.fileInput.setAttribute('accept', 'image/*,video/*');
        elements.fileInput.click();
        setTimeout(() => {
            elements.fileInput.removeAttribute('accept');
        }, 100);
    };
    
    // File picker
    window.openFilePicker = function() {
        elements.fileInput.removeAttribute('accept');
        elements.fileInput.click();
    };
    
    // Create document (placeholder)
    window.createDocument = function() {
        showMobileToast('जल्द ही उपलब्ध होगा', 'info');
    };
}

async function handleFiles(fileList) {
    const files = Array.from(fileList);
    let validFiles = 0;
    
    for (const file of files) {
        // Check file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            showMobileToast(`${file.name} - 500MB से बड़ी नहीं`, 'error');
            continue;
        }
        
        // Check total storage
        const newTotalSize = state.stats.totalSize + file.size;
        if (newTotalSize > CONFIG.MAX_STORAGE) {
            showMobileToast('10GB स्टोरेज पूरी हो गई', 'error');
            continue;
        }
        
        // Check file type
        const type = getFileType(file.name);
        if (type === 'other') {
            showMobileToast(`${file.name} - सपोर्टेड नहीं`, 'error');
            continue;
        }
        
        // Check video duration
        if (type === 'video') {
            try {
                const duration = await getVideoDuration(file);
                if (duration > CONFIG.MAX_VIDEO_DURATION) {
                    showMobileToast(`${file.name} - 5 मिनट से लंबा नहीं`, 'error');
                    continue;
                }
            } catch (error) {
                console.error('Video duration error:', error);
                showMobileToast(`${file.name} - चेक करने में त्रुटि`, 'error');
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
        showMobileToast(`${validFiles} फाइलें चुनी गईं`, 'success');
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
            state.stats.todayUploads++;
            
            completed++;
            
            // Update progress
            elements.progressPercent.textContent = `${Math.round((completed / totalFiles) * 100)}%`;
            elements.progressFill.style.width = `${(completed / totalFiles) * 100}%`;
            
        } catch (error) {
            console.error('Upload error:', error);
            showMobileToast(`${fileData.name} अपलोड में त्रुटि`, 'error');
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
        
        showMobileToast(`${totalFiles} फाइलें अपलोड हो गईं`, 'success');
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
        elements.filesListView.style.display = 'none';
        elements.pagination.style.display = 'none';
    } else {
        elements.emptyState.style.display = 'none';
        
        if (state.viewMode === 'grid') {
            renderFilesGrid(filteredFiles);
        } else {
            renderFilesList(filteredFiles);
        }
        
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
    elements.filesGrid.style.display = 'grid';
    
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
                </div>
            </div>
        `;
        elements.filesGrid.appendChild(fileCard);
    });
}

function renderFilesList(files) {
    elements.filesListView.innerHTML = '';
    elements.filesListView.style.display = 'block';
    
    const start = (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const end = start + CONFIG.ITEMS_PER_PAGE;
    const pageFiles = files.slice(start, end);
    
    pageFiles.forEach(file => {
        const listItem = document.createElement('div');
        listItem.className = 'list-view-item';
        listItem.innerHTML = `
            <div class="file-icon-small ${file.type}" style="background: ${getFileColor(file.type)}20; color: ${getFileColor(file.type)};">
                <i class="fas ${getFileIcon(file.type)}"></i>
            </div>
            <div class="list-view-info">
                <h4 title="${file.name}">${file.name}</h4>
                <p>${formatFileSize(file.size)} • ${getTimeAgo(file.uploadDate)}</p>
            </div>
            <div class="list-view-actions">
                <button class="list-view-btn" onclick="previewFile('${file.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="list-view-btn" onclick="downloadFile('${file.id}')">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
        
        // Add swipe actions for mobile
        if (isMobile.any()) {
            setupSwipeActions(listItem, file.id);
        }
        
        elements.filesListView.appendChild(listItem);
    });
}

function setupSwipeActions(element, fileId) {
    let touchStartX = 0;
    let touchEndX = 0;
    
    element.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    element.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe(element, touchStartX, touchEndX, fileId);
    }, { passive: true });
}

function handleSwipe(element, startX, endX, fileId) {
    const threshold = 50;
    const diff = startX - endX;
    
    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            // Swipe left - delete
            element.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                deleteFile(fileId);
            }, 300);
        } else {
            // Swipe right - share
            element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                element.style.transform = '';
                shareFile(fileId);
            }, 300);
        }
    }
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
    const maxVisible = 3;
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
    state.lastActivity = new Date().toISOString();
    saveToStorage();
    updateStats();
    
    // Set current file
    state.currentPreviewFile = file;
    
    // Update preview info
    elements.previewFileName.textContent = file.name;
    elements.previewFileSize.textContent = formatFileSize(file.size);
    
    // Clear previous content
    elements.previewBody.innerHTML = '';
    
    // Show appropriate preview
    if (file.type === 'image') {
        elements.previewBody.innerHTML = `
            <div class="preview-image-container">
                <img src="${file.data}" alt="${file.name}" id="previewImg">
            </div>
        `;
    } else if (file.type === 'video') {
        elements.previewBody.innerHTML = `
            <div class="preview-video-container">
                <video controls id="previewVideo">
                    <source src="${file.data}" type="video/mp4">
                    आपका ब्राउज़र वीडियो सपोर्ट नहीं करता।
                </video>
            </div>
        `;
    } else if (file.type === 'audio') {
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
        try {
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
        closePreview();
    };
    
    // Show modal
    elements.previewModal.style.display = 'flex';
}

function downloadFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (!file) {
        showMobileToast('फाइल नहीं मिली', 'error');
        return;
    }
    
    try {
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
        state.lastActivity = new Date().toISOString();
        saveToStorage();
        updateStats();
        loadFiles();
        
        showMobileToast(`${file.name} डाउनलोड शुरू`, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showMobileToast('डाउनलोड में त्रुटि', 'error');
    }
}

function shareFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (!file) return;
    
    const shareUrl = `${window.location.href}#file=${fileId}`;
    
    if (navigator.share) {
        navigator.share({
            title: file.name,
            text: `${file.name} फाइल देखें`,
            url: shareUrl
        }).then(() => {
            showMobileToast('फाइल शेयर की गई', 'success');
        }).catch(() => {
            copyToClipboard(shareUrl);
        });
    } else {
        copyToClipboard(shareUrl);
    }
}

function deleteFile(fileId) {
    const fileIndex = state.files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;
    
    const file = state.files[fileIndex];
    
    // Remove file
    state.files.splice(fileIndex, 1);
    
    // Update stats
    state.stats.totalSize -= file.size;
    state.stats.totalViews -= file.views;
    state.stats.totalDownloads -= file.downloads;
    state.lastActivity = new Date().toISOString();
    
    // Save and reload
    saveToStorage();
    updateStats();
    loadFiles();
    
    showMobileToast('फाइल डिलीट हो गई', 'success');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showMobileToast('लिंक कॉपी हो गया', 'success');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showMobileToast('लिंक कॉपी हो गया', 'success');
    });
}

// ===== MOBILE CONTROLS =====
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
    window.clearAllFiles = function() {
        if (!confirm('क्या आप सभी फाइलें डिलीट करना चाहते हैं?\nयह एक्शन पूर्ववत नहीं किया जा सकता!')) {
            return;
        }
        
        state.files = [];
        state.stats = {
            totalFiles: 0,
            totalSize: 0,
            totalViews: 0,
            totalDownloads: 0,
            visitors: state.stats.visitors,
            todayUploads: 0
        };
        
        saveToStorage();
        updateStats();
        loadFiles();
        
        showMobileToast('सभी फाइलें डिलीट हो गईं', 'success');
    };
    
    if (elements.clearAllBtn) {
        elements.clearAllBtn.addEventListener('click', clearAllFiles);
    }
    
    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Modal controls
    elements.closePreviewBtn.addEventListener('click', closePreview);
    elements.closeHelpBtn.addEventListener('click', () => {
        elements.helpModal.style.display = 'none';
    });
    
    // Window click to close modals
    window.addEventListener('click', (e) => {
        if (e.target === elements.previewModal) {
            closePreview();
        }
        if (e.target === elements.helpModal) {
            elements.helpModal.style.display = 'none';
        }
    });
    
    // Mobile gestures
    if (isMobile.any()) {
        setupMobileGestures();
    }
}

function setupMobileGestures() {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Pull to refresh
    let startY = 0;
    document.addEventListener('touchstart', e => {
        startY = e.touches[0].pageY;
    }, { passive: true });
    
    document.addEventListener('touchmove', e => {
        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;
        
        if (window.scrollY === 0 && diff > 50) {
            // Show refresh indicator
            document.body.style.transform = `translateY(${diff}px)`;
        }
    }, { passive: true });
    
    document.addEventListener('touchend', e => {
        document.body.style.transform = '';
    }, { passive: true });
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
        
        // Set default view mode
        setViewMode('grid');
        
        // Show welcome message for new users
        if (state.files.length === 0) {
            showMobileToast('पहली फाइल अपलोड करने के लिए ऊपर जाएं', 'info');
        }
        
    }, 1000);
}

// ===== GLOBAL FUNCTIONS =====
window.scrollToUpload = function() {
    scrollToSection('upload');
    hideMobileMenu();
};

window.showHelp = function() {
    elements.helpModal.style.display = 'flex';
    hideMobileMenu();
};

window.refreshApp = function() {
    location.reload();
};

window.clearCache = function() {
    if (confirm('क्या आप सभी कैश साफ़ करना चाहते हैं?')) {
        localStorage.clear();
        location.reload();
    }
};

window.installApp = function() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then(() => {
            window.deferredPrompt = null;
        });
    } else {
        showMobileToast('इंस्टॉल ऑप्शन उपलब्ध नहीं', 'info');
    }
};

// ===== MAIN INITIALIZATION =====
function init() {
    // Initialize name-based system
    initNameSystem();
    
    // PWA support
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
    });
    
    // Online/offline detection
    window.addEventListener('online', () => {
        showMobileToast('इंटरनेट कनेक्शन बहाल', 'success');
    });
    
    window.addEventListener('offline', () => {
        showMobileToast('ऑफलाइन मोड में', 'info');
    });
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

