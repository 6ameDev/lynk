import { describe, it, expect, vi, beforeEach } from 'vitest';
import { zerodhaProcessor } from '../../src/processors/zerodha';
import { parseFile, getFileMeta } from '../../src/lib';
import { Configs } from '../../src/types';

// Mock dependencies
vi.mock('../../src/lib', () => ({
  parseFile: vi.fn(),
  getFileMeta: vi.fn(),
}));

describe('zerodhaProcessor', () => {
  const mockFile = new File(['test data'], 'zerodha.csv', { type: 'text/csv' });

  beforeEach(() => {
    vi.clearAllMocks();
    (getFileMeta as any).mockReturnValue({ name: 'zerodha', format: 'csv' });
  });

  it('should process a valid Zerodha CSV successfully', async () => {
    const rawRows = [
      {
        symbol: 'ZOMATO',
        isin: 'INE123456789',
        trade_date: '2022-08-05',
        exchange: 'NSE',
        segment: 'EQ',
        series: 'EQ',
        trade_type: 'buy',
        auction: 'false',
        quantity: '852.000000',
        price: '58.099998',
        trade_id: '76593544',
        order_id: '1300000006553812',
        order_execution_time: '2022-08-05T10:36:28'
      },
      {
        symbol: 'RELIANCE',
        isin: 'INE123456790',
        trade_date: '2022-12-20',
        exchange: 'BSE',
        segment: 'EQ',
        series: 'EQ',
        trade_type: 'sell',
        auction: 'false',
        quantity: '10.000000',
        price: '2500.000000',
        trade_id: '88888888',
        order_id: '1300000008888888',
        order_execution_time: '2022-12-20T11:00:00'
      }
    ];

    (parseFile as any).mockResolvedValue([{ name: 'Default', rawRows, rows: [] }]);

    const result = await zerodhaProcessor.process({ configs: { zerodhaSymbolMap: {} } as any, file: mockFile });

    expect(result.tables).toHaveLength(1);
    const table = result.tables[0];
    expect(table.rows).toHaveLength(4);

    expect(table.rows[0].transaction).toMatchObject({
      date: '2022-12-20',
      activityType: 'SELL',
      symbol: 'RELIANCE.BO',
      quantity: 10,
      unitPrice: 2500,
    });
    expect(table.rows[1].transaction).toMatchObject({
      date: '2022-12-20',
      activityType: 'WITHDRAWAL',
      symbol: '',
      amount: 25000,
    });

    expect(table.rows[2].transaction).toMatchObject({
      date: '2022-08-05',
      activityType: 'BUY',
      symbol: 'ZOMATO.NS',
      quantity: 852.0,
      unitPrice: 58.099998,
    });
    expect(table.rows[3].transaction).toMatchObject({
      date: '2022-08-05',
      activityType: 'DEPOSIT',
      symbol: '',
      amount: 852 * 58.099998,
    });
  });

  it('should throw an error for unsupported file formats', async () => {
    const badFile = new File([], 'test.xlsx');
    await expect(zerodhaProcessor.process({ configs: {} as any, file: badFile }))
      .rejects.toThrow(/Only CSV is supported/);
  });

  it('should throw an error if required columns are missing', async () => {
    const rawRows = [
      { 'symbol': 'ZOMATO', 'trade_date': '2022-08-05' },
    ];

    (parseFile as any).mockResolvedValue([{ name: 'Default', rawRows, rows: [] }]);

    await expect(zerodhaProcessor.process({ configs: { zerodhaSymbolMap: {} } as any, file: mockFile }))
      .rejects.toThrow(/Zerodha file missing required column/);
  });

  it('should ignore non-trade rows', async () => {
    const rawRows = [
      {
        symbol: 'ZOMATO',
        trade_date: '2022-08-05',
        trade_type: 'buy',
        quantity: '10',
        price: '50',
        exchange: 'NSE'
      },
      { symbol: 'Total', trade_date: '', trade_type: '', quantity: '', price: '' },
    ];

    (parseFile as any).mockResolvedValue([{ name: 'Default', rawRows, rows: [] }]);

    const result = await zerodhaProcessor.process({ configs: { zerodhaSymbolMap: {} } as any, file: mockFile });
    expect(result.tables[0].rows).toHaveLength(2);
    expect(result.tables[0].rows[0].transaction?.symbol).toBe('ZOMATO.NS');
  });

  it('should implement persistent symbol mapping (global and session)', async () => {
    const rawRows = [
      { symbol: 'ZOMATO', trade_date: '2022-08-01', trade_type: 'buy', quantity: '10', price: '50', exchange: 'BSE' },
      { symbol: 'RELIANCE', trade_date: '2022-09-01', trade_type: 'buy', quantity: '10', price: '2000', exchange: 'NSE' },
      { symbol: 'RELIANCE', trade_date: '2022-10-01', trade_type: 'sell', quantity: '5', price: '2100', exchange: 'BSE' },
    ];

    (parseFile as any).mockResolvedValue([{ name: 'Default', rawRows, rows: [] }]);

    const configs: Configs = {
      kuveraFunds: [],
      zerodhaSymbolMap: { 'ZOMATO': '.NS' }
    };

    const result = await zerodhaProcessor.process({ configs, file: mockFile });
    const rows = result.tables[0].rows;

    expect(rows).toHaveLength(6);

    expect(rows[4].transaction?.symbol).toBe('ZOMATO.NS');
    expect(rows[2].transaction?.symbol).toBe('RELIANCE.NS');
    expect(rows[0].transaction?.symbol).toBe('RELIANCE.NS');

    expect(result.updatedConfigs?.zerodhaSymbolMap).toMatchObject({
      'ZOMATO': '.NS',
      'RELIANCE': '.NS'
    });
  });
});
