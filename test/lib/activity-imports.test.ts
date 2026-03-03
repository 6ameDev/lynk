import { describe, it, expect } from 'vitest';
import { rowsToActivityImports } from '../../src/lib/activity-imports';
import { Row } from '../../src/types';

describe('rowsToActivityImports', () => {
    const accountId = 'acc_123';

    it('should map valid rows to ActivityImports', () => {
        const rows: Row[] = [
            {
                transaction: {
                    date: '2023-01-01',
                    activityType: 'BUY',
                    symbol: 'AAPL',
                    quantity: 10,
                    unitPrice: 150,
                    amount: 1500,
                    currency: 'USD',
                    fee: 0,
                    comment: 'Initial Buy',
                },
                error: '',
            },
        ];

        const result = rowsToActivityImports(rows, accountId);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            accountId,
            activityType: 'BUY',
            date: '2023-01-01',
            symbol: 'AAPL',
            quantity: 10,
            unitPrice: 150,
            amount: 1500,
            currency: 'USD',
            fee: 0,
            comment: 'Initial Buy',
            isValid: true,
            errors: undefined,
            lineNumber: 0,
            isDraft: true,
        });
    });

    it('should filter out rows without transactions', () => {
        const rows: Row[] = [
            { error: 'Parse Error' },
        ];

        const result = rowsToActivityImports(rows, accountId);

        expect(result).toHaveLength(0);
    });

    it('should mark imports as invalid if row has an error', () => {
        const errorMessage = 'Invalid symbol';
        const rows: Row[] = [
            {
                transaction: {
                    date: '2023-01-01',
                    activityType: 'BUY',
                    symbol: 'AAPLLLL',
                    quantity: 10,
                    unitPrice: 150,
                    amount: 1500,
                    currency: 'USD',
                    fee: 0,
                },
                error: errorMessage,
            },
        ];

        const result = rowsToActivityImports(rows, accountId);

        expect(result).toHaveLength(1);
        expect(result[0].isValid).toBe(false);
        expect(result[0].errors).toEqual({ general: [errorMessage] });
    });

    it('should handle optional fields like quantity and comment', () => {
        const rows: Row[] = [
            {
                transaction: {
                    date: '2023-01-01',
                    activityType: 'BUY',
                    symbol: 'AAPL',
                    quantity: null,
                    unitPrice: 150,
                    amount: 1500,
                    currency: 'USD',
                    fee: 0,
                    comment: 'test comment'
                },
                error: '',
            },
        ];

        const result = rowsToActivityImports(rows, accountId);

        expect(result[0].quantity).toBeUndefined();
        expect(result[0].comment).toBe('test comment');
    });

    it('should assign correct line numbers', () => {
        const rows: Row[] = [
            { transaction: { date: '2023-01-01', activityType: 'BUY', symbol: 'A', unitPrice: 1, amount: 1, currency: 'USD' } as any, error: '' },
            { transaction: null, error: 'skipped' },
            { transaction: { date: '2023-01-02', activityType: 'SELL', symbol: 'B', unitPrice: 2, amount: 2, currency: 'USD' } as any, error: '' },
        ];

        const result = rowsToActivityImports(rows, accountId);

        expect(result).toHaveLength(2);
        expect(result[0].lineNumber).toBe(0);
        expect(result[1].lineNumber).toBe(2);
    });
});
