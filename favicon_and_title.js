function initFaviconAndTitle() {
  const rangeExists = (rangeArray, item) => {
    if (rangeArray.length === 1) return item >= rangeArray[0][0] && item <= rangeArray[0][1];

    const lower = rangeArray.splice(0, rangeArray.length / 2); // upper = rangeArray
    if (item <= lower.at(-1)[1]) return rangeExists(lower, item);
    if (item >= rangeArray[0][0]) return rangeExists(rangeArray, item);
    return false;
  }

  const faviconCanvas = document.createElement('canvas');
  for (const i of ['width', 'height']) faviconCanvas[i] = 16;
  const faviconContext = faviconCanvas.getContext('2d');
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

    faviconContext.clearRect(0, 0, 16, 16);
    faviconContext.strokeStyle = colorTheme?.['--bg'] ?? 'black';
    faviconContext.lineWidth = 3;
    faviconContext.filter = isOpaque ? 'opacity(1)' : 'opacity(0.5)';

    const titleFont = 'bold 8px "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    const timerFont = 'bold 9px "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    
    // draw stroke
    faviconContext.font = titleFont;
    faviconContext.strokeText(formattedName, 0, 7, 13);
    faviconContext.moveTo(type ? 14 : 15, 1);
    faviconContext.lineTo(type ? 15 : 14, 2);
    faviconContext.lineTo(type ? 15 : 14, 5);
    faviconContext.lineTo(type ? 14 : 15, 6);
    faviconContext.stroke();
    faviconContext.font = timerFont;
    faviconContext.strokeText(formattedTime, 0, 15, 16);

    // draw fill
    faviconContext.font = titleFont;
    faviconContext.fillStyle = colorTheme?.['--fg'] ?? 'white';
    faviconContext.fillText(formattedName, 0, 7, 13);
    faviconContext.fillRect(type ? 14 : 15, 1, 1, 1);
    faviconContext.fillRect(type ? 15 : 14, 2, 1, 4);
    faviconContext.fillRect(type ? 14 : 15, 6, 1, 1);
    faviconContext.fillStyle = colorTheme?.['--until'] ?? 'cyan';
    faviconContext.font = timerFont;
    faviconContext.fillText  (formattedTime, 0, 15, 16);

    favicon.href = faviconCanvas.toDataURL('image/x-icon');
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
