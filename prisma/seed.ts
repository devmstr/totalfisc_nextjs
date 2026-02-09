import { PrismaClient, UserRole, AccountType, JournalNature, AuxiliaryType } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { nif: '0000000000' },
    update: {},
    create: {
      companyName: 'TOTALFisc Demo',
      legalForm: 'SARL',
      fiscalYear: 2026,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      nif: '0000000000',
      currency: 'DZD',
    },
  });

  // 2. Create Admin User
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin TOTALFisc',
      password,
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    },
  });

  // 3. Create Default Journals
  const journals = [
    { code: 'ACH', label: 'Achats', nature: JournalNature.ACHAT },
    { code: 'VTE', label: 'Ventes', nature: JournalNature.VENTE },
    { code: 'BNQ', label: 'Banque', nature: JournalNature.BANQUE },
    { code: 'CAI', label: 'Caisse', nature: JournalNature.TRESORERIE, principalAccount: '531000' },
    { code: 'OD', label: 'Opérations Diverses', nature: JournalNature.OD },
    { code: 'RAN', label: 'Report à Nouveau', nature: JournalNature.ANOUV },
  ];

  for (const j of journals) {
    await prisma.journal.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: j.code } },
      update: {},
      create: { ...j, tenantId: tenant.id },
    });
  }

  // 4. Create SCF Chart of Accounts (Subset for Demo)
  const accounts = [
    // Class 1
    { code: '101000', label: 'Capital social', type: AccountType.EQUITY, class: 1 },
    { code: '106100', label: 'Réserve légale', type: AccountType.EQUITY, class: 1 },
    { code: '120000', label: "Résultat de l'exercice (bénéfice)", type: AccountType.EQUITY, class: 1 },
    { code: '164000', label: 'Emprunts bancaires', type: AccountType.LIABILITY, class: 1 },
    
    // Class 2
    { code: '213000', label: 'Constructions', type: AccountType.ASSET, class: 2 },
    { code: '215000', label: 'Installations techniques', type: AccountType.ASSET, class: 2 },
    { code: '218000', label: 'Autres immobilisations corporelles', type: AccountType.ASSET, class: 2 },
    { code: '281000', label: 'Amortissements des immob. corporelles', type: AccountType.ASSET, class: 2 }, // Contra-asset
    
    // Class 3
    { code: '300000', label: 'Stocks de marchandises', type: AccountType.ASSET, class: 3 },
    { code: '380000', label: 'Achats marchandises stockées', type: AccountType.ASSET, class: 3 },
    
    // Class 4
    { code: '401000', label: 'Fournisseurs', type: AccountType.LIABILITY, class: 4, isAuxiliaryRequired: true },
    { code: '411000', label: 'Clients', type: AccountType.ASSET, class: 4, isAuxiliaryRequired: true },
    { code: '431000', label: 'CNAS', type: AccountType.LIABILITY, class: 4 },
    { code: '445660', label: 'TVA déductible', type: AccountType.ASSET, class: 4 },
    { code: '445710', label: 'TVA collectée', type: AccountType.LIABILITY, class: 4 },
    { code: '447000', label: 'Autres impôts (TAP)', type: AccountType.LIABILITY, class: 4 },
    
    // Class 5
    { code: '512000', label: 'Banques (Comptes courants)', type: AccountType.ASSET, class: 5 },
    { code: '531000', label: 'Caisse', type: AccountType.ASSET, class: 5 },
    { code: '581000', label: 'Virements de fonds', type: AccountType.ASSET, class: 5 },
    
    // Class 6
    { code: '600000', label: 'Achats de marchandises vendues', type: AccountType.EXPENSE, class: 6 },
    { code: '613000', label: 'Locations', type: AccountType.EXPENSE, class: 6 },
    { code: '631000', label: 'Rémunérations du personnel', type: AccountType.EXPENSE, class: 6 },
    { code: '644000', label: 'Droits de timbre', type: AccountType.EXPENSE, class: 6 },
    { code: '681000', label: 'Dotations aux amortissements', type: AccountType.EXPENSE, class: 6 },
    
    // Class 7
    { code: '700000', label: 'Ventes de marchandises', type: AccountType.REVENUE, class: 7 },
    { code: '706000', label: 'Prestations de services', type: AccountType.REVENUE, class: 7 },
    { code: '752000', label: 'Plus-values sur cession d\'immobilisations', type: AccountType.REVENUE, class: 7 },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: acc.code } },
      update: {},
      create: { ...acc, tenantId: tenant.id },
    });
  }

  // 5. Create Sample Auxiliaries
  const auxiliaries = [
    { code: 'F001', label: 'Fournisseur Général', type: AuxiliaryType.FOURNISSEUR },
    { code: 'CL001', label: 'Client Alpha', type: AuxiliaryType.CLIENT },
  ];

  for (const aux of auxiliaries) {
    await prisma.auxiliary.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: aux.code } },
      update: {},
      create: { ...aux, tenantId: tenant.id },
    });
  }

  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
