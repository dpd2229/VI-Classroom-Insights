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
        // Store as array of recommendation options per measurement
        // Each is a separate selectable card
        this.recommendations = {
            // DISTANCE ACUITY RECOMMENDATIONS
            distanceAcuity: {
                '6/6': [],
                '6/9': [
                    {
                        title: 'Classroom Seating',
                        description: 'Consider preferential seating in the front third of the classroom with clear sightlines to displays and teaching areas.'
                    },
                    {
                        title: 'Board Work Access',
                        description: 'Ensure clear, high-contrast presentations on interactive whiteboards. Consider sharing screen content via iPad or tablet for closer viewing.'
                    },
                    {
                        title: 'Print Materials',
                        description: 'Provide enlarged handouts with minimum 14-16pt font for board work and worksheets.'
                    },
                    {
                        title: 'Digital Access',
                        description: 'Consider providing digital copies of board work sent to pupil\'s device for closer viewing and magnification.'
                    }
                ],
                '6/12': [
                    {
                        title: 'Classroom Seating',
                        description: 'Preferential seating in the front row is essential, with unobstructed view of all teaching displays and demonstrations.'
                    },
                    {
                        title: 'Screen Mirroring Technology',
                        description: 'Provide all board content in digital format sent to pupil\'s iPad/tablet using screen mirroring technology (Apple AirPlay, Google Cast) for real-time access.'
                    },
                    {
                        title: 'Print Size Adaptations',
                        description: 'Enlarge print materials to 18-24pt font size with good contrast (black text on white/cream background).'
                    },
                    {
                        title: 'Advance Materials',
                        description: 'Pre-provide lesson materials electronically to allow for preview and preparation before lessons.'
                    },
                    {
                        title: 'Distance Viewing Aids',
                        description: 'Consider use of monocular telescope for occasional distance viewing of specific targets (e.g., demonstrations, displays).'
                    }
                ],
                '6/19': [
                    {
                        title: 'Classroom Positioning',
                        description: 'Seated at the front of the classroom with clear sightline to all displays. Avoid seating with visual obstructions.'
                    },
                    {
                        title: 'iPad with Screen Sharing',
                        description: 'Use iPad with screen sharing for all board work and presentations. This is essential for accessing distance information in real-time.'
                    },
                    {
                        title: 'Digital Textbooks and eBooks',
                        description: 'Provide access to digital textbooks and eBooks with adjustable font sizes, allowing pupil to magnify content as needed.'
                    },
                    {
                        title: 'Enlarged Print Materials',
                        description: 'Enlarge all print materials to minimum 24-32pt font size. Consider using bold fonts for increased clarity.'
                    },
                    {
                        title: 'Advance Copies',
                        description: 'Provide advance copies of PowerPoints, worksheets, and visual materials to allow time for processing and familiarisation.'
                    },
                    {
                        title: 'Screen Magnification Apps',
                        description: 'Train pupil in use of screen magnification apps (Zoom feature on iPad, Magnifier app) for accessing visual information.'
                    },
                    {
                        title: 'Electronic Note-Taking',
                        description: 'Consider electronic note-taking to reduce copying from board. Provide digital versions of notes or use collaborative documents.'
                    },
                    {
                        title: 'Monocular Telescope',
                        description: 'Use of monocular telescope for specific distance tasks (e.g., reading signs, viewing demonstrations). Requires training and practice.'
                    },
                    {
                        title: 'High Contrast Materials',
                        description: 'Use high contrast materials for all work - avoid pastel colours, ensure dark text on light backgrounds, avoid low-contrast combinations.'
                    },
                    {
                        title: 'Extra Time Allowance',
                        description: 'Allow extra time for accessing and processing visual information, including during assessments and classwork.'
                    },
                    {
                        title: 'Verbal Descriptions',
                        description: 'Ensure all diagrams, images, and visual information are described verbally or provided with text descriptions for full access.'
                    }
                ],
                '6/24': [
                    {
                        title: 'Seating and Positioning',
                        description: 'Front row seating mandatory with unobstructed views of all teaching areas and displays.'
                    },
                    {
                        title: 'iPad with Screen Mirroring',
                        description: 'iPad with screen mirroring is essential classroom tool for all visual content. All board work must be shared digitally.'
                    },
                    {
                        title: 'Large Print or Digital Textbooks',
                        description: 'Provide large print textbooks (24-36pt minimum) or digital alternatives with magnification capability.'
                    },
                    {
                        title: 'Magnification Software',
                        description: 'Ensure access to magnification software on classroom computer/iPad for all digital work.'
                    },
                    {
                        title: 'Electronic Whiteboards',
                        description: 'Use electronic whiteboards with ability to save and share content directly to pupil\'s device.'
                    },
                    {
                        title: 'Reduce Copying Tasks',
                        description: 'Reduce copying tasks - provide pre-prepared materials and digital versions of all notes.'
                    },
                    {
                        title: 'Electronic Magnifier/CCTV',
                        description: 'Consider use of portable CCTV/electronic magnifier for detail work and reading tasks.'
                    },
                    {
                        title: 'Touch-Typing Skills',
                        description: 'Provide training in touch-typing for efficient note-taking and reduced reliance on copying.'
                    },
                    {
                        title: 'Monocular Telescope',
                        description: 'Monocular telescope with appropriate training for specific distance viewing tasks.'
                    },
                    {
                        title: 'Maximum Contrast',
                        description: 'Use maximum contrast on all materials - avoid grey tones and pastels. Use bold, clear fonts.'
                    },
                    {
                        title: 'Verbal Descriptions',
                        description: 'Provide verbal descriptions of all visual information, diagrams, and demonstrations.'
                    },
                    {
                        title: 'Audio Books',
                        description: 'Consider audio books alongside print/digital texts to reduce visual fatigue and improve access.'
                    },
                    {
                        title: 'Extra Time and Breaks',
                        description: 'Allow extra time for processing visual information and provide regular breaks during visually intensive tasks.'
                    }
                ],
                '6/36': [
                    {
                        title: 'Specialist Support',
                        description: 'Comprehensive assessment and regular specialist teaching input from QTVI essential.'
                    },
                    {
                        title: 'Technology for All Visual Content',
                        description: 'iPad with screen sharing for all visual content is mandatory. Standard displays are largely inaccessible.'
                    },
                    {
                        title: 'High-Powered Magnification',
                        description: 'High-powered magnification technology essential - electronic magnification (CCTV) for most classroom tasks.'
                    },
                    {
                        title: 'Large Print or Braille',
                        description: 'Likely to require Braille or very large print (36pt+) materials. Consider Braille assessment.'
                    },
                    {
                        title: 'Screen Reading Software',
                        description: 'Provide access to screen reading software for independence (e.g., VoiceOver, JAWS, NVDA).'
                    },
                    {
                        title: 'Tactile and 3D Models',
                        description: 'Use tactile/3D models for visual concepts, diagrams, and maps to support understanding.'
                    },
                    {
                        title: 'Audio Support',
                        description: 'Auditory support crucial - audio descriptions, text-to-speech technology, and audio textbooks.'
                    },
                    {
                        title: 'Eliminate Board Copying',
                        description: 'Eliminate all board copying - provide all materials digitally or in accessible formats.'
                    },
                    {
                        title: 'Assistive Technology Training',
                        description: 'Comprehensive training in assistive technology is essential for curriculum access and independence.'
                    },
                    {
                        title: 'Environmental Adaptations',
                        description: 'Environmental adaptations for safety and access - improved lighting, contrast marking, tactile cues.'
                    },
                    {
                        title: 'Technology-Based Assessment',
                        description: 'Consider assessment via technology rather than paper-based methods to allow for magnification and speech output.'
                    },
                    {
                        title: 'Collaborative Technology',
                        description: 'Use collaborative technology (OneNote, Google Classroom) for shared access to materials and assignments.'
                    }
                ],
                '6/60': [
                    {
                        title: 'Specialist Team Support',
                        description: 'Specialist QTVI and mobility officer involvement essential. Regular ongoing support required.'
                    },
                    {
                        title: 'Technology-Based Access',
                        description: 'All visual materials must be accessed through technology. Distance vision provides minimal functional information.'
                    },
                    {
                        title: 'Dual-Media Learning',
                        description: 'Likely dual-media learner requiring both print (highly magnified) and Braille. Assess braille needs urgently.'
                    },
                    {
                        title: 'Electronic Magnification',
                        description: 'High-powered electronic magnification (video magnifier/CCTV) essential for any print access.'
                    },
                    {
                        title: 'Screen Reading Technology',
                        description: 'Screen reading technology (JAWS, NVDA, VoiceOver) for computer access and independence.'
                    },
                    {
                        title: 'Touch-Typing and Keyboard Skills',
                        description: 'Priority training in touch-typing and accessible keyboard skills for efficient computer use.'
                    },
                    {
                        title: 'Audio Textbooks',
                        description: 'Audio textbooks and digital accessible formats essential for accessing curriculum content.'
                    },
                    {
                        title: 'Tactile Graphics',
                        description: 'Tactile graphics and 3D models for all diagrams, maps, and visual concepts.'
                    },
                    {
                        title: 'Comprehensive Environmental Adaptations',
                        description: 'Comprehensive environmental adaptations required throughout school for safety and independence.'
                    },
                    {
                        title: 'Mobility and Orientation',
                        description: 'Mobility and orientation assessment and training essential for safe, independent movement.'
                    },
                    {
                        title: 'Assessment Accommodations',
                        description: 'Full assessment accommodations required - extra time, scribe, reader, or technology-based alternatives.'
                    },
                    {
                        title: 'Peer Support Systems',
                        description: 'Establish peer support for visual tasks while maintaining pupil\'s independence and dignity.'
                    },
                    {
                        title: 'Independent Living Skills',
                        description: 'Focus on developing independent living skills alongside curriculum access.'
                    }
                ],
                'Not assessed': []
            },

            // NEAR ACUITY RECOMMENDATIONS (for reading/close work)
            nearAcuity: {
                'N5': [],
                'N6': [
                    {
                        title: 'Standard Print Access',
                        description: 'Pupil can access standard print (approximately 12pt font) but may benefit from slightly larger print (14-16pt) to reduce eye strain.'
                    },
                    {
                        title: 'Good Lighting',
                        description: 'Ensure good, adjustable lighting for close work. Consider task lighting for reading and writing.'
                    },
                    {
                        title: 'Frequent Breaks',
                        description: 'Allow frequent breaks during extended reading tasks to prevent visual fatigue.'
                    }
                ],
                'N8': [
                    {
                        title: 'Enlarged Print',
                        description: 'Provide print materials in 14-18pt font size for comfortable reading without excessive magnification.'
                    },
                    {
                        title: 'Digital Text Options',
                        description: 'Offer digital versions of texts so pupil can adjust font size as needed on iPad or computer.'
                    },
                    {
                        title: 'Reading Stand',
                        description: 'Consider use of a reading stand or slant board to bring materials closer and reduce fatigue.'
                    },
                    {
                        title: 'Task Lighting',
                        description: 'Provide adjustable task lighting for close work to improve contrast and reduce eye strain.'
                    }
                ],
                'N10': [
                    {
                        title: 'Large Print Materials',
                        description: 'Provide large print materials (18-24pt font size) for all reading tasks.'
                    },
                    {
                        title: 'Digital Books with Magnification',
                        description: 'Access to digital textbooks and eBooks with magnification capability is essential for independent reading.'
                    },
                    {
                        title: 'Hand-Held Magnifier',
                        description: 'Provide training in use of hand-held magnifier for occasional reading of standard print (labels, worksheets).'
                    },
                    {
                        title: 'Close Working Distance',
                        description: 'Allow pupil to work at close distance. Provide slant board or iPad stand to bring work closer without poor posture.'
                    },
                    {
                        title: 'Reduce Copying',
                        description: 'Minimize copying from board or books. Provide pre-prepared notes or digital versions.'
                    },
                    {
                        title: 'High Contrast',
                        description: 'Use high-contrast materials - black text on white/cream paper, avoid faded photocopies.'
                    }
                ],
                'N12': [
                    {
                        title: 'Large Print Essential',
                        description: 'Large print essential (24-28pt minimum). Standard print is inaccessible without magnification.'
                    },
                    {
                        title: 'iPad with Digital Books',
                        description: 'iPad or tablet with digital books and pinch-to-zoom functionality for independent reading.'
                    },
                    {
                        title: 'Electronic Magnification',
                        description: 'Consider electronic magnification (CCTV/video magnifier) for extended reading and writing tasks.'
                    },
                    {
                        title: 'Magnification Apps',
                        description: 'Train in use of magnification apps (iPad Magnifier, Zoom feature) for accessing standard print when necessary.'
                    },
                    {
                        title: 'Bold-Lined Paper',
                        description: 'Provide bold-lined or raised-line paper for written work to improve visibility of writing lines.'
                    },
                    {
                        title: 'Reduce Reading Load',
                        description: 'Reduce reading load where possible. Consider audio books alongside print to manage visual fatigue.'
                    },
                    {
                        title: 'Optimal Lighting',
                        description: 'Ensure optimal, glare-free lighting for all close work. Adjustable task lighting essential.'
                    },
                    {
                        title: 'Extra Time',
                        description: 'Allow extra time for reading and written work due to magnification needs and slower reading speed.'
                    }
                ],
                'N18': [
                    {
                        title: 'Very Large Print',
                        description: 'Very large print required (28-36pt minimum) for any print-based work.'
                    },
                    {
                        title: 'Electronic Magnification Priority',
                        description: 'Electronic magnification (CCTV/video magnifier) should be primary tool for reading and writing.'
                    },
                    {
                        title: 'Digital Alternatives',
                        description: 'Prioritise digital materials with adjustable magnification over print wherever possible.'
                    },
                    {
                        title: 'Screen Reading Software',
                        description: 'Introduce screen reading software (text-to-speech) to reduce visual load and support access.'
                    },
                    {
                        title: 'Bold, Clear Fonts',
                        description: 'Use bold, sans-serif fonts (Arial, Verdana) with maximum spacing between letters and lines.'
                    },
                    {
                        title: 'Audio Support',
                        description: 'Audio books and text-to-speech essential to supplement print access and reduce fatigue.'
                    },
                    {
                        title: 'Eliminate Standard Print',
                        description: 'Eliminate use of standard print. All materials must be adapted or provided digitally.'
                    },
                    {
                        title: 'Assistive Technology Training',
                        description: 'Comprehensive training in assistive technology for reading and writing (magnification, speech output).'
                    }
                ],
                'N24': [
                    {
                        title: 'Electronic Magnification Essential',
                        description: 'Electronic magnification (CCTV) essential for any print access. Very large print (36pt+) if using print at all.'
                    },
                    {
                        title: 'Screen Reading as Primary Access',
                        description: 'Screen reading software with speech output should be primary method for accessing text.'
                    },
                    {
                        title: 'Audio Books Primary Resource',
                        description: 'Audio books should be primary resource for reading curriculum texts. Print is highly fatiguing.'
                    },
                    {
                        title: 'Touch-Typing Skills',
                        description: 'Priority training in touch-typing skills for efficient written output without reliance on seeing keyboard.'
                    },
                    {
                        title: 'Digital Workflow',
                        description: 'Establish fully digital workflow - computer/iPad with accessibility features for all work.'
                    },
                    {
                        title: 'Consider Braille Assessment',
                        description: 'Consider Braille assessment if vision is deteriorating or pupil finds print too fatiguing.'
                    },
                    {
                        title: 'Assessment Accommodations',
                        description: 'Full assessment accommodations - reader, scribe, extra time, or technology-based alternatives.'
                    }
                ],
                'N36': [
                    {
                        title: 'Dual-Media Approach',
                        description: 'Likely dual-media learner. Assess for Braille alongside continued print access where beneficial.'
                    },
                    {
                        title: 'Audio as Primary Access',
                        description: 'Audio materials (text-to-speech, audio books) should be primary method for accessing curriculum content.'
                    },
                    {
                        title: 'Screen Reading Technology',
                        description: 'Screen reading technology with speech and/or Braille output essential for computer access.'
                    },
                    {
                        title: 'Braille Instruction',
                        description: 'Begin or continue Braille instruction as a sustainable literacy medium.'
                    },
                    {
                        title: 'Electronic Magnification for Specific Tasks',
                        description: 'High-powered electronic magnification for specific tasks only - audio/Braille should be primary media.'
                    },
                    {
                        title: 'Tactile Learning Materials',
                        description: 'Use tactile materials, 3D models, and manipulatives to support learning concepts.'
                    },
                    {
                        title: 'Independent Living Skills',
                        description: 'Focus on developing independent living skills and efficient use of assistive technology.'
                    }
                ],
                'Not assessed': []
            },

            // CONTRAST SENSITIVITY RECOMMENDATIONS
            contrastSensitivity: {
                'Good': [],
                'Moderate': [
                    {
                        title: 'High-Contrast Materials',
                        description: 'Use high-contrast materials for all work - black text on white paper, avoid grey or faded colors.'
                    },
                    {
                        title: 'Bold-Lined Paper',
                        description: 'Provide bold-lined paper for written work to improve visibility of writing lines.'
                    },
                    {
                        title: 'Quality Photocopies',
                        description: 'Ensure high-quality photocopies - not faded or light. Consider providing digital alternatives.'
                    },
                    {
                        title: 'Dark Writing Tools',
                        description: 'Use felt-tip pens or very dark pencils instead of standard graphite for better visibility.'
                    },
                    {
                        title: 'Screen Contrast Settings',
                        description: 'Increase screen contrast on computers and tablets to maximum comfortable level.'
                    },
                    {
                        title: 'Paper Selection',
                        description: 'Avoid glossy paper which reduces contrast. Use yellow or cream paper if white creates glare.'
                    },
                    {
                        title: 'Optimal Lighting',
                        description: 'Ensure good, even lighting without shadows or glare on work surfaces.'
                    }
                ],
                'Poor': [
                    {
                        title: 'Maximum Contrast Essential',
                        description: 'Maximum contrast essential - use black marker on white/cream backgrounds for all materials.'
                    },
                    {
                        title: 'Bold or Raised-Line Paper',
                        description: 'Provide bold-lined or raised-line paper for writing tasks to maximize line visibility.'
                    },
                    {
                        title: 'Thick Black Pens',
                        description: 'Use only thick black pens (felt-tip/rollerball) - standard pencils are insufficient.'
                    },
                    {
                        title: 'Digital with Contrast Adjustment',
                        description: 'Prioritize digital materials with adjustable contrast settings for optimal access.'
                    },
                    {
                        title: 'Color Overlays or Tinted Paper',
                        description: 'Trial color overlays or tinted paper - different colors may enhance contrast for individual pupils.'
                    },
                    {
                        title: 'Reduce Visual Clutter',
                        description: 'Avoid worksheets with excessive visual clutter. Use clear borders and spacing.'
                    },
                    {
                        title: 'High-Contrast Technology',
                        description: 'Use high-contrast keyboards, screen settings, and ensure all technology is optimized for contrast.'
                    },
                    {
                        title: 'Optimal Lighting Control',
                        description: 'Ensure optimal lighting - not too bright (causing glare) or too dim. Adjustable lighting essential.'
                    },
                    {
                        title: 'Alternative Color Schemes',
                        description: 'Consider yellow-on-black or white-on-black for some tasks if more effective than standard contrast.'
                    },
                    {
                        title: 'Avoid Glossy Surfaces',
                        description: 'Avoid shiny/glossy surfaces and laminated materials which reduce contrast significantly.'
                    }
                ],
                'Not assessed': []
            },

            // VISUAL FIELDS RECOMMENDATIONS
            visualFields: {
                'Full fields': [],
                'Peripheral field loss': [
                    {
                        title: 'Strategic Seating',
                        description: 'Seat pupil to maximize use of remaining field (e.g., if right field loss, sit on left side of room).'
                    },
                    {
                        title: 'Reduce Visual Clutter',
                        description: 'Reduce visual clutter on page and in environment to minimize information in periphery.'
                    },
                    {
                        title: 'Systematic Scanning Training',
                        description: 'Teach systematic scanning techniques (left to right, top to bottom) to compensate for field loss.'
                    },
                    {
                        title: 'Clear Margins and Spacing',
                        description: 'Use clear margins and spacing to define work areas and guide visual attention.'
                    },
                    {
                        title: 'Central Information Presentation',
                        description: 'Present important information in central vision where pupil has best access.'
                    },
                    {
                        title: 'Mobility Assessment',
                        description: 'Orientation and mobility assessment recommended for safe navigation in school.'
                    },
                    {
                        title: 'Tactile Boundary Markers',
                        description: 'Consider bump dots or tactile markers to mark boundaries and edges.'
                    },
                    {
                        title: 'Approach from Good Side',
                        description: 'Warn before approaching from affected side - approach from side with intact field where possible.'
                    },
                    {
                        title: 'Extra Time for Scanning',
                        description: 'Allow extra time for scanning and locating items due to reduced peripheral awareness.'
                    }
                ],
                'Central field loss': [
                    {
                        title: 'High Magnification',
                        description: 'High magnification may be helpful but assess effectiveness - may not work if large central scotoma.'
                    },
                    {
                        title: 'Eccentric Viewing Training',
                        description: 'Consider eccentric viewing training to teach pupil to use peripheral vision effectively.'
                    },
                    {
                        title: 'Audio Support Essential',
                        description: 'Audio support crucial - text-to-speech technology for accessing text-based materials.'
                    },
                    {
                        title: 'Reduce Reading Demands',
                        description: 'Reduce reading demands where possible or provide audio alternatives to minimize visual fatigue.'
                    },
                    {
                        title: 'Very Large Print',
                        description: 'Assess optimal print size - may require 36pt+ depending on scotoma size.'
                    },
                    {
                        title: 'Excellent Lighting',
                        description: 'Good, adjustable lighting essential to support peripheral vision use.'
                    },
                    {
                        title: 'Extended Time',
                        description: 'Allow extended time for reading and detail work due to reliance on peripheral vision.'
                    },
                    {
                        title: 'Braille Assessment',
                        description: 'Consider Braille assessment if vision is deteriorating or reading becomes too difficult.'
                    },
                    {
                        title: 'Color and Contrast',
                        description: 'Use strong color and contrast to aid peripheral viewing and improve visual access.'
                    }
                ],
                'Hemianopia (half field loss)': [
                    {
                        title: 'Systematic Scanning Training',
                        description: 'Teach systematic scanning techniques to ensure pupil checks affected side regularly.'
                    },
                    {
                        title: 'Colored Margin or Ruler',
                        description: 'Use colored margin or ruler on affected side as a visual guide during reading.'
                    },
                    {
                        title: 'Position Work for Intact Field',
                        description: 'Position work to maximize use of intact visual field.'
                    },
                    {
                        title: 'Reduce Page Width',
                        description: 'Reduce page width for reading - portrait orientation or narrower text columns.'
                    },
                    {
                        title: 'Electronic Reading Aids',
                        description: 'Electronic reading aids can help with navigation and tracking across text.'
                    },
                    {
                        title: 'Mobility Support',
                        description: 'Orientation and mobility support essential for safe movement in school environment.'
                    },
                    {
                        title: 'Compensatory Seating',
                        description: 'Seat to compensate for field loss - position intact field toward center of action.'
                    },
                    {
                        title: 'Approach Awareness',
                        description: 'Warn before approaching from affected side to avoid startling pupil.'
                    },
                    {
                        title: 'Tracking Guide',
                        description: 'Use finger, ruler, or electronic guide to track during reading to avoid missing text.'
                    },
                    {
                        title: 'Extra Time',
                        description: 'Provide extra time for all visual tasks due to need for compensatory scanning.'
                    }
                ],
                'Not assessed': []
            },

            // SCANNING PATTERN RECOMMENDATIONS
            scanningPattern: {
                'Systematic': [],
                'Disorganised': [
                    {
                        title: 'Structured Scanning Training',
                        description: 'Teach structured scanning techniques - consistent left-right, top-bottom patterns.'
                    },
                    {
                        title: 'Physical Tracking Tools',
                        description: 'Use finger, reading ruler, or typoscope to physically track and maintain place.'
                    },
                    {
                        title: 'Reduce Visual Clutter',
                        description: 'Reduce visual clutter on worksheets to minimize distractions and improve focus.'
                    },
                    {
                        title: 'Clear, Organized Layouts',
                        description: 'Present information in clear, well-organized layouts with predictable structure.'
                    },
                    {
                        title: 'Visual Prompts and Guides',
                        description: 'Use visual prompts (arrows, numbers, colored markers) to guide systematic scanning.'
                    },
                    {
                        title: 'Regular Practice',
                        description: 'Practice scanning activities regularly to develop and reinforce systematic patterns.'
                    },
                    {
                        title: 'Reading Window/Typoscope',
                        description: 'Use typoscope (reading window) to isolate text and reduce visual complexity.'
                    },
                    {
                        title: 'Highlight Key Information',
                        description: 'Highlight or box key information to draw attention and aid visual search.'
                    },
                    {
                        title: 'Extra Time',
                        description: 'Allow extra time for locating information and completing visual search tasks.'
                    }
                ],
                'Slow': [
                    {
                        title: 'Reduce Visual Information',
                        description: 'Reduce amount of visual information on page - use simpler layouts with less content per page.'
                    },
                    {
                        title: 'Predictable Information Placement',
                        description: 'Provide key information in predictable locations to reduce search time.'
                    },
                    {
                        title: 'Clear Organizational Structure',
                        description: 'Use clear headings, numbering, and organizational structure to guide visual search.'
                    },
                    {
                        title: 'Extended Time',
                        description: 'Allow extended time for visual search tasks and assignments.'
                    },
                    {
                        title: 'Pre-Teaching',
                        description: 'Pre-teach location of important information before independent work.'
                    },
                    {
                        title: 'Color Coding',
                        description: 'Use color coding to categorize information and speed up visual search.'
                    },
                    {
                        title: 'Reduce Copying',
                        description: 'Reduce copying tasks which require extensive visual search and tracking.'
                    },
                    {
                        title: 'Partially Completed Work',
                        description: 'Provide partially completed worksheets to reduce amount of visual searching required.'
                    },
                    {
                        title: 'Technology Solutions',
                        description: 'Use technology to reduce visual search - searchable PDFs, word processor find function.'
                    }
                ],
                'Not assessed': []
            },

            // COLOR VISION RECOMMENDATIONS
            colorVision: {
                'Normal colour vision': [],
                'Red-green deficiency': [
                    {
                        title: 'Don\'t Rely on Color Alone',
                        description: 'Do not rely on color alone to convey information - always provide additional cues.'
                    },
                    {
                        title: 'Patterns, Labels, or Symbols',
                        description: 'Use patterns, labels, or symbols alongside color coding for accessibility.'
                    },
                    {
                        title: 'Careful Color Combinations',
                        description: 'Choose color combinations carefully - blue/yellow works well, avoid red/green combinations.'
                    },
                    {
                        title: 'Avoid Red Pen',
                        description: 'Avoid red pen for corrections or marking - use blue, purple, or other visible colors.'
                    },
                    {
                        title: 'Label Color-Coded Materials',
                        description: 'Always label color-coded materials with text or symbols.'
                    },
                    {
                        title: 'Art Materials Labels',
                        description: 'Provide color name labels on art materials (paints, pens, pencils) for independent selection.'
                    },
                    {
                        title: 'Multiple Cues',
                        description: 'Use shape, texture, or position in addition to color for categorization.'
                    },
                    {
                        title: 'Color Identification Apps',
                        description: 'Consider color vision apps for identifying colors independently (e.g., Color ID apps).'
                    },
                    {
                        title: 'Science Considerations',
                        description: 'Be aware in science lessons (litmus paper, pH indicators) - always describe color changes verbally.'
                    }
                ],
                'Blue-yellow deficiency': [
                    {
                        title: 'Use Red/Green Combinations',
                        description: 'Use red/green color combinations which are more distinguishable for blue-yellow deficiency.'
                    },
                    {
                        title: 'Label All Color-Coded Materials',
                        description: 'Label all color-coded materials with text descriptions.'
                    },
                    {
                        title: 'Alternative Identification Methods',
                        description: 'Provide alternative methods to identify colors - patterns, labels, or technology.'
                    },
                    {
                        title: 'Patterns and Textures',
                        description: 'Use patterns or textures alongside color for differentiation.'
                    },
                    {
                        title: 'Verbal Descriptions',
                        description: 'Always describe colors verbally in class discussions and demonstrations.'
                    }
                ],
                'Monochromacy (no colour vision)': [
                    {
                        title: 'Never Use Color Alone',
                        description: 'Never use color alone to convey information - pupil cannot perceive any color.'
                    },
                    {
                        title: 'Label All Materials',
                        description: 'Label all materials with color names to allow pupil to know colors even if unable to see them.'
                    },
                    {
                        title: 'Patterns, Textures, Labels Only',
                        description: 'Use patterns, textures, and labels exclusively for differentiation - color is not functional.'
                    },
                    {
                        title: 'High Contrast Black and White',
                        description: 'Provide high contrast black and white materials for best visual access.'
                    },
                    {
                        title: 'Address Light Sensitivity',
                        description: 'Address likely associated light sensitivity with appropriate lighting and tinted lenses.'
                    },
                    {
                        title: 'Tactile or Verbal Methods',
                        description: 'Use tactile or verbal methods for color identification - texture, labels, verbal descriptions.'
                    },
                    {
                        title: 'Avoid Color-Based Instructions',
                        description: 'Ensure all staff understand that color-based instructions are completely inaccessible.'
                    },
                    {
                        title: 'Color Identifier Apps',
                        description: 'Technology support - color identifier apps can speak color names aloud for independence.'
                    }
                ],
                'Not assessed': []
            }
        };

        this.selectedRecommendations = new Set();
    }

    // Get recommendations for a specific assessment - returns array of recommendation options
    getRecommendations(assessmentType, value) {
        if (!value || value === 'Not assessed') return [];

        const recs = this.recommendations[assessmentType]?.[value];
        if (!recs || !Array.isArray(recs) || recs.length === 0) return [];

        // Return array of recommendations, each with a unique ID
        return recs.map((rec, index) => ({
            ...rec,
            assessmentType,
            value,
            id: `${assessmentType}-${value.replace(/\s+/g, '-').replace(/\//g, '-')}-${index}`
        }));
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
            this.updateRecommendations();
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
        let recommendations = [];

        // Distance Acuity (from seeIt section)
        if (this.state.seeIt.distanceAcuity && this.state.seeIt.distanceAcuity !== 'Not assessed') {
            const recs = this.recommendationEngine.getRecommendations('distanceAcuity', this.state.seeIt.distanceAcuity);
            recommendations = recommendations.concat(recs);
        }

        // Near Acuity (from seeIt section)
        if (this.state.seeIt.nearAcuity && this.state.seeIt.nearAcuity !== 'Not assessed') {
            const recs = this.recommendationEngine.getRecommendations('nearAcuity', this.state.seeIt.nearAcuity);
            recommendations = recommendations.concat(recs);
        }

        // Contrast Sensitivity (from seeIt section)
        if (this.state.seeIt.contrastSensitivity && this.state.seeIt.contrastSensitivity !== 'Not assessed') {
            const recs = this.recommendationEngine.getRecommendations('contrastSensitivity', this.state.seeIt.contrastSensitivity);
            recommendations = recommendations.concat(recs);
        }

        // Visual Fields (from findIt section)
        if (this.state.findIt.visualFields && this.state.findIt.visualFields !== 'Not assessed') {
            const recs = this.recommendationEngine.getRecommendations('visualFields', this.state.findIt.visualFields);
            recommendations = recommendations.concat(recs);
        }

        // Scanning Pattern (from findIt section)
        if (this.state.findIt.scanningPattern && this.state.findIt.scanningPattern !== 'Not assessed') {
            const recs = this.recommendationEngine.getRecommendations('scanningPattern', this.state.findIt.scanningPattern);
            recommendations = recommendations.concat(recs);
        }

        // Color Vision (from useIt section)
        if (this.state.useIt.colorVision && this.state.useIt.colorVision !== 'Not assessed') {
            const recs = this.recommendationEngine.getRecommendations('colorVision', this.state.useIt.colorVision);
            recommendations = recommendations.concat(recs);
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
                    <div class="recommendation-title">${rec.title}</div>
                </div>
                <div class="recommendation-content">
                    <p class="recommendation-description">${rec.description}</p>
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
                    checkPageBreak(30);

                    // Recommendation title
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);

                    const bulletPoint = '• ';
                    const lines = doc.splitTextToSize(`${bulletPoint}${rec.title}`, contentWidth - 5);
                    lines.forEach((line, lineIndex) => {
                        checkPageBreak(8);
                        if (lineIndex === 0) {
                            doc.text(line, margin + 5, yPos);
                        } else {
                            doc.text(line, margin + 8, yPos);
                        }
                        yPos += 6;
                    });

                    // Recommendation description
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    yPos += addWrappedText(rec.description, margin + 10, yPos, contentWidth - 10);
                    yPos += 4;

                    // Add spacing between recommendations
                    if (index < selectedRecs.length - 1) {
                        yPos += 2;
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
