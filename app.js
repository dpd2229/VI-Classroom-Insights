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

// ===================================
// READING TEST MANAGER
// ===================================

class ReadingTestManager {
    constructor() {
        this.passages = {
            passage1: {
                title: 'The Forest Adventure',
                ageRange: '7-9',
                text: `Once upon a time, there was a brave young explorer named Maya. She loved to explore the forest near her home. One sunny morning, Maya decided to follow a path she had never taken before.

As she walked deeper into the forest, she noticed something shiny on the ground. It was a beautiful golden key! Maya picked it up and wondered what it might unlock. She kept walking and soon found a small wooden door at the base of a large oak tree.

Maya tried the golden key in the lock, and it fit perfectly! The door opened to reveal a magical garden filled with colorful flowers and singing birds. In the center of the garden stood a friendly unicorn who smiled at Maya and said, "Thank you for finding my key. You are welcome to visit my garden anytime!"

Maya spent the whole afternoon playing in the magical garden. When it was time to go home, the unicorn gave her a special flower that would never wilt. Maya promised to return soon and skipped happily home to tell her family about her amazing adventure.`,
                questions: [
                    {
                        question: "What is the main character's name?",
                        answers: ['Maya', 'Maria', 'Mia', 'Molly'],
                        correct: 0
                    },
                    {
                        question: 'What did Maya find on the ground?',
                        answers: ['A silver coin', 'A golden key', 'A magic wand', 'A treasure map'],
                        correct: 1
                    },
                    {
                        question: 'Where was the wooden door located?',
                        answers: ['In a cave', 'At the base of an oak tree', 'Behind a waterfall', 'On a hill'],
                        correct: 1
                    },
                    {
                        question: 'What creature did Maya meet in the garden?',
                        answers: ['A fairy', 'A dragon', 'A unicorn', 'A phoenix'],
                        correct: 2
                    },
                    {
                        question: 'What gift did Maya receive?',
                        answers: ['A flower that never wilts', 'A golden crown', 'Magic seeds', 'A book of spells'],
                        correct: 0
                    }
                ]
            },
            passage2: {
                title: 'The Solar System',
                ageRange: '10-12',
                text: `The Solar System is made up of the Sun and all the objects that orbit around it, including eight planets, their moons, asteroids, comets, and dwarf planets. The Sun, which sits at the center, is a massive ball of hot gas that provides light and heat to all the planets.

The four planets closest to the Sun are called the inner planets: Mercury, Venus, Earth, and Mars. These planets are relatively small and have rocky surfaces. Mercury is the smallest and closest to the Sun, making it extremely hot during the day. Venus is the hottest planet due to its thick atmosphere that traps heat. Earth is the only planet known to support life, with its perfect distance from the Sun and abundance of water. Mars, often called the "Red Planet," has the largest volcano in the Solar System.

The outer planets are Jupiter, Saturn, Uranus, and Neptune. These gas giants are much larger than the inner planets and are made mostly of hydrogen and helium. Jupiter is the largest planet and has a famous storm called the Great Red Spot that has been raging for hundreds of years. Saturn is known for its beautiful rings made of ice and rock. Uranus rotates on its side, making it unique among the planets. Neptune, the farthest planet from the Sun, has the strongest winds in the Solar System.

Scientists continue to study the Solar System using telescopes, spacecraft, and rovers. These explorations help us understand more about how planets form, whether life exists elsewhere, and the history of our cosmic neighborhood.`,
                questions: [
                    {
                        question: 'How many planets are in our Solar System?',
                        answers: ['Seven', 'Eight', 'Nine', 'Ten'],
                        correct: 1
                    },
                    {
                        question: 'Which planet is known as the "Red Planet"?',
                        answers: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
                        correct: 2
                    },
                    {
                        question: 'What is Saturn known for?',
                        answers: ['Its Great Red Spot', 'Its beautiful rings', 'Rotating on its side', 'Having the strongest winds'],
                        correct: 1
                    },
                    {
                        question: 'Which planet is the hottest?',
                        answers: ['Mercury', 'Venus', 'Earth', 'Mars'],
                        correct: 1
                    },
                    {
                        question: 'What are the outer planets mostly made of?',
                        answers: ['Rock and metal', 'Ice and rock', 'Hydrogen and helium', 'Carbon dioxide'],
                        correct: 2
                    }
                ]
            },
            passage3: {
                title: 'The Industrial Revolution',
                ageRange: '13+',
                text: `The Industrial Revolution was a period of major industrialization and innovation that took place during the late 18th and early 19th centuries. Beginning in Great Britain around 1760, this transformative era fundamentally changed the way goods were produced and how people lived and worked. Before this period, most goods were made by hand in small workshops or at home. The Industrial Revolution introduced powered machinery, factories, and mass production.

Several key inventions drove this revolutionary change. The steam engine, perfected by James Watt in 1769, provided a reliable source of power for factories and transportation. The spinning jenny and power loom transformed textile manufacturing, allowing fabric to be produced much faster than by hand. New iron-making processes enabled the construction of stronger machines, bridges, and buildings. The development of railways and steamships revolutionized transportation, making it possible to move goods and people faster and more efficiently than ever before.

The Industrial Revolution had profound social and economic impacts. Cities grew rapidly as people moved from rural areas to work in factories, leading to urbanization on an unprecedented scale. Factory work created a new working class, often laboring in difficult conditions for long hours and low wages. Child labor was common, and workplace safety regulations were virtually nonexistent. However, the period also saw the rise of the middle class, increased standards of living for many, and the growth of trade unions that fought for workers' rights.

The environmental consequences of industrialization were significant. Factories produced pollution that contaminated air and water supplies. The burning of coal for power filled cities with smoke and smog. These issues eventually led to public health concerns and, much later, environmental movements. Despite its challenges, the Industrial Revolution laid the foundation for the modern world, establishing patterns of technological innovation, economic growth, and social change that continue to influence society today.`,
                questions: [
                    {
                        question: 'When did the Industrial Revolution begin?',
                        answers: ['Around 1660', 'Around 1760', 'Around 1860', 'Around 1960'],
                        correct: 1
                    },
                    {
                        question: 'Who perfected the steam engine?',
                        answers: ['Thomas Edison', 'George Stephenson', 'James Watt', 'Eli Whitney'],
                        correct: 2
                    },
                    {
                        question: 'What major social change occurred during this period?',
                        answers: ['Rapid urbanization', 'Return to farming', 'Decreased population', 'End of trade'],
                        correct: 0
                    },
                    {
                        question: 'Which industry was transformed by the spinning jenny and power loom?',
                        answers: ['Mining', 'Agriculture', 'Textile manufacturing', 'Transportation'],
                        correct: 2
                    },
                    {
                        question: 'What was a major environmental consequence of industrialization?',
                        answers: ['Deforestation only', 'Air and water pollution', 'Soil erosion', 'Ocean acidification'],
                        correct: 1
                    }
                ]
            }
        };

        this.currentTest = {
            type: '', // 'standard' or 'modified'
            passageId: '',
            startTime: null,
            endTime: null,
            readingTime: 0,
            wordCount: 0,
            answers: [],
            correctAnswers: 0
        };

        this.results = {
            standard: null,
            modified: null
        };

        this.timer = null;
        this.timerSeconds = 0;

        this.init();
    }

