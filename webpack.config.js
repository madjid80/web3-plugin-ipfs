const webpack = require('webpack');

module.exports = {
	mode: 'production',
	resolve: {
		extensions: ['.ts', '.js'],
		fallback: {
            'fs': false
        }
	},
	
	output: {
		path: __dirname + '/dist',
		filename: 'ipfsPlugin.min.js',
		library: 'ipfsPlugin',
		libraryExport: 'default',
		libraryTarget: 'umd',
		globalObject: 'this',
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: [/node_modules/, '/test/'],
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
		],
	},
};