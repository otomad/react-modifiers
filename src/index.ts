import type { SyntheticEvent, EventHandler, KeyboardEvent, MouseEvent, PointerEvent, ModifierKey } from "react";

const onceEvents = new WeakMap<EventHandler<SyntheticEvent>, Set<string>>();
const noop = () => {};
const isKeyboardEvent = <T>(e: SyntheticEvent<T>): e is KeyboardEvent<T> => e.nativeEvent instanceof KeyboardEvent || e instanceof KeyboardEvent;
const isMouseEvent = <T>(e: SyntheticEvent<T>): e is MouseEvent<T> => e.nativeEvent instanceof MouseEvent || e instanceof MouseEvent;
const isPointerEvent = <T>(e: SyntheticEvent<T>): e is PointerEvent<T> => e.nativeEvent instanceof PointerEvent || e instanceof PointerEvent;

const modifiersCallee =
	(modifiers: (LowerCasedAllEventModifiers | (string & {}))[]) =>
	<T extends SyntheticEvent>(listener: EventHandler<T> = noop): EventHandler<T> => {
		if (modifiers.length === 0) throw new RangeError("You have not use any modifiers");
		const modifierKeys = modifiers.filter(modifier => modifierKeyEventModifiers.includes(modifier)) as ModifierKeyEventModifiers[];
		const otherKeys = modifiers.filter(modifier => lowerCasedKeyboardEventModifiers.includes(modifier)) as KeyboardEventModifiers[];
		const pointers = modifiers.filter(modifier => pointerEventModifiers.includes(modifier)) as PointerEventModifiers[];
		const mouseCodes = (modifiers.filter(modifier => lowerCasedMouseEventModifiers.includes(modifier)) as MouseEventModifiers[]).map(
			button => mouseButtonCodes[button],
		);
		if (modifiers.includes("exact") && modifierKeys.length === 0)
			throw new RangeError("You are using the `exact` modifier without any modifier keys (like ctrl, shift, alt, meta), just remove it");
		return e => {
			const type = e.type as keyof HTMLElementEventMap;
			if (onceEvents.get(listener)?.has(type)) return;
			for (const modifier of modifiers) {
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
						if (isKeyboardEvent(e) && e.repeat) return;
						continue;
					case "once":
						const currentEventTypes = onceEvents.get(listener) ?? new Set<string>();
						currentEventTypes.add(type);
						onceEvents.set(listener, currentEventTypes);
						continue;
				}
				if (isKeyboardEvent(e) || isMouseEvent(e) || isPointerEvent(e)) {
					if (isKeyboardEvent(e) && otherKeys.length === 0 && type === "keyup") {
						if (
							(modifier === "ctrl" && !["ControlLeft", "ControlRight"].includes(e.code)) ||
							(modifier === "shift" && !["ShiftLeft", "ShiftRight"].includes(e.code)) ||
							(modifier === "alt" && !["AltLeft", "AltRight", "AltGraph", "AltGr"].includes(e.code)) ||
							(modifier === "meta" && !["MetaLeft", "MetaRight"].includes(e.code))
						)
							return;
					} else if (
						(modifier === "ctrl" && !e.ctrlKey) ||
						(modifier === "shift" && !e.shiftKey) ||
						(modifier === "alt" && !e.altKey) ||
						(modifier === "meta" && !e.metaKey)
					)
						return;
					else if (
						(modifier === "ctrl" && e.ctrlKey) ||
						(modifier === "shift" && e.shiftKey) ||
						(modifier === "alt" && e.altKey) ||
						(modifier === "meta" && e.metaKey)
					)
						continue;
					if (modifier === "exact")
						if (
							(!modifierKeys.includes("ctrl") && e.ctrlKey) ||
							(!modifierKeys.includes("shift") && e.shiftKey) ||
							(!modifierKeys.includes("alt") && e.altKey) ||
							(!modifierKeys.includes("meta") && e.metaKey)
						)
							return;
						else continue;
					if (lockKeyEventModifiers.includes(modifier)) {
						const key = modifier
							.replace(/(on|off)$/i, "")
							.replace("lock", "Lock")
							.replace(/^\w/, c => c.toUpperCase()) as ModifierKey;
						const on = modifier.endsWith("on");
						if (e.getModifierState(key) !== on) return;
						else continue;
					}
				}
			}
			if (isPointerEvent(e) && pointers.length && !pointers.includes(e.pointerType)) return;
			if (isMouseEvent(e) && mouseCodes.length && !mouseCodes.some(code => e.buttons & code)) return;
			if (isKeyboardEvent(e) && otherKeys.length) {
				const code = unifyKeyboardCode(e.code);
				if (lowerCasedKeyboardEventModifiers.includes(code) && !otherKeys.includes(code)) return;
			}
			listener(e);
		};
	};

