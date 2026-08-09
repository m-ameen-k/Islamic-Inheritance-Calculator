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
	//#region src/engine/exact-case-bases.ts
	var ORIGINAL_ASL_RULE_ID = "KZ-FR-027-ORIGINAL-ASL";
	var AWL_RULE_ID = "KZ-FR-028-AWL-ADJUSTMENT";
	function productionRule$41(rules, ruleId) {
		return rules.find((rule) => rule.ruleId === ruleId && rule.lifecycleStatus === "PRODUCTION" && rule.executable);
	}
	function stringArray(value) {
		return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
	}
	function executionSpecification(rule) {
		const value = rule.executionSpecification;
		return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function deriveOriginalAsl(fixedShares) {
		return fixedShares.reduce((origin, share) => leastCommonMultiple(origin, share.denominator), 1n);
	}
	function isOriginalAslAdmitted(originalAsl, rules) {
		const rule = productionRule$41(rules, ORIGINAL_ASL_RULE_ID);
		if (rule === void 0) return false;
		const specification = executionSpecification(rule);
		if (originalAsl === 1n) return specification.noFixedShareIdentity === "1";
		return stringArray(specification.allowedFixedShareOrigins).includes(originalAsl.toString());
	}
	function originalSaham(share, originalAsl) {
		if (originalAsl % share.denominator !== 0n) throw new RangeError("A fixed-share denominator does not divide the original asl.");
		return share.numerator * (originalAsl / share.denominator);
	}
	function deriveAwlDenominator(fixedShares, originalAsl) {
		const sum = fixedShares.reduce((total, share) => total + originalSaham(share, originalAsl), 0n);
		return sum > originalAsl ? sum : null;
	}
	function isAwlEndpointAdmitted(originalAsl, awlDenominator, rules) {
		const rule = productionRule$41(rules, AWL_RULE_ID);
		if (rule === void 0) return false;
		const endpoints = executionSpecification(rule).allowedEndpoints;
		if (endpoints === null || typeof endpoints !== "object" || Array.isArray(endpoints)) return false;
		return stringArray(endpoints[originalAsl.toString()]).includes(awlDenominator.toString());
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
		"KZ-FR-005": {
			kanz: "Printed page 136; local PDF page 7.",
			khulasa: "Printed pages 271–272; category-specific one-half conditions."
		},
		"KZ-FR-008": {
			kanz: "Printed page 137; local PDF page 8.",
			khulasa: "Printed pages 271–273; category-specific two-thirds conditions."
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
		"KZ-FR-027": {
			kanz: "Printed pages 152–153; local PDF pages 23–24.",
			khulasa: "Printed page 279; fixed-share denominator/origin table."
		},
		"KZ-FR-028": {
			kanz: "Printed page 153; local PDF page 24.",
			khulasa: "Printed pages 281–283; awl statement and eight worked tables."
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
		const comparisonId = rule.sourceComparisonId ?? sourceComparisonId(rule.parentResearchRuleId);
		const locators = LOCATORS[rule.parentResearchRuleId];
		const { additionalSourceReferences = [], ...definition } = rule;
		return defineProductionRule({
			...definition,
			lifecycleStatus: "PRODUCTION",
			executable: true,
			sourceReferences: [
				{
					sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
					evidenceRecordId: rule.parentResearchRuleId,
					locator: locators.kanz
				},
				{
					sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
					evidenceRecordId: comparisonId,
					locator: locators.khulasa
				},
				...additionalSourceReferences
			],
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
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-005-ONE-FULL-SISTER-ONE-HALF",
			parentResearchRuleId: "KZ-FR-005",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Exactly one full sister is present without a full brother, ascendant, or descendant."],
			exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
			priority: {
				value: 60,
				rationale: "Blockers and residuary conversion are resolved first."
			},
			interactionsOrBlockers: ["A descendant or full brother excludes this fixed-share atom."],
			outcomeSpecification: "The full sister receives 1/2.",
			executionSpecification: {
				heirCategory: "FULL_SISTER",
				fixedShare: {
					numerator: "1",
					denominator: "2"
				}
			},
			fixtureIds: ["KZ-FR-005-ONE-FULL-SISTER-ONE-HALF-POS", "KZ-FR-005-ONE-FULL-SISTER-ONE-HALF-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF",
			parentResearchRuleId: "KZ-FR-005",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Exactly one paternal sister is present without a full sibling, paternal brother, ascendant, or descendant."],
			exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
			priority: {
				value: 60,
				rationale: "Nearer sibling priority and blockers are resolved first."
			},
			interactionsOrBlockers: ["A full sibling or paternal brother excludes this atom."],
			outcomeSpecification: "The paternal sister receives 1/2.",
			executionSpecification: {
				heirCategory: "PATERNAL_SISTER",
				fixedShare: {
					numerator: "1",
					denominator: "2"
				}
			},
			fixtureIds: ["KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF-POS", "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF",
			parentResearchRuleId: "KZ-FR-005",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Exactly one son's daughter is present without a direct child or son's son."],
			exclusions: ["Deeper generations and residuary conversion are excluded."],
			priority: {
				value: 60,
				rationale: "Descendant exclusions are resolved first."
			},
			interactionsOrBlockers: ["No direct child or son's son may be present."],
			outcomeSpecification: "The son's daughter receives 1/2.",
			executionSpecification: {
				heirCategory: "SONS_DAUGHTER",
				fixedShare: {
					numerator: "1",
					denominator: "2"
				}
			},
			fixtureIds: ["KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF-POS", "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF-NEG"]
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
			ruleId: "KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS",
			parentResearchRuleId: "KZ-FR-008",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Two or more full sisters are present without a full brother, ascendant, or descendant."],
			exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
			priority: {
				value: 60,
				rationale: "Blockers and residuary conversion are resolved first."
			},
			interactionsOrBlockers: ["A descendant or full brother excludes this fixed-share atom."],
			outcomeSpecification: "The full sisters receive 2/3 collectively.",
			executionSpecification: {
				heirCategory: "FULL_SISTER",
				fixedShare: {
					numerator: "2",
					denominator: "3"
				}
			},
			fixtureIds: ["KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS-POS", "KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS",
			parentResearchRuleId: "KZ-FR-008",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Two or more paternal sisters are present without a full sibling, paternal brother, ascendant, or descendant."],
			exclusions: ["Asabah ma‘a al-ghayr and grandfather-with-siblings are excluded."],
			priority: {
				value: 60,
				rationale: "Nearer sibling priority and blockers are resolved first."
			},
			interactionsOrBlockers: ["A full sibling or paternal brother excludes this atom."],
			outcomeSpecification: "The paternal sisters receive 2/3 collectively.",
			executionSpecification: {
				heirCategory: "PATERNAL_SISTER",
				fixedShare: {
					numerator: "2",
					denominator: "3"
				}
			},
			fixtureIds: ["KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS-POS", "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS",
			parentResearchRuleId: "KZ-FR-008",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Two or more son's daughters are present without a direct child or son's son."],
			exclusions: ["Deeper generations and residuary conversion are excluded."],
			priority: {
				value: 60,
				rationale: "Descendant exclusions are resolved first."
			},
			interactionsOrBlockers: ["No direct child or son's son may be present."],
			outcomeSpecification: "The son's daughters receive 2/3 collectively.",
			executionSpecification: {
				heirCategory: "SONS_DAUGHTER",
				fixedShare: {
					numerator: "2",
					denominator: "3"
				}
			},
			fixtureIds: ["KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS-POS", "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS-NEG"]
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
			ruleId: "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD",
			parentResearchRuleId: "KZ-FR-009",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Two or more uterine siblings of one represented category are present without a father, paternal grandfather, child, or son's descendant."],
			exclusions: ["Mixed male/female division and Mushtaraka are excluded."],
			priority: {
				value: 60,
				rationale: "Total exclusions and special cases are resolved first."
			},
			interactionsOrBlockers: ["The same-category collective share divides equally."],
			outcomeSpecification: "The uterine-sibling group receives 1/3 collectively.",
			executionSpecification: {
				heirCategory: "UTERINE_SIBLING_GROUP",
				fixedShare: {
					numerator: "1",
					denominator: "3"
				}
			},
			fixtureIds: ["KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD-POS", "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD-NEG"]
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
			ruleId: "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS",
			parentResearchRuleId: "KZ-FR-010",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-KZ-FR-010-MOTHER-SIBLINGS-UNBLOCKED-SUBSET",
			atomicRuleKind: "PARENT_FIXED_SHARE",
			conditions: ["The mother and at least two siblings are present.", "Every counted sibling is unblocked in the admitted case."],
			exclusions: ["Any case requiring a decision about whether blocked siblings count is excluded."],
			priority: {
				value: 50,
				rationale: "The sibling-triggered 1/6 replaces the ordinary 1/3."
			},
			interactionsOrBlockers: ["Whole-case coverage rejects blocked-sibling counting before this atom executes."],
			outcomeSpecification: "The mother receives 1/6.",
			executionSpecification: {
				heirCategory: "MOTHER",
				minimumUnblockedSiblingCount: "2",
				fixedShare: {
					numerator: "1",
					denominator: "6"
				}
			},
			fixtureIds: ["KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS-POS", "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH",
			parentResearchRuleId: "KZ-FR-010",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Exactly one full sister and one paternal sister are present without an ascendant, descendant, or brother of either class."],
			exclusions: ["Plural paternal sisters and residuary conversion are excluded."],
			priority: {
				value: 65,
				rationale: "Apply after the full sister's 1/2."
			},
			interactionsOrBlockers: ["The share completes 2/3."],
			outcomeSpecification: "The paternal sister receives 1/6.",
			executionSpecification: {
				heirCategory: "PATERNAL_SISTER",
				fixedShare: {
					numerator: "1",
					denominator: "6"
				}
			},
			fixtureIds: ["KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH-POS", "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH",
			parentResearchRuleId: "KZ-FR-010",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Exactly one direct daughter and one son's daughter are present without a son or son's son."],
			exclusions: ["Plural and residuary-conversion variants are excluded."],
			priority: {
				value: 65,
				rationale: "Apply after the direct daughter's 1/2."
			},
			interactionsOrBlockers: ["The share completes 2/3."],
			outcomeSpecification: "The son's daughter receives 1/6.",
			executionSpecification: {
				heirCategory: "SONS_DAUGHTER",
				fixedShare: {
					numerator: "1",
					denominator: "6"
				}
			},
			fixtureIds: ["KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH-POS", "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH-NEG"]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH",
			parentResearchRuleId: "KZ-FR-010",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-EXTENDED-ORDINARY-FIXED-SHARES",
			atomicRuleKind: "EXTENDED_FIXED_SHARE",
			conditions: ["Exactly one uterine sibling is present without a father, paternal grandfather, child, or son's descendant."],
			exclusions: ["Plural groups and Mushtaraka are excluded."],
			priority: {
				value: 60,
				rationale: "Total exclusions and special cases are resolved first."
			},
			interactionsOrBlockers: ["Named ascendants and descendants exclude this share."],
			outcomeSpecification: "The uterine sibling receives 1/6.",
			executionSpecification: {
				heirCategory: "UTERINE_SIBLING",
				fixedShare: {
					numerator: "1",
					denominator: "6"
				}
			},
			fixtureIds: ["KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH-POS", "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH-NEG"]
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
			ruleId: "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER",
			parentResearchRuleId: "KZ-FR-015",
			sourceComparisonId: "SOURCE-COMPARISON-20260809-KZ-FR-015-MULTIPLE-WIVES-UMARIYYATAYN",
			additionalSourceReferences: [{
				sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
				evidenceRecordId: "SOURCE-COMPARISON-20260803-KZ-FR-006-WIVES-ONE-QUARTER",
				locator: "Printed pages 271–272; admitted collective wife-group quarter for counts 1 through 4."
			}],
			atomicRuleKind: "UMARIYYATAYN",
			conditions: ["The complete supported heir set is two, three, or four eligible wives, mother, and father.", "No descendant or other heir is present."],
			exclusions: ["One wife uses the singular-wife atom.", "Invalid wife counts are excluded."],
			priority: {
				value: 20,
				rationale: "The named case precedes ordinary parent rules."
			},
			interactionsOrBlockers: ["Apply the admitted collective wives' quarter, then give the mother one third of the remainder."],
			outcomeSpecification: "Wives collectively receive 1/4, mother receives 1/4, and father receives 1/2.",
			executionSpecification: {
				originalAsl: "4",
				wifeCountMinimum: "2",
				wifeCountMaximum: "4",
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
			fixtureIds: [
				"KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-POS-TWO-WIVES",
				"KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-POS-FOUR-WIVES",
				"KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-NEG-ONE-WIFE",
				"KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER-NEG-ADDITIONAL-HEIR"
			]
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
			ruleId: "KZ-FR-027-ORIGINAL-ASL",
			parentResearchRuleId: "KZ-FR-027",
			atomicRuleKind: "CASE_ORIGIN",
			conditions: ["All admitted fixed shares for the case have already been assigned.", "Their denominators produce one of the seven source-listed origins."],
			exclusions: ["This atom does not decide heir eligibility or shares.", "Floating-point and rounded-decimal arithmetic are excluded."],
			priority: {
				value: 150,
				rationale: "Derive أصل المسألة before awl or tashih."
			},
			interactionsOrBlockers: ["Use exact least-common-multiple arithmetic over fixed-share denominators."],
			outcomeSpecification: "Return the exact original case denominator.",
			executionSpecification: {
				arithmetic: "BIGINT_ONLY",
				operation: "LCM_OF_FIXED_SHARE_DENOMINATORS",
				allowedFixedShareOrigins: [
					"2",
					"3",
					"4",
					"6",
					"8",
					"12",
					"24"
				],
				noFixedShareIdentity: "1"
			},
			fixtureIds: [
				"KZ-FR-027-ORIGINAL-ASL-SOURCE-SEVEN-ORIGINS",
				"KZ-FR-027-ORIGINAL-ASL-POS-LCM-SIX",
				"KZ-FR-027-ORIGINAL-ASL-POS-LCM-TWENTY-FOUR",
				"KZ-FR-027-ORIGINAL-ASL-NEG-UNLISTED-FIVE"
			]
		}),
		defineDirectFamilyProductionRule({
			ruleId: "KZ-FR-028-AWL-ADJUSTMENT",
			parentResearchRuleId: "KZ-FR-028",
			atomicRuleKind: "AWL_ADJUSTMENT",
			conditions: [
				"The exact original asl is 6, 12, or 24.",
				"The admitted fixed-share saham exceed the original asl.",
				"The resulting endpoint is one of the eight source-corroborated pairs."
			],
			exclusions: [
				"This atom does not decide eligibility or fixed shares.",
				"Unlisted origins and endpoints are rejected.",
				"Floating-point and rounded-decimal arithmetic are excluded."
			],
			priority: {
				value: 160,
				rationale: "Apply after original-asl derivation and before tashih."
			},
			interactionsOrBlockers: ["Preserve every original integer saham and replace the denominator by their exact sum.", "No positive residue remains after awl."],
			outcomeSpecification: "Adjust every fixed share exactly by the source-enumerated awl denominator.",
			executionSpecification: {
				arithmetic: "BIGINT_ONLY",
				operation: "PRESERVE_SAHAM_REPLACE_DENOMINATOR_WITH_SAHAM_SUM",
				allowedEndpoints: {
					"6": [
						"7",
						"8",
						"9",
						"10"
					],
					"12": [
						"13",
						"15",
						"17"
					],
					"24": ["27"]
				}
			},
			fixtureIds: [
				"KZ-FR-028-AWL-ADJUSTMENT-SOURCE-6-TO-7",
				"KZ-FR-028-AWL-ADJUSTMENT-SOURCE-6-TO-8",
				"KZ-FR-028-AWL-ADJUSTMENT-SOURCE-6-TO-9",
				"KZ-FR-028-AWL-ADJUSTMENT-SOURCE-6-TO-10",
				"KZ-FR-028-AWL-ADJUSTMENT-SOURCE-12-TO-13",
				"KZ-FR-028-AWL-ADJUSTMENT-SOURCE-12-TO-15",
				"KZ-FR-028-AWL-ADJUSTMENT-SOURCE-12-TO-17",
				"KZ-FR-028-AWL-ADJUSTMENT-SOURCE-24-TO-27",
				"KZ-FR-028-AWL-ADJUSTMENT-NEG-NO-EXCESS",
				"KZ-FR-028-AWL-ADJUSTMENT-NEG-UNLISTED-ENDPOINT"
			]
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
	var ADMITTED_EXTENDED_FIXED_SHARE_TYPES = /* @__PURE__ */ new Set([
		"SONS_DAUGHTER",
		"MATERNAL_BROTHER",
		"MATERNAL_SISTER",
		"FULL_SISTER",
		"PATERNAL_SISTER"
	]);
	var SIBLING_TYPES = /* @__PURE__ */ new Set([
		"FULL_BROTHER",
		"FULL_SISTER",
		"PATERNAL_BROTHER",
		"PATERNAL_SISTER",
		"MATERNAL_BROTHER",
		"MATERNAL_SISTER"
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
		const selectedCount = (type) => normalizedHeirs.find((heir) => heir.type === type)?.count ?? 0;
		if (selectedCount("HUSBAND") > 1) invalidFields.push("heirs.HUSBAND");
		if (selectedCount("WIFE") > 4) invalidFields.push("heirs.WIFE");
		if (selectedCount("FATHER") > 1) invalidFields.push("heirs.FATHER");
		if (selectedCount("MOTHER") > 1) invalidFields.push("heirs.MOTHER");
		if (selectedCount("HUSBAND") > 0 && selectedCount("WIFE") > 0) invalidFields.push("heirs.spouse");
		if (input.deceasedSex === "MALE" && selectedCount("HUSBAND") > 0) invalidFields.push("heirs.HUSBAND");
		if (input.deceasedSex === "FEMALE" && selectedCount("WIFE") > 0) invalidFields.push("heirs.WIFE");
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
		const siblingCount = [...SIBLING_TYPES].reduce((total, type) => total + selectedCount(type), 0);
		const hasGrandfather = selectedCount("PATERNAL_GRANDFATHER") > 0;
		const hasFullOrPaternalSibling = selectedCount("FULL_BROTHER") + selectedCount("FULL_SISTER") + selectedCount("PATERNAL_BROTHER") + selectedCount("PATERNAL_SISTER") > 0;
		if (hasGrandfather && hasFullOrPaternalSibling) {
			const isAkdariyya = selectedCount("HUSBAND") > 0 && selectedCount("MOTHER") > 0 && selectedCount("FULL_SISTER") + selectedCount("PATERNAL_SISTER") > 0;
			const isMuadda = selectedCount("FULL_BROTHER") + selectedCount("FULL_SISTER") > 0 && selectedCount("PATERNAL_BROTHER") + selectedCount("PATERNAL_SISTER") > 0;
			return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				reasons: [
					...isAkdariyya ? ["AKDARIYYA_NOT_ADMITTED"] : [],
					...isMuadda ? ["MUADDA_NOT_ADMITTED"] : [],
					"GRANDFATHER_WITH_SIBLINGS_NOT_ADMITTED"
				]
			});
		}
		const selectedUterineCount = selectedCount("MATERNAL_BROTHER") + selectedCount("MATERNAL_SISTER");
		if (selectedCount("HUSBAND") > 0 && selectedCount("MOTHER") + selectedCount("MATERNAL_GRANDMOTHER") > 0 && selectedUterineCount >= 2 && selectedCount("FULL_BROTHER") > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			reasons: ["MUSHTARAKA_NOT_ADMITTED"]
		});
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
			const blockedCount = selectedCount(type);
			return selectedCount(blockerType) > 0 && blockedCount > 0 && productionIds.has(ruleId) ? [{
				type,
				count: blockedCount,
				blockerType,
				ruleId,
				reason: `${type} is totally excluded by ${blockerType}.`
			}] : [];
		});
		const blockedTypes = new Set(blockedHeirs.map((heir) => heir.type));
		if (selectedCount("MOTHER") > 0 && siblingCount >= 2 && blockedHeirs.some((heir) => SIBLING_TYPES.has(heir.type))) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			blockedHeirs,
			reasons: ["MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED"]
		});
		const supportedTypes = /* @__PURE__ */ new Set([...DIRECT_FAMILY_TYPES, ...ADMITTED_EXTENDED_FIXED_SHARE_TYPES]);
		const unsupportedHeirs = normalizedHeirs.filter((heir) => !supportedTypes.has(heir.type) && !blockedTypes.has(heir.type)).map(({ type, count: heirCount }) => ({
			type,
			count: heirCount
		}));
		if (unsupportedHeirs.length > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			unsupportedHeirs,
			blockedHeirs,
			reasons: unsupportedHeirs.map((heir) => heir.type === "SONS_SON" ? "SONS_SON_POSITIVE_SHARE_NOT_ADMITTED" : heir.type === "PATERNAL_GRANDMOTHER" || heir.type === "MATERNAL_GRANDMOTHER" ? `GRANDMOTHER_HIERARCHY_NOT_ADMITTED:${heir.type}` : `UNSUPPORTED_HEIR_CATEGORY:${heir.type}`)
		});
		const eligibleHeirs = normalizedHeirs.filter((heir) => !blockedTypes.has(heir.type));
		const count = (type) => eligibleHeirs.find((heir) => heir.type === type)?.count ?? 0;
		const hasDescendant = count("SON") + count("DAUGHTER") + count("SONS_SON") + count("SONS_DAUGHTER") > 0;
		const hasFemaleDescendant = count("DAUGHTER") + count("SONS_DAUGHTER") > 0;
		const uterineCount = count("MATERNAL_BROTHER") + count("MATERNAL_SISTER");
		const interactionReasons = [];
		if (count("SONS_DAUGHTER") > 0) {
			if (count("SON") > 0) interactionReasons.push("SON_BLOCKS_SONS_DAUGHTER_RULE_NOT_ADMITTED");
			if (count("SONS_SON") > 0) interactionReasons.push("SONS_DESCENDANT_RESIDUARY_MODE_NOT_ADMITTED");
			if (count("DAUGHTER") >= 2) interactionReasons.push("DAUGHTERS_BLOCK_SONS_DAUGHTER_RULE_NOT_ADMITTED");
			if (count("DAUGHTER") === 1 && count("SONS_DAUGHTER") > 1) interactionReasons.push("PLURAL_SONS_DAUGHTER_COMPLEMENT_NOT_ADMITTED");
		}
		if (uterineCount > 0) {
			if (hasDescendant || count("FATHER") > 0 || hasGrandfather) interactionReasons.push("UTERINE_SIBLING_BLOCKER_RELATIONSHIP_NOT_ADMITTED_FOR_SELECTED_CLASS");
			if (count("MATERNAL_BROTHER") > 0 && count("MATERNAL_SISTER") > 0) interactionReasons.push("MIXED_UTERINE_SIBLING_DIVISION_NOT_ADMITTED");
		}
		if (count("FULL_SISTER") + count("PATERNAL_SISTER") > 0 && (hasDescendant || count("FATHER") > 0 || hasGrandfather)) interactionReasons.push("SISTER_RESIDUARY_OR_BLOCKING_INTERACTION_NOT_ADMITTED");
		if (count("FULL_SISTER") > 0 && count("FULL_BROTHER") > 0) interactionReasons.push("FULL_SIBLING_RESIDUARY_MODE_NOT_ADMITTED");
		if (count("PATERNAL_SISTER") > 0 && count("PATERNAL_BROTHER") > 0) interactionReasons.push("PATERNAL_SIBLING_RESIDUARY_MODE_NOT_ADMITTED");
		if (count("FULL_SISTER") > 0 && count("PATERNAL_SISTER") > 0) {
			if (count("FULL_SISTER") !== 1 || count("PATERNAL_SISTER") !== 1) interactionReasons.push("FULL_PATERNAL_SISTER_PRIORITY_NOT_ADMITTED_FOR_THIS_PLURALITY");
		} else if (count("PATERNAL_SISTER") > 0 && (count("FULL_BROTHER") > 0 || count("PATERNAL_BROTHER") > 0)) interactionReasons.push("PATERNAL_SISTER_PRIORITY_NOT_ADMITTED");
		if (interactionReasons.length > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			blockedHeirs,
			reasons: [...new Set(interactionReasons)]
		});
		const hasSon = count("SON") > 0;
		const hasDaughter = hasFemaleDescendant;
		const activeTypes = eligibleHeirs.map((heir) => heir.type);
		const exactly = (...types) => activeTypes.length === types.length && types.every((type) => activeTypes.includes(type));
		const husbandUmari = exactly("HUSBAND", "MOTHER", "FATHER");
		const wifeUmari = exactly("WIFE", "MOTHER", "FATHER");
		const multipleWifeUmari = wifeUmari && count("WIFE") > 1;
		const requiredRuleIds = blockedHeirs.map((heir) => heir.ruleId);
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
			requiredRuleIds.push(husbandUmari ? "KZ-FR-015-HUSBAND-MOTHER-FATHER" : multipleWifeUmari ? "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER" : "KZ-FR-015-WIFE-MOTHER-FATHER");
			fixedShares.push(husbandUmari ? new Fraction(1n, 6n) : new Fraction(1n, 4n));
			fixedShares.push(husbandUmari ? new Fraction(1n, 3n) : new Fraction(1n, 2n));
		} else {
			if (count("MOTHER") > 0) {
				const siblingTriggered = !hasDescendant && siblingCount >= 2;
				requiredRuleIds.push(hasDescendant ? "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT" : siblingTriggered ? "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS" : "KZ-FR-009-MOTHER-ONE-THIRD");
				fixedShares.push(hasDescendant || siblingTriggered ? new Fraction(1n, 6n) : new Fraction(1n, 3n));
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
			if (count("SONS_DAUGHTER") === 1 && count("DAUGHTER") === 0) {
				requiredRuleIds.push("KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF");
				fixedShares.push(new Fraction(1n, 2n));
			} else if (count("SONS_DAUGHTER") >= 2 && count("DAUGHTER") === 0) {
				requiredRuleIds.push("KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS");
				fixedShares.push(new Fraction(2n, 3n));
			} else if (count("SONS_DAUGHTER") === 1 && count("DAUGHTER") === 1) {
				requiredRuleIds.push("KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			}
			if (uterineCount === 1) {
				requiredRuleIds.push("KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			} else if (uterineCount >= 2) {
				requiredRuleIds.push("KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD");
				fixedShares.push(new Fraction(1n, 3n));
			}
			if (count("FULL_SISTER") === 1) {
				requiredRuleIds.push("KZ-FR-005-ONE-FULL-SISTER-ONE-HALF");
				fixedShares.push(new Fraction(1n, 2n));
			} else if (count("FULL_SISTER") >= 2) {
				requiredRuleIds.push("KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS");
				fixedShares.push(new Fraction(2n, 3n));
			}
			if (count("PATERNAL_SISTER") > 0 && count("FULL_SISTER") === 0) {
				requiredRuleIds.push(count("PATERNAL_SISTER") === 1 ? "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF" : "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS");
				fixedShares.push(count("PATERNAL_SISTER") === 1 ? new Fraction(1n, 2n) : new Fraction(2n, 3n));
			} else if (count("PATERNAL_SISTER") === 1 && count("FULL_SISTER") === 1) {
				requiredRuleIds.push("KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			}
		}
		requiredRuleIds.push(ORIGINAL_ASL_RULE_ID);
		const originalAsl = deriveOriginalAsl(fixedShares);
		if (!productionIds.has("KZ-FR-027-ORIGINAL-ASL") || !isOriginalAslAdmitted(originalAsl, corpus.rules)) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			blockedHeirs,
			requiredRuleIds: [...new Set(requiredRuleIds)],
			reasons: [`RULE_NOT_ADMITTED:${ORIGINAL_ASL_RULE_ID}`]
		});
		const fixedTotal = sumFractions(fixedShares);
		if (fixedTotal.compare(Fraction.ONE) > 0) {
			requiredRuleIds.push(AWL_RULE_ID);
			const awlDenominator = deriveAwlDenominator(fixedShares, originalAsl);
			if (awlDenominator === null || !productionIds.has("KZ-FR-028-AWL-ADJUSTMENT") || !isAwlEndpointAdmitted(originalAsl, awlDenominator, corpus.rules)) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				blockedHeirs,
				requiredRuleIds: [...new Set(requiredRuleIds)],
				reasons: [awlDenominator === null ? "AWL_ENDPOINT_INVALID" : `AWL_ENDPOINT_NOT_ADMITTED:${originalAsl}->${awlDenominator}`],
				requiresAwl: true
			});
		}
		if (!hasResiduary && fixedTotal.compare(Fraction.ONE) < 0) {
			if (input.remainderPolicy === null) return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
				...base,
				blockedHeirs,
				requiredRuleIds,
				missingFields: ["remainderPolicy"],
				reasons: ["REMAINDER_POLICY_MISSING"]
			});
			if (input.remainderPolicy === "UNSURE") return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				blockedHeirs,
				requiredRuleIds,
				reasons: ["REMAINDER_POLICY_UNRESOLVED"]
			});
			if (input.remainderPolicy === "NO_FUNCTIONING_BAYT_AL_MAL_RADD" && [
				"MOTHER",
				"DAUGHTER",
				"SONS_DAUGHTER",
				"MATERNAL_BROTHER",
				"MATERNAL_SISTER",
				"FULL_SISTER",
				"PATERNAL_SISTER"
			].every((type) => count(type) === 0)) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				blockedHeirs,
				requiredRuleIds,
				reasons: ["RADD_HAS_NO_ELIGIBLE_NON_SPOUSE_RECIPIENT"]
			});
			requiredRuleIds.push(input.remainderPolicy === "FUNCTIONING_BAYT_AL_MAL" ? "KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE" : "KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD");
		}
		const missingRuleIds = [...new Set(requiredRuleIds)].filter((id) => !productionIds.has(id));
		if (missingRuleIds.length > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			blockedHeirs,
			requiredRuleIds: [...new Set(requiredRuleIds)],
			reasons: missingRuleIds.map((id) => `RULE_NOT_ADMITTED:${id}`)
		});
		return wholeCaseResult("SUPPORTED", normalizedHeirs, {
			...base,
			blockedHeirs,
			requiredRuleIds: [...new Set(requiredRuleIds)],
			supportedRuleIds: [...new Set(requiredRuleIds)],
			requiresAwl: fixedTotal.compare(Fraction.ONE) > 0
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
		if (ruleId.includes("MOTHER-ONE-SIXTH-SIBLINGS")) return "At least two unblocked siblings are present in this admitted subset.";
		if (ruleId.includes("MOTHER-ONE-SIXTH")) return "A qualifying descendant exists.";
		if (ruleId.includes("MOTHER-ONE-THIRD")) return "No qualifying descendant or admitted sibling condition applies.";
		if (ruleId.includes("ONE-DAUGHTER")) return "One daughter is present and no son is present.";
		if (ruleId.includes("DAUGHTER-GROUP")) return "Two or more daughters are present and no son is present.";
		if (ruleId.includes("FATHER-ONE-SIXTH-PLUS")) return "Female descendants are present without a male descendant.";
		if (ruleId.includes("FATHER-ONE-SIXTH")) return "A qualifying male descendant is present.";
		if (ruleId.includes("SONS-DAUGHTER") && ruleId.includes("ONE-SIXTH")) return "One direct daughter is present, so the son's daughter receives the complementary 1/6.";
		if (ruleId.includes("SONS-DAUGHTER")) return "The admitted son's-daughter fixed-share conditions are satisfied.";
		if (ruleId.includes("UTERINE-SIBLING")) return "No admitted ascendant or descendant blocker is present.";
		if (ruleId.includes("FULL-SISTER") || ruleId.includes("PATERNAL-SISTER")) return "The fixed-share sister conditions are satisfied without a converting residuary or blocker.";
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
		const blockedTypes = new Set(coverage.blockedHeirs.map((heir) => heir.type));
		const eligible = selected.filter((heir) => !blockedTypes.has(heir.type));
		const count = (type) => eligible.find((heir) => heir.type === type)?.count ?? 0;
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
		const wifeUmariRuleId = required.has("KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER") ? "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER" : required.has("KZ-FR-015-WIFE-MOTHER-FATHER") ? "KZ-FR-015-WIFE-MOTHER-FATHER" : null;
		const wifeUmari = wifeUmariRuleId !== null;
		if (husbandUmari) {
			addFixed("HUSBAND", new Fraction(1n, 2n), "KZ-FR-005-HUSBAND-ONE-HALF");
			addFixed("MOTHER", new Fraction(1n, 6n), "KZ-FR-015-HUSBAND-MOTHER-FATHER");
			addFixed("FATHER", new Fraction(1n, 3n), "KZ-FR-015-HUSBAND-MOTHER-FATHER");
		} else if (wifeUmari) {
			addFixed("WIFE", new Fraction(1n, 4n), "KZ-FR-006-WIVES-ONE-QUARTER");
			addFixed("MOTHER", new Fraction(1n, 4n), wifeUmariRuleId);
			addFixed("FATHER", new Fraction(1n, 2n), wifeUmariRuleId);
		} else {
			for (const [type, rules] of [["HUSBAND", ["KZ-FR-005-HUSBAND-ONE-HALF", "KZ-FR-006-HUSBAND-ONE-QUARTER"]], ["WIFE", ["KZ-FR-006-WIVES-ONE-QUARTER", "KZ-FR-007-WIVES-ONE-EIGHTH"]]]) {
				const ruleId = rules.find((id) => required.has(id));
				if (ruleId !== void 0) addFixed(type, ruleId.includes("ONE-HALF") ? new Fraction(1n, 2n) : ruleId.includes("ONE-EIGHTH") ? new Fraction(1n, 8n) : new Fraction(1n, 4n), ruleId);
			}
			if (required.has("KZ-FR-009-MOTHER-ONE-THIRD")) addFixed("MOTHER", new Fraction(1n, 3n), "KZ-FR-009-MOTHER-ONE-THIRD");
			if (required.has("KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT")) addFixed("MOTHER", new Fraction(1n, 6n), "KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT");
			if (required.has("KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS")) addFixed("MOTHER", new Fraction(1n, 6n), "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS");
			if (required.has("KZ-FR-012-ONE-DAUGHTER-ONE-HALF")) addFixed("DAUGHTER", new Fraction(1n, 2n), "KZ-FR-012-ONE-DAUGHTER-ONE-HALF");
			if (required.has("KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS")) addFixed("DAUGHTER", new Fraction(2n, 3n), "KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS");
			if (required.has("KZ-FR-014-FATHER-ONE-SIXTH")) addFixed("FATHER", new Fraction(1n, 6n), "KZ-FR-014-FATHER-ONE-SIXTH");
			if (required.has("KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE")) addFixed("FATHER", new Fraction(1n, 6n), "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE");
			for (const [type, ruleId, share] of [
				[
					"SONS_DAUGHTER",
					"KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF",
					new Fraction(1n, 2n)
				],
				[
					"SONS_DAUGHTER",
					"KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS",
					new Fraction(2n, 3n)
				],
				[
					"SONS_DAUGHTER",
					"KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH",
					new Fraction(1n, 6n)
				],
				[
					"FULL_SISTER",
					"KZ-FR-005-ONE-FULL-SISTER-ONE-HALF",
					new Fraction(1n, 2n)
				],
				[
					"FULL_SISTER",
					"KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS",
					new Fraction(2n, 3n)
				],
				[
					"PATERNAL_SISTER",
					"KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF",
					new Fraction(1n, 2n)
				],
				[
					"PATERNAL_SISTER",
					"KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS",
					new Fraction(2n, 3n)
				],
				[
					"PATERNAL_SISTER",
					"KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH",
					new Fraction(1n, 6n)
				]
			]) if (required.has(ruleId)) addFixed(type, share, ruleId);
			const uterineRuleId = required.has("KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH") ? "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH" : required.has("KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD") ? "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD" : null;
			if (uterineRuleId !== null) addFixed(count("MATERNAL_BROTHER") > 0 ? "MATERNAL_BROTHER" : "MATERNAL_SISTER", uterineRuleId.includes("ONE-SIXTH") ? new Fraction(1n, 6n) : new Fraction(1n, 3n), uterineRuleId);
		}
		const originalFixedTotal = sumFractions([...assignments.values()].map((assignment) => assignment.fraction));
		const originalFixedAssignments = [...assignments.values()].map((assignment) => ({
			assignment,
			originalFraction: assignment.fraction
		}));
		const originalAsl = deriveOriginalAsl(originalFixedAssignments.map(({ originalFraction }) => originalFraction));
		if (!isOriginalAslAdmitted(originalAsl, PRODUCTION_RULES)) throw new UnsupportedInheritanceCaseError(coverage, [`RULE_NOT_ADMITTED:${ORIGINAL_ASL_RULE_ID}`]);
		let awlDetails = null;
		const awlDenominator = deriveAwlDenominator(originalFixedAssignments.map(({ originalFraction }) => originalFraction), originalAsl);
		if (awlDenominator !== null) {
			if (!isAwlEndpointAdmitted(originalAsl, awlDenominator, PRODUCTION_RULES)) throw new UnsupportedInheritanceCaseError(coverage, [`AWL_ENDPOINT_NOT_ADMITTED:${originalAsl}->${awlDenominator}`]);
			const adjustments = originalFixedAssignments.map(({ assignment, originalFraction }) => {
				const saham = originalSaham(originalFraction, originalAsl);
				const adjustedFraction = new Fraction(saham, awlDenominator);
				assignment.fraction = adjustedFraction;
				return {
					heirType: assignment.heirType,
					originalFraction: originalFraction.toJSON(),
					originalSaham: saham.toString(),
					adjustedFraction: adjustedFraction.toJSON()
				};
			});
			awlDetails = {
				originalAsl: originalAsl.toString(),
				adjustedDenominator: awlDenominator.toString(),
				originalFixedShareTotal: originalFixedTotal.toJSON(),
				adjustments,
				ruleId: AWL_RULE_ID
			};
		}
		const adjustedFixedTotal = sumFractions([...assignments.values()].map((assignment) => assignment.fraction));
		const residue = Fraction.ONE.subtract(adjustedFixedTotal);
		const addResidue = (type, ruleId) => {
			addAssignment(assignments, type, count(type), residue, "RESIDUARY", ruleId);
			residuaryAssignments.push({
				heirType: type,
				fraction: residue.toJSON(),
				ruleId,
				reason: "This class receives the residue after fixed shares."
			});
		};
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-012-SON-GROUP-RESIDUARY")) addResidue("SON", "KZ-FR-012-SON-GROUP-RESIDUARY");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE")) {
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
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-014-FATHER-RESIDUARY")) addResidue("FATHER", "KZ-FR-014-FATHER-RESIDUARY");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE")) addResidue("FATHER", "KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE");
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
				summary: coverage.blockedHeirs.length === 0 ? "No selected heir is blocked in this supported case." : coverage.blockedHeirs.map((heir) => heir.reason).join(" "),
				ruleIds: coverage.blockedHeirs.map((heir) => heir.ruleId),
				sourceReferences: ruleSources(coverage.blockedHeirs.map((heir) => heir.ruleId))
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
			{
				kind: "ASL",
				title: `أصل المسألة — ${originalAsl}`,
				summary: `The exact common case base is ${originalAsl}.`,
				ruleIds: [ORIGINAL_ASL_RULE_ID],
				sourceReferences: ruleSources([ORIGINAL_ASL_RULE_ID])
			},
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
		if (awlDetails !== null) explanationSteps.push({
			kind: "AWL",
			title: `العول — ${awlDetails.originalAsl} → ${awlDetails.adjustedDenominator}`,
			summary: `The original saham total ${awlDetails.adjustedDenominator}, so the denominator changes from ${awlDetails.originalAsl} to ${awlDetails.adjustedDenominator}: ${awlDetails.adjustments.map((adjustment) => `${adjustment.heirType} ${adjustment.originalFraction.numerator}/${adjustment.originalFraction.denominator} → ${adjustment.adjustedFraction.numerator}/${adjustment.adjustedFraction.denominator}`).join("; ")}.`,
			ruleIds: [awlDetails.ruleId],
			sourceReferences: ruleSources([awlDetails.ruleId])
		});
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
			eligibleHeirs: eligible,
			blockedHeirs: coverage.blockedHeirs,
			fixedShareAssignments,
			residuaryAssignments,
			originalAsl: originalAsl.toString(),
			aslStatus: "ADMITTED",
			workingDenominator: correction.workingDenominator.toString(),
			correctedDenominator: correction.correctedDenominator.toString(),
			awlDetails,
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