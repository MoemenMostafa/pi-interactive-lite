---
name: tmux-pty
description: Drive interactive terminal programs (coding-agent CLIs, auth flows, prompts that need input) through tmux instead of interactive_shell. Use when a command needs a PTY, typed input, or live supervision the plain bash tool can't provide.
---

# tmux as the PTY / interactive-shell replacement

Run interactive CLIs in a detached tmux session and drive them with plain `bash`.
No special tools needed. Core loop: spawn detached → poll output → send keys.

## Core commands

```bash
# Spawn (detached — returns immediately)
tmux new-session -d -s <name> '<command>'          # e.g. 'claude', 'pi', 'codex'

# Read the screen (the program's visible output)
tmux capture-pane -p -t <name>                     # full visible pane
tmux capture-pane -p -t <name> -S -100             # last 100 lines of scrollback

# Send input
tmux send-keys -t <name> 'some text' Enter         # type text, press Enter
tmux send-keys -t <name> Enter                     # just Enter
tmux send-keys -t <name> y y                       # key names (Enter, Escape, C-c, Space, Up, Down)

# Wait for output without a fixed sleep (poll until pattern appears)
until tmux capture-pane -p -t <name> | grep -q 'ready\|>'; do :; done

# Hand control to the user — manual:
tmux attach -t <name>          # in their terminal; detach C-b d
# Hand control programmatically — opens a terminal window with the session
# attached automatically (use for passwords, TOTP, anything that must not
# touch the transcript):
nohup konsole --workdir ~ -e tmux attach -t <name> >/dev/null 2>&1 &
# kitty alternative: kitty -e tmux attach -t <name>

# List / kill
tmux list-sessions
tmux kill-session -t <name>     # also the clean way to quit a spawned CLI
```

## Patterns

- **Agent CLI with occasional input** (codex/claude/gemini/pi): spawn detached, poll
  `capture-pane` until you see its prompt/idle indicator, then `send-keys` the
  answer and Enter. Read the reply from the pane before sending the next turn.
- **Auth flows / password prompts**: spawn detached, poll until the prompt text
  appears, `send-keys`, continue. If the flow needs the user's own typing
  (TOTP, fingerprint), tell them to run `tmux attach -t <name>`.
- **Approval / y-n confirmations**: poll for the prompt, `send-keys y Enter`.
- **Long-running server**: spawn detached, poll the pane or a log file; kill when done.
- **Failure signature**: also grep for `Traceback`, `error`, `refused` while polling —
  silence is not success.

## Gotchas

- `-d` is essential; without it the bash tool call blocks.
- One session per process: name it after the task (`build`, `claude-run`).
- `send-keys -l` sends text literally (skip it when sending key names like Enter).
- C-b is the tmux prefix; `C-c` via send-keys sends Ctrl+C to the *program*.
- A session dies when its command exits — check `tmux kill-session` errors to tell
  "already dead" from "killed".
- Capture what happens while away: `tmux pipe-pane -t <name> -o 'cat >> /tmp/NAME.log'`
  right after spawning — otherwise the session's last scrollback is lost when the
  command exits and the tmux server tears down.
- Headless/SSH-safe: everything works non-interactively; only `attach` needs a real terminal.