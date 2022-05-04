// Copyright © 2022 Andrew Neitsch. All rights reserved.

import { last } from "lodash";
import { isEnoent } from "./_util";
import { readFile, writeFile, unlink, stat } from "fs/promises";

export class FancyPath {
  private readonly _path: string;
  constructor(path: string) {
    this._path = path;
  }

  basename() {
    return last(this._path.split("/"));
  }

  join(b: string) {
    return new FancyPath(this._path + "/" + b);
  }

  async exists() {
    try {
      await stat(this._path);
      return true;
    } catch (e) {
      if (!isEnoent(e)) {
        throw e;
      }
      return false;
    }
  }

  async write(text: string) {
    await writeFile(this._path, text);
  }

  async read() {
    return await readFile(this._path, { encoding: "utf-8" });
  }

  async rm() {
    return await unlink(this._path);
  }

  toString() {
    return this._path;
  }
}
