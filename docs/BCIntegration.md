# Business Central Integration — LDWPowerPagesCart

## Overview

The solution integrates with Microsoft Dynamics 365 Business Central via the standard BC API v2.0 (OData v4). The integration is bi-directional:

- **Inbound (BC → Dataverse):** Nightly catalogue fill flow pulls items and prices from BC into Dataverse
- **Outbound (Dataverse → BC):** Checkout processing flow creates sales orders in BC from submitted carts

---

## API Endpoint

The BC API base URL is stored as the environment variable `ldw_BCBaseURL` and follows this pattern:

```
https://api.businesscentral.dynamics.com/v2.0/<SANITIZED_TENANT>/<SANITIZED_COMPANY>/api/v2.0
```

> The tenant GUID and company name are environment-specific and intentionally excluded from this repository.  
> Set `ldw_BCBaseURL` in the Power Apps environment variable definitions when deploying.

---

## Connection Reference

| Property | Value |
|---|---|
| Logical name | `ldw_shareddynamicssmbsaas_840aa` |
| Display name | `Dynamics 365 Business Central LDWPowerPagesCart-840aa` |
| Connector | `/providers/Microsoft.PowerApps/apis/shared_dynamicssmbsaas` |

This connection reference must be configured to an active Business Central connection in the target environment.

---

## BC API Entities Used

| BC Entity | Direction | Purpose |
|---|---|---|
| `items` | Read | Catalogue item sync |
| `salesOrders` | Write | Create order from checkout |
| `salesOrderLines` | Write | Create order lines from cart lines |
| `customerPriceGroups` / prices | Read | Price list sync |

---

## Virtual Table: `dyn365bc_item_v2_0`

The solution uses the Business Central virtual table connector to surface BC items directly in Dataverse without a separate sync step. This virtual table (`dyn365bc_item_v2_0`) is exposed via the portal Web API, allowing the catalogue page to query BC items in near real-time.

**Relevant site settings:**
- `Webapi/dyn365bc_item_v2_0/enabled` = `true`
- `Webapi/dyn365bc_item_v2_0/fields` = configured field list

---

## Environment Variables

| Variable | Schema name | Purpose | Value in this repo |
|---|---|---|---|
| BC Base URL | `ldw_BCBaseURL` | Full BC API endpoint including tenant and company | Excluded |
| Portal Base URL | `ldw_PortalBaseURL` | Power Pages site root URL | Excluded |
| Price Source | `ldw_PriceSource` | Source for pricing: `BC` or `Dataverse` | `BC` (default) |
| Use Virtual Tables | `ldw_UseVirtualTables` | Toggle virtual table vs cached table | `yes` (default) |

> `ldw_BCBaseURL` and `ldw_PortalBaseURL` must be set before any flows or portal API calls will function.

---

## Integration Data Flow

### Catalogue Nightly Fill

```
Business Central                 Power Automate              Dataverse
─────────────────────────────────────────────────────────────────────
GET /items                  ──►  Map to ldw_catalogitem  ──►  Upsert by ldw_itemno
GET /customerPriceGroups    ──►  Map to ldw_publicprice  ──►  Upsert by item + tier
GET /item categories        ──►  Map to ldw_bcwebcategorymap ──► Upsert
```

### Checkout Processing

```
Portal                Power Automate                    Business Central
──────────────────────────────────────────────────────────────────────
Submit cart  ──►  Read ldw_cart + ldw_cartline2  ──►  POST /salesOrders
                  Read contact                   ──►  POST /salesOrderLines (per line)
                  Write BC order no back         ◄──  Response: salesOrderNo
```

---

## Deployment Checklist

- [ ] Configure `ldw_shareddynamicssmbsaas_840aa` connection reference to active BC connection
- [ ] Set `ldw_BCBaseURL` environment variable to target environment URL
- [ ] Set `ldw_PortalBaseURL` environment variable to portal URL
- [ ] Verify `ldw_PriceSource` is set appropriately (`BC` or `Dataverse`)
- [ ] Set `ldw_UseVirtualTables` appropriately for the environment
- [ ] Turn on all three flows after solution import
- [ ] Run CatalogueNightlyFill manually on first deployment to populate catalogue
