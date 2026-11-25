import { useState } from 'react';
import { useApp } from '../contexto';
import { descrever, porId } from '../horarios';
import Cabecalho from './Cabecalho';
import Modal from './Modal';

function FormAluno({ aluno, fechar }) {
  const { dados, pedir, recarregar, notificar } = useApp();
  const [nome, setNome] = useState(aluno ? aluno.nome : '');
  const [matricula, setMatricula] = useState(aluno ? aluno.matricula : '');
  const [email, setEmail] = useState(aluno ? aluno.email : '');
  const [curso, setCurso] = useState(aluno ? aluno.curso : dados.curso);
  const [periodo, setPeriodo] = useState(aluno ? aluno.periodo : 1);
  const [senha, setSenha] = useState(aluno ? '' : '123456');

  async function salvar(evento) {
    evento.preventDefault();
    try {
      await pedir(aluno ? `/api/alunos/${aluno.id}` : '/api/alunos', {
        method: aluno ? 'PUT' : 'POST',
        body: { nome, matricula, email, curso, periodo: Number(periodo), senha },
      });
      await recarregar();
      notificar('ok', aluno ? 'Aluno atualizado.' : 'Aluno cadastrado.');
      fechar();
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  return (
    <Modal titulo={aluno ? 'Editar aluno' : 'Novo aluno'} fechar={fechar} rodape={(
      <>
        <button type="button" className="btn btn-outline-secondary" onClick={fechar}>Cancelar</button>
        <button type="submit" form="form-aluno" className="btn btn-primary">Salvar</button>
      </>
    )}>
      <form id="form-aluno" className="row g-3" onSubmit={salvar}>
        <div className="col-md-8"><label className="form-label">Nome</label><input className="form-control" required value={nome} onChange={(evento) => setNome(evento.target.value)} /></div>
        <div className="col-md-4"><label className="form-label">Período</label><input className="form-control" type="number" min="1" max="12" required value={periodo} onChange={(evento) => setPeriodo(evento.target.value)} /></div>
        <div className="col-md-6"><label className="form-label">Matrícula</label><input className="form-control" required value={matricula} onChange={(evento) => setMatricula(evento.target.value)} /></div>
        <div className="col-md-6"><label className="form-label">E-mail</label><input className="form-control" type="email" required value={email} onChange={(evento) => setEmail(evento.target.value)} /></div>
        <div className="col-md-8"><label className="form-label">Curso</label><input className="form-control" required value={curso} onChange={(evento) => setCurso(evento.target.value)} /></div>
        <div className="col-md-4"><label className="form-label">{aluno ? 'Nova senha' : 'Senha'}</label><input className="form-control" value={senha} placeholder={aluno ? 'em branco mantém a atual' : ''} onChange={(evento) => setSenha(evento.target.value)} /></div>
      </form>
    </Modal>
  );
}

export default function Alunos() {
  const { dados, pedir, recarregar, notificar } = useApp();
  const [busca, setBusca] = useState('');
  const [focoId, setFocoId] = useState(dados.alunos[0] ? dados.alunos[0].id : null);
  const [turmaId, setTurmaId] = useState('');
  const [editando, setEditando] = useState(null);
  const [criando, setCriando] = useState(false);
  const aluno = porId(dados.alunos, focoId) || dados.alunos[0] || null;
  const filtrados = dados.alunos.filter((item) => `${item.nome} ${item.matricula}`.toLowerCase().includes(busca.trim().toLowerCase()));
  const ativas = aluno ? dados.matriculas.filter((item) => item.alunoId === aluno.id && item.status === 'ativa') : [];
  const motivos = aluno && turmaId ? ((dados.simulacao[aluno.id] || {})[turmaId] || []) : [];

  async function salvarHistorico(evento) {
    evento.preventDefault();
    const marcados = [...evento.target.querySelectorAll('input[name="historico"]:checked')].map((campo) => campo.value);
    try {
      await pedir(`/api/alunos/${aluno.id}/historico`, { method: 'PUT', body: { historico: marcados } });
      await recarregar();
      notificar('ok', 'Aprovações atualizadas.');
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  async function matricular(evento) {
    evento.preventDefault();
    if (!turmaId) {
      notificar('erro', 'Escolha uma turma.');
      return;
    }
    try {
      await pedir('/api/matriculas', { method: 'POST', body: { alunoId: aluno.id, turmaId } });
      await recarregar();
      setTurmaId('');
      notificar('ok', 'Matrícula registrada.');
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  async function cancelar(matricula) {
    try {
      await pedir(`/api/matriculas/${matricula.id}/cancelar`, { method: 'POST', body: {} });
      await recarregar();
      notificar('ok', 'Matrícula cancelada.');
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  return (
    <>
      <Cabecalho
        titulo="Alunos"
        texto="A secretaria consulta o aluno e registra a matrícula."
        acao={<button type="button" className="btn btn-primary" onClick={() => setCriando(true)}>Novo aluno</button>}
      />
      <div className="row g-3">
        <div className="col-lg-4">
          <input className="form-control mb-3" value={busca} placeholder="Nome ou matrícula" onChange={(evento) => setBusca(evento.target.value)} />
          {filtrados.map((item) => (
            <button type="button" key={item.id} className={`aluno-item ${aluno && item.id === aluno.id ? 'ativo' : ''}`} onClick={() => { setFocoId(item.id); setTurmaId(''); }}>
              <strong>{item.nome}</strong>
              <span>{item.matricula} · {item.periodo}º período</span>
            </button>
          ))}
        </div>
        <div className="col-lg-8">
          {aluno ? (
            <div className="painel p-3">
              <div className="d-flex justify-content-between gap-2 mb-2">
                <div>
                  <h2 className="h5 mb-1">{aluno.nome}</h2>
                  <p className="text-secondary mb-0">{aluno.matricula} · {aluno.periodo}º período</p>
                </div>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditando(aluno)}>Editar</button>
              </div>
              {ativas.length === 0 ? <p className="text-secondary">Nenhuma matrícula ativa.</p> : (
                <ul className="lista-mat">
                  {ativas.map((item) => {
                    const turma = porId(dados.turmas, item.turmaId);
                    const disciplina = porId(dados.disciplinas, turma.disciplinaId);
                    return (
                      <li key={item.id}>
                        <div>
                          <strong>{disciplina.codigo} — {disciplina.nome}</strong>
                          <span>{turma.horarios.map(descrever).join(' · ')}</span>
                        </div>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => cancelar(item)}>Cancelar</button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <form className="row g-2 mt-2" onSubmit={matricular}>
                <div className="col-md-8">
                  <label className="form-label" htmlFor="turma-atendimento">Matricular em</label>
                  <select id="turma-atendimento" className="form-select" value={turmaId} onChange={(evento) => setTurmaId(evento.target.value)}>
                    <option value="">Escolha uma turma</option>
                    {[...dados.turmas].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((turma) => {
                      const disciplina = porId(dados.disciplinas, turma.disciplinaId);
                      return <option key={turma.id} value={turma.id}>{turma.codigo} — {disciplina ? disciplina.nome : ''}</option>;
                    })}
                  </select>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button className="btn btn-primary w-100" type="submit">Matricular</button>
                </div>
                {turmaId ? <div className="col-12"><p className={motivos.length ? 'text-danger small mb-0' : 'text-success small mb-0'}>{motivos.length ? motivos.join(' ') : 'Pode matricular nesta turma.'}</p></div> : null}
              </form>
              <form className="mt-3" key={`${aluno.id}-${(aluno.historico || []).join(',')}`} onSubmit={salvarHistorico}>
                <label className="form-label">Disciplinas já aprovadas</label>
                <div className="checks">
                  {dados.disciplinas.map((disciplina) => (
                    <label className="check" key={disciplina.id}>
                      <input name="historico" type="checkbox" value={disciplina.id} defaultChecked={(aluno.historico || []).includes(disciplina.id)} />
                      <span>{disciplina.codigo} — {disciplina.nome}</span>
                    </label>
                  ))}
                </div>
                <button className="btn btn-outline-secondary mt-2" type="submit">Salvar aprovações</button>
              </form>
            </div>
          ) : <p className="text-secondary">Nenhum aluno cadastrado.</p>}
        </div>
      </div>
      {criando ? <FormAluno fechar={() => setCriando(false)} /> : null}
      {editando ? <FormAluno aluno={editando} fechar={() => setEditando(null)} /> : null}
    </>
  );
}
