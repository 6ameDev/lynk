import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewStep } from '../../src/steps/review-step';
import { rowsToActivityImports } from '../../src/lib';
import { Row } from '../../src/types';

// Mock dependencies
vi.mock('../../src/components/activities-preview', () => ({
    default: ({ activities }: any) => (
        <div data-testid="activities-preview">
            Activities: {activities.length}
        </div>
    ),
}));

const mockSettings = {
    baseCurrency: 'USD',
} as any;

const mockAccount = {
    id: 'acc_123',
    name: 'Test Account',
} as any;

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

describe('Review Step Utilities', () => {
    it('rowsToActivityImports maps rows correctly', () => {
        const activities = rowsToActivityImports(mockRows, 'acc_123');
        expect(activities).toHaveLength(1);
        expect(activities[0]).toMatchObject({
            accountId: 'acc_123',
            activityType: 'BUY',
            symbol: 'AAPL',
            quantity: 10,
            unitPrice: 150,
            amount: 1500,
            currency: 'USD',
            isValid: true,
        });
    });

    it('rowsToActivityImports filters out rows without transactions', () => {
        const rows: Row[] = [{ error: 'No data' }];
        const activities = rowsToActivityImports(rows, 'acc_123');
        expect(activities).toHaveLength(0);
    });

    it('rowsToActivityImports handles errors correctly', () => {
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
                },
                error: 'Invalid symbol',
            },
        ];
        const activities = rowsToActivityImports(rows, 'acc_123');
        expect(activities[0].isValid).toBe(false);
        expect(activities[0].errors).toEqual({ general: ['Invalid symbol'] });
    });
});

describe('Review Step', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with activities', async () => {
        render(
            <ReviewStep
                settings={mockSettings}
                account={mockAccount}
                rows={mockRows}
            />
        );

        // Check for success alert
        await expect.element(page.getByText('All 1 activities are valid')).toBeVisible();
        await expect.element(page.getByText('Your data is ready to be imported.')).toBeVisible();

        // Check for activities preview
        await expect.element(page.getByTestId('activities-preview')).toBeVisible();
        await expect.element(page.getByText('Activities: 1')).toBeVisible();

        // Check for buttons
        await expect.element(page.getByRole('button', { name: /back/i })).toBeVisible();
        await expect.element(page.getByRole('button', { name: /next/i })).toBeVisible();
    });

    it('calls onNext when next button is clicked', async () => {
        const onNext = vi.fn();
        render(
            <ReviewStep
                settings={mockSettings}
                account={mockAccount}
                rows={mockRows}
                onNext={onNext}
            />
        );

        await userEvent.click(page.getByRole('button', { name: /next/i }));
        expect(onNext).toHaveBeenCalled();
    });

    it('calls onBack when back button is clicked', async () => {
        const onBack = vi.fn();
        render(
            <ReviewStep
                settings={mockSettings}
                account={mockAccount}
                rows={mockRows}
                onBack={onBack}
            />
        );

        await userEvent.click(page.getByRole('button', { name: /back/i }));
        expect(onBack).toHaveBeenCalled();
    });

    it('disables buttons when callbacks are missing', async () => {
        render(
            <ReviewStep
                settings={mockSettings}
                account={mockAccount}
                rows={mockRows}
            />
        );

        const backButton = page.getByRole('button', { name: /back/i });
        const nextButton = page.getByRole('button', { name: /next/i });

        await expect.element(backButton).toBeDisabled();
        await expect.element(nextButton).toBeDisabled();
    });
});
