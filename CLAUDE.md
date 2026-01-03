# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm start          # Run development server at localhost:3000
npm test           # Run tests in interactive watch mode
npm run build      # Production build to /build folder
```

## Architecture Overview

This is a React 19 contractor estimator app using Firebase (Firestore + Auth) with Tailwind CSS for styling.

### Core Structure

```
src/
├── App.js                    # Main component - central state management
├── config/firebase.js        # Firebase initialization
├── services/
│   ├── authService.js        # Firebase auth (login/signup/logout)
│   └── estimatorService.js   # Firestore CRUD for estimates
├── constants/estimator.js    # Data templates and defaults
├── utils/estimator.js        # Calculations, formatting, CSV utilities
└── components/
    ├── auth/                 # AuthWrapper, LoginPage
    ├── estimator/            # SectionCard, inputs, modals
    └── ui/                   # Button, Card, Input, Label, Select
```

### State Management

- Local state with React hooks (useState, useEffect, useMemo) in App.js
- No Redux/Context - state flows down via props
- useMemo for expensive calculations (totals, active project)

### Data Flow

1. **Auth**: AuthWrapper monitors Firebase auth state, shows LoginPage or main app
2. **Load**: On mount, fetch from Firebase → fallback to localStorage → create default
3. **Save**: Projects state changes trigger auto-save to Firebase (with localStorage fallback)

### Data Model

**Project** contains: id, name, client info, sections[], rates (tax/overhead/profit/contingency), notes, userId

**Section** contains: id, name, items[], notes

**Item** contains: id, desc, category (materials|labor|subcontract|other), qty, unit, unitCost, taxable

### Firebase Integration

- Collection: "estimates" in Firestore
- Queries by userId, ordered by updatedAt
- `estimatorService` handles all Firestore operations
- `authService` handles email/password authentication

### UI Patterns

- Tailwind utility classes throughout
- Custom lightweight UI components (no component library)
- lucide-react for icons
- Button variants: default (blue), secondary, destructive, outline, ghost

### Key Utilities (src/utils/estimator.js)

- `uuid()` - Generate unique IDs
- `money(n)` - Format as USD currency
- `calcTotals(project)` - Calculate all totals with tax/overhead/profit/contingency
- `parseCurrency(str)` - Extract number from currency string
- CSV import/export functions
