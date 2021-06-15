const path = require("path");
module.exports = [
	{
		test: /\.(vue|js)(?:\?.*|)$/gim,
		exclude: "/node_modules/",
		loader: path.resolve("./loader.js"),
	},
];
