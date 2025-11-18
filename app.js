/* ===================================
   OCULAR VISION ASSESSMENT - APP.JS
   Educational Assessment Tool
   =================================== */

// ===================================
// INDEXEDDB SETUP
// ===================================

class AssessmentDB {
    constructor() {
        this.dbName = 'OcularAssessments';
        this.version = 1;
        this.db = null;
        this.currentAssessmentId = 'current'; // For Phase 1, we'll use a single "current" assessment
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create assessments object store
                if (!db.objectStoreNames.contains('assessments')) {
                    const objectStore = db.createObjectStore('assessments', { keyPath: 'id' });
                    objectStore.createIndex('studentName', 'studentInfo.studentName', { unique: false });
                    objectStore.createIndex('assessmentDate', 'studentInfo.assessmentDate', { unique: false });
                    console.log('Created assessments object store');
                }
            };
        });
    }

    async saveAssessment(data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['assessments'], 'readwrite');
            const objectStore = transaction.objectStore('assessments');

            const assessmentData = {
                id: this.currentAssessmentId,
                ...data,
                lastModified: new Date().toISOString()
            };

            const request = objectStore.put(assessmentData);

            request.onsuccess = () => {
                resolve(assessmentData);
            };

            request.onerror = () => {
                console.error('Error saving assessment:', request.error);
                reject(request.error);
            };
        });
    }

    async loadAssessment() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(['assessments'], 'readonly');
            const objectStore = transaction.objectStore('assessments');
            const request = objectStore.get(this.currentAssessmentId);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                console.error('Error loading assessment:', request.error);
                reject(request.error);
            };
        });
    }
}

// ===================================
// ASSESSMENT STATE MANAGER
// ===================================

class AssessmentManager {
    constructor() {
        this.db = new AssessmentDB();
        this.state = {
            studentInfo: {
                studentName: '',
                dateOfBirth: '',
                yearGroup: '',
                assessmentDate: this.getTodayDate(),
                assessedBy: ''
            },
            seeIt: {
                distanceAcuity: '',
                distanceAcuityNotes: '',
                nearAcuity: '',
                nearDistance: '',
                nearAcuityNotes: '',
                contrastSensitivity: '',
                contrastSensitivityNotes: '',
                lightSensitivity: [],
                lightSensitivityNotes: ''
            }
        };
        this.saveTimeout = null;
        this.saveDelay = 500; // Debounce delay in ms
    }

    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async init() {
        try {
            await this.db.init();
            await this.loadSavedData();
            this.setupEventListeners();
            this.updateUI();
            console.log('Assessment Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Assessment Manager:', error);
            this.showError('Failed to initialize database. Some features may not work.');
        }
    }

