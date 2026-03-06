# React Modifiers

[![npm](https://img.shields.io/npm/v/react-modifiers?logo=npm&logoColor=%23CB3837&label=npm&labelColor=white&color=%23CB3837)](https://www.npmjs.org/package/react-modifiers)
[![GitHub](https://img.shields.io/npm/v/react-modifiers?logo=github&label=GitHub&color=%23181717)](https://github.com/otomad/react-modifiers.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)][license-url]

[license-url]: https://opensource.org/licenses/MIT

Use modifiers to enhance event handling concisely in React.

This package brings [Vue-style event modifiers](https://vuejs.org/api/built-in-directives.html#v-on) to React, enabling concise and intuitive event handling interception. With React Modifiers, you can chain modifiers to restrict when event handlers execute, eliminating boilerplate code for event filtering, propagation control, and modifier key checks.

## Installation

```Bash
# npm
npm install react-modifiers

# yarn
yarn add react-modifiers

# pnpm
pnpm add react-modifiers
```

## Basic Usage

Import the `mod` utility and chain modifiers to your event handlers:

### Example 1: Keyboard Shortcut (Ctrl+L)

Trigger a handler **only** when the `Ctrl+L` shortcut is pressed:

```jsx
import mod from "react-modifiers";

<button onKeyDown={mod.ctrl.l(e => {
    console.log("Ctrl+L pressed!");
})} />
```

### Example 2: Stop Propagation + Prevent Default

Prevent event bubbling and browser default behavior before executing the handler:

```jsx
import mod from "react-modifiers";

<button onClick={mod.stop.prevent(e => {
    console.log("Click handled without propagation/default behavior!");
})} />

// Or just

<button onClick={mod.handled(e => {
    console.log("Click handled without propagation/default behavior!");
})} />
```

### Example 3: Modifiers Only Without Handler

The handler function can be ignored, it will only handled by modifiers.

```jsx
import mod from "react-modifiers";

<form onSubmit={mod.prevent()} />
```

## Key Concepts

### Chaining Order Matters

Modifiers are executed in the order they are chained. This affects behavior:

- `mod.prevent.self`: Prevents default behavior for **all clicks** (element + children)

- `mod.self.prevent`: Prevents default behavior **only for clicks on the element itself**

### Keyboard Modifier Logic Rules

- For keyboard modifier keys (`ctrl`/`shift`/`alt`/`meta`): Chained modifiers mean **AND** (all must be pressed)

- For keyboard character/function keys (e.g., `a`/`b`/`space`/`tab`/`enter`): Chained modifiers mean **OR** (any one pressed)

## Full Modifier Reference

### 1. Universal Modifiers (All Event Types)

Apply to any React synthetic event type:

|Modifier|Behavior|
|---|---|
|`.stop`|Calls `event.stopPropagation()`|
|`.prevent`|Calls `event.preventDefault()`|
|`.handled`|Shorthand for `.stop.prevent` (calls both methods)|
|`.self`|Triggers handler **only** if the event originates from the element itself (not children)|
|`.once`|Triggers handler a maximum of one time|

### 2. Modifier Key Modifiers (KeyboardEvent/MouseEvent/PointerEvent)

Apply to keyboard, mouse, or pointer events:

|Modifier|Behavior|
|---|---|
|`.ctrl`|Triggers handler only when <kbd>Ctrl</kbd> key is pressed|
|`.shift`|Triggers handler only when <kbd>Shift</kbd> key is pressed|
|`.alt`|Triggers handler only when <kbd>Alt</kbd> key is pressed|
|`.meta`|Triggers handler only when <kbd>Win/Command</kbd> key is pressed|
|`.capsLockOn`|Triggers handler only when <kbd>CapsLock</kbd> is active|
|`.capsLockOff`|Triggers handler only when <kbd>CapsLock</kbd> is inactive|
|`.numLockOn`|Triggers handler only when <kbd>NumLock</kbd> is active|
|`.numLockOff`|Triggers handler only when <kbd>NumLock</kbd> is inactive|
|`.scrollLockOn`|Triggers handler only when <kbd>ScrollLock</kbd> is active|
|`.scrollLockOff`|Triggers handler only when <kbd>ScrollLock</kbd> is inactive|
|`.exact`|Enforces exact modifier key combination (no extra keys)|

> [!NOTE]
>
> - `.ctrl` works for both left and right <kbd>Ctrl</kbd> key (similar to other modifier keys).
> - Do not use both `.capsLockOn` and `.capsLockOff` (similar to other lock keys) simultaneously, this will never trigger the handler!

#### `.exact` Examples

```jsx
// Triggers if Ctrl is pressed (even with Alt/Shift)
<button onClick={mod.ctrl(handleClick)} />

// Triggers ONLY if Ctrl is pressed (no other modifier keys)
<button onClick={mod.ctrl.exact(handleClick)} />

// Triggers ONLY if no modifier keys are pressed
<button onClick={mod.exact(handleClick)} />
```


> [!NOTE]
>
> You can put `.exact` anywhere. The following code has the same behavior.
> ```jsx
> <button onKeyDown={mod.ctrl.p.exact(handleClick)} />
> <button onKeyDown={mod.exact.ctrl.p(handleClick)} />
> <button onKeyDown={mod.ctrl.exact.p(handleClick)} />
> ```

### 3. Keyboard-Only Modifiers (KeyboardEvent)

Apply exclusively to keyboard events (`onKeyDown`/`onKeyUp`/`onKeyPress`):

#### Basic Key Modifiers

Common keys supported (case-insensitive):

- `.enter`, `.tab`, `.delete`, `.backspace`, `.space`, `.esc`
- `.up`, `.down`, `.left`, `.right`
- `.pageUp`, `.pageDown`, `.home`, `.end`, `.printScreen`, `.pause`, `.insert`
- All letter/number/symbol keys (`.a`, `.b`, ..., `.z`, `[0]`, `[1]`, ..., `[9]`, ``["`"]``, `["/"]`, `["\\"]`)
- `.application` (also known as context menu key)

> [!NOTE]
>
> - Number and special symbols (e.g., `` ` ``, `/`, `\`) must be wrapped in brackets:
>   - `mod.ctrl["/"](handler)`
>   - `mod.ctrl["\\"](handler)`
>   - `mod.ctrl[0](handler)`
> - Do not use shift-modified symbol keys (e.g. `!`, `@`, `#`, `?`), just use primary symbol keys (e.g. `-`, `=`, `;`, `'`).

#### For Numpad

- It shares the same modifiers as the main. For example, `[0]` works for both <kbd>0/)</kbd> key and numpad <kbd>0</kbd> key. Same as other numbers, `["."]`, `["-"]`, `["/"]`, `.enter`.
- `["+"]` is an alias of `["="]`, and it works for both <kbd>=/+</kbd> key and numpad <kbd>+</kbd> key.
- `["*"]` works for numpad <kbd>\*</kbd> key only, it doesn't work for <kbd>8/\*</kbd> key.

#### Special Keyboard Modifiers

|Modifier|Behavior|
|---|---|
|`.arrow`|Shorthand for `.up.down.left.right` (any arrow key)|
|`.noRepeat`|Triggers handler **only once** for held keys (ignores `event.repeat = true`)|

#### Keyboard Example Combinations

```jsx

// Ctrl+Shift+L OR Ctrl+Shift+P (L/P = OR; Ctrl/Shift = AND)
<button onKeyDown={mod.ctrl.shift.l.p(handleKeyDown)} />

// Ctrl+Shift+L (stop propagation) OR Ctrl+Shift+P (no stop)
<button onKeyDown={mod.ctrl.shift.l.stop.p(handleKeyDown)} />

// Ctrl+/ (special symbol via bracket notation)
<button onKeyDown={mod.ctrl["/"](handleKeyDown)} />

// Arrow key (up/down/left/right) with no repeat
<button onKeyDown={mod.arrow.noRepeat(handleKeyDown)} />
```

### 4. Mouse/Pointer Modifiers (MouseEvent/PointerEvent)

Apply to mouse or pointer events (`onClick`/`onMouseDown`/`onPointerUp` etc.):

|Modifier|Behavior|
|---|---|
|`.left`|Triggers handler only for left mouse button clicks|
|`.right`|Triggers handler only for right mouse button clicks|
|`.middle`|Triggers handler only for middle mouse button clicks|

### 5. Pointer-Only Modifiers (PointerEvent)

Apply exclusively to pointer events (`onPointerDown`/`onPointerEnter` etc.):

|Modifier|Behavior|
|---|---|
|`.mouse`|Triggers handler only for mouse input|
|`.touch`|Triggers handler only for touch input (mobile/tablet)|
|`.pen`|Triggers handler only for stylus/pen input|

## Advanced Examples

### Combine Mouse + Universal Modifiers

```jsx
// Right click only (self), prevent default, trigger once
<button onClick={mod.self.right.prevent.once(handleRightClick)} />
```

### Combine Mouse + Pointer Modifiers

```jsx
// Mouse or touch input, middle or right click only if mouse input
<button onClick={mod.middle.right.mouse.touch.once(handleClick)} />
```

### Complex Keyboard Shortcut

```jsx
// Ctrl+Shift+Delete (prevent default) OR Ctrl+Shift+Backspace (stop propagation)
<button onKeyDown={mod.ctrl.shift.delete.prevent.backspace.stop(handleKeyDown)} />
```

## Notes

* **Event Type Compatibility**: Ensure modifiers match the event type (e.g., `.touch` only works with `onPointerDown`, not `onKeyDown`).

* **Chaining Order**: Always test modifier order—execution is sequential (e.g., `.self.prevent` ≠ `.prevent.self`).

* **Synthetic Events And Native Events**: React Modifiers works with both React synthetic events and native DOM events.

* **Browser Support**: Follows React's browser support matrix—modifiers like `.touch` require PointerEvent support (modern browsers); `.noRepeat` require Chromium 137 and above.

* **TypeScript Support**: Full TypeScript support. Due to technical limitations, the modifiers for non specific events will also be displayed in the suggestion list, but it can report errors normally after use.

## License

react-modifiers is available under the [MIT License][license-url]. See the LICENSE file for more info.
