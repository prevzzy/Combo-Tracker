module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./src/static/combo-tracker-icon.ico"
  },
  makers: [
    {
      name: "@electron-forge/maker-zip"
    }
  ],
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        devServer: {
          static: './src/static',
          hot: true,
          liveReload: false,
        },
        devContentSecurityPolicy: `default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;`,
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/renderer/index.html",
              js: "./src/renderer.js",
              name: "main_window"
            },
            {
              html: "./src/renderer/toast.html",
              js: "./src/renderer/js/toasts/index.js",
              name: "toast_window"
            }
          ]
        }
      }
    ]
  ]
};
