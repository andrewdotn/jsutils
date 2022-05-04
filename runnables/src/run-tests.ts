// Copyright © 2021-2022 Andrew Neitsch. All rights reserved.

import { describe } from "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  ErrorRunningProcess,
  run,
  runBackticks,
  runQuietly,
  runTee,
} from "./index";
import { resolve } from "path";
chai.use(chaiAsPromised);

const testProg = resolve(__dirname, "prog-for-tests.js");

describe("runnables", function () {
  it("captures stdout", async function () {
    const retval = await run(["node", testProg, "echo", "hi"]);
    console.log(retval);
    expect(retval.errCode).to.eql(0);
    expect(retval.stdout).to.eql("hi\n");
    expect(retval.stderr).to.eql("");
  });

  it("captures stderr", async function () {
    const retval = await run([
      "node",
      testProg,
      "echo",
      "hi",
      "err-echo",
      "there",
    ]);
    console.log(retval);
    expect(retval.errCode).to.eql(0);
    expect(retval.stdout).to.eql("hi\n");
    expect(retval.stderr).to.eql("there\n");
  });

  it("throws an error on non-zero retcode", async function () {
    await expect(run(["node", testProg, "exit", "12"])).to.be.rejectedWith(
      /Non-zero/
    );
  });

  describe("on unexpected signal", function () {
    it("throws an error", async function () {
      await expect(
        run(["node", testProg, "echo", "hi", "signal-self", "SIGBUS"])
      ).to.be.rejectedWith(/exited with signal SIGBUS/);
    });

    it("includes output in exception", async function () {
      const command = ["node", testProg, "echo", "hi", "signal-self", "SIGBUS"];
      const e = await catchException(() => run(command));
      expect(e).to.be.instanceOf(ErrorRunningProcess);
      expect(e.message).to.match(/exited with signal SIGBUS/);
      expect(e.command).to.eql(command);
      expect(e.runResult.signal).to.eql("SIGBUS");
    });
  });

  describe("runQuietly", function () {
    it("doesn’t echo output", async function () {
      await runQuietly([
        "node",
        testProg,
        "echo",
        "hi stdout",
        "err-echo",
        "hi stderr",
      ]);
      this.skip(); // no good way to capture at moment
    });
  });

  describe("runBackticks", function () {
    it("echos stderr", async function () {
      await runBackticks([
        "node",
        testProg,
        "echo",
        "hi stdout",
        "err-echo",
        "hi stderr",
      ]);
      this.skip(); // no good way to capture at moment
    });
  });

  describe("runTee", function () {
    it("echos stdout and stderr", async function () {
      await runTee([
        "node",
        testProg,
        "echo",
        "hi stdout",
        "err-echo",
        "hi stderr",
      ]);
      this.skip(); // no good way to capture at moment
    });
  });
});

async function catchException(func: () => Promise<unknown>) {
  try {
    await func();
  } catch (e) {
    return e;
  }
  throw new Error("No exception raised");
}
