// Replacement for the "moment-timezone" package entry (aliased via aliases.mjs).
// date-holidays-parser only needs a zone to exist; we use the calendar date of each
// holiday, which is the same whatever the offset. Registering every zone our countries
// mention as UTC avoids shipping ~700 KB of time zone history to the browser.
import moment from 'moment-timezone/moment-timezone.js';
import zoneNames from '../data/timezones.json';

moment.tz.load({
  version: 'utc-only',
  zones: zoneNames.map((name) => `${name}|UTC|0|0||`),
  links: [],
});
export default moment;
