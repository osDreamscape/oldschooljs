import { objectEntries, randArrItem } from 'e';

import { Items } from '..';
import { BankItem, Item, ItemBank, ReturnedLootItem } from '../meta/types';
import {
	addBanks,
	addItemToBank,
	bankHasAllItemsFromBank,
	multiplyBank,
	removeBankFromBank,
	removeItemFromBank,
	resolveNameBank
} from '../util';
import itemID from '../util/itemID';

export default class Bank {
	public bank: ItemBank;

	constructor(initialBank?: ItemBank) {
		this.bank = initialBank ?? {};
	}

	public amount(item: string | number): number {
		return this.bank[typeof item === 'string' ? itemID(item) : item] ?? 0;
	}

	public add(item: string | number | ReturnedLootItem[] | ItemBank | Bank, quantity = 1): Bank {
		if (Array.isArray(item)) {
			for (const _item of item) this.add(_item.item, _item.quantity);
			return this;
		}

		// Bank.add('Twisted bow');
		// Bank.add('Twisted bow', 5);
		if (typeof item === 'string') {
			this.bank = addItemToBank(this.bank, itemID(item), quantity);
			return this;
		}

		// Bank.add(123);
		if (typeof item === 'number') {
			this.bank = addItemToBank(this.bank, item, quantity);
			return this;
		}

		if (item instanceof Bank) {
			return this.add(item.bank);
		}

		const firstKey = Object.keys(item)[0];
		if (firstKey === undefined) {
			return this;
		}

		if (isNaN(Number(firstKey))) {
			this.add(resolveNameBank(item));
		} else {
			this.bank = addBanks([item, this.bank]);
		}

		return this;
	}

	public remove(
		item: string | number | ReturnedLootItem[] | ItemBank | Bank,
		quantity = 1
	): Bank {
		if (Array.isArray(item)) {
			for (const _item of item) this.remove(_item.item, _item.quantity);
			return this;
		}

		// Bank.remove('Twisted bow');
		// Bank.remove('Twisted bow', 5);
		if (typeof item === 'string') {
			this.bank = removeItemFromBank(this.bank, itemID(item), quantity);
			return this;
		}

		// Bank.remove(123);
		if (typeof item === 'number') {
			this.bank = removeItemFromBank(this.bank, item, quantity);
			return this;
		}

		if (item instanceof Bank) {
			return this.remove(item.bank);
		}

		const firstKey = Object.keys(item)[0];
		if (firstKey === undefined) {
			return this;
		}

		if (isNaN(Number(firstKey))) {
			this.remove(resolveNameBank(item));
		} else {
			this.bank = removeBankFromBank(this.bank, item);
		}

		return this;
	}

	public random(): BankItem | null {
		const entries = objectEntries(this.bank);
		if (entries.length === 0) return null;
		const randomEntry = randArrItem(entries);
		return { id: Number(randomEntry[0]), qty: randomEntry[1] };
	}

	public multiply(multiplier: number): this {
		this.bank = multiplyBank(this.bank, multiplier);
		return this;
	}

	public has(items: string | number | (string | number)[] | ItemBank): boolean {
		if (Array.isArray(items)) {
			return items.every((item) => this.amount(item) > 0);
		}

		if (typeof items === 'string' || typeof items === 'number') {
			return this.amount(items) > 0;
		}

		return bankHasAllItemsFromBank(this.bank, items);
	}

	public items(): [Item, number][] {
		const arr: [Item, number][] = [];
		for (const [key, val] of Object.entries(this.bank)) {
			arr.push([Items.get(parseInt(key)), val]);
		}
		return arr;
	}

	public forEach(fn: (item: Item, quantity: number) => unknown): void {
		for (const item of this.items()) {
			fn(...item);
		}
	}

	public filter(fn: (item: Item, quantity: number) => boolean): Bank {
		const result = new Bank();
		for (const item of this.items()) {
			if (fn(...item)) {
				result.add(item[0].id, item[1]);
			}
		}
		return result;
	}

	public values(): ItemBank {
		return this.bank;
	}

	public toString(): string {
		const entries = Object.entries(this.bank);
		if (entries.length === 0) {
			return `No items`;
		}
		const res = [];
		for (const [id, qty] of entries.sort((a, b) => b[1] - a[1])) {
			res.push(`${qty.toLocaleString()}x ${Items.get(Number(id))?.name ?? 'Unknown item'}`);
		}

		return res.join(', ');
	}

	public get length(): number {
		return Object.keys(this.bank).length;
	}
}