export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return Response.redirect(
      `https://github.com/login/oauth/authorize?client_id=0v23lil71BWC5Dp7jzZm&scope=repo,user`,
      302
    );
  }

  const resp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: '0v23lil71BWC5Dp7jzZm',
      client_secret: '9a4603d7edbe444dd653c4a1a745894cf3d28604',
      code
    })
  });

  const { access_token } = await resp.json();

  const html = `<!DOCTYPE html><html><body><script>
    window.opener && window.opener.postMessage(
      'authorization:github:success:' + JSON.stringify({token:'${access_token}',provider:'github'}),
      '*'
    );
    window.close();
  </script></body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
