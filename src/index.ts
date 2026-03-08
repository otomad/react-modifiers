import type { default as React, SyntheticEvent, EventHandler, ModifierKey } from "react";

const onceEvents = new WeakMap<Element, WeakMap<EventHandler<SyntheticEvent>, Set<string>>>();
const noop = () => {};
const checkIsKeyboardEvent = <T>(e: SyntheticEvent<T>): e is React.KeyboardEvent<T> =>
	e.nativeEvent instanceof KeyboardEvent || e instanceof KeyboardEvent;
const checkIsMouseEvent = <T>(e: SyntheticEvent<T>): e is React.MouseEvent<T> =>
	e.nativeEvent instanceof MouseEvent || e instanceof MouseEvent;
const checkIsPointerEvent = <T>(e: SyntheticEvent<T>): e is React.PointerEvent<T> =>
	e.nativeEvent instanceof PointerEvent || e instanceof PointerEvent;

const modifiersCallee =
	(modifiers: Set<LowerCasedAllEventModifiers | (string & {})>) =>
	<T extends SyntheticEvent>(listener: EventHandler<T> = noop): EventHandler<T> => {
		if (modifiers.size === 0) throw new RangeError("You have not use any modifiers");
		const modifierKeys: Set<ModifierKeyEventModifiers> = modifiers.intersection(new Set(modifierKeyEventModifiers));
		const otherKeys: Set<KeyboardEventModifiers> = modifiers.intersection(
			new Set(lowerCasedKeyboardEventModifiers),
		);
		const exact = modifiers.has("exact");
		return e => {
			const type = e.type as keyof HTMLElementEventMap;
			if (onceEvents.get(e.currentTarget)?.get(listener)?.has(type)) return;
			const isKeyboardEvent = checkIsKeyboardEvent(e),
				isMouseEvent = checkIsMouseEvent(e),
				isPointerEvent = checkIsPointerEvent(e);
			let code: string;
			if (exact && (isKeyboardEvent || isMouseEvent || isPointerEvent)) {
				if (
					(!modifierKeys.has("ctrl") && e.ctrlKey) ||
					(!modifierKeys.has("shift") && e.shiftKey) ||
					(!modifierKeys.has("alt") && e.altKey) ||
					(!modifierKeys.has("meta") && e.metaKey)
				)
					return;
			}
			const baseEventModifiersEnabler = new BaseEventModifiersEnabler(e);
			for (const modifier of modifiers) {
				if (modifier === "exact") continue;
				if (!baseEventModifiersEnabler.disabled)
					switch (modifier) {
						case "stop":
							e.stopPropagation();
							continue;
						case "prevent":
							e.preventDefault();
							continue;
						case "handled":
							e.preventDefault();
							e.stopPropagation();
							continue;
						case "self":
							if (e.target !== e.currentTarget) return;
							continue;
						case "norepeat":
							if (isKeyboardEvent && e.repeat) return;
							continue;
						case "once":
							if (e.currentTarget == null) continue;
							const currentEventTargets = onceEvents.get(e.currentTarget) ?? new WeakMap();
							const currentEventTypes = currentEventTargets.get(listener) ?? new Set();
							currentEventTypes.add(type);
							currentEventTargets.set(listener, currentEventTypes);
							onceEvents.set(e.currentTarget, currentEventTargets);
							continue;
					}
				if (isKeyboardEvent || isMouseEvent || isPointerEvent) {
					if (modifierKeyEventModifiers.includes(modifier)) {
						if (isKeyboardEvent && otherKeys.size === 0 && type === "keyup") {
							if (
								(modifier === "ctrl" && ["ControlLeft", "ControlRight"].includes(e.code)) ||
								(modifier === "shift" && ["ShiftLeft", "ShiftRight"].includes(e.code)) ||
								(modifier === "alt" && ["AltLeft", "AltRight", "AltGraph", "AltGr"].includes(e.code)) ||
								(modifier === "meta" && ["MetaLeft", "MetaRight"].includes(e.code))
							)
								continue;
							else return;
						} else {
							if (
								(modifier === "ctrl" && e.ctrlKey) ||
								(modifier === "shift" && e.shiftKey) ||
								(modifier === "alt" && e.altKey) ||
								(modifier === "meta" && e.metaKey)
							)
								continue;
							else return;
						}
					}
					if (lockKeyEventModifiers.includes(modifier)) {
						const { key, on } = resolveLockKey(modifier);
						if (e.getModifierState(key) !== on) return;
						else continue;
					}
				}
				if (isPointerEvent && pointerEventModifiers.includes(modifier)) {
					const pointerType = getPointerType(e);
					if (pointerType != undefined)
						baseEventModifiersEnabler.enableByPointerEvent = pointerType === modifier;
				}
				if (isMouseEvent && mouseEventModifiers.includes(modifier))
					baseEventModifiersEnabler.enableByMouseEvent = e.button === mouseButtonCodes[modifier];
				if (isKeyboardEvent && lowerCasedKeyboardEventModifiers.includes(modifier)) {
					code ??= unifyKeyboardCode(e.code);
					baseEventModifiersEnabler.enableByKeyboardEvent = code === modifier;
				}
			}
			if (baseEventModifiersEnabler.disabled) return;
			listener(e);
		};
	};

