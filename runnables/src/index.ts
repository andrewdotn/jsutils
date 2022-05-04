// Copyright © 2021-2022 Andrew Neitsch. All rights reserved.

import { spawn, SpawnOptions } from "child_process";

interface RunOptions {
  stderr?: "capture" | "tee";
  stdout?: "capture" | "tee";
}

// If exporting, JSON.parse(JSON.stringify(…)) to prevent modification
const defaultRunOptions: Required<RunOptions> = {
  stdout: "tee",
  stderr: "tee",
};

interface RunResult {
  stdout: string;
  stderr: string;
  errCode?: number;
}

/**
 * Run the given command, without sending anything to the parent stdout or
 * stderr.
 */
export function runQuietly(
  command: string[],
  runOptions?: RunOptions,
  spawnOptions?: SpawnOptions
): Promise<RunResult> {
  return run(
    command,
    { stdout: "capture", stderr: "capture", ...runOptions },
    spawnOptions
  );
}

/**
 * Inspired by `\`foo\`` in unix command-line shells, run the given command,
 * with only stderr going to the parent stderr. Both `stdout` and `stderr`
 * are still accessible in the result object.
 */
export function runBackticks(
  command: string[],
  runOptions?: RunOptions,
  spawnOptions?: SpawnOptions
): Promise<RunResult> {
  return run(
    command,
    { stdout: "capture", stderr: "tee", ...runOptions },
    spawnOptions
  );
}

/**
 * Run the given command, sending both `stdout` and `stderr` to the parent
 * streams while also capturing their output for later inspection.
 */
export function runTee(
  command: string[],
  runOptions?: RunOptions,
  spawnOptions?: SpawnOptions
): Promise<RunResult> {
  return run(
    command,
    { stdout: "tee", stderr: "tee", ...runOptions },
    spawnOptions
  );
}

export class ErrorRunningProcess extends Error {
  constructor(message: string, command: string[], runResult: RunResult) {
    super(message);
    this.command = command;
    this.runResult = runResult;
  }

  command: string[];
  runResult: RunResult;
}

/**
 * Run the given command. By default, stdout and stderr from the command go to
 * the calling process’s streams, and are also captured for later inspection;
 * the command’s stdin starts out closed.
 *
 * stdout and stderr are returned to the caller in a {@link RunResult} object.
 *
 * If the command exits with a non-zero exit code, an error is thrown.
 *
 * @param command The command to run.
 *
 * @param runOptions Specify tweaks for how the command is run.
 *
 * @param spawnOptions Advanced usage: options to pass to the underlying
 * `child_process.spawn` call. Please exercise caution, as it is possible to
 * specify options that will stop this package from working properly.
 */
export function run(
  command: string[],
  runOptions?: RunOptions,
  spawnOptions?: SpawnOptions
): Promise<RunResult> {
  const resolvedRunOptions: Required<RunOptions> = {
    ...defaultRunOptions,
    ...runOptions,
  };

  let stdout = "";
  let stderr = "";

  const startTime = new Date();
  const hrStart = process.hrtime.bigint();
  let endTime: Date;
  let hrEnd: bigint;
  const proc = spawn(command[0], command.slice(1), {
    stdio: ["ignore", "pipe", "pipe"],
  });

  proc.stdio[1]!.on("data", (data) => {
    if (resolvedRunOptions.stdout === "tee") {
      process.stdout.write(data);
    }
    stdout += data;
  });
  proc.stdio[2]!.on("data", (data) => {
    if (resolvedRunOptions.stderr === "tee") {
      process.stderr.write(data);
    }
    stderr += data;
  });

  let exitErrCode: number | null;
  let exitSignal: NodeJS.Signals | null;

  function createReturnValue() {
    return {
      stdout,
      stderr,
      startTime,
      endTime,
      wallTimeNanoseconds: hrEnd !== undefined ? hrEnd - hrStart : undefined,
      wallTimeSeconds:
        hrEnd !== undefined ? Number(hrEnd - hrStart) / 1e9 : undefined,
      errCode: exitErrCode ?? undefined,
      signal: exitSignal,
    };
  }

  return new Promise((resolve, reject) => {
    // docs: “The 'close' event is emitted when the stdio streams of a child
    // process have been closed. This is distinct from the 'exit' event, since
    // multiple processes might share the same stdio streams.”

    proc.on("error", (e) => reject(e));
    proc.on("exit", (errCode, signal) => {
      hrEnd = process.hrtime.bigint();
      endTime = new Date();

      exitErrCode = errCode;
      exitSignal = signal;

      const retval = createReturnValue();

      if (signal) {
        reject(
          new ErrorRunningProcess(
            `Command exited with signal ${signal}`,
            command,
            retval
          )
        );
        return;
      }
      if (errCode !== 0) {
        reject(
          new ErrorRunningProcess(
            `Non-zero exit code ${errCode}`,
            command,
            retval
          )
        );
        return;
      }

      resolve(retval);
    });
  });
}
