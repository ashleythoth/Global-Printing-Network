# PrintHub — Demo Data Reference

This document describes all demo data seeded into the Supabase database.

---

## 🏪 Print Shops (4)

| Name | Email | Phone | Address | Status |
|------|-------|-------|---------|--------|
| Quick Print Co. | shop1@printhub.com | +1 (555) 100-2000 | 123 Main St, New York, NY 10001 | ✅ Active |
| Express Prints LLC | shop2@printhub.com | +1 (555) 300-4000 | 456 Oak Ave, Los Angeles, CA 90001 | ✅ Active |
| City Copy Center | shop3@printhub.com | +1 (555) 500-6000 | 789 Broadway, Chicago, IL 60601 | ✅ Active |
| Sunset Print Studio | shop4@printhub.com | +1 (555) 700-8000 | 321 Sunset Blvd, Miami, FL 33101 | ❌ Inactive |

---

## 📦 Products (6)

### Documents
| Name | Color Modes | Sides | Page Range |
|------|-------------|-------|------------|
| Black & White Document | B&W | Single, Double | 1–500 |
| Color Document | Full Color | Single, Double | 1–200 |
| B&W + Color Document | B&W, Color | Single, Double | 1–300 |

### Photos
| Name | Sizes | Finishes |
|------|-------|----------|
| Standard Photo Print | 4×6, 5×7, 8×10 | Glossy, Matte |
| Premium Photo Print | 4×6, 5×7, 8×10, 8×12, 11×14, 16×20 | Glossy, Matte, Lustre, Metallic |
| Large Format Photo Print | 12×18, 16×20, 20×24, 20×30 | Glossy, Matte, Lustre |

---

## 🔗 Shop Products & Pricing

### Quick Print Co.
| Product | Enabled | Pricing Tiers |
|---------|---------|---------------|
| B&W Document | ✅ | 1–50 pages @ $0.12 · 51–200 @ $0.09 · 201–500 @ $0.07 |
| Color Document | ✅ | 1–50 pages @ $0.45 · 51–200 @ $0.35 |
| Standard Photo Print | ✅ | 1–25 prints @ $0.35 · 26–100 @ $0.29 · 101+ @ $0.25 |
| Premium Photo Print | ✅ | 1–25 prints @ $0.99 · 26+ @ $0.79 |

### Express Prints LLC
| Product | Enabled | Pricing Tiers |
|---------|---------|---------------|
| B&W Document | ✅ | 1–50 pages @ $0.10 · 51–200 @ $0.08 · 201–500 @ $0.06 |
| B&W + Color Document | ✅ | 1–50 pages @ $0.30 · 51–200 @ $0.22 |
| Standard Photo Print | ✅ | 1–50 prints @ $0.39 · 51+ @ $0.29 |
| Large Format Photo Print | ✅ | 1–10 prints @ $8.99 · 11+ @ $6.99 |

### City Copy Center
| Product | Enabled | Pricing Tiers |
|---------|---------|---------------|
| B&W Document | ✅ | 1–50 pages @ $0.11 · 51–500 @ $0.08 |
| Color Document | ✅ | 1–50 pages @ $0.50 · 51–200 @ $0.38 |
| Standard Photo Print | ❌ (disabled) | — |

---

## 🧾 Print Orders (15)

### Quick Print Co. (6 orders)
| Customer | Product | Details | Total | Status |
|----------|---------|---------|-------|--------|
| Alice Johnson | B&W Document | 45 pages × 2 copies, double-sided | $10.80 | ✅ Completed |
| Bob Martinez | Standard Photo | 8×10 Glossy × 3 | $8.97 | ✅ Completed |
| Carol White | B&W Document | 120 pages, single-sided | $13.20 | 🔄 In Progress |
| David Lee | Standard Photo | 4×6 Matte × 20 | $7.00 | ⏳ Pending |
| Emma Davis | Color Document | 45 pages × 3 copies, single-sided | $60.75 | ✅ Completed |
| Frank Wilson | Premium Photo | 5×7 Lustre × 10 | $9.90 | ⏳ Pending |

### Express Prints LLC (5 orders)
| Customer | Product | Details | Total | Status |
|----------|---------|---------|-------|--------|
| Grace Taylor | B&W Document | 80 pages, double-sided | $7.40 | ✅ Completed |
| Henry Brown | Standard Photo | 4×6 Glossy × 50 | $19.50 | ✅ Completed |
| Iris Chen | Large Format Photo | 16×20 Glossy × 5 | $44.95 | 🔄 In Progress |
| Jack Miller | B&W + Color Document | 30 pages × 2 copies | $6.00 | ⏳ Pending |
| Kate Anderson | Large Format Photo | 20×30 Matte × 2 | $17.98 | ⏳ Pending |

### City Copy Center (4 orders)
| Customer | Product | Details | Total | Status |
|----------|---------|---------|-------|--------|
| Liam Garcia | B&W Document | 200 pages, double-sided | $18.50 | ✅ Completed |
| Mia Robinson | Color Document | 15 pages, single-sided | $7.50 | ✅ Completed |
| Noah Martinez | B&W Document | 40 pages × 4 copies | $17.60 | 🔄 In Progress |
| Olivia Thompson | Color Document | 60 pages, double-sided | $28.80 | ⏳ Pending |

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@printhub.com | admin123 |
| Shop (Quick Print Co.) | shop1@printhub.com | shop123 |
| Shop (Express Prints LLC) | shop2@printhub.com | shop123 |

> **Note:** Shop logins are managed in localStorage (not Supabase Auth). The shops in Supabase are linked by email.

---

## 📁 Simulated File Paths

Orders reference these file paths (stored as text in `file_paths[]`):

```
orders/alice-report.pdf
orders/bob-photo1.jpg, bob-photo2.jpg, bob-photo3.jpg
orders/carol-thesis.pdf
orders/david-family.zip
orders/emma-brochure.pdf
orders/frank-portraits.zip
orders/grace-manual.pdf
orders/henry-event.zip
orders/iris-gallery.tiff
orders/jack-forms.pdf
orders/kate-wedding.tiff
orders/liam-dissertation.pdf
orders/mia-flyer.pdf
orders/noah-handouts.pdf
orders/olivia-catalog.pdf
```

> These are reference paths only — no actual files are stored in Supabase Storage for demo orders.