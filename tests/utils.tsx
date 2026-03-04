import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

const FALSE_COLOR = "red",
	TRUE_COLOR = "green";

type MaybePromise<T> = T | Promise<T>;

type ButtonAttrs = React.DOMAttributes<HTMLButtonElement>;
type ButtonEvents = { [event in keyof ButtonAttrs]?: event extends `on${string}` ? ButtonAttrs[event] : never };

type UserTestCallback = (button: HTMLButtonElement) => MaybePromise<boolean>;

export const change = (e: React.BaseSyntheticEvent<Event, HTMLButtonElement>) => (e.currentTarget.style.color = TRUE_COLOR);

export function testEvent(name: string, events: ButtonEvents, userTests: UserTestCallback[] | Record<string, UserTestCallback>) {
	test(name, async () => {
		for (const [key, userTest] of Object.entries(userTests)) {
			let content = name;
			if (!key.match(/^[\d\-\.]$/)) content += ":\n" + key;
			await render(
				<button style={{ color: FALSE_COLOR, zoom: 4, whiteSpace: "pre-line" }} key={key} data-testid={key} {...events}>
					{content}
				</button>,
			);
			const button = page.getByTestId(String(key)).element() as HTMLButtonElement;

			const test = await userTest(button);
			expect(button.style.color).toBe(test ? TRUE_COLOR : FALSE_COLOR);
		}
	});
}
