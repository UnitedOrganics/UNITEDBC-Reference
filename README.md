# UNITEDBC-Reference

A sanitized public reference repository for the **LDWPowerPagesCart** Power Platform solution — a Business Central–integrated e-commerce portal built on Microsoft Power Pages and Dataverse.

> **This repository is a sanitized reference mirror.**  
> Environment variables and connection references are intentionally excluded.  
> All environment-specific identifiers (site instance GUIDs, tenant identifiers, sandbox URLs) have been replaced with `<SANITIZED_GUID>` or `<SANITIZED_URL>` placeholders.

---

## Technology Stack

| Layer | Technology |
|---|---|
| ERP / Back-end | Microsoft Dynamics 365 Business Central |
| Portal / Front-end | Microsoft Power Pages (Bootstrap 5) |
| Data platform | Microsoft Dataverse |
| Integration flows | Power Automate (cloud flows) |
| Source control | PAC CLI (Power Platform CLI) YAML export |
| Solution publisher | `ldw` (prefix `ldw_`, option prefix `85231`) |

---

## Architecture Summary

The solution implements a B2B self-service ordering portal that connects a Power Pages site to Dynamics 365 Business Central via Power Automate flows and the Business Central OData v4 API.

```
Customer Browser
      │
      ▼
Power Pages Site (UnitedinBC)
      │  Web API (Dataverse)
      ▼
Dataverse Tables (Cart, CartLine2, CatalogItem, CheckoutRequest, PublicPrice, …)
      │  Power Automate Flows
      ▼
Business Central API (Items, Prices, Sales Orders)
```

**Key solution components:**

- **9 custom Dataverse tables** — cart management, catalogue, pricing, checkout
- **5 standard tables referenced** — Contact, Product, PriceLevel, BC Item (virtual), TransactionCurrency
- **3 Power Automate flows** — Checkout flow, Checkout Processing flow, Catalogue Nightly Fill
- **1 Power Pages site** — `UnitedinBC` with Bootstrap 5, Web API, role-based table permissions
- **3 global option sets** — portal status and behaviour flags
- **2 environment variables** — BC Base URL, Portal Base URL (values excluded from this repo)
- **2 connection references** — Dataverse connector, Business Central connector (excluded from this repo)

---

## Repository Structure

```
UNITEDBC-Reference/
├── docs/                          Architecture and reference documentation
│   ├── Architecture.md
│   ├── DataModel.md
│   ├── Flows.md
│   ├── PowerPages.md
│   ├── BCIntegration.md
│   ├── Decisions.md
│   ├── Roadmap.md
│   └── README.md
└── UNITEDBC/
    └── LDWPowerPagesCart/
        ├── entities/              14 Dataverse table definitions
        ├── entityrelationships/   64 relationship definitions
        ├── optionsets/            3 global option sets
        ├── powerpagesites/        Full Power Pages site export
        └── solutions/             Solution manifest and component registry
```

**Intentionally excluded:**

| Folder | Reason |
|---|---|
| `connectionreferences/` | Connector logical names and environment-bound identifiers |
| `environmentvariabledefinitions/` | Contains sandbox URLs and tenant-specific values |
| `modernflows/` | Flow JSON files contain hardcoded Dataverse org endpoint |
| `publishers/` | Internal publisher metadata |

---

## Solution Identity

| Property | Value |
|---|---|
| Solution unique name | `LDWPowerPagesCart` |
| Solution display name | `UNITEDBC Portal` |
| Version | `1.0.0.0` |
| Publisher prefix | `ldw` |
| Solution type | Unmanaged |
| PAC CLI version | 9.2.26062.135 |

---

## Documentation

See the [`docs/`](./docs/README.md) folder for architecture diagrams, data model reference, flow documentation, Power Pages analysis, Business Central integration notes, design decisions, and roadmap.
