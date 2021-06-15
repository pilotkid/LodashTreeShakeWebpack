const path = require("path");
const fs = require("fs");
const LodashKiller = require("./LodashKiller");
const utils = require("./utils");

// const directory = "./test";

// // fs.readdir(directory, (err, files) => {
// // 	if (err) throw err;

// // 	for (const file of files) {
// // 		fs.unlink(path.join(directory, file), (err) => {
// // 			if (err) throw err;
// // 		});
// // 	}
// // });

module.exports = function (source) {
	// let [code, css] = source.split(/<style/);

	// css = css ? css.replace(/.[\r\n]/g) : "";

	const filename = !this._module ? this.resourcePath : this._module.resource;

	// try {
	let fx = utils.SplitByLine(source);

	var newtxt = LodashKiller(fx, filename);
	if (newtxt.lodashImportedOnLine >= 0) {
		// if (css) {
		// 	newtxt.text = [newtxt.text, "<style", css].join("");
		// } else {
		// newtxt.text;
		// }
		utils.notice(
			`[Lodash Treeshake Wepack] Parsed ${newtxt.lodashImportedOnLine} | ${
				newtxt.functionsUsed
			} | ${typeof newtxt.text}`
		);
		fs.writeFileSync(
			`./test/${path.basename(filename.split("?")[0])}`,
			newtxt.text
		);
		return newtxt.text;
	}
	// } catch (err) {
	// 	utils.alert(`LodashWebPack ERROR ${err}`);
	// 	return source;
	// }

	this.cacheable(true);
	return source;
};
