export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;
    let html = await response.text();
    if (!html.includes('/effects.js')) {
      html = html.replace('</body>', '<script src="/effects.js?v=3"></script></body>');
    }
    if (!html.includes('/upgrade.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/upgrade.css?v=1"></head>');
    }
    if (!html.includes('/upgrade.js')) {
      html = html.replace('</body>', '<script src="/upgrade.js?v=2"></script></body>');
    }
    if (!html.includes('/fusion.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/fusion.css?v=1"></head>');
    }
    if (!html.includes('/fusion.js')) {
      html = html.replace('</body>', '<script src="/fusion.js?v=1"></script></body>');
    }
    if (!html.includes('/mutation.js')) {
      html = html.replace('</body>', '<script src="/mutation.js?v=1"></script></body>');
    }
    if (!html.includes('/death.js')) {
      html = html.replace('</body>', '<script src="/death.js?v=1"></script></body>');
    }
    if (!html.includes('/pet.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/pet.css?v=1"></head>');
    }
    if (!html.includes('/pet.js')) {
      html = html.replace('</body>', '<script src="/pet.js?v=2"></script></body>');
    }
    if (!html.includes('/weapon.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/weapon.css?v=1"></head>');
    }
    if (!html.includes('/weapon.js')) {
      html = html.replace('</body>', '<script src="/weapon.js?v=1"></script></body>');
    }
    if (!html.includes('/mobile-fix.css')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/mobile-fix.css?v=1"></head>');
    }
    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=UTF-8');
    headers.set('cache-control', 'no-cache');
    return new Response(html, {status: response.status, statusText: response.statusText, headers});
  }
};