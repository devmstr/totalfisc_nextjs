# SCF Chart of Accounts

Complete Algerian Chart of Accounts according to the **Système Comptable Financier (SCF)**.

**Legal Basis:** Law No. 07-11 (Nov 25, 2007), Decree No. 08-156, Order of July 26, 2008

---

## Coding Structure

| Level | Digits | Example | Description |
|-------|--------|---------|-------------|
| Class | 1 | 5 | Balance sheet (1-5) or Income (6-7) |
| Principal | 2 | 51 | Bank accounts |
| Divisionary | 3 | 512 | Current accounts |
| Sub-account | 4+ | 512001 | Specific bank |

---

## Class 1 – Equity & Non-Current Liabilities

| Code | Label | Type |
|------|-------|------|
| **10** | **Capital et réserves** | **Equity** |
| 101 | Capital social | Equity |
| 103 | Primes liées au capital | Equity |
| 106 | Réserves | Equity |
| 1061 | Réserve légale | Equity |
| 1062 | Réserves statutaires | Equity |
| 1063 | Réserves ordinaires | Equity |
| 108 | Compte de l'exploitant | Equity |
| **11** | **Report à nouveau** | **Retained** |
| 110 | Report à nouveau (crédit) | Retained |
| 119 | Report à nouveau (débit) | Retained |
| **12** | **Résultat de l'exercice** | **Result** |
| 120 | Résultat (bénéfice) | Result |
| 129 | Résultat (perte) | Result |
| **13** | **Produits différés** | **Deferred** |
| 131 | Subventions d'équipement | Deferred |
| 133 | Impôts différés actif | Deferred |
| 134 | Impôts différés passif | Deferred |
| **15** | **Provisions - passifs NC** | **Provisions** |
| 153 | Provisions pour pensions | Provisions |
| 155 | Provisions pour impôts | Provisions |
| **16** | **Emprunts et dettes** | **Borrowings** |
| 164 | Emprunts bancaires | Borrowings |
| 167 | Dettes sur leasing | Borrowings |

---

## Class 2 – Non-Current Assets

| Code | Label | Type |
|------|-------|------|
| **20** | **Immobilisations incorporelles** | **Intangible** |
| 203 | Frais de développement | Intangible |
| 204 | Logiciels informatiques | Intangible |
| 205 | Brevets et licences | Intangible |
| 207 | Fonds commercial | Intangible |
| **21** | **Immobilisations corporelles** | **Tangible** |
| 211 | Terrains | Tangible |
| 213 | Constructions | Tangible |
| 215 | Installations techniques | Tangible |
| 218 | Autres immobilisations | Tangible |
| **23** | **Immobilisations en cours** | **WIP** |
| 232 | Immobilisations corporelles en cours | WIP |
| **26** | **Participations** | **Financial** |
| 261 | Titres de participation | Financial |
| **27** | **Autres immob. financières** | **Financial** |
| 275 | Dépôts et cautionnements versés | Financial |
| **28** | **Amortissements** | **Contra** |
| 280 | Amort. immob. incorporelles | Contra |
| 281 | Amort. immob. corporelles | Contra |
| **29** | **Pertes de valeur** | **Impairment** |
| 290 | PV immob. incorporelles | Impairment |
| 291 | PV immob. corporelles | Impairment |

---

## Class 3 – Stocks

| Code | Label | Type |
|------|-------|------|
| **30** | **Stocks de marchandises** | **Merchandise** |
| 300 | Marchandises | Merchandise |
| **31** | **Matières premières** | **Raw Materials** |
| 311 | Matières premières | Raw Materials |
| 317 | Fournitures | Raw Materials |
| **32** | **Autres approvisionnements** | **Supplies** |
| 321 | Matières consommables | Supplies |
| 326 | Emballages | Supplies |
| **33** | **En-cours production** | **WIP** |
| 331 | Produits en cours | WIP |
| **35** | **Stocks de produits** | **Finished** |
| 355 | Produits finis | Finished |
| **38** | **Achats stockés** | **Clearing** |
| 380 | Marchandises stockées | Clearing |
| 381 | Matières stockées | Clearing |
| **39** | **Pertes de valeur** | **Impairment** |
| 390 | PV stocks marchandises | Impairment |

---

## Class 4 – Third Parties

