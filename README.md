# PSD2 Open Banking API Compliance Dashboard

[![Live Demo](https://img.shields.io/badge/Live%20Demo-🚀%20View%20Dashboard-6366F1?style=for-the-badge)](https://psd2-compliance-dashboard.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Berlin Group](https://img.shields.io/badge/Berlin%20Group-NextGenPSD2%20v1.3-818CF8?style=for-the-badge)](https://www.berlin-group.org/)
[![License](https://img.shields.io/badge/License-MIT-34D399?style=for-the-badge)](LICENSE)

> **Interactive compliance monitoring platform** for PSD2 Open Banking API implementations — tracking Berlin Group NextGenPSD2 endpoints, consent lifecycle management, SCA authentication flows, and regulatory readiness across multi-entity European operations.

---

## 🎯 Project Context

Financial institutions operating in the European Economic Area must comply with **PSD2 (Payment Services Directive 2)** by exposing standardized Open Banking APIs to licensed Third-Party Providers (TPPs). This dashboard was built to demonstrate end-to-end product management of a PSD2 compliance program, including:

- **13 Berlin Group NextGenPSD2 endpoints** across AIS, PIS, and PIIS service groups
- **LuxHub ASPSP gateway integration** for multi-bank connectivity
- **Strong Customer Authentication (SCA)** with device binding and dynamic linking
- **Multi-entity regulatory alignment** across CSSF (Luxembourg) and CBI (Ireland) jurisdictions
- **Consent lifecycle management** with 90-day validity, revocation, and re-authentication

This project reflects real-world experience leading PSD2 Open Banking implementation programs for European financial operations, including architecture reviews, compliance gap analysis, and go-live readiness tracking.

---

## 🖥️ Live Dashboard

**🔗 [psd2-compliance-dashboard.vercel.app](https://psd2-compliance-dashboard.vercel.app)**

| Tab | What It Shows |
|-----|---------------|
| **Overview** | KPI scorecards (compliance %, regulatory readiness, latency, uptime), endpoint status breakdown by service group, phased implementation timeline |
| **API Endpoints** | All 13 Berlin Group endpoints with filterable views by group (AIS/PIS/PIIS) and status — click any row to expand latency, uptime, priority, and SCA details |
| **Consent Lifecycle** | Interactive 6-stage consent flow simulation (Request → Redirect → SCA → Authorised → Active → Expired) with auto-play and stage-specific API call details |
| **SCA Flows** | Three authentication approaches (Redirect/OAuth2, Decoupled, Embedded) with security strength ratings and PSD2 factor requirements (Knowledge, Possession, Inherence) |
| **Compliance Matrix** | 20 regulatory checks across 4 compliance areas with per-section progress tracking and status indicators |

---

## 📊 Key Metrics Tracked

| Metric | Current | Target |
|--------|---------|--------|
| API Compliance | 69% (9/13 endpoints) | 100% at go-live |
| Regulatory Readiness | 80% (16/20 checks) | 100% at go-live |
| Avg API Latency | 148ms | < 500ms (Berlin Group SLA) |
| Platform Uptime | 99.97% | ≥ 99.95% |

---

## 🏗️ Architecture & Technical Scope

### Service Groups

```
┌─────────────────────────────────────────────────────────┐
│                    ASPSP (Bank)                          │
│                                                         │
│   ┌──────────┐    ┌──────────┐    ┌──────────────┐     │
│   │   AIS    │    │   PIS    │    │    PIIS      │     │
│   │ Account  │    │ Payment  │    │    Funds     │     │
│   │ Info     │    │ Init     │    │ Confirmation │     │
│   │ Service  │    │ Service  │    │   Service    │     │
│   │          │    │          │    │              │     │
│   │ 7 EPs    │    │ 4 EPs    │    │   2 EPs     │     │
│   │ 7/7 ✅   │    │ 2/4 🟡   │    │   0/2 🟡    │     │
│   └────┬─────┘    └────┬─────┘    └──────┬───────┘     │
│        │               │                 │              │
│        └───────────────┼─────────────────┘              │
│                        │                                │
│              ┌─────────▼──────────┐                     │
│              │   LuxHub Gateway   │                     │
│              │   (ASPSP Proxy)    │                     │
│              └─────────┬──────────┘                     │
└────────────────────────┼────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   TPP Application   │
              │  (Third-Party       │
              │   Provider)         │
              └─────────────────────┘
```

### Berlin Group NextGenPSD2 Endpoints

| # | Endpoint | Group | Status | Entity |
|---|----------|-------|--------|--------|
| 1 | `GET /accounts` | AIS | ✅ Compliant | LU |
| 2 | `GET /accounts/{id}` | AIS | ✅ Compliant | LU |
| 3 | `GET /accounts/{id}/balances` | AIS | ✅ Compliant | LU |
| 4 | `GET /accounts/{id}/transactions` | AIS | ✅ Compliant | LU |
| 5 | `POST /payments/sepa-credit-transfers` | PIS | ✅ Compliant | LU |
| 6 | `GET /payments/{paymentId}/status` | PIS | ✅ Compliant | LU |
| 7 | `DELETE /payments/{paymentId}` | PIS | 🟡 In Progress | LU |
| 8 | `POST /consents` | AIS | ✅ Compliant | LU |
| 9 | `GET /consents/{consentId}` | AIS | ✅ Compliant | LU |
| 10 | `DELETE /consents/{consentId}` | AIS | ✅ Compliant | LU |
| 11 | `POST /signing-baskets` | PIS | ⬜ Planned | IE |
| 12 | `POST /funds-confirmations` | PIIS | 🟡 In Progress | LU |
| 13 | `GET /card-accounts` | AIS | ⬜ Planned | IE |

---

## 🔐 Consent Lifecycle & SCA

### Consent Flow (6 Stages)

```
 ┌──────────┐    ┌──────────┐    ┌──────────┐
 │ Consent  │───▶│   PSU    │───▶│   SCA    │
 │ Request  │    │ Redirect │    │Challenge │
 │ POST     │    │ OAuth2   │    │ 2-Factor │
 └──────────┘    └──────────┘    └────┬─────┘
                                      │
 ┌──────────┐    ┌──────────┐    ┌────▼─────┐
 │ Expired/ │◀───│  Data    │◀───│ Consent  │
 │ Revoked  │    │  Access  │    │Authorised│
 │ 90 days  │    │ 4x/day   │    │  Valid   │
 └──────────┘    └──────────┘    └──────────┘
```

### SCA Authentication Models

| Approach | Flow | Security | Recommended |
|----------|------|----------|-------------|
| **Redirect (OAuth2)** | PSU redirected to ASPSP portal | High | ✅ Yes |
| **Decoupled** | Push notification to PSU device | High | ✅ Yes |
| **Embedded** | TPP collects and forwards credentials | Medium | ⚠️ No |

### PSD2 SCA Requirements
- **Two-factor minimum**: Knowledge + Possession, Knowledge + Inherence, or Possession + Inherence
- **Dynamic linking**: Payment amount and payee bound to authentication code
- **Exemptions**: Trusted beneficiaries, low-value (< €30), recurring same-amount payments
- **Device binding**: SCA factors bound to registered PSU device

---

## 📋 Compliance Matrix

| Area | Complete | Status |
|------|----------|--------|
| Consent Management | 5/5 | ✅ 100% |
| Strong Customer Authentication | 4/5 | 🟡 80% — Device binding in progress |
| API Standards | 3/5 | 🟡 60% — Payment cancellation, PIIS in progress |
| Regulatory & Operational | 4/5 | 🟡 80% — CBI (Ireland) alignment planned |
| **Overall** | **16/20** | **80%** |

---

## 🗓️ Implementation Roadmap

| Phase | Timeline | Status | Deliverables |
|-------|----------|--------|--------------|
| **Phase 1 — Foundation** | Oct–Dec 2025 | ✅ Complete | LuxHub connectivity, consent APIs, AIS endpoints |
| **Phase 2 — Payments** | Jan–Feb 2026 | ✅ Complete | PIS initiation, status tracking, SCA integration |
| **Phase 3 — Compliance** | Mar 2026 | 🟡 In Progress | Payment cancellation, PIIS, device binding |
| **Phase 4 — Go-Live** | Apr 2026 | ⬜ Planned | Production deployment, regulatory sign-off, monitoring |
| **Phase 5 — Ireland** | Q3 2026 | ⬜ Planned | CBI entity, card accounts, signing baskets |

---

## 🛠️ Technical Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | JavaScript (React) |
| **Styling** | Inline CSS with CSS animations |
| **Typography** | DM Sans + JetBrains Mono |
| **Charts** | Custom SVG progress rings |
| **Deployment** | Vercel (Production) |
| **Version Control** | GitHub |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Abayommy/psd2-compliance-dashboard.git

# Navigate to project
cd psd2-compliance-dashboard

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 💼 Skills Demonstrated

- **Regulatory Compliance**: PSD2 RTS, Berlin Group NextGenPSD2, CSSF/CBI regulatory frameworks, eIDAS certificate validation
- **API Platform Management**: REST API lifecycle, endpoint specification, SLA monitoring, versioning strategy
- **Authentication & Security**: OAuth2 redirect flows, Strong Customer Authentication, device binding, dynamic linking
- **Consent Management**: TPP consent lifecycle, 90-day validity enforcement, revocation handling, access frequency limits
- **Multi-Entity Operations**: Cross-jurisdictional regulatory alignment (Luxembourg/Ireland), multi-gateway architecture
- **Program Delivery**: Phased implementation roadmap, compliance gap tracking, go-live readiness assessment
- **Technical Communication**: Interactive data visualization, stakeholder-ready dashboards, regulatory status reporting

---

## 👤 About

**Abayomi Ajayi** — Senior Technical Product Manager

11+ years in financial services | PSD2 & Open Banking | API Platform Strategy | Treasury Modernization

- 🔗 [LinkedIn](http://linkedin.com/in/abayomi-a-5a77431b4)
- 💻 [GitHub](https://github.com/Abayommy)
- 🌐 [Portfolio](https://corebank-demo.vercel.app/)

---

## 📂 Related Projects

| Project | Description | Link |
|---------|-------------|------|
| **CoreBank Payment Gateway** | Enterprise payment platform with interactive wire transfer simulation | [Live Demo](https://corebank-demo.vercel.app) |
| **Open Banking Consent Hub** | PSD2 consent management simulator with PSP, AIS, PIS flows | [GitHub](https://github.com/Abayommy/open-banking-consent-hub) |
| **S/4HANA Migration Dashboard** | Enterprise migration readiness assessment tool | [GitHub](https://github.com/Abayommy/s4hana-migration-dashboard) |

---

⭐ **If this project demonstrates the regulatory and API platform expertise you're looking for, please star the repository!**

> *Built to demonstrate real-world PSD2 Open Banking compliance program management — from Berlin Group API specifications to multi-entity regulatory go-live.*
