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
