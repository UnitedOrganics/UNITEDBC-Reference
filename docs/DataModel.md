# Data Model — LDWPowerPagesCart

## Custom Tables (Solution-owned)

### `ldw_cart` — Shopping Cart

The primary cart record, one per customer session. Owned by the authenticated contact.

| Attribute | Type | Notes |
|---|---|---|
| `ldw_cartid` | Primary Key (GUID) | |
| `ldw_name` | Single Line of Text | Cart display name |
| `ldw_contact` | Lookup → Contact | Cart owner |
| `ldw_pricelevel` | Lookup → PriceLevel | Price list applied to cart |
| `ldw_totalamount` | Currency | Calculated total |
| `ldw_status` | Option Set | Active / Submitted / Cancelled |
| `statecode` / `statuscode` | Standard | Active / Inactive |

**Entity key:** standard primary key  
**Relationships:** Contact (many-to-one), PriceLevel (many-to-one), CartLine2 (one-to-many), CheckoutRequest (one-to-many)

---

### `ldw_cartline2` — Cart Line

Individual line items within a cart. Second-generation model replacing an earlier `ldw_cartline` entity.

| Attribute | Type | Notes |
|---|---|---|
| `ldw_cartline2id` | Primary Key (GUID) | |
| `ldw_cart` | Lookup → ldw_cart | Parent cart |
| `ldw_catalogitem` | Lookup → ldw_catalogitem | Item being ordered (optional) |
| `ldw_itemno` | Single Line of Text | BC item number |
| `ldw_description` | Single Line of Text | Line description |
| `ldw_quantity` | Decimal | Order quantity |
| `ldw_unitprice` | Currency | Unit price at time of add |
| `ldw_linetotal` | Currency | Calculated line total |

---

### `ldw_catalogitem` — Catalogue Item

Represents a purchasable item surfaced on the portal catalogue. Sourced from Business Central and cached in Dataverse.

| Attribute | Type | Notes |
|---|---|---|
| `ldw_catalogitemid` | Primary Key (GUID) | |
| `ldw_itemno` | Single Line of Text | BC item number (alternate key) |
| `ldw_description` | Single Line of Text | |
| `ldw_unitofmeasure` | Single Line of Text | |
| `ldw_unitprice` | Currency | Current sell price |
| `ldw_webcategory` | Lookup → ldw_webcategory1 | Portal category |
| `ldw_webdepartment` | Lookup → ldw_webdepartment1 | Portal department |
| `ldw_portalstatus` | Option Set (`ldw_defaultportalstatus`) | Published / Unpublished |
| `ldw_imagepath` | URL | Item image |

**Entity key:** `ldw_itemno` (alternate key for BC sync upsert)

---

### `ldw_checkoutrequest` — Checkout Request

Created when a customer submits a cart for order processing. Picked up by the Checkout Processing flow.

| Attribute | Type | Notes |
|---|---|---|
| `ldw_checkouttequestid` | Primary Key (GUID) | |
| `ldw_cart` | Lookup → ldw_cart | Source cart |
| `ldw_status` | Option Set | Pending / Processing / Completed / Failed |
| `ldw_bcordernumber` | Single Line of Text | BC sales order number (written back by flow) |
| `ldw_errormessage` | Multiline Text | Flow error details if failed |

---

### `ldw_publicprice` — Public Price

Stores published price records sourced from BC price lists.

| Attribute | Type | Notes |
|---|---|---|
| `ldw_publicpriceid` | Primary Key (GUID) | |
| `ldw_itemno` | Single Line of Text | BC item number |
| `ldw_unitprice` | Currency | Published price |
| `ldw_pricelevel` | Lookup → PriceLevel | Associated price list |
| `ldw_validfrom` | Date | Effective from |
| `ldw_validto` | Date | Effective to |

---

### `ldw_publicpricetier` — Public Price Tier

Groups price records by tier/band for multi-tier pricing support.

**Entity key:** composite alternate key on `ldw_itemno` + tier identifier.

---

### `ldw_webcategory1` — Web Category

Hierarchical category structure for the portal catalogue.

| Attribute | Type | Notes |
|---|---|---|
| `ldw_webcategory1id` | Primary Key (GUID) | |
| `ldw_name` | Single Line of Text | |
| `ldw_bcwebcategorymap` | Lookup → ldw_bcwebcategorymap | Maps to BC category |

---

### `ldw_webdepartment1` — Web Department

Top-level department grouping for catalogue organisation.

---

### `ldw_bcwebcategorymap` — BC Web Category Map

Junction table mapping BC item categories to portal categories and departments.

| Attribute | Type | Notes |
|---|---|---|
| `ldw_bccategory` | Single Line of Text | BC item category code |
| `ldw_webcategory` | Lookup → ldw_webcategory1 | Portal category |
| `ldw_webdepartment` | Lookup → ldw_webdepartment1 | Portal department |

---

## Referenced Standard Tables

| Table | Usage |
|---|---|
| `contact` | Cart owner; portal authenticated user |
| `product` | Standard product reference |
| `pricelevel` | Price list associated to cart |
| `transactioncurrency` | Currency on cart and line amounts |
| `dyn365bc_item_v2_0` | Business Central item virtual table |

---

## Global Option Sets

| Option Set | Values |
|---|---|
| `ldw_defaultportalstatus` | Published / Unpublished |
| `ldw_standardportalstatus` | Draft / Active / Retired |
| `ldw_pureportalbehaivour` | Standard / Pure Portal |

---

## Entity Relationship Summary

```
Contact ──────────────────► ldw_cart ◄──── PriceLevel
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              ldw_cartline2        ldw_checkoutrequest
                    │
                    ▼
            ldw_catalogitem
            ┌──────┴──────┐
            ▼             ▼
    ldw_webcategory1  ldw_webdepartment1
            │
            ▼
    ldw_bcwebcategorymap
```

Full relationship definitions are in [`entityrelationships/`](../UNITEDBC/LDWPowerPagesCart/entityrelationships/).
