# pi-interactive-lite

Lightweight interactive-shell replacement for [pi](https://pi.dev) (~150 tokens/round vs ~5,000 for a full interactive-shell package).

## What it gives you

1. **`user_input` tool** — ask the user to type a free-form answer (a value, a path, a confirmation text) through pi's native themed input dialog.

   ```json
   { "question": "What port should the dev server use?", "placeholder": "e.g. 3000" }
   ```

   Rules of thumb:
   - Structured choices (options pickers) belong in your host's `question` tool, not here.
   - **Secrets (passwords, TOTP, keys) never go through this tool or the transcript.** Use the skill's attach helper below so the user types them somewhere that isn't logged.

2. **`tmux-pty` skill** — teaches pi itself how to drive interactive terminal programs (coding-agent CLIs, auth flows, approval prompts) through tmux with plain `bash`. tmux *is* the PTY manager; no special tools are needed:

   | Need | Command |
   |---|---|
   | Spawn detached | `tmux new-session -d -s NAME 'CMD'` |
   | Read the screen | `tmux capture-pane -p -t NAME` |
   | Type into the program | `tmux send-keys -t NAME 'text' Enter` |
   | Hand control to the user — auto-open a terminal | `nohup konsole --workdir ~ -e tmux attach -t NAME &` (kitty alternative included) |
   | Capture output while away | `tmux pipe-pane -t NAME -o 'cat >> /tmp/NAME.log'` |
   | Kill | `tmux kill-session -t NAME` |

## Why not just load more machinery?

A full interactive-shell package costs roughly 5,000 tokens of *every* round for schema, descriptions, and prompt text that most tasks never touch. The tmux workflow costs ~0 standing tokens — the skill listing is the only overhead — and covers typing into spawned TUIs, hand-off for secrets, and takeover supervision. Verified end-to-end driving pi's own TUI and `sudo` authorization.

## Requirements

- tmux on PATH (tested on tmux 3.4; add `set -g extended-keys on` to `~/.tmux.conf` so `send-keys` Enter works reliably into TUIs)

## Use

```bash
pi install npm:pi-interactive-lite
```

Or point settings at a checkout: `{ "packages": ["/path/to/pi-interactive-lite"] }`.

MIT licensed.