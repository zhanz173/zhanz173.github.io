# Personal website — local workflow

Quartz project: `D:\Project\quartz`
Content source: `C:\Users\zzy18\OneDrive\Documents\Obsidian Vault\public`

## Edit the site

Edit the Obsidian source, rather than the synced copies in `D:\Project\quartz\content`:

- `index.md`: personal homepage, selected research, publications and manuscript status, contact information.
- `research.md`: thesis overview and complete research reading list.
- `experience.md`: experience, education, teaching, and skills.
- `assets/Zhenyu-Zhang-CV.pdf`: downloadable CV. Replace this file when updating the CV, retaining the filename. The published URL is lowercase: `assets/zhenyu-zhang-cv.pdf`.
- Other Markdown files: existing research posts. Add new posts here, then link them from `research.md`.

The homepage uses HTML for its sections and cards; regular posts and the research and experience pages use Markdown. Set `cssclasses: [personal-home]` only on the homepage and `cssclasses: [portfolio-page]` on the profile pages.

Site presentation lives in the Quartz project:

- `quartz/styles/custom.scss`: responsive layout, typography, colors, and homepage sections.
- `quartz/components/PersonalNav.tsx`: navigation and footer.
- `quartz/components/ContentAnchor.tsx`: keyboard skip target.
- `quartz.config.yaml`: identity, theme, plugins, and page frames.
- `quartz.ts`: custom layout and dispatcher wiring. The YAML loader creates a dispatcher before local overrides, so this file replaces it with the customized layout.

## Preview

In PowerShell, from `D:\Project\quartz`:

    npm run research:preview

Open http://localhost:8080. Source content changes refresh the preview. Stop with Ctrl+C. Restart after changing filesystem links. The wrapper rejects links escaping the Obsidian public folder.

## Build and sync

    npm run research:build

Builds directly from Obsidian into `D:\Project\quartz\public`.

    npm run research:sync
    npm run research:check

Syncs publishable content into the repository and verifies a build. The sync refuses to overwrite unmanaged or locally edited copies. Review the Git diff before committing. The existing GitHub Pages workflow builds the synced `content` folder; it runs when the `v5` branch is pushed or when manually dispatched. A local build does not deploy the site.

## Content boundaries

Keep private notes and attachments outside the Obsidian public folder. Templates, dotfiles, private folders, and unpublished/draft Markdown are excluded by the existing workflow. Attachments in the public folder are intended for sharing, including the downloadable CV. Never point Quartz at the vault root.

Analytics remain disabled. The deployment workflow supplies the hosting base URL. The personal navigation and CV links use relative URLs so they work with GitHub Pages subpaths.
