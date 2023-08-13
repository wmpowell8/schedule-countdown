function initFaviconAndTitle() {
  const rangeExists = (rangeArray, item) => {
    if (rangeArray.length === 1) return item >= rangeArray[0][0] && item <= rangeArray[0][1];

    const lower = rangeArray.splice(0, rangeArray.length / 2); // upper = rangeArray
    if (item <= lower.at(-1)[1]) return rangeExists(lower, item);
    if (item >= rangeArray[0][0]) return rangeExists(rangeArray, item);
    return false;
  }

  let testingCtx;
  try {
    const testingCanvas = document.createElement('canvas');
    testingCanvas.width = 0;
    testingCanvas.height = 0;
    testingCtx = testingCanvas.getContext('2d');
  } catch (err) {
    console.error('Error initializing canvas to use for text measurement in favicon:\n\n%o\n\nText in favicon may be stretched out from its original size.', err);
    testingCtx = { measureText: (_) => { return { width: Infinity }; } };
  }

  const favicon = document.querySelector('head>link[rel="shortcut icon"]');
  let faviconCachedInfo = {};
  function updateFavicon(name, time, type, isOpaque, colorTheme) {
    const secs = Math.ceil(time / 1000);

    const formattedTime = time ?
      secs >= 3600 ?
        secs >= 36_000 ? `${Math.floor(secs / 3600)}:${Math.floor((secs / 600) % 6)}` :
        `${Math.floor(secs / 3600)}:${Math.floor((secs / 60) % 60).toString().padStart(2, '0')}` :
      secs >= 600 ? `${Math.floor(secs / 60)}'${Math.floor((secs / 10) % 6)}` :
      secs >= 60 ? `${Math.floor(secs / 60)}'${Math.floor(secs % 60).toString().padStart(2, '0')}` :
      `${Math.floor(secs % 60).toString().padStart(2, '0')}"`
    : 'N/A';
    const formattedName = name ?
      [...name]
        .map(l => rangeExists([
          // To-do everything here & below -- https://en.wikipedia.org/wiki/List_of_Unicode_characters#Bengali_and_Assamese
          [0x41, 0x5a], [0x61, 0x7a], [0xc0, 0xd6], [0xd8, 0xf6], [0xf8, 0x2af],
          [0x370, 0x373], [0x376, 0x377], [0x37b, 0x37d], [0x37f, 0x37f],
          [0x386, 0x386], [0x370, 0x373], [0x388, 0x481], [0x48a, 0x52f], [0x531, 0x556], [0x561, 0x587], [0x5d0, 0x5f2],
          [0x620, 0x63f], [0x641, 0x64a], [0x66e, 0x66f], [0x671, 0x673], [0x675, 0x6d3], [0x6d5, 0x6d5], [0x6ee, 0x6ef], [0x6fa, 0x6ff],
          [0x710, 0x72f], [0x74d, 0x7a5], [0x7b1, 0x7b1], [0x7ca, 0x7ea],
          [0x800, 0x815], [0x840, 0x858],
          [0x904, 0x939], [0x958, 0x961], [0x972, 0x97f], /* TO-DO: Everything from 0x980 to 0xfff */
          [0x1e00, 0x1fbc], [0x1fc2, 0x1fcc], [0x1fd0, 0x1fdc], [0x1fe0, 0x1fec], [0x1ff0, 0x1ffc],
          [0x2c60, 0x2c7f], [0xa720, 0xa7ff], [0xab30, 0xab6f], [0x10780, 0x107bf], [0x1df00, 0x1dfff]
        ], l.charCodeAt(0)) ? l : ` ${l} `)
        .join('')
        .split(' ')
        .map(s => s?.[0])
        .join('')
      : 'N/A';

    if (
      faviconCachedInfo?.name === formattedName &&
      faviconCachedInfo?.time === formattedTime &&
      faviconCachedInfo?.type === type &&
      faviconCachedInfo?.isOpaque === isOpaque &&
      faviconCachedInfo?.colorTheme === colorTheme
    )
      return;
    faviconCachedInfo.name = formattedName;
    faviconCachedInfo.time = formattedTime;
    faviconCachedInfo.type = type;
    faviconCachedInfo.isOpaque = isOpaque;
    faviconCachedInfo.colorTheme = colorTheme;

    const adjustNameLength = testingCtx.measureText(formattedName).width >= 13;
    const adjustTimeLength = testingCtx.measureText(formattedTime).width >= 16;

    /** @param {string} qualifiedName @param {{ [attrib: string]: string; }} attribs */
    const createSVGElementWithAttribs = (qualifiedName, attribs) => {
      /** @type {SVGElement} */
      const element = document.createElementNS('http://www.w3.org/2000/svg', qualifiedName);
      for (const attrib in attribs) element.setAttribute(attrib, attribs[attrib]);
      return element;
    };
    const svgTree = createSVGElementWithAttribs('svg', { width: '16', height: '16', xmlns: 'http://www.w3.org/2000/svg' });
    svgTree.append(
      createSVGElementWithAttribs('g', { filter: 'url(#favicon-transparency-filter)' }),
      createSVGElementWithAttribs('filter', { id: 'favicon-transparency-filter' })
    );
    svgTree.children[0].append(
      createSVGElementWithAttribs('text', Object.assign({
        x: '0',
        y: '7',
        style: 'font: bold 8px "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
        fill: colorTheme?.['--fg'] ?? 'white',
        stroke: colorTheme?.["--bg"] ?? 'black',
        'stroke-width': '3',
        'paint-order': 'stroke'
      }, adjustNameLength ? { textLength: '13', lengthAdjust: 'spacingAndGlyphs' } : {})),
      createSVGElementWithAttribs('path', {
        d: type ? "M14,1v.5l1,1v3l-1,1v.5h1l1,-1v-4l-1,-1z" : "M16,1v.5l-1,1v3l1,1v.5h-1l-1,-1v-4l1,-1z",
        fill: colorTheme?.['--fg'] ?? 'white',
        stroke: colorTheme?.['--bg'] ?? 'black',
        'stroke-width': '3',
        'paint-order': 'stroke'
      }),
      createSVGElementWithAttribs('text', Object.assign({
        x: '0',
        y: '15',
        style: 'font: bold 9px "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
        fill: colorTheme?.['--until'] ?? 'cyan',
        stroke: colorTheme?.["--bg"] ?? 'black',
        'stroke-width': '3',
        'paint-order': 'stroke'
      }, adjustTimeLength ? { textLength: '16', lengthAdjust: 'spacingAndGlyphs' } : {}))
    );
    svgTree.children[1].appendChild(
      createSVGElementWithAttribs('feColorMatrix', {
        in: 'BackgroundAlpha', type: 'matrix', values: `1 0 0 0                        0
                                                        0 1 0 0                        0
                                                        0 0 1 0                        0
                                                        0 0 0 ${isOpaque ? '1' : '.5'} 0`
      })
    );
    svgTree.children[0].children[0].textContent = formattedName;
    svgTree.children[0].children[2].textContent = formattedTime;

    URL.revokeObjectURL(favicon.href);
    favicon.href = URL.createObjectURL(new Blob([svgTree.outerHTML], { type: 'image/svg+xml' }));
  }

  let oldTitle = 'Schedule Countdown';
  function updateTitle(name, formattedTime, type) {
    const title = (name ? `${formattedTime} ${type ? 'left in' : 'until'} ${name} - ` : '') + 'Schedule Countdown';
    if (title === oldTitle) return;
    oldTitle = title;
    document.title = title;
  }

  return {updateFavicon, updateTitle};
}
