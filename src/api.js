export async function api(caminho, { method = 'GET', body, usuario } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (usuario) {
    headers['x-usuario-id'] = usuario.id;
    headers['x-perfil'] = usuario.perfil;
  }
  let resposta;
  try {
    resposta = await fetch(caminho, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (erro) {
    throw new Error('Servidor indisponível. Deixe a janela do iniciar.bat aberta e tente de novo.');
  }
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível concluir.');
  return dados;
}