    async loadSavedData() {
        try {
            const savedData = await this.db.loadAssessment();
            if (savedData) {
                this.state = {
                    ...this.state,
                    ...savedData
                };
                this.populateForm();
                console.log('Loaded saved assessment data');
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    populateForm() {
        // Student Info
        document.getElementById('student-name').value = this.state.studentInfo.studentName || '';
        document.getElementById('date-of-birth').value = this.state.studentInfo.dateOfBirth || '';
        document.getElementById('year-group').value = this.state.studentInfo.yearGroup || '';
        document.getElementById('assessment-date').value = this.state.studentInfo.assessmentDate || this.getTodayDate();
        document.getElementById('assessed-by').value = this.state.studentInfo.assessedBy || '';

        // See It section
        document.getElementById('distance-acuity').value = this.state.seeIt.distanceAcuity || '';
        document.querySelector('[name="distanceAcuityNotes"]').value = this.state.seeIt.distanceAcuityNotes || '';

        document.getElementById('near-acuity').value = this.state.seeIt.nearAcuity || '';
        document.getElementById('near-distance').value = this.state.seeIt.nearDistance || '';
        document.querySelector('[name="nearAcuityNotes"]').value = this.state.seeIt.nearAcuityNotes || '';

        document.getElementById('contrast-sensitivity').value = this.state.seeIt.contrastSensitivity || '';
        document.querySelector('[name="contrastSensitivityNotes"]').value = this.state.seeIt.contrastSensitivityNotes || '';

        // Light sensitivity checkboxes
        document.querySelectorAll('[name="lightSensitivity"]').forEach(checkbox => {
            checkbox.checked = this.state.seeIt.lightSensitivity.includes(checkbox.value);
        });
        document.querySelector('[name="lightSensitivityNotes"]').value = this.state.seeIt.lightSensitivityNotes || '';
    }

    setupEventListeners() {
        // Student Info listeners
        document.getElementById('student-name').addEventListener('input', (e) => {
            this.state.studentInfo.studentName = e.target.value;
            this.debouncedSave();
            this.updatePreview();
        });

        document.getElementById('date-of-birth').addEventListener('change', (e) => {
            this.state.studentInfo.dateOfBirth = e.target.value;
            this.debouncedSave();
            this.updatePreview();
        });

        document.getElementById('year-group').addEventListener('change', (e) => {
            this.state.studentInfo.yearGroup = e.target.value;
            this.debouncedSave();
            this.updatePreview();
        });

        document.getElementById('assessment-date').addEventListener('change', (e) => {
            this.state.studentInfo.assessmentDate = e.target.value;
            this.debouncedSave();
            this.updatePreview();
        });

        document.getElementById('assessed-by').addEventListener('input', (e) => {
            this.state.studentInfo.assessedBy = e.target.value;
            this.debouncedSave();
            this.updatePreview();
        });

        // See It section listeners
        document.getElementById('distance-acuity').addEventListener('change', (e) => {
            this.state.seeIt.distanceAcuity = e.target.value;
            this.debouncedSave();
            this.updateCheckIndicators();
            this.updateProgress();
        });

        document.querySelector('[name="distanceAcuityNotes"]').addEventListener('input', (e) => {
            this.state.seeIt.distanceAcuityNotes = e.target.value;
            this.debouncedSave();
        });

        document.getElementById('near-acuity').addEventListener('change', (e) => {
            this.state.seeIt.nearAcuity = e.target.value;
            this.debouncedSave();
            this.updateCheckIndicators();
            this.updateProgress();
        });

        document.getElementById('near-distance').addEventListener('input', (e) => {
            this.state.seeIt.nearDistance = e.target.value;
            this.debouncedSave();
        });

        document.querySelector('[name="nearAcuityNotes"]').addEventListener('input', (e) => {
            this.state.seeIt.nearAcuityNotes = e.target.value;
            this.debouncedSave();
        });

        document.getElementById('contrast-sensitivity').addEventListener('change', (e) => {
            this.state.seeIt.contrastSensitivity = e.target.value;
            this.debouncedSave();
            this.updateCheckIndicators();
            this.updateProgress();
        });

        document.querySelector('[name="contrastSensitivityNotes"]').addEventListener('input', (e) => {
            this.state.seeIt.contrastSensitivityNotes = e.target.value;
            this.debouncedSave();
        });

        // Light sensitivity checkboxes
        document.querySelectorAll('[name="lightSensitivity"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.state.seeIt.lightSensitivity.push(e.target.value);
                } else {
                    this.state.seeIt.lightSensitivity = this.state.seeIt.lightSensitivity.filter(
                        val => val !== e.target.value
                    );
                }
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
            });
        });

        document.querySelector('[name="lightSensitivityNotes"]').addEventListener('input', (e) => {
            this.state.seeIt.lightSensitivityNotes = e.target.value;
            this.debouncedSave();
        });

