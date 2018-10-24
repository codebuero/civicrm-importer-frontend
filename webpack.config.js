const webpack = require('webpack')
const path = require('path')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin')
const Progress = require('webpackbar')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const NODE_MODULES_PATH = path.join(__dirname, 'node_modules')

module.exports = (env = {}, argv) => {
  return {
    mode: 'development',
    devtool: 'eval',
    context: path.join(__dirname, 'src'),
    entry: {
      app: ["@babel/polyfill", "./client.js"]
    },
    output: {
      path: path.join(__dirname, 'public'),
      filename: 'bundle.js',
      publicPath: './',
      libraryTarget: 'var',
      library: 'XLSX',
      crossOriginLoading: 'anonymous'
    },
    plugins: [
      new webpack.DefinePlugin({
        'IMPORTER_CONFIG_FILE_PATH': JSON.stringify(process.env.CONFIG_FILE_PATH),
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "[name].css",
        chunkFilename: "[id].css"
      }),
      new ServiceWorkerWebpackPlugin({
        entry: path.join(__dirname, 'src/sw.js'),
        publicPath: '/public'
      }),
      new Progress({
          color: '#5C95EE'
      })
    ],
    resolve: {
      extensions: ['.js', '.jsx'],
      modules: [path.join(__dirname, 'src'), 'node_modules'],
    },
    module: {
      rules: [
            {
              test: /\.js|\.jsx?$/,
              loader: 'babel-loader',
              exclude: NODE_MODULES_PATH,
              options: {
                cacheDirectory: './.babel-cache'
              },
            },
            { 
              test: /\.styl$/, 
              use: [
                  {
                    loader: "style-loader" // creates style nodes from JS strings
                  },
                  {
                    loader: "css-loader" // translates CSS into CommonJS
                  },
                  {
                    loader: "stylus-loader" // compiles Stylus to CSS
                  }
              ],
            },            
            {
              test: /\.css$/,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    // you can specify a publicPath here
                    // by default it use publicPath in webpackOptions.output
                    publicPath: '../public'
                  }
                },
                "css-loader"
              ]
            }
            ]
    },
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    }
  }
}
