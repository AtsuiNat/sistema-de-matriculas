import { useEffect, useState } from 'react';
import { api } from './api';
import { Contexto } from './contexto';
import Login from './components/Login';
import Barra from './components/Barra';
import Ofertas from './components/Ofertas';
import MinhaGrade from './components/MinhaGrade';
import Turmas from './components/Turmas';
import Disciplinas from './components/Disciplinas';
import Alunos from './components/Alunos';

const CHAVE = 'matriculas_usuario';

function lerSessao() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE) || 'null');
  } catch (erro) {
    return null;
  }
}

export default function App() {
  const [usuario, setUsuario] = useState(lerSessao);
  const [dados, setDados] = useState(null);
  const [rota, setRota] = useState(() => location.hash.replace('#', ''));
  const [aviso, setAviso] = useState(null);

  function notificar(tipo, texto) {
    const id = Date.now();
    setAviso({ tipo, texto, id });
    setTimeout(() => setAviso((atual) => (atual && atual.id === id ? null : atual)), texto.length > 90 ? 7000 : 4200);
  }

  async function recarregar(atual = usuario) {
    setDados(await api('/api/estado', { usuario: atual }));
  }

  useEffect(() => {
    function aoMudar() { setRota(location.hash.replace('#', '')); }
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  useEffect(() => {
    if (!usuario) return undefined;
    recarregar(usuario).catch((erro) => {
      sessionStorage.removeItem(CHAVE);
      setUsuario(null);
      setDados(null);
      notificar('erro', erro.message);
    });
    return undefined;
  }, [usuario]);

  function entrar(novo) {
    sessionStorage.setItem(CHAVE, JSON.stringify(novo));
    const destino = novo.perfil === 'aluno' ? 'ofertas' : 'turmas';
    location.hash = destino;
    setRota(destino);
    setUsuario(novo);
  }

  function sair() {
    sessionStorage.removeItem(CHAVE);
    setUsuario(null);
    setDados(null);
    location.hash = '';
    setRota('');
  }

  function ir(destino) {
    location.hash = destino;
    setRota(destino);
  }

  if (!usuario) return <Login aoEntrar={entrar} />;
  if (!dados) return <p className="carregando">Carregando o semestre...</p>;

  const rotaAluno = rota === 'grade' ? 'grade' : 'ofertas';
  const rotaInst = rota === 'disciplinas' || rota === 'alunos' ? rota : 'turmas';
  const pagina = usuario.perfil === 'aluno'
    ? (rotaAluno === 'grade' ? <MinhaGrade /> : <Ofertas />)
    : (rotaInst === 'disciplinas' ? <Disciplinas /> : rotaInst === 'alunos' ? <Alunos /> : <Turmas />);

  return (
    <Contexto.Provider value={{ usuario, dados, pedir: (caminho, opcoes) => api(caminho, { ...opcoes, usuario }), recarregar: () => recarregar(usuario), notificar }}>
      <Barra usuario={usuario} rota={usuario.perfil === 'aluno' ? rotaAluno : rotaInst} ir={ir} sair={sair} />
      <main className="container py-4">{pagina}</main>
      {aviso ? <div className={`toast-msg ${aviso.tipo}`}>{aviso.texto}</div> : null}
    </Contexto.Provider>
  );
}
