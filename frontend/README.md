# Xasread Frontend

An AI-powered medical consultation assistant and medical imaging viewer dashboard. Xasread provides instant clinical analysis, symptoms description processing, and medical image annotating for healthcare professionals, patients, and caregivers.

Designed with modern aesthetics, smooth micro-animations, full responsiveness, and support for light/dark/system themes.

---

## 🚀 Key Features

- **Interactive Consultation Chat**: 
  - Real-time typing indicators and message animation effects.
  - Ability to edit and delete user messages.
  - Multi-level response rephrasing (Simple, Standard, Advanced) on-the-fly.
  - Easy message copy capabilities.
- **Medical Image Viewer**: 
  - Interactive SVG-based canvas visualizing medical scan findings with colored bounding boxes and confidence level indicators.
  - Multi-touch/mouse zoom in, zoom out, and reset fit tools.
- **Dynamic Analysis Panel**:
  - **Clinical View**: Detailed view presenting ICD-10 codes, gradient-based Severity Assessment bar, color-coded Differential Diagnosis listing (Confirmed/High/Moderate/Low), Vitals summary cards, Clinical Assessment narrative, and custom Recommendations.
  - **Simple View**: Simplified summary description, alert items categorizations, and recommended next steps for general users.
- **Settings & Preferences**:
  - Adjust global font size (Small, Medium, Large).
  - Select default AI response complexity (Simple, Standard, Advanced).
  - Customize UI themes (Light, Dark, System-preferred).
- **Authentication**:
  - Sign in via Google Authentication.
  - Full-featured guest session mode with local memory workspace.

---

## 🛠️ Tech Stack

- **Core Framework**: React (v19) + Vite (v8) + TypeScript (v5)
- **Styling**: Pure Vanilla CSS featuring an HSL-based token styling system and seamless dark mode support.
- **Icon Pack**: Lucide React
- **Code Linting**: Oxlint

---

## 📂 Project Structure

```text
frontend/
├── public/                # Static public assets
├── src/
│   ├── components/        # Presentational and Container UI Components
│   │   ├── AIResponse.tsx           # Renders AI messages, images, and panels
│   │   ├── AnalysisPanel.tsx        # Toggleable Clinical/Simple report views
│   │   ├── ConfirmModal.tsx         # Confirmation modal overlays
│   │   ├── FreshBanner.tsx          # Action notification banners
│   │   ├── InputArea.tsx            # Chat message field and file attachments
│   │   ├── LandingPage.tsx          # Landing portal (Auth / Guest selection)
│   │   ├── MedicalImageViewer.tsx   # Interactive scan canvas with bounding boxes
│   │   ├── SettingsPanel.tsx        # Size, theme, and response settings
│   │   ├── Sidebar.tsx              # Conversation history lists and search
│   │   ├── TopHeader.tsx            # Theme toggle and mobile header controls
│   │   ├── TypingIndicator.tsx      # Typing dots animation
│   │   └── UserMessage.tsx          # User bubbles with edit/delete options
│   ├── context/           # React context providers
│   │   ├── AuthContext.tsx          # Auth state (Google token, Guest toggle)
│   │   └── ThemeContext.tsx         # Dark, Light, System themes controller
│   ├── data/              # Mock and template data
│   │   ├── mockResponses.ts         # Mock findings, vitals, and report samples
│   │   └── sampleMessages.ts        # Chat starting prompts
│   ├── hooks/             # Custom React hooks
│   │   └── useMediaQuery.ts         # Query device width dynamically
│   ├── App.tsx            # Core application layout and state router
│   ├── main.tsx           # React DOM bootstrapping
│   ├── types.ts           # Shared TypeScript interfaces & types
│   └── index.css          # Design system stylesheet
├── .gitignore
├── .oxlintrc.json
├── package.json
├── tsconfig.json
└── vite.config.js
```

---

## ⚙️ Getting Started

### 📋 Prerequisites

Make sure you have Node.js (v18+ recommended) and npm installed.

### 🔌 Installation

Clone this repository and run the installation command in the frontend workspace root:

```bash
npm install
```

### ⚡ Development Server

Run the local development server:

```bash
npm run dev
```

The application will be served at `http://localhost:5173`.

### 🏗️ Production Build

Build the optimized production package:

```bash
npm run build
```

Preview the build locally:

```bash
npm run preview
```

### 🧹 Linting

Check code lint status with Oxlint:

```bash
npm run lint
```

---

## 🔒 Security & Compliance

- **HIPAA-Safe Design**: No private health information (PHI) is permanently logged.
- **Encrypted Transmission**: All data transport payloads are processed securely.
- **Session Privacy**: Guest workspaces are isolated locally inside memory and removed upon exit or logout.
