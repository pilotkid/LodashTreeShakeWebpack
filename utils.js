var randomWords = require("random-words");

/**
 * Creates a new variable name from random words
 * @returns A soup of words in camel case
 */
function CreateNewVarName() {
	let words = randomWords(3)
		.map((x) => x.charAt(0).toUpperCase() + x.slice(1))
		.join("");
	words = words.charAt(0).toLowerCase() + words.slice(1);
	return words;
}

/**
 *
 * @param {String} string Split file line by line
 * @param {Bool}
 * @returns {Array} of lines
 */
function SplitByLine(string) {
	return (
		string
			// .replace(/(?!((.*):\/\/.*))?^((\/\/.*))/gi, "\n/**/\n/**/\n/**/\n") //Match (//) comments but not urls
			.replace(/(\r)/gi, "") //replace return carriage
			// .replace(/(\([\n\r\s]+)/gi, "(") //replace new lines that start with a parenthsis
			// .replace(/([\n\r\s]+\))/gi, ")") //replace new lines that end with parenthsis
			// .replace(/\.[\n\r\s]+|[\n\r\s]+\./gim, ".") //Match
			.split("\n")
	);
}
const chalk = require("chalk");
/**
 * Creates alert in console with yellow and black text
 * @param {String} msg Message to be displayed
 */
function alert(msg) {
	console.log(chalk.inverse.yellow("\n   ATTENTION!!   "), msg, "\n");
}
/**
 * Creates alert in console with green and black text
 * @param {String} msg Message to be displayed
 */
function notice(msg) {
	console.log(chalk.inverse.green("\n   NOTICE   "), msg, "\n");
}

module.exports = {
	CreateNewVarName,
	SplitByLine,
	notice,
	alert,
};
