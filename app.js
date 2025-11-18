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
// RECOMMENDATION ENGINE
// ===================================

class RecommendationEngine {
    constructor() {
        this.recommendations = {
            // DISTANCE ACUITY RECOMMENDATIONS
            distanceAcuity: {
                '6/6': {
                    interpretation: 'The pupil has typical distance vision, able to see at 6 metres what is normally visible at that distance.',
                    implications: 'No significant impact on distance viewing tasks.',
                    strategies: []
                },
                '6/9': {
                    interpretation: 'The pupil has mildly reduced distance vision, able to see at 6 metres what is typically visible at 9 metres.',
                    implications: 'May experience slight difficulty with board work, recognising faces across the room, or viewing demonstrations from a distance.',
                    strategies: [
                        'Consider preferential seating in the front third of the classroom',
                        'Ensure clear, high-contrast presentations on interactive whiteboards',
                        'Provide enlarged handouts (minimum 14-16pt font) for board work',
                        'Use technology: share screen content via iPad or tablet for closer viewing',
                        'Consider digital copies of board work sent to pupil\'s device'
                    ]
                },
                '6/12': {
                    interpretation: 'The pupil has moderately reduced distance vision, able to see at 6 metres what is typically visible at 12 metres.',
                    implications: 'Will experience noticeable difficulty with board work, facial recognition at distance, and participating in whole-class demonstrations.',
                    strategies: [
                        'Preferential seating in the front row is essential',
                        'Provide all board content in digital format sent to pupil\'s iPad/tablet',
                        'Use screen mirroring technology (Apple AirPlay, Google Cast) for real-time access',
                        'Enlarge print materials to 18-24pt font size',
                        'Pre-provide lesson materials electronically to allow for preview',
                        'Consider use of monocular telescope for occasional distance viewing',
                        'Ensure good contrast on all visual materials (black text on white/cream background)'
                    ]
                },
                '6/19': {
                    interpretation: 'The pupil has significantly reduced distance vision, able to see at 6 metres what is typically visible at 19 metres.',
                    implications: 'Substantial difficulty accessing visual information at distance. Board work, demonstrations, and environmental navigation affected.',
                    strategies: [
                        'Seated at the front of the classroom with clear sightline to displays',
                        'Mandatory provision of all visual content in alternative formats',
                        'Use iPad with screen sharing for all board work and presentations',
                        'Access to digital textbooks and eBooks with adjustable font sizes',
                        'Enlarge all print to minimum 24-32pt, consider bold fonts',
                        'Provide advance copies of PowerPoints and visual materials',
                        'Train pupil in use of screen magnification apps (Zoom on iPad, Magnifier)',
                        'Consider electronic note-taking to reduce copying from board',
                        'Use of monocular telescope for specific distance tasks',
                        'High contrast materials essential (avoid pastel colours, ensure dark text on light backgrounds)',
                        'Allow extra time for accessing visual information',
                        'Ensure all diagrams and images are described verbally or provided with text descriptions'
                    ]
                },
                '6/24': {
                    interpretation: 'The pupil has severely reduced distance vision, able to see at 6 metres what is typically visible at 24 metres.',
                    implications: 'Severely impacted distance vision affecting all distance viewing tasks. Accessing curriculum materials requires substantial adaptation.',
                    strategies: [
                        'Front row seating mandatory with unobstructed views',
                        'All visual information must be provided in accessible format',
                        'iPad with screen mirroring essential classroom tool',
                        'Large print textbooks (24-36pt minimum) or digital alternatives',
                        'Access to magnification software on classroom computer/iPad',
                        'Electronic whiteboards with ability to save and share content',
                        'Pre-teaching of visual content where possible',
                        'Reduce copying tasks - provide pre-prepared materials',
                        'Use of portable CCTV/electronic magnifier for detail work',
                        'Training in touch-typing for efficient note-taking',
                        'Monocular telescope with training for specific tasks',
                        'Maximum contrast on all materials (avoid grey, pastels)',
                        'Verbal descriptions of all visual information',
                        'Consider audio books alongside print/digital texts',
                        'Extra time for processing visual information',
                        'Regular breaks during visually intensive tasks'
                    ]
                },
                '6/36': {
                    interpretation: 'The pupil has very severely reduced distance vision, able to see at 6 metres what is typically visible at 36 metres.',
                    implications: 'Extreme difficulty with distance vision. Standard classroom displays largely inaccessible without significant technological support.',
                    strategies: [
                        'Comprehensive assessment and specialist teaching required',
                        'iPad with screen sharing for all visual content mandatory',
                        'High-powered magnification technology essential',
                        'Likely to require Braille or large print (36pt+) materials',
                        'Electronic magnification (CCTV) for most classroom tasks',
                        'Access to screen reading software for independence',
                        'Consider tactile/3D models for visual concepts',
                        'Auditory support crucial - audio descriptions, text-to-speech',
                        'Eliminate board copying - provide all materials digitally or in accessible formats',
                        'Training in assistive technology essential',
                        'Environmental adaptations for safety (lighting, contrast marking)',
                        'Consider assessment via technology rather than paper-based',
                        'Collaborative technology (OneNote, Google Classroom) for shared access',
                        'Regular QTVI involvement for curriculum access planning'
                    ]
                },
                '6/60': {
                    interpretation: 'The pupil has profoundly reduced distance vision, able to see at 6 metres what is typically visible at 60 metres. Approaching the threshold for severe sight impairment registration.',
                    implications: 'Distance vision provides minimal functional information. Accessing visual curriculum requires comprehensive adaptations.',
                    strategies: [
                        'Specialist QTVI and mobility officer involvement essential',
                        'Technology-based access for all visual materials',
                        'Likely dual-media learner (print and Braille)',
                        'High-powered electronic magnification (video magnifier/CCTV)',
                        'Screen reading technology (JAWS, NVDA, VoiceOver)',
                        'Touch-typing and accessible keyboard skills training',
                        'Audio textbooks and digital accessible formats',
                        'Tactile graphics and 3D models for diagrams',
                        'Comprehensive environmental adaptations',
                        'Mobility and orientation assessment',
                        'Assessment accommodations (extra time, scribe, reader)',
                        'Peer support for visual tasks',
                        'Focus on developing independent living skills alongside curriculum',
                        'Regular review of access methods as vision changes'
                    ]
                }
            },

            // CONTRAST SENSITIVITY RECOMMENDATIONS
            contrastSensitivity: {
                'Good': {
                    interpretation: 'The pupil demonstrates good contrast sensitivity.',
                    implications: 'Can distinguish subtle differences in shading and work effectively with standard materials.',
                    strategies: []
                },
                'Moderate': {
                    interpretation: 'The pupil has moderately reduced contrast sensitivity.',
                    implications: 'May struggle with low-contrast materials, pencil on white paper, or faded photocopies.',
                    strategies: [
                        'Use high-contrast materials (black on white, avoid grey)',
                        'Provide bold-lined paper for written work',
                        'Ensure high-quality photocopies (not faded or light)',
                        'Use felt-tip pens or dark pencils instead of standard graphite',
                        'Increase screen contrast on computers and tablets',
                        'Avoid glossy paper which can reduce contrast with glare',
                        'Use yellow or cream paper if white creates glare',
                        'Ensure good, even lighting without shadows'
                    ]
                },
                'Poor': {
                    interpretation: 'The pupil has significantly reduced contrast sensitivity.',
                    implications: 'Standard materials appear washed out or difficult to distinguish. Requires maximum contrast for all tasks.',
                    strategies: [
                        'Maximum contrast essential - use black marker on white/cream backgrounds',
                        'Bold-lined or raised-line paper for writing',
                        'Thick black pens (felt-tip/rollerball) not standard pencils',
                        'Digital materials with adjustable contrast settings',
                        'Use colour overlays or tinted paper if helpful (trial different colours)',
                        'Avoid worksheets with excessive visual clutter',
                        'High-contrast keyboards and screen settings',
                        'Ensure optimal lighting - not too bright (glare) or dim',
                        'Consider yellow-on-black or white-on-black for some tasks',
                        'Avoid shiny/glossy surfaces and laminated materials',
                        'Provide clear borders around text and images'
                    ]
                }
            },

            // VISUAL FIELDS RECOMMENDATIONS
            visualFields: {
                'Full fields': {
                    interpretation: 'The pupil has full visual fields with no restrictions.',
                    implications: 'Can access visual information across their full field of vision.',
                    strategies: []
                },
                'Peripheral field loss': {
                    interpretation: 'The pupil has reduced peripheral (side) vision, commonly described as "tunnel vision".',
                    implications: 'May miss information at the edges, bump into objects, or have difficulty with scanning and tracking.',
                    strategies: [
                        'Seated to maximise use of remaining field (e.g., if right field loss, sit on left)',
                        'Reduce visual clutter on page and in environment',
                        'Teach systematic scanning techniques (left to right, top to bottom)',
                        'Use margins and clear spacing to define work areas',
                        'Present information in central vision',
                        'Orientation and mobility assessment recommended',
                        'Consider bump dots or tactile markers for boundaries',
                        'Warn before approaching from affected side',
                        'Allow extra time for scanning and locating items'
                    ]
                },
                'Central field loss': {
                    interpretation: 'The pupil has reduced central vision, affecting their ability to see detail directly ahead.',
                    implications: 'Reading and detailed work significantly affected. May use peripheral vision for some tasks.',
                    strategies: [
                        'High magnification essential (may not be effective if large central scotoma)',
                        'Consider eccentric viewing training (using peripheral vision)',
                        'Audio support crucial - text-to-speech technology',
                        'Reduce reading demands or provide audio alternatives',
                        'Large print (assess optimal size - may be 36pt+)',
                        'Good lighting essential',
                        'Allow extended time for reading and detail work',
                        'Consider Braille assessment if vision deteriorating',
                        'Use colour and contrast to aid peripheral viewing'
                    ]
                },
                'Hemianopia (half field loss)': {
                    interpretation: 'The pupil has loss of half of the visual field in both eyes.',
                    implications: 'Significant impact on reading, scanning, and spatial awareness. May miss information on affected side.',
                    strategies: [
                        'Teach systematic scanning techniques',
                        'Use coloured margin or ruler on affected side as a guide',
                        'Position work to maximise use of intact field',
                        'Reduce page width for reading (portrait orientation)',
                        'Electronic reading aids can help with navigation',
                        'Orientation and mobility support essential',
                        'Seat to compensate for field loss',
                        'Warn before approaching from affected side',
                        'Use finger or guide to track during reading',
                        'Extra time for visual tasks'
                    ]
                }
            },

            // SCANNING PATTERN RECOMMENDATIONS
            scanningPattern: {
                'Systematic': {
                    interpretation: 'The pupil demonstrates efficient systematic scanning.',
                    implications: 'Can locate information effectively using organised visual search strategies.',
                    strategies: []
                },
                'Disorganised': {
                    interpretation: 'The pupil uses a disorganised scanning pattern.',
                    implications: 'May miss information, take longer to locate items, or lose place when reading.',
                    strategies: [
                        'Teach structured scanning techniques (left-right, top-bottom)',
                        'Use finger or reading ruler to track',
                        'Reduce visual clutter on worksheets',
                        'Present information in clear, organised layouts',
                        'Use visual prompts (arrows, numbers) to guide scanning',
                        'Practice scanning activities regularly',
                        'Use typoscope (reading window) to isolate text',
                        'Highlight or box key information',
                        'Allow extra time for locating information'
                    ]
                },
                'Slow': {
                    interpretation: 'The pupil demonstrates slow visual scanning.',
                    implications: 'Takes longer to locate information, affecting speed of work completion.',
                    strategies: [
                        'Reduce amount of visual information on page',
                        'Provide key information in predictable locations',
                        'Use clear headings and organisational structure',
                        'Allow extended time for visual search tasks',
                        'Pre-teach location of important information',
                        'Use colour coding to categorise information',
                        'Reduce copying tasks',
                        'Provide partially completed worksheets',
                        'Use technology to reduce visual search (searchable PDFs)'
                    ]
                }
            },

            // COLOUR VISION RECOMMENDATIONS
            colorVision: {
                'Normal colour vision': {
                    interpretation: 'The pupil has typical colour perception.',
                    implications: 'Can use colour for learning and differentiation without difficulty.',
                    strategies: []
                },
                'Red-green deficiency': {
                    interpretation: 'The pupil has difficulty distinguishing between red and green colours.',
                    implications: 'May confuse red/green on maps, graphs, or colour-coded materials. Affects approximately 8% of males.',
                    strategies: [
                        'Do not rely on colour alone to convey information',
                        'Use patterns, labels, or symbols alongside colour',
                        'Choose colour combinations carefully (blue/yellow works well)',
                        'Avoid red pen for corrections - use blue or purple',
                        'Label colour-coded materials',
                        'Provide colour name labels on art materials',
                        'Use shape or texture in addition to colour',
                        'Consider colour vision apps for identifying colours',
                        'Be aware in science (litmus, indicators) - describe colour verbally'
                    ]
                },
                'Blue-yellow deficiency': {
                    interpretation: 'The pupil has difficulty distinguishing between blue and yellow colours (less common).',
                    implications: 'May confuse blue/yellow and related colours.',
                    strategies: [
                        'Use red/green colour combinations',
                        'Label all colour-coded materials',
                        'Provide alternative methods to identify colours',
                        'Use patterns or textures alongside colour',
                        'Describe colours verbally in class discussions'
                    ]
                },
                'Monochromacy (no colour vision)': {
                    interpretation: 'The pupil cannot perceive colour, seeing the world in shades of grey.',
                    implications: 'Colour carries no information value. Often associated with reduced visual acuity and light sensitivity.',
                    strategies: [
                        'Never use colour alone to convey information',
                        'Label all materials with colour names',
                        'Use patterns, textures, and labels exclusively',
                        'Provide high contrast black and white materials',
                        'Address likely associated light sensitivity',
                        'Use tactile or verbal methods for colour identification',
                        'Ensure understanding that colour-based instructions are inaccessible',
                        'Technology: colour identifier apps can speak colour names'
                    ]
                }
            }
        };

        this.selectedRecommendations = new Set();
    }

