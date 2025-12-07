/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        __dirname: JSON.stringify('.'),
      })
    );
    return config;
  },
};

module.exports = nextConfig;
