export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;
    let html = await response.text();
    if (!html.includes('/effects.js')) {
      html = html.replace('</body>', '<script src="/effects.js?v=3"></script></body>');
    }
    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=UTF-8');
    return new Response(html, {status: response.status, statusText: response.statusText, headers});
  }
};
