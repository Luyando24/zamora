/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        __dirname: JSON.stringify('.'),
      })
    );
    // Disable cache to avoid serialization errors during build
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;
