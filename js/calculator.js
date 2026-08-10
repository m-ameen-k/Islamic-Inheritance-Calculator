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
	//#region src/domain/lineage.ts
	var SON_LINE_TYPES = /* @__PURE__ */ new Set(["SONS_SON", "SONS_DAUGHTER"]);
	var GRANDMOTHER_TYPES = /* @__PURE__ */ new Set(["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"]);
	var legacyLineage = (type) => {
		if (type === "SONS_SON") return {
			kind: "SON_LINE_DESCENDANT",
			path: ["SON", "SON"]
		};
		if (type === "SONS_DAUGHTER") return {
			kind: "SON_LINE_DESCENDANT",
			path: ["SON", "DAUGHTER"]
		};
		if (type === "MATERNAL_GRANDMOTHER") return {
			kind: "GRANDMOTHER",
			path: ["MOTHER", "MOTHER"]
		};
		if (type === "PATERNAL_GRANDMOTHER") return {
			kind: "GRANDMOTHER",
			path: ["FATHER", "MOTHER"]
		};
	};
	var isSonLineStep = (value) => value === "SON" || value === "DAUGHTER";
	var isGrandmotherStep = (value) => value === "FATHER" || value === "MOTHER";
	function normalizeSonLine(type, raw) {
		if (raw === void 0) return { lineage: legacyLineage(type) };
		if (raw === null || typeof raw !== "object") return { issue: "DESCENDANT_LINEAGE_AMBIGUOUS" };
		const candidate = raw;
		if (candidate.kind !== "SON_LINE_DESCENDANT" || !Array.isArray(candidate.path)) return { issue: "DESCENDANT_LINEAGE_AMBIGUOUS" };
		const path = candidate.path;
		if (path.length < 2 || !path.every(isSonLineStep) || path.slice(0, -1).some((step) => step !== "SON") || type === "SONS_SON" && path.at(-1) !== "SON" || type === "SONS_DAUGHTER" && path.at(-1) !== "DAUGHTER") return { issue: "DESCENDANT_LINEAGE_INVALID" };
		return { lineage: {
			kind: "SON_LINE_DESCENDANT",
			path: [...path]
		} };
	}
	function normalizeGrandmother(type, raw) {
		if (raw === void 0) return { lineage: legacyLineage(type) };
		if (raw === null || typeof raw !== "object") return { issue: "GRANDMOTHER_LINEAGE_AMBIGUOUS" };
		const candidate = raw;
		if (candidate.kind !== "GRANDMOTHER" || !Array.isArray(candidate.path)) return { issue: "GRANDMOTHER_LINEAGE_AMBIGUOUS" };
		const path = candidate.path;
		const firstMother = path.indexOf("MOTHER");
		const validRoute = path.length >= 2 && path.every(isGrandmotherStep) && path.at(-1) === "MOTHER" && firstMother >= 0 && path.slice(firstMother).every((step) => step === "MOTHER");
		const expectedFirst = type === "MATERNAL_GRANDMOTHER" ? "MOTHER" : "FATHER";
		if (!validRoute || path[0] !== expectedFirst) return { issue: "GRANDMOTHER_LINEAGE_INVALID" };
		return { lineage: {
			kind: "GRANDMOTHER",
			path: [...path]
		} };
	}
	function lineageKey(heir) {
		if (heir.lineage === void 0) return heir.type;
		return `${heir.type}:${heir.lineage.path.join(">")}`;
	}
	function descendantGeneration(heir) {
		return heir.lineage?.kind === "SON_LINE_DESCENDANT" ? heir.lineage.path.length - 1 : null;
	}
	function grandmotherDegree(heir) {
		return heir.lineage?.kind === "GRANDMOTHER" ? heir.lineage.path.length : null;
	}
	function lineageDescription(heir) {
		if (heir.lineage?.kind === "SON_LINE_DESCENDANT") {
			const generation = heir.lineage.path.length - 1;
			return `${heir.type === "SONS_SON" ? "male" : "female"} son-line descendant, generation ${generation}`;
		}
		if (heir.lineage?.kind === "GRANDMOTHER") return `${heir.type === "MATERNAL_GRANDMOTHER" ? "maternal" : "paternal"} grandmother, degree ${heir.lineage.path.length}`;
		return heir.type;
	}
	/** Pure, deterministic normalization. It never infers an invalid ancestry route. */
	function normalizeLineageAwareHeirs(input) {
		const issues = [];
		const groups = /* @__PURE__ */ new Map();
		input.forEach((heir, index) => {
			let lineage;
			let issue;
			if (SON_LINE_TYPES.has(heir.type)) ({lineage, issue} = normalizeSonLine(heir.type, heir.lineage));
			else if (GRANDMOTHER_TYPES.has(heir.type)) ({lineage, issue} = normalizeGrandmother(heir.type, heir.lineage));
			else if (heir.lineage !== void 0) issue = "DESCENDANT_LINEAGE_INVALID";
			if (issue !== void 0) {
				issues.push({
					index,
					heirId: heir.heirId.trim(),
					code: issue
				});
				return;
			}
			const normalized = {
				heirId: heir.heirId.trim(),
				type: heir.type,
				count: heir.count,
				...lineage === void 0 ? {} : { lineage }
			};
			const key = lineageKey(normalized);
			const current = groups.get(key);
			groups.set(key, {
				...normalized,
				heirId: key.toLowerCase().replaceAll(">", "-"),
				count: (current?.count ?? 0) + heir.count
			});
		});
		return {
			heirs: [...groups.values()].filter(({ count }) => count > 0).sort((left, right) => lineageKey(left).localeCompare(lineageKey(right))),
			issues
		};
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
	function productionRule$110(rules, ruleId) {
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
		const rule = productionRule$110(rules, ORIGINAL_ASL_RULE_ID);
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
		const rule = productionRule$110(rules, AWL_RULE_ID);
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
	//#region src/engine/advanced-case.ts
	function normalizedCounts(heirs) {
		const counts = /* @__PURE__ */ new Map();
		for (const heir of heirs) counts.set(heir.type, (counts.get(heir.type) ?? 0) + heir.count);
		return counts;
	}
	function detectAdvancedCase(heirs) {
		const counts = normalizedCounts(heirs);
		const count = (type) => counts.get(type) ?? 0;
		const active = [...counts.entries()].filter(([, value]) => value > 0);
		const exactTypes = (...types) => active.length === types.length && types.every((type) => count(type) > 0);
		if (exactTypes("HUSBAND", "MOTHER", "PATERNAL_GRANDFATHER", "FULL_SISTER") && count("HUSBAND") === 1 && count("MOTHER") === 1 && count("PATERNAL_GRANDFATHER") === 1 && count("FULL_SISTER") === 1) return {
			kind: "AKDARIYYA",
			ruleId: "KZ-FR-023-AKDARIYYA-FULL-SISTER",
			sisterType: "FULL_SISTER"
		};
		if (exactTypes("HUSBAND", "MOTHER", "PATERNAL_GRANDFATHER", "PATERNAL_SISTER") && count("HUSBAND") === 1 && count("MOTHER") === 1 && count("PATERNAL_GRANDFATHER") === 1 && count("PATERNAL_SISTER") === 1) return {
			kind: "AKDARIYYA",
			ruleId: "KZ-FR-023-AKDARIYYA-PATERNAL-SISTER",
			sisterType: "PATERNAL_SISTER"
		};
		const selectedAscendants = [
			"MOTHER",
			"MATERNAL_GRANDMOTHER",
			"PATERNAL_GRANDMOTHER"
		].filter((type) => count(type) > 0);
		const uterineCount = count("MATERNAL_BROTHER") + count("MATERNAL_SISTER");
		if (count("HUSBAND") === 1 && selectedAscendants.length === 1 && uterineCount >= 2 && count("FULL_BROTHER") > 0) {
			if (uterineCount === 2 && count("FULL_BROTHER") === 1 && count("FULL_SISTER") === 0 && active.every(([type]) => [
				"HUSBAND",
				selectedAscendants[0],
				"MATERNAL_BROTHER",
				"MATERNAL_SISTER",
				"FULL_BROTHER"
			].includes(type))) {
				const ascendantType = selectedAscendants[0];
				if (ascendantType === void 0) throw new Error("Canonical Mushtaraka needs an ascendant.");
				return {
					kind: "MUSHTARAKA",
					ruleId: "KZ-FR-018-MUSHTARAKA-CANONICAL",
					ascendantType
				};
			}
			return {
				kind: "UNSUPPORTED_ADVANCED",
				reason: "MUSHTARAKA_VARIANT_NOT_ADMITTED"
			};
		}
		const hasGrandfather = count("PATERNAL_GRANDFATHER") === 1 && count("FATHER") === 0;
		const hasMaleDescendant = count("SON") + count("SONS_SON") > 0;
		const fullCount = count("FULL_BROTHER") + count("FULL_SISTER");
		const paternalCount = count("PATERNAL_BROTHER") + count("PATERNAL_SISTER");
		if (hasGrandfather && !hasMaleDescendant && fullCount + paternalCount > 0) {
			if (fullCount > 0 && paternalCount > 0) {
				if (count("FULL_BROTHER") > 0) return {
					kind: "MUADDA",
					muadda: true,
					mode: "FULL_MALE_LINE",
					ruleId: "KZ-FR-022-MUADDA-FULL-MALE-LINE"
				};
				if (exactTypes("PATERNAL_GRANDFATHER", "FULL_SISTER", "PATERNAL_BROTHER", "PATERNAL_SISTER") && count("PATERNAL_GRANDFATHER") === 1 && count("FULL_SISTER") === 1 && count("PATERNAL_BROTHER") === 1 && count("PATERNAL_SISTER") === 1) return {
					kind: "MUADDA",
					muadda: true,
					mode: "ONE_FULL_SISTER_WORKED_BRANCH",
					ruleId: "KZ-FR-022-MUADDA-ONE-FULL-SISTER-WORKED-BRANCH"
				};
				if (exactTypes("PATERNAL_GRANDFATHER", "FULL_SISTER", "PATERNAL_BROTHER") && count("PATERNAL_GRANDFATHER") === 1 && count("FULL_SISTER") === 2 && count("PATERNAL_BROTHER") === 1) return {
					kind: "MUADDA",
					muadda: true,
					mode: "TWO_FULL_SISTERS_WORKED_BRANCH",
					ruleId: "KZ-FR-022-MUADDA-TWO-FULL-SISTERS-WORKED-BRANCH"
				};
				return {
					kind: "UNSUPPORTED_ADVANCED",
					reason: "MUADDA_FEMALE_BRANCH_NOT_ADMITTED"
				};
			}
			return {
				kind: "GRANDFATHER_WITH_SIBLINGS",
				muadda: false
			};
		}
		return null;
	}
	//#endregion
	//#region src/rules/rule-file.ts
	function defineProductionRule(rule) {
		return rule;
	}
	function defineProductionSpouseRule(rule) {
		return rule;
	}
	//#endregion
	//#region src/rules/extended-residuary-rules.ts
	var EXTENDED_RESIDUARY_SOURCE_COMPARISON_ID = "SOURCE-COMPARISON-20260810-EXTENDED-RESIDUARY-PRIORITY";
	var UNCERTAIN_DEATH_SOURCE_COMPARISON_ID = "SOURCE-COMPARISON-20260810-KZ-FR-024-UNCERTAIN-DEATH-ORDER";
	var EXTENDED_NASAB_RESIDUARY_ORDER = [
		"FULL_BROTHERS_SON",
		"PATERNAL_BROTHERS_SON",
		"FULL_PATERNAL_UNCLE",
		"PATERNAL_UNCLE",
		"FULL_PATERNAL_UNCLES_SON",
		"PATERNAL_UNCLES_SON"
	];
	var suffix = {
		FULL_BROTHERS_SON: "FULL-BROTHERS-SON",
		PATERNAL_BROTHERS_SON: "PATERNAL-BROTHERS-SON",
		FULL_PATERNAL_UNCLE: "FULL-PATERNAL-UNCLE",
		PATERNAL_UNCLE: "PATERNAL-UNCLE",
		FULL_PATERNAL_UNCLES_SON: "FULL-PATERNAL-UNCLES-SON",
		PATERNAL_UNCLES_SON: "PATERNAL-UNCLES-SON"
	};
	var kanzExtendedSource = {
		sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
		evidenceRecordId: "MANUAL-20260810-KZ-FR-019-EXTENDED-ASABAH",
		locator: "Printed pages 144–145; local PDF pages 15–16; named nasab-residuary order and residue entitlement."
	};
	var khulasaExtendedSource = {
		sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
		evidenceRecordId: EXTENDED_RESIDUARY_SOURCE_COMPARISON_ID,
		locator: "Printed pages 275 and 277; male blocker table and complete named residuary priority sequence."
	};
	var EXTENDED_RESIDUARY_RULE_DEFINITIONS = EXTENDED_NASAB_RESIDUARY_ORDER.flatMap((heirType, index) => {
		const ruleSuffix = suffix[heirType];
		const nearerExtended = EXTENDED_NASAB_RESIDUARY_ORDER.slice(0, index);
		return [{
			ruleId: `KZ-FR-019-${ruleSuffix}-RESIDUARY`,
			parentResearchRuleId: "KZ-FR-019",
			atomicRuleKind: "EXTENDED_RESIDUARY",
			conditions: [`At least one eligible ${heirType} is present.`, "No nearer admitted nasab residuary is eligible."],
			exclusions: ["Only the exact UI-modeled relationship category executes; no unmodeled degree or lineage is inferred."],
			priority: {
				value: 80 + index,
				rationale: "Apply the exact source-listed nasab-residuary order after fixed shares and total exclusion."
			},
			interactionsOrBlockers: [`Nearer extended categories: ${nearerExtended.join(", ") || "none within the extended list"}.`, "Son, son's son, father, paternal grandfather, and eligible full/consanguine sibling residuaries have priority."],
			outcomeSpecification: `The eligible ${heirType} group receives the residue, divided equally per person.`,
			executionSpecification: {
				heirCategory: heirType,
				mode: "RESIDUARY",
				sameCategoryDivision: "EQUAL_PER_PERSON",
				orderIndex: String(index)
			},
			fixtureIds: [`KZ-FR-019-${ruleSuffix}-RESIDUARY-POS`, `KZ-FR-019-${ruleSuffix}-RESIDUARY-NEG`]
		}, {
			ruleId: `KZ-FR-019-NEARER-ASABAH-BLOCKS-${ruleSuffix}`,
			parentResearchRuleId: "KZ-FR-019",
			atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
			conditions: [`The ${heirType} category and a specifically source-prioritized nearer nasab residuary are present.`],
			exclusions: ["A fixed-share heir alone does not trigger this total-exclusion atom.", "A sister counts as a nearer blocker only when she is actually residuary with a female descendant."],
			priority: {
				value: 10,
				rationale: "Resolve the exact source-listed total exclusion before assigning residue."
			},
			interactionsOrBlockers: ["The blocker must be an actually eligible nearer nasab residuary, not merely a selected but blocked category."],
			outcomeSpecification: `The nearer eligible nasab residuary totally excludes ${heirType}.`,
			executionSpecification: {
				blockee: heirType,
				nearerExtendedCategories: nearerExtended,
				blockingType: "TOTAL_EXCLUSION"
			},
			fixtureIds: [`KZ-FR-019-NEARER-ASABAH-BLOCKS-${ruleSuffix}-POS`, `KZ-FR-019-NEARER-ASABAH-BLOCKS-${ruleSuffix}-NEG`]
		}];
	});
	var WALA_RULE_DEFINITIONS = [{
		ruleId: "KZ-FR-002-EMANCIPATOR-RESIDUARY",
		parentResearchRuleId: "KZ-FR-002",
		atomicRuleKind: "WALA_RESIDUARY",
		conditions: ["Exactly one direct male or female emancipator is selected.", "No eligible nasab residuary is present."],
		exclusions: ["Multiple or competing emancipators and the emancipator's own agnates are outside the current input model."],
		priority: {
			value: 100,
			rationale: "Wala' follows all eligible nasab residuaries in both compared source sequences."
		},
		interactionsOrBlockers: ["Any eligible nasab residuary has priority over the direct emancipator."],
		outcomeSpecification: "The selected direct emancipator receives the residue.",
		executionSpecification: {
			heirCategories: ["MALE_EMANCIPATOR", "FEMALE_EMANCIPATOR"],
			mode: "RESIDUARY",
			maximumSelectedPersons: "1"
		},
		fixtureIds: ["KZ-FR-002-EMANCIPATOR-RESIDUARY-POS", "KZ-FR-002-EMANCIPATOR-RESIDUARY-NEG"]
	}, {
		ruleId: "KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR",
		parentResearchRuleId: "KZ-FR-002",
		atomicRuleKind: "TOTAL_BLOCKING_RELATIONSHIP",
		conditions: ["A direct emancipator and an eligible nasab residuary are present."],
		exclusions: ["Fixed-share heirs who are not residuaries do not trigger this atom."],
		priority: {
			value: 10,
			rationale: "Resolve nasab priority over wala' before residue assignment."
		},
		interactionsOrBlockers: ["The actual eligible nasab residuary is recorded as the blocker."],
		outcomeSpecification: "The eligible nasab residuary totally excludes the direct emancipator.",
		executionSpecification: {
			blockees: ["MALE_EMANCIPATOR", "FEMALE_EMANCIPATOR"],
			blockingType: "TOTAL_EXCLUSION"
		},
		fixtureIds: ["KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR-POS", "KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR-NEG"]
	}];
	var UNCERTAIN_DEATH_SAFETY_RULE_DEFINITION = {
		ruleId: "KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE",
		parentResearchRuleId: "KZ-FR-024",
		atomicRuleKind: "PRECALCULATION_SAFETY_GATE",
		conditions: ["Two potential mutual heirs died together or their death order cannot be established."],
		exclusions: ["The current single-estate input cannot construct the separate estates and each decedent's remaining heirs."],
		priority: {
			value: 1,
			rationale: "Stop before ordinary heir eligibility or shares assume a death order."
		},
		interactionsOrBlockers: ["The ordinary calculation path remains unavailable until the case is represented as separate source-compliant estates."],
		outcomeSpecification: "Reject the ordinary single-estate calculation with UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW; do not assume mutual inheritance.",
		executionSpecification: {
			coverageStatus: "UNSUPPORTED_RULE",
			reason: "UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW",
			mutualInheritanceAssumed: "false"
		},
		fixtureIds: ["KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE-POS", "KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE-NEG"]
	};
	var allDefinitions = [
		...EXTENDED_RESIDUARY_RULE_DEFINITIONS,
		...WALA_RULE_DEFINITIONS,
		UNCERTAIN_DEATH_SAFETY_RULE_DEFINITION
	];
	var extendedResiduaryCandidates = allDefinitions.map((definition) => ({
		...definition,
		sourceComparisonId: definition.parentResearchRuleId === "KZ-FR-024" ? UNCERTAIN_DEATH_SOURCE_COMPARISON_ID : EXTENDED_RESIDUARY_SOURCE_COMPARISON_ID,
		lifecycleStatus: "SOURCE_CORROBORATED",
		executable: false,
		sourceReferences: definition.parentResearchRuleId === "KZ-FR-024" ? [{
			sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
			evidenceRecordId: "MANUAL-20260810-KZ-FR-024-UNCERTAIN-DEATH-ORDER",
			locator: "Printed page 148; local PDF page 19; simultaneous or unknown death order prevents mutual inheritance."
		}, {
			sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
			evidenceRecordId: UNCERTAIN_DEATH_SOURCE_COMPARISON_ID,
			locator: "Printed page 268; heir-survival condition and the simultaneous/unknown-order consequence."
		}] : definition.parentResearchRuleId === "KZ-FR-002" ? [{
			sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
			evidenceRecordId: "MANUAL-20260810-KZ-FR-002-WALA",
			locator: "Printed pages 145–146; local PDF pages 16–17; direct emancipator follows nasab residuaries."
		}, khulasaExtendedSource] : [kanzExtendedSource, khulasaExtendedSource],
		unresolvedQuestions: [],
		implementationReadiness: "ADMITTED_CALCULATION_READY",
		admissionRecordId: null
	}));
	function definition$2(ruleId) {
		const found = allDefinitions.find((item) => item.ruleId === ruleId);
		if (found === void 0) throw new Error(`Missing extended-residuary definition: ${ruleId}`);
		return found;
	}
	function defineExtendedResiduaryProductionRule(ruleId) {
		const item = definition$2(ruleId);
		const candidate = extendedResiduaryCandidates.find((rule) => rule.ruleId === ruleId);
		if (candidate === void 0) throw new Error(`Missing extended-residuary candidate: ${ruleId}`);
		return defineProductionRule({
			...item,
			lifecycleStatus: "PRODUCTION",
			executable: true,
			sourceReferences: candidate.sourceReferences,
			admissionRecordId: `ADMISSION-20260810-${ruleId}`
		});
	}
	//#endregion
	//#region src/rules/production/KZ-FR-002-EMANCIPATOR-RESIDUARY.ts
	var productionRule$109 = defineExtendedResiduaryProductionRule("KZ-FR-002-EMANCIPATOR-RESIDUARY");
	//#endregion
	//#region src/rules/production/KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR.ts
	var productionRule$108 = defineExtendedResiduaryProductionRule("KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR");
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
		"KZ-FR-013": {
			kanz: "Printed pages 140–141; local PDF pages 11–12.",
			khulasa: "Printed pages 271 and 277–278; son's-descendant conditions and residuary order."
		},
		"KZ-FR-014": {
			kanz: "Printed page 141; local PDF page 12.",
			khulasa: "Printed pages 270, 272, and 277–278."
		},
		"KZ-FR-015": {
			kanz: "Printed page 142; local PDF page 13.",
			khulasa: "Printed page 270, including footnote 10."
		},
		"KZ-FR-017": {
			kanz: "Printed pages 139 and 142; local PDF pages 10 and 13.",
			khulasa: "Printed pages 272 and 276; eligible grandmothers and blocking table."
		},
		"KZ-FR-019": {
			kanz: "Printed pages 143–145; local PDF pages 14–16.",
			khulasa: "Printed pages 271, 275–278; sibling shares, blockers, and residuary order."
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
		const { additionalSourceReferences = [], admissionRecordId, ...definition } = rule;
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
			admissionRecordId: admissionRecordId ?? `ADMISSION-20260809-${rule.ruleId}`
		});
	}
	//#endregion
	//#region src/rules/production/KZ-FR-004-FUNCTIONING-BAYT-AL-MAL-RESIDUE.ts
	var productionRule$107 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-004-NO-FUNCTIONING-BAYT-AL-MAL-RADD.ts
	var productionRule$106 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-005-HUSBAND-ONE-HALF.ts
	var productionRule$105 = defineProductionSpouseRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-005-ONE-FULL-SISTER-ONE-HALF.ts
	var productionRule$104 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF.ts
	var productionRule$103 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF.ts
	var productionRule$102 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-006-HUSBAND-ONE-QUARTER.ts
	var productionRule$101 = defineProductionSpouseRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-006-WIVES-ONE-QUARTER.ts
	var productionRule$100 = defineProductionSpouseRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-007-WIVES-ONE-EIGHTH.ts
	var productionRule$99 = defineProductionSpouseRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS.ts
	var productionRule$98 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS.ts
	var productionRule$97 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS.ts
	var productionRule$96 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-009-MOTHER-ONE-THIRD.ts
	var productionRule$95 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD.ts
	var productionRule$94 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-010-MOTHER-ONE-SIXTH-DESCENDANT.ts
	var productionRule$93 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS.ts
	var productionRule$92 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH.ts
	var productionRule$91 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH.ts
	var productionRule$90 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH.ts
	var productionRule$89 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-011-FATHER-BLOCKS-FULL-BROTHER.ts
	var productionRule$88 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-011-FATHER-BLOCKS-MATERNAL-BROTHER.ts
	var productionRule$87 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-011-FATHER-BLOCKS-PATERNAL-BROTHER.ts
	var productionRule$86 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-011-FATHER-BLOCKS-PATERNAL-GRANDFATHER.ts
	var productionRule$85 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-011-SON-BLOCKS-FULL-BROTHER.ts
	var productionRule$84 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-011-SON-BLOCKS-MATERNAL-BROTHER.ts
	var productionRule$83 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-011-SON-BLOCKS-PATERNAL-BROTHER.ts
	var productionRule$82 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-011-SON-BLOCKS-SONS-SON.ts
	var productionRule$81 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-012-DAUGHTER-GROUP-TWO-THIRDS.ts
	var productionRule$80 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-012-ONE-DAUGHTER-ONE-HALF.ts
	var productionRule$79 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-012-SON-GROUP-RESIDUARY.ts
	var productionRule$78 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-012-SONS-AND-DAUGHTERS-TWO-TO-ONE.ts
	var productionRule$77 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/functional-mvp-candidate.ts
	var SOURCE_LOCATORS = {
		"KZ-FR-009": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 137; local PDF page 8",
			khulasa: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–273"
		},
		"KZ-FR-005": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 136; local PDF page 7",
			khulasa: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–272"
		},
		"KZ-FR-008": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 137; local PDF page 8",
			khulasa: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–273"
		},
		"KZ-FR-010": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 138; local PDF page 9",
			khulasa: "references/source-notes/khulasa/fixed-share-locators.md; printed pages 271–274"
		},
		"KZ-FR-004": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 134–135; local PDF pages 5–6",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed page 269; residue, Bayt al-Mal, and radd paragraph"
		},
		"KZ-FR-011": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 138; local PDF page 9",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed pages 274–276; total-exclusion definition and blocker tables"
		},
		"KZ-FR-012": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 140; local PDF page 11",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed pages 270 and 277–278; fixed-share summary, residuary order, and worked combinations"
		},
		"KZ-FR-013": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 140–141; local PDF pages 11–12",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed pages 271 and 277–278; son's-descendant conditions and residuary order"
		},
		"KZ-FR-014": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 141; local PDF page 12",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed pages 270, 272, and 277–278; father fixed share, residuary order, and worked combinations"
		},
		"KZ-FR-015": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 142; local PDF page 13",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed page 270; mother with one spouse and both parents, including footnote 10"
		},
		"KZ-FR-017": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 139 and 142; local PDF pages 10 and 13",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed pages 272 and 276; eligible grandmothers and blocking table"
		},
		"KZ-FR-019": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 143–145; local PDF pages 14–16",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed pages 271, 275–278; sibling shares, blockers, and residuary order"
		},
		"KZ-FR-029": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 154–156; local PDF pages 25–27",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed pages 284–288; case correction for one or multiple broken classes"
		},
		"KZ-FR-027": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed pages 152–153; local PDF pages 23–24",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed page 279; fixed-share denominator/origin table"
		},
		"KZ-FR-028": {
			kanz: "references/extracted/kanz-faraid-extracted-rules-v0.1.json; printed page 153; local PDF page 24",
			khulasa: "references/source-notes/khulasa/khulasa-full.pdf; printed pages 281–283; awl statement and eight worked tables"
		}
	};
	function sourceReferences$1(parentResearchRuleId, explicitComparisonId, additionalSourceReferences = []) {
		const locators = SOURCE_LOCATORS[parentResearchRuleId];
		const sourceComparisonId = explicitComparisonId ?? (parentResearchRuleId === "KZ-FR-009" || parentResearchRuleId === "KZ-FR-010" ? parentResearchRuleId : `SOURCE-COMPARISON-20260809-${parentResearchRuleId}`);
		return [
			{
				sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
				evidenceRecordId: parentResearchRuleId,
				locator: locators.kanz
			},
			{
				sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
				evidenceRecordId: sourceComparisonId,
				locator: locators.khulasa
			},
			...additionalSourceReferences
		];
	}
	function defineFunctionalMvpCandidate(definition) {
		const sourceComparisonId = definition.sourceComparisonId ?? (definition.parentResearchRuleId === "KZ-FR-009" || definition.parentResearchRuleId === "KZ-FR-010" ? definition.parentResearchRuleId : `SOURCE-COMPARISON-20260809-${definition.parentResearchRuleId}`);
		return {
			...definition,
			parentResearchRecordRole: "RESEARCH_UMBRELLA_NOT_DIRECTLY_EXECUTABLE",
			sourceComparisonId,
			lifecycleStatus: "SOURCE_CORROBORATED",
			executable: false,
			sourceReferences: sourceReferences$1(definition.parentResearchRuleId, sourceComparisonId, definition.additionalSourceReferences ?? []),
			fixtureIds: definition.fixtureIds ?? [],
			unresolvedQuestions: definition.unresolvedQuestions ?? [],
			implementationReadiness: definition.implementationReadiness ?? "INCOMPLETE",
			admissionRecordId: null
		};
	}
	//#endregion
	//#region src/rules/remaining-ordinary-rules.ts
	var REMAINING_ORDINARY_SOURCE_COMPARISON_ID = "SOURCE-COMPARISON-20260810-REMAINING-ORDINARY-HEIRS";
	var rule = (ruleId, parentResearchRuleId, atomicRuleKind, conditions, exclusions, outcomeSpecification, executionSpecification) => ({
		ruleId,
		parentResearchRuleId,
		sourceComparisonId: REMAINING_ORDINARY_SOURCE_COMPARISON_ID,
		atomicRuleKind,
		conditions,
		exclusions,
		priority: {
			value: atomicRuleKind === "TOTAL_BLOCKING_RELATIONSHIP" ? 10 : 70,
			rationale: atomicRuleKind === "TOTAL_BLOCKING_RELATIONSHIP" ? "Resolve total exclusion before assigning shares." : "Apply after total exclusion and fixed-share eligibility are resolved."
		},
		interactionsOrBlockers: ["Only the explicitly named first-generation, blocker, priority, and plurality conditions may execute."],
		outcomeSpecification,
		executionSpecification,
		fixtureIds: [`${ruleId}-POS`, `${ruleId}-NEG`]
	});
	var REMAINING_ORDINARY_RULE_DEFINITIONS = [
		rule("KZ-FR-013-SONS-SON-GROUP-RESIDUARY", "KZ-FR-013", "DESCENDANT_RESIDUARY", [
			"At least one first-generation son's son is eligible.",
			"No direct son is present.",
			"No son's daughter is present."
		], ["Deeper or unequal descendant generations are excluded."], "The son's-son group receives the residue.", {
			heirCategory: "SONS_SON",
			mode: "RESIDUARY"
		}),
		rule("KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE", "KZ-FR-013", "DESCENDANT_RESIDUARY", ["First-generation son's sons and son's daughters are both eligible.", "No direct son is present."], ["Deeper or unequal descendant generations are excluded."], "The residue is divided with two weight units per son's son and one per son's daughter.", {
			maleCategory: "SONS_SON",
			femaleCategory: "SONS_DAUGHTER",
			ratio: "2:1"
		}),
		rule("KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER", "KZ-FR-013", "TOTAL_BLOCKING_RELATIONSHIP", ["A direct son and a son's daughter are present."], ["No other descendant relationship is inferred."], "The direct son totally excludes the son's daughter.", {
			blocker: "SON",
			blockee: "SONS_DAUGHTER",
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-013-DAUGHTER-GROUP-BLOCKS-SONS-DAUGHTER", "KZ-FR-013", "TOTAL_BLOCKING_RELATIONSHIP", ["At least two direct daughters and a son's daughter are present.", "No son's son converts the son's daughter to residuary status."], ["A case containing an eligible son's son is excluded from this blocker."], "The direct-daughter group totally excludes the son's daughter.", {
			blocker: "DAUGHTER_GROUP",
			blockee: "SONS_DAUGHTER",
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-013-SONS-DAUGHTER-GROUP-WITH-DAUGHTER-ONE-SIXTH", "KZ-FR-013", "EXTENDED_FIXED_SHARE", ["One direct daughter and two or more first-generation son's daughters are present.", "No direct son or son's son is present."], ["Deeper descendant generations are excluded."], "The son's-daughter group receives the complementary 1/6 collectively.", {
			heirCategory: "SONS_DAUGHTER",
			fixedShare: "1/6"
		}),
		rule("KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH", "KZ-FR-017", "GRANDMOTHER_SHARE", ["One or both normalized immediate maternal and paternal grandmothers are eligible."], [
			"The mother is absent.",
			"The paternal grandmother is excluded when the father is present.",
			"Farther grandmother generations are not represented."
		], "Eligible grandmothers share 1/6 collectively and equally.", {
			heirCategories: ["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"],
			fixedShare: "1/6",
			division: "EQUAL_PER_PERSON"
		}),
		rule("KZ-FR-017-MOTHER-BLOCKS-GRANDMOTHER-GROUP", "KZ-FR-017", "TOTAL_BLOCKING_RELATIONSHIP", ["The mother and one or both normalized grandmothers are present."], ["No farther-generation relationship is inferred."], "The mother totally excludes both immediate grandmother categories.", {
			blocker: "MOTHER",
			blockees: ["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"],
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-017-FATHER-BLOCKS-PATERNAL-GRANDMOTHER", "KZ-FR-017", "TOTAL_BLOCKING_RELATIONSHIP", ["The father and normalized immediate paternal grandmother are present."], ["The father does not block the maternal grandmother under this atom."], "The father totally excludes the paternal grandmother.", {
			blocker: "FATHER",
			blockee: "PATERNAL_GRANDMOTHER",
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-FULL-BROTHER-RESIDUARY", "KZ-FR-019", "EXTENDED_RESIDUARY", ["At least one eligible full brother is present without a full sister."], ["Father, son, son's son, and grandfather-with-siblings cases are excluded."], "The full-brother group receives the residue.", {
			heirCategory: "FULL_BROTHER",
			mode: "RESIDUARY"
		}),
		rule("KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE", "KZ-FR-019", "EXTENDED_RESIDUARY", ["Eligible full brothers and full sisters are both present."], ["Father, son, son's son, and grandfather-with-siblings cases are excluded."], "The residue is divided with two weight units per full brother and one per full sister.", {
			maleCategory: "FULL_BROTHER",
			femaleCategory: "FULL_SISTER",
			ratio: "2:1"
		}),
		rule("KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY", "KZ-FR-019", "EXTENDED_RESIDUARY", ["One or more eligible full sisters and a direct daughter or son's daughter are present.", "No full brother is present."], ["Father, son, son's son, and grandfather-with-siblings cases are excluded."], "The full-sister group receives the residue as asabah ma'a al-ghayr.", {
			heirCategory: "FULL_SISTER",
			withCategories: ["DAUGHTER", "SONS_DAUGHTER"],
			mode: "RESIDUARY_WITH_FEMALE_DESCENDANT"
		}),
		rule("KZ-FR-019-PATERNAL-BROTHER-RESIDUARY", "KZ-FR-019", "EXTENDED_RESIDUARY", ["At least one eligible paternal brother is present without a paternal sister or nearer full sibling."], ["Father, son, son's son, full sibling, and grandfather-with-siblings cases are excluded."], "The paternal-brother group receives the residue.", {
			heirCategory: "PATERNAL_BROTHER",
			mode: "RESIDUARY"
		}),
		rule("KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE", "KZ-FR-019", "EXTENDED_RESIDUARY", ["Eligible paternal brothers and paternal sisters are both present without a nearer full sibling."], ["Father, son, son's son, full sibling, and grandfather-with-siblings cases are excluded."], "The residue is divided with two weight units per paternal brother and one per paternal sister.", {
			maleCategory: "PATERNAL_BROTHER",
			femaleCategory: "PATERNAL_SISTER",
			ratio: "2:1"
		}),
		rule("KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY", "KZ-FR-019", "EXTENDED_RESIDUARY", ["One or more eligible paternal sisters and a direct daughter or son's daughter are present.", "No paternal brother or nearer full sibling is present."], ["Father, son, son's son, full sibling, and grandfather-with-siblings cases are excluded."], "The paternal-sister group receives the residue as asabah ma'a al-ghayr.", {
			heirCategory: "PATERNAL_SISTER",
			withCategories: ["DAUGHTER", "SONS_DAUGHTER"],
			mode: "RESIDUARY_WITH_FEMALE_DESCENDANT"
		}),
		rule("KZ-FR-019-FATHER-BLOCKS-SISTER-GROUP", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["The father and a full or paternal sister are present."], ["Grandfather interactions are excluded."], "The father totally excludes full and paternal sisters.", {
			blocker: "FATHER",
			blockees: ["FULL_SISTER", "PATERNAL_SISTER"],
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-SON-BLOCKS-SISTER-GROUP", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["A direct son and a full or paternal sister are present."], [], "The son totally excludes full and paternal sisters.", {
			blocker: "SON",
			blockees: ["FULL_SISTER", "PATERNAL_SISTER"],
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-SONS-SON-BLOCKS-FULL-PATERNAL-SIBLINGS", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["An eligible first-generation son's son and a full or paternal sibling are present."], ["Deeper descendant generations are excluded."], "The son's son totally excludes full and paternal siblings.", {
			blocker: "SONS_SON",
			blockees: [
				"FULL_BROTHER",
				"FULL_SISTER",
				"PATERNAL_BROTHER",
				"PATERNAL_SISTER"
			],
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-FULL-BROTHER-BLOCKS-PATERNAL-SIBLING-GROUP", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["A full brother and paternal sibling are present."], [], "The full brother totally excludes paternal brothers and paternal sisters.", {
			blocker: "FULL_BROTHER",
			blockees: ["PATERNAL_BROTHER", "PATERNAL_SISTER"],
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-BLOCKS-PATERNAL-SIBLINGS", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["A full sister is residuary with a daughter or son's daughter and a paternal sibling is present."], ["The full-sister residuary condition must be satisfied."], "The residuary full sister totally excludes paternal brothers and paternal sisters.", {
			blocker: "FULL_SISTER_WITH_FEMALE_DESCENDANT",
			blockees: ["PATERNAL_BROTHER", "PATERNAL_SISTER"],
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-FULL-SISTER-GROUP-BLOCKS-PATERNAL-SISTER", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["Two or more eligible full sisters and a paternal sister are present.", "No paternal brother makes the paternal sister residuary."], [], "The full-sister group totally excludes the paternal sister.", {
			blocker: "FULL_SISTER_GROUP",
			blockee: "PATERNAL_SISTER",
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-PATERNAL-SISTER-GROUP-WITH-FULL-SISTER-ONE-SIXTH", "KZ-FR-019", "EXTENDED_FIXED_SHARE", ["Exactly one full sister and two or more paternal sisters are eligible.", "No corresponding brother, ascendant blocker, or descendant is present."], [], "The paternal-sister group receives the complementary 1/6 collectively.", {
			heirCategory: "PATERNAL_SISTER",
			fixedShare: "1/6"
		}),
		rule("KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL", "KZ-FR-019", "EXTENDED_FIXED_SHARE", ["At least one uterine brother and one uterine sister are present, with at least two uterine siblings total.", "No admitted ascendant or descendant blocker is present."], ["Mushtaraka is excluded."], "The mixed uterine-sibling group receives 1/3 collectively, shared equally without a 2:1 ratio.", {
			heirCategories: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
			fixedShare: "1/3",
			division: "EQUAL_PER_PERSON"
		}),
		rule("KZ-FR-019-FATHER-BLOCKS-MATERNAL-SISTER", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["The father and a uterine sister are present."], [], "The father totally excludes the uterine sister.", {
			blocker: "FATHER",
			blockee: "MATERNAL_SISTER",
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-SON-BLOCKS-MATERNAL-SISTER", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["A direct son and a uterine sister are present."], [], "The son totally excludes the uterine sister.", {
			blocker: "SON",
			blockee: "MATERNAL_SISTER",
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["A direct daughter and a uterine sibling are present."], [], "The daughter totally excludes uterine brothers and uterine sisters.", {
			blocker: "DAUGHTER",
			blockees: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-SONS-SON-BLOCKS-UTERINE-SIBLING-GROUP", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["An eligible first-generation son's son and a uterine sibling are present."], ["Deeper descendant generations are excluded."], "The son's son totally excludes uterine brothers and uterine sisters.", {
			blocker: "SONS_SON",
			blockees: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
			blockingType: "TOTAL_EXCLUSION"
		}),
		rule("KZ-FR-019-SONS-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP", "KZ-FR-019", "TOTAL_BLOCKING_RELATIONSHIP", ["A first-generation son's daughter and a uterine sibling are present."], ["Deeper descendant generations are excluded."], "The son's daughter totally excludes uterine brothers and uterine sisters.", {
			blocker: "SONS_DAUGHTER",
			blockees: ["MATERNAL_BROTHER", "MATERNAL_SISTER"],
			blockingType: "TOTAL_EXCLUSION"
		})
	];
	function definition$1(ruleId) {
		const found = REMAINING_ORDINARY_RULE_DEFINITIONS.find((item) => item.ruleId === ruleId);
		if (found === void 0) throw new Error(`Missing remaining-ordinary rule definition: ${ruleId}`);
		return found;
	}
	REMAINING_ORDINARY_RULE_DEFINITIONS.map((item) => defineFunctionalMvpCandidate({
		...item,
		unresolvedQuestions: [],
		implementationReadiness: "ADMITTED_CALCULATION_READY"
	}));
	function defineRemainingOrdinaryProductionRule(ruleId) {
		return defineDirectFamilyProductionRule({
			...definition$1(ruleId),
			admissionRecordId: `ADMISSION-20260810-${ruleId}`
		});
	}
	//#endregion
	//#region src/rules/production/KZ-FR-013-DAUGHTER-GROUP-BLOCKS-SONS-DAUGHTER.ts
	var productionRule$76 = defineRemainingOrdinaryProductionRule("KZ-FR-013-DAUGHTER-GROUP-BLOCKS-SONS-DAUGHTER");
	//#endregion
	//#region src/rules/lineage-hierarchy.ts
	var LINEAGE_RULE_IDS = {
		directSonBlocks: "KZ-FR-013-DIRECT-SON-BLOCKS-SON-LINE-DESCENDANTS",
		nearerMaleBlocks: "KZ-FR-013-NEARER-MALE-DESCENDANT-BLOCKS-FARTHER",
		nearerFemaleBlocks: "KZ-FR-013-NEARER-FEMALE-DESCENDANT-BLOCKS-FARTHER",
		deeperMaleResidue: "KZ-FR-013-DEEPER-MALE-DESCENDANT-RESIDUARY",
		deeperFemaleHalf: "KZ-FR-013-DEEPER-FEMALE-DESCENDANT-ONE-HALF",
		deeperFemaleTwoThirds: "KZ-FR-013-DEEPER-FEMALE-DESCENDANT-GROUP-TWO-THIRDS",
		deeperFemaleComplement: "KZ-FR-013-DEEPER-FEMALE-DESCENDANT-COMPLEMENT-ONE-SIXTH",
		descendantTwoToOne: "KZ-FR-013-LINEAGE-DESCENDANTS-TWO-TO-ONE",
		grandmotherShare: "KZ-FR-017-LINEAGE-GRANDMOTHER-GROUP-ONE-SIXTH",
		motherBlocksGrandmothers: "KZ-FR-017-MOTHER-BLOCKS-LINEAGE-GRANDMOTHERS",
		nearerGrandmotherBlocks: "KZ-FR-017-NEARER-GRANDMOTHER-BLOCKS-FARTHER",
		maternalGrandmotherPriority: "KZ-FR-017-NEARER-MATERNAL-GRANDMOTHER-BLOCKS-FARTHER-PATERNAL",
		maleAscendantBlocksOwnMother: "KZ-FR-017-MALE-ASCENDANT-BLOCKS-OWN-MOTHER"
	};
	var count = (heirs, type) => heirs.filter((heir) => heir.type === type).reduce((total, heir) => total + heir.count, 0);
	var requiredDescendantGeneration = (heir) => {
		const generation = descendantGeneration(heir);
		if (generation === null) throw new Error("Expected a normalized son-line descendant.");
		return generation;
	};
	var requiredGrandmotherDegree = (heir) => {
		const degree = grandmotherDegree(heir);
		if (degree === null) throw new Error("Expected a normalized grandmother lineage.");
		return degree;
	};
	var block = (blocked, blocker, blockee, ruleId, reason) => {
		blocked.push({
			blockedHeirId: blockee.heirId,
			type: blockee.type,
			count: blockee.count,
			blockerHeirId: blocker.heirId,
			blockerType: blocker.type,
			ruleId,
			reason,
			partialLineageBlock: true
		});
	};
	function resolveDescendants(heirs) {
		const directSon = heirs.find((heir) => heir.type === "SON");
		const descendants = heirs.filter((heir) => descendantGeneration(heir) !== null);
		if (descendants.length === 0) return {
			normalizedHeirs: heirs,
			blockedHeirs: [],
			requiredRuleIds: [],
			unsupportedReasons: []
		};
		const blocked = [];
		const required = /* @__PURE__ */ new Set();
		const blockedKeys = /* @__PURE__ */ new Set();
		if (directSon !== void 0) {
			for (const descendant of descendants) {
				blockedKeys.add(lineageKey(descendant));
				const ruleId = requiredDescendantGeneration(descendant) > 1 ? LINEAGE_RULE_IDS.directSonBlocks : descendant.type === "SONS_SON" ? "KZ-FR-011-SON-BLOCKS-SONS-SON" : "KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER";
				block(blocked, directSon, descendant, ruleId, `The direct son blocks the ${lineageDescription(descendant)}.`);
				required.add(ruleId);
			}
			return {
				normalizedHeirs: heirs.filter((heir) => !blockedKeys.has(lineageKey(heir))),
				blockedHeirs: blocked,
				requiredRuleIds: [...required],
				unsupportedReasons: []
			};
		}
		const males = descendants.filter((heir) => heir.type === "SONS_SON");
		const females = descendants.filter((heir) => heir.type === "SONS_DAUGHTER");
		const nearestMaleGeneration = males.reduce((nearest, heir) => {
			const generation = requiredDescendantGeneration(heir);
			return nearest === null || generation < nearest ? generation : nearest;
		}, null);
		if (nearestMaleGeneration !== null) {
			const nearestMale = males.find((heir) => requiredDescendantGeneration(heir) === nearestMaleGeneration);
			if (nearestMale === void 0) throw new Error("Nearest male descendant was not retained.");
			for (const descendant of descendants) {
				if (requiredDescendantGeneration(descendant) <= nearestMaleGeneration) continue;
				blockedKeys.add(lineageKey(descendant));
				block(blocked, nearestMale, descendant, LINEAGE_RULE_IDS.nearerMaleBlocks, `${lineageDescription(nearestMale)} is nearer and blocks ${lineageDescription(descendant)}.`);
			}
			if (blockedKeys.size > 0) required.add(LINEAGE_RULE_IDS.nearerMaleBlocks);
		}
		const remainingFemales = females.filter((heir) => !blockedKeys.has(lineageKey(heir)));
		const directDaughters = count(heirs, "DAUGHTER");
		if (!(nearestMaleGeneration !== null && directDaughters >= 2 && remainingFemales.some((heir) => requiredDescendantGeneration(heir) <= nearestMaleGeneration)) && (nearestMaleGeneration === null || remainingFemales.every((heir) => requiredDescendantGeneration(heir) < nearestMaleGeneration))) {
			const orderedGenerations = [...new Set(remainingFemales.map(requiredDescendantGeneration))].sort((left, right) => left - right);
			const keep = /* @__PURE__ */ new Set();
			if (orderedGenerations.length > 0 && directDaughters < 2) {
				const firstGeneration = orderedGenerations[0];
				if (firstGeneration === void 0) throw new Error("Expected a first female generation.");
				keep.add(firstGeneration);
				const firstCount = remainingFemales.filter((heir) => descendantGeneration(heir) === orderedGenerations[0]).reduce((total, heir) => total + heir.count, 0);
				if (directDaughters === 0 && firstCount === 1 && orderedGenerations[1] !== void 0) keep.add(orderedGenerations[1]);
			}
			for (const female of remainingFemales) {
				const generation = requiredDescendantGeneration(female);
				if (keep.has(generation)) continue;
				const blocker = directDaughters >= 2 ? heirs.find((heir) => heir.type === "DAUGHTER") : remainingFemales.find((heir) => keep.has(requiredDescendantGeneration(heir)));
				if (blocker === void 0) continue;
				blockedKeys.add(lineageKey(female));
				block(blocked, blocker, female, LINEAGE_RULE_IDS.nearerFemaleBlocks, `${lineageDescription(female)} is excluded after the nearer female-descendant entitlement reaches the source-defined ceiling.`);
			}
			if (blocked.some(({ ruleId }) => ruleId === LINEAGE_RULE_IDS.nearerFemaleBlocks)) required.add(LINEAGE_RULE_IDS.nearerFemaleBlocks);
		}
		const effective = heirs.filter((heir) => !blockedKeys.has(lineageKey(heir)));
		const effectiveFemaleGenerations = [...new Set(effective.filter((heir) => heir.type === "SONS_DAUGHTER").map(requiredDescendantGeneration))];
		const hasMale = effective.some((heir) => heir.type === "SONS_SON");
		const multipleFemaleFixedLevels = effectiveFemaleGenerations.length > 1 && !(hasMale && directDaughters >= 2);
		return {
			normalizedHeirs: effective,
			blockedHeirs: blocked,
			requiredRuleIds: [...required],
			unsupportedReasons: multipleFemaleFixedLevels ? ["DESCENDANT_MULTILEVEL_FEMALE_FIXED_SHARES_NOT_ADMITTED"] : []
		};
	}
	function resolveGrandmothers(heirs) {
		const grandmothers = heirs.filter((heir) => grandmotherDegree(heir) !== null);
		if (grandmothers.length === 0) return {
			normalizedHeirs: heirs,
			blockedHeirs: [],
			requiredRuleIds: [],
			unsupportedReasons: []
		};
		const blocked = [];
		const required = /* @__PURE__ */ new Set();
		const blockedKeys = /* @__PURE__ */ new Set();
		const mother = heirs.find((heir) => heir.type === "MOTHER");
		if (mother !== void 0) for (const grandmother of grandmothers) {
			const ruleId = requiredGrandmotherDegree(grandmother) === 2 ? "KZ-FR-017-MOTHER-BLOCKS-GRANDMOTHER-GROUP" : LINEAGE_RULE_IDS.motherBlocksGrandmothers;
			blockedKeys.add(lineageKey(grandmother));
			block(blocked, mother, grandmother, ruleId, `The mother blocks ${lineageDescription(grandmother)}.`);
			required.add(ruleId);
		}
		const father = heirs.find((heir) => heir.type === "FATHER");
		const grandfather = heirs.find((heir) => heir.type === "PATERNAL_GRANDFATHER");
		for (const [ascendant, ownMotherPath] of [[father, "FATHER>MOTHER"], [grandfather, "FATHER>FATHER>MOTHER"]]) {
			if (ascendant === void 0) continue;
			for (const grandmother of grandmothers) {
				if (grandmother.lineage?.path.join(">") !== ownMotherPath) continue;
				blockedKeys.add(lineageKey(grandmother));
				const ruleId = ascendant.type === "FATHER" && grandmotherDegree(grandmother) === 2 ? "KZ-FR-017-FATHER-BLOCKS-PATERNAL-GRANDMOTHER" : LINEAGE_RULE_IDS.maleAscendantBlocksOwnMother;
				block(blocked, ascendant, grandmother, ruleId, `${ascendant.type} blocks his own mother in the represented lineage.`);
				required.add(ruleId);
			}
		}
		const available = grandmothers.filter((heir) => !blockedKeys.has(lineageKey(heir)));
		for (const type of ["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"]) {
			const side = available.filter((heir) => heir.type === type);
			const nearest = side.reduce((degree, heir) => {
				const current = requiredGrandmotherDegree(heir);
				return degree === null || current < degree ? current : degree;
			}, null);
			if (nearest === null) continue;
			const blocker = side.find((heir) => requiredGrandmotherDegree(heir) === nearest);
			if (blocker === void 0) throw new Error("Nearest grandmother was not retained.");
			for (const grandmother of side) {
				if (grandmotherDegree(grandmother) === nearest) continue;
				blockedKeys.add(lineageKey(grandmother));
				block(blocked, blocker, grandmother, LINEAGE_RULE_IDS.nearerGrandmotherBlocks, `${lineageDescription(blocker)} is nearer on the same side and blocks ${lineageDescription(grandmother)}.`);
				required.add(LINEAGE_RULE_IDS.nearerGrandmotherBlocks);
			}
		}
		const afterSameSide = grandmothers.filter((heir) => !blockedKeys.has(lineageKey(heir)));
		const nearestMaternal = afterSameSide.find((heir) => heir.type === "MATERNAL_GRANDMOTHER");
		if (nearestMaternal !== void 0) for (const paternal of afterSameSide.filter((heir) => heir.type === "PATERNAL_GRANDMOTHER")) {
			if (requiredGrandmotherDegree(nearestMaternal) >= requiredGrandmotherDegree(paternal)) continue;
			blockedKeys.add(lineageKey(paternal));
			block(blocked, nearestMaternal, paternal, LINEAGE_RULE_IDS.maternalGrandmotherPriority, `${lineageDescription(nearestMaternal)} is nearer from the maternal side and blocks ${lineageDescription(paternal)}.`);
			required.add(LINEAGE_RULE_IDS.maternalGrandmotherPriority);
		}
		return {
			normalizedHeirs: heirs.filter((heir) => !blockedKeys.has(lineageKey(heir))),
			blockedHeirs: blocked,
			requiredRuleIds: [...required],
			unsupportedReasons: []
		};
	}
	function resolveLineageHierarchy(input) {
		const normalized = normalizeLineageAwareHeirs(input);
		if (normalized.issues.length > 0) return {
			normalizedHeirs: [],
			blockedHeirs: [],
			requiredRuleIds: [],
			issues: normalized.issues.map(({ code }) => code),
			unsupportedReasons: []
		};
		const descendants = resolveDescendants(normalized.heirs);
		const grandmothers = resolveGrandmothers(descendants.normalizedHeirs);
		return {
			normalizedHeirs: grandmothers.normalizedHeirs,
			blockedHeirs: [...descendants.blockedHeirs, ...grandmothers.blockedHeirs],
			requiredRuleIds: [.../* @__PURE__ */ new Set([...descendants.requiredRuleIds, ...grandmothers.requiredRuleIds])],
			issues: [],
			unsupportedReasons: [...descendants.unsupportedReasons, ...grandmothers.unsupportedReasons]
		};
	}
	//#endregion
	//#region src/rules/lineage-aware-rules.ts
	var DESCENDANT_LINEAGE_COMPARISON_ID = "SOURCE-COMPARISON-20260810-DESCENDANT-LINEAGE-HIERARCHY";
	var GRANDMOTHER_LINEAGE_COMPARISON_ID = "SOURCE-COMPARISON-20260810-GRANDMOTHER-LINEAGE-HIERARCHY";
	var descendant = (ruleId, atomicRuleKind, conditions, exclusions, outcomeSpecification) => ({
		ruleId,
		parentResearchRuleId: "KZ-FR-013",
		atomicRuleKind,
		conditions,
		exclusions,
		priority: {
			value: 35,
			rationale: "Resolve explicit descendant generation before shares."
		},
		interactionsOrBlockers: ["Only a path whose intermediate persons are sons is a valid son-line descendant path."],
		outcomeSpecification,
		executionSpecification: {
			arithmetic: "EXACT",
			lineageRequired: "true"
		},
		fixtureIds: [`${ruleId}-POS`, `${ruleId}-NEG`]
	});
	var grandmother = (ruleId, atomicRuleKind, conditions, exclusions, outcomeSpecification) => ({
		ruleId,
		parentResearchRuleId: "KZ-FR-017",
		atomicRuleKind,
		conditions,
		exclusions,
		priority: {
			value: 36,
			rationale: "Resolve valid lineage and grandmother priority before 1/6."
		},
		interactionsOrBlockers: ["Only a source-valid path of paternal steps followed by maternal steps is eligible."],
		outcomeSpecification,
		executionSpecification: {
			arithmetic: "EXACT",
			lineageRequired: "true"
		},
		fixtureIds: [`${ruleId}-POS`, `${ruleId}-NEG`]
	});
	var LINEAGE_RULE_DEFINITIONS = [
		descendant(LINEAGE_RULE_IDS.directSonBlocks, "TOTAL_BLOCKING_RELATIONSHIP", ["A direct son and one or more valid farther son-line descendants are present."], ["No arbitrary descendant through a daughter is normalized into this category."], "The direct son totally excludes every farther son-line descendant."),
		descendant(LINEAGE_RULE_IDS.nearerMaleBlocks, "GENERATION_BLOCKING", ["Valid male son-line descendants occur at different generations."], ["Female descendants above the nearer male are resolved by their separate fixed/rescue rules."], "The nearest eligible male generation excludes all farther son-line descendants."),
		descendant(LINEAGE_RULE_IDS.nearerFemaleBlocks, "GENERATION_BLOCKING", ["A nearer female-descendant entitlement has reached the two-thirds ceiling."], ["A source-qualifying lower male rescue uses the separate 2:1 atom."], "Farther female son-line descendants receive zero after the nearer entitlement ceiling."),
		descendant(LINEAGE_RULE_IDS.deeperMaleResidue, "DESCENDANT_RESIDUARY", ["The nearest eligible valid son-line descendant generation contains males."], ["A direct son and every nearer eligible male generation are absent."], "The nearest eligible male son-line group receives the residue."),
		descendant(LINEAGE_RULE_IDS.deeperFemaleHalf, "DESCENDANT_FIXED_SHARE", ["Exactly one female is in the nearest eligible son-line generation."], ["No direct child or converting male descendant is present."], "The female descendant receives 1/2."),
		descendant(LINEAGE_RULE_IDS.deeperFemaleTwoThirds, "DESCENDANT_FIXED_SHARE", ["Two or more females are in the nearest eligible son-line generation."], ["No direct child or converting male descendant is present."], "The female-descendant group receives 2/3 collectively."),
		descendant(LINEAGE_RULE_IDS.deeperFemaleComplement, "DESCENDANT_FIXED_SHARE", ["One direct daughter and a nearest eligible farther female son-line group are present."], ["No eligible male descendant converts the female group to residuary status."], "The farther female-descendant group receives the complementary 1/6 collectively."),
		descendant(LINEAGE_RULE_IDS.descendantTwoToOne, "DESCENDANT_RESIDUARY", ["An eligible male son-line descendant is present with females at his generation or source-qualified females above him who received none of the two-thirds ceiling."], ["Females below the nearest eligible male generation are excluded."], "The eligible descendant residue is divided with two units per male and one per female."),
		grandmother(LINEAGE_RULE_IDS.grandmotherShare, "GRANDMOTHER_SHARE", ["One or more source-valid, unblocked lineage-aware grandmothers are present."], ["Invalid ancestry routes and every grandmother blocked by a nearer eligible relation are excluded."], "Eligible grandmothers share 1/6 collectively and equally."),
		grandmother(LINEAGE_RULE_IDS.motherBlocksGrandmothers, "TOTAL_BLOCKING_RELATIONSHIP", ["The mother and any valid grandmother lineage are present."], [], "The mother totally excludes every grandmother."),
		grandmother(LINEAGE_RULE_IDS.nearerGrandmotherBlocks, "GENERATION_BLOCKING", ["Two valid grandmothers are on the same side at different degrees."], ["Equal-degree eligible grandmothers share under the collective-share atom."], "The nearer grandmother on a side totally excludes the farther grandmother on that side."),
		grandmother(LINEAGE_RULE_IDS.maternalGrandmotherPriority, "GENERATION_BLOCKING", ["A maternal-side grandmother is nearer than an otherwise eligible paternal-side grandmother."], ["A nearer paternal grandmother does not exclude a farther maternal grandmother under the admitted view."], "The nearer maternal-side grandmother excludes the farther paternal-side grandmother."),
		grandmother(LINEAGE_RULE_IDS.maleAscendantBlocksOwnMother, "TOTAL_BLOCKING_RELATIONSHIP", ["The father or paternal grandfather and his own mother are present."], ["The male ascendant does not block a grandmother whose lineage does not pass through him."], "The living male ascendant excludes his own mother.")
	];
	var descendantSources = [{
		sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
		evidenceRecordId: "MANUAL-20260810-KZ-FR-013-LINEAGE-HIERARCHY",
		locator: "Printed pages 140–141; all son-line levels, lower-male rescue, and nearer blocking."
	}, {
		sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
		evidenceRecordId: DESCENDANT_LINEAGE_COMPARISON_ID,
		locator: "Printed page 277 and footnotes 2–5; all son-line levels and unequal-generation examples."
	}];
	var grandmotherSources = [{
		sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
		evidenceRecordId: "MANUAL-20260810-KZ-FR-017-LINEAGE-HIERARCHY",
		locator: "Printed pages 139 and 142; valid routes, degree, side priority, and ascendant blockers."
	}, {
		sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
		evidenceRecordId: GRANDMOTHER_LINEAGE_COMPARISON_ID,
		locator: "Printed page 276 and footnote 2; grandmother blocker table and asymmetric side priority."
	}];
	var lineageAwareCandidates = LINEAGE_RULE_DEFINITIONS.map((definition) => ({
		...definition,
		sourceComparisonId: definition.parentResearchRuleId === "KZ-FR-013" ? DESCENDANT_LINEAGE_COMPARISON_ID : GRANDMOTHER_LINEAGE_COMPARISON_ID,
		lifecycleStatus: "SOURCE_CORROBORATED",
		executable: false,
		sourceReferences: definition.parentResearchRuleId === "KZ-FR-013" ? descendantSources : grandmotherSources,
		unresolvedQuestions: [],
		implementationReadiness: "ADMITTED_CALCULATION_READY",
		admissionRecordId: null
	}));
	function defineLineageAwareCandidate(ruleId) {
		const found = lineageAwareCandidates.find((candidate) => candidate.ruleId === ruleId);
		if (found === void 0) throw new Error(`Missing lineage-aware candidate: ${ruleId}`);
		return found;
	}
	function defineLineageAwareProductionRule(ruleId) {
		return defineProductionRule({
			...defineLineageAwareCandidate(ruleId),
			lifecycleStatus: "PRODUCTION",
			executable: true,
			admissionRecordId: `ADMISSION-20260810-${ruleId}`
		});
	}
	//#endregion
	//#region src/rules/production/KZ-FR-013-DEEPER-FEMALE-DESCENDANT-COMPLEMENT-ONE-SIXTH.ts
	var productionRule$75 = defineLineageAwareProductionRule("KZ-FR-013-DEEPER-FEMALE-DESCENDANT-COMPLEMENT-ONE-SIXTH");
	//#endregion
	//#region src/rules/production/KZ-FR-013-DEEPER-FEMALE-DESCENDANT-GROUP-TWO-THIRDS.ts
	var productionRule$74 = defineLineageAwareProductionRule("KZ-FR-013-DEEPER-FEMALE-DESCENDANT-GROUP-TWO-THIRDS");
	//#endregion
	//#region src/rules/production/KZ-FR-013-DEEPER-FEMALE-DESCENDANT-ONE-HALF.ts
	var productionRule$73 = defineLineageAwareProductionRule("KZ-FR-013-DEEPER-FEMALE-DESCENDANT-ONE-HALF");
	//#endregion
	//#region src/rules/production/KZ-FR-013-DEEPER-MALE-DESCENDANT-RESIDUARY.ts
	var productionRule$72 = defineLineageAwareProductionRule("KZ-FR-013-DEEPER-MALE-DESCENDANT-RESIDUARY");
	//#endregion
	//#region src/rules/production/KZ-FR-013-DIRECT-SON-BLOCKS-SON-LINE-DESCENDANTS.ts
	var productionRule$71 = defineLineageAwareProductionRule("KZ-FR-013-DIRECT-SON-BLOCKS-SON-LINE-DESCENDANTS");
	//#endregion
	//#region src/rules/production/KZ-FR-013-LINEAGE-DESCENDANTS-TWO-TO-ONE.ts
	var productionRule$70 = defineLineageAwareProductionRule("KZ-FR-013-LINEAGE-DESCENDANTS-TWO-TO-ONE");
	//#endregion
	//#region src/rules/production/KZ-FR-013-NEARER-FEMALE-DESCENDANT-BLOCKS-FARTHER.ts
	var productionRule$69 = defineLineageAwareProductionRule("KZ-FR-013-NEARER-FEMALE-DESCENDANT-BLOCKS-FARTHER");
	//#endregion
	//#region src/rules/production/KZ-FR-013-NEARER-MALE-DESCENDANT-BLOCKS-FARTHER.ts
	var productionRule$68 = defineLineageAwareProductionRule("KZ-FR-013-NEARER-MALE-DESCENDANT-BLOCKS-FARTHER");
	//#endregion
	//#region src/rules/production/KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER.ts
	var productionRule$67 = defineRemainingOrdinaryProductionRule("KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER");
	//#endregion
	//#region src/rules/production/KZ-FR-013-SONS-DAUGHTER-GROUP-WITH-DAUGHTER-ONE-SIXTH.ts
	var productionRule$66 = defineRemainingOrdinaryProductionRule("KZ-FR-013-SONS-DAUGHTER-GROUP-WITH-DAUGHTER-ONE-SIXTH");
	//#endregion
	//#region src/rules/production/KZ-FR-013-SONS-SON-GROUP-RESIDUARY.ts
	var productionRule$65 = defineRemainingOrdinaryProductionRule("KZ-FR-013-SONS-SON-GROUP-RESIDUARY");
	//#endregion
	//#region src/rules/production/KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE.ts
	var productionRule$64 = defineRemainingOrdinaryProductionRule("KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE");
	//#endregion
	//#region src/rules/production/KZ-FR-014-FATHER-ONE-SIXTH.ts
	var productionRule$63 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-014-FATHER-ONE-SIXTH-PLUS-RESIDUE.ts
	var productionRule$62 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-014-FATHER-RESIDUARY.ts
	var productionRule$61 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-015-HUSBAND-MOTHER-FATHER.ts
	var productionRule$60 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER.ts
	var productionRule$59 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/production/KZ-FR-015-WIFE-MOTHER-FATHER.ts
	var productionRule$58 = defineDirectFamilyProductionRule({
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
	});
	//#endregion
	//#region src/rules/advanced-shafii-rules.ts
	var ADVANCED_SOURCE_COMPARISON_ID = "SOURCE-COMPARISON-20260810-ADVANCED-SHAFII-INHERITANCE";
	var REMAINING_GAPS_SOURCE_COMPARISON_ID = "SOURCE-COMPARISON-20260810-REMAINING-SHAFII-GAPS";
	var definition = (ruleId, parentResearchRuleId, atomicRuleKind, conditions, exclusions, outcomeSpecification, executionSpecification) => ({
		ruleId,
		parentResearchRuleId,
		atomicRuleKind,
		conditions,
		exclusions,
		priority: {
			value: atomicRuleKind === "MUSHTARAKA" || atomicRuleKind === "AKDARIYYA" ? 5 : atomicRuleKind === "MUADDA" ? 6 : atomicRuleKind === "TOTAL_BLOCKING_RELATIONSHIP" ? 10 : 60,
			rationale: "Resolve exact special-case precedence and blocking before ordinary shares."
		},
		interactionsOrBlockers: ["The exact admitted detector and its exclusions must pass whole-case coverage.", "All comparisons use exact bigint rational arithmetic."],
		outcomeSpecification,
		executionSpecification,
		fixtureIds: [`${ruleId}-POS`, `${ruleId}-NEG`]
	});
	var ADVANCED_RULE_DEFINITIONS = [
		definition("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH", "KZ-FR-016", "GRANDFATHER_MODE", ["The father is absent.", "An eligible male descendant is present."], ["Grandfather-with-siblings uses KZ-FR-020/021 instead."], "The paternal grandfather receives 1/6 as a fixed share.", {
			heirCategory: "PATERNAL_GRANDFATHER",
			fixedShare: "1/6",
			mode: "FIXED"
		}),
		definition("KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY", "KZ-FR-016", "GRANDFATHER_MODE", ["The father and descendants are absent.", "No competing full or paternal sibling is present."], ["The two Umariyyatayn do not substitute the grandfather for the father."], "The paternal grandfather receives the residue.", {
			heirCategory: "PATERNAL_GRANDFATHER",
			mode: "RESIDUARY"
		}),
		definition("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE", "KZ-FR-016", "GRANDFATHER_MODE", ["The father and male descendants are absent.", "An eligible female descendant is present."], ["Grandfather-with-siblings uses KZ-FR-020/021 instead."], "The paternal grandfather receives 1/6 plus any residue.", {
			heirCategory: "PATERNAL_GRANDFATHER",
			fixedShare: "1/6",
			mode: "FIXED_PLUS_RESIDUE"
		}),
		definition("KZ-FR-016-PATERNAL-GRANDFATHER-BLOCKS-UTERINE-SIBLING-GROUP", "KZ-FR-016", "TOTAL_BLOCKING_RELATIONSHIP", ["The paternal grandfather and a uterine sibling are present."], ["Full and paternal siblings are not blocked by this atom."], "The paternal grandfather totally excludes uterine siblings.", {
			blocker: "PATERNAL_GRANDFATHER",
			blockees: ["MATERNAL_BROTHER", "MATERNAL_SISTER"]
		}),
		definition("KZ-FR-018-MUSHTARAKA-CANONICAL", "KZ-FR-018", "MUSHTARAKA", ["Exactly husband, mother or one eligible immediate grandmother, exactly two uterine siblings, and exactly one full brother are present.", "No other heir is present."], ["A paternal brother does not substitute for the full brother.", "Broader pluralities are excluded."], "The full brother joins the two uterine siblings in their collective 1/3, shared equally per person.", {
			fixedShare: "1/3",
			participants: [
				"MATERNAL_BROTHER",
				"MATERNAL_SISTER",
				"FULL_BROTHER"
			],
			division: "EQUAL_PER_PERSON"
		}),
		definition("KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON", "KZ-FR-020", "GRANDFATHER_COMPARISON", ["The grandfather competes with eligible full or paternal siblings and no other fixed-share heir exists."], ["Akdariyya and Mu‘adda use dedicated paths."], "Choose the greater of 1/3 of the estate and muqasama as one male sibling.", {
			alternatives: ["ONE_THIRD_OF_ESTATE", "MUQASAMA"],
			comparison: "EXACT_MAX"
		}),
		definition("KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON", "KZ-FR-020", "GRANDFATHER_COMPARISON", ["The grandfather competes with eligible full or paternal siblings after other fixed shares."], ["A pre-grandfather remainder at or below 1/6 uses KZ-FR-021."], "Choose the greatest of 1/6 of the estate, 1/3 of the remainder, and muqasama of the remainder.", {
			alternatives: [
				"ONE_SIXTH_OF_ESTATE",
				"ONE_THIRD_OF_REMAINDER",
				"MUQASAMA_OF_REMAINDER"
			],
			comparison: "EXACT_MAX"
		}),
		definition("KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION", "KZ-FR-020", "GRANDFATHER_SIBLING_DISTRIBUTION", ["The grandfather's selected share leaves a residue for eligible full or paternal siblings."], ["Mu‘adda changes the final sibling-class priority."], "Divide the post-grandfather sibling residue at two units per brother and one per sister.", {
			ratio: "2:1",
			maleCategories: ["FULL_BROTHER", "PATERNAL_BROTHER"],
			femaleCategories: ["FULL_SISTER", "PATERNAL_SISTER"]
		}),
		definition("KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION", "KZ-FR-021", "GRANDFATHER_EXHAUSTION", ["Other fixed shares leave none, less than 1/6, or exactly 1/6 before the grandfather."], ["A remainder greater than 1/6 returns to KZ-FR-020."], "Assign the grandfather 1/6, apply exact awl if needed, and give competing siblings zero.", {
			fixedShare: "1/6",
			siblingsReceive: "ZERO",
			awl: "WHEN_REQUIRED"
		}),
		definition("KZ-FR-022-MUADDA-FULL-MALE-LINE", "KZ-FR-022", "MUADDA", ["Grandfather, both full and paternal sibling classes, and at least one full brother are present."], ["The full-sisters-only completion branches remain unsupported."], "Count both sibling classes in the grandfather comparison, then distribute the sibling residue only to the full sibling line at 2:1.", {
			comparisonCounts: "FULL_AND_PATERNAL",
			finalRecipients: "FULL_SIBLINGS",
			paternalSiblingsReceive: "ZERO"
		}),
		definition("KZ-FR-022-MUADDA-ONE-FULL-SISTER-WORKED-BRANCH", "KZ-FR-022", "MUADDA", [
			"Exactly one paternal grandfather, one full sister, one paternal brother, and one paternal sister are present.",
			"No other heir is present.",
			"Both sibling lines count in the grandfather comparison."
		], ["Any additional or missing heir is outside this exact worked branch.", "Cases with another fixed-share heir remain unsupported."], "The grandfather receives 1/3, the full sister completes to 1/2, and the remaining 1/6 passes to the paternal brother and sister at 2:1.", {
			exactComposition: {
				PATERNAL_GRANDFATHER: 1,
				FULL_SISTER: 1,
				PATERNAL_BROTHER: 1,
				PATERNAL_SISTER: 1
			},
			finalShares: {
				PATERNAL_GRANDFATHER: "1/3",
				FULL_SISTER: "1/2",
				PATERNAL_BROTHER: "1/9",
				PATERNAL_SISTER: "1/18"
			}
		}),
		definition("KZ-FR-022-MUADDA-TWO-FULL-SISTERS-WORKED-BRANCH", "KZ-FR-022", "MUADDA", [
			"Exactly one paternal grandfather, two full sisters, and one paternal brother are present.",
			"No other heir is present.",
			"Both sibling lines count in the grandfather comparison."
		], ["Any additional or missing heir is outside this exact worked branch.", "Cases with another fixed-share heir remain unsupported."], "The grandfather receives 1/3, the two full sisters receive 2/3 collectively, and the paternal brother receives zero.", {
			exactComposition: {
				PATERNAL_GRANDFATHER: 1,
				FULL_SISTER: 2,
				PATERNAL_BROTHER: 1
			},
			finalShares: {
				PATERNAL_GRANDFATHER: "1/3",
				FULL_SISTER: "2/3",
				PATERNAL_BROTHER: "0"
			}
		}),
		definition("KZ-FR-023-AKDARIYYA-FULL-SISTER", "KZ-FR-023", "AKDARIYYA", ["Exactly husband, mother, paternal grandfather, and one full sister are present."], ["Any missing or additional heir prevents this detector."], "Awl the initial shares to 9, combine grandfather and sister, split 2:1, and correct to 27.", {
			sisterCategory: "FULL_SISTER",
			finalShares: {
				HUSBAND: "9/27",
				MOTHER: "6/27",
				PATERNAL_GRANDFATHER: "8/27",
				FULL_SISTER: "4/27"
			}
		}),
		definition("KZ-FR-023-AKDARIYYA-PATERNAL-SISTER", "KZ-FR-023", "AKDARIYYA", ["Exactly husband, mother, paternal grandfather, and one paternal sister are present."], ["Any missing or additional heir prevents this detector."], "Awl the initial shares to 9, combine grandfather and sister, split 2:1, and correct to 27.", {
			sisterCategory: "PATERNAL_SISTER",
			finalShares: {
				HUSBAND: "9/27",
				MOTHER: "6/27",
				PATERNAL_GRANDFATHER: "8/27",
				PATERNAL_SISTER: "4/27"
			}
		})
	];
	function advancedRuleDefinition(ruleId) {
		const found = ADVANCED_RULE_DEFINITIONS.find((item) => item.ruleId === ruleId);
		if (found === void 0) throw new Error(`Unknown advanced rule definition: ${ruleId}`);
		return found;
	}
	var sourceReferences = (definition) => [{
		sourceId: "KANZ_AL_RAGHIBIN_MAHALLI_DAR_AL_MINHAJ_2013_V2_P3",
		evidenceRecordId: definition.parentResearchRuleId,
		locator: definition.parentResearchRuleId === "KZ-FR-016" ? "Printed page 142; local PDF page 13." : definition.parentResearchRuleId === "KZ-FR-018" ? "Printed pages 143–144; local PDF pages 14–15." : definition.parentResearchRuleId === "KZ-FR-020" || definition.parentResearchRuleId === "KZ-FR-021" ? "Printed page 146; local PDF page 17." : "Printed page 147; local PDF page 18."
	}, {
		sourceId: "KHULASAT_AL_FIQH_AL_ISLAMI",
		evidenceRecordId: definition.ruleId.includes("WORKED-BRANCH") ? REMAINING_GAPS_SOURCE_COMPARISON_ID : ADVANCED_SOURCE_COMPARISON_ID,
		locator: definition.parentResearchRuleId === "KZ-FR-018" ? "Printed page 274, footnote 1." : definition.parentResearchRuleId === "KZ-FR-016" ? "Printed pages 290–291." : definition.parentResearchRuleId === "KZ-FR-023" ? "Printed pages 274 and 294." : "Printed pages 291–293."
	}];
	function defineAdvancedProductionRule(ruleId) {
		const item = advancedRuleDefinition(ruleId);
		return defineProductionRule({
			...item,
			lifecycleStatus: "PRODUCTION",
			executable: true,
			sourceReferences: sourceReferences(item),
			admissionRecordId: `ADMISSION-20260810-${ruleId}`
		});
	}
	//#endregion
	//#region src/rules/generated/production-registry.ts
	var PRODUCTION_RULES = [
		productionRule$109,
		productionRule$108,
		productionRule$107,
		productionRule$106,
		productionRule$105,
		productionRule$104,
		productionRule$103,
		productionRule$102,
		productionRule$101,
		productionRule$100,
		productionRule$99,
		productionRule$98,
		productionRule$97,
		productionRule$96,
		productionRule$95,
		productionRule$94,
		productionRule$93,
		productionRule$92,
		productionRule$91,
		productionRule$90,
		productionRule$89,
		productionRule$88,
		productionRule$87,
		productionRule$86,
		productionRule$85,
		productionRule$84,
		productionRule$83,
		productionRule$82,
		productionRule$81,
		productionRule$80,
		productionRule$79,
		productionRule$78,
		productionRule$77,
		productionRule$76,
		productionRule$75,
		productionRule$74,
		productionRule$73,
		productionRule$72,
		productionRule$71,
		productionRule$70,
		productionRule$69,
		productionRule$68,
		productionRule$67,
		productionRule$66,
		productionRule$65,
		productionRule$64,
		productionRule$63,
		productionRule$62,
		productionRule$61,
		productionRule$60,
		productionRule$59,
		productionRule$58,
		defineAdvancedProductionRule("KZ-FR-016-PATERNAL-GRANDFATHER-BLOCKS-UTERINE-SIBLING-GROUP"),
		defineAdvancedProductionRule("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH"),
		defineAdvancedProductionRule("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE"),
		defineAdvancedProductionRule("KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY"),
		defineRemainingOrdinaryProductionRule("KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH"),
		defineRemainingOrdinaryProductionRule("KZ-FR-017-FATHER-BLOCKS-PATERNAL-GRANDMOTHER"),
		defineLineageAwareProductionRule("KZ-FR-017-LINEAGE-GRANDMOTHER-GROUP-ONE-SIXTH"),
		defineLineageAwareProductionRule("KZ-FR-017-MALE-ASCENDANT-BLOCKS-OWN-MOTHER"),
		defineRemainingOrdinaryProductionRule("KZ-FR-017-MOTHER-BLOCKS-GRANDMOTHER-GROUP"),
		defineLineageAwareProductionRule("KZ-FR-017-MOTHER-BLOCKS-LINEAGE-GRANDMOTHERS"),
		defineLineageAwareProductionRule("KZ-FR-017-NEARER-GRANDMOTHER-BLOCKS-FARTHER"),
		defineLineageAwareProductionRule("KZ-FR-017-NEARER-MATERNAL-GRANDMOTHER-BLOCKS-FARTHER-PATERNAL"),
		defineAdvancedProductionRule("KZ-FR-018-MUSHTARAKA-CANONICAL"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-FATHER-BLOCKS-MATERNAL-SISTER"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-FATHER-BLOCKS-SISTER-GROUP"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-FULL-BROTHER-BLOCKS-PATERNAL-SIBLING-GROUP"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-FULL-BROTHER-RESIDUARY"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-FULL-BROTHERS-SON-RESIDUARY"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-FULL-PATERNAL-UNCLE-RESIDUARY"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-FULL-PATERNAL-UNCLES-SON-RESIDUARY"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-FULL-SISTER-GROUP-BLOCKS-PATERNAL-SISTER"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-BLOCKS-PATERNAL-SIBLINGS"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-NEARER-ASABAH-BLOCKS-FULL-BROTHERS-SON"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-NEARER-ASABAH-BLOCKS-FULL-PATERNAL-UNCLE"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-NEARER-ASABAH-BLOCKS-FULL-PATERNAL-UNCLES-SON"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-NEARER-ASABAH-BLOCKS-PATERNAL-BROTHERS-SON"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-NEARER-ASABAH-BLOCKS-PATERNAL-UNCLE"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-NEARER-ASABAH-BLOCKS-PATERNAL-UNCLES-SON"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-PATERNAL-BROTHER-RESIDUARY"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-PATERNAL-BROTHERS-SON-RESIDUARY"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-PATERNAL-SISTER-GROUP-WITH-FULL-SISTER-ONE-SIXTH"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-PATERNAL-UNCLE-RESIDUARY"),
		defineExtendedResiduaryProductionRule("KZ-FR-019-PATERNAL-UNCLES-SON-RESIDUARY"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-SON-BLOCKS-MATERNAL-SISTER"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-SON-BLOCKS-SISTER-GROUP"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-SONS-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-SONS-SON-BLOCKS-FULL-PATERNAL-SIBLINGS"),
		defineRemainingOrdinaryProductionRule("KZ-FR-019-SONS-SON-BLOCKS-UTERINE-SIBLING-GROUP"),
		defineAdvancedProductionRule("KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION"),
		defineAdvancedProductionRule("KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON"),
		defineAdvancedProductionRule("KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON"),
		defineAdvancedProductionRule("KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION"),
		defineAdvancedProductionRule("KZ-FR-022-MUADDA-FULL-MALE-LINE"),
		defineAdvancedProductionRule("KZ-FR-022-MUADDA-ONE-FULL-SISTER-WORKED-BRANCH"),
		defineAdvancedProductionRule("KZ-FR-022-MUADDA-TWO-FULL-SISTERS-WORKED-BRANCH"),
		defineAdvancedProductionRule("KZ-FR-023-AKDARIYYA-FULL-SISTER"),
		defineAdvancedProductionRule("KZ-FR-023-AKDARIYYA-PATERNAL-SISTER"),
		defineExtendedResiduaryProductionRule("KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE"),
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
		"SONS_SON",
		"SONS_DAUGHTER",
		"MATERNAL_GRANDMOTHER",
		"PATERNAL_GRANDMOTHER",
		"FULL_BROTHER",
		"PATERNAL_BROTHER",
		"MATERNAL_BROTHER",
		"MATERNAL_SISTER",
		"FULL_SISTER",
		"PATERNAL_SISTER"
	]);
	var ADMITTED_EXTENDED_RESIDUARY_TYPES = /* @__PURE__ */ new Set([
		...EXTENDED_NASAB_RESIDUARY_ORDER,
		"MALE_EMANCIPATOR",
		"FEMALE_EMANCIPATOR"
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
	/** Pure whole-case gate. Every required atom must exist in the generated production registry. */
	function evaluateWholeCaseCoverage(input, corpus = DEFAULT_PRODUCTION_CORPUS) {
		const invalidFields = [];
		for (const [index, heir] of input.heirs.entries()) if (!heirTypeSet.has(heir.type) || !Number.isInteger(heir.count) || heir.count < 0) invalidFields.push(`heirs[${index}]`);
		const lineageResolution = invalidFields.length === 0 ? resolveLineageHierarchy(input.heirs) : {
			normalizedHeirs: [],
			blockedHeirs: [],
			requiredRuleIds: [],
			issues: [],
			unsupportedReasons: []
		};
		const normalizedHeirs = lineageResolution.normalizedHeirs;
		const selectedCount = (type) => normalizedHeirs.filter((heir) => heir.type === type).reduce((total, heir) => total + heir.count, 0);
		if (selectedCount("HUSBAND") > 1) invalidFields.push("heirs.HUSBAND");
		if (selectedCount("WIFE") > 4) invalidFields.push("heirs.WIFE");
		if (selectedCount("FATHER") > 1) invalidFields.push("heirs.FATHER");
		if (selectedCount("MOTHER") > 1) invalidFields.push("heirs.MOTHER");
		for (const heir of normalizedHeirs.filter(({ type }) => type === "MATERNAL_GRANDMOTHER" || type === "PATERNAL_GRANDMOTHER")) if (heir.count > 1) invalidFields.push(`heirs.${heir.heirId}`);
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
			blockedHeirs: [...lineageResolution.blockedHeirs],
			requiresAwl: false,
			advancedCase: null
		};
		if (lineageResolution.issues.length > 0) return wholeCaseResult("INVALID_INPUT", normalizedHeirs, {
			...base,
			invalidFields: lineageResolution.issues.map((issue) => `heirs.lineage:${issue}`),
			reasons: [...new Set(lineageResolution.issues)]
		});
		if (invalidFields.length > 0) return wholeCaseResult("INVALID_INPUT", normalizedHeirs, base);
		if (normalizedHeirs.length === 0) return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
			...base,
			missingFields: ["heirs"],
			reasons: ["NO_HEIRS_SELECTED"]
		});
		const productionIds = new Set(corpus.rules.map((rule) => rule.ruleId));
		if (lineageResolution.unsupportedReasons.length > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			reasons: lineageResolution.unsupportedReasons,
			requiredRuleIds: lineageResolution.requiredRuleIds
		});
		if (input.uncertainDeathOrder === true) {
			const safetyRuleId = "KZ-FR-024-UNCERTAIN-DEATH-ORDER-SAFETY-GATE";
			const admitted = productionIds.has(safetyRuleId);
			return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				supportedRuleIds: admitted ? [safetyRuleId] : [],
				requiredRuleIds: [safetyRuleId],
				reasons: [admitted ? "UNCERTAIN_DEATH_ORDER_REQUIRES_REVIEW" : `RULE_NOT_ADMITTED:${safetyRuleId}`]
			});
		}
		if ((input.unresolvedFacts?.length ?? 0) > 0) return wholeCaseResult("MISSING_INFORMATION", normalizedHeirs, {
			...base,
			missingFields: [...input.unresolvedFacts ?? []],
			reasons: ["UNRESOLVED_CASE_FACTS"]
		});
		const advancedCase = detectAdvancedCase(normalizedHeirs);
		base.advancedCase = advancedCase;
		if (advancedCase?.kind === "UNSUPPORTED_ADVANCED") return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			reasons: [advancedCase.reason]
		});
		if (advancedCase?.kind === "AKDARIYYA") {
			const requiredRuleIds = [
				"KZ-FR-005-HUSBAND-ONE-HALF",
				advancedCase.ruleId,
				ORIGINAL_ASL_RULE_ID,
				AWL_RULE_ID,
				"KZ-FR-029-SINGLE-CLASS-CORRECTION"
			];
			const missing = requiredRuleIds.filter((id) => !productionIds.has(id));
			return wholeCaseResult(missing.length === 0 ? "SUPPORTED" : "UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				requiredRuleIds,
				supportedRuleIds: missing.length === 0 ? requiredRuleIds : [],
				reasons: missing.map((id) => `RULE_NOT_ADMITTED:${id}`),
				requiresAwl: true
			});
		}
		if (advancedCase?.kind === "MUSHTARAKA") {
			const requiredRuleIds = [
				"KZ-FR-005-HUSBAND-ONE-HALF",
				advancedCase.ascendantType === "MOTHER" ? "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS" : "KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH",
				advancedCase.ruleId,
				ORIGINAL_ASL_RULE_ID
			];
			const missing = requiredRuleIds.filter((id) => !productionIds.has(id));
			return wholeCaseResult(missing.length === 0 ? "SUPPORTED" : "UNSUPPORTED_RULE", normalizedHeirs, {
				...base,
				requiredRuleIds,
				supportedRuleIds: missing.length === 0 ? requiredRuleIds : [],
				reasons: missing.map((id) => `RULE_NOT_ADMITTED:${id}`)
			});
		}
		const siblingCount = [...SIBLING_TYPES].reduce((total, type) => total + selectedCount(type), 0);
		const hasGrandfather = selectedCount("PATERNAL_GRANDFATHER") > 0;
		const grandfatherSiblingCase = advancedCase?.kind === "GRANDFATHER_WITH_SIBLINGS" || advancedCase?.kind === "MUADDA";
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
				"SONS_DAUGHTER",
				"KZ-FR-013-SON-BLOCKS-SONS-DAUGHTER"
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
			],
			[
				"FATHER",
				"FULL_SISTER",
				"KZ-FR-019-FATHER-BLOCKS-SISTER-GROUP"
			],
			[
				"FATHER",
				"PATERNAL_SISTER",
				"KZ-FR-019-FATHER-BLOCKS-SISTER-GROUP"
			],
			[
				"FATHER",
				"MATERNAL_SISTER",
				"KZ-FR-019-FATHER-BLOCKS-MATERNAL-SISTER"
			],
			[
				"SON",
				"FULL_SISTER",
				"KZ-FR-019-SON-BLOCKS-SISTER-GROUP"
			],
			[
				"SON",
				"PATERNAL_SISTER",
				"KZ-FR-019-SON-BLOCKS-SISTER-GROUP"
			],
			[
				"SON",
				"MATERNAL_SISTER",
				"KZ-FR-019-SON-BLOCKS-MATERNAL-SISTER"
			],
			[
				"PATERNAL_GRANDFATHER",
				"MATERNAL_BROTHER",
				"KZ-FR-016-PATERNAL-GRANDFATHER-BLOCKS-UTERINE-SIBLING-GROUP"
			],
			[
				"PATERNAL_GRANDFATHER",
				"MATERNAL_SISTER",
				"KZ-FR-016-PATERNAL-GRANDFATHER-BLOCKS-UTERINE-SIBLING-GROUP"
			],
			[
				"DAUGHTER",
				"MATERNAL_BROTHER",
				"KZ-FR-019-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"
			],
			[
				"DAUGHTER",
				"MATERNAL_SISTER",
				"KZ-FR-019-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"
			],
			[
				"SONS_DAUGHTER",
				"MATERNAL_BROTHER",
				"KZ-FR-019-SONS-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"
			],
			[
				"SONS_DAUGHTER",
				"MATERNAL_SISTER",
				"KZ-FR-019-SONS-DAUGHTER-BLOCKS-UTERINE-SIBLING-GROUP"
			]
		];
		const blockedHeirs = [...lineageResolution.blockedHeirs, ...blockerPairs.flatMap(([blockerType, type, ruleId]) => {
			const blockedCount = selectedCount(type);
			return selectedCount(blockerType) > 0 && blockedCount > 0 && productionIds.has(ruleId) ? [{
				type,
				count: blockedCount,
				blockerType,
				ruleId,
				reason: `${type} is totally excluded by ${blockerType}.`
			}] : [];
		})];
		const addBlocked = (blockerType, type, ruleId, applies) => {
			if (!applies || selectedCount(type) === 0 || !productionIds.has(ruleId)) return;
			if (blockedHeirs.some((heir) => heir.type === type)) return;
			blockedHeirs.push({
				type,
				count: selectedCount(type),
				blockerType,
				ruleId,
				reason: `${type} is totally excluded by ${blockerType}.`
			});
		};
		const noDirectSon = selectedCount("SON") === 0;
		for (const type of [
			"FULL_BROTHER",
			"FULL_SISTER",
			"PATERNAL_BROTHER",
			"PATERNAL_SISTER"
		]) addBlocked("SONS_SON", type, "KZ-FR-019-SONS-SON-BLOCKS-FULL-PATERNAL-SIBLINGS", noDirectSon && selectedCount("SONS_SON") > 0);
		for (const type of ["MATERNAL_BROTHER", "MATERNAL_SISTER"]) addBlocked("SONS_SON", type, "KZ-FR-019-SONS-SON-BLOCKS-UTERINE-SIBLING-GROUP", noDirectSon && selectedCount("SONS_SON") > 0);
		for (const type of ["PATERNAL_BROTHER", "PATERNAL_SISTER"]) addBlocked("FULL_BROTHER", type, "KZ-FR-019-FULL-BROTHER-BLOCKS-PATERNAL-SIBLING-GROUP", !grandfatherSiblingCase && selectedCount("FULL_BROTHER") > 0 && selectedCount("FATHER") === 0 && selectedCount("SON") === 0 && selectedCount("SONS_SON") === 0);
		addBlocked("DAUGHTER", "SONS_DAUGHTER", "KZ-FR-013-DAUGHTER-GROUP-BLOCKS-SONS-DAUGHTER", selectedCount("DAUGHTER") >= 2 && selectedCount("SONS_SON") === 0);
		const femaleDescendantPresent = selectedCount("DAUGHTER") + selectedCount("SONS_DAUGHTER") > 0;
		const fullSisterResiduary = !grandfatherSiblingCase && selectedCount("FULL_SISTER") > 0 && selectedCount("FULL_BROTHER") === 0 && selectedCount("FATHER") === 0 && selectedCount("SON") === 0 && selectedCount("SONS_SON") === 0 && femaleDescendantPresent;
		for (const type of ["PATERNAL_BROTHER", "PATERNAL_SISTER"]) addBlocked("FULL_SISTER", type, "KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-BLOCKS-PATERNAL-SIBLINGS", fullSisterResiduary);
		const paternalSisterResiduary = !grandfatherSiblingCase && selectedCount("PATERNAL_SISTER") > 0 && selectedCount("PATERNAL_BROTHER") === 0 && selectedCount("FULL_BROTHER") === 0 && selectedCount("FULL_SISTER") === 0 && selectedCount("FATHER") === 0 && selectedCount("SON") === 0 && selectedCount("SONS_SON") === 0 && femaleDescendantPresent;
		const nearerCoreNasabResiduary = () => {
			if (selectedCount("SON") > 0) return "SON";
			if (selectedCount("SONS_SON") > 0) return "SONS_SON";
			if (selectedCount("FATHER") > 0) return "FATHER";
			if (selectedCount("PATERNAL_GRANDFATHER") > 0) return "PATERNAL_GRANDFATHER";
			if (selectedCount("FULL_BROTHER") > 0) return "FULL_BROTHER";
			if (fullSisterResiduary) return "FULL_SISTER";
			if (selectedCount("PATERNAL_BROTHER") > 0) return "PATERNAL_BROTHER";
			if (paternalSisterResiduary) return "PATERNAL_SISTER";
			return null;
		};
		const coreNasabBlocker = nearerCoreNasabResiduary();
		for (const [index, type] of EXTENDED_NASAB_RESIDUARY_ORDER.entries()) {
			if (selectedCount(type) === 0) continue;
			const nearerExtended = EXTENDED_NASAB_RESIDUARY_ORDER.slice(0, index).find((candidate) => selectedCount(candidate) > 0);
			const blockerType = coreNasabBlocker ?? nearerExtended;
			if (blockerType !== void 0 && blockerType !== null) addBlocked(blockerType, type, `KZ-FR-019-NEARER-ASABAH-BLOCKS-${type.replaceAll("_", "-")}`, true);
		}
		if (selectedCount("MALE_EMANCIPATOR") + selectedCount("FEMALE_EMANCIPATOR") > 1) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			blockedHeirs,
			reasons: ["MULTIPLE_EMANCIPATORS_NOT_ADMITTED"]
		});
		const nearestExtendedResiduary = EXTENDED_NASAB_RESIDUARY_ORDER.find((candidate) => selectedCount(candidate) > 0 && !blockedHeirs.some((heir) => heir.type === candidate));
		const walaBlocker = coreNasabBlocker ?? nearestExtendedResiduary;
		if (walaBlocker !== void 0 && walaBlocker !== null) for (const type of ["MALE_EMANCIPATOR", "FEMALE_EMANCIPATOR"]) addBlocked(walaBlocker, type, "KZ-FR-002-NASAB-ASABAH-BLOCKS-EMANCIPATOR", selectedCount(type) > 0);
		addBlocked("FULL_SISTER", "PATERNAL_SISTER", "KZ-FR-019-FULL-SISTER-GROUP-BLOCKS-PATERNAL-SISTER", selectedCount("FULL_SISTER") >= 2 && selectedCount("PATERNAL_BROTHER") === 0);
		if (advancedCase?.kind === "MUADDA") {
			if (advancedCase.mode === "FULL_MALE_LINE") for (const type of ["PATERNAL_BROTHER", "PATERNAL_SISTER"]) addBlocked("FULL_BROTHER", type, advancedCase.ruleId, selectedCount(type) > 0);
			else if (advancedCase.mode === "TWO_FULL_SISTERS_WORKED_BRANCH") addBlocked("FULL_SISTER", "PATERNAL_BROTHER", advancedCase.ruleId, selectedCount("PATERNAL_BROTHER") > 0);
		}
		const blockedTypes = new Set(blockedHeirs.filter((heir) => heir.partialLineageBlock !== true).map((heir) => heir.type));
		const selectedHasDescendant = selectedCount("SON") + selectedCount("DAUGHTER") + selectedCount("SONS_SON") + selectedCount("SONS_DAUGHTER") > 0;
		if (selectedCount("MOTHER") > 0 && !selectedHasDescendant && siblingCount >= 2 && blockedHeirs.some((heir) => SIBLING_TYPES.has(heir.type))) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			blockedHeirs,
			reasons: ["MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED"]
		});
		const supportedTypes = /* @__PURE__ */ new Set([
			...DIRECT_FAMILY_TYPES,
			...ADMITTED_EXTENDED_FIXED_SHARE_TYPES,
			...ADMITTED_EXTENDED_RESIDUARY_TYPES,
			"PATERNAL_GRANDFATHER"
		]);
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
		const count = (type) => eligibleHeirs.filter((heir) => heir.type === type).reduce((total, heir) => total + heir.count, 0);
		const hasDescendant = count("SON") + count("DAUGHTER") + count("SONS_SON") + count("SONS_DAUGHTER") > 0;
		const hasFemaleDescendant = count("DAUGHTER") + count("SONS_DAUGHTER") > 0;
		const uterineCount = count("MATERNAL_BROTHER") + count("MATERNAL_SISTER");
		const interactionReasons = [];
		if (count("SONS_DAUGHTER") > 0) {
			if (count("SONS_SON") > 0 && selectedCount("SON") > 0) interactionReasons.push("DESCENDANT_BLOCKER_CONFLICT");
		}
		if (uterineCount > 0) {
			if (hasDescendant || count("FATHER") > 0 || hasGrandfather) interactionReasons.push("UTERINE_SIBLING_BLOCKER_RELATIONSHIP_NOT_ADMITTED_FOR_SELECTED_CLASS");
		}
		if (interactionReasons.length > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
			...base,
			blockedHeirs,
			reasons: [...new Set(interactionReasons)]
		});
		const hasSon = count("SON") > 0;
		const hasMaleDescendant = hasSon || count("SONS_SON") > 0;
		const hasDaughter = hasFemaleDescendant;
		const activeTypes = [...new Set(eligibleHeirs.map((heir) => heir.type))];
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
			if (count("FATHER") > 0) if (hasMaleDescendant) {
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
			if (count("PATERNAL_GRANDFATHER") > 0 && !grandfatherSiblingCase) if (hasMaleDescendant) {
				requiredRuleIds.push("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			} else if (hasDaughter) {
				requiredRuleIds.push("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE");
				fixedShares.push(new Fraction(1n, 6n));
				hasResiduary = true;
			} else {
				requiredRuleIds.push("KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY");
				hasResiduary = true;
			}
			if (hasSon && count("DAUGHTER") > 0) {
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
			const sonLineHeirs = eligibleHeirs.filter((heir) => descendantGeneration(heir) !== null);
			const deeperSonLine = sonLineHeirs.some((heir) => (descendantGeneration(heir) ?? 0) > 1);
			const nearestSonLineMaleGeneration = sonLineHeirs.filter((heir) => heir.type === "SONS_SON").reduce((nearest, heir) => {
				const generation = descendantGeneration(heir);
				if (generation === null) return nearest;
				return nearest === null || generation < nearest ? generation : nearest;
			}, null);
			const femaleJoinsSonLineResidue = nearestSonLineMaleGeneration !== null && (count("DAUGHTER") >= 2 || sonLineHeirs.some((heir) => heir.type === "SONS_DAUGHTER" && descendantGeneration(heir) === nearestSonLineMaleGeneration));
			if (count("SONS_SON") > 0 && count("SONS_DAUGHTER") > 0) {
				if (femaleJoinsSonLineResidue) requiredRuleIds.push(deeperSonLine || count("DAUGHTER") >= 2 ? LINEAGE_RULE_IDS.descendantTwoToOne : "KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE");
				else {
					requiredRuleIds.push(deeperSonLine ? LINEAGE_RULE_IDS.deeperMaleResidue : "KZ-FR-013-SONS-SON-GROUP-RESIDUARY");
					if (count("DAUGHTER") === 0) {
						requiredRuleIds.push(count("SONS_DAUGHTER") === 1 ? LINEAGE_RULE_IDS.deeperFemaleHalf : LINEAGE_RULE_IDS.deeperFemaleTwoThirds);
						fixedShares.push(count("SONS_DAUGHTER") === 1 ? new Fraction(1n, 2n) : new Fraction(2n, 3n));
					} else if (count("DAUGHTER") === 1) {
						requiredRuleIds.push(LINEAGE_RULE_IDS.deeperFemaleComplement);
						fixedShares.push(new Fraction(1n, 6n));
					}
				}
				hasResiduary = true;
			} else if (count("SONS_SON") > 0) {
				requiredRuleIds.push(deeperSonLine ? LINEAGE_RULE_IDS.deeperMaleResidue : "KZ-FR-013-SONS-SON-GROUP-RESIDUARY");
				hasResiduary = true;
			} else if (count("SONS_DAUGHTER") === 1 && count("DAUGHTER") === 0) {
				requiredRuleIds.push(deeperSonLine ? LINEAGE_RULE_IDS.deeperFemaleHalf : "KZ-FR-005-ONE-SONS-DAUGHTER-ONE-HALF");
				fixedShares.push(new Fraction(1n, 2n));
			} else if (count("SONS_DAUGHTER") >= 2 && count("DAUGHTER") === 0) {
				requiredRuleIds.push(deeperSonLine ? LINEAGE_RULE_IDS.deeperFemaleTwoThirds : "KZ-FR-008-SONS-DAUGHTER-GROUP-TWO-THIRDS");
				fixedShares.push(new Fraction(2n, 3n));
			} else if (count("SONS_DAUGHTER") === 1 && count("DAUGHTER") === 1) {
				requiredRuleIds.push(deeperSonLine ? LINEAGE_RULE_IDS.deeperFemaleComplement : "KZ-FR-010-ONE-SONS-DAUGHTER-WITH-DAUGHTER-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			} else if (count("SONS_DAUGHTER") >= 2 && count("DAUGHTER") === 1) {
				requiredRuleIds.push(deeperSonLine ? LINEAGE_RULE_IDS.deeperFemaleComplement : "KZ-FR-013-SONS-DAUGHTER-GROUP-WITH-DAUGHTER-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			}
			if (uterineCount === 1) {
				requiredRuleIds.push("KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			} else if (uterineCount >= 2) {
				requiredRuleIds.push(count("MATERNAL_BROTHER") > 0 && count("MATERNAL_SISTER") > 0 ? "KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL" : "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD");
				fixedShares.push(new Fraction(1n, 3n));
			}
			const fullSisterWithFemaleDescendant = count("FULL_SISTER") > 0 && count("FULL_BROTHER") === 0 && hasFemaleDescendant && !hasMaleDescendant;
			if (grandfatherSiblingCase) {} else if (count("FULL_BROTHER") > 0 && count("FULL_SISTER") > 0) {
				requiredRuleIds.push("KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE");
				hasResiduary = true;
			} else if (count("FULL_BROTHER") > 0) {
				requiredRuleIds.push("KZ-FR-019-FULL-BROTHER-RESIDUARY");
				hasResiduary = true;
			} else if (fullSisterWithFemaleDescendant) {
				requiredRuleIds.push("KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY");
				hasResiduary = true;
			} else if (count("FULL_SISTER") === 1) {
				requiredRuleIds.push("KZ-FR-005-ONE-FULL-SISTER-ONE-HALF");
				fixedShares.push(new Fraction(1n, 2n));
			} else if (count("FULL_SISTER") >= 2) {
				requiredRuleIds.push("KZ-FR-008-FULL-SISTER-GROUP-TWO-THIRDS");
				fixedShares.push(new Fraction(2n, 3n));
			}
			const paternalSisterWithFemaleDescendant = count("PATERNAL_SISTER") > 0 && count("PATERNAL_BROTHER") === 0 && count("FULL_SISTER") === 0 && hasFemaleDescendant && !hasMaleDescendant;
			if (grandfatherSiblingCase) {} else if (count("PATERNAL_BROTHER") > 0 && count("PATERNAL_SISTER") > 0) {
				requiredRuleIds.push("KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE");
				hasResiduary = true;
			} else if (count("PATERNAL_BROTHER") > 0) {
				requiredRuleIds.push("KZ-FR-019-PATERNAL-BROTHER-RESIDUARY");
				hasResiduary = true;
			} else if (paternalSisterWithFemaleDescendant) {
				requiredRuleIds.push("KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY");
				hasResiduary = true;
			} else if (count("PATERNAL_SISTER") > 0 && count("FULL_SISTER") === 0) {
				requiredRuleIds.push(count("PATERNAL_SISTER") === 1 ? "KZ-FR-005-ONE-PATERNAL-SISTER-ONE-HALF" : "KZ-FR-008-PATERNAL-SISTER-GROUP-TWO-THIRDS");
				fixedShares.push(count("PATERNAL_SISTER") === 1 ? new Fraction(1n, 2n) : new Fraction(2n, 3n));
			} else if (count("PATERNAL_SISTER") > 0 && count("FULL_SISTER") === 1) {
				requiredRuleIds.push(count("PATERNAL_SISTER") === 1 ? "KZ-FR-010-ONE-PATERNAL-SISTER-WITH-FULL-SISTER-ONE-SIXTH" : "KZ-FR-019-PATERNAL-SISTER-GROUP-WITH-FULL-SISTER-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			}
			if (count("MATERNAL_GRANDMOTHER") + count("PATERNAL_GRANDMOTHER") > 0) {
				const hasFartherGrandmother = eligibleHeirs.some((heir) => (grandmotherDegree(heir) ?? 0) > 2);
				requiredRuleIds.push(hasFartherGrandmother ? LINEAGE_RULE_IDS.grandmotherShare : "KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH");
				fixedShares.push(new Fraction(1n, 6n));
			}
			if (grandfatherSiblingCase) {
				const preGrandfatherFixedTotal = sumFractions(fixedShares);
				if (preGrandfatherFixedTotal.isZero()) {
					requiredRuleIds.push("KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON");
					if (advancedCase?.kind !== "MUADDA" || advancedCase.mode === "FULL_MALE_LINE") requiredRuleIds.push("KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION");
					hasResiduary = true;
				} else if (Fraction.ONE.subtract(preGrandfatherFixedTotal).compare(new Fraction(1n, 6n)) <= 0) {
					if (count("MOTHER") > 0) return wholeCaseResult("UNSUPPORTED_RULE", normalizedHeirs, {
						...base,
						blockedHeirs,
						requiredRuleIds,
						reasons: ["MOTHER_BLOCKED_SIBLING_COUNT_NOT_ADMITTED"]
					});
					requiredRuleIds.push("KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION");
					fixedShares.push(new Fraction(1n, 6n));
					for (const type of [
						"FULL_BROTHER",
						"FULL_SISTER",
						"PATERNAL_BROTHER",
						"PATERNAL_SISTER"
					]) {
						const blockedCount = selectedCount(type);
						if (blockedCount > 0 && !blockedHeirs.some((heir) => heir.type === type)) blockedHeirs.push({
							type,
							count: blockedCount,
							blockerType: "PATERNAL_GRANDFATHER",
							ruleId: "KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION",
							reason: `${type} receives zero because the fixed shares leave at most the grandfather's 1/6.`
						});
					}
				} else {
					requiredRuleIds.push("KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON", "KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION");
					hasResiduary = true;
				}
				if (advancedCase?.kind === "MUADDA") requiredRuleIds.push(advancedCase.ruleId);
			}
			for (const type of EXTENDED_NASAB_RESIDUARY_ORDER) {
				if (count(type) === 0) continue;
				requiredRuleIds.push(`KZ-FR-019-${type.replaceAll("_", "-")}-RESIDUARY`);
				hasResiduary = true;
			}
			for (const type of ["MALE_EMANCIPATOR", "FEMALE_EMANCIPATOR"]) {
				if (count(type) === 0) continue;
				requiredRuleIds.push("KZ-FR-002-EMANCIPATOR-RESIDUARY");
				hasResiduary = true;
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
				"MATERNAL_GRANDMOTHER",
				"PATERNAL_GRANDMOTHER",
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
		if (ruleId.includes("PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS")) return "A female descendant exists without a male descendant; the grandfather takes 1/6 plus residue.";
		if (ruleId.includes("PATERNAL-GRANDFATHER-ONE-SIXTH")) return "An eligible male descendant exists, so the grandfather takes 1/6.";
		if (ruleId.includes("MOTHER-ONE-SIXTH-SIBLINGS")) return "At least two unblocked siblings are present in this admitted subset.";
		if (ruleId.includes("MOTHER-ONE-SIXTH")) return "A qualifying descendant exists.";
		if (ruleId.includes("MOTHER-ONE-THIRD")) return "No qualifying descendant or admitted sibling condition applies.";
		if (ruleId.includes("ONE-DAUGHTER")) return "One daughter is present and no son is present.";
		if (ruleId.includes("DAUGHTER-GROUP")) return "Two or more daughters are present and no son is present.";
		if (ruleId.includes("FATHER-ONE-SIXTH-PLUS")) return "Female descendants are present without a male descendant.";
		if (ruleId.includes("FATHER-ONE-SIXTH")) return "A qualifying male descendant is present.";
		if (ruleId.includes("SONS-DAUGHTER") && ruleId.includes("ONE-SIXTH")) return "One direct daughter is present, so the son's daughter receives the complementary 1/6.";
		if (ruleId.includes("DEEPER-FEMALE-DESCENDANT") && ruleId.includes("COMPLEMENT")) return "The nearest eligible farther female son-line descendants complete the two-thirds ceiling with 1/6.";
		if (ruleId.includes("DEEPER-FEMALE-DESCENDANT")) return "The nearest eligible female son-line descendant generation takes the admitted fixed share.";
		if (ruleId.includes("LINEAGE-DESCENDANTS-TWO-TO-ONE")) return "The source-admitted corresponding or rescuing male-line descendant makes the eligible group residuary at 2:1.";
		if (ruleId.includes("LINEAGE-GRANDMOTHER-GROUP")) return "Eligible grandmothers share the collective 1/6 equally after lineage and degree priority.";
		if (ruleId.includes("GRANDMOTHER-GROUP")) return "Eligible immediate grandmothers share the collective 1/6 equally.";
		if (ruleId.includes("MIXED-UTERINE")) return "Eligible uterine brothers and sisters share the collective 1/3 equally.";
		if (ruleId.includes("SONS-DAUGHTER")) return "The admitted son's-daughter fixed-share conditions are satisfied.";
		if (ruleId.includes("UTERINE-SIBLING")) return "No admitted ascendant or descendant blocker is present.";
		if (ruleId.includes("FULL-SISTER") || ruleId.includes("PATERNAL-SISTER")) return "The fixed-share sister conditions are satisfied without a converting residuary or blocker.";
		if (heirType === "HUSBAND" || heirType === "WIFE") return "The spouse share follows the presence or absence of qualifying descendants.";
		return "The admitted production rule's stated conditions are satisfied.";
	}
	function correctionFor(assignments, admittedCaseBase) {
		const workingDenominator = admittedCaseBase ?? assignments.reduce((denominator, assignment) => leastCommonMultiple(denominator, assignment.fraction.denominator), 1n);
		const groupedRules = /* @__PURE__ */ new Map([
			["KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE", "TWO_TO_ONE"],
			["KZ-FR-013-LINEAGE-DESCENDANTS-TWO-TO-ONE", "TWO_TO_ONE"],
			["KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH", "EQUAL"],
			["KZ-FR-017-LINEAGE-GRANDMOTHER-GROUP-ONE-SIXTH", "EQUAL"],
			["KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE", "TWO_TO_ONE"],
			["KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE", "TWO_TO_ONE"],
			["KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL", "EQUAL"],
			["KZ-FR-018-MUSHTARAKA-CANONICAL", "EQUAL"],
			["KZ-FR-023-AKDARIYYA-FULL-SISTER", "TWO_TO_ONE"],
			["KZ-FR-023-AKDARIYYA-PATERNAL-SISTER", "TWO_TO_ONE"]
		]);
		const groupedAssignmentIds = /* @__PURE__ */ new Set();
		const correctionClasses = [];
		for (const [ruleId, division] of groupedRules) {
			const members = assignments.filter((assignment) => assignment.ruleIds.includes(ruleId) && (!ruleId.includes("AKDARIYYA") || [
				"PATERNAL_GRANDFATHER",
				"FULL_SISTER",
				"PATERNAL_SISTER"
			].includes(assignment.heirType)));
			if (members.length === 0) continue;
			members.forEach((member) => groupedAssignmentIds.add(member.heirType));
			correctionClasses.push({
				heirTypes: members.map((member) => member.heirType),
				fraction: sumFractions(members.map((member) => member.fraction)),
				units: BigInt(members.reduce((total, member) => total + member.count * (division === "TWO_TO_ONE" && (member.heirType === "SONS_SON" || member.heirType === "FULL_BROTHER" || member.heirType === "PATERNAL_BROTHER" || member.heirType === "PATERNAL_GRANDFATHER") ? 2 : 1), 0))
			});
		}
		correctionClasses.push(...assignments.filter((assignment) => !groupedAssignmentIds.has(assignment.heirType)).map((assignment) => ({
			heirTypes: [assignment.heirType],
			fraction: assignment.fraction,
			units: BigInt(assignment.count)
		})));
		const broken = correctionClasses.flatMap((correctionClass) => {
			const dividend = correctionClass.fraction.numerator * workingDenominator;
			const divisor = correctionClass.fraction.denominator * correctionClass.units;
			const factor = divisor / greatestCommonDivisor(dividend, divisor);
			if (factor === 1n) return [];
			return [{
				heirTypes: correctionClass.heirTypes,
				factor
			}];
		});
		const factor = broken.reduce((combined, item) => leastCommonMultiple(combined, item.factor), 1n);
		return {
			workingDenominator,
			correctedDenominator: workingDenominator * factor,
			factor,
			brokenClasses: broken.flatMap((item) => item.heirTypes),
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
			unresolvedFacts: input.unresolvedFacts ?? [],
			uncertainDeathOrder: input.uncertainDeathOrder ?? false
		});
		if (estateIssues.length > 0 || coverage.status !== "SUPPORTED") throw new UnsupportedInheritanceCaseError(coverage, estateIssues);
		const netEstate = afterDeductions - bequest;
		const selected = coverage.normalizedHeirs;
		const blockedTypes = new Set(coverage.blockedHeirs.filter((heir) => heir.partialLineageBlock !== true).map((heir) => heir.type));
		const eligible = selected.filter((heir) => !blockedTypes.has(heir.type));
		const count = (type) => eligible.filter((heir) => heir.type === type).reduce((total, heir) => total + heir.count, 0);
		const selectedCount = (type) => selected.filter((heir) => heir.type === type).reduce((total, heir) => total + heir.count, 0);
		const required = new Set(coverage.requiredRuleIds);
		const assignments = /* @__PURE__ */ new Map();
		const fixedShareAssignments = [];
		const residuaryAssignments = [];
		const fixedShareGroups = [];
		const addFixed = (type, share, ruleId) => {
			addAssignment(assignments, type, count(type), share, "FIXED", ruleId);
			fixedShareAssignments.push({
				heirType: type,
				fraction: share.toJSON(),
				ruleId,
				reason: fractionReason(type, ruleId)
			});
			fixedShareGroups.push({
				fraction: share,
				heirTypes: [type]
			});
		};
		const addFixedGroup = (types, groupShare, ruleId) => {
			const totalCount = types.reduce((total, type) => total + count(type), 0);
			for (const type of types) {
				const categoryCount = count(type);
				if (categoryCount === 0) continue;
				const share = groupShare.multiply(new Fraction(BigInt(categoryCount), BigInt(totalCount)));
				addAssignment(assignments, type, categoryCount, share, "FIXED", ruleId);
				fixedShareAssignments.push({
					heirType: type,
					fraction: share.toJSON(),
					ruleId,
					reason: fractionReason(type, ruleId)
				});
			}
			fixedShareGroups.push({
				fraction: groupShare,
				heirTypes: types.filter((type) => count(type) > 0)
			});
		};
		const husbandUmari = required.has("KZ-FR-015-HUSBAND-MOTHER-FATHER");
		const wifeUmariRuleId = required.has("KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER") ? "KZ-FR-015-MULTIPLE-WIVES-MOTHER-FATHER" : required.has("KZ-FR-015-WIFE-MOTHER-FATHER") ? "KZ-FR-015-WIFE-MOTHER-FATHER" : null;
		const wifeUmari = wifeUmariRuleId !== null;
		const advancedCase = coverage.advancedCase;
		if (advancedCase?.kind === "AKDARIYYA") {
			addFixed("HUSBAND", new Fraction(1n, 2n), "KZ-FR-005-HUSBAND-ONE-HALF");
			addFixed("MOTHER", new Fraction(1n, 3n), advancedCase.ruleId);
			addFixed("PATERNAL_GRANDFATHER", new Fraction(1n, 6n), advancedCase.ruleId);
			addFixed(advancedCase.sisterType, new Fraction(1n, 2n), advancedCase.ruleId);
		} else if (advancedCase?.kind === "MUSHTARAKA") {
			addFixed("HUSBAND", new Fraction(1n, 2n), "KZ-FR-005-HUSBAND-ONE-HALF");
			addFixed(advancedCase.ascendantType, new Fraction(1n, 6n), advancedCase.ascendantType === "MOTHER" ? "KZ-FR-010-MOTHER-ONE-SIXTH-SIBLINGS" : "KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH");
			addFixedGroup([
				"MATERNAL_BROTHER",
				"MATERNAL_SISTER",
				"FULL_BROTHER"
			], new Fraction(1n, 3n), advancedCase.ruleId);
		} else if (husbandUmari) {
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
			if (required.has("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH")) addFixed("PATERNAL_GRANDFATHER", new Fraction(1n, 6n), "KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH");
			if (required.has("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE")) addFixed("PATERNAL_GRANDFATHER", new Fraction(1n, 6n), "KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE");
			if (required.has("KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION")) addFixed("PATERNAL_GRANDFATHER", new Fraction(1n, 6n), "KZ-FR-021-GRANDFATHER-ONE-SIXTH-EXHAUSTION");
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
					"SONS_DAUGHTER",
					"KZ-FR-013-SONS-DAUGHTER-GROUP-WITH-DAUGHTER-ONE-SIXTH",
					new Fraction(1n, 6n)
				],
				[
					"SONS_DAUGHTER",
					"KZ-FR-013-DEEPER-FEMALE-DESCENDANT-ONE-HALF",
					new Fraction(1n, 2n)
				],
				[
					"SONS_DAUGHTER",
					"KZ-FR-013-DEEPER-FEMALE-DESCENDANT-GROUP-TWO-THIRDS",
					new Fraction(2n, 3n)
				],
				[
					"SONS_DAUGHTER",
					"KZ-FR-013-DEEPER-FEMALE-DESCENDANT-COMPLEMENT-ONE-SIXTH",
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
			const uterineRuleId = required.has("KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH") ? "KZ-FR-010-ONE-UTERINE-SIBLING-ONE-SIXTH" : required.has("KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL") ? "KZ-FR-019-MIXED-UTERINE-SIBLING-GROUP-ONE-THIRD-EQUAL" : required.has("KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD") ? "KZ-FR-009-UTERINE-SIBLING-GROUP-ONE-THIRD" : null;
			if (uterineRuleId !== null) addFixedGroup(["MATERNAL_BROTHER", "MATERNAL_SISTER"], uterineRuleId.includes("ONE-SIXTH") ? new Fraction(1n, 6n) : new Fraction(1n, 3n), uterineRuleId);
			if (required.has("KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH")) addFixedGroup(["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"], new Fraction(1n, 6n), "KZ-FR-017-ELIGIBLE-GRANDMOTHER-GROUP-ONE-SIXTH");
			if (required.has("KZ-FR-017-LINEAGE-GRANDMOTHER-GROUP-ONE-SIXTH")) addFixedGroup(["MATERNAL_GRANDMOTHER", "PATERNAL_GRANDMOTHER"], new Fraction(1n, 6n), "KZ-FR-017-LINEAGE-GRANDMOTHER-GROUP-ONE-SIXTH");
		}
		const originalFixedTotal = sumFractions(fixedShareGroups.map((group) => group.fraction));
		const originalAsl = deriveOriginalAsl(fixedShareGroups.map((group) => group.fraction));
		if (!isOriginalAslAdmitted(originalAsl, PRODUCTION_RULES)) throw new UnsupportedInheritanceCaseError(coverage, [`RULE_NOT_ADMITTED:${ORIGINAL_ASL_RULE_ID}`]);
		let awlDetails = null;
		const awlDenominator = deriveAwlDenominator(fixedShareGroups.map((group) => group.fraction), originalAsl);
		if (awlDenominator !== null) {
			if (!isAwlEndpointAdmitted(originalAsl, awlDenominator, PRODUCTION_RULES)) throw new UnsupportedInheritanceCaseError(coverage, [`AWL_ENDPOINT_NOT_ADMITTED:${originalAsl}->${awlDenominator}`]);
			const adjustments = fixedShareGroups.flatMap((group) => {
				const saham = originalSaham(group.fraction, originalAsl);
				const adjustedGroupFraction = new Fraction(saham, awlDenominator);
				return group.heirTypes.map((heirType) => {
					const assignment = assignments.get(heirType);
					if (assignment === void 0) throw new Error(`Missing fixed assignment for ${heirType}.`);
					const originalFraction = assignment.fraction;
					const adjustedFraction = adjustedGroupFraction.multiply(originalFraction.divide(group.fraction));
					assignment.fraction = adjustedFraction;
					return {
						heirType,
						originalFraction: originalFraction.toJSON(),
						originalSaham: saham.toString(),
						adjustedFraction: adjustedFraction.toJSON()
					};
				});
			});
			awlDetails = {
				originalAsl: originalAsl.toString(),
				adjustedDenominator: awlDenominator.toString(),
				originalFixedShareTotal: originalFixedTotal.toJSON(),
				adjustments,
				ruleId: AWL_RULE_ID
			};
		}
		let advancedCaseDetails = null;
		if (advancedCase?.kind === "AKDARIYYA") {
			const grandfather = assignments.get("PATERNAL_GRANDFATHER");
			const sister = assignments.get(advancedCase.sisterType);
			if (grandfather === void 0 || sister === void 0) throw new Error("Akdariyya assignments are incomplete.");
			grandfather.fraction = new Fraction(8n, 27n);
			sister.fraction = new Fraction(4n, 27n);
			advancedCaseDetails = {
				kind: "AKDARIYYA",
				sisterType: advancedCase.sisterType
			};
		} else if (advancedCase?.kind === "MUSHTARAKA") advancedCaseDetails = {
			kind: "MUSHTARAKA",
			participants: [
				"MATERNAL_BROTHER",
				"MATERNAL_SISTER",
				"FULL_BROTHER"
			].filter((type) => count(type) > 0)
		};
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
		const addWeightedShare = (totalShare, maleType, femaleType, ruleId) => {
			const maleCount = count(maleType);
			const femaleCount = count(femaleType);
			const units = BigInt(2 * maleCount + femaleCount);
			if (units === 0n) throw new Error(`No eligible recipients for ${ruleId}.`);
			const maleShare = totalShare.multiply(new Fraction(BigInt(2 * maleCount), units));
			const femaleShare = totalShare.subtract(maleShare);
			if (maleCount > 0) {
				addAssignment(assignments, maleType, maleCount, maleShare, "RESIDUARY", ruleId);
				residuaryAssignments.push({
					heirType: maleType,
					fraction: maleShare.toJSON(),
					ruleId,
					reason: `Each ${maleType} receives two weight units.`
				});
			}
			if (femaleCount > 0) {
				addAssignment(assignments, femaleType, femaleCount, femaleShare, "RESIDUARY", ruleId);
				residuaryAssignments.push({
					heirType: femaleType,
					fraction: femaleShare.toJSON(),
					ruleId,
					reason: `Each ${femaleType} receives one weight unit.`
				});
			}
		};
		const addWeightedResidue = (maleType, femaleType, ruleId) => {
			addWeightedShare(residue, maleType, femaleType, ruleId);
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
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY")) addResidue("PATERNAL_GRANDFATHER", "KZ-FR-016-PATERNAL-GRANDFATHER-RESIDUARY");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE")) addResidue("PATERNAL_GRANDFATHER", "KZ-FR-016-PATERNAL-GRANDFATHER-ONE-SIXTH-PLUS-RESIDUE");
		const grandfatherComparisonRuleId = required.has("KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON") ? "KZ-FR-020-GRANDFATHER-SIBLINGS-NO-FIXED-SHARE-COMPARISON" : required.has("KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON") ? "KZ-FR-020-GRANDFATHER-SIBLINGS-WITH-FIXED-SHARE-COMPARISON" : null;
		if (residue.compare(Fraction.ZERO) > 0 && grandfatherComparisonRuleId !== null) {
			const siblingCountForComparison = (type) => advancedCase?.kind === "MUADDA" ? selectedCount(type) : count(type);
			const siblingUnits = BigInt(2 * (siblingCountForComparison("FULL_BROTHER") + siblingCountForComparison("PATERNAL_BROTHER")) + siblingCountForComparison("FULL_SISTER") + siblingCountForComparison("PATERNAL_SISTER"));
			const muqasama = residue.multiply(new Fraction(2n, 2n + siblingUnits));
			const alternatives = grandfatherComparisonRuleId.includes("NO-FIXED") ? [{
				name: "ONE_THIRD_OF_ESTATE",
				fraction: new Fraction(1n, 3n)
			}, {
				name: "MUQASAMA",
				fraction: muqasama
			}] : [
				{
					name: "ONE_SIXTH_OF_ESTATE",
					fraction: new Fraction(1n, 6n)
				},
				{
					name: "ONE_THIRD_OF_REMAINDER",
					fraction: residue.divide(new Fraction(3n))
				},
				{
					name: "MUQASAMA_OF_REMAINDER",
					fraction: muqasama
				}
			];
			const selectedAlternative = alternatives.reduce((best, candidate) => candidate.fraction.compare(best.fraction) > 0 ? candidate : best);
			addAssignment(assignments, "PATERNAL_GRANDFATHER", count("PATERNAL_GRANDFATHER"), selectedAlternative.fraction, "RESIDUARY", grandfatherComparisonRuleId);
			residuaryAssignments.push({
				heirType: "PATERNAL_GRANDFATHER",
				fraction: selectedAlternative.fraction.toJSON(),
				ruleId: grandfatherComparisonRuleId,
				reason: `The exact comparison selected ${selectedAlternative.name}.`
			});
			const siblingResidue = residue.subtract(selectedAlternative.fraction);
			const siblingRuleId = "KZ-FR-020-GRANDFATHER-SIBLING-RESIDUE-DISTRIBUTION";
			if (siblingResidue.compare(Fraction.ZERO) > 0) if (advancedCase?.kind === "MUADDA" && advancedCase.mode === "ONE_FULL_SISTER_WORKED_BRANCH") {
				const fullSisterShare = new Fraction(1n, 2n);
				addAssignment(assignments, "FULL_SISTER", count("FULL_SISTER"), fullSisterShare, "FIXED", advancedCase.ruleId);
				fixedShareAssignments.push({
					heirType: "FULL_SISTER",
					fraction: fullSisterShare.toJSON(),
					ruleId: advancedCase.ruleId,
					reason: "In this exact Mu‘adda branch, the full sister completes her share to 1/2."
				});
				addWeightedShare(siblingResidue.subtract(fullSisterShare), "PATERNAL_BROTHER", "PATERNAL_SISTER", advancedCase.ruleId);
			} else if (advancedCase?.kind === "MUADDA" && advancedCase.mode === "TWO_FULL_SISTERS_WORKED_BRANCH") {
				const fullSisterGroupShare = new Fraction(2n, 3n);
				addAssignment(assignments, "FULL_SISTER", count("FULL_SISTER"), fullSisterGroupShare, "FIXED", advancedCase.ruleId);
				fixedShareAssignments.push({
					heirType: "FULL_SISTER",
					fraction: fullSisterGroupShare.toJSON(),
					ruleId: advancedCase.ruleId,
					reason: "In this exact Mu‘adda branch, the two full sisters complete their collective share to 2/3."
				});
			} else if (count("FULL_BROTHER") + count("FULL_SISTER") > 0) addWeightedShare(siblingResidue, "FULL_BROTHER", "FULL_SISTER", siblingRuleId);
			else addWeightedShare(siblingResidue, "PATERNAL_BROTHER", "PATERNAL_SISTER", siblingRuleId);
			const comparisonDetails = {
				alternatives: alternatives.map((alternative) => ({
					name: alternative.name,
					fraction: alternative.fraction.toJSON()
				})),
				selectedAlternative: selectedAlternative.name,
				selectedFraction: selectedAlternative.fraction.toJSON()
			};
			advancedCaseDetails = advancedCase?.kind === "MUADDA" ? {
				kind: "MUADDA",
				mode: advancedCase.mode,
				ruleId: advancedCase.ruleId,
				...comparisonDetails
			} : {
				kind: "GRANDFATHER_WITH_SIBLINGS",
				...comparisonDetails
			};
		}
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-013-SONS-SON-GROUP-RESIDUARY")) addResidue("SONS_SON", "KZ-FR-013-SONS-SON-GROUP-RESIDUARY");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-013-DEEPER-MALE-DESCENDANT-RESIDUARY")) addResidue("SONS_SON", "KZ-FR-013-DEEPER-MALE-DESCENDANT-RESIDUARY");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE")) addWeightedResidue("SONS_SON", "SONS_DAUGHTER", "KZ-FR-013-SONS-SONS-AND-DAUGHTERS-TWO-TO-ONE");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-013-LINEAGE-DESCENDANTS-TWO-TO-ONE")) addWeightedResidue("SONS_SON", "SONS_DAUGHTER", "KZ-FR-013-LINEAGE-DESCENDANTS-TWO-TO-ONE");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-FULL-BROTHER-RESIDUARY")) addResidue("FULL_BROTHER", "KZ-FR-019-FULL-BROTHER-RESIDUARY");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE")) addWeightedResidue("FULL_BROTHER", "FULL_SISTER", "KZ-FR-019-FULL-SIBLINGS-TWO-TO-ONE");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY")) addResidue("FULL_SISTER", "KZ-FR-019-FULL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-PATERNAL-BROTHER-RESIDUARY")) addResidue("PATERNAL_BROTHER", "KZ-FR-019-PATERNAL-BROTHER-RESIDUARY");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE")) addWeightedResidue("PATERNAL_BROTHER", "PATERNAL_SISTER", "KZ-FR-019-PATERNAL-SIBLINGS-TWO-TO-ONE");
		if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY")) addResidue("PATERNAL_SISTER", "KZ-FR-019-PATERNAL-SISTER-WITH-FEMALE-DESCENDANT-RESIDUARY");
		for (const type of [
			"FULL_BROTHERS_SON",
			"PATERNAL_BROTHERS_SON",
			"FULL_PATERNAL_UNCLE",
			"PATERNAL_UNCLE",
			"FULL_PATERNAL_UNCLES_SON",
			"PATERNAL_UNCLES_SON"
		]) {
			const ruleId = `KZ-FR-019-${type.replaceAll("_", "-")}-RESIDUARY`;
			if (residue.compare(Fraction.ZERO) > 0 && required.has(ruleId)) addResidue(type, ruleId);
		}
		for (const type of ["MALE_EMANCIPATOR", "FEMALE_EMANCIPATOR"]) if (residue.compare(Fraction.ZERO) > 0 && required.has("KZ-FR-002-EMANCIPATOR-RESIDUARY") && count(type) > 0) addResidue(type, "KZ-FR-002-EMANCIPATOR-RESIDUARY");
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
		const correction = correctionFor(assignmentList, raddDetails === null ? awlDenominator ?? originalAsl : void 0);
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
				summary: selected.map((heir) => `${lineageDescription(heir)} × ${heir.count}`).join(", "),
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
		if (advancedCaseDetails?.kind === "GRANDFATHER_WITH_SIBLINGS" || advancedCaseDetails?.kind === "MUADDA") {
			if (grandfatherComparisonRuleId === null) throw new Error("Grandfather comparison details require an admitted comparison rule.");
			const comparisonRuleId = grandfatherComparisonRuleId;
			explanationSteps.push({
				kind: "GRANDFATHER_COMPARISON",
				title: "Paternal grandfather — exact alternatives",
				summary: `${advancedCaseDetails.alternatives.map((alternative) => `${alternative.name}: ${alternative.fraction.numerator}/${alternative.fraction.denominator}`).join("; ")}. Selected ${advancedCaseDetails.selectedAlternative}.`,
				heirType: "PATERNAL_GRANDFATHER",
				fraction: advancedCaseDetails.selectedFraction,
				ruleIds: [comparisonRuleId],
				sourceReferences: ruleSources([comparisonRuleId])
			});
			if (advancedCaseDetails.kind === "MUADDA") explanationSteps.push({
				kind: "SPECIAL_CASE",
				title: "المعادة — Mu‘adda",
				summary: advancedCaseDetails.mode === "FULL_MALE_LINE" ? "Both sibling lines were counted in the grandfather comparison; after his share, the admitted full-brother-present branch gives the sibling residue to the full sibling line and the paternal line receives zero." : advancedCaseDetails.mode === "ONE_FULL_SISTER_WORKED_BRANCH" ? "Both sibling lines were counted in the grandfather comparison. The full sister then completed to 1/2, and the remaining 1/6 passed to the paternal brother and sister at 2:1." : "Both sibling lines were counted in the grandfather comparison. The two full sisters then completed their collective share to 2/3, leaving the paternal brother zero.",
				ruleIds: [advancedCaseDetails.ruleId],
				sourceReferences: ruleSources([advancedCaseDetails.ruleId])
			});
		} else if (advancedCaseDetails?.kind === "AKDARIYYA") {
			const ruleId = advancedCaseDetails.sisterType === "FULL_SISTER" ? "KZ-FR-023-AKDARIYYA-FULL-SISTER" : "KZ-FR-023-AKDARIYYA-PATERNAL-SISTER";
			explanationSteps.push({
				kind: "SPECIAL_CASE",
				title: "الأكدرية — Akdariyya",
				summary: "The exact four-heir detector replaces the ordinary path: initial fixed shares undergo awl to 9, then the grandfather and sister combine and divide two to one, correcting the case to 27.",
				ruleIds: [ruleId],
				sourceReferences: ruleSources([ruleId])
			});
			for (const [heirType, fraction] of [["PATERNAL_GRANDFATHER", new Fraction(8n, 27n)], [advancedCaseDetails.sisterType, new Fraction(4n, 27n)]]) explanationSteps.push({
				kind: "SPECIAL_CASE",
				title: `${heirType} — final Akdariyya share`,
				summary: "This is the final exact share after the special two-to-one redistribution.",
				heirType,
				fraction: fraction.toJSON(),
				ruleIds: [ruleId],
				sourceReferences: ruleSources([ruleId])
			});
		} else if (advancedCaseDetails?.kind === "MUSHTARAKA") explanationSteps.push({
			kind: "SPECIAL_CASE",
			title: "المشتركة — Mushtaraka",
			summary: "The canonical full brother joins the two uterine siblings in their collective one third; all three persons share it equally.",
			fraction: new Fraction(1n, 3n).toJSON(),
			ruleIds: ["KZ-FR-018-MUSHTARAKA-CANONICAL"],
			sourceReferences: ruleSources(["KZ-FR-018-MUSHTARAKA-CANONICAL"])
		});
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
			calculationType: advancedCaseDetails?.kind === "AKDARIYYA" ? "AKDARIYYA" : advancedCaseDetails?.kind === "MUSHTARAKA" ? "MUSHTARAKA" : advancedCaseDetails?.kind === "MUADDA" ? "MUADDA" : advancedCaseDetails?.kind === "GRANDFATHER_WITH_SIBLINGS" ? "GRANDFATHER_WITH_SIBLINGS" : husbandUmari || wifeUmari ? "UMARIYYATAYN" : "ORDINARY",
			advancedCaseDetails,
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