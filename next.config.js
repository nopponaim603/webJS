/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '172.23.64.1',
    'localhost',
    '127.0.0.1',
  ],
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
      {
        source: '/:path*.glb',
        headers: [
          { key: 'Content-Type', value: 'model/gltf-binary' },
          { key: 'Access-Control-Allow-Origin', value: '*' }
        ]
      },
      {
        source: '/:path*.wasm.unityweb',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Content-Encoding', value: 'gzip' }
        ]
      },
      {
        source: '/:path*.framework.js.unityweb',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Content-Encoding', value: 'gzip' }
        ]
      },
      {
        source: '/:path*.data.unityweb',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          { key: 'Content-Encoding', value: 'gzip' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
