"use strict";
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = () => ({
  devtool: "srcmap",
  entry: {
    content: "./src/content.ts",
    background: "./src/background.ts",
    "ui/reminders/bundle": "./src/ui/reminders/index.tsx",
    "ui/backgroundSync/syncReport-bundle": "./src/ui/backgroundSync/syncReport.tsx",
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader"
          // options: {
          //     useCache: true
          // }
        }
      }
    ]
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    modules: [path.resolve("src"), "node_modules"],
    extensions: [".ts", ".tsx", ".js", ".jsx"]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: "**/*",
        context: "src",
        ignore: ["*.ts", "*.tsx"]
      },
      {
        from: "node_modules/webextension-polyfill/dist/browser-polyfill.min.js"
      }
    ])
  ],
  optimization: {
    // Without this, function names will be garbled and enableFeature won't work
    concatenateModules: true,

    // Automatically enabled on prod; keeps it somewhat readable for AMO reviewers
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          mangle: false,
          compress: false,
          output: {
            beautify: true,
            indent_level: 2 // eslint-disable-line camelcase
          }
        }
      })
    ]
  }
});
