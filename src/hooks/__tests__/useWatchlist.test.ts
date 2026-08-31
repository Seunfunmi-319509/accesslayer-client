import { beforeEach, describe, expect, it } from 'vitest';
import type { Course } from '@/services/course.service';
import {
	GUEST_WATCHLIST_KEY,
	WATCHLIST_STORAGE_KEY,
	resolveWatchlistWalletKey,
	useWatchlist,
} from '@/hooks/useWatchlist';

function makeCreator(id: string, title = `Creator ${id}`): Course {
	return {
		id,
		title,
		description: 'A test creator',
		price: 0.05,
		priceStroops: 500_000,
		creatorShareSupply: 100,
		instructorId: id,
		category: 'Art',
		level: 'BEGINNER',
	};
}

describe('resolveWatchlistWalletKey', () => {
	it('returns the guest key when no address is provided', () => {
		expect(resolveWatchlistWalletKey()).toBe(GUEST_WATCHLIST_KEY);
		expect(resolveWatchlistWalletKey('')).toBe(GUEST_WATCHLIST_KEY);
		expect(resolveWatchlistWalletKey(null)).toBe(GUEST_WATCHLIST_KEY);
		expect(resolveWatchlistWalletKey('   ')).toBe(GUEST_WATCHLIST_KEY);
	});

	it('normalises addresses to lowercase', () => {
		expect(resolveWatchlistWalletKey('0xAbCdEf')).toBe('0xabcdef');
		expect(resolveWatchlistWalletKey(' 0XABCDEF ')).toBe('0xabcdef');
	});
});

describe('useWatchlist store', () => {
	beforeEach(() => {
		window.localStorage.clear();
		useWatchlist.setState({ bookmarksByWallet: {} });
	});

	it('adds a creator key when toggling an un-bookmarked creator', () => {
		const creator = makeCreator('1');
		useWatchlist.getState().toggleBookmark('0xabc', creator);

		expect(useWatchlist.getState().getWatchlistCount('0xabc')).toBe(1);
		expect(useWatchlist.getState().isBookmarked('0xabc', '1')).toBe(true);
		expect(useWatchlist.getState().getWatchlist('0xabc')).toEqual([creator]);
	});

	it('removes a creator key when toggling an already-bookmarked creator', () => {
		const creator = makeCreator('1');
		useWatchlist.getState().toggleBookmark('0xabc', creator);
		useWatchlist.getState().toggleBookmark('0xabc', creator);

		expect(useWatchlist.getState().getWatchlistCount('0xabc')).toBe(0);
		expect(useWatchlist.getState().isBookmarked('0xabc', '1')).toBe(false);
	});

	it('scopes bookmarks per wallet address', () => {
		useWatchlist.getState().toggleBookmark('0xaaa', makeCreator('1'));
		useWatchlist.getState().toggleBookmark('0xbbb', makeCreator('2'));

		expect(useWatchlist.getState().getWatchlistCount('0xaaa')).toBe(1);
		expect(useWatchlist.getState().getWatchlistCount('0xbbb')).toBe(1);
		expect(
			useWatchlist.getState().isBookmarked('0xaaa', '2')
		).toBe(false);
	});

	it('treats mixed-case addresses as the same wallet', () => {
		useWatchlist.getState().toggleBookmark('0xAbCd', makeCreator('1'));
		expect(useWatchlist.getState().getWatchlistCount('0xabcd')).toBe(1);
	});

	it('removes a single bookmark by id', () => {
		useWatchlist.getState().toggleBookmark('0xabc', makeCreator('1'));
		useWatchlist.getState().toggleBookmark('0xabc', makeCreator('2'));

		useWatchlist.getState().removeBookmark('0xabc', '1');

		expect(
			useWatchlist.getState().getWatchlist('0xabc').map(c => c.id)
		).toEqual(['2']);
	});

	it('clears all bookmarks for a wallet', () => {
		useWatchlist.getState().toggleBookmark('0xabc', makeCreator('1'));
		useWatchlist.getState().clearWalletBookmarks('0xabc');

		expect(useWatchlist.getState().getWatchlistCount('0xabc')).toBe(0);
	});

	it('persists bookmarks to localStorage keyed by wallet', () => {
		useWatchlist.getState().toggleBookmark('0xabc', makeCreator('1'));

		const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
		expect(raw).toBeTruthy();
		const parsed = JSON.parse(raw as string) as {
			state: { bookmarksByWallet: Record<string, Course[]> };
		};
		expect(parsed.state.bookmarksByWallet['0xabc']).toHaveLength(1);
	});

	it('restores bookmarks from localStorage on rehydration', () => {
		useWatchlist.getState().toggleBookmark('0xabc', makeCreator('1'));

		// Simulate a fresh store rehydrating from persisted storage.
		useWatchlist.persist.rehydrate();

		expect(useWatchlist.getState().getWatchlistCount('0xabc')).toBe(1);
	});
});
