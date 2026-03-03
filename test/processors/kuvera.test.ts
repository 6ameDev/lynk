import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kuveraProcessor } from '../../src/processors/kuvera';
import { parseFile, getFileMeta } from '../../src/lib';

// Mock dependencies
vi.mock('../../src/lib', () => ({
    parseFile: vi.fn(),
    getFileMeta: vi.fn(),
}));

describe('kuveraProcessor', () => {
    const mockFile = new File(['test data'], 'kuvera.csv', { type: 'text/csv' });
    const mockConfigs = {
        kuveraFunds: [
            { name: 'Nippon India Liquid Fund - Direct Plan - Growth', symbol: 'NIPPON_LIQUID' },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getFileMeta as any).mockReturnValue({ name: 'kuvera', format: 'csv' });
    });

    it('should process a valid Kuvera CSV successfully', async () => {
        const rawRows = [
            {
                'Date': '2023-01-01',
                'Order': 'Buy',
                'Name of the Fund': 'Nippon India Liquid Fund - Direct Plan - Growth',
                'Units': '10.5',
                'NAV': '100',
                'Amount INR': '1050',
            },
        ];

        (parseFile as any).mockResolvedValue([{
            name: 'Default',
            rawRows,
            rows: [],
        }]);

        const result = await kuveraProcessor.process({ configs: mockConfigs as any, file: mockFile });

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];

        // Kuvera generates 2 transactions per row (Trade and Cash)
        expect(table.rows).toHaveLength(2);

        // Trade transaction
        expect(table.rows[0].transaction).toMatchObject({
            activityType: 'BUY',
            symbol: 'NIPPON_LIQUID',
            quantity: 10.5,
            unitPrice: 100,
            amount: 1050,
            currency: 'INR',
        });

        // Cash transaction (DEPOSIT for BUY)
        expect(table.rows[1].transaction).toMatchObject({
            activityType: 'DEPOSIT',
            symbol: '',
            quantity: null,
            unitPrice: 1050,
            amount: 1050,
            currency: 'INR',
        });
    });

    it('should throw an error if a required column is missing', async () => {
        const rawRows = [{ 'Date': '2023-01-01', 'Order': 'Buy' }]; // Missing other columns

        (parseFile as any).mockResolvedValue([{
            name: 'Default',
            rawRows,
            rows: [],
        }]);

        await expect(kuveraProcessor.process({ configs: mockConfigs as any, file: mockFile }))
            .rejects.toThrow(/Kuvera CSV missing required column/);
    });

    it('should throw an error if fund mapping is missing', async () => {
        const rawRows = [
            {
                'Date': '2023-01-01',
                'Order': 'Buy',
                'Name of the Fund': 'Unknown Fund',
                'Units': '10',
                'NAV': '100',
                'Amount INR': '1000',
            },
        ];

        (parseFile as any).mockResolvedValue([{
            name: 'Default',
            rawRows,
            rows: [],
        }]);

        await expect(kuveraProcessor.process({ configs: mockConfigs as any, file: mockFile }))
            .rejects.toThrow(/Missing symbol mappings for Kuvera funds/);
    });

    it('should handle unsupported order types by adding an error to the row', async () => {
        const rawRows = [
            {
                'Date': '2023-01-01',
                'Order': 'Switch',
                'Name of the Fund': 'Nippon India Liquid Fund - Direct Plan - Growth',
                'Units': '10',
                'NAV': '100',
                'Amount INR': '1000',
            },
        ];

        (parseFile as any).mockResolvedValue([{
            name: 'Default',
            rawRows,
            rows: [],
        }]);

        const result = await kuveraProcessor.process({ configs: mockConfigs as any, file: mockFile });
        expect(result.tables[0].rows[0].error).toContain('Unsupported Kuvera order type');
    });

    it('should throw an error for non-csv files', async () => {
        const badFile = new File([], 'test.txt');
        await expect(kuveraProcessor.process({ configs: mockConfigs as any, file: badFile }))
            .rejects.toThrow(/Only CSV is supported/);
    });
});
