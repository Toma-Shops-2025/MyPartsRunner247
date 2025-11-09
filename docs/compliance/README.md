# Compliance Document Vault

Store signed or certified copies of key documents inside this folder. Replace the placeholder filenames below with the actual PDFs when available.

Recommended structure:

```
docs/compliance/
  EIN_letter.pdf
  Operating_Agreement.pdf
  Insurance_GeneralLiability.pdf
  Insurance_HNOA.pdf
  Insurance_Cyber.pdf           # optional
  Certificate_Stripe_PCI.pdf    # export from Stripe dashboard
```

Guidelines:
- Keep scanned copies encrypted at rest (BitLocker, 1Password, etc.) and sync this repository copy only if it’s safe to do so.
- Update `docs/LEGAL_COMPLIANCE_LOG.md` whenever you replace a document.
- Never commit sensitive personal data (SSNs, bank routing numbers).

