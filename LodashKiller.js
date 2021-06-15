const utils = require("./utils");
const fs = require("fs");
const path = require("path");
function getFunctionName(x, lodashText) {
	let func_line = x.trim().split(lodashText);
	return func_line[1].split("(")[0].replace(/\./g, "").replace(/\;/g, "");
}

module.exports = function FindImports(incoming, fileName) {
	const incomingCache = null;

	let hasVERSION = false;
	let importLineOne = -1;
	let importLodashLine = -1;
	let lodashText = "";
	let lodashLines = [];
	let usedLodashFunctions = [];
	for (let index = 0; index < incoming.length; index++) {
		const x = incoming[index];
		let lcx = x.toLowerCase();
		// if (!lcx.includes("://")) {
		// 	x = x;
		// 	lcx = lcx.replace(/\/\/.*/gi, "/**/");
		// }

		//Find first import line
		if (lcx.includes("import") && importLineOne === -1) {
			importLineOne = index;
		}

		//Find the lodash line
		if (
			lcx.includes("import") &&
			lcx.includes("lodash") &&
			!lcx.includes("lodash/")
		) {
			importLodashLine = index;
			//Lodash imported with a weird syntax
			if (lcx.includes("{")) {
				utils.alert(
					`[Lodash Treeshake Webpack] Cannot run with lodash imported with curly braces. This will cause the full lodash package to be bundled!\nE.g. 'import {filter} from 'lodash';' in file ${fileName}\n\n${x}`
				);
				return {
					text: incomingCache,
					lodashImportedOnLine: -1,
					functionsUsed: "NONE - BAD IMPORT",
				};
			} else {
				let spaces = x.split(" ");
				lodashText = spaces[1];
				break;
			}
		}
	}
	//If lodash is not found just skip the file
	if (importLodashLine === -1)
		return {
			text: incomingCache,
			lodashImportedOnLine: importLodashLine,
			functionsUsed: "NONE",
		};

	//Iterate through document and find where lodash functions are used
	for (let index = 0; index < incoming.length; index++) {
		let x = incoming[index];

		//Check if line includes the name of lodash from the import
		if (x.includes(`${lodashText}.`)) {
			let x_split = x.replace(new RegExp(`${lodashText}`, "g"), "⍝༗");

			x_split = x_split.split("⍝");
			x_split = x_split.map((x) => x.replace("༗", lodashText));
			for (let xc = 0; xc < x_split.length; xc++) {
				const element = x_split[xc];

				if (!element.includes(lodashText)) continue;
				//If the name was not found strip out and only get the function name
				let func = getFunctionName(element, lodashText);

				lodashLines.push(index);
				usedLodashFunctions.push(func);
			}
		}
	}

	//Check if version is being accessed

	//Filter out duplicates and replace .
	usedLodashFunctions = usedLodashFunctions.filter(
		(item, i, ar) => ar.indexOf(item) === i
	);
	usedLodashFunctions = usedLodashFunctions.map((x) => x.replace(/\./g, ""));
	usedLodashFunctions = usedLodashFunctions.sort((x, y) => x.length - y.length);

	hasVERSION = usedLodashFunctions
		.map((x) => x.toLowerCase())
		.includes("version");

	if (hasVERSION) {
		usedLodashFunctions = usedLodashFunctions.filter(
			(x) => !x.toLowerCase().includes("version")
		);
		let s = fs.readFileSync(
			path.resolve("node_modules", "lodash", "lodash.js"),
			"utf-8"
		);
		let res = s.match(/VERSION = \'.*\'/)[0];
		let res2 = res.match(/\'.*\'/)[0];
		fs.writeFileSync(
			path.resolve("node_modules", "lodash", "VERSION.js"),
			`
			module.exports=${res2}
		`.trim()
		);
	}

	//Create object with new name
	usedLodashFunctions = usedLodashFunctions.map((x) => {
		return {
			name: x,
			newName: `${utils.CreateNewVarName()}_`,
		};
	});

	//CREATE IMPORTS
	let newImports = usedLodashFunctions.map(
		(x) => `import ${x.newName}${x.name} from "lodash/${x.name}";`
	);
	if (hasVERSION) newImports.push(`import VERSION from "lodash/VERSION";`);

	let regexForAllUsedFunctions = usedLodashFunctions.map((x) => {
		return {
			regx: new RegExp(`${lodashText}.${x.name}`, "g"),
			newName: `${x.newName}${x.name}`,
		};
	});

	if (hasVERSION)
		regexForAllUsedFunctions.push({
			regx: new RegExp(`${lodashText}.VERSION`, "g"),
			newName: "VERSION",
		});

	//Replace Lodash statements
	for (let index = 0; index < lodashLines.length; index++) {
		let lineNum = lodashLines[index];
		let lineText = incoming[lineNum];
		for (let o = 0; o < regexForAllUsedFunctions.length; o++) {
			const r = regexForAllUsedFunctions[o];
			lineText = lineText.replace(r.regx, r.newName);
		}
		incoming[lineNum] = lineText;
	}

	//REPLACE IMPORT STATEMENTS
	for (let index = 0; index < newImports.length; index++) {
		const element = newImports[index];
		if (index === 0) {
			incoming[importLodashLine] = element; //Replace existing import
			continue;
		} else {
			incoming.splice(importLodashLine + index, 0, element);
		}
	}
	// incoming = [...incoming];
	let joined = incoming.join("\r\n");
	// if (joined.includes("<style>")) {
	// 	//Vue CSS can't handle \n
	// 	let s = joined.split("<style");
	// 	s = s[1].replace(/\r/g, "").replace(/\n/g, "").replace(/\t/g, "");
	// 	joined = s.join("<style");
	// }

	return {
		text: joined,
		lodashImportedOnLine: importLodashLine,
		functionsUsed: JSON.stringify(usedLodashFunctions),
	};
};
