import { describe, it, expect } from 'vitest';
import { normalizeColumns, addHashes } from '../../src/processors/utils';
import { Row, Transaction } from '../../src/types';

describe('normalizeColumns', () => {
    it('should convert headers to snake_case and handle spaces', () => {
        const rows = [
            { 'Date': '2023-01-01', 'Order Type': 'BUY', 'Amount (INR)': 1000 },
            { 'Date': '2023-01-02', 'Order Type': 'SELL', 'Amount (INR)': 2000 },
        ];

        const normalized = normalizeColumns(rows);

        expect(normalized).toHaveLength(2);
        expect(normalized[0]).toEqual({
            date: '2023-01-01',
            order_type: 'BUY',
            amount_inr: 1000,
        });
        expect(normalized[1]).toEqual({
            date: '2023-01-02',
            order_type: 'SELL',
            amount_inr: 2000,
        });
    });

    it('should handle alphanumeric and underscores', () => {
        const rows = [{ ' Fund Name_': 'Test Fund', 'NAV123': 50 }];
        const normalized = normalizeColumns(rows);
        expect(normalized[0]).toEqual({
            fund_name: 'Test Fund',
            nav123: 50,
        });
    });

    it('should return empty array for empty input', () => {
        expect(normalizeColumns([])).toEqual([]);
    });
});

describe('addHashes', () => {
    const accountName = 'test_broker';

    it('should add consistent hashes to transactions', () => {
        const transaction: Transaction = {
            date: '2023-01-01',
            activityType: 'BUY',
            symbol: 'AAPL',
            quantity: 10,
            unitPrice: 150,
            amount: 1500,
            currency: 'USD',
            fee: 0,
        };

        const rows: Row[] = [{ transaction, error: '' }];
        const withHashes = addHashes(rows, accountName);

        expect(withHashes[0].transaction?.comment).toMatch(/^[a-f0-9]+#0$/);

        // Check consistency
        const secondPass = addHashes(rows, accountName);
        expect(secondPass[0].transaction?.comment).toBe(withHashes[0].transaction?.comment);
    });

    it('should handle duplicate transactions with a counter', () => {
        const transaction: Transaction = {
            date: '2023-01-01',
            activityType: 'BUY',
            symbol: 'AAPL',
            quantity: 10,
            unitPrice: 150,
            amount: 1500,
            currency: 'USD',
            fee: 0,
        };

        const rows: Row[] = [
            { transaction, error: '' },
            { transaction: { ...transaction }, error: '' },
        ];

        const withHashes = addHashes(rows, accountName);

        const txn0Comment = withHashes[0].transaction?.comment;
        const txn1Comment = withHashes[1].transaction?.comment;

        expect(txn0Comment).toMatch(/#0$/);
        expect(txn1Comment).toMatch(/#1$/);

        // Hash prefix should be the same
        const hash0 = txn0Comment?.split('#')[0];
        const hash1 = txn1Comment?.split('#')[0];
        expect(hash0).toBe(hash1);
    });

    it('should ignore rows without transactions', () => {
        const rows: Row[] = [{ error: 'some error' }];
        const withHashes = addHashes(rows, accountName);
        expect(withHashes[0]).toEqual(rows[0]);
    });

    it('should handle cash activity types by assigning a default symbol', () => {
        const txn: Transaction = {
            date: '2023-01-01',
            activityType: 'DEPOSIT',
            symbol: '',
            quantity: null,
            unitPrice: 1000,
            amount: 1000,
            currency: 'USD',
            fee: 0,
        };

        const rows: Row[] = [{ transaction: txn, error: '' }];
        const withHashes = addHashes(rows, accountName);

        // Hash should be generated based on $CASH-USD symbol internally
        expect(withHashes[0].transaction?.comment).toBeDefined();
    });
});
