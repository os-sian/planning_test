import type { NextConfig } from 'next';
const config: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  poweredByHeader: false,
  devIndicators: false,
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  outputFileTracingExcludes: {'*':['./.local/**','./매장운영데이터/**','./HOfficeDN_2022_Home.exe']},
  async headers() { return [{source:'/:path*', headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'no-referrer'},
    {key:'X-Frame-Options',value:'DENY'}
  ]}]; }
};
export default config;
