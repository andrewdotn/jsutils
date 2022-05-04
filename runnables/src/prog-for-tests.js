// Copyright © 2021-2022 Andrew Neitsch. All rights reserved.

// To make it easier to potentially get this package working on other
// platforms,, all the tests execute this program instead of assorted unix shell
// commands.

class Args {
  constructor(args) {
    this.args = args;
  }

  nextArg() {
    if (this.isDone()) {
      throw new Error("tried to read past end");
    }
    return this.args[this.index++];
  }

  isDone() {
    return this.index >= this.args.length;
  }

  index = 0;
}

function main() {
  const args = new Args(process.argv.slice(2));

  while (!args.isDone()) {
    const arg = args.nextArg();

    switch (arg) {
      case "echo":
        console.log(args.nextArg());
        break;

      case "err-echo":
        console.error(args.nextArg());
        break;

      case "exit":
        process.exit(parseInt(args.nextArg()));

      case "signal-self":
        process.kill(process.pid, args.nextArg());

      default:
        throw Error(`Unknown argument ‘${arg}’`);
    }
  }
}

if (require.main === module) {
  main();
}
