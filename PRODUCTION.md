# Production Deployment Protocol — TM Sovereign Offline Wallet v1.0

This guide outlines the complete production-readiness configuration, deployment pipeline, and architectural verification steps for the **Technology Money (TM) Sovereign Offline Wallet v1.0**, also known as **Kas Bantuan Peradaban**. This platform serves as a production-grade Proof of Concept (PoC) for off-grid P2P double-spending mitigation.

---

## 🏛️ System Core Architecture

The Sovereign Offline Wallet maintains transactional integrity through three decoupled security layers:
1. **Sovereign Local Identity (IID-I):** Instantiates a secure asymmetric cryptographic pair using curve key definitions (**SECP256K1**) inside standard hardware device enclaves. No global servers are involved in generating this keypair.
2. **Local Cryptographic Envelopes:** Every transaction payload compiles standard signature hashes (**SHA-256**) signed via ECDSA, ensuring absolute peer authorization off-grid.
3. **Sequential Hash Chaining:** Successive transactions embed prior verification hashes, establishing an unforgeable chronological lineage locally on each node's SQLite state representation.

---

## 📦 PWA Configuration for One-Click Distribution

To meet production benchmarks, the application serves as an installable standalone Progressive Web App (PWA). This bypasses traditional App Store/Google Play bottlenecks, allowing rural families to distribute the applet with one click.

### service worker (`/sw.js`)
* Serves as the localized proxy cache.
* Forces local network assets (CSS, JS, Fonts) to resolve from Cache Storage first, ensuring 100% offline uptime.
* Automatically integrates the background storage sync protocol to process transactions immediately when an active internet link re-establishes.

### manifest (`/manifest.json`)
* Declares `display: "standalone"` to hide browser chrome and render as a native smartphone application.
* Standardizes high-contrast branding identifiers across devices.

---

## 🚀 Building & Shipping to Production

Follow these steps to package, compile, and run the system behind standard web containers.

### 1. Verification of Prerequisites
Deployments require Node.js >= 18. Compile stages assume modern bundlers such as Vite and esbuild.

```bash
# Verify environment dependencies
node -v
npm -v
```

### 2. Sandbox Compiling
Ensure no leftover TypeScript warnings or syntax errors exist:

```bash
# Clean install and lint check
npm install
npm run lint
```

### 3. Build & Minification
To build the static React build artifact:

```bash
npm run build
```
This minifies CSS, bundles component packages, strips type interfaces, and places optimized distribution payloads in `/dist`.

### 4. Direct Node Execution
To run the production build locally:

```bash
npm run start
```
By default, the server binds to port `3000` on interface `0.0.0.0` inside container enclaves.

---

## 🔒 Security Auditing & Double-Spending Mitigation

In disconnected territories, preventing duplicate asset spending is achieved through the following mitigation matrices:
* **Peer Trust scorecards:** Devices retain offline sequence logs in local databases.
* **Biometric Hardware Lockouts:** The physical Trusted Execution Environment (TEE) must match fingerprint indicators locally before private keys can be accessed.
* **Global Blockchain Resolve:** Once nodes touch a cell-tower or internet network again, local queues automatically stream to **sync.neurosphere.world** for final validation and processing.

---

## 🌍 Technology for Good
This project is dedicated to the advancement of human civilization, social dignity, and the distribution of Swadaya Kebaikan. 

> *"Technology is at its finest when it empowers the most vulnerable."* — Greetings from Technology for Good (KINDNESS Civilization).
