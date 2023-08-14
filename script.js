/** @returns {number} */
function getTime() {
  const d = new Date();
  return (d.getTime() - d.getTimezoneOffset() * 60_000 - new Date(0).getDay() * 86_400_000) % 604_800_000;
}

/**
 * @param {number} ms
 * @returns {string}
 */
var formatTime = ms => isNaN(ms) ? "N/A" : (
  ms >= 86_400_000 ? `${Math.floor(ms/86_400_000)}:${Math.floor(ms/3_600_000 % 24).toString().padStart(2, '0')}:${Math.floor(ms/60_000 % 60).toString().padStart(2, '0')}` :
  ms >= 3_600_000 ? `${Math.floor(ms/3_600_000)}:${Math.floor(ms/60_000 % 60).toString().padStart(2, '0')}` : `${Math.floor(ms/60_000)}`)
  + `:${Math.floor(ms/1_000 % 60).toString().padStart(2, '0')}`;

/** 
 * @param {number} ms
 * @param {boolean} scheduleEditorFormat
 * @returns {string}
 */
var formatDateTime = (ms, scheduleEditorFormat = false) => isNaN(ms) ? "N/A" :
  `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][Math.floor(ms/86_400_000) % 7]
  } ${(n => n < 1 ? 12 : Math.floor(n))(ms / 3_600_000 % 12).toString().padStart(2, '0')
  }:${Math.floor(ms / 60_000 % 60).toString().padStart(2, '0')
  }${!scheduleEditorFormat || Math.floor(ms) % 60_000 !== 0 ? ':' + Math.floor(ms / 1_000 % 60).toString().padStart(2, '0') : ''
  }${scheduleEditorFormat && Math.floor(ms) % 1_000 !== 0 ? '.' + Math.floor(ms % 1_000).toString().padStart(3, '0') : ''
  }${ms % 86_400_000 >= 43_200_000 ? 'p' : 'a'}`;

let events = [];
  
/** @returns {[ScheduleEvent, ScheduleEvent]} */
function getEvents() {
  if (events?.length <= 0) return [];
  const time = getTime();
  if (events?.length <= 1) return time < events[0].time ?
    [{...events[0], time: events[0].time - 7 * 86_400_000}, events[0]] :
    [events[0], {...events[0], time: events[0].time + 7 * 86_400_000}];
  
  // binary search for 2 events before/after current time

  let bsMin = 0;
  let bsMax = events.length - 1;
  while (bsMax - bsMin > 1) {
    const mid = (bsMax + bsMin) >> 1;
    if (time < events[mid].time) bsMax = mid;
    else bsMin = mid;
  }
  if (bsMin <= 0 && time < events[0].time) {
    bsMin = null;
    bsMax = 0;
  }
  else if (bsMax >= events.length - 1 && time >= events[bsMax].time) {
    bsMin++;
    bsMax = null
  } else bsMax = bsMin + 1;

  return [
    bsMin === null ? {...events[events.length - 1], time: events[events.length - 1].time - 7 * 86_400_000} : events[bsMin],
    bsMax === null ? {...events[0], time: events[0].time + 7 * 86_400_000} : events[bsMax]
  ];
}

// Code stolen from another side project of mine
function exportSchedule() {
  const exportLink = document.getElementById("json-export-link");
  URL.revokeObjectURL(exportLink.href);
  exportLink.href = URL.createObjectURL(new Blob([JSON.stringify({version: 0, mode: 'weekly', events: events})]));
  exportLink.click();
  document.getElementById("json-export-p").style.display = "block";
}

/** @param {number} index */
function editEvent(index) {
  const reset = index >= events.length;

  document.getElementById('eename').value = reset ? '' : events[index].name;
  const t = reset ? 0 : events[index].time;
  document.getElementById('eeweekday').value = Math.floor(t / 86_400_000 % 7).toString();
  document.getElementById('eetime').value = `${
    Math.floor(t / 3_600_000 % 24).toString().padStart(2, '0')}:${
    Math.floor(t / 60_000 % 60).toString().padStart(2, '0')}:${
    Math.floor(t / 1_000 % 60).toString().padStart(2, '0')}.${
    Math.floor(t % 1_000).toString().padStart(3, '0')}`;
  document.getElementById('eetype').value = reset ? '[false,false]' : JSON.stringify(events[index].type);
  document.getElementById('eeconfirm').onclick = () => {
    /** @type {string} */
    const t = document.getElementById('eetime').value;

    events[index] = new ScheduleEvent({
      name: document.getElementById('eename').value,
      time: document.getElementById('eeweekday').value * 86_400_000 +
        t.substr(0, 2) * 3_600_000 + t.substr(3, 2) * 60_000 +
        (t.length > 5 ? t.substr(6, 2) * 1_000 : 0) +
        (t.length > 8 ? t.substr(9, 3) * 1 : 0),
      type: JSON.parse(document.getElementById('eetype').value)
    });

    events.sort(ScheduleEvent.compare);
    updateSchedEditor();
    document.getElementById('edit-event').close();
  };

  document.getElementById('edit-event').showModal();
}

function updateSchedEditor() {
  const schedEditor = document.getElementById('schedule-editor');
  while (schedEditor.childElementCount > 0)
    schedEditor.removeChild(schedEditor.lastChild);
  events.forEach((v, i, a) => {
    const li = document.getElementById('seli').content.firstElementChild.cloneNode(true);

    li.querySelector('[data-sub-id="del"]').onclick = () => {
      events.splice(i, 1);
      events.sort(ScheduleEvent.compare);
      updateSchedEditor();
    };
    li.querySelector('[data-sub-id="edit"]').onclick = () => editEvent(i);
    li.querySelector('[data-sub-id="name"]').append(document.createTextNode(v.name));
    li.querySelector('[data-sub-id="time"]').append(document.createTextNode(formatDateTime(v.time, true)));
    li.querySelector('[data-sub-id="type"]').append(document.createTextNode([
      ['Instantaneous event', 'Start of event'],
      ['End of event', 'Encapsulating event']
    ][Number(v.type[0])][Number(v.type[1])]));

    schedEditor.appendChild(li);
  });
}

