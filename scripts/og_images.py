"""Render the Open Graph preview image for each case study: public/og/<slug>.png, 1200x630.

The text comes from scripts/case-studies.mjs (project title and tech tags from
src/data/projects.ts, the result line from the page's “At a glance” summary), so re-run this
after changing either; postbuild.mjs fails the build if an image is missing.

    python3 scripts/og_images.py            # needs Node, Playwright's Chromium and Pillow

Each page is laid out in HTML in the site's style (the dark gradient of public/og-image.png,
Inter and JetBrains Mono from @fontsource, the accent blue) and screenshotted. Long titles and
results are shrunk until they fit their line budget, and the PNG is reduced to a 256-color
palette so each file stays under 80 kB.
"""
import asyncio
import html
import io
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'og'
FONTS = ROOT / 'node_modules' / '@fontsource'
WIDTH, HEIGHT = 1200, 630
MAX_BYTES = 80_000
SITE = 'smitpatel49.github.io'


def font_face(family: str, file: str, weight: int) -> str:
    return (f"@font-face{{font-family:'{family}';font-weight:{weight};font-style:normal;"
            f"src:url('{(FONTS / file).as_uri()}') format('woff2');}}")


FACES = '\n'.join([
    *(font_face('Inter', f'inter/files/inter-latin-{w}-normal.woff2', w) for w in (400, 600, 700)),
    *(font_face('JetBrains Mono', f'jetbrains-mono/files/jetbrains-mono-latin-{w}-normal.woff2', w) for w in (400, 500)),
])

TEMPLATE = """<!doctype html><html><head><meta charset="utf-8"><style>
{faces}
* {{ box-sizing: border-box; margin: 0; }}
html, body {{ width: {w}px; height: {h}px; overflow: hidden; }}
body {{
  font-family: 'Inter', sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;
  background: linear-gradient(180deg, #1a2c5e 0%, #121b38 42%, #0a0a0c 100%);
  padding: 60px 90px 64px; display: flex; flex-direction: column; position: relative;
}}
body::after {{ content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 8px; background: #3b82f6; }}
.top {{ display: flex; justify-content: space-between; align-items: baseline; gap: 24px; }}
.name {{ font-weight: 600; font-size: 28px; letter-spacing: -0.01em; color: #e2e8f0; }}
.name span {{ font-weight: 400; color: #94a3b8; }}
.url {{ font-family: 'JetBrains Mono', monospace; font-size: 18px; color: #94a3b8; white-space: nowrap; }}
.main {{ flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 26px; }}
h1 {{ font-weight: 700; font-size: var(--title, 60px); line-height: 1.08; letter-spacing: -0.025em; }}
.label {{ font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 17px; letter-spacing: 0.12em;
  color: #7dd3fc; text-transform: uppercase; margin-bottom: 10px; }}
.result {{ font-size: var(--result, 30px); line-height: 1.38; color: #cbd5e1; }}
.tags {{ display: flex; gap: 14px; flex-wrap: nowrap; }}
.tag {{ font-family: 'JetBrains Mono', monospace; font-size: 19px; color: #e2e8f0; padding: 8px 18px;
  border: 1.5px solid rgba(148, 163, 184, 0.45); border-radius: 999px; background: rgba(255, 255, 255, 0.04);
  white-space: nowrap; }}
</style></head><body>
  <div class="top"><div class="name">Smit Patel <span>· Case study</span></div><div class="url">{site}/projects/{slug}</div></div>
  <div class="main">
    <h1>{title}</h1>
    <div><div class="label">Result</div><p class="result">{result}</p></div>
  </div>
  <div class="tags">{tags}</div>
</body></html>"""

# Shrink a block until it fits this many lines (font sizes in px, largest first).
FITS = [('h1', '--title', [60, 54, 48], 2), ('.result', '--result', [30, 28, 26, 24], 3)]


def load_case_studies() -> list[dict]:
    out = subprocess.run(['node', str(ROOT / 'scripts' / 'case-studies.mjs')], check=True,
                         capture_output=True, text=True, cwd=ROOT)
    return json.loads(out.stdout)


def page_html(cs: dict) -> str:
    e = html.escape
    tags = ''.join(f'<span class="tag">{e(t)}</span>' for t in cs['tech'][:3])
    return TEMPLATE.format(faces=FACES, w=WIDTH, h=HEIGHT, site=SITE, slug=e(cs['slug']),
                           title=e(cs['title']), result=e(cs['summary']['result']), tags=tags)


async def fit(page, selector: str, var: str, sizes: list[int], max_lines: int) -> None:
    for size in sizes:
        await page.evaluate(f"document.body.style.setProperty('{var}', '{size}px')")
        lines = await page.evaluate(
            f"(() => {{ const el = document.querySelector('{selector}'); const lh = parseFloat(getComputedStyle(el).lineHeight);"
            " return Math.round(el.getBoundingClientRect().height / lh) })()")
        if lines <= max_lines:
            return
    raise SystemExit(f'og_images: {selector} needs more than {max_lines} lines even at {sizes[-1]}px')


async def check_layout(page, slug: str) -> None:
    problems = await page.evaluate("""(() => {
      const out = [];
      if (document.body.scrollHeight > innerHeight || document.body.scrollWidth > innerWidth) out.push('page overflows');
      const tags = document.querySelector('.tags').getBoundingClientRect();
      if (tags.right > innerWidth - 90) out.push('tags overflow');
      const main = document.querySelector('.main');
      if (main.scrollHeight > main.clientHeight + 1) out.push('text block overflows');
      return out; })()""")
    if problems:
        raise SystemExit(f'og_images: {slug}: {", ".join(problems)}')


def to_palette_png(png: bytes) -> bytes:
    img = Image.open(io.BytesIO(png)).convert('RGB')
    small = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    buf = io.BytesIO()
    small.save(buf, format='PNG', optimize=True)
    return buf.getvalue()


async def main() -> None:
    studies = load_case_studies()
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as scratch:
        tmp = Path(scratch) / 'og.html'
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': WIDTH, 'height': HEIGHT}, device_scale_factor=1)
            for cs in studies:
                tmp.write_text(page_html(cs), encoding='utf-8')
                await page.goto(tmp.as_uri())
                await page.evaluate('document.fonts.ready')
                for selector, var, sizes, max_lines in FITS:
                    await fit(page, selector, var, sizes, max_lines)
                await check_layout(page, cs['slug'])
                data = to_palette_png(await page.screenshot(type='png'))
                if len(data) > MAX_BYTES:
                    raise SystemExit(f"og_images: {cs['slug']}.png is {len(data)} bytes, over {MAX_BYTES}")
                (OUT / f"{cs['slug']}.png").write_bytes(data)
                print(f"og/{cs['slug']}.png  {len(data) / 1000:.0f} kB")
            await browser.close()

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
