# Power Pages Site — LDWPowerPagesCart

## Site Identity

| Property | Value |
|---|---|
| Site name | `UnitedinBC - site-p2sfr` |
| Site folder | `UnitedinBC---site-p2sfr` |
| Site instance GUID | `<SANITIZED_GUID>` |
| Default language | English (1033) |
| Bootstrap version | Bootstrap 5 (enabled) |
| Authentication | Local + Microsoft OAuth |

---

## Page Structure

| Page | Path | Access | Purpose |
|---|---|---|---|
| Home | `/` | Anonymous | Landing page |
| Catalogue | `/Catalogue` | Anonymous | Product browse |
| Cart Page | `/Cart-Page` | Authenticated | View and manage cart |
| Checkout | `/CHECKOUT` | Authenticated | Submit cart for order |
| Checkout 2 | `/CHECKOUT2` | Authenticated | Alternate checkout flow |
| My Orders | `/My-Orders` | Authenticated | Order history |
| Order Confirmation | `/Order-Confirmation` | Authenticated | Post-checkout confirmation |
| Profile | `/Profile` | Authenticated | Account management |
| Search | `/Search` | Anonymous | Site-wide search |
| Access Denied | `/Access-Denied` | System | 403 handler |
| Page Not Found | `/Page-Not-Found` | System | 404 handler |

**Test/development pages (not production):** `FORMTEST`, `TESTNEW`, `TEST-PAGE`, `PRODUCT`, `PRODUCT2`, `Product3`, `BLANK-10112025`, various `-deleted` variants.

---

## Web Templates

| Template | Purpose |
|---|---|
| `Header` | Site header, navigation |
| `Footer` | Site footer |
| `Page-Header` | Per-page header section |
| `Page-Copy` | General content page wrapper |
| `Pages-Breadcrumb` | Breadcrumb navigation |
| `Breadcrumbs` | Breadcrumb component |
| `Pagination` | List pagination component |
| `Search` | Search input form |
| `Search-Results` | Search results renderer |
| `AF-Token` | Anti-forgery token helper |
| `Layout-2-Column-Wide-Left` | Two-column page layout |
| `Languages-Dropdown` | Language selector |
| `Power-Virtual-Agents` | PVA bot embed template |
| `Default-studio-template` | Studio default template |

---

## Web API Configuration (Site Settings)

The site exposes Dataverse tables via the Power Pages Web API for client-side CRUD operations:

| Table | Enabled | Operations |
|---|---|---|
| `ldw_catalogitem` | Yes | Read |
| `ldw_cart` | Yes | Read, Create, Update |
| `ldw_cartline2` | Yes | Read, Create, Update, Delete |
| `ldw_checkoutrequest` | Yes | Create |
| `contact` | Yes | Read, Update |
| `dyn365bc_item_v2_0` | Yes | Read |

Global Web API settings: UTC datetime enabled, Read/Create/Update/Delete operations individually flagged.

---

## Table Permissions

| Permission | Table | Scope | Web Roles |
|---|---|---|---|
| Cart (Contact scope) | `ldw_cart` | Contact | Authenticated Users |
| Cart line 2 | `ldw_cartline2` | Parent (Cart) | Authenticated Users |
| Catalog Item (Global) | `ldw_catalogitem` | Global | Anonymous Users, Authenticated Users |
| Checkout Request | `ldw_checkoutrequest` | Contact | Authenticated Users |
| Contact — AppendTo Cart | `contact` | Self | Authenticated Users |
| Item (BC VT) | `dyn365bc_item_v2_0` | Global | Anonymous Users, Authenticated Users |

---

## Web Roles

| Role | Description |
|---|---|
| Anonymous Users | Unauthenticated visitors — catalogue browse, search |
| Authenticated Users | Logged-in portal users — cart, checkout, orders |
| Administrators | Full portal administration |

---

## Authentication

Configured authentication providers (setting name stubs present in export — no secrets populated):

| Provider | Setting prefix |
|---|---|
| Microsoft (OpenAuth) | `Authentication/OpenAuth/Microsoft/` |
| Facebook | `Authentication/OpenAuth/Facebook/` |
| LinkedIn | `Authentication/OpenAuth/LinkedIn/` |
| Twitter / X | `Authentication/OpenAuth/Twitter/` |

Local registration and login is enabled (`Authentication/Registration/Enabled = true`).

> **Note:** All OAuth secret fields (`ClientSecret`, `AppSecret`, `ConsumerSecret`) are present as name stubs only in this PAC CLI export. No secret values are stored in source control.

---

## Site Settings Reference

84 site settings are exported. Key configuration categories:

- `Authentication/*` — OAuth provider configuration (name stubs, no values)
- `Webapi/*` — Web API table and operation flags
- `Search/*` — Portal search configuration
- `Site/*` — Bootstrap version, theme
- `SMTP*` — Email server settings (name stubs, no values)
- `UseServerSideSynchronization` — Server-side sync flag

---

## Static Files

| File | Purpose |
|---|---|
| `bootstrap.min.css` | Bootstrap 5 CSS |
| `portalbasictheme.css` | Portal base theme |
| `theme.css` | Custom site theme |
| `Logo-sm-64.png` | Site logo (64px) |
| `Cat-PC.png` | Catalogue page image |
| `PWAManifest.json` | Progressive Web App manifest |
