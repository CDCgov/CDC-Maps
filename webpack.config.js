const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const svgToMiniDataURI = require('mini-svg-data-uri');
const nodeExternals = require('webpack-node-externals');

module.exports = (env, { mode }) => {

  const prodExternals = [nodeExternals({
    // this WILL include `jquery` and `webpack/hot/dev-server` in the bundle, as well as `lodash/*`
    allowlist: ['array-move']
  })];

  const entry = {
    index: mode === 'development' ? './src/index.js' : './src/App.js',
  }

  const configObj = {
    mode,
    entry,
    devtool: mode === 'development' ? 'inline-source-map' : false,
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    stats: mode === 'development' ? 'normal' : 'minimal',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: (pathData) => pathData.chunk.name === 'index' ? `cdcmap.js` : '[name].js',
        libraryTarget: 'umd',
    },
    devServer: {
        open: true,
        compress: true,
        overlay: {
          warnings: false,
          errors: true
        }
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules\/(?!array-move\/).*/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                {
                  plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-syntax-dynamic-import','@babel/plugin-transform-arrow-functions']
                }
              ]
            },
          }
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader',
          ],
        },
        // Inline and Base64 small jpg, png and gifs but larger ones will be generated as regular images.
        // For output that gets imported as a library, there's currently no good solution for larger images that don't involve the user of the library manually importing them.
        // We shouldn't be using anything aside from PNGs anyways, but just putting this here for posterity.
        // https://github.com/webpack/webpack/issues/7353
        {
          test: /\.(jpe?g|png|gif)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                name: 'images/[name].[ext]'
              }
            },
          ],
        },
        {
          test: /\.svg$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                generator: (content) => svgToMiniDataURI(content.toString()),
              },
            },
          ],
        }
      ]
    }
  }

  // Only export as a library when building for production.
  if(mode !== 'development') {
    configObj.externals = prodExternals;
    configObj.output = {
      ...configObj.output,
      libraryTarget: 'umd',
      library: 'CdcMap',
    }
  }

  // We only need to generate an index.html file during development for testing purposes.
  if(mode === 'development') {
    configObj.plugins = [
      new HtmlWebpackPlugin({
        template: './src/index.html'
      })
    ];
  }

  return configObj
}