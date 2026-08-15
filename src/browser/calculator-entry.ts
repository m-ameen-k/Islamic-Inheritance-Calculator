import { calculateSupportedInheritance } from "../engine/supported-inheritance";
import { evaluateWholeCaseCoverage } from "../rules/case-coverage-evaluator";

declare global {
  interface Window {
    FaraidCalculator: {
      readonly calculateSupportedInheritance: typeof calculateSupportedInheritance;
      readonly evaluateWholeCaseCoverage: typeof evaluateWholeCaseCoverage;
    };
  }
}

window.FaraidCalculator = Object.freeze({
  calculateSupportedInheritance,
  evaluateWholeCaseCoverage,
});
