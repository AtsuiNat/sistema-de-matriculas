export const DIA = {
  2: 'segunda-feira',
  3: 'terça-feira',
  4: 'quarta-feira',
  5: 'quinta-feira',
  6: 'sexta-feira',
  7: 'sábado',
};

export const DIA_CURTO = {
  2: 'Segunda',
  3: 'Terça',
  4: 'Quarta',
  5: 'Quinta',
  6: 'Sexta',
  7: 'Sábado',
};

export const TURNO = { 1: 'manhã', 2: 'tarde', 3: 'noite' };
export const FAIXA = { 1: '08:00–11:30', 2: '13:30–17:00', 3: '19:00–22:30' };

export function porId(lista, id) {
  return (lista || []).find((item) => item.id === id) || null;
}

export function descrever(codigo) {
  return `${DIA[codigo[0]]} de ${TURNO[codigo[1]]} (${codigo})`;
}

export function resumoHorarios(horarios) {
  const grupos = {};
  horarios.forEach((codigo) => {
    const turno = codigo[1];
    if (!grupos[turno]) grupos[turno] = [];
    grupos[turno].push(DIA_CURTO[codigo[0]]);
  });
  return Object.entries(grupos)
    .map(([turno, dias]) => `${dias.join(' e ')}, ${TURNO[turno]}`)
    .join(' · ');
}

export function classeDoTurno(codigo) {
  if (codigo[1] === '1') return 'text-bg-warning';
  if (codigo[1] === '2') return 'text-bg-primary';
  return 'text-bg-dark';
}

export function turmasDoAluno(dados, alunoId) {
  return dados.matriculas
    .filter((item) => item.alunoId === alunoId && item.status === 'ativa')
    .map((item) => porId(dados.turmas, item.turmaId))
    .filter(Boolean);
}

export function turmasDoProfessor(dados, professorId) {
  return dados.turmas.filter((turma) => turma.professorId === professorId);
}
