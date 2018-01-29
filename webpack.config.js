const webpack = require("webpack")
const path = require("path")
const fs = require("fs")
//Use nodemon to livereload our bot.
const NodemonPlugin = require("nodemon-webpack-plugin")
//Ignore node externals
const nodeExternals = require("webpack-node-externals")

module.exports = {
  entry: "./chatterbot/chatterbot.js",
  plugins: [
    new NodemonPlugin(),
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  target: "node",
  node: {
    console: true
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
  },
  externals: nodeExternals(),
  devtool: "sourcemap"
}