const getProxy = (declaredModifiers: Set<LowerCasedAllEventModifiers> = new Set()) =>
	new Proxy(modifiersCallee(declaredModifiers), {
		get(_, modifier) {
			if (typeof modifier === "symbol") return;
			modifier = modifier.toLowerCase();
			if (modifier in aliases) modifier = aliases[modifier as keyof typeof aliases];
			const lowerCasedModifier = modifier as LowerCasedAllEventModifiers;
			const newDeclaredModifiers = new Set(declaredModifiers);
			if (lowerCasedModifier === "arrow")
				(["up", "down", "left", "right"] as const).forEach(newDeclaredModifiers.add);
			else newDeclaredModifiers.add(lowerCasedModifier);
			return getProxy(newDeclaredModifiers);
		},
		has: (_, modifier) => allEventModifiers.includes(modifier),
		ownKeys: () => allEventModifiers,
	});

const mod = getProxy() as unknown as ModifiersRoot;

export default mod;

// prettier-ignore
const baseEventModifiers = ["stop", "prevent", "handled", "self", "once", "noRepeat"] as const;
// prettier-ignore
const modifierKeyEventModifiers = ["ctrl", "shift", "alt", "meta"] as const;
// prettier-ignore
const lockKeyEventModifiers = ["capsLockOn", "capsLockOff", "numLockOn", "numLockOff", "scrollLockOn", "scrollLockOff"] as const;
// prettier-ignore
const mouseEventModifiers = ["left", "right", "middle"] as const;
// prettier-ignore
const pointerEventModifiers = ["mouse", "pen", "touch"] as const;
// prettier-ignore
const keyboardEventModifiers = ["esc", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "tab", "capsLock", "space", "backspace", "enter", "application", "printScreen", "scrollLock", "pause", "insert", "delete", "home", "end", "pageUp", "pageDown", "up", "down", "left", "right", "numLock", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "`", "-", "+", "=", "[", "]", "\\", ";", "'", ",", ".", "/", "*", "arrow"] as const;
const allEventModifiers = [
	...baseEventModifiers,
	...modifierKeyEventModifiers,
	...lockKeyEventModifiers,
	...mouseEventModifiers,
	...pointerEventModifiers,
	...keyboardEventModifiers,
	"exact",
] as const;
const lowerCasedKeyboardEventModifiers = keyboardEventModifiers.map(mod =>
	mod.toLowerCase(),
) as KeyboardEventModifiers[];

const mouseButtonCodes = {
	left: 0,
	middle: 1,
	right: 2,
} as const satisfies Record<MouseEventModifiers, number>;

const aliases = {
	stoppropagation: "stop",
	preventdefault: "prevent",
	control: "ctrl",
	option: "alt",
	win: "meta",
	windows: "meta",
	command: "meta",
	contextmenu: "application",
	menu: "application",
	app: "application",
	applications: "application",
	apps: "application",
	escape: "esc",
	" ": "space",
	"+": "=",
	return: "enter",
	arrowup: "up",
	arrowdown: "down",
	arrowleft: "left",
	arrowright: "right",
} as const;

function unifyKeyboardCode(code: string) {
	code = code.toLowerCase();
	let keyDigitNumpadArrow: string | undefined;
	if (
		(keyDigitNumpadArrow = code.match(/(?:Digit|Numpad)(\d)/i)?.[1]) ||
		(keyDigitNumpadArrow = code.match(/Key([A-Z])/i)?.[1]) ||
		(keyDigitNumpadArrow = code.match(/Arrow(\w+)/i)?.[1])
	)
		return keyDigitNumpadArrow;
	return (
		{
			escape: "esc",
			backquote: "`",
			minus: "-",
			equal: "=",
			bracketleft: "[",
			bracketright: "]",
			backslash: "\\",
			semicolon: ";",
			quote: "'",
			comma: ",",
			period: ".",
			slash: "/",
			numpaddecimal: ".",
			numpadenter: "enter",
			numpadadd: "=",
			numpadsubtract: "-",
			numpadmultiply: "*",
			numpaddivide: "/",
		}[code] ?? code
	);
}

const _capitalize = (string: string) => string[0].toUpperCase() + string.slice(1);
function resolveLockKey(modifier: LockKeyEventModifiers) {
	const key = _capitalize(modifier.replace(/(on|off)$/i, "").replace("lock", "Lock")) as ModifierKey;
	const on = modifier.endsWith("on");
	return { key, on };
}