function clearSchedule() {
  if (confirm('Are you sure you would like to clear ALL EVENTS from the current schedule? This operation CANNOT BE UNDONE (unless you have exported the current schedule)!')) {
    events = [];
    updateSchedEditor();
  }
}

onload = () => {
  let colors;
  const faviconAndTitle = initFaviconAndTitle();

  const clockElem = document.getElementById("clock");
  const timeSinceElem = document.getElementById("timesince");
  const prevEventElem = document.getElementById("prevevent");
  const timeUntilElem = document.getElementById("timeuntil");
  const nextEventElem = document.getElementById("nextevent");

  let cachedDisplayData = {};
  const updateMainView = () => {
    const e = getEvents();
    const t = getTime();
    const displayData = {
      clock: formatDateTime(t),
      timeSince: formatTime(Math.floor((t - e[0]?.time)/1000)*1000),
      prevEvent: e[0]?.type[1] ? `Time elapsed during ${e[0]?.name}` : `Time since ${e[0]?.name}`,
      timeUntil: formatTime(Math.ceil((e[1]?.time - t)/1000)*1000),
      nextEvent: e[1]?.type[0] ? `Time remaining in ${e[1]?.name}` : `Time until ${e[1]?.name}`,
      prevEventOpaque: Math.floor(e[0]?.time / 86_400_000) === Math.floor(t / 86_400_000),
      nextEventOpaque: Math.floor(e[1]?.time / 86_400_000) === Math.floor(t / 86_400_000)
    };
    if (displayData.clock !== cachedDisplayData?.clock) clockElem.innerText = displayData.clock;
    if (displayData.timeSince !== cachedDisplayData?.timeSince) timeSinceElem.innerText = displayData.timeSince;
    if (displayData.prevEvent !== cachedDisplayData?.prevEvent) prevEventElem.innerText = displayData.prevEvent;
    if (displayData.timeUntil !== cachedDisplayData?.timeUntil) timeUntilElem.innerText = displayData.timeUntil;
    if (displayData.nextEvent !== cachedDisplayData?.nextEvent) nextEventElem.innerText = displayData.nextEvent;
    
    if (displayData.prevEventOpaque !== cachedDisplayData?.prevEventOpaque) for (const i of [pecont, timesince]) i.style.opacity = displayData.prevEventOpaque ? 1 : .5;
    if (displayData.nextEventOpaque !== cachedDisplayData?.nextEventOpaque) for (const i of [necont, timeuntil]) i.style.opacity = displayData.nextEventOpaque ? 1 : .5;

    cachedDisplayData = displayData;

    // update scaling
    for (const i of timercontainer.children)
      i.firstChild.style.transform = `scale(${Math.min(i.clientHeight / i.firstChild.clientHeight, i.clientWidth / i.firstChild.clientWidth)})`;

    requestAnimationFrame(updateMainView);
  };
  updateMainView();

  const updateFaviconTitle = () => {
    const t = getTime();
    const e = getEvents();
    faviconAndTitle.updateFavicon(e[1]?.name, e[1]?.time - t, e[1]?.type[0], Math.floor(e[1]?.time / 86_400_000) === Math.floor(t / 86_400_000), colors);
    faviconAndTitle.updateTitle(e[1]?.name, formatTime(Math.ceil((e[1]?.time - t)/1000)*1000), e[1]?.type[0]);
    requestIdleCallback(updateFaviconTitle, { timeout: 1000 - (t % 1000) });
  };
  updateFaviconTitle();

  const jsonImport = document.getElementById('json-import');

  const importSelectedFile = async () => {
    /** @type {File} */
    const file = jsonImport.files[0];
    if (file === undefined) throw new Error('No file inputted');
    
    const t = await file.text();
    let importedSchedule;

    try {
      importedSchedule = JSON.parse(t);
    } catch (e) {
      alert('An error occurred while parsing the imported JSON: \n' + e.toString());
      throw e;
    }

    if (importedSchedule.events === undefined) {
      alert('No events attribute in imported JSON');
      throw new Error('No events attribute in imported JSON');
    }
    
    const importedEvents = importedSchedule.events;
    importedEvents.forEach((v, i, a) => a[i] = new ScheduleEvent(v));
    importedEvents.sort(ScheduleEvent.compare);

    events = importedEvents;

    updateSchedEditor();
  }

  jsonImport.onchange = importSelectedFile;
  jsonImport.oninput = importSelectedFile;

  // reloads schedule in case the user closed this tab and then re-opened it without refreshing
  // if a schedule is not active, opens the schedule management dialog
  setTimeout(() => importSelectedFile().catch(() => document.getElementById('schedmgmt').showModal()), 0);
  
  themeselect.onchange = function () {
    colors = Object.freeze({
      'light': {
        '--bg': 'white',
        '--fg': 'black',
        '--clock': 'green',
        '--since': 'red',
        '--until': 'blue',
        '--link': 'blue',
        '--visited': 'purple'
      },
      'dark': {
        '--bg': 'black',
        '--fg': 'white',
        '--clock': 'lime',
        '--since': '#ff3535',
        '--until': 'cyan',
        '--link': 'cyan',
        '--visited': 'magenta'
      }
    })[this.value];
    for (const i in colors) {document.documentElement.style.setProperty(i, colors[i]);}
  };

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) themeselect.value = 'light';
  themeselect.onchange();
};
