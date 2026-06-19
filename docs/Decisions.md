# Design Decisions — LDWPowerPagesCart

This document records key architecture and design decisions made during the development of the LDWPowerPagesCart solution.

---

## ADR-001 — Use PAC CLI YAML export for source control

**Status:** Accepted  
**Date:** 2025

**Context:** Power Platform solutions need to be version-controlled. Options include: managed/unmanaged solution ZIP files, PAC CLI YAML export, or manual scripting.

**Decision:** Use PAC CLI (`pac solution clone`) to export solution as unpacked YAML/JSON files, committed to Azure DevOps Git.

**Consequences:**
- Human-readable diffs for all entity, flow, and portal changes
- Environment-specific values (URLs, GUIDs) are present in the export and must be managed separately via environment variables
- `connectionreferences/` and `environmentvariabledefinitions/` contain deployment-specific data and must be handled carefully in public repositories

---

## ADR-002 — CartLine2 replaces CartLine

**Status:** Accepted

**Context:** An initial `ldw_cartline` entity was created but had structural limitations for the required Web API operations.

**Decision:** A second entity `ldw_cartline2` was created as the production cart line table. `ldw_cartline` remains in the solution for backward compatibility but is not used in the portal.

**Consequences:** Two cart line entities exist in the solution. New development should use `ldw_cartline2` exclusively.

---

## ADR-003 — Environment variables abstract all environment-specific endpoints

**Status:** Accepted

**Context:** The BC API endpoint, portal URL, and price source setting differ between sandbox and production environments.

**Decision:** All environment-specific values are stored as Power Platform environment variables (`ldw_BCBaseURL`, `ldw_PortalBaseURL`, `ldw_PriceSource`, `ldw_UseVirtualTables`). No hardcoded URLs in solution logic (portal pages, option sets, or entity definitions).

**Consequences:**
- Clean solution import across environments
- Environment variable definitions are excluded from the public reference repository since the default values reference the sandbox environment
- Power Automate flows use the environment variable values at runtime

---

## ADR-004 — Virtual tables vs cached tables for BC items

**Status:** Active decision  
**Toggle:** `ldw_UseVirtualTables` environment variable

**Context:** BC items can be surfaced in the portal either as a virtual table (`dyn365bc_item_v2_0`) with real-time BC data, or as cached `ldw_catalogitem` records synced nightly.

**Decision:** Both approaches are implemented and switchable via the `ldw_UseVirtualTables` environment variable (default: `yes` = virtual tables).

**Consequences:**
- Virtual tables provide real-time data but depend on active BC connection
- Cached catalogue (`ldw_catalogitem`) provides resilience if BC is offline
- CatalogueNightlyFill flow maintains the cached copy regardless of the setting

---

## ADR-005 — Two-step checkout (flow trigger + processing flow)

**Status:** Accepted

**Context:** Checkout involves user-facing latency (portal waits for BC API response) and background processing (order creation in BC).

**Decision:** Split checkout into two flows:
1. **Checkout flow** — fast, creates `ldw_checkoutrequest` and returns immediately to the portal
2. **Checkout Processing flow** — triggered by the checkout request record, handles all BC API calls asynchronously

**Consequences:**
- Portal receives an immediate acknowledgement
- BC order creation runs asynchronously
- Portal must poll or re-query `ldw_checkoutrequest.ldw_bcordernumber` to display the BC order number

---

## ADR-006 — Web category mapping via ldw_bcwebcategorymap

**Status:** Accepted

**Context:** BC item categories do not directly map to the portal's department/category hierarchy.

**Decision:** A dedicated mapping table `ldw_bcwebcategorymap` stores the relationship between BC item category codes and portal `ldw_webdepartment1` / `ldw_webcategory1` records.

**Consequences:**
- BC category changes require mapping updates in Dataverse
- CatalogueNightlyFill maintains these mappings

---

## Open Decisions

| ID | Question | Status |
|---|---|---|
| OD-001 | Should `ldw_cartline` be removed from the solution? | Under review |
| OD-002 | Production OAuth provider — Microsoft only, or also social providers? | Pending |
| OD-003 | Should the CatalogueNightlyFill run more frequently (e.g., hourly)? | Pending |
