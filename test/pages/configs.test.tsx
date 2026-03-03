import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ConfigsPage from '../../src/pages/configs';
import { useConfigs } from '../../src/hooks/use-configs';

vi.mock('../../src/hooks/use-configs', () => ({
    useConfigs: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockCtx = {
    api: {
        navigation: {
            navigate: mockNavigate,
        },
    },
} as any;

describe('Configs Page', () => {
    let mockUpdateConfigs: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateConfigs = vi.fn();

        (useConfigs as any).mockReturnValue({
            configs: { kuveraFunds: [] },
            updateConfigs: mockUpdateConfigs,
            isUpdating: false,
        });
    });

    describe('Should be successful when', () => {
        it('initially rendering empty state', async () => {
            render(<ConfigsPage ctx={mockCtx} />);

            await expect.element(page.getByText('Kuvera Funds Mapping')).toBeVisible();
            await expect.element(page.getByText('No fund mappings configured yet.')).toBeVisible();

            // Save button should be disabled because no valid mappings exist
            const saveBtn = page.getByRole('button', { name: 'Save' });
            await expect.element(saveBtn).toBeDisabled();
        });

        it('rendering existing mappings', async () => {
            (useConfigs as any).mockReturnValue({
                configs: {
                    kuveraFunds: [
                        { name: 'Fund 1', symbol: 'F1' },
                        { name: 'Fund 2', symbol: 'F2' },
                    ]
                },
                updateConfigs: mockUpdateConfigs,
                isUpdating: false,
            });

            render(<ConfigsPage ctx={mockCtx} />);

            await expect.poll(() => document.querySelectorAll('input[placeholder="Fund name"]').length).toBe(2);

            const names = document.querySelectorAll('input[placeholder="Fund name"]');
            const symbols = document.querySelectorAll('input[placeholder="Symbol (YahooFinance)"]');

            await expect.element(names[0] as HTMLElement).toHaveValue('Fund 1');
            await expect.element(symbols[0] as HTMLElement).toHaveValue('F1');
            await expect.element(names[1] as HTMLElement).toHaveValue('Fund 2');
            await expect.element(symbols[1] as HTMLElement).toHaveValue('F2');
        });

        it('adding and editing a mapping', async () => {
            render(<ConfigsPage ctx={mockCtx} />);

            // Click Add Mapping
            await userEvent.click(page.getByRole('button', { name: 'Add mapping' }));

            // Two empty inputs should appear (Name and Symbol)
            const nameInput = page.getByPlaceholder('Fund name');
            const symbolInput = page.getByPlaceholder('Symbol (YahooFinance)');

            await expect.element(nameInput).toBeVisible();
            await expect.element(symbolInput).toBeVisible();

            // Edit them
            await userEvent.fill(nameInput, 'New Fund');
            await userEvent.fill(symbolInput, 'NEW.BO');

            await expect.element(nameInput).toHaveValue('New Fund');
            await expect.element(symbolInput).toHaveValue('NEW.BO');
        });

        it('deleting a mapping', async () => {
            (useConfigs as any).mockReturnValue({
                configs: {
                    kuveraFunds: [
                        { name: 'Delete Me', symbol: 'DEL' },
                    ]
                },
                updateConfigs: mockUpdateConfigs,
                isUpdating: false,
            });

            render(<ConfigsPage ctx={mockCtx} />);

            // Ensure it starts visible
            await expect.poll(() => document.querySelectorAll('input[placeholder="Fund name"]').length).toBe(1);

            const names = document.querySelectorAll('input[placeholder="Fund name"]');
            await expect.element(names[0] as HTMLElement).toHaveValue('Delete Me');

            // Click the delete button icon.
            const trashIcon = document.querySelector('.lucide-trash');
            if (trashIcon) {
                await userEvent.click(trashIcon as HTMLElement);
            }

            // The inputs should be removed
            await expect.poll(() => document.querySelectorAll('input[placeholder="Fund name"]').length).toBe(0);
        });

        it('saving valid mappings and navigating home', async () => {
            (useConfigs as any).mockReturnValue({
                configs: {
                    kuveraFunds: [
                        { name: 'Fund 1', symbol: 'F1' },
                    ]
                },
                updateConfigs: mockUpdateConfigs,
                isUpdating: false,
            });

            render(<ConfigsPage ctx={mockCtx} />);

            const saveBtn = page.getByRole('button', { name: 'Save' });
            await expect.element(saveBtn).toBeEnabled();

            await userEvent.click(saveBtn);

            expect(mockUpdateConfigs).toHaveBeenCalledWith({
                kuveraFunds: [{ name: 'Fund 1', symbol: 'F1' }]
            });
            expect(mockNavigate).toHaveBeenCalledWith('/addons/lynk');
        });

        it('navigating back to home', async () => {
            render(<ConfigsPage ctx={mockCtx} />);

            await userEvent.click(page.getByRole('button', { name: 'Back to Home' }));

            expect(mockNavigate).toHaveBeenCalledWith('/addons/lynk');
        });

        it('updating configs and disable save button', async () => {
            (useConfigs as any).mockReturnValue({
                configs: {
                    kuveraFunds: [
                        { name: 'Fund', symbol: 'F' }, // Valid mapping so usually it's enabled
                    ]
                },
                updateConfigs: mockUpdateConfigs,
                isUpdating: true, // But we are updating
            });

            render(<ConfigsPage ctx={mockCtx} />);

            const saveBtn = page.getByRole('button', { name: 'Save' });
            await expect.element(saveBtn).toBeDisabled();
            await expect.element(page.getByText('Saving mappings…')).toBeVisible();
        });
    });

    describe('Should skip', () => {
        it('empty rows when saving', async () => {
            (useConfigs as any).mockReturnValue({
                configs: {
                    kuveraFunds: [
                        { name: 'Valid', symbol: 'VAL' },
                        { name: '  ', symbol: ' ' }, // Should be dropped
                        { name: '', symbol: 'NO_NAME' }, // Should be dropped
                        { name: 'NO_SYM', symbol: '' }, // Should be dropped
                    ]
                },
                updateConfigs: mockUpdateConfigs,
                isUpdating: false,
            });

            render(<ConfigsPage ctx={mockCtx} />);

            await userEvent.click(page.getByRole('button', { name: 'Save' }));

            expect(mockUpdateConfigs).toHaveBeenCalledWith({
                kuveraFunds: [{ name: 'Valid', symbol: 'VAL' }]
            });
        });

        it('duplicates of fund names', async () => {
            (useConfigs as any).mockReturnValue({
                configs: {
                    kuveraFunds: [
                        { name: 'My Fund', symbol: 'MYF' },
                        { name: 'my fund', symbol: 'OTHER' }, // Should be dropped as duplicate
                        { name: 'MY FUND ', symbol: 'DUP' }, // Should be dropped as duplicate
                        { name: 'Different', symbol: 'DIFF' },
                    ]
                },
                updateConfigs: mockUpdateConfigs,
                isUpdating: false,
            });

            render(<ConfigsPage ctx={mockCtx} />);

            await userEvent.click(page.getByRole('button', { name: 'Save' }));

            expect(mockUpdateConfigs).toHaveBeenCalledWith({
                kuveraFunds: [
                    { name: 'My Fund', symbol: 'MYF' },
                    { name: 'Different', symbol: 'DIFF' }
                ]
            });
        });


    });
});
