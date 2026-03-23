# SORA v2.5 UAV Certification Tool

A browser-based tool for completing a JARUS SORA v2.5 specific operations risk assessment. Built with React + Vite. No backend required — all data is saved to `localStorage` in the browser.

## Features

- **Phase 1 – UA Definition** — aircraft type, MTOM, characteristic dimension, max speed, altitude, regulatory scope
- **Phase 2 – Mission Parameters** — iGRC derivation, AEC/airspace selection, CV/GRB calculator (ballistic and parachute drift modes)
- **Phase 3 – Mitigations & SAIL** — M1(A/B/C) and M2 mitigation selection with EASA MOC Light-UAS.2512-01 reference, SAIL auto-derivation
- **Phase 4 – Compliance**
  - OSO tracker (all 17 OSOs with MoC guidance and evidence tracking)
  - GRC mitigation evidence tracker
  - OSO#04 ADS compliance matrix (CS-LURS, CS-LUAS, SC Light-UAS, SC-VTOL, STANAG 4671, ASTM F3298) with multi-select
  - CSP export (preview + CSV download)

## Quick start (local)

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Build for production / GitHub Pages

```bash
npm run build
```

Output goes to `dist/`. Upload the contents of `dist/` to any static host, or use GitHub Pages (see below).

## Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. The included workflow (`.github/workflows/deploy.yml`) will build and deploy automatically on every push to `main`

Your tool will be live at `https://<your-username>.github.io/<repo-name>/`

## Data persistence

All data is saved automatically to `localStorage` in the browser. No account or server needed. To transfer data between machines, use the **CSP Export → Download CSV** button.

## References

- [JARUS SORA v2.5 Main Body (JAR-doc-25)](http://jarus-rpas.org/publications/)
- [JARUS SORA Annex A (JAR-doc-26) — CV/GRB](http://jarus-rpas.org/publications/)
- [JARUS SORA Annex B (JAR-doc-27) — Mitigations](http://jarus-rpas.org/publications/)
- [JARUS SORA Annex E (JAR-doc-28) — OSO criteria](http://jarus-rpas.org/publications/)
- [EASA MOC Light-UAS.2512-01 — M2 Medium Robustness](https://www.easa.europa.eu/sites/default/files/dfu/Means_of_compliance_for_mitigation_means_M2_adopted.pdf)
- [EASA SC Light-UAS Medium Risk](https://www.easa.europa.eu/en/special-condition-sc-light-uas-medium-risk)
- [JARUS CS-LURS (JAR-doc-01)](http://jarus-rpas.org/wp-content/uploads/2023/06/jar_01_doc_CS_LURS.pdf)
- [JARUS CS-LUAS (JAR-doc-05/07)](http://jarus-rpas.org/wp-content/uploads/2023/06/jar_07_doc_CS_LUAS.pdf)
