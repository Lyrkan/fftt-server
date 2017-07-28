/* tslint:disable:no-namespace */

declare module 'timestring' {
  interface ParseOptions {
    hoursPerDay?: number;
    daysPerWeek?: number;
    weeksPerMonth?: number;
    monthsPerYear?: number;
    daysPerYear?: number;
  }

  function parseTimestring(
    input: string,
    returnUnit?: string,
    opts?: ParseOptions
  ): number;

  export = parseTimestring;
}
