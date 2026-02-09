import { AccountingValidator } from './src/lib/validations/accounting';
import { Decimal } from 'decimal.js';

async function runTests() {
  console.log('🧪 Running AccountingValidator tests...');

  // 1. Test Balance Validation
  const balancedLines = [
    { debit: new Decimal(100), credit: new Decimal(0) },
    { debit: new Decimal(0), credit: new Decimal(100) },
  ];
  const unbalancedLines = [
    { debit: new Decimal(100.01), credit: new Decimal(0) },
    { debit: new Decimal(0), credit: new Decimal(100) },
  ];

  const balancedRes = AccountingValidator.validateBalance(balancedLines);
  const unbalancedRes = AccountingValidator.validateBalance(unbalancedLines);

  console.log(balancedRes.isValid ? '✅ Balance: Balanced correctly identified' : '❌ Balance: Balanced failed');
  console.log(!unbalancedRes.isValid ? '✅ Balance: Unbalanced correctly identified' : '❌ Balance: Unbalanced failed');

  // 2. Test Line Amount Validation
  const goodLine = AccountingValidator.validateLineAmounts(new Decimal(50), new Decimal(0));
  const badLineBoth = AccountingValidator.validateLineAmounts(new Decimal(50), new Decimal(20));
  const badLineNone = AccountingValidator.validateLineAmounts(new Decimal(0), new Decimal(0));

  console.log(goodLine.isValid ? '✅ LineAmounts: Valid correctly identified' : '❌ LineAmounts: Valid failed');
  console.log(!badLineBoth.isValid ? '✅ LineAmounts: Both set correctly identified' : '❌ LineAmounts: Both set failed');
  console.log(!badLineNone.isValid ? '✅ LineAmounts: Neither set correctly identified' : '❌ LineAmounts: Neither set failed');

  console.log('🏁 Tests complete.');
}

runTests().catch(console.error);
