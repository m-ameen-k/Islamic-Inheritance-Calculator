import { afterEach, describe, expect, it } from "vitest";

import {
  GENERATED_REGISTRY_PATH,
  generateProductionRegistry,
} from "../../scripts/generate-production-registry.ts";
import { TemporaryRuleCorpus } from "../helpers/temporary-rule-corpus";

const corpora: TemporaryRuleCorpus[] = [];

function corpus(): TemporaryRuleCorpus {
  const value = new TemporaryRuleCorpus();
  corpora.push(value);
  return value;
}

afterEach(() => {
  corpora.splice(0).forEach((value) => value.dispose());
});

describe("TECHNICAL_TEST: generated production registry", () => {
  it("orders imports deterministically by rule ID", async () => {
    const project = corpus();
    const later = project.addRule("TEST-RULE-020");
    const earlier = project.addRule("TEST-RULE-003");
    project.writeManifest([later, earlier]);

    const rendered = await project.render();

    expect(rendered.indexOf("TEST-RULE-003")).toBeLessThan(rendered.indexOf("TEST-RULE-020"));
  });

  it("is reproducible and leaves a second generation unchanged", async () => {
    const project = corpus();
    const entry = project.addRule("TEST-RULE-001");
    project.writeManifest([entry]);

    expect(await generateProductionRegistry(project.root)).toBe(true);
    const first = project.read(GENERATED_REGISTRY_PATH);
    expect(await generateProductionRegistry(project.root)).toBe(false);
    expect(project.read(GENERATED_REGISTRY_PATH)).toBe(first);
  });
});