| Code | Label | Type |
|------|-------|------|
| **40** | **Fournisseurs** | **Payables** |
| 401 | Fournisseurs | Payables |
| 404 | Fournisseurs d'immobilisations | Payables |
| 408 | Factures non parvenues | Payables |
| 409 | Fournisseurs débiteurs | Payables |
| **41** | **Clients** | **Receivables** |
| 411 | Clients | Receivables |
| 413 | Effets à recevoir | Receivables |
| 416 | Clients douteux | Receivables |
| 419 | Clients créditeurs | Receivables |
| **42** | **Personnel** | **Personnel** |
| 421 | Rémunérations dues | Personnel |
| 425 | Avances et acomptes | Personnel |
| **43** | **Organismes sociaux** | **Social** |
| 431 | CNAS/CASNOS | Social |
| **44** | **État et impôts** | **Fiscal** |
| 441 | Subventions à recevoir | Fiscal |
| 444 | IBS à payer | Fiscal |
| 445 | TVA | Fiscal |
| **4456** | **TVA déductible** | **Fiscal** |
| **4457** | **TVA collectée** | **Fiscal** |
| 447 | Autres impôts (TAP) | Fiscal |
| **45** | **Groupe et associés** | **Group** |
| 455 | Associés - comptes courants | Group |
| 457 | Dividendes à payer | Group |
| **49** | **Pertes de valeur** | **Impairment** |
| 491 | PV comptes clients | Impairment |

---

## Class 5 – Financial

| Code | Label | Type |
|------|-------|------|
| **50** | **VMP** | **Securities** |
| 503 | Actions et titres | Securities |
| **51** | **Banques** | **Bank** |
| 511 | Valeurs à l'encaissement | Bank |
| 512 | Comptes courants | Bank |
| 517 | CCP | Bank |
| 519 | Concours bancaires | Bank |
| **53** | **Caisse** | **Cash** |
| 531 | Caisse siège | Cash |
| **58** | **Virements internes** | **Transfer** |
| 581 | Virements de fonds | Transfer |

---

## Class 6 – Expenses

| Code | Label | Type |
|------|-------|------|
| **60** | **Achats consommés** | **Purchases** |
| 600 | Achats marchandises | Purchases |
| 601 | Matières premières | Purchases |
| 603 | Variation des stocks | Purchases |
| 607 | Achats non stockés | Purchases |
| **61** | **Services extérieurs** | **Services** |
| 613 | Locations | Services |
| 615 | Entretien et réparations | Services |
| 616 | Primes d'assurances | Services |
| **62** | **Autres services** | **Services** |
| 622 | Honoraires | Services |
| 624 | Transport | Services |
| 626 | Télécommunications | Services |
| 627 | Services bancaires | Services |
| **63** | **Charges de personnel** | **Personnel** |
| 631 | Rémunérations | Personnel |
| 635 | Cotisations sociales | Personnel |
| **64** | **Impôts et taxes** | **Taxes** |
| 642 | TAP | Taxes |
| 644 | Droits de timbre | Taxes |
| 645 | Autres impôts | Taxes |
| **65** | **Autres charges opérationnelles** | **Operating** |
| 652 | Moins-values cessions | Operating |
| 654 | Créances irrécouvrables | Operating |
| **66** | **Charges financières** | **Financial** |
| 661 | Charges d'intérêts | Financial |
| 666 | Pertes de change | Financial |
| **68** | **Dotations amort./provisions** | **D&A** |
| 681 | Dotations - actifs NC | D&A |
| 685 | Dotations - actifs courants | D&A |
| **69** | **Impôts sur résultats** | **Tax** |
| 695 | IBS | Tax |

---

## Class 7 – Revenues

| Code | Label | Type |
|------|-------|------|
| **70** | **Ventes** | **Sales** |
| 700 | Ventes marchandises | Sales |
| 701 | Ventes produits finis | Sales |
| 704 | Vente travaux | Sales |
| 706 | Prestations de services | Sales |
| 709 | RRR accordés | Sales |
| **72** | **Production stockée** | **Production** |
| 724 | Variation stocks produits | Production |
| **73** | **Production immobilisée** | **Self-Const.** |
| 732 | Production immobilisée | Self-Const. |
| **74** | **Subventions** | **Subsidies** |
| 741 | Subventions d'équilibre | Subsidies |
| **75** | **Autres produits** | **Operating** |
| 752 | Plus-values cessions | Operating |
| 754 | Quote-part subventions | Operating |
| 756 | Rentrées créances amorties | Operating |
| **76** | **Produits financiers** | **Financial** |
| 761 | Dividendes | Financial |
| 766 | Gains de change | Financial |
| **78** | **Reprises provisions** | **Reversals** |
| 781 | Reprises - actifs NC | Reversals |
| 785 | Reprises - actifs courants | Reversals |

---

## Next Steps

- [Timbre Fiscal](./14-timbre-fiscal.md) - Stamp duty calculation
- [G50 Report](./15-g50-report.md) - TVA declaration
