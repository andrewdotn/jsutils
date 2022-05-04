// https://github.com/babel/babel/issues/8673
require("@babel/register")({
  extensions: [".ts"],
  cwd: __dirname,
});
