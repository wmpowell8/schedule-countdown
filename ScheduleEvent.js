/**
 * @constructor
 * @param {object} object
 * @property {number} time
 * @property {string} name
 * @property {[boolean, boolean]} type
 */
function ScheduleEvent(object) {
  for (const i of ['time', 'name', 'type']) if (object[i] !== undefined) this[i] = object[i];
  
  if (this.time === undefined) this.time = 0;
  if (this.name === undefined) this.name = 'Event';
  if (this.type === undefined) this.type = [false, false];
}

/**
 * @param {ScheduleEvent} a
 * @param {ScheduleEvent} b
 * @returns {-1 | 0 | 1}
 */
ScheduleEvent.compare = (a, b) => a.time < b.time ? -1 : a.time === b.time ? 0 : 1;