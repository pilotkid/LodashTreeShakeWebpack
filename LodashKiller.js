const utils = require("./utils");

function getFunctionName(x, lodashText) {
	let func_line = x.trim().split(lodashText);
	return func_line[1].split("(")[0].replace(/\./g, "").replace(/\;/g, "");
}

module.exports = function FindImports(incoming, fileName) {
	let hasVERSION = false;
	let importLineOne = -1;
	let importLodashLine = -1;
	let lodashText = "";
	let lodashLines = [];
	let usedLodashFunctions = [];
	for (let index = 0; index < incoming.length; index++) {
		const x = incoming[index];
		let lcx = x.toLowerCase();

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
					`[Lodash Treeshake Webpack] Cannot run with lodash imported with curly braces. This will cause the full lodash package to be bundled!\nE.g. 'import {filter} from 'lodash';' in file ${fileName}`
				);
				return incoming;
			} else {
				let spaces = x.split(" ");
				lodashText = spaces[1];
				break;
			}
		}
	}
	//If lodash is not found just skip the file
	if (importLodashLine === -1) return incoming;

	//Iterate through document and find where lodash functions are used
	for (let index = 0; index < incoming.length; index++) {
		let x = incoming[index];

		//Check if line includes the name of lodash from the import
		if (x.includes(`${lodashText}.`)) {
			//If the name was not found strip out and only get the function name
			let func = getFunctionName(x, lodashText);

			lodashLines.push(index);
			usedLodashFunctions.push(func);
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

	if (hasVERSION)
		usedLodashFunctions = usedLodashFunctions.filter(
			(x) => !x.toLowerCase().includes("version")
		);

	//Create object with new name
	usedLodashFunctions = usedLodashFunctions.map((x) => {
		return {
			name: x,
			newName: `${utils.CreateNewVarName()}_`,
		};
	});

	//CREATE IMPORTS
	let newImports = usedLodashFunctions.map(
		(x) => `import ${x.newName}${x.name} from "lodash/${x.name}"`
	);
	if (hasVERSION) newImports.push(`import {VERSION} from lodash`);

	var re = new RegExp(lodashText + ".", "g");

	//Replace Lodash statements
	for (let index = 0; index < lodashLines.length; index++) {
		const lineNumber = lodashLines[index];
		//GET LODASH INSTANCES ON EACH LINE
		let currentText = incoming[lineNumber];
		let all_instances = currentText
			.replace(re, `~!~\r\n${lodashText}.`)
			.split("~!~");

		//FOREACH INSTANCE OF LODASH BEING CALLED ON THE LINE
		for (let i = 0; i < all_instances.length; i++) {
			let ctext = all_instances[i];

			//VERIFY LINE CONTAINS A LODASH CALL
			if (!ctext.includes(`${lodashText}.`)) continue;

			//GET THE FUNCTION REPLACEMENT NAME
			let fn = getFunctionName(ctext, lodashText);
			if (hasVERSION)
				if (fn.toLowerCase().includes("version")) {
					all_instances[i] = "VERSION";
					continue;
				}

			let func_new_name = usedLodashFunctions.filter((x) => x.name === fn);

			//REPLACE THE LODASH TEXT
			all_instances[i] = ctext.replace(re, func_new_name[0].newName);
		}

		//MERGE THE LINE BACK TOGETHER
		incoming[lineNumber] = all_instances.join("");
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

	return incoming.join("\r\n");
};
