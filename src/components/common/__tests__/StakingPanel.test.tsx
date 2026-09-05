import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StakingPanel from '../StakingPanel';

describe('StakingPanel (#815)', () => {
	const nowSec = 1_700_000_000;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(nowSec * 1000);
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanup();
	});

	it('disables the Claim button while unlockLedger is in the future', () => {
		render(
			<StakingPanel keyId="key-1" unlockLedger={nowSec + 3661} onClaim={vi.fn()} />
		);

		expect(screen.getByTestId('staking-claim-button')).toBeDisabled();
	});

	it('enables the Claim button once unlockLedger has passed', () => {
		render(
			<StakingPanel keyId="key-1" unlockLedger={nowSec - 1} onClaim={vi.fn()} />
		);

		expect(screen.getByTestId('staking-claim-button')).not.toBeDisabled();
	});

	it('displays the lock expiry countdown in HH:MM:SS format', () => {
		render(
			<StakingPanel keyId="key-1" unlockLedger={nowSec + 3661} onClaim={vi.fn()} />
		);

		expect(screen.getByTestId('staking-lock-countdown')).toHaveTextContent('01:01:01');
	});

	it('counts down and reaches 00:00:00, enabling Claim without a page reload', () => {
		render(
			<StakingPanel keyId="key-1" unlockLedger={nowSec + 2} onClaim={vi.fn()} />
		);

		expect(screen.getByTestId('staking-lock-countdown')).toHaveTextContent('00:00:02');
		expect(screen.getByTestId('staking-claim-button')).toBeDisabled();

		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(screen.getByTestId('staking-lock-countdown')).toHaveTextContent('00:00:01');
		expect(screen.getByTestId('staking-claim-button')).toBeDisabled();

		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(screen.getByTestId('staking-lock-countdown')).toHaveTextContent('00:00:00');
		expect(screen.getByTestId('staking-claim-button')).not.toBeDisabled();
	});

	it('calls onClaim with the correct key_id when the Claim button is clicked', () => {
		const onClaim = vi.fn();
		render(<StakingPanel keyId={42} unlockLedger={nowSec - 1} onClaim={onClaim} />);

		fireEvent.click(screen.getByTestId('staking-claim-button'));

		expect(onClaim).toHaveBeenCalledTimes(1);
		expect(onClaim).toHaveBeenCalledWith(42);
	});

	it('keeps the Claim button disabled while a claim is already in flight', () => {
		render(
			<StakingPanel
				keyId="key-1"
				unlockLedger={nowSec - 1}
				onClaim={vi.fn()}
				isClaiming
			/>
		);

		const claimButton = screen.getByTestId('staking-claim-button');
		expect(claimButton).toBeDisabled();
		expect(claimButton).toHaveTextContent('Claiming…');
	});
});