const getProxy = (declaredModifiers: LowerCasedAllEventModifiers[] = []) =>
	new Proxy(modifiersCallee(declaredModifiers), {
		get(_, modifier) {
			if (typeof modifier === "symbol") return;
			modifier = modifier.toLowerCase();
			if (modifier in aliases) modifier = aliases[modifier as keyof typeof aliases];
			const lowerCasedModifier = modifier as LowerCasedAllEventModifiers;
			return getProxy([...declaredModifiers, ...(declaredModifiers.includes(lowerCasedModifier) ? [] : [lowerCasedModifier])]);
		},
		has: (_, modifier) => allEventModifiers.includes(modifier),
		ownKeys: () => allEventModifiers,
	});

const mod = getProxy() as unknown as ModifiersRoot;

export default mod;

// prettier-ignore
const baseEventModifiers = ["stop", "prevent", "handled", "self", "once", "noRepeat"] as const;
// prettier-ignore
const modifierKeyEventModifiers = ["ctrl", "shift", "alt", "meta", "exact"] as const;
// prettier-ignore
const lockKeyEventModifiers = ["capsLockOn", "capsLockOff", "numLockOn", "numLockOff", "scrollLockOn", "scrollLockOff"] as const;
// prettier-ignore
const mouseEventModifiers = ["left", "right", "middle"] as const;
// prettier-ignore
const pointerEventModifiers = ["mouse", "pen", "touch"] as const;
// prettier-ignore
const keyboardEventModifiers = ["esc", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "tab", "capsLock", "space", "backspace", "enter", "application", "printScreen", "scrollLock", "pause", "insert", "delete", "home", "end", "pageUp", "pageDown", "up", "down", "left", "right", "numLock", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "`", "-", "+", "=", "[", "]", "\\", ";", "'", ",", ".", "/", "*"] as const;
const allEventModifiers = [
	...baseEventModifiers,
	...modifierKeyEventModifiers,
	...lockKeyEventModifiers,
	...mouseEventModifiers,
	...pointerEventModifiers,
	...keyboardEventModifiers,
] as const;
const lowerCasedMouseEventModifiers = mouseEventModifiers.map(mod => mod.toLowerCase()) as MouseEventModifiers[],
	lowerCasedKeyboardEventModifiers = keyboardEventModifiers.map(mod => mod.toLowerCase()) as KeyboardEventModifiers[];

const mouseButtonCodes = {
	left: 1,
	right: 2,
	middle: 4,
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

type BaseEventModifiers = (typeof baseEventModifiers)[number];
type ModifierKeyEventModifiers = (typeof modifierKeyEventModifiers)[number];
type LockKeyEventModifiers = (typeof lockKeyEventModifiers)[number];
type MouseEventModifiers = (typeof mouseEventModifiers)[number];
type PointerEventModifiers = (typeof pointerEventModifiers)[number];
type KeyboardEventModifiers = (typeof keyboardEventModifiers)[number];
type AllEventModifiers = BaseEventModifiers | ModifierKeyEventModifiers | LockKeyEventModifiers | MouseEventModifiers | PointerEventModifiers | KeyboardEventModifiers;
type LowerCasedAllEventModifiers = Lowercase<AllEventModifiers>;

type Modifiers<TExclude extends string> = {
	<TEvent extends SyntheticEvent>(listener?: EventHandler<TEvent>): EventHandler<TEvent>;
	<TEvent extends Event>(listener?: (e: TEvent) => void): (e: TEvent) => void;
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
