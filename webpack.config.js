var path = require('path')
var webpack = require('webpack')
var NODE_MODULES_PATH = path.resolve(__dirname, 'node_modules')

module.exports = {
  devtool: 'eval',
  entry: [
    './src/client.js'
  ],
  output: {
    path: path.join(__dirname, 'public/js'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loaders: ['babel-loader'],
      exclude: NODE_MODULES_PATH,
    }]
  }
}