    // Get recommendations for a specific assessment
    getRecommendations(assessmentType, value) {
        if (!value || value === 'Not assessed') return null;

        const recs = this.recommendations[assessmentType]?.[value];
        if (!recs || recs.strategies.length === 0) return null;

        return {
            ...recs,
            assessmentType,
            value,
            id: `${assessmentType}-${value.replace(/\s+/g, '-').replace(/\//g, '-')}`
        };
    }

    // Toggle a recommendation selection
    toggleRecommendation(id, selected) {
        if (selected) {
            this.selectedRecommendations.add(id);
        } else {
            this.selectedRecommendations.delete(id);
        }
    }

    // Get all selected recommendations
    getSelectedRecommendations() {
        return Array.from(this.selectedRecommendations);
    }

    // Clear all selections
    clearAll() {
        this.selectedRecommendations.clear();
    }

    // Select all visible recommendations
    selectAll(visibleIds) {
        visibleIds.forEach(id => this.selectedRecommendations.add(id));
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
        this.recommendationEngine = new RecommendationEngine();
        this.activeRecommendations = [];
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

        // Update recommendations based on loaded data
        this.updateRecommendations();
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
            this.updateRecommendations();
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
            this.updateRecommendations();
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
            this.updateRecommendations();
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
            this.updateRecommendations();
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
            this.updateRecommendations();
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

        // Generate Report button
        document.getElementById('generate-report-btn').addEventListener('click', () => {
            this.generatePDFReport();
        });

        // Setup recommendation panel listeners
        this.setupRecommendationListeners();
    }

