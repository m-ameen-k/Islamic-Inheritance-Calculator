(function() {
	//#region src/domain/fractions.ts
	function absolute(value) {
		return value < 0n ? -value : value;
	}
	function greatestCommonDivisor(left, right) {
		let a = absolute(left);
		let b = absolute(right);
		while (b !== 0n) {
			const remainder = a % b;
			a = b;
			b = remainder;
		}
		return a;
	}
	function leastCommonMultiple(left, right) {
		if (left === 0n || right === 0n) return 0n;
		return absolute(left / greatestCommonDivisor(left, right) * right);
	}
	/**
	* An immutable exact rational number.
	*
	* Inputs are deliberately restricted to bigint so legal shares cannot silently
	* enter this domain through an imprecise JavaScript number.
	*/
	var Fraction = class Fraction {
		static ZERO = new Fraction(0n);
		static ONE = new Fraction(1n);
		numerator;
		denominator;
		constructor(numerator, denominator = 1n) {
			if (denominator === 0n) throw new RangeError("A fraction denominator cannot be zero.");
			if (numerator === 0n) {
				this.numerator = 0n;
				this.denominator = 1n;
				return;
			}
			const sign = denominator < 0n ? -1n : 1n;
			const commonDivisor = greatestCommonDivisor(numerator, denominator);
			this.numerator = numerator / commonDivisor * sign;
			this.denominator = absolute(denominator / commonDivisor);
		}
		add(other) {
			return new Fraction(this.numerator * other.denominator + other.numerator * this.denominator, this.denominator * other.denominator);
		}
		subtract(other) {
			return new Fraction(this.numerator * other.denominator - other.numerator * this.denominator, this.denominator * other.denominator);
		}
		multiply(other) {
			return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
		}
		divide(other) {
			if (other.isZero()) throw new RangeError("Cannot divide by a zero fraction.");
			return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator);
		}
		reciprocal() {
			if (this.isZero()) throw new RangeError("A zero fraction has no reciprocal.");
			return new Fraction(this.denominator, this.numerator);
		}
		negate() {
			return new Fraction(-this.numerator, this.denominator);
		}
		absolute() {
			return this.numerator < 0n ? this.negate() : this;
		}
		compare(other) {
			const left = this.numerator * other.denominator;
			const right = other.numerator * this.denominator;
			if (left < right) return -1;
			if (left > right) return 1;
			return 0;
		}
		equals(other) {
			return this.numerator === other.numerator && this.denominator === other.denominator;
		}
		isZero() {
			return this.numerator === 0n;
		}
		isInteger() {
			return this.denominator === 1n;
		}
		toString() {
			return this.denominator === 1n ? this.numerator.toString() : `${this.numerator}/${this.denominator}`;
		}
		toJSON() {
			return {
				numerator: this.numerator.toString(),
				denominator: this.denominator.toString()
			};
		}
	};
	function sumFractions(fractions) {
		return fractions.reduce((total, fraction) => total.add(fraction), Fraction.ZERO);
	}
	//#endregion
	//#region src/domain/money.ts
	/**
	* Reconciles exact shares to integer minor currency units using the largest
	* remainder method. Tied remainders retain input order for deterministic output.
	*/
	function apportionMoney(totalMinorUnits, inputs) {
		if (totalMinorUnits < 0n) throw new RangeError("Total minor units cannot be negative.");
		if (inputs.length === 0) throw new RangeError("At least one money share is required.");
		const seenIds = /* @__PURE__ */ new Set();
		for (const input of inputs) {
			if (input.id.trim().length === 0) throw new RangeError("Every money share requires a non-empty ID.");
			if (seenIds.has(input.id)) throw new RangeError(`Duplicate money-share ID: ${input.id}`);
			if (input.share.compare(Fraction.ZERO) < 0) throw new RangeError(`Money share ${input.id} cannot be negative.`);
			seenIds.add(input.id);
		}
		const totalShare = sumFractions(inputs.map((input) => input.share));
		if (!totalShare.equals(Fraction.ONE)) throw new RangeError(`Money shares must total exactly 1; received ${totalShare.toString()}.`);
		const candidates = inputs.map((input, inputIndex) => {
			const exactNumerator = totalMinorUnits * input.share.numerator;
			const minorUnits = exactNumerator / input.share.denominator;
			const remainderNumerator = exactNumerator % input.share.denominator;
			return {
				id: input.id,
				share: input.share,
				minorUnits,
				roundedUp: false,
				inputIndex,
				remainder: new Fraction(remainderNumerator, input.share.denominator)
			};
		});
		const unitsToReconcile = totalMinorUnits - candidates.reduce((total, candidate) => total + candidate.minorUnits, 0n);
		const ranked = [...candidates].sort((left, right) => {
			const remainderComparison = right.remainder.compare(left.remainder);
			return remainderComparison !== 0 ? remainderComparison : left.inputIndex - right.inputIndex;
		});
		if (unitsToReconcile > BigInt(ranked.length)) throw new Error("Internal error: rounding reconciliation exceeded the allocation count.");
		for (let index = 0n; index < unitsToReconcile; index += 1n) {
			const candidate = ranked[Number(index)];
			if (candidate === void 0) throw new Error("Internal error: no allocation candidate was available.");
			candidate.minorUnits += 1n;
			candidate.roundedUp = true;
		}
		return candidates.map(({ id, minorUnits, roundedUp, share }) => ({
			id,
			minorUnits,
			roundedUp,
			share
		}));
	}
	//#endregion
	//#region src/domain/heirs.ts
	/**
	* Relationship identifiers only. This list does not imply eligibility, a
	* share, blocking, or any other fiqh outcome.
	*/
	var HEIR_TYPES = [
		"HUSBAND",
		"WIFE",
		"FATHER",
		"MOTHER",
		"SON",
		"DAUGHTER",
		"SONS_SON",
		"SONS_DAUGHTER",
		"PATERNAL_GRANDFATHER",
		"PATERNAL_GRANDMOTHER",
		"MATERNAL_GRANDMOTHER",
		"FULL_BROTHER",
		"PATERNAL_BROTHER",
		"MATERNAL_BROTHER",
		"FULL_SISTER",
		"PATERNAL_SISTER",
		"MATERNAL_SISTER",
		"FULL_BROTHERS_SON",
		"PATERNAL_BROTHERS_SON",
		"FULL_PATERNAL_UNCLE",
		"PATERNAL_UNCLE",
		"FULL_PATERNAL_UNCLES_SON",
		"PATERNAL_UNCLES_SON",
		"MALE_EMANCIPATOR",
		"FEMALE_EMANCIPATOR"
	];
	//#endregion
	//#region src/domain/qualifying-descendant.ts
	var QUALIFYING_DESCENDANT_CATEGORIES = [
		"SON",
		"DAUGHTER",
		"SONS_SON",
		"SONS_DAUGHTER"
	];
	HEIR_TYPES.filter((category) => !QUALIFYING_DESCENDANT_CATEGORIES.includes(category));
	new Set(HEIR_TYPES);
	new Set(QUALIFYING_DESCENDANT_CATEGORIES);
	//#endregion
	//#region src/rules/rule-file.ts
	function defineProductionRule(rule) {
		return rule;
	}
	function defineProductionSpouseRule(rule) {
		return rule;
	}
	//#endregion
	//#region src/rules/direct-family-production.ts
	var LOCATORS = {
		"KZ-FR-004": {
			kanz: "Printed pages 134–135; local PDF pages 5–6.",
			khulasa: "Printed page 269; residue, Bayt al-Mal, and radd paragraph."
		},
		"KZ-FR-009": {
			kanz: "Printed page 137; local PDF page 8.",
			khulasa: "Printed pages 271–273."
		},
		"KZ-FR-010": {
			kanz: "Printed page 138; local PDF page 9.",
			khulasa: "Printed pages 271–274."
		},
		"KZ-FR-011": {
			kanz: "Printed page 138; local PDF page 9.",
			khulasa: "Printed pages 274–276; total-exclusion definition and blocker tables."
		},
		"KZ-FR-012": {
			kanz: "Printed page 140; local PDF page 11.",
			khulasa: "Printed pages 270 and 277–278."
		},
		"KZ-FR-014": {
			kanz: "Printed page 141; local PDF page 12.",
			khulasa: "Printed pages 270, 272, and 277–278."
		},
		"KZ-FR-015": {
			kanz: "Printed page 142; local PDF page 13.",
			khulasa: "Printed page 270, including footnote 10."
		},
		"KZ-FR-029": {
			kanz: "Printed pages 154–156; local PDF pages 25–27.",
			khulasa: "Printed pages 284–288; exact case correction."
		}
	};
	function sourceComparisonId(parentRuleId) {
		return parentRuleId === "KZ-FR-009" || parentRuleId === "KZ-FR-010" ? parentRuleId : `SOURCE-COMPARISON-20260809-${parentRuleId}`;
	}
	function defineDirectFamilyProductionRule(rule) {
		const comparisonId = sourceComparisonId(rule.parentResearchRuleId);
		const locators = LOCATORS[rule.parentResearchRuleId];
		return defineProductionRule({
			...rule,
			lifecycleStatus: "PRODUCTION",
			executable: true,
			sourceReferences: [{
				sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
				evidenceRecordId: rule.parentResearchRuleId,
				locator: locators.kanz
			}, {
				sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
				evidenceRecordId: comparisonId,
				locator: locators.khulasa
			}],
			admissionRecordId: `ADMISSION-20260809-${rule.ruleId}`
		});
	}
	//#endregion
	//#region src/rules/generated/production-registry.ts
	var PRODUCTION_RULES = [
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE",
			parentResearchRuleId: "KZ-FR-004",
			atomicRuleKind: "REMAINDER_POLICY",
			conditions: ["A positive residue remains after admitted fixed and residuary assignments.", "The case explicitly selects FUNCTIONING_BAYT_AL_MAL."],
			exclusions: ["UNSURE does not select this branch.", "An ordinary charity is not treated as Bayt al-Mal."],
			priority: {
				value: 100,
				rationale: "Resolve residue only after fixed and residuary assignments."
			},
			interactionsOrBlockers: ["A functioning Bayt al-Mal receives the qualifying residue."],
			outcomeSpecification: "The qualifying residue is assigned to Bayt al-Mal.",
			executionSpecification: {
				policy: "FUNCTIONING_BAYT_AL_MAL",
				recipient: "BAYT_AL_MAL"
			},
			fixtureIds: ["KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE-POS", "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD",
			parentResearchRuleId: "KZ-FR-004",
			atomicRuleKind: "REMAINDER_POLICY",
			conditions: [
				"A positive residue remains after admitted fixed and residuary assignments.",
				"The case explicitly selects NO_FUNCTIONING_BAYT_AL_MAL_RADD.",
				"At least one non-spouse fixed-share heir is eligible for radd."
			],
			exclusions: [
				"Husbands and wives are excluded from radd.",
				"UNSURE does not select this branch.",
				"Dhawu al-arham are outside this MVP."
			],
			priority: {
				value: 100,
				rationale: "Resolve residue only after fixed and residuary assignments."
			},
			interactionsOrBlockers: ["Redistribute residue proportionally among eligible non-spouse fixed-share heirs."],
			outcomeSpecification: "Radd returns residue proportionally to eligible non-spouse fixed-share heirs.",
			executionSpecification: {
				policy: "NO_FUNCTIONING_BAYT_AL_MAL_RADD",
				spouseReceivesRadd: false,
				method: "PROPORTIONAL"
			},
			fixtureIds: ["KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD-POS", "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD-NEG"]
		}),
		defineProductionSpouseRule({
			ruleId: "KZ-FR-005-HUSBAND-ONE-HALF",
			parentResearchRuleId: "KZ-FR-005",
			lifecycleStatus: "PRODUCTION",
			executable: true,
			spouseCategory: "HUSBAND",
			qualifyingDescendantCondition: "ABSENT",
			fixedShare: {
				numerator: "1",
				denominator: "2"
			},
			wifeGroupBehavior: "NOT_APPLICABLE",
			sourceReferences: [{
				sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
				evidenceRecordId: "MANUAL-20260727-KZ-FR-005",
				locator: "Printed page 136; local PDF page 7."
			}, {
				sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
				evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
				locator: "Printed pages 271–272."
			}],
			conditions: ["The deceased wife has no normalized qualifying descendant."],
			exclusions: ["A normalized qualifying descendant is present."],
			priority: {
				value: 0,
				rationale: "Mutually exclusive with the husband's one-quarter descendant-present rule."
			},
			interactionsOrBlockers: [],
			outcomeSpecification: "The husband receives the exact fixed share 1/2.",
			fixtureIds: [
				"KZ-FR-005-HUSBAND-ONE-HALF-POS-NO-QUALIFYING-DESCENDANT",
				"KZ-FR-005-HUSBAND-ONE-HALF-BOUNDARY-NON-DESCENDANT-HEIR",
				"KZ-FR-005-HUSBAND-ONE-HALF-NEG-WITH-QUALIFYING-DESCENDANT"
			],
			admissionRecordId: "ADMISSION-20260803-KZ-FR-005-HUSBAND-ONE-HALF"
		}),
		defineProductionSpouseRule({
			ruleId: "KZ-FR-006-HUSBAND-ONE-QUARTER",
			parentResearchRuleId: "KZ-FR-006",
			lifecycleStatus: "PRODUCTION",
			executable: true,
			spouseCategory: "HUSBAND",
			qualifyingDescendantCondition: "PRESENT",
			fixedShare: {
				numerator: "1",
				denominator: "4"
			},
			wifeGroupBehavior: "NOT_APPLICABLE",
			sourceReferences: [{
				sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
				evidenceRecordId: "MANUAL-20260727-KZ-FR-006",
				locator: "Printed page 137; local PDF page 8."
			}, {
				sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
				evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
				locator: "Printed pages 271–272."
			}],
			conditions: ["The deceased wife has a normalized qualifying descendant."],
			exclusions: ["No normalized qualifying descendant is present."],
			priority: {
				value: 0,
				rationale: "Mutually exclusive with the husband's one-half descendant-absent rule."
			},
			interactionsOrBlockers: [],
			outcomeSpecification: "The husband receives the exact fixed share 1/4.",
			fixtureIds: [
				"KZ-FR-006-HUSBAND-ONE-QUARTER-POS-WITH-QUALIFYING-DESCENDANT",
				"KZ-FR-006-HUSBAND-ONE-QUARTER-BOUNDARY-SONS-DAUGHTER",
				"KZ-FR-006-HUSBAND-ONE-QUARTER-NEG-NO-QUALIFYING-DESCENDANT"
			],
			admissionRecordId: "ADMISSION-20260803-KZ-FR-006-HUSBAND-ONE-QUARTER"
		}),
		defineProductionSpouseRule({
			ruleId: "KZ-FR-006-WIVES-ONE-QUARTER",
			parentResearchRuleId: "KZ-FR-006",
			lifecycleStatus: "PRODUCTION",
			executable: true,
			spouseCategory: "WIFE_GROUP",
			qualifyingDescendantCondition: "ABSENT",
			fixedShare: {
				numerator: "1",
				denominator: "4"
			},
			wifeGroupBehavior: "VALIDATE_COUNT_AND_DIVIDE_COLLECTIVE_SHARE_EQUALLY",
			sourceReferences: [{
				sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
				evidenceRecordId: "MANUAL-20260727-KZ-FR-006",
				locator: "Printed page 137; local PDF page 8."
			}, {
				sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
				evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
				locator: "Printed pages 271–272."
			}],
			conditions: ["The deceased husband has no normalized qualifying descendant.", "The validated eligible-wife count is an integer from 1 through 4."],
			exclusions: ["A normalized qualifying descendant is present.", "The eligible-wife count is invalid or outside the supported range."],
			priority: {
				value: 0,
				rationale: "Mutually exclusive with the wife-group one-eighth descendant-present rule."
			},
			interactionsOrBlockers: [],
			outcomeSpecification: "Eligible wives collectively receive 1/4, divided equally by validated wife count.",
			fixtureIds: [
				"KZ-FR-006-WIVES-ONE-QUARTER-POS-ONE-WIFE-NO-QUALIFYING-DESCENDANT",
				"KZ-FR-006-WIVES-ONE-QUARTER-BOUNDARY-TWO-WIVES-COLLECTIVE",
				"KZ-FR-006-WIVES-ONE-QUARTER-BOUNDARY-FOUR-WIVES-COLLECTIVE",
				"KZ-FR-006-WIVES-ONE-QUARTER-NEG-WITH-QUALIFYING-DESCENDANT"
			],
			admissionRecordId: "ADMISSION-20260803-KZ-FR-006-WIVES-ONE-QUARTER"
		}),
		defineProductionSpouseRule({
			ruleId: "KZ-FR-007-WIVES-ONE-EIGHTH",
			parentResearchRuleId: "KZ-FR-007",
			lifecycleStatus: "PRODUCTION",
			executable: true,
			spouseCategory: "WIFE_GROUP",
			qualifyingDescendantCondition: "PRESENT",
			fixedShare: {
				numerator: "1",
				denominator: "8"
			},
			wifeGroupBehavior: "VALIDATE_COUNT_AND_DIVIDE_COLLECTIVE_SHARE_EQUALLY",
			sourceReferences: [{
				sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
				evidenceRecordId: "MANUAL-20260727-KZ-FR-007",
				locator: "Printed page 137; local PDF page 8."
			}, {
				sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
				evidenceRecordId: "KHULASA-FIXED-SHARE-LOCATORS",
				locator: "Printed pages 271–272."
			}],
			conditions: ["The deceased husband has a normalized qualifying descendant.", "The validated eligible-wife count is an integer from 1 through 4."],
			exclusions: ["No normalized qualifying descendant is present.", "The eligible-wife count is invalid or outside the supported range."],
			priority: {
				value: 0,
				rationale: "Mutually exclusive with the wife-group one-quarter descendant-absent rule."
			},
			interactionsOrBlockers: [],
			outcomeSpecification: "Eligible wives collectively receive 1/8, divided equally by validated wife count.",
			fixtureIds: [
				"KZ-FR-007-WIVES-ONE-EIGHTH-POS-ONE-WIFE-WITH-QUALIFYING-DESCENDANT",
				"KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-TWO-WIVES-COLLECTIVE",
				"KZ-FR-007-WIVES-ONE-EIGHTH-BOUNDARY-FOUR-WIVES-COLLECTIVE",
				"KZ-FR-007-WIVES-ONE-EIGHTH-NEG-NO-QUALIFYING-DESCENDANT"
			],
			admissionRecordId: "ADMISSION-20260803-KZ-FR-007-WIVES-ONE-EIGHTH"
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-009-MOTHER-ONE-THIRD",
			parentResearchRuleId: "KZ-FR-009",
			atomicRuleKind: "PARENT_FIXED_SHARE",
			conditions: [
				"The mother is present.",
				"No qualifying descendant is present.",
				"Fewer than two source-counted siblings are present.",
				"Neither Umariyyatayn case applies."
			],
			exclusions: [
				"A qualifying descendant is present.",
				"Two or more source-counted siblings are present.",
				"Either Umariyyatayn applies."
			],
			priority: {
				value: 50,
				rationale: "Named Umariyyatayn rules take priority over the ordinary share."
			},
			interactionsOrBlockers: ["The direct-family MVP admits this only when no sibling category is selected."],
			outcomeSpecification: "The mother receives 1/3 of the whole estate.",
			executionSpecification: {
				heirCategory: "MOTHER",
				fixedShare: {
					numerator: "1",
					denominator: "3"
				}
			},
			fixtureIds: ["KZ-FR-009-MOTHER-ONE-THIRD-POS", "KZ-FR-009-MOTHER-ONE-THIRD-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT",
			parentResearchRuleId: "KZ-FR-010",
			atomicRuleKind: "PARENT_FIXED_SHARE",
			conditions: ["The mother is present.", "A qualifying descendant is present."],
			exclusions: ["The sibling-count branch is separate.", "Other KZ-FR-010 heir categories are outside this atom."],
			priority: {
				value: 50,
				rationale: "Assign the fixed share before residue."
			},
			interactionsOrBlockers: ["A qualifying descendant reduces the mother's ordinary share."],
			outcomeSpecification: "The mother receives 1/6.",
			executionSpecification: {
				heirCategory: "MOTHER",
				trigger: "QUALIFYING_DESCENDANT_PRESENT",
				fixedShare: {
					numerator: "1",
					denominator: "6"
				}
			},
			fixtureIds: ["KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT-POS", "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER",
			parentResearchRuleId: "KZ-FR-011",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: ["FATHER is present and eligible.", "FULL_BROTHER is present."],
			exclusions: ["No other blocker/blockee relationship is implied.", "Share reduction is not total exclusion."],
			priority: {
				value: 10,
				rationale: "Resolve the exact total-exclusion pair before assigning the blockee."
			},
			interactionsOrBlockers: ["Only the named relationship executes under this atom."],
			outcomeSpecification: "FULL_BROTHER is totally excluded by FATHER.",
			executionSpecification: {
				blocker: "FATHER",
				blockee: "FULL_BROTHER",
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: ["KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER-POS", "KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER",
			parentResearchRuleId: "KZ-FR-011",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: ["FATHER is present and eligible.", "MATERNAL_BROTHER is present."],
			exclusions: ["No other blocker/blockee relationship is implied.", "Share reduction is not total exclusion."],
			priority: {
				value: 10,
				rationale: "Resolve the exact total-exclusion pair before assigning the blockee."
			},
			interactionsOrBlockers: ["Only the named relationship executes under this atom."],
			outcomeSpecification: "MATERNAL_BROTHER is totally excluded by FATHER.",
			executionSpecification: {
				blocker: "FATHER",
				blockee: "MATERNAL_BROTHER",
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: ["KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER-POS", "KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER",
			parentResearchRuleId: "KZ-FR-011",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: ["FATHER is present and eligible.", "PATERNAL_BROTHER is present."],
			exclusions: ["No other blocker/blockee relationship is implied.", "Share reduction is not total exclusion."],
			priority: {
				value: 10,
				rationale: "Resolve the exact total-exclusion pair before assigning the blockee."
			},
			interactionsOrBlockers: ["Only the named relationship executes under this atom."],
			outcomeSpecification: "PATERNAL_BROTHER is totally excluded by FATHER.",
			executionSpecification: {
				blocker: "FATHER",
				blockee: "PATERNAL_BROTHER",
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: ["KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER-POS", "KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER",
			parentResearchRuleId: "KZ-FR-011",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: ["FATHER is present and eligible.", "PATERNAL_GRANDFATHER is present."],
			exclusions: ["No other blocker/blockee relationship is implied.", "Share reduction is not total exclusion."],
			priority: {
				value: 10,
				rationale: "Resolve the exact total-exclusion pair before assigning the blockee."
			},
			interactionsOrBlockers: ["Only the named relationship executes under this atom."],
			outcomeSpecification: "PATERNAL_GRANDFATHER is totally excluded by FATHER.",
			executionSpecification: {
				blocker: "FATHER",
				blockee: "PATERNAL_GRANDFATHER",
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: ["KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER-POS", "KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-011-SON-BLOCKS-FULL-BROTHER",
			parentResearchRuleId: "KZ-FR-011",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: ["SON is present and eligible.", "FULL_BROTHER is present."],
			exclusions: ["No other blocker/blockee relationship is implied.", "Share reduction is not total exclusion."],
			priority: {
				value: 10,
				rationale: "Resolve the exact total-exclusion pair before assigning the blockee."
			},
			interactionsOrBlockers: ["Only the named relationship executes under this atom."],
			outcomeSpecification: "FULL_BROTHER is totally excluded by SON.",
			executionSpecification: {
				blocker: "SON",
				blockee: "FULL_BROTHER",
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: ["KZ-FR-011-SON-BLOCKS-FULL-BROTHER-POS", "KZ-FR-011-SON-BLOCKS-FULL-BROTHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER",
			parentResearchRuleId: "KZ-FR-011",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: ["SON is present and eligible.", "MATERNAL_BROTHER is present."],
			exclusions: ["No other blocker/blockee relationship is implied.", "Share reduction is not total exclusion."],
			priority: {
				value: 10,
				rationale: "Resolve the exact total-exclusion pair before assigning the blockee."
			},
			interactionsOrBlockers: ["Only the named relationship executes under this atom."],
			outcomeSpecification: "MATERNAL_BROTHER is totally excluded by SON.",
			executionSpecification: {
				blocker: "SON",
				blockee: "MATERNAL_BROTHER",
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: ["KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER-POS", "KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER",
			parentResearchRuleId: "KZ-FR-011",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: ["SON is present and eligible.", "PATERNAL_BROTHER is present."],
			exclusions: ["No other blocker/blockee relationship is implied.", "Share reduction is not total exclusion."],
			priority: {
				value: 10,
				rationale: "Resolve the exact total-exclusion pair before assigning the blockee."
			},
			interactionsOrBlockers: ["Only the named relationship executes under this atom."],
			outcomeSpecification: "PATERNAL_BROTHER is totally excluded by SON.",
			executionSpecification: {
				blocker: "SON",
				blockee: "PATERNAL_BROTHER",
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: ["KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER-POS", "KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-011-SON-BLOCKS-SONS-SON",
			parentResearchRuleId: "KZ-FR-011",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: ["SON is present and eligible.", "SONS_SON is present."],
			exclusions: ["No other blocker/blockee relationship is implied.", "Share reduction is not total exclusion."],
			priority: {
				value: 10,
				rationale: "Resolve the exact total-exclusion pair before assigning the blockee."
			},
			interactionsOrBlockers: ["Only the named relationship executes under this atom."],
			outcomeSpecification: "SONS_SON is totally excluded by SON.",
			executionSpecification: {
				blocker: "SON",
				blockee: "SONS_SON",
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: ["KZ-FR-011-SON-BLOCKS-SONS-SON-POS", "KZ-FR-011-SON-BLOCKS-SONS-SON-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS",
			parentResearchRuleId: "KZ-FR-012",
			atomicRuleKind: "DESCENDANT_FIXED_SHARE",
			conditions: ["Two or more direct daughters are present.", "No direct son is present."],
			exclusions: ["A direct son is present.", "Only one daughter is present."],
			priority: {
				value: 50,
				rationale: "Determine the collective fixed share before residue."
			},
			interactionsOrBlockers: ["A direct son converts daughters to residuary participation."],
			outcomeSpecification: "The daughter group collectively receives 2/3.",
			executionSpecification: {
				heirCategory: "DAUGHTER_GROUP",
				minimumCount: "2",
				fixedShare: {
					numerator: "2",
					denominator: "3"
				}
			},
			fixtureIds: ["KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS-POS", "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-012-ONE-DAUGHTER-ONE-HALF",
			parentResearchRuleId: "KZ-FR-012",
			atomicRuleKind: "DESCENDANT_FIXED_SHARE",
			conditions: ["Exactly one direct daughter is present.", "No direct son is present."],
			exclusions: ["A direct son is present.", "Two or more daughters are present."],
			priority: {
				value: 50,
				rationale: "Determine fixed-share status before residue."
			},
			interactionsOrBlockers: ["A direct son converts her to residuary participation."],
			outcomeSpecification: "One daughter receives 1/2.",
			executionSpecification: {
				heirCategory: "DAUGHTER",
				count: "1",
				fixedShare: {
					numerator: "1",
					denominator: "2"
				}
			},
			fixtureIds: ["KZ-FR-012-ONE-DAUGHTER-ONE-HALF-POS", "KZ-FR-012-ONE-DAUGHTER-ONE-HALF-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-012-SON-GROUP-RESIDUARY",
			parentResearchRuleId: "KZ-FR-012",
			atomicRuleKind: "DESCENDANT_RESIDUARY",
			conditions: ["One or more direct sons are present.", "No direct daughter is present."],
			exclusions: ["A direct daughter is present.", "Deeper descendants are outside this atom."],
			priority: {
				value: 70,
				rationale: "Assign residue after fixed shares."
			},
			interactionsOrBlockers: ["Direct sons take the supported descendant residue equally."],
			outcomeSpecification: "The son group receives the residue equally.",
			executionSpecification: {
				heirCategory: "SON_GROUP",
				method: "EQUAL_RESIDUARY"
			},
			fixtureIds: ["KZ-FR-012-SON-GROUP-RESIDUARY-POS", "KZ-FR-012-SON-GROUP-RESIDUARY-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
			parentResearchRuleId: "KZ-FR-012",
			atomicRuleKind: "DESCENDANT_RESIDUARY",
			conditions: ["At least one direct son is present.", "At least one direct daughter is present."],
			exclusions: ["Only sons or only daughters are present.", "Deeper descendants are outside this atom."],
			priority: {
				value: 70,
				rationale: "Assign residue after fixed shares."
			},
			interactionsOrBlockers: ["Each son has two units and each daughter one unit."],
			outcomeSpecification: "Children share the residue at a male-to-female ratio of 2:1.",
			executionSpecification: {
				heirCategories: ["SON", "DAUGHTER"],
				maleWeight: "2",
				femaleWeight: "1"
			},
			fixtureIds: ["KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE-POS", "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-014-FATHER-ONE-SIXTH",
			parentResearchRuleId: "KZ-FR-014",
			atomicRuleKind: "FATHER_MODE",
			conditions: ["The father is present.", "A qualifying direct male descendant is present."],
			exclusions: ["Only female descendants are present.", "No qualifying descendant is present."],
			priority: {
				value: 50,
				rationale: "Assign the fixed share before descendant residue."
			},
			interactionsOrBlockers: ["The direct male descendant takes the descendant residue."],
			outcomeSpecification: "The father receives 1/6.",
			executionSpecification: {
				heirCategory: "FATHER",
				mode: "FIXED_ONE_SIXTH",
				fixedShare: {
					numerator: "1",
					denominator: "6"
				}
			},
			fixtureIds: ["KZ-FR-014-FATHER-ONE-SIXTH-POS", "KZ-FR-014-FATHER-ONE-SIXTH-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE",
			parentResearchRuleId: "KZ-FR-014",
			atomicRuleKind: "FATHER_MODE",
			conditions: [
				"The father is present.",
				"One or more direct daughters are present.",
				"No direct son is present."
			],
			exclusions: ["A direct son is present.", "No qualifying descendant is present."],
			priority: {
				value: 70,
				rationale: "Assign 1/6 before adding the remaining residue."
			},
			interactionsOrBlockers: ["Daughters retain their admitted fixed share."],
			outcomeSpecification: "The father receives 1/6 plus any residue.",
			executionSpecification: {
				heirCategory: "FATHER",
				mode: "FIXED_ONE_SIXTH_PLUS_RESIDUE",
				fixedShare: {
					numerator: "1",
					denominator: "6"
				}
			},
			fixtureIds: ["KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE-POS", "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-014-FATHER-RESIDUARY",
			parentResearchRuleId: "KZ-FR-014",
			atomicRuleKind: "FATHER_MODE",
			conditions: [
				"The father is present.",
				"No qualifying descendant is present.",
				"Neither Umariyyatayn applies."
			],
			exclusions: ["A qualifying descendant is present.", "Either Umariyyatayn applies."],
			priority: {
				value: 70,
				rationale: "Assign the father the residue after fixed shares."
			},
			interactionsOrBlockers: ["Named Umariyyatayn rules take priority."],
			outcomeSpecification: "The father receives the residue.",
			executionSpecification: {
				heirCategory: "FATHER",
				mode: "RESIDUARY"
			},
			fixtureIds: ["KZ-FR-014-FATHER-RESIDUARY-POS", "KZ-FR-014-FATHER-RESIDUARY-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-015-HUSBAND-MOTHER-FATHER",
			parentResearchRuleId: "KZ-FR-015",
			atomicRuleKind: "UMARIYYATAYN",
			conditions: ["The complete supported heir set is husband, mother, and father.", "No descendant or other heir is present."],
			exclusions: ["The mother's ordinary one third of the whole does not apply."],
			priority: {
				value: 20,
				rationale: "The named case precedes ordinary parent rules."
			},
			interactionsOrBlockers: ["Apply the husband's half, then give the mother one third of the remainder."],
			outcomeSpecification: "Husband receives 1/2, mother 1/6, father 1/3.",
			executionSpecification: {
				originalAsl: "6",
				husband: {
					numerator: "1",
					denominator: "2"
				},
				mother: {
					numerator: "1",
					denominator: "6"
				},
				father: {
					numerator: "1",
					denominator: "3"
				}
			},
			fixtureIds: ["KZ-FR-015-HUSBAND-MOTHER-FATHER-POS", "KZ-FR-015-HUSBAND-MOTHER-FATHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-015-WIFE-MOTHER-FATHER",
			parentResearchRuleId: "KZ-FR-015",
			atomicRuleKind: "UMARIYYATAYN",
			conditions: ["The complete supported heir set is wife group, mother, and father.", "No descendant or other heir is present."],
			exclusions: ["The mother's ordinary one third of the whole does not apply."],
			priority: {
				value: 20,
				rationale: "The named case precedes ordinary parent rules."
			},
			interactionsOrBlockers: ["Apply the wives' quarter, then give the mother one third of the remainder."],
			outcomeSpecification: "Wife group receives 1/4, mother 1/4, father 1/2.",
			executionSpecification: {
				originalAsl: "4",
				wives: {
					numerator: "1",
					denominator: "4"
				},
				mother: {
					numerator: "1",
					denominator: "4"
				},
				father: {
					numerator: "1",
					denominator: "2"
				}
			},
			fixtureIds: ["KZ-FR-015-WIFE-MOTHER-FATHER-POS", "KZ-FR-015-WIFE-MOTHER-FATHER-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-029-MULTIPLE-CLASS-CORRECTION",
			parentResearchRuleId: "KZ-FR-029",
			atomicRuleKind: "CASE_CORRECTION",
			conditions: ["Two or more collective classes have saham not divisible by their person counts.", "The current integer denominator and class saham have already been derived."],
			exclusions: ["No correction is applied when every class divides exactly.", "Floating-point arithmetic is excluded."],
			priority: {
				value: 200,
				rationale: "Correct only after fixed, residuary, remainder, and any admitted awl result."
			},
			interactionsOrBlockers: ["Scale the denominator and all class saham by one exact integer factor."],
			outcomeSpecification: "Use the exact combined factor so every corrected class divides per person.",
			executionSpecification: {
				arithmetic: "BIGINT_ONLY",
				method: "LCM_OF_BROKEN_CLASS_FACTORS"
			},
			fixtureIds: ["KZ-FR-029-MULTIPLE-CLASS-CORRECTION-POS", "KZ-FR-029-MULTIPLE-CLASS-CORRECTION-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-029-SINGLE-CLASS-CORRECTION",
			parentResearchRuleId: "KZ-FR-029",
			atomicRuleKind: "CASE_CORRECTION",
			conditions: ["Exactly one collective class has saham not divisible by its person count.", "The current integer denominator and class saham have already been derived."],
			exclusions: ["No correction is applied when every class divides exactly.", "Floating-point arithmetic is excluded."],
			priority: {
				value: 200,
				rationale: "Correct only after fixed, residuary, remainder, and any admitted awl result."
			},
			interactionsOrBlockers: ["Scale the denominator and all class saham by one exact integer factor."],
			outcomeSpecification: "Use the exact single-class factor so each corrected share divides per person.",
			executionSpecification: {
				arithmetic: "BIGINT_ONLY",
				method: "PERSON_COUNT_DIVIDED_BY_GCD"
			},
			fixtureIds: ["KZ-FR-029-SINGLE-CLASS-CORRECTION-POS", "KZ-FR-029-SINGLE-CLASS-CORRECTION-NEG"]
		})
	];
	//#endregion
	//#region src/rules/case-coverage-evaluator.ts
	var DEFAULT_PRODUCTION_CORPUS = { rules: PRODUCTION_RULES };
	var heirTypeSet = new Set(HEIR_TYPES);
	new Set(QUALIFYING_DESCENDANT_CATEGORIES);
	var DIRECT_FAMILY_TYPES = /* @__PURE__ */ new Set([
		"HUSBAND",
		"WIFE",
		"FATHER",
		"MOTHER",
		"SON",
		"DAUGHTER"
	]);
	function wholeCaseResult(status, normalizedHeirs, options) {
		return {
			status,
			wholeCaseCoverage: status === "SUPPORTED" ? "WHOLE_CASE_SUPPORTED" : "WHOLE_CASE_UNSUPPORTED",
			normalizedHeirs,
			...options
		};
	}
	function normalizedWholeCaseHeirs(heirs) {
		const counts = /* @__PURE__ */ new Map();
		for (const heir of heirs) counts.set(heir.type, (counts.get(heir.type) ?? 0) + heir.count);
		return [...counts.entries()].filter(([, count]) => count > 0).sort(([left], [right]) => left.localeCompare(right)).map(([type, count]) => ({
			heirId: type.toLowerCase(),
			type,
			count
		}));
	}
	/** Pure whole-case gate. Every required atom must exist in the generated production registry. */
	function evaluateWholeCaseCoverage(input, corpus = DEFAULT_PRODUCTION_CORPUS) {
		const invalidFields = [];
		for (const [index, heir] of input.heirs.entries()) if (!heirTypeSet.has(heir.type) || !Number.isInteger(heir.count) || heir.count < 0) invalidFields.push(`heirs[${index}]`);
		const normalizedHeirs = invalidFields.length === 0 ? normalizedWholeCaseHeirs(input.heirs) : [];
		const count = (type) => normalizedHeirs.find((heir) => heir.type === type)?.count ?? 0;
		if (count("HUSBAND") > 1) invalidFields.push("heirs.HUSBAND");
		if (count("WIFE") > 4) invalidFields.push("heirs.WIFE");
		if (count("FATHER") > 1) invalidFields.push("heirs.FATHER");
		if (count("MOTHER") > 1) invalidFields.push("heirs.MOTHER");
		if (count("HUSBAND") > 0 && count("WIFE") > 0) invalidFields.push("heirs.spouse");
		if (input.deceasedSex === "MALE" && count("HUSBAND") > 0) invalidFields.push("heirs.HUSBAND");
		if (input.deceasedSex === "FEMALE" && count("WIFE") > 0) invalidFields.push("heirs.WIFE");
		const base = {
			supportedRuleIds: [],
			requiredRuleIds: [],
			reasons: [],
			missingFields: [],
			invalidFields,
			unsupportedHeirs: [],
			blockedHeirs: [],
			requiresAwl: false
		};
		if (invalidFields.length > 0) return wholeCaseResult("INVALID_INPUT", normalizedHeirs, base);
		if (normalizedHeirs.length === 0) return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
			...base,
			missingFields: ["heirs"],
			reasons: ["NO_HEIRS_SELECTED"]
		});
		if ((input.unresolvedFacts?.length ?? 0) > 0) return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
			...base,
			missingFields: [...input.unresolvedFacts ?? []],
			reasons: ["UNRESOLVED_CASE_FACTS"]
		});
		const unsupportedHeirs = normalizedHeirs.filter((heir) => !DIRECT_FAMILY_TYPES.has(heir.type)).map(({ type, count: heirCount }) => ({
			type,
			count: heirCount
		}));
		if (unsupportedHeirs.length > 0) {
			const blockerPairs = [
				[
					"FATHER",
					"PATERNAL_GRANDFATHER",
					"KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER"
				],
				[
					"FATHER",
					"FULL_BROTHER",
					"KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER"
				],
				[
					"FATHER",
					"PATERNAL_BROTHER",
					"KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER"
				],
				[
					"FATHER",
					"MATERNAL_BROTHER",
					"KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER"
				],
				[
					"SON",
					"SONS_SON",
					"KZ-FR-011-SON-BLOCKS-SONS-SON"
				],
				[
					"SON",
					"FULL_BROTHER",
					"KZ-FR-011-SON-BLOCKS-FULL-BROTHER"
				],
				[
					"SON",
					"PATERNAL_BROTHER",
					"KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER"
				],
				[
					"SON",
					"MATERNAL_BROTHER",
					"KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER"
				]
			];
			const productionIds = new Set(corpus.rules.map((rule) => rule.ruleId));
			const blockedHeirs = blockerPairs.flatMap(([blockerType, type, ruleId]) => {
				const blockedCount = count(type);
				return count(blockerType) > 0 && blockedCount > 0 && productionIds.has(ruleId) ? [{
					type,
					count: blockedCount,
					blockerType,
					ruleId,
					reason: `${type} is totally excluded by ${blockerType}.`
				}] : [];
			});
			return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				unsupportedHeirs,
				blockedHeirs,
				reasons: [...unsupportedHeirs.map((heir) => `UNSUPPORTED_HEIR_CATEGORY:${heir.type}`), ...blockedHeirs.map((heir) => `BLOCKED_HEIR:${heir.type}:BY:${heir.blockerType}:RULE:${heir.ruleId}`)]
			});
		}
		const hasDescendant = count("SON") + count("DAUGHTER") > 0;
		const hasSon = count("SON") > 0;
		const hasDaughter = count("DAUGHTER") > 0;
		const activeTypes = normalizedHeirs.map((heir) => heir.type);
		const exactly = (...types) => activeTypes.length === types.length && types.every((type) => activeTypes.includes(type));
		const husbandUmari = exactly("HUSBAND", "MOTHER", "FATHER");
		const wifeUmari = exactly("WIFE", "MOTHER", "FATHER") && count("WIFE") === 1;
		if (exactly("WIFE", "MOTHER", "FATHER") && count("WIFE") > 1) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			reasons: ["UMARIYYATAYN_MULTIPLE_WIVES_NOT_ADMITTED"]
		});
		const requiredRuleIds = [];
		const fixedShares = [];
		let hasResiduary = false;
		if (count("HUSBAND") > 0) {
			requiredRuleIds.push(hasDescendant ? "KZ-FR-006-HUSBAND-ONE-QUARTER" : "KZ-FR-005-HUSBAND-ONE-HALF");
			fixedShares.push(hasDescendant ? new Fraction(1n, 4n) : new Fraction(1n, 2n));
		}
		if (count("WIFE") > 0) {
			requiredRuleIds.push(hasDescendant ? "KZ-FR-007-WIVES-ONE-EIGHTH" : "KZ-FR-006-WIVES-ONE-QUARTER");
			fixedShares.push(hasDescendant ? new Fraction(1n, 8n) : new Fraction(1n, 4n));
		}
		if (husbandUmari || wifeUmari) {
			requiredRuleIds.push(husbandUmari ? "KZ-FR-015-HUSBAND-MOTHER-FATHER" : "KZ-FR-015-WIFE-MOTHER-FATHER");
			fixedShares.push(husbandUmari ? new Fraction(1n, 6n) : new Fraction(1n, 4n));
			fixedShares.push(husbandUmari ? new Fraction(1n, 3n) : new Fraction(1n, 2n));
		} else {
			if (count("MOTHER") > 0) {
				requiredRuleIds.push(hasDescendant ? "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT" : "KZ-FR-009-MOTHER-ONE-THIRD");
				fixedShares.push(hasDescendant ? new Fraction(1n, 6n) : new Fraction(1n, 3n));
			}
			if (count("FATHER") > 0) if (hasSon) {
				requiredRuleIds.push("KZ-FR-014-FATHER-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			} else if (hasDaughter) {
				requiredRuleIds.push("KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE");
				fixedShares.push(new Fraction(1n, 6n));
				hasResiduary = true;
			} else {
				requiredRuleIds.push("KZ-FR-014-FATHER-RESIDUARY");
				hasResiduary = true;
			}
			if (hasSon && hasDaughter) {
				requiredRuleIds.push("KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE");
				hasResiduary = true;
			} else if (hasSon) {
				requiredRuleIds.push("KZ-FR-012-SON-GROUP-RESIDUARY");
				hasResiduary = true;
			} else if (count("DAUGHTER") === 1) {
				requiredRuleIds.push("KZ-FR-012-ONE-DAUGHTER-ONE-HALF");
				fixedShares.push(new Fraction(1n, 2n));
			} else if (count("DAUGHTER") >= 2) {
				requiredRuleIds.push("KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS");
				fixedShares.push(new Fraction(2n, 3n));
			}
		}
		const fixedTotal = sumFractions(fixedShares);
		if (fixedTotal.compare(Fraction.ONE) > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			requiredRuleIds,
			reasons: ["AWL_RULE_NOT_ADMITTED"],
			requiresAwl: true
		});
		if (!hasResiduary && fixedTotal.compare(Fraction.ONE) < 0) {
			if (input.remainderPolicy === null) return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
				...base,
				requiredRuleIds,
				missingFields: ["remainderPolicy"],
				reasons: ["REMAINDER_POLICY_MISSING"]
			});
			if (input.remainderPolicy === "UNSURE") return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				requiredRuleIds,
				reasons: ["REMAINDER_POLICY_UNRESOLVED"]
			});
			if (input.remainderPolicy === "NO_FUNCTIONING_BAYT_AL_MAL_RADD" && count("MOTHER") === 0 && count("DAUGHTER") === 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				requiredRuleIds,
				reasons: ["RADD_HAS_NO_ELIGIBLE_NON_SPOUSE_RECIPIENT"]
			});
			requiredRuleIds.push(input.remainderPolicy === "FUNCTIONING_BAYT_AL_MAL" ? "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE" : "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD");
		}
		const productionIds = new Set(corpus.rules.map((rule) => rule.ruleId));
		const missingRuleIds = [...new Set(requiredRuleIds)].filter((id) => !productionIds.has(id));
		if (missingRuleIds.length > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			requiredRuleIds: [...new Set(requiredRuleIds)],
			reasons: missingRuleIds.map((id) => `RULE_NOT_ADMITTED:${id}`)
		});
		return wholeCaseResult("SUPPORTED", normalizedHeirs, {
			...base,
			requiredRuleIds: [...new Set(requiredRuleIds)],
			supportedRuleIds: [...new Set(requiredRuleIds)]
		});
	}
	//#endregion
	//#region src/engine/supported-inheritance.ts
	var UnsupportedInheritanceCaseError = class extends Error {
		coverage;
		issues;
		constructor(coverage, issues = []) {
			super(issues[0] ?? coverage.reasons[0] ?? "This combination is not supported yet.");
			this.coverage = coverage;
			this.issues = issues;
			this.name = "UnsupportedInheritanceCaseError";
		}
	};
	var productionById = new Map(PRODUCTION_RULES.map((rule) => [rule.ruleId, rule]));
	function parseMinorUnits(value, field, issues) {
		const normalized = value.trim();
		if (!/^(0|[1-9]\d*)$/.test(normalized)) {
			issues.push(`${field} must be a non-negative integer minor-unit string.`);
			return 0n;
		}
		return BigInt(normalized);
	}
	function ruleSources(ruleIds) {
		const seen = /* @__PURE__ */ new Set();
		return ruleIds.flatMap((ruleId) => {
			const rule = productionById.get(ruleId);
			if (rule === void 0) throw new Error(`Production registry is missing ${ruleId}.`);
			return rule.sourceReferences.filter((source) => {
				const key = `${source.sourceId}\0${source.evidenceRecordId}\0${source.locator}`;
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
		});
	}
	function addAssignment(assignments, heirType, count, fraction, kind, ruleId) {
		const current = assignments.get(heirType);
		if (current === void 0) {
			assignments.set(heirType, {
				heirType,
				count,
				fraction,
				fixedFraction: kind === "FIXED" ? fraction : Fraction.ZERO,
				ruleIds: [ruleId],
				kinds: [kind]
			});
			return;
		}
		current.fraction = current.fraction.add(fraction);
		if (!current.ruleIds.includes(ruleId)) current.ruleIds.push(ruleId);
		if (!current.kinds.includes(kind)) current.kinds.push(kind);
	}
	function fractionReason(heirType, ruleId) {
		if (ruleId.includes("MOTHER-ONE-SIXTH")) return "A qualifying descendant exists.";
		if (ruleId.includes("MOTHER-ONE-THIRD")) return "No qualifying descendant or admitted sibling condition applies.";
		if (ruleId.includes("ONE-DAUGHTER")) return "One daughter is present and no son is present.";
		if (ruleId.includes("DAUGHTER-GROUP")) return "Two or more daughters are present and no son is present.";
		if (ruleId.includes("FATHER-ONE-SIXTH-PLUS")) return "Female descendants are present without a male descendant.";
		if (ruleId.includes("FATHER-ONE-SIXTH")) return "A qualifying male descendant is present.";
		if (heirType === "HUSBAND" || heirType === "WIFE") return "The spouse share follows the presence or absence of qualifying descendants.";
		return "The admitted production rule's stated conditions are satisfied.";
	}
	function correctionFor(assignments) {
		const workingDenominator = assignments.reduce((denominator, assignment) => leastCommonMultiple(denominator, assignment.fraction.denominator), 1n);
		const broken = assignments.flatMap((assignment) => {
			if (assignment.count <= 1) return [];
			const saham = assignment.fraction.numerator * (workingDenominator / assignment.fraction.denominator);
			if (saham % BigInt(assignment.count) === 0n) return [];
			const factor = BigInt(assignment.count) / greatestCommonDivisor(BigInt(assignment.count), saham);
			return [{
				heirType: assignment.heirType,
				factor
			}];
		});
		const factor = broken.reduce((combined, item) => leastCommonMultiple(combined, item.factor), 1n);
		return {
			workingDenominator,
			correctedDenominator: workingDenominator * factor,
			factor,
			brokenClasses: broken.map((item) => item.heirType),
			ruleId: broken.length === 0 ? null : broken.length === 1 ? "KZ-FR-029-SINGLE-CLASS-CORRECTION" : "KZ-FR-029-MULTIPLE-CLASS-CORRECTION"
		};
	}
	function calculateSupportedInheritance(input) {
		const estateIssues = [];
		const gross = parseMinorUnits(input.grossEstateMinorUnits, "grossEstateMinorUnits", estateIssues);
		const deductions = input.deductions.map((deduction, index) => ({
			...deduction,
			amount: parseMinorUnits(deduction.amountMinorUnits, `deductions[${index}]`, estateIssues)
		}));
		const bequest = parseMinorUnits(input.validBequestMinorUnits, "validBequestMinorUnits", estateIssues);
		const totalDeductions = deductions.reduce((total, deduction) => total + deduction.amount, 0n);
		if (totalDeductions > gross) estateIssues.push("DEDUCTIONS_EXCEED_GROSS_ESTATE");
		const afterDeductions = gross - (totalDeductions > gross ? gross : totalDeductions);
		if (bequest > afterDeductions) estateIssues.push("BEQUEST_EXCEEDS_REMAINING_ESTATE");
		if (bequest * 3n > afterDeductions && input.excessBequestConsentConfirmed !== true) estateIssues.push("BEQUEST_EXCEEDS_ONE_THIRD_UNRESOLVED");
		const coverage = evaluateWholeCaseCoverage({
			deceasedSex: input.deceasedSex,
			heirs: input.heirs,
			remainderPolicy: input.remainderPolicy,
			unresolvedFacts: input.unresolvedFacts ?? []
		});
		if (estateIssues.length > 0 || coverage.status !== "SUPPORTED") throw new UnsupportedInheritanceCaseError(coverage, estateIssues);
		const netEstate = afterDeductions - bequest;
		const selected = coverage.normalizedHeirs;
		const count = (type) => selected.find((heir) => heir.type === type)?.count ?? 0;
		const required = new Set(coverage.requiredRuleIds);
		const assignments = /* @__PURE__ */ new Map();
		const fixedShareAssignments = [];
		const residuaryAssignments = [];
		const addFixed = (type, share, ruleId) => {
			addAssignment(assignments, type, count(type), share, "FIXED", ruleId);
			fixedShareAssignments.push({
				heirType: type,
				fraction: share.toJSON(),
				ruleId,
				reason: fractionReason(type, ruleId)
			});
		};
		const husbandUmari = required.has("KZ-FR-015-HUSBAND-MOTHER-FATHER");
		const wifeUmari = required.has("KZ-FR-015-WIFE-MOTHER-FATHER");
		if (husbandUmari) {
			addFixed("HUSBAND", new Fraction(1n, 2n), "KZ-FR-005-HUSBAND-ONE-HALF");
			addFixed("MOTHER", new Fraction(1n, 6n), "KZ-FR-015-HUSBAND-MOTHER-FATHER");
			addFixed("FATHER", new Fraction(1n, 3n), "KZ-FR-015-HUSBAND-MOTHER-FATHER");
		} else if (wifeUmari) {
			addFixed("WIFE", new Fraction(1n, 4n), "KZ-FR-006-WIVES-ONE-QUARTER");
			addFixed("MOTHER", new Fraction(1n, 4n), "KZ-FR-015-WIFE-MOTHER-FATHER");
			addFixed("FATHER", new Fraction(1n, 2n), "KZ-FR-015-WIFE-MOTHER-FATHER");
		} else {
			for (const [type, rules] of [["HUSBAND", ["KZ-FR-005-HUSBAND-ONE-HALF", "KZ-FR-006-HUSBAND-ONE-QUARTER"]], ["WIFE", ["KZ-FR-006-WIVES-ONE-QUARTER", "KZ-FR-007-WIVES-ONE-EIGHTH"]]]) {
				const ruleId = rules.find((id) => required.has(id));
				if (ruleId !== void 0) addFixed(type, ruleId.includes("ONE-HALF") ? new Fraction(1n, 2n) : ruleId.includes("ONE-EIGHTH") ? new Fraction(1n, 8n) : new Fraction(1n, 4n), ruleId);
			}
			if (required.has("KZ-FR-009-MOTHER-ONE-THIRD")) addFixed("MOTHER", new Fraction(1n, 3n), "KZ-FR-009-MOTHER-ONE-THIRD");
			if (required.has("KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT")) addFixed("MOTHER", new Fraction(1n, 6n), "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT");
			if (required.has("KZ-FR-012-ONE-DAUGHTER-ONE-HALF")) addFixed("DAUGHTER", new Fraction(1n, 2n), "KZ-FR-012-ONE-DAUGHTER-ONE-HALF");
			if (required.has("KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS")) addFixed("DAUGHTER", new Fraction(2n, 3n), "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS");
			if (required.has("KZ-FR-014-FATHER-ONE-SIXTH")) addFixed("FATHER", new Fraction(1n, 6n), "KZ-FR-014-FATHER-ONE-SIXTH");
			if (required.has("KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE")) addFixed("FATHER", new Fraction(1n, 6n), "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE");
		}
		const fixedTotal = sumFractions([...assignments.values()].map((assignment) => assignment.fraction));
		const residue = Fraction.ONE.subtract(fixedTotal);
		const addResidue = (type, ruleId) => {
			addAssignment(assignments, type, count(type), residue, "RESIDUARY", ruleId);
			residuaryAssignments.push({
				heirType: type,
				fraction: residue.toJSON(),
				ruleId,
				reason: "This class receives the residue after fixed shares."
			});
		};
		if (required.has("KZ-FR-012-SON-GROUP-RESIDUARY")) addResidue("SON", "KZ-FR-012-SON-GROUP-RESIDUARY");
		if (required.has("KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE")) {
			const units = BigInt(2 * count("SON") + count("DAUGHTER"));
			const sonShare = residue.multiply(new Fraction(BigInt(2 * count("SON")), units));
			const daughterShare = residue.subtract(sonShare);
			addAssignment(assignments, "SON", count("SON"), sonShare, "RESIDUARY", "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE");
			addAssignment(assignments, "DAUGHTER", count("DAUGHTER"), daughterShare, "RESIDUARY", "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE");
			residuaryAssignments.push({
				heirType: "SON",
				fraction: sonShare.toJSON(),
				ruleId: "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
				reason: "Each son receives two weight units."
			}, {
				heirType: "DAUGHTER",
				fraction: daughterShare.toJSON(),
				ruleId: "KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE",
				reason: "Each daughter receives one weight unit."
			});
		}
		if (required.has("KZ-FR-014-FATHER-RESIDUARY")) addResidue("FATHER", "KZ-FR-014-FATHER-RESIDUARY");
		if (required.has("KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE")) addResidue("FATHER", "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE");
		let raddDetails = null;
		let baytFraction = Fraction.ZERO;
		if (residue.compare(Fraction.ZERO) > 0 && residuaryAssignments.length === 0) if (input.remainderPolicy === "FUNCTIONING_BAYT_AL_MAL") baytFraction = residue;
		else {
			const eligible = [...assignments.values()].filter((assignment) => assignment.heirType !== "HUSBAND" && assignment.heirType !== "WIFE");
			const baseTotal = sumFractions(eligible.map((assignment) => assignment.fraction));
			const additions = eligible.map((assignment) => ({
				assignment,
				addition: residue.multiply(assignment.fraction.divide(baseTotal))
			}));
			for (const { assignment, addition } of additions) addAssignment(assignments, assignment.heirType, assignment.count, addition, "RADD", "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD");
			raddDetails = {
				originalResidue: residue.toJSON(),
				recipientFractions: additions.map(({ assignment, addition }) => ({
					heirType: assignment.heirType,
					addedFraction: addition.toJSON()
				})),
				spouseReceivesRadd: false,
				ruleId: "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD"
			};
		}
		const assignmentList = [...assignments.values()];
		const personShares = assignmentList.flatMap((assignment) => {
			const perPerson = assignment.fraction.divide(new Fraction(BigInt(assignment.count)));
			return Array.from({ length: assignment.count }, (_, index) => ({
				id: `${assignment.heirType}-${index + 1}`,
				share: perPerson
			}));
		});
		if (!baytFraction.isZero()) personShares.push({
			id: "BAYT_AL_MAL",
			share: baytFraction
		});
		const money = apportionMoney(netEstate, personShares);
		const allocations = assignmentList.map((assignment) => {
			const perPersonAmounts = money.filter((item) => item.id.startsWith(`${assignment.heirType}-`)).map((item) => item.minorUnits);
			return {
				heirType: assignment.heirType,
				count: assignment.count,
				collectiveFraction: assignment.fraction.toJSON(),
				perPersonFraction: assignment.fraction.divide(new Fraction(BigInt(assignment.count))).toJSON(),
				exactAmountMinorUnits: perPersonAmounts.reduce((total, amount) => total + amount, 0n).toString(),
				perPersonAmountsMinorUnits: perPersonAmounts.map(String),
				assignmentKinds: assignment.kinds,
				appliedRuleIds: assignment.ruleIds
			};
		});
		const baytAmount = money.find((item) => item.id === "BAYT_AL_MAL")?.minorUnits ?? 0n;
		const correction = correctionFor(assignmentList);
		if (correction.ruleId !== null && !productionById.has(correction.ruleId)) throw new UnsupportedInheritanceCaseError(coverage, [`RULE_NOT_ADMITTED:${correction.ruleId}`]);
		const appliedRuleIds = [.../* @__PURE__ */ new Set([...coverage.requiredRuleIds, ...correction.ruleId === null ? [] : [correction.ruleId]])];
		const sources = ruleSources(appliedRuleIds);
		const explanationSteps = [
			{
				kind: "ESTATE",
				title: "Net distributable estate",
				summary: `${gross} - ${totalDeductions} - ${bequest} = ${netEstate} minor units.`,
				ruleIds: [],
				sourceReferences: []
			},
			{
				kind: "HEIRS",
				title: "Eligible heirs",
				summary: selected.map((heir) => `${heir.type} × ${heir.count}`).join(", "),
				ruleIds: [],
				sourceReferences: []
			},
			{
				kind: "BLOCKING",
				title: "Blocked heirs",
				summary: coverage.blockedHeirs.length === 0 ? "No selected heir is blocked in this supported direct-family case." : coverage.blockedHeirs.map((heir) => heir.reason).join(" "),
				ruleIds: [],
				sourceReferences: []
			},
			...fixedShareAssignments.map((share) => ({
				kind: "FIXED_SHARE",
				title: `${share.heirType} — ${share.fraction.numerator}/${share.fraction.denominator}`,
				summary: share.reason,
				heirType: share.heirType,
				fraction: share.fraction,
				ruleIds: [share.ruleId],
				sourceReferences: ruleSources([share.ruleId])
			})),
			...residuaryAssignments.map((share) => ({
				kind: "RESIDUARY",
				title: `${share.heirType} residuary share`,
				summary: share.reason,
				heirType: share.heirType,
				fraction: share.fraction,
				ruleIds: [share.ruleId],
				sourceReferences: ruleSources([share.ruleId])
			}))
		];
		if (raddDetails !== null) explanationSteps.push({
			kind: "REMAINDER",
			title: "Radd",
			summary: "Residue was returned proportionally to eligible non-spouse fixed-share heirs; spouses received no radd.",
			fraction: raddDetails.originalResidue,
			ruleIds: [raddDetails.ruleId],
			sourceReferences: ruleSources([raddDetails.ruleId])
		});
		if (!baytFraction.isZero()) explanationSteps.push({
			kind: "REMAINDER",
			title: "Bayt al-Mal residue",
			summary: "The explicitly selected functioning Bayt al-Mal receives the qualifying residue.",
			fraction: baytFraction.toJSON(),
			ruleIds: ["KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE"],
			sourceReferences: ruleSources(["KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE"])
		});
		if (correction.ruleId !== null) explanationSteps.push({
			kind: "CORRECTION",
			title: "Exact case correction",
			summary: `The working denominator ${correction.workingDenominator} is scaled by ${correction.factor} so each group divides exactly.`,
			ruleIds: [correction.ruleId],
			sourceReferences: ruleSources([correction.ruleId])
		});
		explanationSteps.push({
			kind: "AMOUNTS",
			title: "Final exact amounts",
			summary: allocations.map((allocation) => `${allocation.heirType}: ${allocation.exactAmountMinorUnits}`).join("; "),
			ruleIds: [],
			sourceReferences: []
		}, {
			kind: "RULES",
			title: "Rules used",
			summary: appliedRuleIds.join(", "),
			ruleIds: appliedRuleIds,
			sourceReferences: sources
		}, {
			kind: "SOURCES",
			title: "Source references",
			summary: sources.map((source) => `${source.sourceId} — ${source.locator}`).join("; "),
			ruleIds: appliedRuleIds,
			sourceReferences: sources
		});
		return {
			status: "COMPLETE",
			grossEstateMinorUnits: gross.toString(),
			deductions: input.deductions,
			totalDeductionsMinorUnits: totalDeductions.toString(),
			validBequestMinorUnits: bequest.toString(),
			netDistributableEstateMinorUnits: netEstate.toString(),
			currencyCode: input.currencyCode.trim().toUpperCase(),
			selectedHeirs: selected,
			eligibleHeirs: selected,
			blockedHeirs: coverage.blockedHeirs,
			fixedShareAssignments,
			residuaryAssignments,
			originalAsl: null,
			aslStatus: "ASL_RULE_NOT_ADMITTED",
			workingDenominator: correction.workingDenominator.toString(),
			correctedDenominator: correction.correctedDenominator.toString(),
			awlDetails: null,
			raddDetails,
			baytAlMalResidue: baytFraction.isZero() ? null : {
				fraction: baytFraction.toJSON(),
				exactAmountMinorUnits: baytAmount.toString(),
				ruleId: "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE"
			},
			correctionDetails: correction.ruleId === null ? null : {
				factor: correction.factor.toString(),
				brokenClasses: correction.brokenClasses,
				ruleId: correction.ruleId
			},
			allocations,
			appliedProductionRuleIds: appliedRuleIds,
			sourceReferences: sources,
			explanationSteps,
			calculationType: husbandUmari || wifeUmari ? "UMARIYYATAYN" : "ORDINARY",
			remainderPolicy: input.remainderPolicy ?? "UNSURE"
		};
	}
	//#endregion
	//#region src/browser/calculator-entry.ts
	window.FaraidCalculator = Object.freeze({
		calculateSupportedInheritance,
		evaluateWholeCaseCoverage
	});
	//#endregion
})();

//# sourceMappingURL=calculator.js.map