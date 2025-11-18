# Ocular Vision Assessment Tool

## Educational Assessment Tool for QTVIs

A professional web application for Qualified Teachers of the Visually Impaired (QTVIs) to complete structured ocular assessments and generate educational reports.

> **IMPORTANT**: This is an **educational tool**, not a medical diagnostic tool. All language and recommendations focus on learning, classroom strategies, and social inclusion.

---

## Phase 1 Features ✓

### Student Information
- Student name, date of birth, year group
- Assessment date (defaults to today)
- Assessor name
- Auto-save to IndexedDB

### SEE IT - Visual Clarity Assessment
- **Distance Visual Acuity**: 6/6 to NPL (No Perception of Light)
- **Near Visual Acuity**: N5 to N48, with distance tested
- **Contrast Sensitivity**: Normal to severely reduced
- **Light Sensitivity/Preference**: Multiple options with checkboxes
- Optional notes for each assessment area

### Live Preview Panel
- Real-time student information display
- Progress tracking for each section
- Visual completion indicators
- Auto-save status
- Generate Report button (activates when minimum data entered)

### User Experience
- **Off-white background** (#F8F9FA) with white cards
- **Card-based interface** with subtle shadows
- **Professional color scheme**: Deep blue primary, teal accents
- **Visual feedback**: Green checkmarks for completed fields
- **Smooth transitions** and hover effects
- **Accessible**: WCAG 2.1 AA compliant, keyboard navigable
- **Mobile responsive**: Works on tablets and desktop

---

## Technical Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern Grid/Flexbox layout, CSS custom properties
- **Vanilla JavaScript (ES6+)**: No frameworks
- **IndexedDB**: Client-side storage with auto-save
- **Progressive Enhancement**: Works offline (service worker in future phase)

---

## Getting Started

### Installation

Simply open `index.html` in a modern web browser.

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### Browser Requirements

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any browser with IndexedDB support

---

## Project Structure

```
VI-Classroom-Insights/
├── index.html          # Main HTML structure
├── styles.css          # Professional styling
├── app.js             # Application logic & IndexedDB
└── README.md          # This file
```

---

## Usage

1. **Enter Student Information**: All fields are required and auto-save as you type
2. **Complete SEE IT Assessment**: Select values for each visual clarity measure
3. **Add Optional Notes**: Click "+ Optional notes" to expand note fields
4. **Track Progress**: Watch the live preview panel update in real-time
5. **Generate Report**: Button activates when minimum required data is entered

### Auto-Save

All changes are automatically saved to IndexedDB after 500ms of inactivity. The status indicator shows:
- 💾 "Saving..." - Changes are being saved
- 💾 "Changes saved automatically" - All changes saved successfully

### Keyboard Navigation

- `Tab` - Navigate between fields
- `Space/Enter` - Select dropdowns and checkboxes
- All interactive elements have visible focus indicators

---

## Future Phases

### Phase 2
- **FIND IT** section (visual scanning, fields, reading position)
- **USE IT** section (color vision, functional vision)
- Auto-text generation (educational recommendations)

### Phase 3
- PDF report generation
- Vision simulation engine
- Before/after comparison

### Phase 4
- Reading assessment module
- Multiple assessment storage
- Export/import functionality

---

## Design Philosophy

### Educational Focus
All language focuses on **learning impact** and **classroom strategies**, not medical diagnosis:
- ✓ "Student may benefit from enlarged text"
- ✗ "Patient requires medical intervention"

### Accessibility First
- High contrast ratios (WCAG AA)
- Large touch targets (44x44px minimum)
- Keyboard navigable
- Screen reader friendly with ARIA labels

### Professional Aesthetic
- Clean, modern card-based design
- Generous white space
- Clear visual hierarchy
- Subtle, professional shadows
- Smooth, purposeful animations

---

## Browser Storage

Data is stored locally in your browser using IndexedDB:
- Database: `OcularAssessments`
- Object Store: `assessments`
- Current assessment ID: `current`

To clear stored data:
1. Open browser DevTools (F12)
2. Go to Application > Storage > IndexedDB
3. Delete `OcularAssessments` database

---

## Development

### Code Style
- ES6+ JavaScript with async/await
- CSS custom properties for theming
- Semantic HTML5 elements
- Progressive enhancement approach

### Performance
- Debounced auto-save (500ms delay)
- Efficient DOM updates
- Minimal external dependencies
- Fast initial load

---

## License

Educational use only. Created for QTVIs to support students with visual impairments.

---

## Credits

Built with care for educators supporting students with visual impairments.

**Version**: 1.0.0 (Phase 1)
**Last Updated**: 2025-11-18