    setupRecommendationListeners() {
        // Toggle recommendations panel
        const toggleBtn = document.getElementById('toggle-recommendations-btn');
        const panel = document.getElementById('recommendations-panel');
        const icon = document.getElementById('toggle-icon');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
                toggleBtn.setAttribute('aria-expanded', !isExpanded);
                panel.classList.toggle('collapsed');
                icon.textContent = isExpanded ? '▼' : '▲';
            });
        }

        // Select All button
        const selectAllBtn = document.getElementById('select-all-recommendations');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.activeRecommendations.forEach(rec => {
                    this.recommendationEngine.toggleRecommendation(rec.id, true);
                });
                this.updateRecommendationsUI();
            });
        }

        // Clear All button
        const clearAllBtn = document.getElementById('clear-all-recommendations');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.activeRecommendations.forEach(rec => {
                    this.recommendationEngine.toggleRecommendation(rec.id, false);
                });
                this.updateRecommendationsUI();
            });
        }
    }

    updateRecommendations() {
        // Gather recommendations based on current state
        const recommendations = [];

        // Distance Acuity (from seeIt section)
        if (this.state.seeIt.distanceAcuity && this.state.seeIt.distanceAcuity !== 'Not assessed') {
            const rec = this.recommendationEngine.getRecommendations('distanceAcuity', this.state.seeIt.distanceAcuity);
            if (rec) recommendations.push(rec);
        }

        // Contrast Sensitivity (from seeIt section)
        if (this.state.seeIt.contrastSensitivity && this.state.seeIt.contrastSensitivity !== 'Not assessed') {
            const rec = this.recommendationEngine.getRecommendations('contrastSensitivity', this.state.seeIt.contrastSensitivity);
            if (rec) recommendations.push(rec);
        }

        // Visual Fields (from findIt section)
        if (this.state.findIt.visualFields && this.state.findIt.visualFields !== 'Not assessed') {
            const rec = this.recommendationEngine.getRecommendations('visualFields', this.state.findIt.visualFields);
            if (rec) recommendations.push(rec);
        }

        // Scanning Pattern (from findIt section)
        if (this.state.findIt.scanningPattern && this.state.findIt.scanningPattern !== 'Not assessed') {
            const rec = this.recommendationEngine.getRecommendations('scanningPattern', this.state.findIt.scanningPattern);
            if (rec) recommendations.push(rec);
        }

        // Color Vision (from useIt section)
        if (this.state.useIt.colorVision && this.state.useIt.colorVision !== 'Not assessed') {
            const rec = this.recommendationEngine.getRecommendations('colorVision', this.state.useIt.colorVision);
            if (rec) recommendations.push(rec);
        }

        this.activeRecommendations = recommendations;
        this.updateRecommendationsUI();
    }

    updateRecommendationsUI() {
        const container = document.getElementById('recommendations-container');
        const placeholder = document.querySelector('.recommendations-panel .preview-placeholder');
        const actions = document.getElementById('recommendations-actions');

        if (!container) return;

        if (this.activeRecommendations.length === 0) {
            container.classList.add('hidden');
            actions.classList.add('hidden');
            placeholder.classList.remove('hidden');
            return;
        }

        placeholder.classList.add('hidden');
        container.classList.remove('hidden');
        actions.classList.remove('hidden');

        container.innerHTML = this.activeRecommendations.map(rec =>
            this.displayRecommendation(rec)
        ).join('');

        // Add checkbox event listeners
        container.querySelectorAll('.recommendation-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const recId = e.target.dataset.recId;
                this.recommendationEngine.toggleRecommendation(recId, e.target.checked);

                // Update visual state
                const item = e.target.closest('.recommendation-item');
                if (e.target.checked) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        });
    }

    displayRecommendation(rec) {
        const isSelected = this.recommendationEngine.selectedRecommendations.has(rec.id);
        const selectedClass = isSelected ? 'selected' : '';

        const strategiesList = rec.strategies
            .map(strategy => `<li>${strategy}</li>`)
            .join('');

        return `
            <div class="recommendation-item ${selectedClass}">
                <div class="recommendation-header">
                    <input
                        type="checkbox"
                        class="recommendation-checkbox"
                        data-rec-id="${rec.id}"
                        ${isSelected ? 'checked' : ''}
                        aria-label="Include this recommendation in report"
                    />
                    <div class="recommendation-title">${rec.value}</div>
                </div>
                <div class="recommendation-content">
                    <div class="recommendation-interpretation">
                        <strong>Interpretation:</strong> ${rec.interpretation}
                    </div>
                    <div class="recommendation-implications">
                        <strong>Implications:</strong> ${rec.implications}
                    </div>
                    <div class="recommendation-strategies">
                        <strong>Recommended Strategies:</strong>
                        <ul class="recommendation-strategies-list">
                            ${strategiesList}
                        </ul>
                    </div>
                </div>
            </div>
        `;
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
        const requirementsText = document.getElementById('report-requirements');

        if (studentInfoComplete && seeItComplete && findItComplete && useItComplete) {
            generateBtn.disabled = false;
            generateBtn.title = 'All sections complete - Click to generate report';
            if (requirementsText) {
                requirementsText.innerHTML = '<span style="color: var(--color-success);">✓ All sections complete!</span>';
            }
        } else {
            generateBtn.disabled = true;

            // Build list of incomplete sections
            const incomplete = [];
            if (!studentInfoComplete) incomplete.push('Student Info');
            if (!seeItComplete) incomplete.push('See It');
            if (!findItComplete) incomplete.push('Find It');
            if (!useItComplete) incomplete.push('Use It');

            const incompleteText = incomplete.join(', ');
            generateBtn.title = `Complete these sections first: ${incompleteText}`;

            if (requirementsText) {
                requirementsText.innerHTML = `<span style="color: var(--color-warning);">✗ Incomplete:</span> ${incompleteText}`;
            }
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

    generatePDFReport() {
        try {
            // Access jsPDF from window
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPos = margin;

            // Helper function to add new page if needed
            const checkPageBreak = (requiredSpace) => {
                if (yPos + requiredSpace > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                    return true;
                }
                return false;
            };

            // Helper function to add wrapped text
            const addWrappedText = (text, x, y, maxWidth, lineHeight = 6) => {
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, x, y);
                return lines.length * lineHeight;
            };

            // ===== HEADER =====
            doc.setFillColor(30, 64, 175); // Primary color
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text('VI Classroom Insights', margin, 20);

            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('Ocular Vision Assessment Report', margin, 30);

            doc.setTextColor(0, 0, 0);
            yPos = 50;

            // ===== STUDENT INFORMATION =====
            checkPageBreak(40);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Student Information', margin, yPos);
            yPos += 8;

            doc.setDrawColor(30, 64, 175);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);

            const studentInfo = [
                `Name: ${this.state.studentInfo.studentName || 'Not provided'}`,
                `Date of Birth: ${this.state.studentInfo.dateOfBirth || 'Not provided'}`,
                `Year Group: ${this.state.studentInfo.yearGroup || 'Not provided'}`,
                `Assessment Date: ${this.state.studentInfo.assessmentDate || 'Not provided'}`,
                `Assessed By: ${this.state.studentInfo.assessedBy || 'Not provided'}`
            ];

            studentInfo.forEach(info => {
                doc.text(info, margin, yPos);
                yPos += 6;
            });

            yPos += 8;

            // ===== SEE IT SECTION =====
            checkPageBreak(50);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('See It - Visual Acuity Assessment', margin, yPos);
            yPos += 8;

            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Distance Acuity:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.seeIt.distanceAcuity || 'Not assessed', margin + 40, yPos);
            yPos += 6;

            if (this.state.seeIt.distanceAcuityNotes) {
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(`Notes: ${this.state.seeIt.distanceAcuityNotes}`, margin + 5, yPos, contentWidth - 5);
                yPos += 2;
            }

            checkPageBreak(15);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Near Acuity:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.seeIt.nearAcuity || 'Not assessed', margin + 40, yPos);
            yPos += 6;

            if (this.state.seeIt.nearDistance) {
                doc.text(`Distance: ${this.state.seeIt.nearDistance}`, margin + 5, yPos);
                yPos += 6;
            }

            if (this.state.seeIt.nearAcuityNotes) {
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(`Notes: ${this.state.seeIt.nearAcuityNotes}`, margin + 5, yPos, contentWidth - 5);
                yPos += 2;
            }

            checkPageBreak(15);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Contrast Sensitivity:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.seeIt.contrastSensitivity || 'Not assessed', margin + 45, yPos);
            yPos += 6;

            if (this.state.seeIt.contrastSensitivityNotes) {
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(`Notes: ${this.state.seeIt.contrastSensitivityNotes}`, margin + 5, yPos, contentWidth - 5);
                yPos += 2;
            }

            checkPageBreak(15);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Light Sensitivity:', margin, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');

            if (this.state.seeIt.lightSensitivity.length > 0) {
                this.state.seeIt.lightSensitivity.forEach(item => {
                    checkPageBreak(8);
                    doc.text(`• ${item}`, margin + 5, yPos);
                    yPos += 5;
                });
            } else {
                doc.text('Not assessed', margin + 5, yPos);
                yPos += 6;
            }

            if (this.state.seeIt.lightSensitivityNotes) {
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(`Notes: ${this.state.seeIt.lightSensitivityNotes}`, margin + 5, yPos, contentWidth - 5);
                yPos += 2;
            }

            if (this.state.seeIt.additionalNotes) {
                checkPageBreak(15);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Additional Notes:', margin, yPos);
                yPos += 6;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(this.state.seeIt.additionalNotes, margin + 5, yPos, contentWidth - 5);
            }

            yPos += 10;

            // ===== FIND IT SECTION =====
            checkPageBreak(50);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Find It - Visual Field & Scanning', margin, yPos);
            yPos += 8;

            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            const findItAssessments = [
                { label: 'Visual Fields', value: this.state.findIt.visualFields, notes: this.state.findIt.visualFieldsNotes },
                { label: 'Scanning Pattern', value: this.state.findIt.scanningPattern, notes: this.state.findIt.scanningPatternNotes },
                { label: 'Tracking', value: this.state.findIt.tracking, notes: this.state.findIt.trackingNotes },
                { label: 'Reading Position', value: this.state.findIt.readingPosition, notes: this.state.findIt.readingPositionNotes }
            ];

            findItAssessments.forEach(assessment => {
                checkPageBreak(20);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text(`${assessment.label}:`, margin, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(assessment.value || 'Not assessed', margin + 45, yPos);
                yPos += 6;

                if (assessment.notes) {
                    doc.setFontSize(10);
                    doc.setTextColor(80, 80, 80);
                    yPos += addWrappedText(`Notes: ${assessment.notes}`, margin + 5, yPos, contentWidth - 5);
                    yPos += 2;
                }
            });

            if (this.state.findIt.additionalNotes) {
                checkPageBreak(15);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Additional Notes:', margin, yPos);
                yPos += 6;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(this.state.findIt.additionalNotes, margin + 5, yPos, contentWidth - 5);
            }

            yPos += 10;

            // ===== USE IT SECTION =====
            checkPageBreak(50);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Use It - Functional Vision', margin, yPos);
            yPos += 8;

            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Color Vision:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.useIt.colorVision || 'Not assessed', margin + 40, yPos);
            yPos += 6;

            if (this.state.useIt.colorVisionNotes) {
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(`Notes: ${this.state.useIt.colorVisionNotes}`, margin + 5, yPos, contentWidth - 5);
                yPos += 2;
            }

            checkPageBreak(15);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Functional Vision Skills:', margin, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');

            if (this.state.useIt.functionalVision.length > 0) {
                this.state.useIt.functionalVision.forEach(item => {
                    checkPageBreak(8);
                    doc.text(`• ${item}`, margin + 5, yPos);
                    yPos += 5;
                });
            } else {
                doc.text('Not assessed', margin + 5, yPos);
                yPos += 6;
            }

            if (this.state.useIt.functionalVisionNotes) {
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(`Notes: ${this.state.useIt.functionalVisionNotes}`, margin + 5, yPos, contentWidth - 5);
                yPos += 2;
            }

            checkPageBreak(15);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Environmental Needs:', margin, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');

            if (this.state.useIt.environmental.length > 0) {
                this.state.useIt.environmental.forEach(item => {
                    checkPageBreak(8);
                    doc.text(`• ${item}`, margin + 5, yPos);
                    yPos += 5;
                });
            } else {
                doc.text('Not assessed', margin + 5, yPos);
                yPos += 6;
            }

            if (this.state.useIt.environmentalNotes) {
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(`Notes: ${this.state.useIt.environmentalNotes}`, margin + 5, yPos, contentWidth - 5);
                yPos += 2;
            }

            if (this.state.useIt.additionalNotes) {
                checkPageBreak(15);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Additional Notes:', margin, yPos);
                yPos += 6;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                yPos += addWrappedText(this.state.useIt.additionalNotes, margin + 5, yPos, contentWidth - 5);
            }

            yPos += 10;

            // ===== READING TEST RESULTS (if available) =====
            if (window.readingTestManager && (window.readingTestManager.results.standard || window.readingTestManager.results.modified)) {
                checkPageBreak(50);
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 64, 175);
                doc.text('Reading Assessment Results', margin, yPos);
                yPos += 8;

                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 8;

                const results = window.readingTestManager.results;

                if (results.standard) {
                    checkPageBreak(25);
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text('Standard Text Results:', margin, yPos);
                    yPos += 7;

                    doc.setFontSize(11);
                    doc.setFont(undefined, 'normal');
                    const standardInfo = [
                        `Time: ${Math.floor(results.standard.time / 60)}m ${results.standard.time % 60}s`,
                        `Reading Speed: ${results.standard.wpm} words per minute`,
                        `Comprehension Errors: ${results.standard.errors}`,
                        `Accuracy: ${results.standard.accuracy}%`
                    ];
                    standardInfo.forEach(info => {
                        doc.text(info, margin + 5, yPos);
                        yPos += 6;
                    });
                    yPos += 3;
                }

                if (results.modified) {
                    checkPageBreak(25);
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text('Modified Text Results:', margin, yPos);
                    yPos += 7;

                    doc.setFontSize(11);
                    doc.setFont(undefined, 'normal');
                    const modifiedInfo = [
                        `Time: ${Math.floor(results.modified.time / 60)}m ${results.modified.time % 60}s`,
                        `Reading Speed: ${results.modified.wpm} words per minute`,
                        `Comprehension Errors: ${results.modified.errors}`,
                        `Accuracy: ${results.modified.accuracy}%`
                    ];
                    modifiedInfo.forEach(info => {
                        doc.text(info, margin + 5, yPos);
                        yPos += 6;
                    });
                    yPos += 3;
                }

                if (results.standard && results.modified) {
                    checkPageBreak(30);
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text('Comparison Analysis:', margin, yPos);
                    yPos += 7;

                    doc.setFontSize(11);
                    doc.setFont(undefined, 'normal');

                    const timeDiff = results.standard.time - results.modified.time;
                    const wpmDiff = results.modified.wpm - results.standard.wpm;
                    const errorDiff = results.standard.errors - results.modified.errors;
                    const accuracyDiff = results.modified.accuracy - results.standard.accuracy;

                    const comparison = [
                        `Time Difference: ${timeDiff > 0 ? timeDiff + 's faster' : Math.abs(timeDiff) + 's slower'} with modified text`,
                        `Speed Change: ${wpmDiff > 0 ? '+' + wpmDiff : wpmDiff} WPM`,
                        `Error Reduction: ${errorDiff > 0 ? errorDiff + ' fewer errors' : Math.abs(errorDiff) + ' more errors'}`,
                        `Accuracy Change: ${accuracyDiff > 0 ? '+' + accuracyDiff : accuracyDiff}%`
                    ];

                    comparison.forEach(info => {
                        checkPageBreak(8);
                        doc.text(info, margin + 5, yPos);
                        yPos += 6;
                    });
                }
            }

            // ===== RECOMMENDED STRATEGIES =====
            const selectedRecs = this.activeRecommendations.filter(rec =>
                this.recommendationEngine.selectedRecommendations.has(rec.id)
            );

            if (selectedRecs.length > 0) {
                checkPageBreak(50);
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 64, 175);
                doc.text('Recommended Strategies', margin, yPos);
                yPos += 8;

                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 8;

                selectedRecs.forEach((rec, index) => {
                    checkPageBreak(60);

                    // Recommendation heading
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text(`${rec.value}`, margin, yPos);
                    yPos += 8;

                    // Interpretation
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text('Interpretation:', margin + 5, yPos);
                    yPos += 6;

                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    yPos += addWrappedText(rec.interpretation, margin + 5, yPos, contentWidth - 5);
                    yPos += 4;

                    checkPageBreak(30);

                    // Implications
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text('Implications for Learning:', margin + 5, yPos);
                    yPos += 6;

                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    yPos += addWrappedText(rec.implications, margin + 5, yPos, contentWidth - 5);
                    yPos += 4;

                    checkPageBreak(30);

                    // Strategies
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text('Recommended Strategies:', margin + 5, yPos);
                    yPos += 6;

                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);

                    rec.strategies.forEach(strategy => {
                        checkPageBreak(15);
                        const bulletPoint = '• ';
                        const lines = doc.splitTextToSize(`${bulletPoint}${strategy}`, contentWidth - 10);

                        lines.forEach((line, lineIndex) => {
                            checkPageBreak(8);
                            if (lineIndex === 0) {
                                doc.text(line, margin + 10, yPos);
                            } else {
                                // Indent continuation lines
                                doc.text(line, margin + 13, yPos);
                            }
                            yPos += 5;
                        });
                        yPos += 1;
                    });

                    // Add spacing between recommendations
                    if (index < selectedRecs.length - 1) {
                        yPos += 6;
                    }
                });

                yPos += 10;
            }

            // ===== FOOTER =====
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `© D.Downes 2025 - VI Classroom Insights - For Educational Use Only`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
                doc.text(
                    `Page ${i} of ${totalPages}`,
                    pageWidth - margin,
                    pageHeight - 10,
                    { align: 'right' }
                );
                doc.text(
                    `Generated: ${new Date().toLocaleDateString()}`,
                    margin,
                    pageHeight - 10
                );
            }

            // Save the PDF
            const fileName = `VI-Assessment-${this.state.studentInfo.studentName.replace(/\s+/g, '-') || 'Report'}-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            alert('✓ PDF Report Generated Successfully!\n\nThe report has been downloaded to your device.');
            console.log('PDF report generated successfully');

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF report. Please ensure all required sections are complete and try again.');
        }
    }

    async resetAssessment() {
        const confirmReset = confirm(
            '⚠️ Reset Assessment\n\n' +
            'Are you sure you want to reset all assessment data?\n\n' +
            'This will permanently delete:\n' +
            '• Student information\n' +
            '• All See It, Find It, and Use It assessments\n' +
            '• Reading test results\n\n' +
            'This action cannot be undone.'
        );

        if (!confirmReset) {
            return;
        }

        // Double confirmation for safety
        const doubleConfirm = confirm(
            'Final Confirmation\n\n' +
            'This will delete ALL assessment data. Are you absolutely sure?'
        );

        if (!doubleConfirm) {
            return;
        }

        try {
            // Reset state to initial values
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

            // Clear reading test results if exists
            if (window.readingTestManager) {
                window.readingTestManager.results = {
                    standard: null,
                    modified: null
                };
                window.readingTestManager.displayResults();
            }

            // Save empty state to database
            await this.save();

            // Clear all form fields
            this.populateForm();

            // Update UI
            this.updateUI();

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Show success message
            alert('✓ Assessment Reset Complete\n\nAll data has been cleared. You can now start a new assessment.');

            console.log('Assessment reset successfully');
        } catch (error) {
            console.error('Error resetting assessment:', error);
            alert('Error resetting assessment. Please try again.');
        }
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
    document.querySelectorAll('.bottom-nav-btn:not(.reset-btn)').forEach(btn => {
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

    // Reset assessment button handler
    const resetBtn = document.getElementById('reset-assessment-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (window.assessmentManager) {
                await window.assessmentManager.resetAssessment();
            }
        });
    }

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
