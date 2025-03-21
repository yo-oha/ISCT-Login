import CopyPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { Configuration } from 'webpack'

const config: Configuration = {
  mode: (process.env.NODE_ENV ?? 'development') as Configuration['mode'],
  entry: {
    options: './src/options.tsx',
    authenticate: './src/authenticate.tsx',
    background: './src/background.ts',
  },
  output: {
    path: `${__dirname}/dist`,
    publicPath: './',
    filename: 'js/[name].js',
  },
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: '.',
          to: '.',
          context: 'public',
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunks: ['options'],
      title: 'ISCT Login Settings',
      filename: 'options.html',
      scriptLoading: 'blocking',
    }),
  ],
  devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-source-map',
  cache: false,
}

export default config
