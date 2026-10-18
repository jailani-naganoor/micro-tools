// Replacement for the "astronomia" package index (aliased via aliases.mjs). The index
// re-exports the whole astronomy library; date-holidays-parser and date-chinese only
// use these modules, so the rest is left out of the browser bundle.
export * as base from 'astronomia/base';
export * as julian from 'astronomia/julian';
export * as moonphase from 'astronomia/moonphase';
export * as planetposition from 'astronomia/planetposition';
export * as solar from 'astronomia/solar';
export * as solstice from 'astronomia/solstice';
