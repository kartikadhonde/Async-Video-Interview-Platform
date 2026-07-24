#!/usr/bin/env python3
import os, re, sys, json

ROOT = os.getcwd()
exclude_dirs = set(['node_modules', '.git', '.venv', '__pycache__', 'folderforzip', 'dist', 'build', 'coverage', '.idea'])
extensions = ['.js', '.jsx', '.ts', '.tsx']

js_files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    parts = dirpath.split(os.sep)
    if any(p in exclude_dirs for p in parts):
        continue
    for f in filenames:
        if any(f.endswith(ext) for ext in extensions):
            rel = os.path.relpath(os.path.join(dirpath, f), ROOT).replace('\\','/')
            js_files.append(rel)

regex_import1 = re.compile(r"import\s+[^'\"\n]+\s+from\s+['\"](.+?)['\"]")
regex_import2 = re.compile(r"import\s+['\"](.+?)['\"]")
regex_require = re.compile(r"require\(\s*['\"](.+?)['\"]\s*\)")

js_set = set(js_files)

def resolve_import(curr_file, imp):
    if not imp.startswith('.') and not imp.startswith('/'):
        return None
    base = os.path.normpath(os.path.join(os.path.dirname(curr_file), imp)).replace('\\','/')
    candidates = []
    # exact
    if os.path.exists(os.path.join(ROOT, base)):
        candidates.append(base)
    for ext in extensions:
        if os.path.exists(os.path.join(ROOT, base + ext)):
            candidates.append(base + ext)
    if os.path.isdir(os.path.join(ROOT, base)):
        for ext in extensions:
            idx = os.path.join(base, 'index'+ext).replace('\\','/')
            if os.path.exists(os.path.join(ROOT, idx)):
                candidates.append(idx)
    for c in candidates:
        c_norm = c.replace('\\','/')
        if c_norm in js_set:
            return c_norm
    return None

imports_map = {f:set() for f in js_files}

for f in js_files:
    p = os.path.join(ROOT, f)
    try:
        txt = open(p, encoding='utf-8', errors='ignore').read()
    except Exception:
        continue
    for m in regex_import1.findall(txt) + regex_import2.findall(txt) + regex_require.findall(txt):
        target = resolve_import(f, m)
        if target:
            imports_map[f].add(target)

# heuristics for entry points
entry_points = set()
for f in js_files:
    if f.endswith('/index.js') or f.endswith('index.js') or f.endswith('/app.js') or f.endswith('src/index.js') or f.endswith('src/App.js') or f.endswith('index.jsx'):
        entry_points.add(f)

for root_dir in os.listdir(ROOT):
    if os.path.isdir(root_dir) and os.path.exists(os.path.join(ROOT, root_dir, 'index.js')):
        entry_points.add(os.path.normpath(os.path.join(root_dir,'index.js')).replace('\\','/'))

# BFS from entry points
reachable = set()
stack = list(entry_points)
while stack:
    cur = stack.pop()
    if cur in reachable:
        continue
    reachable.add(cur)
    for t in imports_map.get(cur, []):
        if t not in reachable:
            stack.append(t)

unreachable = sorted([f for f in js_files if f not in reachable])

print(json.dumps({
    "total_js_files": len(js_files),
    "entry_points_count": len(entry_points),
    "reachable_count": len(reachable),
    "unreachable_count": len(unreachable),
    "entry_points": sorted(list(entry_points)),
    "unreachable": unreachable[:500]
}, indent=2))
