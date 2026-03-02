import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Importer from '../../src/components/importer';
import { useConfigs } from '../../src/hooks/use-configs';
import { useSettings } from '../../src/hooks/use-settings';
import { useActivityHashes } from '../../src/hooks/use-activity-hashes';
import { findProcessor } from '../../src/processors';

// Mock dependencies
vi.mock('../../src/hooks/use-configs', () => ({
  useConfigs: vi.fn(),
}));

vi.mock('../../src/hooks/use-settings', () => ({
  useSettings: vi.fn(),
}));

vi.mock('../../src/hooks/use-activity-hashes', () => ({
  useActivityHashes: vi.fn(),
}));

vi.mock('../../src/processors', () => ({
  findProcessor: vi.fn(),
}));

// Mock inner components that we don't want to deeply render for these tests
vi.mock('../../src/steps/review-step', () => ({
  ReviewStep: ({ onNext, onBack }: any) => (
    <div data-testid="review-step">
      Review Step
      <button onClick={onBack} data-testid="review-back">Back</button>
      <button onClick={onNext} data-testid="review-next">Next</button>
    </div>
  ),
}));

vi.mock('../../src/steps/final-step', () => ({
  FinalStep: ({ onBack }: any) => (
    <div data-testid="final-step">
      Final Step
      <button onClick={onBack} data-testid="final-back">Back</button>
    </div>
  ),
}));

const mockCtx = {
  api: {
    logger: {
      debug: vi.fn(),
      error: vi.fn(),
    },
  },
} as any;

const mockAccount = {
  id: 'acc_123',
  name: 'Test Broker',
  accountType: 'SECURITIES',
  currency: 'USD',
} as any;

const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' });
const mockSetIsParsing = vi.fn();

describe('Importer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useConfigs as any).mockReturnValue({ configs: {} });
    (useSettings as any).mockReturnValue({ data: { baseCurrency: 'USD' } });
    (useActivityHashes as any).mockReturnValue({ data: new Set(), isFetching: false });
  });

  describe('Should succeed when', () => {
    it('file is processed successfully and shows review step', async () => {
      const mockProcessor = {
        process: vi.fn().mockResolvedValue({
          name: 'test.csv',
          tables: [{
            name: 'Transactions',
            rows: [{ transaction: { comment: 'hash1', activityType: 'BUY' } }]
          }]
        })
      };
      (findProcessor as any).mockReturnValue(mockProcessor);

      render(
        <Importer
          ctx={mockCtx}
          account={mockAccount}
          file={mockFile}
          setIsParsing={mockSetIsParsing}
        />
      );

      // Verify parsing state updates
      await expect.poll(() => mockSetIsParsing).toHaveBeenCalledWith(true);

      // Review Step should appear and setIsParsing should be completed
      await expect.element(page.getByTestId('review-step')).toBeVisible();
      await expect.poll(() => mockSetIsParsing).toHaveBeenCalledWith(false);
    });

    it('navigating between Review and Final steps', async () => {
      const mockProcessor = {
        process: vi.fn().mockResolvedValue({
          name: 'test.csv',
          tables: [{
            name: 'Transactions',
            rows: [{ transaction: { comment: 'hash1', activityType: 'BUY' } }]
          }]
        })
      };
      (findProcessor as any).mockReturnValue(mockProcessor);

      render(
        <Importer
          ctx={mockCtx}
          account={mockAccount}
          file={mockFile}
          setIsParsing={mockSetIsParsing}
        />
      );

      // Wait for review step
      await expect.element(page.getByTestId('review-step')).toBeVisible();

      // Click Next to go to Final step
      await userEvent.click(page.getByTestId('review-next'));

      // Wait for final step
      await expect.element(page.getByTestId('final-step')).toBeVisible();

      // review-step should be gone
      await expect.element(page.getByTestId('review-step')).not.toBeInTheDocument();

      // Click Back to return to Review step
      await userEvent.click(page.getByTestId('final-back'));

      await expect.element(page.getByTestId('review-step')).toBeVisible();
      await expect.element(page.getByTestId('final-step')).not.toBeInTheDocument();
    });
  });

  describe('Should handle when', () => {
    it('unsupported broker is selected and shows error', async () => {
      (findProcessor as any).mockReturnValue(null); // Unsupported

      render(
        <Importer
          ctx={mockCtx}
          account={mockAccount}
          file={mockFile}
          setIsParsing={mockSetIsParsing}
        />
      );

      await expect.element(page.getByText('Failed Processing!')).toBeVisible();
      await expect.element(page.getByText(/Support for Test Broker broker hasn't been added yet./)).toBeVisible();
      expect(mockCtx.api.logger.error).toHaveBeenCalled();
    });

    it('file parsing fails and shows error', async () => {
      const mockProcessor = {
        process: vi.fn().mockRejectedValue(new Error('CSV Parsing Error'))
      };
      (findProcessor as any).mockReturnValue(mockProcessor);

      render(
        <Importer
          ctx={mockCtx}
          account={mockAccount}
          file={mockFile}
          setIsParsing={mockSetIsParsing}
        />
      );

      await expect.element(page.getByText('Failed Processing!')).toBeVisible();
      await expect.element(page.getByText('CSV Parsing Error')).toBeVisible();
    });

    it('account or file is missing and nothing is rendered', async () => {
      const { container } = await render(
        <Importer
          ctx={mockCtx}
          account={null}
          file={mockFile}
          setIsParsing={mockSetIsParsing}
        />
      );

      // React 19 / Browser React returns an empty string for unmounted content,
      // or we use exact DOM matching.
      expect(container.innerHTML).toBe('');
      expect(findProcessor).not.toHaveBeenCalled();
    });
  });
});

