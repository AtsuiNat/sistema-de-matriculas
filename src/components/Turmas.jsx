import { useState } from 'react';
import { useApp } from '../contexto';
import { classeDoTurno, porId, turmasDoProfessor } from '../horarios';
import Cabecalho from './Cabecalho';
import GradeSemanal from './GradeSemanal';
import Modal from './Modal';

const DIAS = [['', 'Dia'], ['2', 'Segunda'], ['3', 'Terça'], ['4', 'Quarta'], ['5', 'Quinta'], ['6', 'Sexta'], ['7', 'Sábado']];
const TURNOS = [['', 'Turno'], ['1', 'Manhã'], ['2', 'Tarde'], ['3', 'Noite']];

function CampoHorario({ titulo, dia, turno, setDia, setTurno }) {
  return (
    <div className="col-md-6">
      <label className="form-label">{titulo}</label>
      <div className="row g-2">
        <div className="col-7">
          <select className="form-select" value={dia} onChange={(evento) => setDia(evento.target.value)}>
            {DIAS.map(([valor, rotulo]) => <option key={rotulo} value={valor}>{rotulo}</option>)}
          </select>
        </div>
        <div className="col-5">
          <select className="form-select" value={turno} onChange={(evento) => setTurno(evento.target.value)}>
            {TURNOS.map(([valor, rotulo]) => <option key={titulo + rotulo} value={valor}>{rotulo}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function FormTurma({ turma, fechar }) {
  const { dados, pedir, recarregar, notificar } = useApp();
  const [codigo, setCodigo] = useState(turma ? turma.codigo : '');
  const [disciplinaId, setDisciplinaId] = useState(turma ? turma.disciplinaId : (dados.disciplinas[0] && dados.disciplinas[0].id));
  const [professorId, setProfessorId] = useState(turma ? turma.professorId : '');
  const [vagas, setVagas] = useState(turma ? turma.vagas : 30);
  const [sala, setSala] = useState(turma ? turma.sala : '');
  const [dia1, setDia1] = useState(turma && turma.horarios[0] ? turma.horarios[0][0] : '');
  const [turno1, setTurno1] = useState(turma && turma.horarios[0] ? turma.horarios[0][1] : '');
  const [dia2, setDia2] = useState(turma && turma.horarios[1] ? turma.horarios[1][0] : '');
  const [turno2, setTurno2] = useState(turma && turma.horarios[1] ? turma.horarios[1][1] : '');

  let professores = dados.professores.filter((professor) => (professor.disciplinas || []).includes(disciplinaId));
  if (professorId && !professores.some((professor) => professor.id === professorId)) {
    const extra = porId(dados.professores, professorId);
    if (extra) professores = professores.concat(extra);
  }
  const escolhido = professorId || (professores[0] && professores[0].id) || '';
  const professor = porId(dados.professores, escolhido);
  let quantidade = professor ? turmasDoProfessor(dados, professor.id).length : 0;
  if (turma && professor && turma.professorId === professor.id) quantidade -= 1;
  const depois = quantidade + 1;
  const estourou = professor ? depois > professor.cargaMaxima : false;

  async function salvar(evento) {
    evento.preventDefault();
    if (!dia1 || !turno1 || (dia2 && !turno2) || (!dia2 && turno2)) {
      notificar('erro', 'Escolha o dia e o turno de cada horário preenchido.');
      return;
    }
    const horarios = [`${dia1}${turno1}`];
    if (dia2 && turno2) horarios.push(`${dia2}${turno2}`);
    try {
      await pedir(turma ? `/api/turmas/${turma.id}` : '/api/turmas', {
        method: turma ? 'PUT' : 'POST',
        body: { codigo, disciplinaId, professorId: escolhido, horarios, vagas: Number(vagas), sala },
      });
      await recarregar();
      notificar('ok', turma ? 'Turma atualizada.' : 'Turma ofertada.');
      fechar();
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  return (
    <Modal
      titulo={turma ? `Editar ${turma.codigo}` : 'Nova turma'}
      fechar={fechar}
      rodape={(
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={fechar}>Cancelar</button>
          <button type="submit" form="form-turma" className="btn btn-primary">Salvar turma</button>
        </>
      )}
    >
      <form id="form-turma" className="row g-3" onSubmit={salvar}>
        <div className="col-md-4">
          <label className="form-label">Código</label>
          <input className="form-control" required value={codigo} onChange={(evento) => setCodigo(evento.target.value)} />
        </div>
        <div className="col-md-8">
          <label className="form-label">Disciplina</label>
          <select className="form-select" value={disciplinaId} onChange={(evento) => { setDisciplinaId(evento.target.value); setProfessorId(''); }}>
            {dados.disciplinas.map((disciplina) => <option key={disciplina.id} value={disciplina.id}>{disciplina.codigo} — {disciplina.nome}</option>)}
          </select>
        </div>
        <div className="col-md-8">
          <label className="form-label">Professor</label>
          <select className="form-select" value={escolhido} onChange={(evento) => setProfessorId(evento.target.value)}>
            {professores.map((item) => {
              const carga = turmasDoProfessor(dados, item.id).length;
              return <option key={item.id} value={item.id}>{item.nome} · {carga}/{item.cargaMaxima}{carga >= item.cargaMaxima ? ' · no limite' : ''}</option>;
            })}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Vagas</label>
          <input className="form-control" type="number" min="1" max="200" required value={vagas} onChange={(evento) => setVagas(evento.target.value)} />
        </div>
        <CampoHorario titulo="Primeiro horário" dia={dia1} turno={turno1} setDia={setDia1} setTurno={setTurno1} />
        <CampoHorario titulo="Segundo horário" dia={dia2} turno={turno2} setDia={setDia2} setTurno={setTurno2} />
        <div className="col-md-6">
          <label className="form-label">Sala</label>
          <input className="form-control" required value={sala} onChange={(evento) => setSala(evento.target.value)} />
        </div>
        {professor ? (
          <div className="col-12">
            <p className={estourou ? 'alert alert-warning py-2 mb-0' : 'text-secondary mb-0'}>
              Esta oferta deixaria {professor.nome} com {depois} de {professor.cargaMaxima} turmas. {estourou ? 'O servidor recusa porque isso passa do limite.' : 'Essa quantidade ainda cabe na carga.'}
            </p>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

export default function Turmas() {
  const { dados, pedir, recarregar, notificar } = useApp();
  const [aba, setAba] = useState('lista');
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null);
  const [criando, setCriando] = useState(false);
  const [excluir, setExcluir] = useState(null);
  const limite = dados.professores.filter((professor) => turmasDoProfessor(dados, professor.id).length >= professor.cargaMaxima);

  const linhas = dados.turmas.filter((turma) => {
    const disciplina = porId(dados.disciplinas, turma.disciplinaId);
    const professor = porId(dados.professores, turma.professorId);
    const texto = `${turma.codigo} ${disciplina ? disciplina.nome : ''} ${professor ? professor.nome : ''}`.toLowerCase();
    return !busca.trim() || texto.includes(busca.trim().toLowerCase());
  });

  async function confirmarExclusao() {
    const turma = excluir;
    setExcluir(null);
    try {
      await pedir(`/api/turmas/${turma.id}`, { method: 'DELETE' });
      await recarregar();
      notificar('ok', 'Turma excluída.');
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  async function restaurar() {
    try {
      await pedir('/api/restaurar', { method: 'POST', body: {} });
      await recarregar();
      notificar('ok', 'Dados iniciais restaurados.');
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  return (
    <>
      <Cabecalho
        titulo="Turmas"
        texto="Disciplina, professor, horário e número de vagas."
        acao={<button type="button" className="btn btn-primary" onClick={() => setCriando(true)}>Nova turma</button>}
      />
      {limite.length ? (
        <div className="alert alert-warning py-2">
          No limite de turmas: {limite.map((professor) => `${professor.nome} (${turmasDoProfessor(dados, professor.id).length}/${professor.cargaMaxima})`).join(', ')}.
        </div>
      ) : null}
      <div className="btn-group mb-3">
        <button type="button" className={`btn btn-sm ${aba === 'lista' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setAba('lista')}>Lista</button>
        <button type="button" className={`btn btn-sm ${aba === 'grade' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setAba('grade')}>Grade da semana</button>
      </div>
      {aba === 'lista' ? (
        <>
          <input className="form-control mb-3" value={busca} placeholder="Turma, disciplina ou professor" onChange={(evento) => setBusca(evento.target.value)} />
          <div className="painel table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr><th>Turma</th><th>Disciplina</th><th>Professor</th><th>Horário</th><th>Vagas</th><th>Sala</th><th /></tr>
              </thead>
              <tbody>
                {linhas.map((turma) => {
                  const disciplina = porId(dados.disciplinas, turma.disciplinaId);
                  const professor = porId(dados.professores, turma.professorId);
                  return (
                    <tr key={turma.id}>
                      <td className="meio text-nowrap">{turma.codigo}</td>
                      <td>{disciplina ? `${disciplina.codigo} — ${disciplina.nome}` : ''}</td>
                      <td className="text-nowrap">{professor ? professor.nome : ''}</td>
                      <td className="meio text-nowrap">{turma.horarios.map((horario) => <span key={horario} className={`badge ${classeDoTurno(horario)} me-1`}>{horario}</span>)}</td>
                      <td className="meio">{dados.ocupacao[turma.id] || 0}/{turma.vagas}</td>
                      <td className="meio text-nowrap">{turma.sala}</td>
                      <td className="meio text-nowrap">
                        <button type="button" className="btn btn-outline-secondary btn-sm me-1" onClick={() => setEditando(turma)}>Editar</button>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setExcluir(turma)}>Excluir</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="painel p-3">
          <GradeSemanal turmas={dados.turmas} dados={dados} aoClicar={setEditando} />
        </div>
      )}
      <div className="text-center"><button type="button" className="btn btn-link" onClick={restaurar}>Voltar aos dados iniciais</button></div>
      {criando ? <FormTurma fechar={() => setCriando(false)} /> : null}
      {editando ? <FormTurma turma={editando} fechar={() => setEditando(null)} /> : null}
      {excluir ? (
        <Modal
          titulo="Excluir turma"
          fechar={() => setExcluir(null)}
          rodape={(
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setExcluir(null)}>Voltar</button>
              <button type="button" className="btn btn-outline-danger" onClick={confirmarExclusao}>Excluir</button>
            </>
          )}
        >
          <p className="mb-0">Se ainda houver aluno matriculado, o servidor recusa a exclusão de {excluir.codigo}.</p>
        </Modal>
      ) : null}
    </>
  );
}
