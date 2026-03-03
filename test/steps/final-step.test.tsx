import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinalStep } from '../../src/steps/final-step';
import { toCsv } from '../../src/lib';
import { Row } from '../../src/types';

// Mock dependencies
vi.mock('../../src/lib', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/lib')>();
    return {
        ...actual,
        toCsv: vi.fn(),
    };
});

vi.mock('../../src/components/activities-preview', () => ({
    default: ({ activities }: any) => (
        <div data-testid="activities-preview">
            Activities: {activities.length}
        </div>
    ),
}));

const mockCtx = {
    api: {
        files: {
            openSaveDialog: vi.fn(),
        },
    },
} as any;

const mockSettings = {
    baseCurrency: 'USD',
} as any;

const mockAccount = {
    id: 'acc_123',
    name: 'Test Account',
};

const mockRows: Row[] = [
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
        },
        error: '',
    },
];

const mockTables = [
    {
        rows: mockRows,
    },
];

describe('Final Step', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with activities', async () => {
        render(
            <FinalStep
                ctx={mockCtx}
                settings={mockSettings}
                account={mockAccount as any}
                tables={mockTables}
                fileName="test_file"
            />
        );

        // Check for success alert
        await expect.element(page.getByText('Found 1 new activities')).toBeVisible();
        await expect.element(page.getByText('Your generated file is ready to be downloaded.')).toBeVisible();

        // Check for activities preview
        await expect.element(page.getByTestId('activities-preview')).toBeVisible();
        await expect.element(page.getByText('Activities: 1')).toBeVisible();

        // Check for buttons
        await expect.element(page.getByRole('button', { name: /back/i })).toBeVisible();
        await expect.element(page.getByRole('button', { name: /download/i })).toBeVisible();
    });

    it('calls onBack when back button is clicked', async () => {
        const onBack = vi.fn();
        render(
            <FinalStep
                ctx={mockCtx}
                settings={mockSettings}
                account={mockAccount as any}
                tables={mockTables}
                fileName="test_file"
                onBack={onBack}
            />
        );

        await userEvent.click(page.getByRole('button', { name: /back/i }));
        expect(onBack).toHaveBeenCalled();
    });

    it('calls openSaveDialog with correct data when download is clicked', async () => {
        (toCsv as any).mockReturnValue('mock,csv,data');

        render(
            <FinalStep
                ctx={mockCtx}
                settings={mockSettings}
                account={mockAccount as any}
                tables={mockTables}
                fileName="test_file"
            />
        );

        await userEvent.click(page.getByRole('button', { name: /download/i }));

        expect(toCsv).toHaveBeenCalledWith(mockRows);
        expect(mockCtx.api.files.openSaveDialog).toHaveBeenCalledWith(
            'mock,csv,data',
            'test_file_processed.csv'
        );
    });

    it('does not call openSaveDialog if tables are empty', async () => {
        render(
            <FinalStep
                ctx={mockCtx}
                settings={mockSettings}
                account={mockAccount as any}
                tables={[]}
                fileName="test_file"
            />
        );

        await userEvent.click(page.getByRole('button', { name: /download/i }));

        expect(toCsv).not.toHaveBeenCalled();
        expect(mockCtx.api.files.openSaveDialog).not.toHaveBeenCalled();
        await expect.element(page.getByText('Found 0 new activities')).toBeVisible();
    });
});
