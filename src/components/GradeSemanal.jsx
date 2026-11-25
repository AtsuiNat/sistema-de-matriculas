import { DIA_CURTO, FAIXA, TURNO, porId } from '../horarios';

export default function GradeSemanal({ turmas, dados, aoClicar }) {
  const dias = [2, 3, 4, 5, 6, 7];
  const turnos = [1, 2, 3];
  return (
    <div className="grade-scroll">
      <div className="grade">
        <div className="gh" />
        {dias.map((dia) => <div className="gh" key={dia}>{DIA_CURTO[dia]}</div>)}
        {turnos.map((turno) => (
          <div className="contents" key={turno}>
            <div className="gh">{TURNO[turno]}<small>{FAIXA[turno]}</small></div>
            {dias.map((dia) => {
              const codigo = `${dia}${turno}`;
              const itens = turmas.filter((turma) => turma.horarios.includes(codigo));
              return (
                <div className="celula" key={codigo}>
                  {itens.map((turma) => {
                    const disciplina = porId(dados.disciplinas, turma.disciplinaId);
                    const professor = porId(dados.professores, turma.professorId);
                    if (!disciplina || !professor) return null;
                    const miolo = (
                      <>
                        <strong>{disciplina.codigo}</strong>
                        <span>{turma.codigo} · {professor.nome.split(' ')[0]}</span>
                      </>
                    );
                    if (!aoClicar) return <div className={`chip turno-${turma.horarios[0][1]}`} key={turma.id}>{miolo}</div>;
                    return (
                      <button type="button" className={`chip turno-${turma.horarios[0][1]}`} key={turma.id} onClick={() => aoClicar(turma)}>
                        {miolo}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
