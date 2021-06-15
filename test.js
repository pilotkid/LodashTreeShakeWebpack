const LodashKiller = require("./LodashKiller");
const utils = require("./utils");
const fs = require("fs");

let testme = fs.readFileSync("./testme.vue", "utf-8");
let fx = utils.SplitByLine(testme);

let killer = LodashKiller(fx);
fs.writeFileSync("./output.vue", killer);
