import { useState } from 'react';
import { useApp } from '../contexto';
import { classeDoTurno, porId, descrever, resumoHorarios } from '../horarios';
import Cabecalho from './Cabecalho';
import Modal from './Modal';

export default function Ofertas() {
  const { dados, usuario, pedir, recarregar, notificar } = useApp();
  const [busca, setBusca] = useState('');
  const [dia, setDia] = useState('');
  const [turno, setTurno] = useState('');
  const [confirma, setConfirma] = useState(null);

  const lista = dados.turmas.filter((turma) => {
    const disciplina = porId(dados.disciplinas, turma.disciplinaId);
    const professor = porId(dados.professores, turma.professorId);
    const texto = `${disciplina ? disciplina.codigo : ''} ${disciplina ? disciplina.nome : ''} ${turma.codigo} ${professor ? professor.nome : ''}`.toLowerCase();
    if (busca && !texto.includes(busca.trim().toLowerCase())) return false;
    if (dia && !turma.horarios.some((horario) => horario[0] === dia)) return false;
    if (turno && !turma.horarios.some((horario) => horario[1] === turno)) return false;
    return true;
  });

  async function confirmarMatricula() {
    const turma = confirma;
    setConfirma(null);
    try {
      await pedir('/api/matriculas', { method: 'POST', body: { turmaId: turma.id } });
      await recarregar();
      const disciplina = porId(dados.disciplinas, turma.disciplinaId);
      notificar('ok', `Matrícula confirmada em ${disciplina.codigo}.`);
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  return (
    <>
      <Cabecalho titulo="Ofertas" texto="Escolha a turma e clique em Matricular." />
      <div className="row g-2 mb-3">
        <div className="col-md-6">
          <input className="form-control" type="search" value={busca} placeholder="Disciplina, professor ou turma" onChange={(evento) => setBusca(evento.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select" value={dia} onChange={(evento) => setDia(evento.target.value)}>
            <option value="">Todos os dias</option>
            <option value="2">Segunda</option>
            <option value="3">Terça</option>
            <option value="4">Quarta</option>
            <option value="5">Quinta</option>
            <option value="6">Sexta</option>
            <option value="7">Sábado</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select" value={turno} onChange={(evento) => setTurno(evento.target.value)}>
            <option value="">Todos os turnos</option>
            <option value="1">Manhã</option>
            <option value="2">Tarde</option>
            <option value="3">Noite</option>
          </select>
        </div>
      </div>
      <div className="painel table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Disciplina</th>
              <th>Turma</th>
              <th>Professor</th>
              <th>Horário</th>
              <th>Vagas</th>
              <th>Situação</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.map((turma) => {
              const disciplina = porId(dados.disciplinas, turma.disciplinaId);
              const professor = porId(dados.professores, turma.professorId);
              const ocupadas = dados.ocupacao[turma.id] || 0;
              const motivos = (dados.simulacao[usuario.id] || {})[turma.id] || [];
              const dentro = motivos.some((motivo) => motivo.includes('matriculado nesta turma'));
              return (
                <tr key={turma.id}>
                  <td><strong>{disciplina.codigo}</strong><div className="small text-secondary">{disciplina.nome}</div></td>
                  <td className="meio text-nowrap">{turma.codigo}<div className="small text-secondary">sala {turma.sala}</div></td>
                  <td className="text-nowrap">{professor.nome}</td>
                  <td className="meio">
                    {turma.horarios.map((horario) => (
                      <span key={horario} className={`badge ${classeDoTurno(horario)} me-1`}>{horario}</span>
                    ))}
                    <div className="small text-secondary mt-1">{resumoHorarios(turma.horarios)}</div>
                  </td>
                  <td className="meio text-nowrap">{ocupadas}/{turma.vagas}</td>
                  <td className={motivos.length && !dentro ? 'text-danger' : 'text-success'}>
                    {dentro ? 'Matriculado' : (motivos.join(' ') || 'Disponível')}
                  </td>
                  <td className="meio">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={dentro}
                      onClick={() => {
                        if (motivos.length) notificar('erro', motivos.join(' '));
                        else setConfirma(turma);
                      }}
                    >
                      {dentro ? 'Matriculado' : 'Matricular'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 ? <tr><td colSpan="7" className="text-secondary text-center py-4">Nenhuma turma com esse filtro.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {confirma ? (
        <Modal
          titulo="Confirmar matrícula"
          fechar={() => setConfirma(null)}
          rodape={(
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirma(null)}>Voltar</button>
              <button type="button" className="btn btn-primary" onClick={confirmarMatricula}>Confirmar matrícula</button>
            </>
          )}
        >
          <p className="mb-0">
            {porId(dados.disciplinas, confirma.disciplinaId).codigo} — {porId(dados.disciplinas, confirma.disciplinaId).nome}, turma {confirma.codigo}, {confirma.horarios.map(descrever).join(' e ')}.
          </p>
        </Modal>
      ) : null}
    </>
  );
}
