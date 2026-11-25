import { useState } from 'react';
import { useApp } from '../contexto';
import { descrever, porId, turmasDoAluno } from '../horarios';
import Cabecalho from './Cabecalho';
import GradeSemanal from './GradeSemanal';
import Modal from './Modal';

export default function MinhaGrade() {
  const { dados, usuario, pedir, recarregar, notificar } = useApp();
  const [cancelar, setCancelar] = useState(null);
  const turmas = turmasDoAluno(dados, usuario.id);
  const ativas = dados.matriculas.filter((item) => item.alunoId === usuario.id && item.status === 'ativa');

  async function confirmar() {
    const matricula = cancelar;
    setCancelar(null);
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
      <Cabecalho titulo="Minha grade" texto="Dia e turno das turmas em que você está matriculado." />
      <div className="painel p-3 mb-3">
        <GradeSemanal turmas={turmas} dados={dados} />
      </div>
      <div className="painel px-3">
        {ativas.length === 0 ? <p className="text-secondary py-3 mb-0">Nenhuma matrícula ativa.</p> : (
          <ul className="lista-mat">
            {ativas.map((item) => {
              const turma = porId(dados.turmas, item.turmaId);
              const disciplina = porId(dados.disciplinas, turma.disciplinaId);
              return (
                <li key={item.id}>
                  <div>
                    <strong>{disciplina.codigo} — {disciplina.nome}</strong>
                    <span>Turma {turma.codigo} · sala {turma.sala}</span>
                    <span>{turma.horarios.map(descrever).join(' · ')}</span>
                  </div>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCancelar(item)}>Cancelar</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {cancelar ? (
        <Modal
          titulo="Cancelar matrícula"
          fechar={() => setCancelar(null)}
          rodape={(
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setCancelar(null)}>Voltar</button>
              <button type="button" className="btn btn-outline-danger" onClick={confirmar}>Cancelar matrícula</button>
            </>
          )}
        >
          <p className="mb-0">A vaga volta para a oferta.</p>
        </Modal>
      ) : null}
    </>
  );
}
