// Converts the design-source/*.dc.html pages into Next.js pages.
// Mirrors the template semantics of design-source/support.js ({{ }} bindings,
// <sc-for>, <sc-if>, style-hover/style-focus, DCLogic classes) so the output
// renders the same as the design files. Re-run with `npm run convert` after
// editing a design file.
import fs from 'node:fs';
import path from 'node:path';
import { parseFragment } from 'parse5';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'design-source');

const PAGES = [
  { file: 'Pitchvilla Website v4', route: '/', name: 'Home' },
  { file: 'About', route: '/about', name: 'About', title: 'About Pitchvilla' },
  { file: 'Apply', route: '/apply', name: 'Apply', title: 'Apply or Enquire', clientOnly: true },
  { file: 'Interview Prep', route: '/interview-prep', name: 'InterviewPrep', title: 'Interview Guide' },
  { file: 'Pitchvilla Consulting Group', route: '/consulting', name: 'Consulting', title: 'Pitchvilla Consulting Group' },
  { file: 'Idea Validation', route: '/services/idea-validation', name: 'IdeaValidation', title: 'Idea Validation' },
  { file: 'Launch Your Startup', route: '/services/launch-your-startup', name: 'LaunchYourStartup', title: 'Launch Your Startup' },
  { file: 'Pitch Deck Creation', route: '/services/pitch-deck-creation', name: 'PitchDeckCreation', title: 'Pitch Deck Creation' },
  { file: 'Business Strategy', route: '/services/business-strategy', name: 'BusinessStrategy', title: 'Business Strategy' },
  { file: 'Financial Analysis', route: '/services/financial-analysis', name: 'FinancialAnalysis', title: 'Financial Analysis' },
  { file: 'Digital Marketing', route: '/services/digital-marketing', name: 'DigitalMarketing', title: 'Digital Marketing' },
  { file: 'Hiring and Team Building', route: '/services/hiring-and-team-building', name: 'HiringAndTeamBuilding', title: 'Hiring & Team Building' },
  { file: 'Investor Readiness', route: '/services/investor-readiness', name: 'InvestorReadiness', title: 'Investor Readiness' },
  { file: 'Pitch to Investors', route: '/services/pitch-to-investors', name: 'PitchToInvestors', title: 'Pitch to Investors' },
  { file: 'Privacy Policy', route: '/privacy-policy', name: 'PrivacyPolicy', title: 'Privacy Policy' },
  { file: 'Terms and Conditions', route: '/terms-and-conditions', name: 'TermsAndConditions', title: 'Terms and Conditions' },
];

// ---- template semantics copied from support.js --------------------------------

const RAW_WRAP = { select: 'sc-raw-select', table: 'sc-raw-table', tbody: 'sc-raw-tbody', thead: 'sc-raw-thead', tfoot: 'sc-raw-tfoot', tr: 'sc-raw-tr', td: 'sc-raw-td', th: 'sc-raw-th', caption: 'sc-raw-caption' };
const RAW_UNWRAP = Object.fromEntries(Object.entries(RAW_WRAP).map(([k, v]) => [v, k]));
const EVENT_MAP = Object.fromEntries('Click Change Input Submit KeyDown KeyUp KeyPress MouseDown MouseUp MouseEnter MouseLeave Focus Blur DoubleClick ContextMenu MouseMove MouseOver MouseOut PointerDown PointerUp PointerMove PointerEnter PointerLeave PointerCancel PointerOver PointerOut TouchStart TouchEnd TouchMove TouchCancel DragStart DragEnd DragEnter DragLeave DragOver AnimationStart AnimationEnd AnimationIteration TransitionEnd'.split(' ').map(n => ['on' + n.toLowerCase(), 'on' + n]));
const CAMEL_ATTR = 'sc-camel-';
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/;
const NUMBER_RE = /^-?\d+(\.\d+)?$/;

function encodeCase(html) {
  html = html.replace(/<helmet(\s|>)/gi, '<sc-helmet$1').replace(/<\/helmet\s*>/gi, '</sc-helmet>');
  html = html.replace(/(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g, (_, sp, name, eq) => sp + CAMEL_ATTR + name.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + eq);
  for (const [real, alias] of Object.entries(RAW_WRAP)) html = html.replace(new RegExp('(</?)' + real + '(?=[\\s>])', 'gi'), '$1' + alias);
  return html;
}
const kebabToCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
function cssToObj(css) {
  const o = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
  }
  return o;
}
function importantify(css) {
  const decls = [];
  let start = 0, depth = 0, quote = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; }
    else if (c === "'" || c === '"') quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) { decls.push(css.slice(start, i)); start = i + 1; }
  }
  decls.push(css.slice(start));
  return decls.map(d => d.trim()).filter(Boolean).map(d => /!\s*important$/i.test(d) ? d : d + ' !important').join(';');
}
function parensWrapWhole(expr) {
  let depth = 0;
  for (let i = 0; i < expr.length - 1; i++) {
    if (expr[i] === '(') depth++;
    else if (expr[i] === ')') { depth--; if (depth === 0) return false; }
  }
  return true;
}
function findTopLevelEquality(expr) {
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (depth === 0 && (c === '=' || c === '!') && expr[i + 1] === '=') {
      if (i > 0 && (expr[i - 1] === '=' || expr[i - 1] === '!')) continue;
      if (!expr.slice(0, i).trim()) continue;
      return { index: i, op: expr[i + 2] === '=' ? c + '==' : c + '=' };
    }
  }
  return null;
}

