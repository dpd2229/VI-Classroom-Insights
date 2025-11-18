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
                lightSensitivityNotes: '',
                additionalNotes: ''
            },
            findIt: {
                visualFields: '',
                visualFieldsNotes: '',
                scanningPattern: '',
                scanningPatternNotes: '',
                tracking: '',
                trackingNotes: '',
                readingPosition: '',
                readingPositionNotes: '',
                additionalNotes: ''
            },
            useIt: {
                colorVision: '',
                colorVisionNotes: '',
                functionalVision: [],
                functionalVisionNotes: '',
                environmental: [],
                environmentalNotes: '',
                additionalNotes: ''
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
        document.getElementById('see-it-notes').value = this.state.seeIt.additionalNotes || '';

        // Find It section
        document.getElementById('visual-fields').value = this.state.findIt.visualFields || '';
        document.querySelector('[name="visualFieldsNotes"]').value = this.state.findIt.visualFieldsNotes || '';

        document.getElementById('scanning-pattern').value = this.state.findIt.scanningPattern || '';
        document.querySelector('[name="scanningPatternNotes"]').value = this.state.findIt.scanningPatternNotes || '';

        document.getElementById('tracking').value = this.state.findIt.tracking || '';
        document.querySelector('[name="trackingNotes"]').value = this.state.findIt.trackingNotes || '';

        document.getElementById('reading-position').value = this.state.findIt.readingPosition || '';
        document.querySelector('[name="readingPositionNotes"]').value = this.state.findIt.readingPositionNotes || '';
        document.getElementById('find-it-notes').value = this.state.findIt.additionalNotes || '';

        // Use It section
        document.getElementById('color-vision').value = this.state.useIt.colorVision || '';
        document.querySelector('[name="colorVisionNotes"]').value = this.state.useIt.colorVisionNotes || '';

        // Functional vision checkboxes
        document.querySelectorAll('[name="functionalVision"]').forEach(checkbox => {
            checkbox.checked = this.state.useIt.functionalVision.includes(checkbox.value);
        });
        document.querySelector('[name="functionalVisionNotes"]').value = this.state.useIt.functionalVisionNotes || '';

        // Environmental checkboxes
        document.querySelectorAll('[name="environmental"]').forEach(checkbox => {
            checkbox.checked = this.state.useIt.environmental.includes(checkbox.value);
        });
        document.querySelector('[name="environmentalNotes"]').value = this.state.useIt.environmentalNotes || '';
        document.getElementById('use-it-notes').value = this.state.useIt.additionalNotes || '';
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

        document.getElementById('see-it-notes').addEventListener('input', (e) => {
            this.state.seeIt.additionalNotes = e.target.value;
            this.debouncedSave();
        });

        // FIND IT section listeners
        document.getElementById('visual-fields').addEventListener('change', (e) => {
            this.state.findIt.visualFields = e.target.value;
            this.debouncedSave();
            this.updateCheckIndicators();
            this.updateProgress();
        });

        document.querySelector('[name="visualFieldsNotes"]').addEventListener('input', (e) => {
            this.state.findIt.visualFieldsNotes = e.target.value;
            this.debouncedSave();
        });

        document.getElementById('scanning-pattern').addEventListener('change', (e) => {
            this.state.findIt.scanningPattern = e.target.value;
            this.debouncedSave();
            this.updateCheckIndicators();
            this.updateProgress();
        });

        document.querySelector('[name="scanningPatternNotes"]').addEventListener('input', (e) => {
            this.state.findIt.scanningPatternNotes = e.target.value;
            this.debouncedSave();
        });

        document.getElementById('tracking').addEventListener('change', (e) => {
            this.state.findIt.tracking = e.target.value;
            this.debouncedSave();
            this.updateCheckIndicators();
            this.updateProgress();
        });

        document.querySelector('[name="trackingNotes"]').addEventListener('input', (e) => {
            this.state.findIt.trackingNotes = e.target.value;
            this.debouncedSave();
        });

        document.getElementById('reading-position').addEventListener('change', (e) => {
            this.state.findIt.readingPosition = e.target.value;
            this.debouncedSave();
            this.updateCheckIndicators();
            this.updateProgress();
        });

        document.querySelector('[name="readingPositionNotes"]').addEventListener('input', (e) => {
            this.state.findIt.readingPositionNotes = e.target.value;
            this.debouncedSave();
        });

        document.getElementById('find-it-notes').addEventListener('input', (e) => {
            this.state.findIt.additionalNotes = e.target.value;
            this.debouncedSave();
        });

        // USE IT section listeners
        document.getElementById('color-vision').addEventListener('change', (e) => {
            this.state.useIt.colorVision = e.target.value;
            this.debouncedSave();
            this.updateCheckIndicators();
            this.updateProgress();
        });

        document.querySelector('[name="colorVisionNotes"]').addEventListener('input', (e) => {
            this.state.useIt.colorVisionNotes = e.target.value;
            this.debouncedSave();
        });

        // Functional vision checkboxes
        document.querySelectorAll('[name="functionalVision"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.state.useIt.functionalVision.push(e.target.value);
                } else {
                    this.state.useIt.functionalVision = this.state.useIt.functionalVision.filter(
                        val => val !== e.target.value
                    );
                }
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
            });
        });

        document.querySelector('[name="functionalVisionNotes"]').addEventListener('input', (e) => {
            this.state.useIt.functionalVisionNotes = e.target.value;
            this.debouncedSave();
        });

        // Environmental checkboxes
        document.querySelectorAll('[name="environmental"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.state.useIt.environmental.push(e.target.value);
                } else {
                    this.state.useIt.environmental = this.state.useIt.environmental.filter(
                        val => val !== e.target.value
                    );
                }
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
            });
        });

        document.querySelector('[name="environmentalNotes"]').addEventListener('input', (e) => {
            this.state.useIt.environmentalNotes = e.target.value;
            this.debouncedSave();
        });

        document.getElementById('use-it-notes').addEventListener('input', (e) => {
            this.state.useIt.additionalNotes = e.target.value;
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

        // Update bottom nav completion indicators
        if (typeof updateBottomNavActive === 'function') {
            updateBottomNavActive();
        }
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

        // Check Find It completion
        const findItComplete =
            this.state.findIt.visualFields &&
            this.state.findIt.scanningPattern &&
            this.state.findIt.tracking &&
            this.state.findIt.readingPosition;

        const findItProgress = document.getElementById('progress-find-it');
        if (findItComplete) {
            findItProgress.classList.add('complete');
            findItProgress.classList.remove('in-progress');
        } else if (
            this.state.findIt.visualFields ||
            this.state.findIt.scanningPattern ||
            this.state.findIt.tracking ||
            this.state.findIt.readingPosition
        ) {
            findItProgress.classList.add('in-progress');
            findItProgress.classList.remove('complete');
        }

        // Check Use It completion
        const useItComplete =
            this.state.useIt.colorVision &&
            (this.state.useIt.functionalVision.length > 0 || this.state.useIt.environmental.length > 0);

        const useItProgress = document.getElementById('progress-use-it');
        if (useItComplete) {
            useItProgress.classList.add('complete');
            useItProgress.classList.remove('in-progress');
        } else if (
            this.state.useIt.colorVision ||
            this.state.useIt.functionalVision.length > 0 ||
            this.state.useIt.environmental.length > 0
        ) {
            useItProgress.classList.add('in-progress');
            useItProgress.classList.remove('complete');
        }

        // Update navigation
        this.updateNavigation();

        // Update generate report button
        const generateBtn = document.getElementById('generate-report-btn');
        if (studentInfoComplete && seeItComplete && findItComplete && useItComplete) {
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

        // Update Find It nav item
        const findItNav = document.querySelector('[data-section="find-it"]');
        const findItComplete =
            this.state.findIt.visualFields &&
            this.state.findIt.scanningPattern &&
            this.state.findIt.tracking &&
            this.state.findIt.readingPosition;

        if (findItComplete) {
            findItNav.classList.add('completed');
        } else {
            findItNav.classList.remove('completed');
        }

        // Update Use It nav item
        const useItNav = document.querySelector('[data-section="use-it"]');
        const useItComplete =
            this.state.useIt.colorVision &&
            (this.state.useIt.functionalVision.length > 0 || this.state.useIt.environmental.length > 0);

        if (useItComplete) {
            useItNav.classList.add('completed');
        } else {
            useItNav.classList.remove('completed');
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

        // FIND IT Check Indicators
        const visualFieldsCheck = document.getElementById('visual-fields-check');
        if (this.state.findIt.visualFields) {
            visualFieldsCheck.classList.add('complete');
        } else {
            visualFieldsCheck.classList.remove('complete');
        }

        const scanningPatternCheck = document.getElementById('scanning-pattern-check');
        if (this.state.findIt.scanningPattern) {
            scanningPatternCheck.classList.add('complete');
        } else {
            scanningPatternCheck.classList.remove('complete');
        }

        const trackingCheck = document.getElementById('tracking-check');
        if (this.state.findIt.tracking) {
            trackingCheck.classList.add('complete');
        } else {
            trackingCheck.classList.remove('complete');
        }

        const readingPositionCheck = document.getElementById('reading-position-check');
        if (this.state.findIt.readingPosition) {
            readingPositionCheck.classList.add('complete');
        } else {
            readingPositionCheck.classList.remove('complete');
        }

        // USE IT Check Indicators
        const colorVisionCheck = document.getElementById('color-vision-check');
        if (this.state.useIt.colorVision) {
            colorVisionCheck.classList.add('complete');
        } else {
            colorVisionCheck.classList.remove('complete');
        }

        const functionalVisionCheck = document.getElementById('functional-vision-check');
        if (this.state.useIt.functionalVision.length > 0) {
            functionalVisionCheck.classList.add('complete');
        } else {
            functionalVisionCheck.classList.remove('complete');
        }

        const environmentalCheck = document.getElementById('environmental-check');
        if (this.state.useIt.environmental.length > 0) {
            environmentalCheck.classList.add('complete');
        } else {
            environmentalCheck.classList.remove('complete');
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

        // Find It badge
        const findItBadge = document.getElementById('find-it-badge');
        const findItComplete =
            this.state.findIt.visualFields &&
            this.state.findIt.scanningPattern &&
            this.state.findIt.tracking &&
            this.state.findIt.readingPosition;

        const findItPartial =
            !findItComplete &&
            (this.state.findIt.visualFields ||
             this.state.findIt.scanningPattern ||
             this.state.findIt.tracking ||
             this.state.findIt.readingPosition);

        if (findItComplete) {
            findItBadge.textContent = 'Complete';
            findItBadge.className = 'completion-badge complete';
        } else if (findItPartial) {
            let completed = 0;
            if (this.state.findIt.visualFields) completed++;
            if (this.state.findIt.scanningPattern) completed++;
            if (this.state.findIt.tracking) completed++;
            if (this.state.findIt.readingPosition) completed++;
            findItBadge.textContent = `${completed}/4`;
            findItBadge.className = 'completion-badge partial';
        } else {
            findItBadge.textContent = '';
            findItBadge.className = 'completion-badge';
        }

        // Use It badge
        const useItBadge = document.getElementById('use-it-badge');
        const useItComplete =
            this.state.useIt.colorVision &&
            (this.state.useIt.functionalVision.length > 0 || this.state.useIt.environmental.length > 0);

        const useItPartial =
            !useItComplete &&
            (this.state.useIt.colorVision ||
             this.state.useIt.functionalVision.length > 0 ||
             this.state.useIt.environmental.length > 0);

        if (useItComplete) {
            useItBadge.textContent = 'Complete';
            useItBadge.className = 'completion-badge complete';
        } else if (useItPartial) {
            let completed = 0;
            if (this.state.useIt.colorVision) completed++;
            if (this.state.useIt.functionalVision.length > 0) completed++;
            if (this.state.useIt.environmental.length > 0) completed++;
            useItBadge.textContent = `${completed}/3`;
            useItBadge.className = 'completion-badge partial';
        } else {
            useItBadge.textContent = '';
            useItBadge.className = 'completion-badge';
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
    window.assessmentManager = assessmentManager; // Make globally accessible for bottom nav
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

    // Bottom navigation click handlers
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.scrollTo;
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                // Scroll to section with offset for fixed nav
                const yOffset = -80; // Offset for top nav
                const y = targetSection.getBoundingClientRect().top + window.pageYOffset + yOffset;

                window.scrollTo({
                    top: y,
                    behavior: 'smooth'
                });

                // Update active state
                updateBottomNavActive();
            }
        });
    });

    // Update bottom nav active state on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateBottomNavActive, 100);
    });

    // Initial update
    updateBottomNavActive();
});

