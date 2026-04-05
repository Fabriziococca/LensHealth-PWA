# LensHealth-PWA: Contact Lenses Time Tracker

A lightweight, Offline-First Progressive Web App (PWA) designed to track contact lens usage and manage ocular health supplies. Built with vanilla web technologies to eliminate the friction and privacy concerns of commercial apps.

## 🚀 Features

* **Real-time Usage Tracking:** Dynamic "Fatigue Ring" UI that provides visual feedback based on elapsed time (Green < 6h, Yellow < 8h, Red > 8h).
* **Supply Lifecycle Management:** Tracks the opening dates of both the lenses and the cleaning solution, calculating the remaining safe-usage days.
* **Session History:** Maintains a local log of the last 7 usage sessions.
* **Zero Friction UX:** "One-tap" start/stop functionality, eliminating complex navigation.
* **Privacy-First:** 100% client-side operation. All data is persisted exclusively via `localStorage`.
* **Push Notifications:** Alerts the user after 8 hours of continuous wear (Browser Notification API).

## 🛠️ Tech Stack & Architecture

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Architecture:** Serverless, Single Page Application (SPA).
* **Deployment:** Fully hosted on GitHub Pages via static CDN.
* **PWA Capabilities:** Configured with `manifest.json` for standalone installation on iOS and Android devices, ensuring offline availability.

## 💡 Motivation

Developed to solve a personal pain point: the mental overhead of tracking contact lens wear time and supply expiration dates. Commercial alternatives often include ads or require paid subscriptions for basic tracking features. This tool provides a professional, ad-free, and private alternative.