        // Toggle notes buttons
        document.querySelectorAll('.toggle-notes-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const notesContainer = document.getElementById(targetId);
                const isExpanded = e.target.getAttribute('aria-expanded') === 'true';

                e.target.setAttribute('aria-expanded', !isExpanded);
                notesContainer.classList.toggle('hidden');

                if (!isExpanded) {
                    e.target.textContent = '− Hide notes';
                    // Focus the textarea
                    const textarea = notesContainer.querySelector('textarea');
                    if (textarea) textarea.focus();
                } else {
                    e.target.textContent = '+ Optional notes';
                }
            });
        });

        // Generate Report button (placeholder for future)
        document.getElementById('generate-report-btn').addEventListener('click', () => {
            alert('Report generation will be implemented in Phase 2!');
        });
    }

    debouncedSave() {
        // Show saving indicator
        this.showSavingIndicator();

        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        // Set new timeout
        this.saveTimeout = setTimeout(async () => {
            await this.save();
        }, this.saveDelay);
    }

    async save() {
        try {
            await this.db.saveAssessment(this.state);
            this.showSavedIndicator();
        } catch (error) {
            console.error('Error saving assessment:', error);
            this.showErrorIndicator();
        }
    }

    showSavingIndicator() {
        const indicator = document.querySelector('.autosave-indicator');
        const text = document.getElementById('autosave-text');
        indicator.classList.add('saving');
        text.textContent = 'Saving...';
    }

    showSavedIndicator() {
        const indicator = document.querySelector('.autosave-indicator');
        const text = document.getElementById('autosave-text');
        indicator.classList.remove('saving');
        text.textContent = 'Changes saved automatically';
    }

    showErrorIndicator() {
        const indicator = document.querySelector('.autosave-indicator');
        const text = document.getElementById('autosave-text');
        indicator.classList.remove('saving');
        text.textContent = 'Error saving changes';
        text.style.color = 'var(--color-critical)';

        setTimeout(() => {
            text.style.color = '';
            text.textContent = 'Changes saved automatically';
        }, 3000);
    }

    updateUI() {
        this.updatePreview();
        this.updateProgress();
        this.updateCheckIndicators();
        this.updateCompletionBadges();
    }

    updatePreview() {
        // Update student name preview
        const studentNameEl = document.getElementById('preview-student-name');
        if (this.state.studentInfo.studentName) {
            studentNameEl.innerHTML = `<strong>${this.state.studentInfo.studentName}</strong>`;
        } else {
            studentNameEl.innerHTML = '<span class="preview-placeholder">No student name entered</span>';
        }

        // Update student details
        const detailsEl = document.getElementById('preview-student-details');
        const details = [];

        if (this.state.studentInfo.yearGroup) {
            details.push(this.state.studentInfo.yearGroup);
        }

        if (this.state.studentInfo.dateOfBirth) {
            const age = this.calculateAge(this.state.studentInfo.dateOfBirth);
            details.push(`Age ${age}`);
        }

        if (this.state.studentInfo.assessmentDate) {
            const date = new Date(this.state.studentInfo.assessmentDate);
            details.push(`Assessed: ${date.toLocaleDateString('en-GB')}`);
        }

        detailsEl.textContent = details.join(' • ');
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    updateProgress() {
        // Check Student Info completion
        const studentInfoComplete =
            this.state.studentInfo.studentName &&
            this.state.studentInfo.dateOfBirth &&
            this.state.studentInfo.yearGroup &&
            this.state.studentInfo.assessmentDate &&
            this.state.studentInfo.assessedBy;

        const studentInfoProgress = document.getElementById('progress-student-info');
        if (studentInfoComplete) {
            studentInfoProgress.classList.add('complete');
            studentInfoProgress.classList.remove('in-progress');
        } else if (Object.values(this.state.studentInfo).some(val => val && val.length > 0)) {
            studentInfoProgress.classList.add('in-progress');
            studentInfoProgress.classList.remove('complete');
        }

        // Check See It completion
        const seeItComplete =
            this.state.seeIt.distanceAcuity &&
            this.state.seeIt.nearAcuity &&
            this.state.seeIt.contrastSensitivity &&
            this.state.seeIt.lightSensitivity.length > 0;

        const seeItProgress = document.getElementById('progress-see-it');
        if (seeItComplete) {
            seeItProgress.classList.add('complete');
            seeItProgress.classList.remove('in-progress');
        } else if (
            this.state.seeIt.distanceAcuity ||
            this.state.seeIt.nearAcuity ||
            this.state.seeIt.contrastSensitivity ||
            this.state.seeIt.lightSensitivity.length > 0
        ) {
            seeItProgress.classList.add('in-progress');
            seeItProgress.classList.remove('complete');
        }

        // Update navigation
        this.updateNavigation();

        // Update generate report button
        const generateBtn = document.getElementById('generate-report-btn');
        if (studentInfoComplete && seeItComplete) {
            generateBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
        }
    }

    updateNavigation() {
        // Update Student Info nav item
        const studentInfoNav = document.querySelector('[data-section="student-info"]');
        const studentInfoComplete =
            this.state.studentInfo.studentName &&
            this.state.studentInfo.dateOfBirth &&
            this.state.studentInfo.yearGroup &&
            this.state.studentInfo.assessmentDate &&
            this.state.studentInfo.assessedBy;

        if (studentInfoComplete) {
            studentInfoNav.classList.add('completed');
        } else {
            studentInfoNav.classList.remove('completed');
        }

        // Update See It nav item
        const seeItNav = document.querySelector('[data-section="see-it"]');
        const seeItComplete =
            this.state.seeIt.distanceAcuity &&
            this.state.seeIt.nearAcuity &&
            this.state.seeIt.contrastSensitivity &&
            this.state.seeIt.lightSensitivity.length > 0;

        if (seeItComplete) {
            seeItNav.classList.add('completed');
        } else {
            seeItNav.classList.remove('completed');
        }
    }

    updateCheckIndicators() {
        // Distance Acuity
        const distanceCheck = document.getElementById('distance-acuity-check');
        if (this.state.seeIt.distanceAcuity) {
            distanceCheck.classList.add('complete');
        } else {
            distanceCheck.classList.remove('complete');
        }

        // Near Acuity
        const nearCheck = document.getElementById('near-acuity-check');
        if (this.state.seeIt.nearAcuity) {
            nearCheck.classList.add('complete');
        } else {
            nearCheck.classList.remove('complete');
        }

        // Contrast Sensitivity
        const contrastCheck = document.getElementById('contrast-sensitivity-check');
        if (this.state.seeIt.contrastSensitivity) {
            contrastCheck.classList.add('complete');
        } else {
            contrastCheck.classList.remove('complete');
        }

        // Light Sensitivity
        const lightCheck = document.getElementById('light-sensitivity-check');
        if (this.state.seeIt.lightSensitivity.length > 0) {
            lightCheck.classList.add('complete');
        } else {
            lightCheck.classList.remove('complete');
        }
    }

    updateCompletionBadges() {
        // Student Info badge
        const studentInfoBadge = document.getElementById('student-info-badge');
        const studentInfoComplete =
            this.state.studentInfo.studentName &&
            this.state.studentInfo.dateOfBirth &&
            this.state.studentInfo.yearGroup &&
            this.state.studentInfo.assessmentDate &&
            this.state.studentInfo.assessedBy;

        const studentInfoPartial =
            !studentInfoComplete &&
            Object.values(this.state.studentInfo).some(val => val && val.length > 0);

        if (studentInfoComplete) {
            studentInfoBadge.textContent = 'Complete';
            studentInfoBadge.className = 'completion-badge complete';
        } else if (studentInfoPartial) {
            const completed = Object.values(this.state.studentInfo).filter(val => val && val.length > 0).length;
            studentInfoBadge.textContent = `${completed}/5`;
            studentInfoBadge.className = 'completion-badge partial';
        } else {
            studentInfoBadge.textContent = '';
            studentInfoBadge.className = 'completion-badge';
        }

        // See It badge
        const seeItBadge = document.getElementById('see-it-badge');
        const seeItComplete =
            this.state.seeIt.distanceAcuity &&
            this.state.seeIt.nearAcuity &&
            this.state.seeIt.contrastSensitivity &&
            this.state.seeIt.lightSensitivity.length > 0;

        const seeItPartial =
            !seeItComplete &&
            (this.state.seeIt.distanceAcuity ||
             this.state.seeIt.nearAcuity ||
             this.state.seeIt.contrastSensitivity ||
             this.state.seeIt.lightSensitivity.length > 0);

        if (seeItComplete) {
            seeItBadge.textContent = 'Complete';
            seeItBadge.className = 'completion-badge complete';
        } else if (seeItPartial) {
            let completed = 0;
            if (this.state.seeIt.distanceAcuity) completed++;
            if (this.state.seeIt.nearAcuity) completed++;
            if (this.state.seeIt.contrastSensitivity) completed++;
            if (this.state.seeIt.lightSensitivity.length > 0) completed++;
            seeItBadge.textContent = `${completed}/4`;
            seeItBadge.className = 'completion-badge partial';
        } else {
            seeItBadge.textContent = '';
            seeItBadge.className = 'completion-badge';
        }
    }

    showError(message) {
        // Simple error display for Phase 1
        console.error(message);
        alert(message);
    }
}

// ===================================
// INITIALIZE APP
// ===================================

let assessmentManager;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Ocular Vision Assessment - Initializing...');

    // Set default assessment date to today
    document.getElementById('assessment-date').value = new Date().toISOString().split('T')[0];

    // Initialize Assessment Manager
    assessmentManager = new AssessmentManager();
    await assessmentManager.init();

    console.log('Application ready!');
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId + '-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Add click handlers to navigation items
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            scrollToSection(section);

            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
});
