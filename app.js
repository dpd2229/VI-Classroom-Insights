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
                        title: 'Bookshare Accessible Library',
                        description: 'Set up Bookshare account (free for students with print disabilities) for access to thousands of accessible textbooks and novels in adjustable formats.'
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
                        title: 'Video Magnifier or iPad Camera',
                        description: 'Consider use of video magnifier or iPad camera feature for detail work and reading tasks. Modern iPads provide instant magnification with high-quality cameras.'
                    },
                    {
                        title: 'Bookshare Digital Library',
                        description: 'Provide access to Bookshare for accessible digital textbooks and reading materials in adjustable formats (font size, spacing, audio).'
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
                        description: 'High-powered magnification technology essential - video magnifier or iPad with magnification apps for most classroom tasks.'
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
                        description: 'High-powered electronic magnification (video magnifier or iPad with magnification) essential for any print access.'
                    },
                    {
                        title: 'Screen Reading Technology',
                        description: 'Screen reading technology for computer/device access: VoiceOver (built into iPad/iPhone/Mac), NVDA (free for Windows), or JAWS. Training essential for independence.'
                    },
                    {
                        title: 'Read&Write Literacy Support',
                        description: 'Read&Write software provides text-to-speech, word prediction, and study skills support for accessing curriculum materials.'
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
                        description: 'Consider electronic magnification (video magnifier or iPad camera) for extended reading and writing tasks.'
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
                        description: 'Electronic magnification (video magnifier or iPad with specialized apps) should be primary tool for reading and writing.'
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
                        description: 'Electronic magnification (video magnifier or iPad with camera/magnification apps) essential for any print access. Very large print (36pt+) if using print at all.'
                    },
                    {
                        title: 'Screen Reading as Primary Access',
                        description: 'Screen reading software with speech output should be primary method for accessing text. Use VoiceOver (iOS/Mac), NVDA (Windows), or similar.'
                    },
                    {
                        title: 'Bookshare and Audiobooks',
                        description: 'Bookshare membership essential for accessible textbooks. Supplement with Learning Ally, RNIB Bookshare, or other audio/accessible format libraries.'
                    },
                    {
                        title: 'Note-Taking Technology',
                        description: 'Digital note-taking with apps like Notability, OneNote, or Google Keep with voice recording for lectures. Reduces copying burden.'
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
                assessedBy: '',
                reasonForAssessment: '',
                eyeCondition: '',
                previousAssessments: '',
                conditionType: 'stable',
                progressionNotes: '',
                reviewFrequency: 'annually'
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
                socialConsiderations: [],
                socialParticipation: [],
                seatingConsiderations: [],
                peerAwarenessConsent: 'not-discussed',
                peerEducationPoints: [],
                socialConsiderationsNotes: '',
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

        // Apply severity styling to fields with values
        if (this.state.seeIt.distanceAcuity) {
            this.applySeverityStyling('distance-acuity', this.state.seeIt.distanceAcuity);
        }
        if (this.state.seeIt.nearAcuity) {
            this.applySeverityStyling('near-acuity', this.state.seeIt.nearAcuity);
        }
        if (this.state.seeIt.contrastSensitivity) {
            this.applySeverityStyling('contrast-sensitivity', this.state.seeIt.contrastSensitivity);
        }
        if (this.state.findIt.visualFields) {
            this.applySeverityStyling('visual-fields', this.state.findIt.visualFields);
        }
        if (this.state.findIt.scanningPattern) {
            this.applySeverityStyling('scanning-pattern', this.state.findIt.scanningPattern);
        }
        if (this.state.useIt.colorVision) {
            this.applySeverityStyling('colour-vision', this.state.useIt.colorVision);
        }

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

        const reasonForAssessmentEl = document.getElementById('reason-for-assessment');
        if (reasonForAssessmentEl) {
            reasonForAssessmentEl.addEventListener('input', (e) => {
                this.state.studentInfo.reasonForAssessment = e.target.value;
                this.debouncedSave();
            });
        }

        const eyeConditionEl = document.getElementById('eye-condition');
        if (eyeConditionEl) {
            eyeConditionEl.addEventListener('input', (e) => {
                this.state.studentInfo.eyeCondition = e.target.value;
                this.debouncedSave();
            });
        }

        const previousAssessmentsEl = document.getElementById('previous-assessments');
        if (previousAssessmentsEl) {
            previousAssessmentsEl.addEventListener('input', (e) => {
                this.state.studentInfo.previousAssessments = e.target.value;
                this.debouncedSave();
            });
        }

        // Progressive condition tracking
        const conditionRadios = document.querySelectorAll('input[name="conditionType"]');
        conditionRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.state.studentInfo.conditionType = e.target.value;
                this.debouncedSave();

                // Show/hide progression details
                const progressionDetails = document.getElementById('progression-details');
                if (progressionDetails) {
                    progressionDetails.style.display = e.target.value === 'progressive' ? 'block' : 'none';
                }
            });
        });

        const progressionNotesEl = document.getElementById('progression-notes');
        if (progressionNotesEl) {
            progressionNotesEl.addEventListener('input', (e) => {
                this.state.studentInfo.progressionNotes = e.target.value;
                this.debouncedSave();
            });
        }

        const reviewFrequencyEl = document.getElementById('review-frequency');
        if (reviewFrequencyEl) {
            reviewFrequencyEl.addEventListener('change', (e) => {
                this.state.studentInfo.reviewFrequency = e.target.value;
                this.debouncedSave();
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
                this.applySeverityStyling('distance-acuity', e.target.value);
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
                this.applySeverityStyling('near-acuity', e.target.value);
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
                this.applySeverityStyling('contrast-sensitivity', e.target.value);
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
                this.applySeverityStyling('visual-fields', e.target.value);
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
                this.applySeverityStyling('scanning-pattern', e.target.value);
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
                this.applySeverityStyling('colour-vision', e.target.value);
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

        // Social Considerations checkboxes
        document.querySelectorAll('[name="socialConsiderations"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.state.useIt.socialConsiderations.push(e.target.value);
                } else {
                    this.state.useIt.socialConsiderations = this.state.useIt.socialConsiderations.filter(
                        val => val !== e.target.value
                    );
                }
                this.debouncedSave();
            });
        });

        document.querySelectorAll('[name="socialParticipation"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.state.useIt.socialParticipation.push(e.target.value);
                } else {
                    this.state.useIt.socialParticipation = this.state.useIt.socialParticipation.filter(
                        val => val !== e.target.value
                    );
                }
                this.debouncedSave();
            });
        });

        document.querySelectorAll('[name="seatingConsiderations"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.state.useIt.seatingConsiderations.push(e.target.value);
                } else {
                    this.state.useIt.seatingConsiderations = this.state.useIt.seatingConsiderations.filter(
                        val => val !== e.target.value
                    );
                }
                this.debouncedSave();
            });
        });

        // Peer awareness consent radio buttons
        const peerAwarenessRadios = document.querySelectorAll('[name="peerAwarenessConsent"]');
        peerAwarenessRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.state.useIt.peerAwarenessConsent = e.target.value;
                this.debouncedSave();

                // Show/hide peer education points
                const peerEducationPoints = document.getElementById('peer-education-points');
                if (peerEducationPoints) {
                    peerEducationPoints.style.display = e.target.value === 'consented' ? 'block' : 'none';
                }
            });
        });

        document.querySelectorAll('[name="peerEducationPoints"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.state.useIt.peerEducationPoints.push(e.target.value);
                } else {
                    this.state.useIt.peerEducationPoints = this.state.useIt.peerEducationPoints.filter(
                        val => val !== e.target.value
                    );
                }
                this.debouncedSave();
            });
        });

        const socialConsiderationsNotesEl = document.getElementById('social-considerations-notes');
        if (socialConsiderationsNotesEl) {
            socialConsiderationsNotesEl.addEventListener('input', (e) => {
                this.state.useIt.socialConsiderationsNotes = e.target.value;
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

        // Generate Quick Reference button
        const quickRefBtn = document.getElementById('generate-quick-ref-btn');
        if (quickRefBtn) {
            quickRefBtn.addEventListener('click', () => {
                this.generateQuickReferencePDF();
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
        const quickRefBtn = document.getElementById('generate-quick-ref-btn');
        const requirementsText = document.getElementById('report-requirements');

        if (generateBtn) {
            if (studentInfoComplete && seeItComplete && findItComplete && useItComplete) {
                generateBtn.disabled = false;
                generateBtn.title = 'All sections complete - Click to generate report';
                if (requirementsText) {
                    requirementsText.innerHTML = '<span style="color: var(--color-success);">✓ All sections complete!</span>';
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
                    requirementsText.innerHTML = `<span style="color: var(--color-warning);">Note:</span> Some sections incomplete`;
                }
            }
        }

        // Update quick reference button (same logic as generate report button)
        if (quickRefBtn) {
            if (studentInfoComplete && seeItComplete && findItComplete && useItComplete) {
                quickRefBtn.disabled = false;
                quickRefBtn.title = 'All sections complete - Click to generate quick reference';
            } else {
                quickRefBtn.disabled = false; // Allow PDF generation at any time
                quickRefBtn.title = `Generate quick reference with current data`;
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

    // Apply severity styling to a form field based on value
    applySeverityStyling(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Remove all severity classes
        field.classList.remove('severity-critical', 'severity-important', 'severity-monitor', 'severity-normal');

        // Determine severity based on field and value
        let severity = null;

        // Distance Acuity
        if (fieldId === 'distance-acuity') {
            if (value.includes('6/38') || value.includes('6/60') || value.includes('<6/60')) {
                severity = 'critical';
            } else if (value.includes('6/19') || value.includes('6/24')) {
                severity = 'important';
            } else if (value.includes('6/12')) {
                severity = 'monitor';
            } else if (value.includes('6/6') || value.includes('6/9')) {
                severity = 'normal';
            }
        }

        // Near Acuity
        if (fieldId === 'near-acuity') {
            if (value.includes('N24') || value.includes('N36') || value.includes('N48')) {
                severity = 'critical';
            } else if (value.includes('N10') || value.includes('N12') || value.includes('N18')) {
                severity = 'important';
            } else if (value.includes('N8')) {
                severity = 'monitor';
            } else if (value.includes('N5') || value.includes('N6')) {
                severity = 'normal';
            }
        }

        // Contrast Sensitivity
        if (fieldId === 'contrast-sensitivity') {
            if (value === 'Severely reduced') {
                severity = 'critical';
            } else if (value === 'Moderately reduced') {
                severity = 'important';
            } else if (value === 'Mildly reduced') {
                severity = 'monitor';
            } else if (value === 'Normal') {
                severity = 'normal';
            }
        }

        // Visual Fields
        if (fieldId === 'visual-fields') {
            if (value.includes('Severe restriction') || value.includes('Hemianopia')) {
                severity = 'critical';
            } else if (value.includes('Moderate restriction')) {
                severity = 'important';
            } else if (value.includes('Slight restriction')) {
                severity = 'monitor';
            } else if (value.includes('Full to confrontation')) {
                severity = 'normal';
            }
        }

        // Scanning Pattern
        if (fieldId === 'scanning-pattern') {
            if (value.includes('Random') || value.includes('Incomplete')) {
                severity = 'important';
            } else if (value.includes('Systematic')) {
                severity = 'normal';
            }
        }

        // Color Vision
        if (fieldId === 'colour-vision') {
            if (value.includes('Monochromacy')) {
                severity = 'critical';
            } else if (value.includes('deficiency')) {
                severity = 'important';
            } else if (value.includes('Normal')) {
                severity = 'normal';
            }
        }

        // Apply the severity class
        if (severity) {
            field.classList.add(`severity-${severity}`);
        }
    }

    analyzeFindingsSeverity() {
        // Analyze assessment data and return {critical: [], important: [], monitor: []}
        // CRITICAL: Severe vision impairment, multiple significant issues
        // IMPORTANT: Moderate issues that need intervention
        // MONITOR: Mild issues to track over time

        const findings = { critical: [], important: [], monitor: [] };

        // Distance Acuity analysis
        if (this.state.seeIt.distanceAcuity) {
            if (this.state.seeIt.distanceAcuity.includes('6/38') || this.state.seeIt.distanceAcuity.includes('6/60') || this.state.seeIt.distanceAcuity.includes('<6/60')) {
                findings.critical.push(`Severe distance acuity impairment: ${this.state.seeIt.distanceAcuity}`);
            } else if (this.state.seeIt.distanceAcuity.includes('6/19') || this.state.seeIt.distanceAcuity.includes('6/24')) {
                findings.important.push(`Moderate distance acuity reduction: ${this.state.seeIt.distanceAcuity}`);
            } else if (this.state.seeIt.distanceAcuity.includes('6/12')) {
                findings.monitor.push(`Mild distance acuity reduction: ${this.state.seeIt.distanceAcuity}`);
            }
        }

        // Near Acuity analysis
        if (this.state.seeIt.nearAcuity) {
            if (this.state.seeIt.nearAcuity.includes('N24') || this.state.seeIt.nearAcuity.includes('N36') || this.state.seeIt.nearAcuity.includes('N48')) {
                findings.critical.push(`Severe near vision impairment: ${this.state.seeIt.nearAcuity}`);
            } else if (this.state.seeIt.nearAcuity.includes('N10') || this.state.seeIt.nearAcuity.includes('N12') || this.state.seeIt.nearAcuity.includes('N18')) {
                findings.important.push(`Reduced near acuity: ${this.state.seeIt.nearAcuity}`);
            } else if (this.state.seeIt.nearAcuity.includes('N8')) {
                findings.monitor.push(`Slightly reduced near acuity: ${this.state.seeIt.nearAcuity}`);
            }
        }

        // Contrast Sensitivity
        if (this.state.seeIt.contrastSensitivity === 'Severely reduced') {
            findings.critical.push('Severely reduced contrast sensitivity - high-contrast materials essential');
        } else if (this.state.seeIt.contrastSensitivity === 'Moderately reduced') {
            findings.important.push('Moderately reduced contrast sensitivity affecting access to standard materials');
        } else if (this.state.seeIt.contrastSensitivity === 'Mildly reduced') {
            findings.monitor.push('Mildly reduced contrast sensitivity');
        }

        // Visual Fields
        if (this.state.findIt.visualFields) {
            if (this.state.findIt.visualFields.includes('Severe restriction') || this.state.findIt.visualFields.includes('Hemianopia')) {
                findings.critical.push(`Significant visual field loss: ${this.state.findIt.visualFields}`);
            } else if (this.state.findIt.visualFields.includes('Moderate restriction')) {
                findings.important.push(`Moderate visual field restriction: ${this.state.findIt.visualFields}`);
            } else if (this.state.findIt.visualFields.includes('Slight restriction')) {
                findings.monitor.push(`Slight visual field restriction: ${this.state.findIt.visualFields}`);
            }
        }

        // Scanning Pattern
        if (this.state.findIt.scanningPattern === 'Random/disorganized' || this.state.findIt.scanningPattern === 'Incomplete - misses areas') {
            findings.important.push(`Scanning difficulties: ${this.state.findIt.scanningPattern} - requires systematic training`);
        }

        // Color Vision
        if (this.state.useIt.colorVision) {
            if (this.state.useIt.colorVision.includes('Monochromacy')) {
                findings.critical.push('No functional colour vision - never use colour alone to convey information');
            } else if (this.state.useIt.colorVision.includes('deficiency')) {
                findings.important.push(`${this.state.useIt.colorVision} - avoid relying on colour alone`);
            }
        }

        return findings;
    }

    generateExecutiveSummary() {
        // Generate a narrative summary based on assessment findings
        const summary = [];
        const studentName = this.state.studentInfo.studentName || 'The student';

        // Overall visual profile
        const hasSignificantImpairment =
            this.state.seeIt.distanceAcuity?.includes('6/24') ||
            this.state.seeIt.distanceAcuity?.includes('6/38') ||
            this.state.seeIt.distanceAcuity?.includes('6/60') ||
            this.state.findIt.visualFields?.includes('Severe') ||
            this.state.findIt.visualFields?.includes('Hemianopia');

        if (hasSignificantImpairment) {
            summary.push(`${studentName} presents with significant visual impairment that substantially impacts classroom access and requires comprehensive adaptations.`);
        } else {
            summary.push(`${studentName} presents with visual impairment requiring thoughtful accommodations to optimize classroom access and learning outcomes.`);
        }

        // Distance vision summary
        if (this.state.seeIt.distanceAcuity && this.state.seeIt.distanceAcuity !== '6/6') {
            summary.push(`Distance acuity is measured at ${this.state.seeIt.distanceAcuity}, indicating that materials viewed from distance will require significant modification or alternative access methods.`);
        }

        // Near vision summary
        if (this.state.seeIt.nearAcuity && !this.state.seeIt.nearAcuity.includes('N5') && !this.state.seeIt.nearAcuity.includes('N6')) {
            summary.push(`Near acuity of ${this.state.seeIt.nearAcuity} indicates that print materials will benefit from enlargement and clear presentation.`);
        }

        // Visual field summary
        if (this.state.findIt.visualFields && !this.state.findIt.visualFields.includes('Full')) {
            summary.push(`Visual field assessment reveals ${this.state.findIt.visualFields.toLowerCase()}, which impacts scanning, mobility, and awareness of the visual environment.`);
        }

        // Functional implications
        const functionalIssues = [];
        if (this.state.findIt.scanningPattern?.includes('Random') || this.state.findIt.scanningPattern?.includes('Incomplete')) {
            functionalIssues.push('scanning efficiency');
        }
        if (this.state.seeIt.contrastSensitivity?.includes('reduced')) {
            functionalIssues.push('contrast perception');
        }
        if (this.state.useIt.colorVision?.includes('deficiency') || this.state.useIt.colorVision?.includes('Monochromacy')) {
            functionalIssues.push('colour discrimination');
        }

        if (functionalIssues.length > 0) {
            summary.push(`Additional considerations include difficulties with ${functionalIssues.join(', ')}, which require specific teaching strategies and environmental modifications.`);
        }

        // Positive note about support
        summary.push(`With appropriate accommodations and support strategies as outlined in this report, ${studentName} can access the curriculum effectively and achieve their full potential.`);

        return summary.join(' ');
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
                if (yPos + requiredSpace > pageHeight - margin - 15) {
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

            // Helper function to draw section header
            const addSectionHeader = (title, color = [30, 64, 175]) => {
                checkPageBreak(15);
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(...color);
                doc.text(title, margin, yPos);
                yPos += 6;
                doc.setDrawColor(...color);
                doc.setLineWidth(0.8);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 8;
                doc.setTextColor(0, 0, 0);
            };

            // Helper function to draw a colored box with text
            const addColoredBox = (color, title, items, icon = '•') => {
                if (items.length === 0) return;

                checkPageBreak(20 + (items.length * 6));

                // Draw colored background box
                const boxHeight = 8 + (items.length * 6);
                doc.setFillColor(...color);
                doc.roundedRect(margin, yPos - 3, contentWidth, boxHeight, 2, 2, 'F');

                // Title
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(title, margin + 5, yPos + 2);
                yPos += 8;

                // Items
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                items.forEach(item => {
                    const textLines = doc.splitTextToSize(`${icon} ${item}`, contentWidth - 15);
                    textLines.forEach(line => {
                        doc.text(line, margin + 5, yPos);
                        yPos += 5;
                    });
                    yPos += 1;
                });

                yPos += 5;
            };

            // ═══════════════════════════════════════════════════════════
            // PAGE 1: COVER, STUDENT INFO, EXECUTIVE SUMMARY & DASHBOARD
            // ═══════════════════════════════════════════════════════════

            // Header Banner
            doc.setFillColor(30, 64, 175);
            doc.rect(0, 0, pageWidth, 45, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont(undefined, 'bold');
            doc.text('Functional Vision Assessment', pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(13);
            doc.setFont(undefined, 'normal');
            doc.text('Comprehensive Educational Assessment Report', pageWidth / 2, 32, { align: 'center' });

            doc.setTextColor(0, 0, 0);
            yPos = 55;

            // Student Information Box
            doc.setFillColor(245, 247, 250);
            doc.roundedRect(margin, yPos - 2, contentWidth, 40, 3, 3, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.roundedRect(margin, yPos - 2, contentWidth, 40, 3, 3);

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Student:', margin + 5, yPos + 4);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.studentInfo.studentName || 'Not provided', margin + 25, yPos + 4);

            doc.setFont(undefined, 'bold');
            doc.text('DOB:', margin + 5, yPos + 11);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.studentInfo.dateOfBirth || 'Not provided', margin + 25, yPos + 11);

            doc.setFont(undefined, 'bold');
            doc.text('Year:', margin + 5, yPos + 18);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.studentInfo.yearGroup || 'Not provided', margin + 25, yPos + 18);

            doc.setFont(undefined, 'bold');
            doc.text('Assessment Date:', margin + 5, yPos + 25);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.studentInfo.assessmentDate || 'Not provided', margin + 40, yPos + 25);

            doc.setFont(undefined, 'bold');
            doc.text('Assessed By:', margin + 5, yPos + 32);
            doc.setFont(undefined, 'normal');
            doc.text(this.state.studentInfo.assessedBy || 'Not provided', margin + 32, yPos + 32);

            yPos += 48;

            // ===== EXECUTIVE SUMMARY =====
            const executiveSummary = this.generateExecutiveSummary();
            if (executiveSummary) {
                checkPageBreak(40);
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 64, 175);
                doc.text('Executive Summary', margin, yPos);
                yPos += 8;

                doc.setDrawColor(30, 64, 175);
                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 8;

                // Light blue background for executive summary
                const summaryLines = doc.splitTextToSize(executiveSummary, contentWidth - 10);
                const summaryHeight = (summaryLines.length * 5.5) + 10;
                checkPageBreak(summaryHeight);

                doc.setFillColor(240, 248, 255); // Light blue background
                doc.roundedRect(margin, yPos - 3, contentWidth, summaryHeight, 2, 2, 'F');

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                yPos += addWrappedText(executiveSummary, margin + 5, yPos + 2, contentWidth - 10, 5.5);
                yPos += 10;
            }

            // ===== VISUAL DASHBOARD =====
            const findings = this.analyzeFindingsSeverity();

            checkPageBreak(80);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Visual Dashboard', margin, yPos);
            yPos += 8;

            doc.setDrawColor(30, 64, 175);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;

            // === SEVERITY SUMMARY BOX ===
            const boxWidth = contentWidth;
            const boxHeight = 50;

            checkPageBreak(boxHeight + 10);

            // Main box border
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(1);
            doc.rect(margin, yPos, boxWidth, boxHeight);

            // Header section
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPos, boxWidth, 12, 'F');

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('ASSESSMENT SEVERITY OVERVIEW', pageWidth / 2, yPos + 8, { align: 'center' });

            let severityYPos = yPos + 20;

            // Critical findings bar
            const barHeight = 8;
            const barStartX = margin + 10;
            const barWidth = contentWidth - 20;

            doc.setFillColor(220, 38, 38); // Red
            doc.roundedRect(barStartX, severityYPos, barWidth, barHeight, 1, 1, 'F');
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(`CRITICAL: ${findings.critical.length} finding${findings.critical.length !== 1 ? 's' : ''}`, barStartX + 5, severityYPos + 5.5);
            severityYPos += barHeight + 4;

            // Important findings bar
            doc.setFillColor(237, 137, 54); // Orange
            doc.roundedRect(barStartX, severityYPos, barWidth, barHeight, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text(`IMPORTANT: ${findings.important.length} finding${findings.important.length !== 1 ? 's' : ''}`, barStartX + 5, severityYPos + 5.5);
            severityYPos += barHeight + 4;

            // Monitor findings bar
            doc.setFillColor(59, 130, 246); // Blue
            doc.roundedRect(barStartX, severityYPos, barWidth, barHeight, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text(`MONITOR: ${findings.monitor.length} finding${findings.monitor.length !== 1 ? 's' : ''}`, barStartX + 5, severityYPos + 5.5);

            yPos += boxHeight + 15;

            // === VISUAL ACUITY CHART ===
            checkPageBreak(45);

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Visual Acuity Overview', margin, yPos);
            yPos += 8;

            // Helper function to convert acuity to position on scale
            const getAcuityPosition = (acuity, isDistance) => {
                if (!acuity) return null;

                if (isDistance) {
                    const distanceScale = {
                        '6/6': 0, '6/9': 1, '6/12': 2, '6/19': 3, '6/24': 4, '6/38': 5, '6/60': 6, '<6/60': 7
                    };
                    for (let key in distanceScale) {
                        if (acuity.includes(key)) return distanceScale[key];
                    }
                } else {
                    const nearScale = {
                        'N5': 0, 'N6': 1, 'N8': 2, 'N10': 3, 'N12': 4, 'N18': 5, 'N24': 6, 'N36': 7, 'N48': 8
                    };
                    for (let key in nearScale) {
                        if (acuity.includes(key)) return nearScale[key];
                    }
                }
                return null;
            };

            const chartWidth = contentWidth - 40;
            const chartStartX = margin + 20;

            // Distance Acuity Chart
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text('Distance Acuity:', margin + 5, yPos);
            yPos += 6;

            // Draw scale bar
            const scaleBarHeight = 6;
            const segmentWidth = chartWidth / 7;

            // Normal range (6/6 to 6/9) in green
            doc.setFillColor(34, 197, 94);
            doc.rect(chartStartX, yPos, segmentWidth * 1.5, scaleBarHeight, 'F');

            // Caution range (6/12) in yellow
            doc.setFillColor(250, 204, 21);
            doc.rect(chartStartX + segmentWidth * 1.5, yPos, segmentWidth, scaleBarHeight, 'F');

            // Concern range (6/19-6/24) in orange
            doc.setFillColor(251, 146, 60);
            doc.rect(chartStartX + segmentWidth * 2.5, yPos, segmentWidth * 1.5, scaleBarHeight, 'F');

            // Critical range (6/38+) in red
            doc.setFillColor(239, 68, 68);
            doc.rect(chartStartX + segmentWidth * 4, yPos, segmentWidth * 3, scaleBarHeight, 'F');

            // Draw border
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.5);
            doc.rect(chartStartX, yPos, chartWidth, scaleBarHeight);

            // Mark student's position
            const distancePos = getAcuityPosition(this.state.seeIt.distanceAcuity, true);
            if (distancePos !== null) {
                const markerX = chartStartX + (distancePos * segmentWidth);
                doc.setFillColor(0, 0, 0);
                doc.circle(markerX, yPos + scaleBarHeight / 2, 2, 'F');
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                doc.text('▼', markerX - 1, yPos - 2);
                doc.setFontSize(7);
                doc.text('Student', markerX - 5, yPos - 5);
            }

            yPos += scaleBarHeight + 3;

            // Labels
            doc.setFontSize(7);
            doc.setTextColor(80, 80, 80);
            const distanceLabels = ['6/6', '6/9', '6/12', '6/19', '6/24', '6/38', '6/60', '<6/60'];
            distanceLabels.forEach((label, i) => {
                const labelX = chartStartX + (i * segmentWidth);
                doc.text(label, labelX - 2, yPos + 3);
            });

            yPos += 10;

            // Near Acuity Chart
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text('Near Acuity:', margin + 5, yPos);
            yPos += 6;

            const nearSegmentWidth = chartWidth / 8;

            // Normal range (N5-N6) in green
            doc.setFillColor(34, 197, 94);
            doc.rect(chartStartX, yPos, nearSegmentWidth * 2, scaleBarHeight, 'F');

            // Caution range (N8) in yellow
            doc.setFillColor(250, 204, 21);
            doc.rect(chartStartX + nearSegmentWidth * 2, yPos, nearSegmentWidth, scaleBarHeight, 'F');

            // Concern range (N10-N12) in orange
            doc.setFillColor(251, 146, 60);
            doc.rect(chartStartX + nearSegmentWidth * 3, yPos, nearSegmentWidth * 2, scaleBarHeight, 'F');

            // Critical range (N18+) in red
            doc.setFillColor(239, 68, 68);
            doc.rect(chartStartX + nearSegmentWidth * 5, yPos, nearSegmentWidth * 3, scaleBarHeight, 'F');

            // Draw border
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.5);
            doc.rect(chartStartX, yPos, chartWidth, scaleBarHeight);

            // Mark student's position
            const nearPos = getAcuityPosition(this.state.seeIt.nearAcuity, false);
            if (nearPos !== null) {
                const markerX = chartStartX + (nearPos * nearSegmentWidth);
                doc.setFillColor(0, 0, 0);
                doc.circle(markerX, yPos + scaleBarHeight / 2, 2, 'F');
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                doc.text('▼', markerX - 1, yPos - 2);
                doc.setFontSize(7);
                doc.text('Student', markerX - 5, yPos - 5);
            }

            yPos += scaleBarHeight + 3;

            // Labels
            doc.setFontSize(7);
            doc.setTextColor(80, 80, 80);
            const nearLabels = ['N5', 'N6', 'N8', 'N10', 'N12', 'N18', 'N24', 'N36', 'N48'];
            nearLabels.forEach((label, i) => {
                const labelX = chartStartX + (i * nearSegmentWidth);
                doc.text(label, labelX - 2, yPos + 3);
            });

            yPos += 15;

            // ═══════════════════════════════════════════════════════════
            // PAGE 2: BACKGROUND & CONTEXT
            // ═══════════════════════════════════════════════════════════

            doc.addPage();
            yPos = margin;

            addSectionHeader('BACKGROUND & CONTEXT');

            // Reason for Assessment
            if (this.state.studentInfo.reasonForAssessment) {
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('Reason for Assessment:', margin, yPos);
                yPos += 7;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                yPos += addWrappedText(this.state.studentInfo.reasonForAssessment, margin + 5, yPos, contentWidth - 5);
                yPos += 8;
            }

            // Progressive Condition Warning (if applicable)
            if (this.state.studentInfo.conditionType === 'progressive') {
                checkPageBreak(35);
                doc.setFillColor(255, 243, 205); // Warning yellow background
                doc.setDrawColor(245, 158, 11); // Orange border
                doc.setLineWidth(2);
                doc.roundedRect(margin, yPos - 2, contentWidth, 30, 3, 3, 'FD');

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(146, 64, 14); // Dark orange text
                doc.text('⚠ PROGRESSIVE CONDITION - Regular Monitoring Required', margin + 5, yPos + 5);

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                const reviewFreq = this.state.studentInfo.reviewFrequency || 'annually';
                doc.text(`Recommended review frequency: ${reviewFreq}`, margin + 5, yPos + 13);

                if (this.state.studentInfo.progressionNotes) {
                    doc.setFontSize(9);
                    const progLines = doc.splitTextToSize(this.state.studentInfo.progressionNotes, contentWidth - 15);
                    doc.text(progLines, margin + 5, yPos + 20);
                }
                yPos += 38;
            }

            // Eye Condition
            if (this.state.studentInfo.eyeCondition) {
                checkPageBreak(30);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Eye Condition(s):', margin, yPos);
                yPos += 7;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                yPos += addWrappedText(this.state.studentInfo.eyeCondition, margin + 5, yPos, contentWidth - 5);
                yPos += 8;
            }

            // Previous Assessments
            if (this.state.studentInfo.previousAssessments) {
                checkPageBreak(30);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('Previous Assessments:', margin, yPos);
                yPos += 7;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                yPos += addWrappedText(this.state.studentInfo.previousAssessments, margin + 5, yPos, contentWidth - 5);
                yPos += 8;
            }

            // What This Means for Learning (auto-generated)
            checkPageBreak(40);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('What This Means for Learning:', margin, yPos);
            yPos += 7;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);

            let impactText = `For a student with`;
            if (this.state.seeIt.distanceAcuity) {
                impactText += ` distance acuity of ${this.state.seeIt.distanceAcuity}`;
            }
            if (this.state.seeIt.nearAcuity) {
                impactText += ` and near acuity of ${this.state.seeIt.nearAcuity}`;
            }
            impactText += `, classroom materials viewed at distance will need to be significantly enlarged or provided through alternative access methods. `;

            if (this.state.seeIt.contrastSensitivity && this.state.seeIt.contrastSensitivity.includes('reduced')) {
                impactText += `Reduced contrast sensitivity means high-contrast materials are essential. `;
            }

            if (this.state.findIt.visualFields && !this.state.findIt.visualFields.includes('Full')) {
                impactText += `Visual field restrictions impact scanning, visual search, and mobility. `;
            }

            yPos += addWrappedText(impactText, margin + 5, yPos, contentWidth - 5);
            yPos += 12;

            // ═══════════════════════════════════════════════════════════
            // PAGE 3: KEY FINDINGS & VISUAL ACUITY SCALES
            // ═══════════════════════════════════════════════════════════

            doc.addPage();
            yPos = margin;

            addSectionHeader('KEY FINDINGS');

            // Critical Findings (Red)
            if (findings.critical.length > 0) {
                doc.setTextColor(0, 0, 0);
                addColoredBox([220, 38, 38], 'CRITICAL FINDINGS - Immediate Attention Required', findings.critical, '★');
            }

            // Important Findings (Orange)
            if (findings.important.length > 0) {
                doc.setTextColor(0, 0, 0);
                addColoredBox([237, 137, 54], 'IMPORTANT FINDINGS - Significant Considerations', findings.important, '▲');
            }

            // Monitor Findings (Blue)
            if (findings.monitor.length > 0) {
                doc.setTextColor(0, 0, 0);
                addColoredBox([59, 130, 246], 'MONITOR - Areas to Track Over Time', findings.monitor, '•');
            }

            yPos += 5;

            // ═══════════════════════════════════════════════════════════
            // PAGES 4-5: FUNCTIONAL VISION ASSESSMENT (BOXED FORMAT)
            // ═══════════════════════════════════════════════════════════

            doc.addPage();
            yPos = margin;

            addSectionHeader('FUNCTIONAL VISION ASSESSMENT');

            // Helper function to create boxed assessment with recommendations
            const addBoxedAssessment = (title, value, notes, recommendations) => {
                if (!value || value === 'Not assessed' || value === '') return;

                checkPageBreak(80);

                // Draw box
                doc.setDrawColor(100, 100, 100);
                doc.setLineWidth(0.5);
                doc.rect(margin, yPos, contentWidth, 70); // Fixed height boxes

                // Title bar
                doc.setFillColor(240, 248, 255);
                doc.rect(margin, yPos, contentWidth, 10, 'F');
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 64, 175);
                doc.text(title, margin + 3, yPos + 7);

                let boxY = yPos + 15;

                // Measurement
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Measurement:', margin + 3, boxY);
                doc.setFont(undefined, 'normal');
                doc.text(value, margin + 35, boxY);
                boxY += 8;

                // Notes if present
                if (notes) {
                    doc.setFontSize(9);
                    doc.setTextColor(80, 80, 80);
                    const noteLines = doc.splitTextToSize(notes, contentWidth - 10);
                    const maxLines = 2; // Limit notes to save space
                    noteLines.slice(0, maxLines).forEach(line => {
                        doc.text(line, margin + 3, boxY);
                        boxY += 4;
                    });
                    boxY += 2;
                }

                // Recommended Strategies (if any selected)
                if (recommendations && recommendations.length > 0) {
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text('RECOMMENDED STRATEGIES:', margin + 3, boxY);
                    boxY += 6;

                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(9);
                    recommendations.slice(0, 4).forEach(rec => { // Show max 4
                        doc.text('•', margin + 5, boxY);
                        const recLines = doc.splitTextToSize(rec.title, contentWidth - 15);
                        doc.text(recLines[0], margin + 8, boxY);
                        boxY += 4.5;
                    });
                }

                yPos += 75; // Move to next box
            };

            // Get selected recommendations for each field
            const selectedRecs = this.activeRecommendations.filter(rec =>
                this.recommendationEngine.selectedRecommendations.has(rec.id)
            );

            // DISTANCE VISION BOX
            const distanceRecs = selectedRecs.filter(r => r.assessmentType === 'distanceAcuity');
            addBoxedAssessment(
                'DISTANCE VISION',
                this.state.seeIt.distanceAcuity || 'Not assessed',
                this.state.seeIt.distanceAcuityNotes,
                distanceRecs
            );

            // NEAR VISION BOX
            const nearRecs = selectedRecs.filter(r => r.assessmentType === 'nearAcuity');
            const nearValue = this.state.seeIt.nearAcuity ?
                `${this.state.seeIt.nearAcuity}${this.state.seeIt.nearDistance ? ` at ${this.state.seeIt.nearDistance}` : ''}` :
                'Not assessed';
            addBoxedAssessment(
                'NEAR VISION',
                nearValue,
                this.state.seeIt.nearAcuityNotes,
                nearRecs
            );

            // CONTRAST SENSITIVITY BOX
            const contrastRecs = selectedRecs.filter(r => r.assessmentType === 'contrastSensitivity');
            addBoxedAssessment(
                'CONTRAST SENSITIVITY',
                this.state.seeIt.contrastSensitivity || 'Not assessed',
                this.state.seeIt.contrastSensitivityNotes,
                contrastRecs
            );

            // VISUAL FIELDS BOX
            const fieldsRecs = selectedRecs.filter(r => r.assessmentType === 'visualFields');
            addBoxedAssessment(
                'VISUAL FIELDS',
                this.state.findIt.visualFields || 'Not assessed',
                this.state.findIt.visualFieldsNotes,
                fieldsRecs
            );

            // SCANNING & TRACKING BOX
            const scanningRecs = selectedRecs.filter(r => r.assessmentType === 'scanningPattern');
            const scanningValue = this.state.findIt.scanningPattern || 'Not assessed';
            const scanningNotes = [
                this.state.findIt.scanningPatternNotes,
                this.state.findIt.tracking ? `Tracking: ${this.state.findIt.tracking}` : null,
                this.state.findIt.trackingNotes
            ].filter(Boolean).join('. ');
            addBoxedAssessment(
                'SCANNING & TRACKING',
                scanningValue,
                scanningNotes,
                scanningRecs
            );

            // COLOUR VISION BOX
            const colorRecs = selectedRecs.filter(r => r.assessmentType === 'colorVision');
            addBoxedAssessment(
                'COLOUR VISION',
                this.state.useIt.colorVision || 'Not assessed',
                this.state.useIt.colorVisionNotes,
                colorRecs
            );

            // READING POSITION BOX
            const readingPosValue = this.state.findIt.readingPosition || 'Not assessed';
            addBoxedAssessment(
                'READING POSITION',
                readingPosValue,
                this.state.findIt.readingPositionNotes,
                []
            );

            // ═══════════════════════════════════════════════════════════
            // PAGE 6: READING ASSESSMENT (if completed)
            // ═══════════════════════════════════════════════════════════

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

                yPos += 10;
            }

            // ===== RECOMMENDED STRATEGIES - ORGANIZED BY CATEGORY =====
            const selectedRecsForCategories = this.activeRecommendations.filter(rec =>
                this.recommendationEngine.selectedRecommendations.has(rec.id)
            );

            if (selectedRecsForCategories.length > 0) {
                checkPageBreak(50);
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 64, 175);
                doc.text('Recommended Intervention Strategies', margin, yPos);
                yPos += 8;

                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 8;

                // Add introduction text
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                const introText = 'The following strategies are recommended based on the assessment findings. These accommodations should be implemented systematically to optimize learning outcomes and classroom access.';
                yPos += addWrappedText(introText, margin, yPos, contentWidth, 5.5);
                yPos += 8;

                // Group recommendations by category
                const categories = {
                    'Classroom Environment': [],
                    'Materials & Resources': [],
                    'Teaching Strategies': [],
                    'Technology & Equipment': [],
                    'Assessment & Monitoring': [],
                    'Other Recommendations': []
                };

                // Categorize recommendations
                selectedRecsForCategories.forEach(rec => {
                    const title = rec.title.toLowerCase();
                    if (title.includes('seating') || title.includes('lighting') || title.includes('position') || title.includes('environment')) {
                        categories['Classroom Environment'].push(rec);
                    } else if (title.includes('text') || title.includes('print') || title.includes('material') || title.includes('paper') || title.includes('contrast')) {
                        categories['Materials & Resources'].push(rec);
                    } else if (title.includes('teaching') || title.includes('instruction') || title.includes('verbal') || title.includes('scanning') || title.includes('tracking')) {
                        categories['Teaching Strategies'].push(rec);
                    } else if (title.includes('magnif') || title.includes('device') || title.includes('technology') || title.includes('screen') || title.includes('computer')) {
                        categories['Technology & Equipment'].push(rec);
                    } else if (title.includes('assessment') || title.includes('monitor') || title.includes('review') || title.includes('progress')) {
                        categories['Assessment & Monitoring'].push(rec);
                    } else {
                        categories['Other Recommendations'].push(rec);
                    }
                });

                // Output each category
                Object.keys(categories).forEach(categoryName => {
                    const categoryRecs = categories[categoryName];
                    if (categoryRecs.length > 0) {
                        checkPageBreak(20);

                        // Category header
                        doc.setFillColor(245, 245, 245);
                        doc.roundedRect(margin, yPos - 3, contentWidth, 10, 1, 1, 'F');
                        doc.setFontSize(12);
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(30, 64, 175);
                        doc.text(categoryName, margin + 3, yPos + 3);
                        yPos += 12;

                        // Recommendations in this category
                        categoryRecs.forEach((rec, index) => {
                            checkPageBreak(30);

                            // Recommendation title with bullet
                            doc.setFontSize(11);
                            doc.setFont(undefined, 'bold');
                            doc.setTextColor(0, 0, 0);

                            const bulletPoint = '• ';
                            const titleLines = doc.splitTextToSize(`${bulletPoint}${rec.title}`, contentWidth - 5);
                            titleLines.forEach((line, lineIndex) => {
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
                            yPos += addWrappedText(rec.description, margin + 10, yPos, contentWidth - 15, 5.5);
                            yPos += 5;
                        });

                        yPos += 5;
                    }
                });
            }

            // ═══════════════════════════════════════════════════════════
            // PAGE 7: SOCIAL CONSIDERATIONS
            // ═══════════════════════════════════════════════════════════

            const hasSocialData = this.state.useIt.socialConsiderations?.length > 0 ||
                                  this.state.useIt.socialParticipation?.length > 0 ||
                                  this.state.useIt.seatingConsiderations?.length > 0 ||
                                  this.state.useIt.socialConsiderationsNotes;

            if (hasSocialData) {
                doc.addPage();
                yPos = margin;

                addSectionHeader('SOCIAL CONSIDERATIONS');

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                const introText = `Balancing academic access with social inclusion is essential for ${this.state.studentInfo.studentName || 'the student'}'s overall development and wellbeing.`;
                yPos += addWrappedText(introText, margin, yPos, contentWidth);
                yPos += 10;

                // Peer Recognition
                if (this.state.useIt.socialConsiderations?.length > 0) {
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text('Peer Recognition:', margin, yPos);
                    yPos += 6;
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    this.state.useIt.socialConsiderations.forEach(item => {
                        doc.text(`• ${item}`, margin + 5, yPos);
                        yPos += 5;
                    });
                    yPos += 6;
                }

                // Social Participation
                if (this.state.useIt.socialParticipation?.length > 0) {
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text('Social Participation:', margin, yPos);
                    yPos += 6;
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    this.state.useIt.socialParticipation.forEach(item => {
                        doc.text(`• ${item}`, margin + 5, yPos);
                        yPos += 5;
                    });
                    yPos += 6;
                }

                // Seating Considerations
                if (this.state.useIt.seatingConsiderations?.length > 0) {
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text('Seating Arrangements:', margin, yPos);
                    yPos += 6;
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    this.state.useIt.seatingConsiderations.forEach(item => {
                        doc.text(`• ${item}`, margin + 5, yPos);
                        yPos += 5;
                    });
                    yPos += 6;
                }

                // Peer Awareness
                if (this.state.useIt.peerAwarenessConsent === 'consented' && this.state.useIt.peerEducationPoints?.length > 0) {
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text('Peer Education Points (with family consent):', margin, yPos);
                    yPos += 6;
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    doc.text(`Brief peers that ${this.state.studentInfo.studentName || 'the student'}:`, margin + 5, yPos);
                    yPos += 5;
                    this.state.useIt.peerEducationPoints.forEach(item => {
                        doc.text(`• ${item}`, margin + 8, yPos);
                        yPos += 5;
                    });
                    yPos += 6;
                }

                // Social Considerations Notes
                if (this.state.useIt.socialConsiderationsNotes) {
                    checkPageBreak(30);
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text('Observations & Recommendations:', margin, yPos);
                    yPos += 6;
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(10);
                    yPos += addWrappedText(this.state.useIt.socialConsiderationsNotes, margin + 5, yPos, contentWidth - 5);
                }
            }

            // ═══════════════════════════════════════════════════════════
            // FINAL PAGE: SUMMARY & PRIORITY ACTIONS
            // ═══════════════════════════════════════════════════════════

            doc.addPage();
            yPos = margin;

            addSectionHeader('SUMMARY & PRIORITY ACTIONS');

            // Technology Recommendations
            checkPageBreak(50);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('TECHNOLOGY RECOMMENDATIONS', margin, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Essential:', margin + 5, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            doc.text('• iPad/tablet with accessibility features and camera for magnification', margin + 8, yPos);
            yPos += 5;
            doc.text('• Screen sharing capability (AirPlay, Chromecast, or similar)', margin + 8, yPos);
            yPos += 5;
            doc.text('• Bookshare account for accessible digital reading materials', margin + 8, yPos);
            yPos += 8;

            doc.setFont(undefined, 'bold');
            doc.text('Recommended:', margin + 5, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            doc.text('• Screen magnification software (built-in Magnifier, ZoomText, or similar)', margin + 8, yPos);
            yPos += 5;
            doc.text('• High contrast settings on all devices', margin + 8, yPos);
            yPos += 5;
            doc.text('• Read&Write or similar literacy support software', margin + 8, yPos);
            yPos += 5;
            doc.text('• Digital note-taking apps (Notability, OneNote, Google Keep)', margin + 8, yPos);
            yPos += 10;

            // Next Review
            checkPageBreak(25);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('REVIEW SCHEDULE', margin, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const reviewDate = new Date(this.state.studentInfo.assessmentDate || new Date());
            reviewDate.setFullYear(reviewDate.getFullYear() + 1);
            doc.text(`Next assessment recommended: ${reviewDate.toLocaleDateString()}`, margin + 5, yPos);
            yPos += 6;

            if (this.state.studentInfo.conditionType === 'progressive') {
                doc.setTextColor(146, 64, 14);
                const reviewFreq = this.state.studentInfo.reviewFrequency || 'annually';
                doc.text(`⚠ Progressive condition: Monitor ${reviewFreq}`, margin + 5, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 6;
            }

            doc.text('Update strategies as curriculum demands change', margin + 5, yPos);
            yPos += 10;

            // Contact Information
            checkPageBreak(20);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('RESOURCES & SUPPORT', margin, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`VI Service Contact: ${this.state.studentInfo.assessedBy || '[QTVI name]'}`, margin + 5, yPos);
            yPos += 6;
            doc.text('Technology training and ongoing support available', margin + 5, yPos);
            yPos += 6;
            doc.text('Further guidance: VI Classroom Insights', margin + 5, yPos);

            // ===== FOOTER ON ALL PAGES =====
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Generated by VI Classroom Insights - © D.Downes 2025 - For Educational Use Only`,
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

            alert('PDF Report Generated Successfully!\n\nA comprehensive assessment report has been downloaded to your device.');
            console.log('PDF report generated successfully');

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF report. Please try again or contact support if the problem persists.');
        }
    }

    generateQuickReferencePDF() {
        try {
            // Access jsPDF from window
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);
            let yPos = margin;

            // Helper function to add wrapped text
            const addWrappedText = (text, x, y, maxWidth, lineHeight = 5) => {
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, x, y);
                return lines.length * lineHeight;
            };

            // ===== HEADER =====
            doc.setFillColor(30, 64, 175);
            doc.rect(0, 0, pageWidth, 35, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('QUICK REFERENCE: Intervention Summary', pageWidth / 2, 15, { align: 'center' });

            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            const studentName = this.state.studentInfo.studentName || 'Student';
            const assessmentDate = this.state.studentInfo.assessmentDate || new Date().toLocaleDateString();
            doc.text(`Student: ${studentName}`, margin, 25);
            doc.text(`Date: ${assessmentDate}`, pageWidth - margin, 25, { align: 'right' });

            doc.setTextColor(0, 0, 0);
            yPos = 45;

            // Get findings
            const findings = this.analyzeFindingsSeverity();

            // ===== CRITICAL FINDINGS SECTION (RED) =====
            if (findings.critical.length > 0) {
                // Limit to max 4 findings
                const criticalToShow = findings.critical.slice(0, 4);

                doc.setFillColor(220, 38, 38);
                const boxHeight = 8 + (criticalToShow.length * 6);
                doc.roundedRect(margin, yPos - 3, contentWidth, boxHeight, 2, 2, 'F');

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('CRITICAL FINDINGS', margin + 5, yPos + 2);
                yPos += 8;

                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                criticalToShow.forEach(item => {
                    const textLines = doc.splitTextToSize(`★ ${item}`, contentWidth - 15);
                    textLines.forEach(line => {
                        doc.text(line, margin + 5, yPos);
                        yPos += 5;
                    });
                    yPos += 1;
                });

                yPos += 5;
                doc.setTextColor(0, 0, 0);
            }

            // ===== IMPORTANT FINDINGS SECTION (ORANGE) =====
            if (findings.important.length > 0) {
                // Limit to max 4 findings
                const importantToShow = findings.important.slice(0, 4);

                doc.setFillColor(237, 137, 54);
                const boxHeight = 8 + (importantToShow.length * 6);
                doc.roundedRect(margin, yPos - 3, contentWidth, boxHeight, 2, 2, 'F');

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('IMPORTANT FINDINGS', margin + 5, yPos + 2);
                yPos += 8;

                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                importantToShow.forEach(item => {
                    const textLines = doc.splitTextToSize(`▲ ${item}`, contentWidth - 15);
                    textLines.forEach(line => {
                        doc.text(line, margin + 5, yPos);
                        yPos += 5;
                    });
                    yPos += 1;
                });

                yPos += 5;
                doc.setTextColor(0, 0, 0);
            }

            // ===== PRIORITY STRATEGIES SECTION (BLUE) =====
            // Get selected recommendations, limit to top 8
            const selectedRecs = this.activeRecommendations.filter(rec =>
                this.recommendationEngine.selectedRecommendations.has(rec.id)
            );
            const strategiesToShow = selectedRecs.slice(0, 8);

            if (strategiesToShow.length > 0) {
                // Calculate approximate height needed
                const estimatedHeight = 8 + (strategiesToShow.length * 12);

                doc.setFillColor(59, 130, 246);
                const boxHeight = Math.min(estimatedHeight, pageHeight - yPos - 25); // Leave room for footer
                doc.roundedRect(margin, yPos - 3, contentWidth, boxHeight, 2, 2, 'F');

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('PRIORITY STRATEGIES', margin + 5, yPos + 2);
                yPos += 8;

                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');

                strategiesToShow.forEach((rec, index) => {
                    // Check if we're running out of space
                    if (yPos > pageHeight - 35) {
                        return; // Skip if too close to bottom
                    }

                    // Title
                    doc.setFont(undefined, 'bold');
                    const titleLines = doc.splitTextToSize(`• ${rec.title}`, contentWidth - 15);
                    titleLines.forEach(line => {
                        if (yPos <= pageHeight - 35) {
                            doc.text(line, margin + 5, yPos);
                            yPos += 5;
                        }
                    });

                    // Description (abbreviated if needed)
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(8);
                    const descLines = doc.splitTextToSize(rec.description, contentWidth - 20);
                    // Limit description to 2 lines max per item
                    const limitedDescLines = descLines.slice(0, 2);
                    limitedDescLines.forEach(line => {
                        if (yPos <= pageHeight - 35) {
                            doc.text(line, margin + 10, yPos);
                            yPos += 4;
                        }
                    });

                    yPos += 2;
                    doc.setFontSize(9);
                });

                doc.setTextColor(0, 0, 0);
            } else {
                // No strategies selected
                doc.setFillColor(59, 130, 246);
                doc.roundedRect(margin, yPos - 3, contentWidth, 15, 2, 2, 'F');

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('PRIORITY STRATEGIES', margin + 5, yPos + 2);
                yPos += 8;

                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.text('No strategies selected. Please select recommendations in the assessment.', margin + 5, yPos);

                doc.setTextColor(0, 0, 0);
            }

            // ===== FOOTER =====
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'italic');
            doc.text('For full assessment details, see comprehensive report', pageWidth / 2, pageHeight - 15, { align: 'center' });

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, pageHeight - 8);
            doc.text('© D.Downes 2025 - For Educational Use Only', pageWidth / 2, pageHeight - 8, { align: 'center' });

            // Save the PDF
            const fileName = `VI-Quick-Reference-${this.state.studentInfo.studentName.replace(/\s+/g, '-') || 'Summary'}-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            alert('Quick Reference PDF Generated Successfully!\n\nA one-page intervention summary has been downloaded to your device.');
            console.log('Quick reference PDF generated successfully');

        } catch (error) {
            console.error('Error generating quick reference PDF:', error);
            alert('Error generating quick reference PDF. Please try again or contact support if the problem persists.');
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
        // Scroll with offset for visual spacing
        const yOffset = -20;
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;

        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });
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
                // Scroll to section with small offset for visual spacing
                const yOffset = -20; // Small offset to show section clearly
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
        this.textColorSelect = document.getElementById('text-color'); // Fixed: HTML uses 'text-color' not 'text-colour'

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
        // Validation: Ensure reading time is reasonable
        if (this.currentTest.readingTime < 5) {
            console.error('Reading time too short - test may not have been completed properly');
            alert('The reading time seems too short. Please ensure the student reads the entire passage before clicking "Finish Reading".');
            return;
        }

        // Calculate words per minute
        const wpm = Math.round((this.currentTest.wordCount / this.currentTest.readingTime) * 60);

        // Sanity checks for WPM
        if (wpm > 400) {
            console.warn(`Unusually high reading speed detected (${wpm} WPM) - please verify timer accuracy`);
            alert(`Warning: The calculated reading speed (${wpm} WPM) is unusually high. Please verify the test was conducted correctly. Average reading speeds:\n• Age 7-9: 80-120 WPM\n• Age 10-12: 120-180 WPM\n• Age 13+: 150-250 WPM\n\nThe results have been saved, but please review them carefully.`);
        }

        if (wpm < 20 && this.currentTest.wordCount > 50) {
            console.warn(`Unusually low reading speed detected (${wpm} WPM) - student may need different text level`);
        }

        // Calculate comprehension accuracy
        const totalQuestions = this.passages[this.currentTest.passageId].questions.length;
        const accuracy = Math.round((this.currentTest.correctAnswers / totalQuestions) * 100);
        const errors = totalQuestions - this.currentTest.correctAnswers;

        const result = {
            time: this.currentTest.readingTime,
            wpm: wpm,
            errors: errors, // Comprehension errors (incorrect answers)
            accuracy: accuracy,
            wordCount: this.currentTest.wordCount,
            comprehensionScore: this.currentTest.correctAnswers,
            comprehensionTotal: totalQuestions
        };

        // Store result
        if (this.currentTest.type === 'standard') {
            this.results.standard = result;
        } else {
            this.results.modified = result;
        }

        console.log(`Reading test results calculated:`, result);
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
