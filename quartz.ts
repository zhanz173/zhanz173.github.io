import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PersonalNav, PersonalFooter } from "./quartz/components/PersonalNav"
import { ContentAnchor } from "./quartz/components/ContentAnchor"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
// Share the portfolio navigation while retaining the plugin-provided search and theme toggle.
for (const pageLayout of [layout.defaults, ...Object.values(layout.byPageType)]) {
  pageLayout.header = [PersonalNav, ...(pageLayout.header ?? [])]
  pageLayout.beforeBody = [ContentAnchor, ...(pageLayout.beforeBody ?? [])]
  pageLayout.footer = [PersonalFooter]
}
// The YAML loader creates its dispatcher before this file applies local layout overrides.
config.plugins.emitters = config.plugins.emitters.map((emitter) =>
  emitter.name === "PageTypeDispatcher" ? PageTypeDispatcher(layout) : emitter,
)
