const DotEnv = require('dotenv-webpack')

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
    })
  ],
  externals: ['electron-overlay-window']
};
