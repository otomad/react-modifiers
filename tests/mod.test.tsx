import mod from "../src";
import { page, userEvent } from "vitest/browser";
import { testEvent, change } from "./utils";

testEvent("click test", { onClick: change }, [
	button => {
		button.click();
		return true;
	},
]);

testEvent(
	"keydown single key test",
	{ onKeyDown: mod.c(change) },
	{
		"press c": async button => {
			button.focus();
			await userEvent.keyboard("c");
			return true;
		},
		"press f": async button => {
			button.focus();
			await userEvent.keyboard("f");
			return false;
		},
	},
);

testEvent(
	"keydown modifier keys test",
	{ onKeyDown: mod.ctrl.l(change) },
	{
		"Ctrl+L": async button => {
			button.focus();
			await userEvent.keyboard("{Ctrl>}L{/Ctrl}");
			return true;
		},
		"Shift+L": async button => {
			button.focus();
			await userEvent.keyboard("{Shift>}L{/Shift}");
			return false;
		},
		"Ctrl+Shift+L": async button => {
			button.focus();
			await userEvent.keyboard("{Ctrl>}{Shift>}L{/Shift}{/Ctrl}");
			return true;
		},
	},
);

testEvent(
	"keydown modifier exact keys test",
	{ onKeyDown: mod.exact.ctrl.l(change) },
	{
		"Ctrl+L": async button => {
			button.focus();
			await userEvent.keyboard("{Ctrl>}L{/Ctrl}");
			return true;
		},
		"Shift+L": async button => {
			button.focus();
			await userEvent.keyboard("{Shift>}L{/Shift}");
			return false;
		},
		"Ctrl+Shift+L": async button => {
			button.focus();
			await userEvent.keyboard("{Ctrl>}{Shift>}L{/Shift}{/Ctrl}");
			return false;
		},
	},
);

testEvent(
	"keydown prevent default test",
	{ onKeyDown: mod.exact.ctrl.shift.l.prevent.p(change) },
	{
		"Ctrl+Shift+L": async button => {
			button.focus();
			await userEvent.keyboard("{Ctrl>}{Shift>}L{/Shift}{/Ctrl}");
			return false;
		},
		"Ctrl+Shift+P": async button => {
			button.focus();
			await userEvent.keyboard("{Ctrl>}{Shift>}P{/Shift}{/Ctrl}");
			return false;
		},
	},
);
