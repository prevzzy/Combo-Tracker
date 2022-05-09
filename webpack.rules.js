module.exports = [
  // Add support for native node modules for building process (make sure asar: true is set in config.forge.packagerConfig in package.json)
  // {
  //   test: /\.node$/,
  //   loader: 'native-ext-loader',
  //   options: {
  //     basePath: ['..']
  //   }
  // },

  // Add support for native node modules for development process (when switching between this config and the one above, a node_modules reinstall might be needed)
  {
    test: /native_modules\/.+\.node$/,
    use: 'native-ext-loader',
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
    test: /\.(png|jpe?g|gif|svg)$/i,
    use: [
      {
        loader: 'file-loader'
      }
    ]
  },
];
