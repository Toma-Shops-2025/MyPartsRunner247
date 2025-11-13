# Legal & Compliance Log

Use this checklist to keep MY-RUNNER.COM’s legal, licensing, and insurance records organized. Update the status column whenever a document is renewed or a review is completed.

## Corporate & Registration
| Item | Details | Status / Last Updated | Storage |
| --- | --- | --- | --- |
| Entity registration | MY-RUNNER.COM LLC · State of Kentucky | _Review annually_ | PDF filing receipt |
| EIN | IRS assignment letter | _On file_ | `docs/compliance/EIN_letter.pdf` |
| Operating agreement | Single-member LLC agreement | _Review every 12 months_ | `docs/compliance/Operating_Agreement.pdf` |

## Insurance
| Coverage | Notes | Renewal Date | Storage |
| --- | --- | --- | --- |
| General liability | Required for delivery ops | _Enter expiration date_ | `docs/compliance/Insurance_GeneralLiability.pdf` |
| Hired / non-owned auto | Covers drivers using personal vehicles | _Enter expiration date_ | `docs/compliance/Insurance_HNOA.pdf` |
| Cyber liability (optional) | Recommended for push notifications & Supabase | _Pending_ | `docs/compliance/Insurance_Cyber.pdf` |

## Technology & Security
| Control | Frequency | Owner | Notes |
| --- | --- | --- | --- |
| Supabase RLS policy review | Quarterly | Engineering | Confirm all tables enforce RLS |
| Netlify env var audit | Quarterly | Engineering | Remove unused keys, rotate service-role if exposed |
| Stripe PCI-DSS acknowledgement | Annual | Finance | Download latest Stripe compliance confirmation |
| Push notification consent audit | Quarterly | Operations | Export `push_subscriptions` for recordkeeping |

## Professional Support
- **Attorney / Legal advisor:** _Add firm or contact name here_
- **Tax professional:** _Add CPA contact_
- **Insurance broker:** _Add broker / agency_

## Action Items
- [ ] Upload latest PDFs to `docs/compliance/` (see README for naming conventions).
- [ ] Update renewal dates above after each policy refresh.
- [ ] Email `compliance@mypartsrunner.com` with a summary when reviews are complete.

_Last updated: November 8, 2025_

