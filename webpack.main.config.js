const DotEnv = require('dotenv-webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
  */
  target: 'electron-main',
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.json', '.node'],
  },
  plugins: [
    new DotEnv({
      path: './.env'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/static' }
      ]
    })
  ],
  // externals: ['electron-overlay-window']
};
