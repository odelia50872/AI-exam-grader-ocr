# 🎓 ExamLens – AI-Powered Exam Grading & OCR Platform

An intelligent, automated exam assessment system that uses **Google Gemini Vision** to grade student code submissions, extract handwritten/typed text via high-precision OCR, and provide fair, itemized evaluation feedback.

---

## ✨ Key Features

- **High-Precision Multimodal OCR:** Reads handwritten and typed code directly from PDF files or image scans.
- **Fair & Autonomous Grading:** Evaluates student solutions against core programming logic while applying light penalties for minor syntax typos.
- **Itemized Feedback Breakdown:** Categorizes deductions clearly into syntax/typos and logical flaws.
- **Visual Bounding Boxes:** Highlights recognized words and code blocks directly on the scanned document.
- **Clean & Modern UI:** A minimalist drag-and-drop interface designed for effortless grading.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend Services:** Node.js / Express, Python (EasyOCR / Vision Pipeline)
- **AI Engine:** Google Gemini API (`gemini-1.5-flash` / `gemini-1.5-pro`)

---

## 🚀 Quick Start (Run Locally)

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Python** (v3.9 or higher, required for local OCR service)
- **Gemini API Key** (Obtain one from [Google AI Studio](https://aistudio.google.com/))

---

