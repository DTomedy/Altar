import 'server-only';
import { IPaymentService, InitiateTransferParams } from './interfaces';

function getSecretKey(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not set');
  return key;
}

export class PaymentService implements IPaymentService {
  async initiateTransfer(params: InitiateTransferParams) {
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: params.bankCode,
        account_number: params.accountNumber,
        amount: params.amount,
        currency: 'NGN',
        narration: params.narration,
        reference: params.reference,
        debit_currency: 'NGN',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Transfer failed: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async resolveBankAccount(accountNumber: string, bankCode: string) {
    const response = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_number: accountNumber,
        account_bank: bankCode,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Account resolution failed: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async getNigerianBanks() {
    const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch bank list: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async verifyTransaction(txRef: string) {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`,
      { headers: { Authorization: `Bearer ${getSecretKey()}` } }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Verification failed: ${error.message || response.statusText}`);
    }

    return response.json();
  }
}