// ---- expression -> JS ------------------------------------------------------------

function exprJs(src, scope) {
  const e = String(src).trim();
  if (!e) return 'undefined';
  if (e[0] === '(' && e[e.length - 1] === ')' && parensWrapWhole(e)) return '(' + exprJs(e.slice(1, -1), scope) + ')';
  const eq = findTopLevelEquality(e);
  if (eq) return '(' + exprJs(e.slice(0, eq.index), scope) + ' ' + eq.op + ' ' + exprJs(e.slice(eq.index + eq.op.length), scope) + ')';
  if (e[0] === '!') return '!(' + exprJs(e.slice(1), scope) + ')';
  if (['true', 'false', 'null', 'undefined'].includes(e)) return e;
  if (NUMBER_RE.test(e)) return e;
  if (e.length >= 2 && (e[0] === '"' || e[0] === "'") && e[e.length - 1] === e[0]) return JSON.stringify(e.slice(1, -1));
  return pathJs(e, scope);
}
function pathJs(e, scope) {
  const head = e.match(IDENT_RE);
  if (!head) return 'undefined';
  let out = scope.has(head[0]) ? scope.get(head[0]) : 'v.' + head[0];
  let i = head[0].length;
  while (i < e.length) {
    if (e[i] === '.') {
      const m = e.slice(i + 1).match(IDENT_RE) || e.slice(i + 1).match(/^\d+/);
      if (!m) return 'undefined';
      out += /^\d/.test(m[0]) ? '?.[' + m[0] + ']' : '?.' + m[0];
      i += 1 + m[0].length;
    } else if (e[i] === '[') {
      let depth = 1, j = i + 1;
      while (j < e.length && depth > 0) {
        if (e[j] === '[') depth++;
        else if (e[j] === ']') { depth--; if (depth === 0) break; }
        j++;
      }
      if (depth !== 0) return 'undefined';
      out += '?.[' + exprJs(e.slice(i + 1, j), scope) + ']';
      i = j + 1;
    } else return 'undefined';
  }
  return out;
}

// ---- JSX emission ----------------------------------------------------------------

const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
const HTML_ATTRS = { tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete', autofocus: 'autoFocus', novalidate: 'noValidate', colspan: 'colSpan', rowspan: 'rowSpan', crossorigin: 'crossOrigin', srcset: 'srcSet', inputmode: 'inputMode', enterkeyhint: 'enterKeyHint', spellcheck: 'spellCheck', contenteditable: 'contentEditable', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen', 'accept-charset': 'acceptCharset', 'http-equiv': 'httpEquiv', enctype: 'encType', datetime: 'dateTime', playsinline: 'playsInline', referrerpolicy: 'referrerPolicy', fetchpriority: 'fetchPriority', 'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', 'xmlns:xlink': 'xmlnsXlink' };

