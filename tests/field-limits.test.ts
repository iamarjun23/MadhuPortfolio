import assert from "node:assert/strict";
import { test } from "node:test";
import { maxAtPath } from "@/lib/field-limits";
import { sectionSchemas } from "@/lib/section-schemas";

test("a text field reports its character limit through default and nullable layers", () => {
  assert.equal(maxAtPath(sectionSchemas.hero, ["line1"]), 60);
  assert.equal(maxAtPath(sectionSchemas.hero, ["reelLabel"]), 80);
  assert.equal(maxAtPath(sectionSchemas.work, ["lanes", 0, "projects", 2, "hrefLabel"]), 16);
});

test("a list reports how many entries it may hold, and its entries their own limit", () => {
  assert.equal(maxAtPath(sectionSchemas.hero, ["cutWords"]), 10);
  assert.equal(maxAtPath(sectionSchemas.hero, ["cutWords", 3]), 24);
  assert.equal(maxAtPath(sectionSchemas.work, ["lanes"]), 6);
  assert.equal(maxAtPath(sectionSchemas.work, ["lanes", 1, "projects"]), 20);
  assert.equal(maxAtPath(sectionSchemas.work, ["lanes", 1, "projects", 0, "title"]), 80);
});

test("a drawing-room card's fields are found whichever card shape holds them", () => {
  assert.equal(maxAtPath(sectionSchemas.room, ["cards"]), 30);
  assert.equal(maxAtPath(sectionSchemas.room, ["cards", 0, "caption"]), 60);
  assert.equal(maxAtPath(sectionSchemas.room, ["cards", 0, "attribution"]), 60);
});

test("a field with no limit, or a path the schema does not have, reports none", () => {
  assert.equal(maxAtPath(sectionSchemas.hero, ["noSuchField"]), undefined);
  assert.equal(maxAtPath(sectionSchemas.room, ["allowDrag"]), undefined);
  assert.equal(maxAtPath(sectionSchemas.hero, ["line1", 0]), undefined);
});
