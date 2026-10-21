import { QuartzComponent } from "./types"
import { pathToRoot } from "../util/path"

export const PersonalNav: QuartzComponent = ({ fileData }) => {
  const root = pathToRoot(fileData.slug!)
  const slug = fileData.slug
  const links = [
    { label: "About", target: "", active: slug === "index" },
    { label: "Research", target: "/research", active: slug === "research" },
    { label: "Experience", target: "/experience", active: slug === "experience" },
  ]
  return (
    <>
      <a class="skip-link" href="#site-content">
        Skip to content
      </a>
      <a class="personal-wordmark" href={`${root}/`}>
        Zhenyu Zhang<span>Research & engineering</span>
      </a>
      <nav class="personal-nav" aria-label="Main navigation">
        {links.map(({ label, target, active }) => (
          <a href={`${root}${target || "/"}`} aria-current={active ? "page" : undefined}>
            {label}
          </a>
        ))}
        <a href={`${root}/#contact`}>Contact</a>
        <a href={`${root}/assets/zhenyu-zhang-cv.pdf`} data-no-popover="true">
          CV <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </>
  )
}

export const PersonalFooter: QuartzComponent = ({ fileData }) => (
  <footer class="personal-footer">
    <span>
      Zhenyu Zhang <span aria-hidden="true">·</span> Machine learning & computational neuroscience
    </span>
    <a href={`${pathToRoot(fileData.slug!)}/research`}>Research notes</a>
    <a href="https://quartz.jzhao.xyz/">Built with Quartz</a>
  </footer>
)
