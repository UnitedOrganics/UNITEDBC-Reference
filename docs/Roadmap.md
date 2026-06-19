# Roadmap — LDWPowerPagesCart

## Status

The solution is in active development on the `CreatePublicVersion` branch. The sandbox environment is functional with core catalogue, cart, and checkout capabilities operational.

---

## Current Capabilities (v1.0.0.0)

- [x] Product catalogue browse (anonymous)
- [x] Search
- [x] Authenticated cart management (add, update, remove lines)
- [x] Checkout flow → BC sales order creation
- [x] Order confirmation page
- [x] My Orders page
- [x] Customer profile management
- [x] Nightly catalogue sync from BC
- [x] Virtual table BC item support
- [x] Role-based table permissions (Anonymous / Authenticated / Admin)
- [x] Bootstrap 5 responsive layout

---

## Near-Term (Next Release)

- [ ] **Price tier support** — surface `ldw_publicpricetier` on the catalogue for customer-group pricing
- [ ] **Checkout status polling** — portal-side display of BC order number after async processing completes
- [ ] **Order line detail page** — expand My Orders to show individual line items
- [ ] **Remove ldw_cartline** — deprecate and remove the original cart line entity (replaced by ldw_cartline2)
- [ ] **Error handling improvements** — user-visible messages when checkout processing fails

---

## Medium-Term

- [ ] **Production environment deployment** — configure production BC company, portal URL, and OAuth
- [ ] **OAuth provider selection** — determine which social providers to enable in production (currently: Microsoft, Facebook, LinkedIn, Twitter stubs configured)
- [ ] **PWA support** — complete PWA manifest configuration for mobile install
- [ ] **SMTP email notifications** — configure SMTP settings for order confirmation emails
- [ ] **Power Virtual Agents integration** — the PVA bot web template is scaffolded; configure and activate

---

## Long-Term / Backlog

- [ ] **Catalogue image management** — structured image storage for `ldw_catalogitem`
- [ ] **Department/category admin UI** — Power Pages admin pages for managing `ldw_webcategory1` and `ldw_webdepartment1`
- [ ] **BC price list targeting** — assign specific BC price lists to portal user groups
- [ ] **Managed solution packaging** — produce a managed solution for production deployment
- [ ] **Automated CI/CD pipeline** — PAC CLI-based pipeline in Azure DevOps for solution import to target environments
- [ ] **Unit test coverage** — Power Automate flow testing with mock connectors

---

## Known Issues

| ID | Description | Priority |
|---|---|---|
| KI-001 | Test/deleted pages visible in navigation during development | Low |
| KI-002 | `ldw_cartline` entity still in solution but unused | Low |
| KI-003 | CHECKOUT and CHECKOUT2 pages — only one checkout flow is active; purpose of the second needs clarification | Medium |
