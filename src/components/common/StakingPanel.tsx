import React, { useEffect, useState } from 'react';
import { Clock, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatCountdownTime } from '@/utils/lockupCountdown.utils';
import { computeRemainingClaimSeconds } from '@/utils/stakingClaim.utils';

export interface StakingPanelProps {
	/** Identifier of the staked key, passed to the contract as `key_id`. */
	keyId: string | number;
	/** Unix timestamp (seconds) at which the stake unlocks. */
	unlockLedger: number;
	/** Called with the key id when the holder claims their unlocked stake. */
	onClaim: (keyId: string | number) => void | Promise<void>;
	/** Whether a claim transaction is currently in flight. */
	isClaiming?: boolean;
	className?: string;
}

const CARD_CLASS =
	'rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-md md:p-8';

/**
 * Staking panel shown on a held key while its stake is locked (#815).
 *
 * Displays a live countdown to `unlockLedger` and gates the Claim button on
 * that countdown, enabling it automatically once the lock expires without
 * requiring a page reload.
 */
const StakingPanel: React.FC<StakingPanelProps> = ({
	keyId,
	unlockLedger,
	onClaim,
	isClaiming = false,
	className,
}) => {
	const [remainingSeconds, setRemainingSeconds] = useState(() =>
		computeRemainingClaimSeconds(unlockLedger)
	);

	useEffect(() => {
		const updateRemaining = () =>
			setRemainingSeconds(computeRemainingClaimSeconds(unlockLedger));

		updateRemaining();

		const intervalId = setInterval(updateRemaining, 1000);
		return () => clearInterval(intervalId);
	}, [unlockLedger]);

	const isLocked = remainingSeconds > 0;
	const formattedTime = formatCountdownTime(remainingSeconds);

	return (
		<section className={cn(CARD_CLASS, className)} data-testid="staking-panel">
			<div className="mb-6 flex items-center gap-2">
				<Coins className="size-5 text-amber-300" aria-hidden="true" />
				<h2 className="font-grotesque text-xl font-black tracking-tight text-white">
					Staked key
				</h2>
			</div>

			<div
				className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300"
				data-testid="staking-lock-countdown"
				aria-label={
					isLocked ? `Stake unlocks in ${formattedTime}` : 'Stake unlocked'
				}
			>
				<Clock className="size-3.5 shrink-0 text-amber-400 animate-pulse" aria-hidden="true" />
				<span className="font-mono tabular-nums">{formattedTime}</span>
			</div>

			<Button
				className="mt-6"
				onClick={() => onClaim(keyId)}
				disabled={isLocked || isClaiming}
				data-testid="staking-claim-button"
			>
				{isClaiming ? 'Claiming…' : 'Claim'}
			</Button>
		</section>
	);
};

export default StakingPanel;
