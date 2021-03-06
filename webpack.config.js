var path = require("path");
var DefinePlugin = require("webpack/lib/DefinePlugin");
var LoaderOptionsPlugin = require("webpack/lib/LoaderOptionsPlugin");
var NormalModuleReplacementPlugin = require("webpack/lib/NormalModuleReplacementPlugin");
var NoEmitOnErrorsPlugin = require("webpack/lib/NoEmitOnErrorsPlugin");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ParallelUglifyPlugin = require("webpack-parallel-uglify-plugin");

const assign = require('object-assign');
const extractThemesPlugin = require('./MapStore2/build/themes.js').extractThemesPlugin;
module.exports = (env) => {
    const isProduction = env && env.production ? true : false;
    return {
        entry: assign(isProduction ? {} : {
            'webpack-dev-server': 'webpack-dev-server/client?http://0.0.0.0:8081', // WebpackDevServer host and port
            'webpack': 'webpack/hot/only-dev-server' // "only" prevents reload on syntax errors
        },
        {
            'visual-style-editor': path.join(__dirname, "js", "app")
        },
        {
            'themes/default': path.join(__dirname, "themes", "default", "theme.less")
        }),
        output: {
            path: path.join(__dirname, "dist"),
            publicPath: "dist/",
            filename: "[name].js"
        },
        plugins: [
            new CopyWebpackPlugin([
                { from: path.join(__dirname, 'node_modules', 'bootstrap', 'less'), to: path.join(__dirname, "web", "client", "dist", "bootstrap", "less") }
            ]),
            new LoaderOptionsPlugin({
                debug: !isProduction,
                options: {
                    postcss: {
                        plugins: [
                        require('postcss-prefix-selector')({prefix: '.visual-style-editor', exclude: ['.ms2', '.visual-style-editor', '[data-ms2-container]']})
                        ]
                    },
                    context: __dirname
                }
            }),
            new DefinePlugin({
                "__DEVTOOLS__": !isProduction
            }),
            new DefinePlugin({
                'process.env': {
                  'NODE_ENV': isProduction ? '"production"' : '""'
                }
            }),
            new NormalModuleReplacementPlugin(/leaflet$/, path.join(__dirname, "MapStore2", "web", "client", "libs", "leaflet")),
            new NormalModuleReplacementPlugin(/openlayers$/, path.join(__dirname, "MapStore2", "web", "client", "libs", "openlayers")),
            new NormalModuleReplacementPlugin(/cesium$/, path.join(__dirname, "MapStore2", "web", "client", "libs", "cesium")),
            new NormalModuleReplacementPlugin(/proj4$/, path.join(__dirname, "MapStore2", "web", "client", "libs", "proj4")),
            new NoEmitOnErrorsPlugin(),
            extractThemesPlugin
        ].concat(isProduction ? [new ParallelUglifyPlugin({
            uglifyJS: {
                sourceMap: false,
                compress: { warnings: false },
                mangle: true
            }
        })] : []),
        resolve: {
            extensions: [".js", ".jsx"],
            alias: {
                "@mapstore": path.resolve(__dirname, "MapStore2", "web", "client"),
                "@js": path.resolve(__dirname, "js")
            }
        },
        module: {
            noParse: [/html2canvas/],
            rules: [
                {
                    test: /\.css$/,
                    use: [{
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader'
                    }, {
                    loader: 'postcss-loader'
                    }]
                },
                {
                    test: /\.less$/,
                    exclude: /themes[\\\/]?.+\.less$/,
                    use: [{
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader'
                    }, {
                        loader: 'less-loader'
                    }]
                },
                {
                    test: /themes[\\\/]?.+\.less$/,
                    use: extractThemesPlugin.extract({
                            fallback: 'style-loader',
                            use: ['css-loader', 'postcss-loader', 'less-loader']
                        })
                },
                {
                    test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/,
                    use: [{
                        loader: 'url-loader',
                        options: {
                            mimetype: "application/font-woff"
                        }
                    }]
                },
                {
                    test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: "[name].[ext]"
                        }
                    }]
                },
                {
                    test: /\.(png|jpg|gif)$/,
                    use: [{
                        loader: 'url-loader',
                        options: {
                            name: "[path][name].[ext]",
                            limit: 8192
                        }
                    }]
                },
                {
                    test: /\.jsx?$/,
                    exclude: /(ol\.js)$|(Cesium\.js)$|(cesium\.js)$/,
                    use: [{
                        loader: "react-hot-loader"
                    }],
                    include: [path.join(__dirname, "js"), path.join(__dirname, "MapStore2", "web", "client")]
                }, {
                    test: /\.jsx?$/,
                    exclude: /(ol\.js)$|(Cesium\.js)$/,
                    use: [{
                        loader: "babel-loader"
                    }],
                    include: [
                        path.join(__dirname, "js"),
                        path.join(__dirname, "MapStore2", "web", "client"),
                        path.join(__dirname, "node_modules", "query-string"),
                        path.join(__dirname, "node_modules", "strict-uri-encode"),
                        path.join(__dirname, "node_modules", "split-on-first")
                    ]
                }
            ]
        },
        devServer: isProduction ? undefined : {
            proxy: {
                '/geoserver': {
                    target: 'http://localhost:8080'
                }
            }
        },

        devtool: !isProduction ? 'eval' : undefined
    };
};