    init() {
        // Get elements
        this.passageSelect = document.getElementById('passage-select');
        this.textSizeSelect = document.getElementById('text-size');
        this.lineSpacingSelect = document.getElementById('line-spacing');
        this.textColorSelect = document.getElementById('text-color');

        this.startStandardBtn = document.getElementById('start-standard-test-btn');
        this.startModifiedBtn = document.getElementById('start-modified-test-btn');

        this.modal = document.getElementById('reading-test-modal');
        this.modalTitle = document.getElementById('modal-test-title');
        this.modalTimer = document.getElementById('modal-timer');
        this.passageContainer = document.getElementById('reading-passage-container');
        this.finishTestBtn = document.getElementById('finish-test-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');

        this.questionsModal = document.getElementById('questions-modal');
        this.questionsContainer = document.getElementById('questions-container');
        this.submitAnswersBtn = document.getElementById('submit-questions-btn');

        // Setup event listeners
        this.startStandardBtn.addEventListener('click', () => this.startTest('standard'));
        this.startModifiedBtn.addEventListener('click', () => this.startTest('modified'));
        this.finishTestBtn.addEventListener('click', () => this.finishReading());
        this.closeModalBtn.addEventListener('click', () => this.closeTest());
        this.submitAnswersBtn.addEventListener('click', () => this.submitAnswers());

        console.log('Reading Test Manager initialized');
    }

