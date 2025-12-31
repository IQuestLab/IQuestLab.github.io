const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  return {
    entry: path.resolve(__dirname, "src/main.jsx"),
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "assets/app.[contenthash].js",
      clean: true,
      // 开发/生产都使用相对路径：便于把 dist 放到任意子目录/相对路径下直接访问
      publicPath: "./",
    },
    resolve: {
      extensions: [".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: "defaults",
                  },
                ],
                ["@babel/preset-react", { runtime: "automatic" }],
              ],
            },
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
        inject: "body",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "src/assets"),
            to: path.resolve(__dirname, "dist"),
            // public 下的内容都要原样可访问：/images/*、/demo/*、/style.css
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      // output.publicPath 使用相对路径时，devMiddleware 仍需要一个可路由匹配的绝对挂载点，
      // 否则会出现 Cannot GET /（所有资源都 404）的情况。
      devMiddleware: {
        publicPath: "/",
      },
      static: [
        {
          // 让 /images/*、/demo/*、/style.css 直接从 src/assets 提供
          directory: path.resolve(__dirname, "src/assets"),
          publicPath: "/",
          watch: true,
        },
      ],
      client: {
        overlay: true,
      },
    },
    devtool: "source-map",
  };
};
