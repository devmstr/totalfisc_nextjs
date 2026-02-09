import { Decimal } from 'decimal.js'

export class TimbreFiscalService {
  /**
   * Calculate Timbre Fiscal according to Algerian law 2025
   * @param amountTTC Total amount including VAT
   * @param isElectronicPayment If true, exempt from stamp duty
   */
  static calculate(
    amountTTC: Decimal | number,
    isElectronicPayment: boolean = false
  ): Decimal {
    // Electronic payments exempt
    if (isElectronicPayment) {
      return new Decimal(0)
    }

    const amount =
      typeof amountTTC === 'number' ? amountTTC : amountTTC.toNumber()

    // Below or equal 300 DA: exempt
    if (amount <= 300) {
      return new Decimal(0)
    }

    // Calculate tranches (rounded up)
    const tranches = Math.ceil(amount / 100)

    let stamp: number

    // Apply rate based on 2025 Finance Law Article 100
    if (amount <= 30000) {
      stamp = tranches * 1.0 // 1 DA per tranche
    } else if (amount <= 100000) {
      stamp = tranches * 1.5 // 1.5 DA per tranche
    } else {
      stamp = tranches * 2.0 // 2 DA per tranche
    }

    // Apply min/max caps
    // Min: 5 DA, Max: 10,000 DA
    stamp = Math.max(5, Math.min(10000, Math.round(stamp)))

    return new Decimal(stamp)
  }

  /**
   * Check if transaction is exempt from stamp duty
   */
  static isExempt(amountTTC: Decimal | number, isElectronic: boolean): boolean {
    const amount =
      typeof amountTTC === 'number' ? amountTTC : amountTTC.toNumber()
    return isElectronic || amount <= 300
  }
}
