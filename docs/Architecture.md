# Architecture — LDWPowerPagesCart

## Overview

LDWPowerPagesCart is a B2B self-service ordering portal integrating Microsoft Dynamics 365 Business Central with Microsoft Power Pages via Dataverse and Power Automate.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Customer Browser                                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────────┐
│  Power Pages Site (UnitedinBC)                                  │
│  Bootstrap 5  │  Liquid templates  │  Web API (OData)           │
└──────┬────────────────────────────────────────┬─────────────────┘
       │ Dataverse Web API                       │ Power Automate
┌──────▼──────────────────────────────┐  ┌──────▼──────────────────┐
│  Dataverse                          │  │  Power Automate Flows   │
│  ─ ldw_cart                         │  │  ─ Checkout flow        │
│  ─ ldw_cartline2                    │  │  ─ Checkout Processing  │
│  ─ ldw_catalogitem                  │  │  ─ Catalogue Nightly    │
│  ─ ldw_checkoutrequest              │  └──────┬──────────────────┘
│  ─ ldw_publicprice                  │         │ BC OData API v4
│  ─ ldw_publicpricetier              │  ┌──────▼──────────────────┐
│  ─ ldw_webcategory1                 │  │  Dynamics 365 BC        │
│  ─ ldw_webdepartment1               │  │  Items  │  Prices       │
│  ─ ldw_bcwebcategorymap             │  │  Sales Orders           │
│  ─ dyn365bc_item_v2_0 (virtual)     │◄─┘  └─────────────────────┘
└─────────────────────────────────────┘
```

## Integration Layers

### Layer 1 — Power Pages (Presentation)
- Bootstrap 5 responsive portal
- Anonymous browsing of catalogue; authenticated cart and checkout
- Liquid templates drive all page rendering
- Dataverse Web API used for cart/checkout CRUD operations from client-side JavaScript
- Role-based table permissions enforce data access (Anonymous Users, Authenticated Users, Administrators)

### Layer 2 — Dataverse (Data Platform)
- Single source of truth for cart state, catalogue, pricing, and checkout requests
- Custom tables prefixed `ldw_` hold all solution-specific data
- Virtual table `dyn365bc_item_v2_0` surfaces Business Central item data directly in Dataverse
- Environment variables `ldw_BCBaseURL` and `ldw_PortalBaseURL` abstract environment-specific endpoints

### Layer 3 — Power Automate (Integration)
- **Checkout flow** — triggered on demand from the portal; reads cart/cartlines, retrieves contact, calls BC
- **Checkout Processing flow** — processes the checkout request record through BC sales order creation
- **Catalogue Nightly Fill** — scheduled flow that synchronises BC item/price data into Dataverse catalogue tables

### Layer 4 — Business Central (ERP)
- Source of truth for items, prices, and order management
- Accessed via BC API v2.0 OData endpoint
- Company and tenant are environment-specific (see `ldw_BCBaseURL` environment variable — excluded from this repo)

## Solution Publisher

| Property | Value |
|---|---|
| Unique name | `ldw` |
| Customization prefix | `ldw_` |
| Option value prefix | `85231` |

## Deployment Notes

- Solution is **unmanaged** in this export
- Connection references (`ldw_sharedcommondataserviceforapps_c4350`, `ldw_shareddynamicssmbsaas_840aa`) must be configured per environment
- Environment variables `ldw_BCBaseURL` and `ldw_PortalBaseURL` must be set per environment before flows will operate
- The Power Pages site instance GUID is environment-specific and is sanitized in this reference repository
