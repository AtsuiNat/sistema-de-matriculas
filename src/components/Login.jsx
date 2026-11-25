import { useState } from 'react';
import { api } from '../api';

const CONTAS = [
  { nome: 'Lucas Ferreira', detalhe: '20251103 · aluno', perfil: 'aluno', login: '20251103' },
  { nome: 'João Pedro Lima', detalhe: '20240045 · aluno', perfil: 'aluno', login: '20240045' },
  { nome: 'Marina Costa', detalhe: '20230198 · aluna', perfil: 'aluno', login: '20230198' },
  { nome: 'Secretaria', detalhe: 'usuário secretaria', perfil: 'instituicao', login: 'secretaria' },
];

export default function Login({ aoEntrar }) {
  const [perfil, setPerfil] = useState('aluno');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('123456');
  const [erro, setErro] = useState('');

  async function entrar(ident, sen, perf) {
    setErro('');
    try {
      const usuario = await api('/api/login', {
        method: 'POST',
        body: { identificador: ident, senha: sen, perfil: perf },
      });
      aoEntrar(usuario);
    } catch (falha) {
      setErro(falha.message);
    }
  }

  return (
    <div className="container login-caixa">
      <h1 className="h3">Sistema De Matrículas</h1>
      <p className="lede">Semestre 2026.2. A senha das contas abaixo é 123456.</p>
      <form
        className="painel p-3 mb-3"
        onSubmit={(evento) => {
          evento.preventDefault();
          entrar(identificador, senha, perfil);
        }}
      >
        <div className="btn-group mb-3">
          <input type="radio" className="btn-check" name="perfil" id="perfil-aluno" checked={perfil === 'aluno'} onChange={() => setPerfil('aluno')} />
          <label className="btn btn-outline-secondary" htmlFor="perfil-aluno">Aluno</label>
          <input type="radio" className="btn-check" name="perfil" id="perfil-inst" checked={perfil === 'instituicao'} onChange={() => setPerfil('instituicao')} />
          <label className="btn btn-outline-secondary" htmlFor="perfil-inst">Secretaria</label>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="identificador">{perfil === 'aluno' ? 'Matrícula' : 'Usuário'}</label>
          <input id="identificador" className="form-control" required value={identificador} placeholder={perfil === 'aluno' ? '20251103' : 'secretaria'} onChange={(evento) => setIdentificador(evento.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="senha">Senha</label>
          <input id="senha" className="form-control" type="password" required value={senha} onChange={(evento) => setSenha(evento.target.value)} />
        </div>
        {erro ? <p className="text-danger">{erro}</p> : null}
        <button className="btn btn-primary w-100" type="submit">Entrar</button>
      </form>
      {CONTAS.map((conta) => (
        <button key={conta.login} type="button" className="conta" onClick={() => entrar(conta.login, '123456', conta.perfil)}>
          <strong>{conta.nome}</strong>
          <span>{conta.detalhe}</span>
        </button>
      ))}
    </div>
  );
}
