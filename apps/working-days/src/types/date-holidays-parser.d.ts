// date-holidays-parser ships types but does not expose them through its "exports" map,
// so TypeScript cannot find them. This declares the small part of the API we use.
declare module 'date-holidays-parser' {
  interface Holiday {
    /** "YYYY-MM-DD hh:mm:ss" in the country's local time. */
    date: string;
    start: Date;
    end: Date;
    name: string;
    type: 'public' | 'bank' | 'school' | 'optional' | 'observance';
    substitute?: boolean;
  }
  interface Options {
    languages?: string | string[];
    timezone?: string;
    types?: string[];
  }
  export default class HolidaysParser {
    constructor(data: object, country: string, opts?: Options);
    constructor(data: object, country: string, state: string, opts?: Options);
    getHolidays(year?: number | string, lang?: string): Holiday[];
    getStates(country: string, lang?: string): Record<string, string> | undefined;
  }
}
