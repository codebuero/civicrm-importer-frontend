var path = require('path')
var webpack = require('webpack')
var NODE_MODULES_PATH = path.resolve(__dirname, 'node_modules')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = (env) => {
  return {
    devtool: 'eval',
    entry: ["babel-polyfill", "./src/client.js"],
    output: {
      path: path.join(__dirname, 'public'),
      filename: 'bundle.js',
      publicPath: '/static/',
      libraryTarget: 'var',
      library: 'XLSX',
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new ExtractTextPlugin('styles.css'),
      new webpack.DefinePlugin({
        IMPORTER_CONFIG_FILE_PATH: JSON.stringify(env.CONFIG_FILE_PATH),
      })
    ],
    resolve: {
      extensions: ['.js', '.jsx']
    },
    module: {
      noParse: [
        /xlsx.core.min.js/,
        /xlsx.full.min.js/,
      ],
      loaders: [{
            test: /\.js|\.jsx?$/,
            loader: 'babel-loader',
            exclude: NODE_MODULES_PATH,
          },
          { 
            test: /\.css|\.styl$/, 
            loader: ExtractTextPlugin.extract({
                fallbackLoader: 'style-loader',
                loader: "css-loader!stylus-loader"
            }) 
          },
          ]
    },
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    }
  }
}
