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
                'Normal': [],
                'Mildly reduced': [
                    {
                        title: 'Good Lighting',
                        description: 'Ensure good, even lighting without shadows or glare on work surfaces.'
                    },
                    {
                        title: 'High-Contrast Materials',
                        description: 'Use high-contrast materials - black text on white/cream paper works best.'
                    },
                    {
                        title: 'Quality Photocopies',
                        description: 'Ensure high-quality photocopies - not faded or light. Consider providing digital alternatives.'
                    }
                ],
                'Moderately reduced': [
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
                'Severely reduced': [
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
                        title: 'Colour Overlays or Tinted Paper',
                        description: 'Trial colour overlays or tinted paper - different colors may enhance contrast for individual pupils.'
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
                        title: 'Alternative Colour Schemes',
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
                'Full to confrontation': [],
                'Slight restriction': [
                    {
                        title: 'Awareness Monitoring',
                        description: 'Monitor pupil\'s awareness of visual environment - slight restrictions may affect peripheral awareness.'
                    },
                    {
                        title: 'Good Lighting',
                        description: 'Ensure good lighting to optimize use of available visual field.'
                    },
                    {
                        title: 'Seating Considerations',
                        description: 'Consider seating position to maximize use of intact field if restriction is directional.'
                    }
                ],
                'Moderate restriction': [
                    {
                        title: 'Strategic Seating',
                        description: 'Seat pupil to maximize use of remaining field (e.g., if right field restriction, sit on left side of room).'
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
                    }
                ],
                'Severe restriction': [
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
                        title: 'Colour and Contrast',
                        description: 'Use strong colour and contrast to aid peripheral viewing and improve visual access.'
                    }
                ],
                'Hemianopia - left': [
                    {
                        title: 'Systematic Scanning Training',
                        description: 'Teach systematic scanning techniques to ensure pupil checks left side regularly.'
                    },
                    {
                        title: 'Colored Margin or Ruler',
                        description: 'Use colored margin or ruler on left side as a visual guide during reading.'
                    },
                    {
                        title: 'Position Work for Right Field',
                        description: 'Position work to maximize use of intact right visual field.'
                    },
                    {
                        title: 'Compensatory Seating',
                        description: 'Seat on right side of room to position intact right field toward center of action.'
                    },
                    {
                        title: 'Approach from Right',
                        description: 'Approach from right side to avoid startling pupil.'
                    },
                    {
                        title: 'Tracking Guide',
                        description: 'Use finger, ruler, or electronic guide to track during reading.'
                    },
                    {
                        title: 'Extra Time',
                        description: 'Provide extra time for all visual tasks due to need for compensatory scanning.'
                    }
                ],
                'Hemianopia - right': [
                    {
                        title: 'Systematic Scanning Training',
                        description: 'Teach systematic scanning techniques to ensure pupil checks right side regularly.'
                    },
                    {
                        title: 'Colored Margin or Ruler',
                        description: 'Use colored margin or ruler on right side as a visual guide during reading.'
                    },
                    {
                        title: 'Position Work for Left Field',
                        description: 'Position work to maximize use of intact left visual field.'
                    },
                    {
                        title: 'Compensatory Seating',
                        description: 'Seat on left side of room to position intact left field toward center of action.'
                    },
                    {
                        title: 'Approach from Left',
                        description: 'Approach from left side to avoid startling pupil.'
                    },
                    {
                        title: 'Tracking Guide',
                        description: 'Use finger, ruler, or electronic guide to track during reading.'
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
                'Systematic - left to right': [],
                'Systematic - top to bottom': [],
                'Random/disorganized': [
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
                'Incomplete - misses areas': [
                    {
                        title: 'Scanning Training',
                        description: 'Teach systematic scanning techniques to ensure complete coverage of visual field.'
                    },
                    {
                        title: 'Visual Prompts',
                        description: 'Use visual prompts (arrows, numbers, colored markers) to guide complete scanning.'
                    },
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
                        title: 'Colour Coding',
                        description: 'Use colour coding to categorize information and speed up visual search.'
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
                        title: 'Don\'t Rely on Colour Alone',
                        description: 'Do not rely on colour alone to convey information - always provide additional cues.'
                    },
                    {
                        title: 'Patterns, Labels, or Symbols',
                        description: 'Use patterns, labels, or symbols alongside colour coding for accessibility.'
                    },
                    {
                        title: 'Careful Colour Combinations',
                        description: 'Choose colour combinations carefully - blue/yellow works well, avoid red/green combinations.'
                    },
                    {
                        title: 'Avoid Red Pen',
                        description: 'Avoid red pen for corrections or marking - use blue, purple, or other visible colors.'
                    },
                    {
                        title: 'Label Colour-Coded Materials',
                        description: 'Always label colour-coded materials with text or symbols.'
                    },
                    {
                        title: 'Art Materials Labels',
                        description: 'Provide colour name labels on art materials (paints, pens, pencils) for independent selection.'
                    },
                    {
                        title: 'Multiple Cues',
                        description: 'Use shape, texture, or position in addition to colour for categorization.'
                    },
                    {
                        title: 'Colour Identification Apps',
                        description: 'Consider colour vision apps for identifying colors independently (e.g., Colour ID apps).'
                    },
                    {
                        title: 'Science Considerations',
                        description: 'Be aware in science lessons (litmus paper, pH indicators) - always describe colour changes verbally.'
                    }
                ],
                'Blue-yellow deficiency': [
                    {
                        title: 'Use Red/Green Combinations',
                        description: 'Use red/green colour combinations which are more distinguishable for blue-yellow deficiency.'
                    },
                    {
                        title: 'Label All Colour-Coded Materials',
                        description: 'Label all colour-coded materials with text descriptions.'
                    },
                    {
                        title: 'Alternative Identification Methods',
                        description: 'Provide alternative methods to identify colors - patterns, labels, or technology.'
                    },
                    {
                        title: 'Patterns and Textures',
                        description: 'Use patterns or textures alongside colour for differentiation.'
                    },
                    {
                        title: 'Verbal Descriptions',
                        description: 'Always describe colors verbally in class discussions and demonstrations.'
                    }
                ],
                'Monochromacy (no colour vision)': [
                    {
                        title: 'Never Use Colour Alone',
                        description: 'Never use colour alone to convey information - pupil cannot perceive any colour.'
                    },
                    {
                        title: 'Label All Materials',
                        description: 'Label all materials with colour names to allow pupil to know colors even if unable to see them.'
                    },
                    {
                        title: 'Patterns, Textures, Labels Only',
                        description: 'Use patterns, textures, and labels exclusively for differentiation - colour is not functional.'
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
                        description: 'Use tactile or verbal methods for colour identification - texture, labels, verbal descriptions.'
                    },
                    {
                        title: 'Avoid Colour-Based Instructions',
                        description: 'Ensure all staff understand that colour-based instructions are completely inaccessible.'
                    },
                    {
                        title: 'Colour Identifier Apps',
                        description: 'Technology support - colour identifier apps can speak colour names aloud for independence.'
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
        this.currentField = null; // Track which field is currently active for recommendations
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
        const studentNameEl = document.getElementById('student-name');
        if (studentNameEl) studentNameEl.value = this.state.studentInfo.studentName || '';

        const dobEl = document.getElementById('date-of-birth');
        if (dobEl) dobEl.value = this.state.studentInfo.dateOfBirth || '';

        const yearGroupEl = document.getElementById('year-group');
        if (yearGroupEl) yearGroupEl.value = this.state.studentInfo.yearGroup || '';

        const assessmentDateEl = document.getElementById('assessment-date');
        if (assessmentDateEl) assessmentDateEl.value = this.state.studentInfo.assessmentDate || this.getTodayDate();

        const assessedByEl = document.getElementById('assessed-by');
        if (assessedByEl) assessedByEl.value = this.state.studentInfo.assessedBy || '';

        // See It section
        const distanceAcuityEl = document.getElementById('distance-acuity');
        if (distanceAcuityEl) distanceAcuityEl.value = this.state.seeIt.distanceAcuity || '';

        const distanceNotesEl = document.querySelector('[name="distanceAcuityNotes"]');
        if (distanceNotesEl) distanceNotesEl.value = this.state.seeIt.distanceAcuityNotes || '';

        const nearAcuityEl = document.getElementById('near-acuity');
        if (nearAcuityEl) nearAcuityEl.value = this.state.seeIt.nearAcuity || '';

        const nearDistanceEl = document.getElementById('near-distance');
        if (nearDistanceEl) nearDistanceEl.value = this.state.seeIt.nearDistance || '';

        const nearNotesEl = document.querySelector('[name="nearAcuityNotes"]');
        if (nearNotesEl) nearNotesEl.value = this.state.seeIt.nearAcuityNotes || '';

        const contrastEl = document.getElementById('contrast-sensitivity');
        if (contrastEl) contrastEl.value = this.state.seeIt.contrastSensitivity || '';

        const contrastNotesEl = document.querySelector('[name="contrastSensitivityNotes"]');
        if (contrastNotesEl) contrastNotesEl.value = this.state.seeIt.contrastSensitivityNotes || '';

        // Light sensitivity checkboxes
        document.querySelectorAll('[name="lightSensitivity"]').forEach(checkbox => {
            checkbox.checked = this.state.seeIt.lightSensitivity.includes(checkbox.value);
        });

        const lightNotesEl = document.querySelector('[name="lightSensitivityNotes"]');
        if (lightNotesEl) lightNotesEl.value = this.state.seeIt.lightSensitivityNotes || '';

        const seeItNotesEl = document.getElementById('see-it-notes');
        if (seeItNotesEl) seeItNotesEl.value = this.state.seeIt.additionalNotes || '';

        // Find It section
        const visualFieldsEl = document.getElementById('visual-fields');
        if (visualFieldsEl) visualFieldsEl.value = this.state.findIt.visualFields || '';

        const visualFieldsNotesEl = document.querySelector('[name="visualFieldsNotes"]');
        if (visualFieldsNotesEl) visualFieldsNotesEl.value = this.state.findIt.visualFieldsNotes || '';

        const scanningEl = document.getElementById('scanning-pattern');
        if (scanningEl) scanningEl.value = this.state.findIt.scanningPattern || '';

        const scanningNotesEl = document.querySelector('[name="scanningPatternNotes"]');
        if (scanningNotesEl) scanningNotesEl.value = this.state.findIt.scanningPatternNotes || '';

        const trackingEl = document.getElementById('tracking');
        if (trackingEl) trackingEl.value = this.state.findIt.tracking || '';

        const trackingNotesEl = document.querySelector('[name="trackingNotes"]');
        if (trackingNotesEl) trackingNotesEl.value = this.state.findIt.trackingNotes || '';

        const readingPosEl = document.getElementById('reading-position');
        if (readingPosEl) readingPosEl.value = this.state.findIt.readingPosition || '';

        const readingPosNotesEl = document.querySelector('[name="readingPositionNotes"]');
        if (readingPosNotesEl) readingPosNotesEl.value = this.state.findIt.readingPositionNotes || '';

        const findItNotesEl = document.getElementById('find-it-notes');
        if (findItNotesEl) findItNotesEl.value = this.state.findIt.additionalNotes || '';

        // Use It section
        const colourVisionEl = document.getElementById('colour-vision');
        if (colourVisionEl) colourVisionEl.value = this.state.useIt.colorVision || '';

        const colorNotesEl = document.querySelector('[name="colorVisionNotes"]');
        if (colorNotesEl) colorNotesEl.value = this.state.useIt.colorVisionNotes || '';

        // Functional vision checkboxes
        document.querySelectorAll('[name="functionalVision"]').forEach(checkbox => {
            checkbox.checked = this.state.useIt.functionalVision.includes(checkbox.value);
        });

        const funcNotesEl = document.querySelector('[name="functionalVisionNotes"]');
        if (funcNotesEl) funcNotesEl.value = this.state.useIt.functionalVisionNotes || '';

        // Environmental checkboxes
        document.querySelectorAll('[name="environmental"]').forEach(checkbox => {
            checkbox.checked = this.state.useIt.environmental.includes(checkbox.value);
        });

        const envNotesEl = document.querySelector('[name="environmentalNotes"]');
        if (envNotesEl) envNotesEl.value = this.state.useIt.environmentalNotes || '';

        const useItNotesEl = document.getElementById('use-it-notes');
        if (useItNotesEl) useItNotesEl.value = this.state.useIt.additionalNotes || '';

        // Don't show recommendations automatically on load
        // User will click on a field to see recommendations
    }

    setupEventListeners() {
        // Student Info listeners
        const studentNameEl = document.getElementById('student-name');
        if (studentNameEl) {
            studentNameEl.addEventListener('input', (e) => {
                this.state.studentInfo.studentName = e.target.value;
                this.debouncedSave();
                this.updatePreview();
            });
        }

        const dateOfBirthEl = document.getElementById('date-of-birth');
        if (dateOfBirthEl) {
            dateOfBirthEl.addEventListener('change', (e) => {
                this.state.studentInfo.dateOfBirth = e.target.value;
                this.debouncedSave();
                this.updatePreview();
            });
        }

        const yearGroupEl = document.getElementById('year-group');
        if (yearGroupEl) {
            yearGroupEl.addEventListener('change', (e) => {
                this.state.studentInfo.yearGroup = e.target.value;
                this.debouncedSave();
                this.updatePreview();
            });
        }

        const assessmentDateEl = document.getElementById('assessment-date');
        if (assessmentDateEl) {
            assessmentDateEl.addEventListener('change', (e) => {
                this.state.studentInfo.assessmentDate = e.target.value;
                this.debouncedSave();
                this.updatePreview();
            });
        }

        const assessedByEl = document.getElementById('assessed-by');
        if (assessedByEl) {
            assessedByEl.addEventListener('input', (e) => {
                this.state.studentInfo.assessedBy = e.target.value;
                this.debouncedSave();
                this.updatePreview();
            });
        }

        // See It section listeners
        const distanceAcuitySelect = document.getElementById('distance-acuity');
        if (distanceAcuitySelect) {
            distanceAcuitySelect.addEventListener('focus', () => {
                this.showRecommendationsFor('distanceAcuity', this.state.seeIt.distanceAcuity, 'Distance Acuity');
            });
            distanceAcuitySelect.addEventListener('change', (e) => {
                this.state.seeIt.distanceAcuity = e.target.value;
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
                this.updateRecommendations();
            });
        }

        const distanceAcuityNotesEl = document.querySelector('[name="distanceAcuityNotes"]');
        if (distanceAcuityNotesEl) {
            distanceAcuityNotesEl.addEventListener('input', (e) => {
                this.state.seeIt.distanceAcuityNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const nearAcuitySelect = document.getElementById('near-acuity');
        if (nearAcuitySelect) {
            nearAcuitySelect.addEventListener('focus', () => {
                this.showRecommendationsFor('nearAcuity', this.state.seeIt.nearAcuity, 'Near Acuity');
            });
            nearAcuitySelect.addEventListener('change', (e) => {
                this.state.seeIt.nearAcuity = e.target.value;
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
                this.updateRecommendations();
            });
        }

        const nearDistanceEl = document.getElementById('near-distance');
        if (nearDistanceEl) {
            nearDistanceEl.addEventListener('input', (e) => {
                this.state.seeIt.nearDistance = e.target.value;
                this.debouncedSave();
            });
        }

        const nearAcuityNotesEl = document.querySelector('[name="nearAcuityNotes"]');
        if (nearAcuityNotesEl) {
            nearAcuityNotesEl.addEventListener('input', (e) => {
                this.state.seeIt.nearAcuityNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const contrastSelect = document.getElementById('contrast-sensitivity');
        if (contrastSelect) {
            contrastSelect.addEventListener('focus', () => {
                this.showRecommendationsFor('contrastSensitivity', this.state.seeIt.contrastSensitivity, 'Contrast Sensitivity');
            });
            contrastSelect.addEventListener('change', (e) => {
                this.state.seeIt.contrastSensitivity = e.target.value;
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
                this.updateRecommendations();
            });
        }

        const contrastSensitivityNotesEl = document.querySelector('[name="contrastSensitivityNotes"]');
        if (contrastSensitivityNotesEl) {
            contrastSensitivityNotesEl.addEventListener('input', (e) => {
                this.state.seeIt.contrastSensitivityNotes = e.target.value;
                this.debouncedSave();
            });
        }

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

        const lightSensitivityNotesEl = document.querySelector('[name="lightSensitivityNotes"]');
        if (lightSensitivityNotesEl) {
            lightSensitivityNotesEl.addEventListener('input', (e) => {
                this.state.seeIt.lightSensitivityNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const seeItNotesEl = document.getElementById('see-it-notes');
        if (seeItNotesEl) {
            seeItNotesEl.addEventListener('input', (e) => {
                this.state.seeIt.additionalNotes = e.target.value;
                this.debouncedSave();
            });
        }

        // FIND IT section listeners
        const visualFieldsSelect = document.getElementById('visual-fields');
        if (visualFieldsSelect) {
            visualFieldsSelect.addEventListener('focus', () => {
                this.showRecommendationsFor('visualFields', this.state.findIt.visualFields, 'Visual Fields');
            });
            visualFieldsSelect.addEventListener('change', (e) => {
                this.state.findIt.visualFields = e.target.value;
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
                this.updateRecommendations();
            });
        }

        const visualFieldsNotesEl = document.querySelector('[name="visualFieldsNotes"]');
        if (visualFieldsNotesEl) {
            visualFieldsNotesEl.addEventListener('input', (e) => {
                this.state.findIt.visualFieldsNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const scanningPatternSelect = document.getElementById('scanning-pattern');
        if (scanningPatternSelect) {
            scanningPatternSelect.addEventListener('focus', () => {
                this.showRecommendationsFor('scanningPattern', this.state.findIt.scanningPattern, 'Scanning Pattern');
            });
            scanningPatternSelect.addEventListener('change', (e) => {
                this.state.findIt.scanningPattern = e.target.value;
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
                this.updateRecommendations();
            });
        }

        const scanningPatternNotesEl = document.querySelector('[name="scanningPatternNotes"]');
        if (scanningPatternNotesEl) {
            scanningPatternNotesEl.addEventListener('input', (e) => {
                this.state.findIt.scanningPatternNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const trackingEl = document.getElementById('tracking');
        if (trackingEl) {
            trackingEl.addEventListener('change', (e) => {
                this.state.findIt.tracking = e.target.value;
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
            });
        }

        const trackingNotesEl = document.querySelector('[name="trackingNotes"]');
        if (trackingNotesEl) {
            trackingNotesEl.addEventListener('input', (e) => {
                this.state.findIt.trackingNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const readingPositionEl = document.getElementById('reading-position');
        if (readingPositionEl) {
            readingPositionEl.addEventListener('change', (e) => {
                this.state.findIt.readingPosition = e.target.value;
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
            });
        }

        const readingPositionNotesEl = document.querySelector('[name="readingPositionNotes"]');
        if (readingPositionNotesEl) {
            readingPositionNotesEl.addEventListener('input', (e) => {
                this.state.findIt.readingPositionNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const findItNotesEl = document.getElementById('find-it-notes');
        if (findItNotesEl) {
            findItNotesEl.addEventListener('input', (e) => {
                this.state.findIt.additionalNotes = e.target.value;
                this.debouncedSave();
            });
        }

        // USE IT section listeners
        const colorVisionSelect = document.getElementById('colour-vision');
        if (colorVisionSelect) {
            colorVisionSelect.addEventListener('focus', () => {
                this.showRecommendationsFor('colorVision', this.state.useIt.colorVision, 'Colour Vision');
            });
            colorVisionSelect.addEventListener('change', (e) => {
                this.state.useIt.colorVision = e.target.value;
                this.debouncedSave();
                this.updateCheckIndicators();
                this.updateProgress();
                this.updateRecommendations();
            });
        }

        const colorVisionNotesEl = document.querySelector('[name="colorVisionNotes"]');
        if (colorVisionNotesEl) {
            colorVisionNotesEl.addEventListener('input', (e) => {
                this.state.useIt.colorVisionNotes = e.target.value;
                this.debouncedSave();
            });
        }

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

        const functionalVisionNotesEl = document.querySelector('[name="functionalVisionNotes"]');
        if (functionalVisionNotesEl) {
            functionalVisionNotesEl.addEventListener('input', (e) => {
                this.state.useIt.functionalVisionNotes = e.target.value;
                this.debouncedSave();
            });
        }

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

        const environmentalNotesEl = document.querySelector('[name="environmentalNotes"]');
        if (environmentalNotesEl) {
            environmentalNotesEl.addEventListener('input', (e) => {
                this.state.useIt.environmentalNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const useItNotesEl = document.getElementById('use-it-notes');
        if (useItNotesEl) {
            useItNotesEl.addEventListener('input', (e) => {
                this.state.useIt.additionalNotes = e.target.value;
                this.debouncedSave();
            });
        }

        // Toggle notes buttons
        document.querySelectorAll('.toggle-notes-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const notesContainer = document.getElementById(targetId);
                const isExpanded = e.target.getAttribute('aria-expanded') === 'true';

                e.target.setAttribute('aria-expanded', !isExpanded);

                if (notesContainer) {
                    notesContainer.classList.toggle('hidden');

                    if (!isExpanded) {
                        e.target.textContent = '− Hide notes';
                        // Focus the textarea
                        const textarea = notesContainer.querySelector('textarea');
                        if (textarea) textarea.focus();
                    } else {
                        e.target.textContent = '+ Optional notes';
                    }
                }
            });
        });

        // Generate Report button
        const generateBtn = document.getElementById('generate-report-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generatePDFReport();
            });
        }

        // Reset Assessment button
        const resetBtn = document.getElementById('reset-assessment-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetAssessment();
            });
        }

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

    // Show recommendations for a specific field
    showRecommendationsFor(fieldType, fieldValue, fieldLabel) {
        this.currentField = { type: fieldType, value: fieldValue, label: fieldLabel };

        let recommendations = [];
        if (fieldValue && fieldValue !== 'Not assessed') {
            recommendations = this.recommendationEngine.getRecommendations(fieldType, fieldValue);
        }

        this.activeRecommendations = recommendations;
        this.updateRecommendationsUI();
    }

    // Clear recommendations when no field is active
    clearRecommendations() {
        this.currentField = null;
        this.activeRecommendations = [];
        this.updateRecommendationsUI();
    }

    updateRecommendations() {
        // If a field is currently active, update its recommendations
        if (this.currentField) {
            // Get the current value for this field
            let currentValue = null;
            const { type } = this.currentField;

            if (type === 'distanceAcuity') currentValue = this.state.seeIt.distanceAcuity;
            else if (type === 'nearAcuity') currentValue = this.state.seeIt.nearAcuity;
            else if (type === 'contrastSensitivity') currentValue = this.state.seeIt.contrastSensitivity;
            else if (type === 'visualFields') currentValue = this.state.findIt.visualFields;
            else if (type === 'scanningPattern') currentValue = this.state.findIt.scanningPattern;
            else if (type === 'colorVision') currentValue = this.state.useIt.colorVision;

            this.showRecommendationsFor(type, currentValue, this.currentField.label);
        }
    }

    updateRecommendationsUI() {
        const container = document.getElementById('recommendations-container');
        const placeholder = document.querySelector('.recommendations-panel .preview-placeholder');
        const actions = document.getElementById('recommendations-actions');
        const heading = document.querySelector('.recommendations-section .preview-heading');

        if (!container) return;

        // Update heading to show which field is active (with null check)
        if (heading) {
            if (this.currentField && this.currentField.label) {
                heading.textContent = `Recommendations: ${this.currentField.label}`;
            } else {
                heading.textContent = 'Recommended Strategies';
            }
        }

        // Update placeholder text (with null check)
        if (placeholder) {
            if (this.currentField) {
                placeholder.textContent = `No recommendations available for this ${this.currentField.label} value`;
            } else {
                placeholder.textContent = 'Click on an assessment field to see recommendation options';
            }
        }

        if (this.activeRecommendations.length === 0) {
            container.classList.add('hidden');
            if (actions) actions.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
            return;
        }

        if (placeholder) placeholder.classList.add('hidden');
        container.classList.remove('hidden');
        if (actions) actions.classList.remove('hidden');

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
        text.style.colour = 'var(--colour-critical)';

        setTimeout(() => {
            text.style.colour = '';
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
        if (studentNameEl) {
            if (this.state.studentInfo.studentName) {
                studentNameEl.innerHTML = `<strong>${this.state.studentInfo.studentName}</strong>`;
            } else {
                studentNameEl.innerHTML = '<span class="preview-placeholder">No student name entered</span>';
            }
        }

        // Update student details
        const detailsEl = document.getElementById('preview-student-details');
        if (detailsEl) {
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
        if (studentInfoProgress) {
            if (studentInfoComplete) {
                studentInfoProgress.classList.add('complete');
                studentInfoProgress.classList.remove('in-progress');
            } else if (Object.values(this.state.studentInfo).some(val => val && val.length > 0)) {
                studentInfoProgress.classList.add('in-progress');
                studentInfoProgress.classList.remove('complete');
            }
        }

        // Check See It completion
        const seeItComplete =
            this.state.seeIt.distanceAcuity &&
            this.state.seeIt.nearAcuity &&
            this.state.seeIt.contrastSensitivity &&
            this.state.seeIt.lightSensitivity.length > 0;

        const seeItProgress = document.getElementById('progress-see-it');
        if (seeItProgress) {
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
        }

        // Check Find It completion
        const findItComplete =
            this.state.findIt.visualFields &&
            this.state.findIt.scanningPattern &&
            this.state.findIt.tracking &&
            this.state.findIt.readingPosition;

        const findItProgress = document.getElementById('progress-find-it');
        if (findItProgress) {
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
        }

        // Check Use It completion
        const useItComplete =
            this.state.useIt.colorVision &&
            (this.state.useIt.functionalVision.length > 0 || this.state.useIt.environmental.length > 0);

        const useItProgress = document.getElementById('progress-use-it');
        if (useItProgress) {
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
        }

        // Update navigation
        this.updateNavigation();

        // Update generate report button
        const generateBtn = document.getElementById('generate-report-btn');
        const requirementsText = document.getElementById('report-requirements');

        if (generateBtn) {
            if (studentInfoComplete && seeItComplete && findItComplete && useItComplete) {
                generateBtn.disabled = false;
                generateBtn.title = 'All sections complete - Click to generate report';
                if (requirementsText) {
                    requirementsText.innerHTML = '<span style="colour: var(--colour-success);">✓ All sections complete!</span>';
                }
            } else {
                generateBtn.disabled = false; // Allow PDF generation at any time

                // Build list of incomplete sections
                const incomplete = [];
                if (!studentInfoComplete) incomplete.push('Student Info');
                if (!seeItComplete) incomplete.push('See It');
                if (!findItComplete) incomplete.push('Find It');
                if (!useItComplete) incomplete.push('Use It');

                const incompleteText = incomplete.join(', ');
                generateBtn.title = `Generate report with current data`;

                if (requirementsText) {
                    requirementsText.innerHTML = `<span style="colour: var(--colour-warning);">Note:</span> Some sections incomplete`;
                }
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

        if (studentInfoNav) {
            if (studentInfoComplete) {
                studentInfoNav.classList.add('completed');
            } else {
                studentInfoNav.classList.remove('completed');
            }
        }

        // Update See It nav item
        const seeItNav = document.querySelector('[data-section="see-it"]');
        const seeItComplete =
            this.state.seeIt.distanceAcuity &&
            this.state.seeIt.nearAcuity &&
            this.state.seeIt.contrastSensitivity &&
            this.state.seeIt.lightSensitivity.length > 0;

        if (seeItNav) {
            if (seeItComplete) {
                seeItNav.classList.add('completed');
            } else {
                seeItNav.classList.remove('completed');
            }
        }

        // Update Find It nav item
        const findItNav = document.querySelector('[data-section="find-it"]');
        const findItComplete =
            this.state.findIt.visualFields &&
            this.state.findIt.scanningPattern &&
            this.state.findIt.tracking &&
            this.state.findIt.readingPosition;

        if (findItNav) {
            if (findItComplete) {
                findItNav.classList.add('completed');
            } else {
                findItNav.classList.remove('completed');
            }
        }

        // Update Use It nav item
        const useItNav = document.querySelector('[data-section="use-it"]');
        const useItComplete =
            this.state.useIt.colorVision &&
            (this.state.useIt.functionalVision.length > 0 || this.state.useIt.environmental.length > 0);

        if (useItNav) {
            if (useItComplete) {
                useItNav.classList.add('completed');
            } else {
                useItNav.classList.remove('completed');
            }
        }
    }

    updateCheckIndicators() {
        // Distance Acuity
        const distanceCheck = document.getElementById('distance-acuity-check');
        if (distanceCheck) {
            if (this.state.seeIt.distanceAcuity) {
                distanceCheck.classList.add('complete');
            } else {
                distanceCheck.classList.remove('complete');
            }
        }

        // Near Acuity
        const nearCheck = document.getElementById('near-acuity-check');
        if (nearCheck) {
            if (this.state.seeIt.nearAcuity) {
                nearCheck.classList.add('complete');
            } else {
                nearCheck.classList.remove('complete');
            }
        }

        // Contrast Sensitivity
        const contrastCheck = document.getElementById('contrast-sensitivity-check');
        if (contrastCheck) {
            if (this.state.seeIt.contrastSensitivity) {
                contrastCheck.classList.add('complete');
            } else {
                contrastCheck.classList.remove('complete');
            }
        }

        // Light Sensitivity
        const lightCheck = document.getElementById('light-sensitivity-check');
        if (lightCheck) {
            if (this.state.seeIt.lightSensitivity.length > 0) {
                lightCheck.classList.add('complete');
            } else {
                lightCheck.classList.remove('complete');
            }
        }

        // FIND IT Check Indicators
        const visualFieldsCheck = document.getElementById('visual-fields-check');
        if (visualFieldsCheck) {
            if (this.state.findIt.visualFields) {
                visualFieldsCheck.classList.add('complete');
            } else {
                visualFieldsCheck.classList.remove('complete');
            }
        }

        const scanningPatternCheck = document.getElementById('scanning-pattern-check');
        if (scanningPatternCheck) {
            if (this.state.findIt.scanningPattern) {
                scanningPatternCheck.classList.add('complete');
            } else {
                scanningPatternCheck.classList.remove('complete');
            }
        }

        const trackingCheck = document.getElementById('tracking-check');
        if (trackingCheck) {
            if (this.state.findIt.tracking) {
                trackingCheck.classList.add('complete');
            } else {
                trackingCheck.classList.remove('complete');
            }
        }

        const readingPositionCheck = document.getElementById('reading-position-check');
        if (readingPositionCheck) {
            if (this.state.findIt.readingPosition) {
                readingPositionCheck.classList.add('complete');
            } else {
                readingPositionCheck.classList.remove('complete');
            }
        }

        // USE IT Check Indicators
        const colorVisionCheck = document.getElementById('colour-vision-check');
        if (colorVisionCheck) {
            if (this.state.useIt.colorVision) {
                colorVisionCheck.classList.add('complete');
            } else {
                colorVisionCheck.classList.remove('complete');
            }
        }

        const functionalVisionCheck = document.getElementById('functional-vision-check');
        if (functionalVisionCheck) {
            if (this.state.useIt.functionalVision.length > 0) {
                functionalVisionCheck.classList.add('complete');
            } else {
                functionalVisionCheck.classList.remove('complete');
            }
        }

        const environmentalCheck = document.getElementById('environmental-check');
        if (environmentalCheck) {
            if (this.state.useIt.environmental.length > 0) {
                environmentalCheck.classList.add('complete');
            } else {
                environmentalCheck.classList.remove('complete');
            }
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

        if (studentInfoBadge) {
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

        if (seeItBadge) {
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

        if (findItBadge) {
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

        if (useItBadge) {
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
            doc.setFillColor(30, 64, 175); // Primary colour
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
            doc.text('Colour Vision:', margin, yPos);
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
            alert('Error generating PDF report. Please try again or contact support if the problem persists.');
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
    const assessmentDateEl = document.getElementById('assessment-date');
    if (assessmentDateEl) {
        assessmentDateEl.value = new Date().toISOString().split('T')[0];
    }

    // Initialize Assessment Manager
    assessmentManager = new AssessmentManager();
    window.assessmentManager = assessmentManager; // Make globally accessible for bottom nav
    await assessmentManager.init();

    // Initialize Reading Test Manager
    const readingTestManager = new ReadingTestManager();
    window.readingTestManager = readingTestManager; // Make globally accessible

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
            },
            passage4: {
                title: 'The Secret Treehouse',
                ageRange: '7-9',
                text: `Tom and his best friend Sarah had always wanted to build a treehouse. One Saturday morning, they gathered wood, nails, and tools from Tom's garage. With help from Tom's dad, they chose the perfect tree in the back garden - a tall oak with strong, sturdy branches.

It took them all weekend to build the treehouse. They hammered planks together for the floor, built walls from old fence panels, and even made a small window. Tom's mum brought them sandwiches for lunch and lemonade when they got thirsty. By Sunday afternoon, their treehouse was finally complete!

The best part of the treehouse was the rope ladder they made to climb up. Tom painted a sign that said "Secret Club - Members Only" and hung it on the door. Inside, they put cushions, blankets, and a box of their favourite books and comics.

Every day after school, Tom and Sarah would climb up to their treehouse. They would read stories, play games, and watch the birds building nests in the nearby trees. Sometimes they would bring binoculars and pretend to be explorers discovering new lands. The treehouse became their special place where they could have adventures and share secrets.`,
                questions: [
                    {
                        question: 'What did Tom and Sarah build?',
                        answers: ['A den', 'A treehouse', 'A tent', 'A fort'],
                        correct: 1
                    },
                    {
                        question: 'What type of tree did they use?',
                        answers: ['A pine tree', 'A willow tree', 'An oak tree', 'A birch tree'],
                        correct: 2
                    },
                    {
                        question: 'How long did it take to build?',
                        answers: ['One day', 'All weekend', 'A week', 'A month'],
                        correct: 1
                    },
                    {
                        question: 'What did Tom\'s mum bring them?',
                        answers: ['Pizza and juice', 'Sandwiches and lemonade', 'Biscuits and milk', 'Cake and water'],
                        correct: 1
                    },
                    {
                        question: 'What did they use to climb up to the treehouse?',
                        answers: ['Stairs', 'A ladder', 'A rope ladder', 'A lift'],
                        correct: 2
                    }
                ]
            },
            passage5: {
                title: 'The Water Cycle',
                ageRange: '10-12',
                text: `The water cycle, also known as the hydrological cycle, is the continuous movement of water on, above, and below the surface of the Earth. This natural process has been occurring for billions of years and is essential for all life on our planet. Water is constantly recycling through different states and locations, from the oceans to the atmosphere and back again.

The cycle begins with evaporation, when the Sun's heat causes water from oceans, lakes, and rivers to transform into water vapour and rise into the atmosphere. Plants also release water vapour through their leaves in a process called transpiration. Together, evaporation and transpiration put enormous amounts of water vapour into the air every single day.

As water vapour rises, it cools and condenses around tiny particles of dust or salt in the air, forming clouds. This process is called condensation. When these water droplets become heavy enough, they fall back to Earth as precipitation - rain, snow, sleet, or hail, depending on the temperature. Most precipitation falls directly back into the oceans, but some falls on land.

Water that falls on land can take several paths. Some of it flows across the surface as runoff, eventually reaching streams, rivers, and back to the ocean. Some water soaks into the ground through infiltration, where it may be absorbed by plant roots or continue deeper to become groundwater. Groundwater can stay underground for thousands of years, or it may flow out through springs and wells. Eventually, through evaporation and transpiration, the water returns to the atmosphere, and the cycle continues endlessly.`,
                questions: [
                    {
                        question: 'What is another name for the water cycle?',
                        answers: ['The rain cycle', 'The hydrological cycle', 'The weather cycle', 'The ocean cycle'],
                        correct: 1
                    },
                    {
                        question: 'What causes water to evaporate?',
                        answers: ['Wind', 'The Moon', 'The Sun\'s heat', 'Cold air'],
                        correct: 2
                    },
                    {
                        question: 'What is the process called when plants release water vapour?',
                        answers: ['Evaporation', 'Condensation', 'Transpiration', 'Precipitation'],
                        correct: 2
                    },
                    {
                        question: 'What happens when water vapour cools in the atmosphere?',
                        answers: ['It disappears', 'It forms clouds', 'It freezes instantly', 'It falls as rain immediately'],
                        correct: 1
                    },
                    {
                        question: 'What is water that soaks into the ground called?',
                        answers: ['Runoff', 'Groundwater', 'Surface water', 'Rain water'],
                        correct: 1
                    }
                ]
            },
            passage6: {
                title: 'The Renaissance Period',
                ageRange: '13+',
                text: `The Renaissance, meaning "rebirth" in French, was a cultural, artistic, and intellectual movement that began in Italy during the 14th century and spread throughout Europe over the next three centuries. This period marked a dramatic shift from the medieval worldview, characterized by a renewed interest in classical Greek and Roman learning, art, and philosophy. It represented a bridge between the Middle Ages and modern history, fundamentally reshaping European society and laying the groundwork for the modern world.

The Renaissance began in the prosperous Italian city-states, particularly Florence, Venice, and Rome. Wealthy merchant families, such as the Medici in Florence, became patrons of the arts, commissioning works from talented artists and supporting scholars. This patronage system allowed artists and thinkers to dedicate themselves to their crafts without financial worry. The period produced some of history's greatest artists, including Leonardo da Vinci, Michelangelo, and Raphael, whose works exemplified the Renaissance ideals of humanism, realism, and technical mastery.

Humanism, the intellectual movement at the heart of the Renaissance, emphasized the potential and achievements of human beings rather than focusing primarily on religious themes. Humanist scholars studied classical texts, promoted education, and encouraged critical thinking. The invention of the printing press by Johannes Gutenberg around 1440 revolutionized the spread of knowledge, making books more affordable and accessible. This technological advancement facilitated the rapid dissemination of new ideas and learning throughout Europe.

The Renaissance also marked significant advances in science and exploration. Astronomers like Copernicus challenged the geocentric model of the universe, proposing that the Earth orbited the Sun. Explorers such as Christopher Columbus and Vasco da Gama expanded European knowledge of the world through their voyages. In medicine, Andreas Vesalius made groundbreaking discoveries about human anatomy. These developments in various fields demonstrated the Renaissance spirit of inquiry, observation, and innovation that would eventually lead to the Scientific Revolution and the Age of Enlightenment.`,
                questions: [
                    {
                        question: 'When did the Renaissance begin?',
                        answers: ['12th century', '13th century', '14th century', '15th century'],
                        correct: 2
                    },
                    {
                        question: 'Which Italian city was a major center of the Renaissance?',
                        answers: ['Milan', 'Naples', 'Florence', 'Turin'],
                        correct: 2
                    },
                    {
                        question: 'What does "Renaissance" mean?',
                        answers: ['Revolution', 'Rebirth', 'Reform', 'Renewal'],
                        correct: 1
                    },
                    {
                        question: 'Who invented the printing press around 1440?',
                        answers: ['Leonardo da Vinci', 'Johannes Gutenberg', 'Michelangelo', 'Galileo Galilei'],
                        correct: 1
                    },
                    {
                        question: 'What was the intellectual movement at the heart of the Renaissance?',
                        answers: ['Rationalism', 'Empiricism', 'Humanism', 'Realism'],
                        correct: 2
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
        this.textColorSelect = document.getElementById('text-colour');

        // Debug logging
        console.log('ReadingTestManager elements:', {
            passageSelect: !!this.passageSelect,
            textSizeSelect: !!this.textSizeSelect,
            lineSpacingSelect: !!this.lineSpacingSelect,
            textColorSelect: !!this.textColorSelect
        });

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

        // Setup event listeners (with null checks)
        if (this.startStandardBtn) {
            this.startStandardBtn.addEventListener('click', () => this.startTest('standard'));
        }
        if (this.startModifiedBtn) {
            this.startModifiedBtn.addEventListener('click', () => this.startTest('modified'));
        }
        if (this.finishTestBtn) {
            this.finishTestBtn.addEventListener('click', () => this.finishReading());
        }
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeTest());
        }
        if (this.submitAnswersBtn) {
            this.submitAnswersBtn.addEventListener('click', () => this.submitAnswers());
        }

        console.log('Reading Test Manager initialized');
    }

    startTest(type) {
        if (!this.passageSelect || !this.modal || !this.modalTitle || !this.passageContainer) {
            console.error('Reading test elements not found');
            return;
        }

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
            if (this.textSizeSelect && this.lineSpacingSelect && this.textColorSelect) {
                const fontSize = this.textSizeSelect.value;
                const lineSpacing = this.lineSpacingSelect.value;
                const colorScheme = this.textColorSelect.value;

                console.log('Applying modified settings:', { fontSize, lineSpacing, colorScheme });

                this.passageContainer.classList.add('modified');
                this.passageContainer.style.fontSize = `${fontSize}pt`;
                this.passageContainer.style.lineHeight = lineSpacing;

                // Apply colour scheme
                if (colorScheme !== 'default') {
                    this.passageContainer.classList.add(`color-${colorScheme}`);
                    console.log('Applied color scheme:', colorScheme);
                }
            } else {
                console.error('Modified test settings elements not found:', {
                    textSizeSelect: !!this.textSizeSelect,
                    lineSpacingSelect: !!this.lineSpacingSelect,
                    textColorSelect: !!this.textColorSelect
                });
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
