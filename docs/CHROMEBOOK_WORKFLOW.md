# Chromebook workflow with GitHub Codespaces

## Create the workspace

1. Open this repository on GitHub.
2. Select **Code → Codespaces → Create codespace on main**.
3. In the Codespaces terminal, confirm the working directory:

```bash
pwd
git status
```

## Clone the upstream reference beside this repository

Run from the root of the Codespace workspace:

```bash
git clone --depth 1 https://github.com/zeldaret/oot.git ../oot-reference
```

This keeps the upstream reference outside the `oot-dsi` Git repository. Do not edit the reference clone as part of this project.

Record the upstream revision:

```bash
git -C ../oot-reference rev-parse HEAD
```

## Generate a source inventory

Run:

```bash
python3 scripts/inspect_reference.py ../oot-reference
```

The script reports top-level entries, file counts by extension, and source subdirectories. It does not read or extract ROMs or game assets.

## Save project notes

Edit the Markdown files under `docs/` in the browser editor. Commit only project documentation, original code, and permitted test material.

Before committing:

```bash
git status --short
git diff --check
```

Then commit and push through the Source Control panel or:

```bash
git add README.md docs scripts
git commit -m "Add initial OOT DSi research workspace"
git push
```

## Practical notes

- Codespaces runs the Linux tools in the cloud; the Chromebook is just the browser/terminal client.
- A Codespace does not automatically connect to the physical DSi.
- Early source inspection does not require a ROM.
- The upstream project's complete build process requires a matching game copy to extract assets. Keep any such files local and do not upload them to GitHub.
- Check your Codespaces usage allowance before leaving a machine running.
