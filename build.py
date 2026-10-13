import pathlib, re, sys
root = pathlib.Path(__file__).parent
src = root / 'src'
order = ['data.js', 'art.js', 'core.js', 'ai.js', 'owner.js', 'console.js', 'dash.js', 'story.js']
js = '\n'.join((src / f).read_text(encoding='utf-8') for f in order)
css = (src / 'styles.css').read_text(encoding='utf-8')
html = (src / 'index.html').read_text(encoding='utf-8')
assert '</script' not in js.lower(), 'script terminator inside JS'
out = html.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
dist = root / 'dist'
dist.mkdir(exist_ok=True)
target = dist / '車況透視鏡_系統原型.html'
target.write_text(out, encoding='utf-8')
print(target, len(out.encode('utf-8')) // 1024, 'KB')
(root / 'index.html').write_text(out, encoding='utf-8')  # GitHub Pages 首頁
print(root / 'index.html')
import re as _re
frag = out
frag = _re.sub(r'(?is)<!doctype html>\s*', '', frag)
frag = _re.sub(r'(?is)<html[^>]*>\s*', '', frag)
frag = _re.sub(r'(?is)</?head>\s*', '', frag)
frag = _re.sub(r'(?is)<meta[^>]*>\s*', '', frag)
frag = _re.sub(r'(?is)<body[^>]*>\s*', '', frag)
frag = _re.sub(r'(?is)</body>\s*', '', frag)
frag = _re.sub(r'(?is)</html>\s*', '', frag)
frag = _re.sub(r'(?is)<link rel="preconnect"[^>]*>\s*', '', frag)
assert frag.lstrip().startswith('<title>'), frag[:80]
(dist / 'carlens.html').write_text(frag, encoding='utf-8')
print(dist / 'carlens.html', len(frag.encode('utf-8')) // 1024, 'KB')