    startTest(type) {
        const passageId = this.passageSelect.value;
        const passage = this.passages[passageId];

        if (!passage) {
            alert('Please select a valid passage');
            return;
        }

        // Reset current test
        this.currentTest = {
            type: type,
            passageId: passageId,
            startTime: Date.now(),
            endTime: null,
            readingTime: 0,
            wordCount: passage.text.trim().split(/\s+/).length,
            answers: [],
            correctAnswers: 0
        };

        // Reset timer
        this.timerSeconds = 0;

        // Update modal title
        this.modalTitle.textContent = `${passage.title} (${type === 'standard' ? 'Standard' : 'Modified'} Text)`;

        // Setup passage container
        this.passageContainer.className = 'reading-passage';
        this.passageContainer.innerHTML = '';

        if (type === 'modified') {
            // Apply modified settings
            const fontSize = this.textSizeSelect.value;
            const lineSpacing = this.lineSpacingSelect.value;
            const colorScheme = this.textColorSelect.value;

            this.passageContainer.classList.add('modified');
            this.passageContainer.style.fontSize = `${fontSize}pt`;
            this.passageContainer.style.lineHeight = lineSpacing;

            // Apply color scheme
            if (colorScheme !== 'default') {
                this.passageContainer.classList.add(`color-${colorScheme}`);
            }
        }

        // Add passage text with paragraphs
        const paragraphs = passage.text.trim().split('\n\n');
        paragraphs.forEach(para => {
            const p = document.createElement('p');
            p.textContent = para;
            this.passageContainer.appendChild(p);
        });

        // Show modal
        this.modal.classList.remove('hidden');

        // Start timer
        this.startTimer();

        console.log(`Started ${type} reading test for ${passageId}`);
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timerSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        this.modalTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    finishReading() {
        // Stop timer
        this.stopTimer();
        this.currentTest.endTime = Date.now();
        this.currentTest.readingTime = Math.round((this.currentTest.endTime - this.currentTest.startTime) / 1000);

        // Hide reading modal
        this.modal.classList.add('hidden');

        // Show comprehension questions
        this.showComprehensionQuestions();
    }

    closeTest() {
        this.stopTimer();
        this.modal.classList.add('hidden');
        this.questionsModal.classList.add('hidden');
        this.currentTest = {
            type: '',
            passageId: '',
            startTime: null,
            endTime: null,
            readingTime: 0,
            wordCount: 0,
            answers: [],
            correctAnswers: 0
        };
    }

    showComprehensionQuestions() {
        const passage = this.passages[this.currentTest.passageId];

        // Clear previous questions
        this.questionsContainer.innerHTML = '';

        // Create question elements
        passage.questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.dataset.questionIndex = index;

            const questionTitle = document.createElement('h4');
            questionTitle.className = 'question-title';
            questionTitle.textContent = `Question ${index + 1}: ${q.question}`;
            questionDiv.appendChild(questionTitle);

            const answersDiv = document.createElement('div');
            answersDiv.className = 'question-answers';

            q.answers.forEach((answer, answerIndex) => {
                const label = document.createElement('label');
                label.className = 'answer-option';

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question-${index}`;
                radio.value = answerIndex;

                const span = document.createElement('span');
                span.textContent = answer;

                label.appendChild(radio);
                label.appendChild(span);
                answersDiv.appendChild(label);
            });

            questionDiv.appendChild(answersDiv);
            this.questionsContainer.appendChild(questionDiv);
        });

        // Show modal
        this.questionsModal.classList.remove('hidden');
    }

    submitAnswers() {
        const passage = this.passages[this.currentTest.passageId];

        // Collect answers
        this.currentTest.answers = [];
        let allAnswered = true;

        passage.questions.forEach((q, index) => {
            const selected = document.querySelector(`input[name="question-${index}"]:checked`);
            if (selected) {
                const answerIndex = parseInt(selected.value);
                this.currentTest.answers.push(answerIndex);
                if (answerIndex === q.correct) {
                    this.currentTest.correctAnswers++;
                }
            } else {
                allAnswered = false;
            }
        });

        if (!allAnswered) {
            alert('Please answer all questions before submitting.');
            return;
        }

        // Hide questions modal
        this.questionsModal.classList.add('hidden');

        // Calculate results
        this.calculateResults();

        // Display results
        this.displayResults();

        console.log(`Test completed: ${this.currentTest.type}`, this.currentTest);
    }

    calculateResults() {
        const wpm = Math.round((this.currentTest.wordCount / this.currentTest.readingTime) * 60);
        const accuracy = Math.round((this.currentTest.correctAnswers / this.passages[this.currentTest.passageId].questions.length) * 100);
        const errors = this.passages[this.currentTest.passageId].questions.length - this.currentTest.correctAnswers;

        const result = {
            time: this.currentTest.readingTime,
            wpm: wpm,
            errors: errors,
            accuracy: accuracy
        };

        // Store result
        if (this.currentTest.type === 'standard') {
            this.results.standard = result;
        } else {
            this.results.modified = result;
        }
    }

    displayResults() {
        // Display standard results
        if (this.results.standard) {
            const minutes = Math.floor(this.results.standard.time / 60);
            const seconds = this.results.standard.time % 60;
            document.getElementById('standard-time').textContent = `${minutes}m ${seconds}s`;
            document.getElementById('standard-wpm').textContent = this.results.standard.wpm;
            document.getElementById('standard-errors').textContent = this.results.standard.errors;
            document.getElementById('standard-accuracy').textContent = `${this.results.standard.accuracy}%`;
        }

        // Display modified results
        if (this.results.modified) {
            const minutes = Math.floor(this.results.modified.time / 60);
            const seconds = this.results.modified.time % 60;
            document.getElementById('modified-time').textContent = `${minutes}m ${seconds}s`;
            document.getElementById('modified-wpm').textContent = this.results.modified.wpm;
            document.getElementById('modified-errors').textContent = this.results.modified.errors;
            document.getElementById('modified-accuracy').textContent = `${this.results.modified.accuracy}%`;
        }

        // Display comparison if both tests completed
        if (this.results.standard && this.results.modified) {
            const timeDiff = this.results.standard.time - this.results.modified.time;
            const wpmDiff = this.results.modified.wpm - this.results.standard.wpm;
            const errorDiff = this.results.standard.errors - this.results.modified.errors;
            const accuracyDiff = this.results.modified.accuracy - this.results.standard.accuracy;

            document.getElementById('comparison-time').textContent =
                timeDiff > 0 ? `${timeDiff}s faster` : timeDiff < 0 ? `${Math.abs(timeDiff)}s slower` : 'Same';

            document.getElementById('comparison-wpm').textContent =
                wpmDiff > 0 ? `+${wpmDiff} WPM` : wpmDiff < 0 ? `${wpmDiff} WPM` : 'Same';

            document.getElementById('comparison-errors').textContent =
                errorDiff > 0 ? `${errorDiff} fewer` : errorDiff < 0 ? `${Math.abs(errorDiff)} more` : 'Same';

            document.getElementById('comparison-accuracy').textContent =
                accuracyDiff > 0 ? `+${accuracyDiff}%` : accuracyDiff < 0 ? `${accuracyDiff}%` : 'Same';
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }
}

// Initialize Reading Test Manager after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const readingTestManager = new ReadingTestManager();
    window.readingTestManager = readingTestManager;
});
