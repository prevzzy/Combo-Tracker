const rules = require('./webpack.rules');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const DotEnv = require('dotenv-webpack')

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader', options: { url: true } }],
});

module.exports = {
  target: 'electron-renderer',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.json', '.node'],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      popper: 'popper.js'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/static' }
      ]
    }),
    new DotEnv({
      path: './.env'
    })
  ]
};
