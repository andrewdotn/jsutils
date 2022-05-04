// Copyright © 2022 Andrew Neitsch. All rights reserved.

import { describe } from "mocha";
import { expect } from "chai";
import { readFile, unlink } from "fs/promises";

import { FancyPath } from "./index";
import { isEnoent } from "./_util";

describe("fancypath", function () {
  it("works", function () {
    const p = new FancyPath("a");
    const p2 = p.join("b.c");
    expect(p2.toString()).to.eql("a/b.c");
    expect(p2.basename()).to.eql("b.c");
  });

  it("can read and write", async function () {
    try {
      const p = new FancyPath("foo");
      expect(await p.exists()).to.be.false;

      await p.write("hello world\n");
      expect(await p.exists()).to.be.true;
      expect(await p.read()).to.eql("hello world\n");

      expect(await readFile(p.toString(), { encoding: "UTF-8" })).to.eql(
        "hello world\n"
      );
      await p.rm();
      expect(await p.exists()).to.be.false;
    } finally {
      try {
        await unlink("foo");
      } catch (e) {
        if (!isEnoent(e)) {
          throw e;
        }
      }
    }
  });
});
