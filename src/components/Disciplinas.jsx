import { useState } from 'react';
import { useApp } from '../contexto';
import { porId } from '../horarios';
import Cabecalho from './Cabecalho';
import Modal from './Modal';

function nomes(dados, ids) {
  if (!ids || !ids.length) return 'Nenhum';
  return ids.map((id) => {
    const disciplina = porId(dados.disciplinas, id);
    return disciplina ? disciplina.codigo : id;
  }).join(', ');
}

function FormDisciplina({ disciplina, fechar }) {
  const { dados, pedir, recarregar, notificar } = useApp();
  const [codigo, setCodigo] = useState(disciplina ? disciplina.codigo : '');
  const [nome, setNome] = useState(disciplina ? disciplina.nome : '');
  const [ementa, setEmenta] = useState(disciplina ? disciplina.ementa : '');
  const [cargaHoraria, setCargaHoraria] = useState(disciplina ? disciplina.cargaHoraria : 60);
  const [creditos, setCreditos] = useState(disciplina ? disciplina.creditos : 4);
  const [prerequisitos, setPrerequisitos] = useState(disciplina ? disciplina.prerequisitos : []);

  function alternar(id) {
    setPrerequisitos((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : atual.concat(id)));
  }

  async function salvar(evento) {
    evento.preventDefault();
    try {
      await pedir(disciplina ? `/api/disciplinas/${disciplina.id}` : '/api/disciplinas', {
        method: disciplina ? 'PUT' : 'POST',
        body: { codigo, nome, ementa, cargaHoraria: Number(cargaHoraria), creditos: Number(creditos), prerequisitos },
      });
      await recarregar();
      notificar('ok', disciplina ? 'Disciplina atualizada.' : 'Disciplina cadastrada.');
      fechar();
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  return (
    <Modal
      titulo={disciplina ? `Editar ${disciplina.codigo}` : 'Nova disciplina'}
      fechar={fechar}
      rodape={(
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={fechar}>Cancelar</button>
          <button type="submit" form="form-disciplina" className="btn btn-primary">Salvar</button>
        </>
      )}
    >
      <form id="form-disciplina" className="row g-3" onSubmit={salvar}>
        <div className="col-md-4"><label className="form-label">Código</label><input className="form-control" required value={codigo} onChange={(evento) => setCodigo(evento.target.value)} /></div>
        <div className="col-md-8"><label className="form-label">Nome</label><input className="form-control" required value={nome} onChange={(evento) => setNome(evento.target.value)} /></div>
        <div className="col-md-6"><label className="form-label">Carga horária</label><input className="form-control" type="number" min="10" max="200" required value={cargaHoraria} onChange={(evento) => setCargaHoraria(evento.target.value)} /></div>
        <div className="col-md-6"><label className="form-label">Créditos</label><input className="form-control" type="number" min="1" max="12" required value={creditos} onChange={(evento) => setCreditos(evento.target.value)} /></div>
        <div className="col-12">
          <label className="form-label">Pré-requisitos</label>
          <div className="checks">
            {dados.disciplinas.filter((item) => !disciplina || item.id !== disciplina.id).map((item) => (
              <label className="check" key={item.id}>
                <input type="checkbox" checked={prerequisitos.includes(item.id)} onChange={() => alternar(item.id)} />
                <span>{item.codigo} — {item.nome}</span>
              </label>
            ))}
          </div>
        </div>
        <input type="hidden" value={ementa} readOnly />
      </form>
    </Modal>
  );
}

export default function Disciplinas() {
  const { dados, pedir, recarregar, notificar } = useApp();
  const [editando, setEditando] = useState(null);
  const [criando, setCriando] = useState(false);
  const [excluir, setExcluir] = useState(null);

  async function confirmarExclusao() {
    const disciplina = excluir;
    setExcluir(null);
    try {
      await pedir(`/api/disciplinas/${disciplina.id}`, { method: 'DELETE' });
      await recarregar();
      notificar('ok', 'Disciplina excluída.');
    } catch (erro) {
      notificar('erro', erro.message);
    }
  }

  return (
    <>
      <Cabecalho
        titulo="Disciplinas"
        texto="Pré-requisito é uma disciplina já aprovada."
        acao={<button type="button" className="btn btn-primary" onClick={() => setCriando(true)}>Nova disciplina</button>}
      />
      <div className="painel table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead><tr><th>Código</th><th>Disciplina</th><th>Carga</th><th>Créditos</th><th>Pré-requisitos</th><th /></tr></thead>
          <tbody>
            {dados.disciplinas.map((disciplina) => (
              <tr key={disciplina.id}>
                <td className="text-nowrap">{disciplina.codigo}</td>
                <td>{disciplina.nome}</td>
                <td>{disciplina.cargaHoraria}h</td>
                <td>{disciplina.creditos}</td>
                <td>{nomes(dados, disciplina.prerequisitos)}</td>
                <td className="text-end text-nowrap">
                  <button type="button" className="btn btn-outline-secondary btn-sm me-1" onClick={() => setEditando(disciplina)}>Editar</button>
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setExcluir(disciplina)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {criando ? <FormDisciplina fechar={() => setCriando(false)} /> : null}
      {editando ? <FormDisciplina disciplina={editando} fechar={() => setEditando(null)} /> : null}
      {excluir ? (
        <Modal titulo="Excluir disciplina" fechar={() => setExcluir(null)} rodape={(
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setExcluir(null)}>Voltar</button>
            <button type="button" className="btn btn-outline-danger" onClick={confirmarExclusao}>Excluir</button>
          </>
        )}>
          <p className="mb-0">Se a disciplina tiver turma, pré-requisito ou histórico, o servidor recusa.</p>
        </Modal>
      ) : null}
    </>
  );
}
