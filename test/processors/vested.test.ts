import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vestedProcessor } from '../../src/processors/vested';
import { parseFile, getFileMeta } from '../../src/lib';

// Mock dependencies
vi.mock('../../src/lib', () => ({
    parseFile: vi.fn(),
    getFileMeta: vi.fn(),
}));

describe('vestedProcessor', () => {
    const mockFile = new File(['test data'], 'vested.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    beforeEach(() => {
        vi.clearAllMocks();
        (getFileMeta as any).mockReturnValue({ name: 'vested', format: 'xlsx' });
    });

    it('should process a valid Vested XLSX with multiple sheets successfully', async () => {
        const tradesRows = [
            {
                'Date': '2023-01-01',
                'Time In Utc': '12:00:00',
                'Name': 'Apple Inc.',
                'Ticker': 'AAPL',
                'Activity': 'Buy',
                'Order Type': 'Market',
                'Quantity': '10',
                'Price Per Share In Usd': '150',
                'Cash Amount In Usd': '1500',
                'Commission Charges In Usd': '0',
            },
        ];

        const transfersRows = [
            {
                'Date': '2023-01-02',
                'Time In Utc': '12:00:00',
                'Activity': 'Deposit',
                'Cash Amount (In USD)': '5000',
            },
        ];

        (parseFile as any).mockResolvedValue([
            { name: 'Trades', rawRows: tradesRows, rows: [] },
            { name: 'Transfers', rawRows: transfersRows, rows: [] },
            { name: 'Unknown', rawRows: [], rows: [] }, // Should be ignored
        ]);

        const result = await vestedProcessor.process({ configs: {} as any, file: mockFile });

        expect(result.tables).toHaveLength(2);

        // Trades verification
        const tradesTable = result.tables.find(t => t.name === 'Trades');
        expect(tradesTable?.rows).toHaveLength(1);
        expect(tradesTable?.rows[0].transaction).toMatchObject({
            activityType: 'BUY',
            symbol: 'AAPL',
            amount: 1500,
        });

        // Transfers verification
        const transfersTable = result.tables.find(t => t.name === 'Transfers');
        expect(transfersTable?.rows).toHaveLength(1);
        expect(transfersTable?.rows[0].transaction).toMatchObject({
            activityType: 'Deposit',
            amount: 5000,
        });
    });

    it('should throw an error if a sheet is missing required columns', async () => {
        const badTradesRows = [{ 'Date': '2023-01-01' }]; // Missing most columns

        (parseFile as any).mockResolvedValue([
            { name: 'Trades', rawRows: badTradesRows, rows: [] },
        ]);

        await expect(vestedProcessor.process({ configs: {} as any, file: mockFile }))
            .rejects.toThrow(/Trades sheet in Vested XLSX file is missing columns/);
    });

    it('should throw an error if a sheet contains unsupported activities', async () => {
        const tradesRows = [
            {
                'Date': '2023-01-01',
                'Time In Utc': '12:00:00',
                'Name': 'Apple Inc.',
                'Ticker': 'AAPL',
                'Activity': 'Bonus', // Unsupported
                'Order Type': 'Market',
                'Quantity': '10',
                'Price Per Share In Usd': '150',
                'Cash Amount In Usd': '1500',
                'Commission Charges In Usd': '0',
            },
        ];

        (parseFile as any).mockResolvedValue([
            { name: 'Trades', rawRows: tradesRows, rows: [] },
        ]);

        await expect(vestedProcessor.process({ configs: {} as any, file: mockFile }))
            .rejects.toThrow(/Unsupported Vested Trades activities: Bonus/);
    });

    it('should throw an error for non-xlsx files', async () => {
        const badFile = new File([], 'test.csv');
        await expect(vestedProcessor.process({ configs: {} as any, file: badFile }))
            .rejects.toThrow(/Only XLSX is supported/);
    });

    it('should handle dates correctly', async () => {
        const incomeRows = [
            {
                'Date': '2023-01-01',
                'Time In Utc': '12:00:00',
                'Activity': 'Dividend',
                'Ticker': 'MSFT',
                'Gross Cash Amount In Usd': '10.5',
            },
        ];

        (parseFile as any).mockResolvedValue([
            { name: 'Income', rawRows: incomeRows, rows: [] },
        ]);

        const result = await vestedProcessor.process({ configs: {} as any, file: mockFile });
        expect(result.tables[0].rows[0].transaction?.date).toBe('2023-01-01');
    });
});
