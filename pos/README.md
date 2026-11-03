# Shop POS — ระบบขายหน้าร้าน + สต็อก (ฟรีทุกฟีเจอร์)

Free point-of-sale + inventory web app. Runs in any browser (PC, tablet, phone) and installs like an app.

**Open the app:** https://khalil203.github.io/khalil203/pos/

- Hosting: GitHub Pages (free)
- Database + login: Supabase free tier (project `shop-pos`, region Tokyo)
- No paid plan, no feature locks

## Features
| | |
|---|---|
| 🛒 Sell | Product grid by category, search, USB barcode scanner, phone-camera scan, hold/recall bills, per-item and bill discounts, promotions, member points |
| 💳 Payment | Cash with change calculator, PromptPay QR (auto amount), transfer, card |
| 🧾 Receipt | 58 / 80 mm printing, VAT included/excluded, short tax invoice (ABB), reprint, void bill (manager) |
| 🖥️ Customer display | Second screen shows cart, total, PromptPay QR and change |
| 📦 Products | Categories with colours, images, barcode/SKU, cost & margin, CSV import/export |
| 🏬 Stock | Receive (weighted average cost), remove, stock count, low-stock alerts, full movement history, stock value |
| ⭐ Members | Points earn/redeem, total spent, visits |
| 🚚 Suppliers · 💸 Expenses · 🏷️ Promotions | Full CRUD |
| 📊 Reports | Sales, bills, avg bill, cost, gross & net profit, expenses, by hour/day, by payment, by cashier, top products, low-margin products, CSV |
| 💰 Shifts | Open/close cash drawer, expected vs counted cash |
| 👥 Staff | Invite by email; roles Owner / Manager / Cashier / Stock keeper |
| 🏪 Branches | Multiple shops per account, switch anytime |
| 🌐 | Thai / English, JSON backup |

## Roles
| Page | Owner | Manager | Cashier | Stock |
|---|---|---|---|---|
| Sell | ✓ | ✓ | ✓ | ✓ |
| Bills (void) | ✓ (✓) | ✓ (✓) | own bills | |
| Products / Stock / Suppliers | ✓ | ✓ | | ✓ |
| Members | ✓ | ✓ | ✓ | |
| Promotions / Expenses / Reports | ✓ | ✓ | | |
| Staff | ✓ | | | |

Permissions are enforced in the database (Row Level Security), not just hidden in the menu.

## Files
- `index.html`, `style.css`, `app.js` — the app
- `config.js` — Supabase URL + publishable key (safe to be public)
- `display.html` — customer-facing screen
- `schema.sql` — full database (tables, security rules, checkout functions). To move to a new Supabase project, run it in the SQL editor and update `config.js`.
- `sw.js`, `manifest.json`, icons — installable app

## Free-tier notes
Supabase free: 500 MB database, 50,000 monthly users. A free project **pauses after 7 days with no activity** — daily shop use keeps it awake; if it pauses, press *Restore* in the Supabase dashboard.

## v3 — Enterprise Thai POS upgrade
- **Dashboard (แดชบอร์ด):** real-data KPIs — net sales after refunds, bills, items sold, gross profit (ex-VAT − cost), expenses, net profit, refunds, pending QR payments, per-payment totals, sales trend vs previous period, 12-month chart, payment mix, busy hours, best / slow sellers, low & out of stock. Filters: วันนี้ / เมื่อวาน / 7 วัน / 30 วัน / เดือนนี้ / เดือนก่อน / กำหนดเอง
- **Checkout:** split payment, cash / transfer / PromptPay / QR / credit / debit / e-wallet / เงินเชื่อ (store credit with credit limit), PromptPay marked **รอตรวจสอบ** until the cashier confirms money arrived, duplicate-submit protection (idempotent `client_id`), multi-unit selling (e.g. แพ็ก 6), promo price, member discount %, customer note, clear-cart confirmation, recently-sold tab, full tax invoice at checkout
- **Offline:** sales are queued on the device when the internet drops (cash/card/transfer only) and synced automatically; online/offline status chip
- **Sales history:** filters, pending-payment confirmation, partial/full refunds with reasons + restock + credit note, void with reason, issue full tax invoice later, digital receipt (share to LINE)
- **Receipts:** 58 / 80 mm / A4, logo, branch (สำนักงานใหญ่ / สาขา), ABB or full tax invoice with buyer tax ID, Thai amount in words (บาทถ้วน)
- **Inventory:** receive (with expiry/lot), remove, damaged, expired, stock count sheet, branch transfer, min/max stock, expiry alerts, valuation, full movement history, optional negative-stock block
- **Purchasing:** purchase orders → receive into stock (weighted average cost) → supplier payments & balances, printable PO
- **Customers:** tax info, groups, levels, member discount, credit limit & outstanding balance, purchase history, debt payments
- **Expenses:** Thai categories, payment method, receipt photo, approval (cashier entries need approval)
- **Cash register:** cash in/out, cash refunds & expenses included in expected cash, X report, shift close with difference
- **Staff:** roles เจ้าของร้าน / ผู้ดูแลระบบ / ผู้จัดการร้าน / พนักงานขาย / พนักงานสต็อก / พนักงานบัญชี, configurable permission matrix, **audit log**
- **Reports (14):** sales, profit, products, categories, inventory, stock moves, purchases, expenses, customers, staff, payment methods, VAT (ภาษีขาย), shifts, refunds — sort, search, CSV, Excel, print/PDF
- **Settings:** shop & logo, business type, VAT & branch, receipt size, payment methods, พ.ศ./ค.ศ., decimals, Thai digits, negative stock, points, hardware test (scanner, test print, customer display, Web Serial scale)

### Honest limits
- Automatic PromptPay confirmation needs a bank/payment-provider API (paid). Until then the cashier confirms.
- Printing uses the browser print dialog (works with installed thermal-printer drivers; cash drawer opens via the printer driver). Raw ESC/POS over USB is not used.
- Source of `modules.js` is in `src/` (concatenate `src/m*.js` → `modules.js`).