function attrValueJs(raw, scope) {
  const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
  if (whole) return { dyn: true, js: exprJs(whole[1], scope) };
  if (raw.includes('{{')) {
    const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
    const js = '`' + parts.map((s, i) => i & 1 ? '${' + exprJs(s, scope) + ' ?? ""}' : s.replace(/[`\\$]/g, c => '\\' + c)).join('') + '`';
    return { dyn: true, js };
  }
  return { dyn: false, js: JSON.stringify(raw), raw };
}

class Page {
  constructor(name) { this.name = name; this.pseudo = new Map(); this.pseudoCss = []; this.helmet = null; this.warnings = []; }

  pseudoClass(pseudo, css) {
    const k = pseudo + '|' + css;
    if (this.pseudo.has(k)) return this.pseudo.get(k);
    const cls = 'scp' + this.pseudo.size.toString(36);
    const el = pseudo === 'before' || pseudo === 'after';
    this.pseudoCss.push('.' + cls + (el ? '::' : ':') + pseudo + '{' + (el ? css : importantify(css)) + '}');
    this.pseudo.set(k, cls);
    return cls;
  }

  children(node, scope, svg) {
    return (node.childNodes || []).map(c => this.walk(c, scope, svg)).filter(s => s != null);
  }

  walk(node, scope, svg) {
    if (node.nodeName === '#text') return this.text(node.value, scope);
    if (!node.tagName) return null;
    const tag = node.tagName;
    if (tag === 'sc-helmet') { this.helmet = node; return null; }
    if (tag === 'sc-for') {
      const get = n => (node.attrs.find(a => a.name === n) || {}).value;
      const list = attrValueJs(get('list') || '', scope);
      const as = get('as') || 'item';
      const local = '_' + as.replace(/[^A-Za-z0-9_$]/g, '_');
      const sub = new Map(scope); sub.set(as, local); sub.set('$index', '$index');
      const kids = this.children(node, sub, svg).join('');
      return '{A(' + list.js + ').map((' + local + ', $index) => (<Fragment key={$index}>' + kids + '</Fragment>))}';
    }
    if (tag === 'sc-if') {
      const val = attrValueJs((node.attrs.find(a => a.name === 'value') || {}).value || '', scope);
      return '{' + val.js + ' ? (<>' + this.children(node, scope, svg).join('') + '</>) : null}';
    }
    if (tag === 'sc-else' || tag === 'x-import' || tag === 'dc-import') throw new Error(this.name + ': <' + tag + '> is not supported by the converter');
    if (tag === 'template') return null;
    const realTag = RAW_UNWRAP[tag] || tag;
    if (realTag === 'style' || realTag === 'script') {
      if (realTag === 'script') this.warnings.push('inline <script> in body will not execute');
      const txt = node.childNodes.map(c => c.value || '').join('');
      return '<' + realTag + ' dangerouslySetInnerHTML={{ __html: ' + JSON.stringify(txt) + ' }} />';
    }
    const inSvg = svg || realTag === 'svg';
    const custom = realTag.includes('-');
    const props = [];
    let classJs = null;
    const pseudo = [];
    for (const a of node.attrs) {
      let key = a.prefix ? a.prefix + ':' + a.name : a.name;
      if (key === 'sc-name' || key === 'data-dc-tpl' || key === 'hint-size') continue;
      if (key.startsWith(CAMEL_ATTR)) key = kebabToCamel(key.slice(CAMEL_ATTR.length));
      if (key.startsWith('style-')) { pseudo.push(this.pseudoClass(key.slice(6), a.value)); continue; }
      if (key === 'class') key = 'className';
      else if (key === 'for') key = 'htmlFor';
      else if (key.startsWith('on')) key = EVENT_MAP[key.toLowerCase()] || 'on' + key[2].toUpperCase() + key.slice(3);
      else if (HTML_ATTRS[key]) key = HTML_ATTRS[key];
      else if (inSvg && key.includes('-') && !key.startsWith('data-') && !key.startsWith('aria-')) key = kebabToCamel(key);
      const val = attrValueJs(a.value, scope);
      if (key === 'className') { classJs = val; continue; }
      if (key === 'style') {
        props.push('style={' + (val.dyn ? 'S(' + val.js + ')' : JSON.stringify(cssToObj(val.raw))) + '}');
        continue;
      }
      let js = val.js;
      if (val.dyn && (key === 'value' || key === 'checked')) js = '(' + js + ' ?? ' + (key === 'checked' ? 'false' : '""') + ')';
      props.push(key + '={' + js + '}');
    }
    if (classJs || pseudo.length) {
      if (!classJs) props.unshift('className={' + JSON.stringify(pseudo.join(' ')) + '}');
      else if (!classJs.dyn) props.unshift('className={' + JSON.stringify([classJs.raw, ...pseudo].filter(Boolean).join(' ')) + '}');
      else props.unshift('className={[' + classJs.js + ', ' + pseudo.map(p => JSON.stringify(p)).join(', ') + '].filter(Boolean).join(" ")}');
    }
    void custom;
    const open = '<' + realTag + (props.length ? ' ' + props.join(' ') : '');
    if (VOID.has(realTag)) return open + ' />';
    const kids = this.children(node, scope, inSvg && realTag !== 'foreignObject');
    return kids.length ? open + '>' + kids.join('') + '</' + realTag + '>' : open + ' />';
  }

  text(txt, scope) {
    if (!txt.includes('{{')) {
      if (!txt.trim() && !txt.includes(' ')) return null;
      return '{' + JSON.stringify(txt) + '}';
    }
    return txt.split(/\{\{([\s\S]+?)\}\}/g).map((p, i) => i & 1 ? '{T(' + exprJs(p, scope) + ')}' : p ? '{' + JSON.stringify(p) + '}' : '').join('');
  }
}

// ---- page conversion -------------------------------------------------------------

function rewriteLinks(src) {
  for (const p of [...PAGES].sort((a, b) => b.file.length - a.file.length)) {
    for (const variant of [p.file, p.file.replace(/ /g, '%20')]) {
      src = src.split('./' + variant + '.dc.html').join(p.route).split(variant + '.dc.html').join(p.route);
    }
  }
  // images live in public/, so make their paths absolute (pages sit at nested routes)
  return src.replace(/(["'(])(?:\.\/)?(assets|uploads)\//g, '$1/$2/');
}

function convert(p) {
  const raw = rewriteLinks(fs.readFileSync(path.join(SRC, p.file + '.dc.html'), 'utf8'));
  const open = /<x-dc(?:\s[^>]*)?>/.exec(raw);
  const close = raw.lastIndexOf('</x-dc>');
  const template = raw.slice(open.index + open[0].length, close);
  const scriptM = raw.match(/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  let logic = scriptM ? scriptM[1].trim() : '';
  if (logic) {
    if (!/class\s+Component\s+extends\s+DCLogic/.test(logic)) throw new Error(p.file + ': unexpected logic class');
    logic = logic.replace(/class\s+Component\s+extends\s+DCLogic/, 'class Logic extends DCLogic');
  } else logic = 'class Logic extends DCLogic {}';

  const page = new Page(p.file);
  const frag = parseFragment(encodeCase(template));
  const body = page.children(frag, new Map(), false).join('\n');

  // helmet: title/description become Next metadata, styles stay with the page,
  // fonts and helper scripts are loaded once in app/layout.jsx
  const meta = { title: p.title ? p.title + ' | Pitchvilla' : undefined, description: undefined };
  let css = '';
  for (const n of page.helmet ? page.helmet.childNodes : []) {
    if (!n.tagName) continue;
    const txt = (n.childNodes || []).map(c => c.value || '').join('');
    const attr = k => (n.attrs.find(a => a.name === k) || {}).value;
    if (n.tagName === 'title') meta.title = txt.trim();
    else if (n.tagName === 'meta' && attr('name') === 'description') meta.description = attr('content');
    else if (n.tagName === 'style') css += txt;
    else if (n.tagName === 'link' && /fonts\.googleapis/.test(attr('href') || '')) { /* in layout */ }
    else if (n.tagName === 'script' && /^\.\/(image-slot|autoscroll|motion)\.js$/.test(attr('src') || '')) { /* in layout */ }
    else page.warnings.push('unhandled helmet tag <' + n.tagName + '>');
  }
  css += page.pseudoCss.join('');

  const component = `'use client';
// Generated by scripts/convert-dc.mjs from "design-source/${p.file}.dc.html". Do not edit by hand.
/* eslint-disable */
import React, { Fragment } from 'react';
import { A, DCLogic, S, T } from '@/lib/dc-runtime';

const CSS = ${JSON.stringify(css)};

${logic}

export default class ${p.name}Page extends Logic {
  render() {
    const v = { ...this.props, ...this.renderVals() };
    return (
<>
<style dangerouslySetInnerHTML={{ __html: CSS }} />
${body}
</>
    );
  }
}
`;
  fs.writeFileSync(path.join(ROOT, 'components', 'dc', p.name + '.jsx'), component);

  const dir = path.join(ROOT, 'app', ...p.route.split('/').filter(Boolean));
  fs.mkdirSync(dir, { recursive: true });
  const metaSrc = 'export const metadata = ' + JSON.stringify(Object.fromEntries(Object.entries(meta).filter(([, v]) => v)), null, 2) + ';\n';
  if (p.clientOnly) {
    // state is initialised from window.location, so render on the client only
    fs.writeFileSync(path.join(ROOT, 'components', 'dc', p.name + 'ClientOnly.jsx'), `'use client';
import dynamic from 'next/dynamic';

export default dynamic(() => import('./${p.name}'), { ssr: false });
`);
    fs.writeFileSync(path.join(dir, 'page.jsx'), `import ${p.name}Page from '@/components/dc/${p.name}ClientOnly';\n\n${metaSrc}\nexport default function Page() {\n  return <${p.name}Page />;\n}\n`);
  } else {
    fs.writeFileSync(path.join(dir, 'page.jsx'), `import ${p.name}Page from '@/components/dc/${p.name}';\n\n${metaSrc}\nexport default function Page() {\n  return <${p.name}Page />;\n}\n`);
  }

  const leftovers = ((logic + body + css).match(/[^"'/]*\.dc\.html/g) || []);
  if (leftovers.length) page.warnings.push('unresolved .dc.html links: ' + [...new Set(leftovers)].join(', '));
  console.log((page.warnings.length ? '! ' : '✓ ') + p.route.padEnd(36) + p.file + page.warnings.map(w => '\n    - ' + w).join(''));
}

for (const p of PAGES) convert(p);