function getPointerType(e: React.PointerEvent | React.MouseEvent | globalThis.PointerEvent) {
	// For explict pointer events (e.g. `onPointerDown`, `onPointerUp`), React will wrap it as a synthetic pointer event,
	// it will have `pointerType` property.
	if ("pointerType" in e) return e.pointerType as PointerEventModifiers;
	// For `onClick` event, React will wrap it as a synthetic mouse event, but its native event is a pointer event,
	// which will have `pointerType` property in modern browsers (Chromium 92+, Firefox 129+, Safari 18.2+).
	else if ("nativeEvent" in e && "pointerType" in e.nativeEvent)
		return (e.nativeEvent as globalThis.PointerEvent).pointerType as PointerEventModifiers;
	// In older browsers, the native event of `onClick` is a mouse event, so we don't know what the pointer type is.
	else return undefined;
}

class BaseEventModifiersEnabler {
	private isKeyboardEvent: boolean;
	private isMouseEvent: boolean;
	private isPointerEvent: boolean;

	private disableByKeyboardEvent?: boolean;
	private disableByMouseEvent?: boolean;
	private disableByPointerEvent?: boolean;

	constructor(e: SyntheticEvent) {
		this.isKeyboardEvent = checkIsKeyboardEvent(e);
		this.isMouseEvent = checkIsMouseEvent(e);
		this.isPointerEvent = checkIsPointerEvent(e);
	}

	set enableByKeyboardEvent(flag: boolean) {
		this.disableByKeyboardEvent = flag ? false : (this.disableByKeyboardEvent ?? true);
	}
	set enableByMouseEvent(flag: boolean) {
		this.disableByMouseEvent = flag ? false : (this.disableByMouseEvent ?? true);
	}
	set enableByPointerEvent(flag: boolean) {
		this.disableByPointerEvent = flag ? false : (this.disableByPointerEvent ?? true);
	}

	get disabled() {
		const requiedDisables =
			this.isPointerEvent ? [this.disableByPointerEvent, this.disableByMouseEvent]
			: this.isMouseEvent ? [this.disableByMouseEvent]
			: this.isKeyboardEvent ? [this.disableByKeyboardEvent]
			: [];
		return requiedDisables.some(Boolean);
	}
}

export type BaseEventModifiers = (typeof baseEventModifiers)[number];
export type ModifierKeyEventModifiers = (typeof modifierKeyEventModifiers)[number];
export type LockKeyEventModifiers = (typeof lockKeyEventModifiers)[number];
export type MouseEventModifiers = (typeof mouseEventModifiers)[number];
export type PointerEventModifiers = (typeof pointerEventModifiers)[number];
export type KeyboardEventModifiers = (typeof keyboardEventModifiers)[number];
export type AllEventModifiers = (typeof allEventModifiers)[number];
type LowerCasedAllEventModifiers = Lowercase<AllEventModifiers>;

type NarrowEvent<TEvent extends SyntheticEvent | Event, TModifiers extends string, TElement> =
	TEvent extends SyntheticEvent ?
		TEvent &
			(TModifiers & PointerEventModifiers extends never ? unknown : React.PointerEvent<TElement>) &
			(TModifiers & Exclude<MouseEventModifiers, "left" | "right"> extends never ? unknown
			:	React.MouseEvent<TElement>) &
			(TModifiers & Exclude<KeyboardEventModifiers, "left" | "right"> extends never ? unknown
			:	React.KeyboardEvent<TElement>)
	: TEvent extends Event ?
		TEvent &
			(TModifiers & PointerEventModifiers extends never ? unknown : globalThis.PointerEvent) &
			(TModifiers & Exclude<MouseEventModifiers, "left" | "right"> extends never ? unknown
			:	globalThis.MouseEvent) &
			(TModifiers & Exclude<KeyboardEventModifiers, "left" | "right"> extends never ? unknown
			:	globalThis.KeyboardEvent)
	:	never;

type Modifiers<TExclude extends string> = {
	<TEvent extends SyntheticEvent | Event, TElement>(
		listener?: (e: NarrowEvent<TEvent, TExclude, TElement>) => void,
	): (e: NarrowEvent<TEvent, TExclude, TElement>) => void;
} & {
	[modifier in Exclude<AllEventModifiers, TExclude>]: Modifiers<
		| TExclude
		| (modifier extends "capsLockOn" | "capsLockOff" ? "capsLockOn" | "capsLockOff"
		  : modifier extends "numLockOn" | "numLockOff" ? "numLockOn" | "numLockOff"
		  : modifier extends "scrollLockOn" | "scrollLockOff" ? "scrollLockOn" | "scrollLockOff"
		  : modifier)
	>;
};
type ModifiersRoot = Omit<Modifiers<never>, "call">;
