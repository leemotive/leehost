import path from 'path';

const postcssConfig = [
    require('postcss-import')(),
    require('postcss-url')(),
    require('postcss-mixins')(),
    require('postcss-nested')(),
    require('postcss-cssnext')({
        browsers: [
            'Chrome >= 35',
            'Firefox >= 31',
            'Explorer >= 9',
            'Opera >= 12',
            'Safari >= 7.1'
        ]
    })
]

let webpackConfig = {
    entry: './render/index.js',
    target: 'electron-renderer',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env']
                        ]
                    }
                }
            },
            {
                test: /\.vue/,
                use: {
                    loader: 'vue-loader',
                    options: {
                        postcss: postcssConfig
                    }
                }
            },
            {
                test: /\.css/,
                use: [
                    {loader: 'style-loader'},
                    {loader: 'css-loader', options: {importLoader: 1}},
                    {loader: 'postcss-loader', options: {
                        plugins: (loader) => postcssConfig
                    }}
                ]
            },
            {
                test: /\.(png|jpg|gif|jpeg|eot|svg|ttf|woff)/,
                use: [
                    {loader: 'file-loader', options: {name: '[path][name].[ext]', context: `./render`}}
                ]
            }
        ]
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, './dist'),
        publicPath: `${__dirname}/dist/`,
    }
};

export default webpackConfig;