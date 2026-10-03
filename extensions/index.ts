/**
 * user-input — minimal free-text prompt to the user.
 *
 * Replaces the heavyweight interactive-shell/rpiv machinery for the case where
 * the agent just needs the user to type an answer (a value, a path, a secret
 * NOT entered via chat — for secrets prefer telling the user to run `tmux attach`).
 * Uses pi's built-in ctx.ui.input() dialog: one tool, tiny schema (~200 tok/round).
 */
import { execSync } from "node:child_process";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

interface InputParams {
	question: string;
	placeholder?: string;
}

export default function userInputExtension(pi: ExtensionAPI) {
	// user_input works without tmux; the tmux-pty skill needs it. Warn once per session.
	let tmuxPresent: boolean;
	try {
		execSync("tmux -V", { stdio: "ignore" });
		tmuxPresent = true;
	} catch {
		tmuxPresent = false;
	}
	pi.on("session_start", async (_event, ctx: ExtensionContext) => {
		if (tmuxPresent === false && ctx.hasUI) {
			ctx.ui.notify(
				"pi-interactive-lite: tmux not found — the tmux-pty skill needs it " +
					"(apt/dnf/brew install tmux). Without it, only the user_input tool works.",
				"warning",
			);
		}
	});
	pi.registerTool({
		name: "user_input",
		label: "User Input",
		description:
			"Ask the user to type a free-form answer (a value, path, or confirmation text) via an input dialog. Use when you need text the user must supply. Do NOT use for passwords/secrets — spawn the program in tmux (see tmux-pty skill) and open a terminal for the user with `nohup konsole --workdir ~ -e tmux attach -t <session> >/dev/null 2>&1 &` so their typing never touches the transcript.",
		parameters: Type.Object({
			question: Type.String({ description: "What to ask the user." }),
			placeholder: Type.Optional(
				Type.String({ description: "Hint text shown in the empty field." }),
			),
		}),
		promptSnippet: "Prompt the user for typed input",

		async execute(
			_toolCallId: string,
			params: InputParams,
			_signal: AbortSignal,
			_onUpdate: unknown,
			ctx: ExtensionContext,
		) {
			if (!ctx.hasUI) {
				return {
					content: [
						{
							type: "text",
							text: "Error: no UI available (headless mode). Ask via the transcript instead.",
						},
					],
					details: { answer: null },
				};
			}
			const answer = await ctx.ui.input(
				params.question,
				params.placeholder ?? "Your answer",
			);
			if (answer === undefined) {
				return {
					content: [{ type: "text", text: "User cancelled the input." }],
					details: { answer: null },
				};
			}
			return {
				content: [{ type: "text", text: `User answered: ${answer}` }],
				details: { answer },
			};
		},
	});
}