// Update bottom navigation active state based on scroll position
function updateBottomNavActive() {
    const sections = [
        'student-info-section',
        'see-it-section',
        'find-it-section',
        'use-it-section',
        'reading-test-section'
    ];

    let currentSection = '';
    const scrollPosition = window.scrollY + 200; // Offset for better detection

    // Find which section is currently in view
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSection = sectionId;
            }
        }
    });

    // Update active state on bottom nav buttons
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        if (btn.dataset.scrollTo === currentSection) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Add completed class to buttons based on assessment state
    if (window.assessmentManager && window.assessmentManager.state) {
        const state = window.assessmentManager.state;

        // Student Info
        const studentInfoComplete = state.studentInfo.studentName &&
                                   state.studentInfo.dateOfBirth &&
                                   state.studentInfo.yearGroup &&
                                   state.studentInfo.assessmentDate &&
                                   state.studentInfo.assessedBy;
        const studentInfoBtn = document.querySelector('[data-scroll-to="student-info-section"]');
        if (studentInfoBtn) {
            studentInfoBtn.classList.toggle('completed', studentInfoComplete);
        }

        // See It
        const seeItComplete = state.seeIt.distanceAcuity &&
                             state.seeIt.nearAcuity &&
                             state.seeIt.contrastSensitivity &&
                             state.seeIt.lightSensitivity.length > 0;
        const seeItBtn = document.querySelector('[data-scroll-to="see-it-section"]');
        if (seeItBtn) {
            seeItBtn.classList.toggle('completed', seeItComplete);
        }

        // Find It
        const findItComplete = state.findIt.visualFields &&
                              state.findIt.scanningPattern &&
                              state.findIt.tracking &&
                              state.findIt.readingPosition;
        const findItBtn = document.querySelector('[data-scroll-to="find-it-section"]');
        if (findItBtn) {
            findItBtn.classList.toggle('completed', findItComplete);
        }

        // Use It
        const useItComplete = state.useIt.colorVision &&
                             (state.useIt.functionalVision.length > 0 || state.useIt.environmental.length > 0);
        const useItBtn = document.querySelector('[data-scroll-to="use-it-section"]');
        if (useItBtn) {
            useItBtn.classList.toggle('completed', useItComplete);
        }
    }
}
