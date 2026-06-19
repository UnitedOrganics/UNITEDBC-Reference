# Power Automate Flows — LDWPowerPagesCart

> **Note:** Flow JSON source files (`modernflows/`) are excluded from this reference repository because they contain hardcoded Dataverse environment org URLs. The flow logic is documented here for reference.

## Flow Inventory

| Flow Name | GUID | Trigger | Connectors |
|---|---|---|---|
| Checkout flow (Power Automate) | `a918643d-618c-f011-b4cb-7ced8d330a7e` | HTTP / manual (called from portal) | Dataverse, Business Central |
| Checkout Processing Flow | `0299a8be-904e-f111-bec6-6045bdc46c25` | Dataverse row change (`ldw_checkoutrequest`) | Dataverse, Business Central |
| CatalogueNightlyFill | `df961fcb-8526-f111-88b4-6045bde5f52c` | Scheduled (nightly) | Dataverse |

All flows are in **StateCode: 1 / StatusCode: 2** (Active) in the solution export.  
All flows run as **Run As: Owner** (`RunAs: 1`), scope: Organisation (`Scope: 4`).

---

## Checkout Flow

**Purpose:** Entry point for checkout initiated from the portal. Receives a cart ID, reads the cart and line items, retrieves the contact, and creates a `ldw_checkoutrequest` record to hand off to the processing flow.

**Trigger:** HTTP POST from the Power Pages portal (manual trigger with JSON body containing `cartId`).

**Logic summary:**
1. Receive `cartId` from portal
2. Query `ldw_cartline2s` filtered by `_ldw_cart_value eq @{cartId}`
3. Get cart record by ID from Dataverse
4. Get contact record from `_ldw_contact_value` on the cart
5. Create `ldw_checkoutrequest` record linking to the cart
6. Return response to portal

**Connection references used:**
- `ldw_sharedcommondataserviceforapps_c4350` (Dataverse)
- `ldw_shareddynamicssmbsaas_840aa` (Business Central)

---

## Checkout Processing Flow

**Purpose:** Processes a submitted `ldw_checkoutrequest` record into a Business Central sales order.

**Trigger:** Dataverse — when a `ldw_checkoutrequest` row is created or when status changes to Pending.

**Logic summary:**
1. Get the `ldw_checkoutrequest` record
2. Get the associated `ldw_cart` record
3. Get all `ldw_cartline2` records for the cart
4. Get the contact from the cart
5. Call Business Central API to create a sales order header
6. Create sales order lines in BC for each cart line
7. Write BC order number back to `ldw_checkoutrequest.ldw_bcordernumber`
8. Update checkout request status to Completed (or Failed with error message)

**Connection references used:**
- `ldw_sharedcommondataserviceforapps_c4350` (Dataverse)
- `ldw_shareddynamicssmbsaas_840aa` (Business Central)

---

## Catalogue Nightly Fill

**Purpose:** Scheduled synchronisation that pulls item and pricing data from Business Central into Dataverse catalogue tables.

**Trigger:** Recurrence schedule (nightly).

**Logic summary:**
1. Query BC API for published items
2. Upsert `ldw_catalogitem` records using `ldw_itemno` alternate key
3. Query BC price lists
4. Upsert `ldw_publicprice` records
5. Optionally sync category mappings into `ldw_bcwebcategorymap`

**Connection references used:**
- `ldw_sharedcommondataserviceforapps_c4350` (Dataverse)

---

## Deployment Requirements

- Both connection references must be configured in the target environment before flows will activate
- `ldw_BCBaseURL` environment variable must be set to the target BC environment API endpoint
- `ldw_PortalBaseURL` environment variable must be set to the target Power Pages site URL
- The Checkout flow must be set to **On** after solution import (flows import as Off by default)
