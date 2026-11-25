/*
  Sistema De Matrículas
  Universidade Aurora · protótipo acadêmico

  Este arquivo é o servidor web simples. Ele faz três coisas:
  1. Entrega os arquivos do front-end (HTML, CSS e JavaScript).
  2. Guarda os dados em data/db.json.
  3. Aplica as regras de matrícula e de alocação de professores.

  As telas são um aplicativo React. Este servidor, feito com Express,
  só entrega os arquivos prontos e a API em JSON. Ele não monta o HTML
  com os dados. Por isso não é renderização no servidor.

  Autor: Andrews
*/

const fs = require('fs');
const path = require('path');
const express = require('express');
const { exec } = require('child_process');

const RAIZ = __dirname;
const DIST = path.join(RAIZ, 'dist');
const DB = path.join(RAIZ, 'data', 'db.json');
const PORT = Number(process.env.PORT) || 3000;

const DIA = {
  2: 'segunda-feira',
  3: 'terça-feira',
  4: 'quarta-feira',
  5: 'quinta-feira',
  6: 'sexta-feira',
  7: 'sábado',
};

const TURNO = {
  1: 'manhã',
  2: 'tarde',
  3: 'noite',
};

let fila = Promise.resolve();

function horarioValido(codigo) {
  return typeof codigo === 'string' && /^[2-7][1-3]$/.test(codigo);
}

function descrever(codigo) {
  if (!horarioValido(codigo)) return String(codigo);
  return `${DIA[codigo[0]]} de ${TURNO[codigo[1]]} (${codigo})`;
}

function novoId(lista, prefixo) {
  let maximo = 0;
  for (const item of lista) {
    if (!String(item.id).startsWith(prefixo)) continue;
    const numero = Number(String(item.id).slice(prefixo.length));
    if (Number.isFinite(numero) && numero > maximo) maximo = numero;
  }
  return prefixo + (maximo + 1);
}

function ocupacao(db, turmaId) {
  return db.matriculas.filter((m) => m.turmaId === turmaId && m.status === 'ativa').length;
}

function baseInicial() {
  return {
    instituicao: 'Universidade Aurora',
    curso: 'Ciência da Computação',
    semestre: '2026.2',
    usuariosInst: [
      {
        id: 's1',
        nome: 'Renata Albuquerque',
        login: 'secretaria',
        senha: '123456',
        cargo: 'Secretaria acadêmica',
      },
    ],
    disciplinas: [
      { id: 'd1', codigo: 'ALG100', nome: 'Algoritmos e Lógica de Programação', ementa: 'Lógica, algoritmos e os primeiros programas.', cargaHoraria: 80, creditos: 4, prerequisitos: [] },
      { id: 'd2', codigo: 'MAT100', nome: 'Matemática Discreta', ementa: 'Conjuntos, lógica matemática e relações.', cargaHoraria: 60, creditos: 4, prerequisitos: [] },
      { id: 'd3', codigo: 'ICP100', nome: 'Introdução à Computação', ementa: 'Organização do computador e sistemas de numeração.', cargaHoraria: 60, creditos: 4, prerequisitos: [] },
      { id: 'd4', codigo: 'ED200', nome: 'Estruturas de Dados', ementa: 'Listas, pilhas, filas, árvores e o custo de cada uma.', cargaHoraria: 80, creditos: 4, prerequisitos: ['d1'] },
      { id: 'd5', codigo: 'BD200', nome: 'Banco de Dados', ementa: 'Modelagem relacional, consultas e integridade.', cargaHoraria: 80, creditos: 4, prerequisitos: ['d1'] },
      { id: 'd6', codigo: 'POO200', nome: 'Programação Orientada a Objetos', ementa: 'Objetos, encapsulamento, herança e interfaces.', cargaHoraria: 80, creditos: 4, prerequisitos: ['d1'] },
      { id: 'd7', codigo: 'WEB300', nome: 'Programação para Web', ementa: 'Páginas, interação no navegador e consumo de APIs.', cargaHoraria: 80, creditos: 4, prerequisitos: ['d6'] },
      { id: 'd8', codigo: 'ES300', nome: 'Engenharia de Software', ementa: 'Requisitos, processo de desenvolvimento e qualidade.', cargaHoraria: 60, creditos: 4, prerequisitos: ['d6'] },
      { id: 'd9', codigo: 'SO300', nome: 'Sistemas Operacionais', ementa: 'Processos, memória e sistemas de arquivos.', cargaHoraria: 60, creditos: 4, prerequisitos: ['d4'] },
      { id: 'd10', codigo: 'RED300', nome: 'Redes de Computadores', ementa: 'Redes, protocolos e comunicação entre aplicações.', cargaHoraria: 60, creditos: 4, prerequisitos: ['d3'] },
    ],
    professores: [
      { id: 'p1', nome: 'Helena Duarte', email: 'helena.duarte@aurora.edu.br', titulacao: 'Doutora', cargaMaxima: 3, disciplinas: ['d1', 'd4'] },
      { id: 'p2', nome: 'Marcos Vieira', email: 'marcos.vieira@aurora.edu.br', titulacao: 'Mestre', cargaMaxima: 2, disciplinas: ['d5'] },
      { id: 'p3', nome: 'Lúcia Andrade', email: 'lucia.andrade@aurora.edu.br', titulacao: 'Doutora', cargaMaxima: 3, disciplinas: ['d3', 'd7'] },
      { id: 'p4', nome: 'Ricardo Nunes', email: 'ricardo.nunes@aurora.edu.br', titulacao: 'Doutor', cargaMaxima: 3, disciplinas: ['d2', 'd9'] },
      { id: 'p5', nome: 'Camila Torres', email: 'camila.torres@aurora.edu.br', titulacao: 'Mestre', cargaMaxima: 2, disciplinas: ['d3', 'd10'] },
      { id: 'p6', nome: 'Paulo Mendes', email: 'paulo.mendes@aurora.edu.br', titulacao: 'Doutor', cargaMaxima: 3, disciplinas: ['d6', 'd8'] },
    ],
    alunos: [
      { id: 'a1', nome: 'Ana Beatriz Souza', matricula: '20240012', email: 'ana.souza@aluno.aurora.edu.br', senha: '123456', curso: 'Ciência da Computação', periodo: 3, historico: ['d1', 'd2', 'd3'] },
      { id: 'a2', nome: 'João Pedro Lima', matricula: '20240045', email: 'joao.lima@aluno.aurora.edu.br', senha: '123456', curso: 'Ciência da Computação', periodo: 1, historico: [] },
      { id: 'a3', nome: 'Marina Costa', matricula: '20230198', email: 'marina.costa@aluno.aurora.edu.br', senha: '123456', curso: 'Ciência da Computação', periodo: 5, historico: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'] },
      { id: 'a4', nome: 'Lucas Ferreira', matricula: '20251103', email: 'lucas.ferreira@aluno.aurora.edu.br', senha: '123456', curso: 'Ciência da Computação', periodo: 1, historico: [] },
    ],
    turmas: [
      { id: 't1', codigo: 'ALG-A', disciplinaId: 'd1', professorId: 'p1', horarios: ['21', '41'], vagas: 40, sala: 'B-101', semestre: '2026.2' },
      { id: 't2', codigo: 'ALG-B', disciplinaId: 'd1', professorId: 'p1', horarios: ['63'], vagas: 30, sala: 'B-204', semestre: '2026.2' },
      { id: 't3', codigo: 'ED-A', disciplinaId: 'd4', professorId: 'p1', horarios: ['33', '53'], vagas: 32, sala: 'B-110', semestre: '2026.2' },
      { id: 't4', codigo: 'MAT-A', disciplinaId: 'd2', professorId: 'p4', horarios: ['32'], vagas: 40, sala: 'C-201', semestre: '2026.2' },
      { id: 't5', codigo: 'SO-A', disciplinaId: 'd9', professorId: 'p4', horarios: ['61'], vagas: 28, sala: 'C-105', semestre: '2026.2' },
      { id: 't6', codigo: 'ICP-A', disciplinaId: 'd3', professorId: 'p3', horarios: ['51'], vagas: 35, sala: 'A-012', semestre: '2026.2' },
      { id: 't7', codigo: 'WEB-A', disciplinaId: 'd7', professorId: 'p3', horarios: ['31', '42'], vagas: 30, sala: 'Lab-2', semestre: '2026.2' },
      { id: 't8', codigo: 'ICP-B', disciplinaId: 'd3', professorId: 'p5', horarios: ['21'], vagas: 30, sala: 'A-008', semestre: '2026.2' },
      { id: 't9', codigo: 'RED-A', disciplinaId: 'd10', professorId: 'p5', horarios: ['53'], vagas: 1, sala: 'D-003', semestre: '2026.2' },
      { id: 't10', codigo: 'BD-A', disciplinaId: 'd5', professorId: 'p2', horarios: ['22', '43'], vagas: 32, sala: 'Lab-1', semestre: '2026.2' },
      { id: 't11', codigo: 'POO-A', disciplinaId: 'd6', professorId: 'p6', horarios: ['52', '71'], vagas: 30, sala: 'B-305', semestre: '2026.2' },
      { id: 't12', codigo: 'ES-A', disciplinaId: 'd8', professorId: 'p6', horarios: ['62'], vagas: 28, sala: 'B-210', semestre: '2026.2' },
    ],
    matriculas: [
      { id: 'm1', alunoId: 'a1', turmaId: 't3', status: 'ativa', criadoEm: '2026-11-10T13:00:00.000Z' },
      { id: 'm2', alunoId: 'a1', turmaId: 't10', status: 'ativa', criadoEm: '2026-11-10T13:00:00.000Z' },
      { id: 'm3', alunoId: 'a2', turmaId: 't2', status: 'ativa', criadoEm: '2026-11-10T13:00:00.000Z' },
      { id: 'm4', alunoId: 'a2', turmaId: 't4', status: 'ativa', criadoEm: '2026-11-10T13:00:00.000Z' },
      { id: 'm5', alunoId: 'a3', turmaId: 't7', status: 'ativa', criadoEm: '2026-11-10T13:00:00.000Z' },
      { id: 'm6', alunoId: 'a3', turmaId: 't12', status: 'ativa', criadoEm: '2026-11-10T13:00:00.000Z' },
      { id: 'm7', alunoId: 'a3', turmaId: 't9', status: 'ativa', criadoEm: '2026-11-10T13:00:00.000Z' },
    ],
  };
}

function garantirArquivo() {
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  if (!fs.existsSync(DB)) gravar(baseInicial());
}

function ler() {
  garantirArquivo();
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}

function gravar(db) {
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

function alterar(fn) {
  const execucao = fila.then(() => {
    const db = ler();
    const resultado = fn(db);
    if (!resultado || resultado.ok === false) return resultado;
    gravar(db);
    return resultado;
  });
  fila = execucao.then(() => undefined, () => undefined);
  return execucao;
}

function restaurarBase() {
  const execucao = fila.then(() => {
    gravar(baseInicial());
    return { ok: true };
  });
  fila = execucao.then(() => undefined, () => undefined);
  return execucao;
}

function alcanca(db, origem, destino) {
  const vistos = new Set();
  const disciplina = db.disciplinas.find((d) => d.id === origem);
  const pilha = [...((disciplina && disciplina.prerequisitos) || [])];
  while (pilha.length) {
    const id = pilha.pop();
    if (id === destino) return true;
    if (vistos.has(id)) continue;
    vistos.add(id);
    const proxima = db.disciplinas.find((d) => d.id === id);
    if (proxima) pilha.push(...(proxima.prerequisitos || []));
  }
  return false;
}

function criaCiclo(db, id, prereqs) {
  if ((prereqs || []).includes(id)) return true;
  return (prereqs || []).some((pre) => alcanca(db, pre, id));
}

function problemasDaBase(db) {
  const erros = [];
  const codigosDisciplina = new Set();

  for (const disciplina of db.disciplinas) {
    if (codigosDisciplina.has(disciplina.codigo)) erros.push(`Código de disciplina repetido: ${disciplina.codigo}`);
    codigosDisciplina.add(disciplina.codigo);
    for (const pre of disciplina.prerequisitos || []) {
      if (!db.disciplinas.some((item) => item.id === pre)) {
        erros.push(`${disciplina.codigo} tem pré-requisito inexistente`);
      }
    }
    if (criaCiclo(db, disciplina.id, disciplina.prerequisitos || [])) {
      erros.push(`Ciclo de pré-requisito em ${disciplina.codigo}`);
    }
  }

  const codigosTurma = new Set();
  const agenda = new Map();

  for (const turma of db.turmas) {
    if (codigosTurma.has(turma.codigo)) erros.push(`Código de turma repetido: ${turma.codigo}`);
    codigosTurma.add(turma.codigo);

    const disciplina = db.disciplinas.find((item) => item.id === turma.disciplinaId);
    const professor = db.professores.find((item) => item.id === turma.professorId);
    if (!disciplina) erros.push(`Turma ${turma.codigo} sem disciplina`);
    if (!professor) erros.push(`Turma ${turma.codigo} sem professor`);
    if (professor && disciplina && !(professor.disciplinas || []).includes(disciplina.id)) {
      erros.push(`${professor.nome} não está vinculado a ${disciplina.codigo}`);
    }
    if (!turma.horarios || turma.horarios.length < 1 || turma.horarios.length > 2) {
      erros.push(`${turma.codigo} deve ter um ou dois horários`);
    }
    for (const horario of turma.horarios || []) {
      if (!horarioValido(horario)) erros.push(`${turma.codigo} tem horário inválido: ${horario}`);
    }
    if (new Set(turma.horarios || []).size !== (turma.horarios || []).length) {
      erros.push(`${turma.codigo} repete horário`);
    }
    if (professor) {
      if (!agenda.has(professor.id)) agenda.set(professor.id, new Map());
      const horariosDoProfessor = agenda.get(professor.id);
      for (const horario of turma.horarios || []) {
        if (horariosDoProfessor.has(horario)) {
          erros.push(`${professor.nome} está em duas turmas no horário ${horario}`);
        }
        horariosDoProfessor.set(horario, turma.codigo);
      }
    }
    if (ocupacao(db, turma.id) > turma.vagas) erros.push(`${turma.codigo} tem mais alunos do que vagas`);
  }

  for (const professor of db.professores) {
    const quantidade = db.turmas.filter((turma) => turma.professorId === professor.id).length;
    if (quantidade > professor.cargaMaxima) erros.push(`${professor.nome} passou da carga máxima`);
  }

  const gradeDoAluno = new Map();
  for (const matricula of db.matriculas) {
    if (matricula.status !== 'ativa') continue;
    const aluno = db.alunos.find((item) => item.id === matricula.alunoId);
    const turma = db.turmas.find((item) => item.id === matricula.turmaId);
    if (!aluno || !turma) {
      erros.push('Há matrícula sem aluno ou sem turma');
      continue;
    }
    const disciplina = db.disciplinas.find((item) => item.id === turma.disciplinaId);
    if (disciplina) {
      const faltam = (disciplina.prerequisitos || []).filter((id) => !(aluno.historico || []).includes(id));
      if (faltam.length) erros.push(`${aluno.nome} está em ${turma.codigo} sem o pré-requisito`);
    }
    if (!gradeDoAluno.has(aluno.id)) gradeDoAluno.set(aluno.id, { disciplinas: new Set(), horarios: new Map() });
    const grade = gradeDoAluno.get(aluno.id);
    if (grade.disciplinas.has(turma.disciplinaId)) erros.push(`${aluno.nome} está em duas turmas da mesma disciplina`);
    grade.disciplinas.add(turma.disciplinaId);
    for (const horario of turma.horarios) {
      if (grade.horarios.has(horario)) erros.push(`${aluno.nome} tem choque de horário em ${horario}`);
      grade.horarios.set(horario, turma.codigo);
    }
  }

  const numeros = new Set();
  for (const aluno of db.alunos) {
    if (numeros.has(aluno.matricula)) erros.push(`Matrícula repetida: ${aluno.matricula}`);
    numeros.add(aluno.matricula);
  }

  return erros;
}

/* Regras da matrícula do aluno.
   Uma turma só é aceita quando há vaga, o pré-requisito está aprovado
   no histórico, não há choque de dia/turno e o aluno ainda não cursa
   a mesma disciplina. */
function motivosMatricula(db, alunoId, turmaId) {
  const aluno = db.alunos.find((item) => item.id === alunoId);
  const turma = db.turmas.find((item) => item.id === turmaId);
  if (!aluno || !turma) return ['Aluno ou turma não encontrados.'];

  const disciplina = db.disciplinas.find((item) => item.id === turma.disciplinaId);
  if (!disciplina) return ['Disciplina da turma não encontrada.'];

  const ativas = db.matriculas.filter((item) => item.alunoId === alunoId && item.status === 'ativa');
  if (ativas.some((item) => item.turmaId === turmaId)) {
    return ['Já está matriculado nesta turma.'];
  }

  const motivos = [];
  const turmasAtuais = ativas
    .map((item) => db.turmas.find((turmaAtual) => turmaAtual.id === item.turmaId))
    .filter(Boolean);

  if (turmasAtuais.some((turmaAtual) => turmaAtual.disciplinaId === turma.disciplinaId)) {
    motivos.push('Já cursa esta disciplina em outra turma.');
  }

  if (ocupacao(db, turmaId) >= turma.vagas) motivos.push('Esta turma não tem vagas.');

  const historico = aluno.historico || [];
  const faltam = (disciplina.prerequisitos || []).filter((id) => !historico.includes(id));
  if (faltam.length) {
    const nomes = faltam.map((id) => {
      const exigida = db.disciplinas.find((item) => item.id === id);
      return exigida ? `${exigida.codigo} ${exigida.nome}` : id;
    });
    let mensagem = `Falta pré-requisito aprovado: ${nomes.join(', ')}.`;
    const cursando = new Set(turmasAtuais.map((turmaAtual) => turmaAtual.disciplinaId));
    if (faltam.some((id) => cursando.has(id))) {
      mensagem += ' Estar cursando ainda não conta como aprovação.';
    }
    motivos.push(mensagem);
  }

  const ocupados = new Set(turmasAtuais.flatMap((turmaAtual) => turmaAtual.horarios));
  const choques = turma.horarios.filter((horario) => ocupados.has(horario));
  if (choques.length) motivos.push(`Choque de horário em ${choques.map(descrever).join(' e ')}.`);

  return motivos;
}

function tentarMatricular(db, alunoId, turmaId) {
  const motivos = motivosMatricula(db, alunoId, turmaId);
  if (motivos.length) return { ok: false, erro: motivos.join(' ') };
  const matricula = {
    id: novoId(db.matriculas, 'm'),
    alunoId,
    turmaId,
    status: 'ativa',
    criadoEm: new Date().toISOString(),
  };
  db.matriculas.push(matricula);
  return { ok: true, matricula };
}

function cancelarMatricula(db, matriculaId, ator) {
  const matricula = db.matriculas.find((item) => item.id === matriculaId);
  if (!matricula || matricula.status !== 'ativa') return { ok: false, erro: 'Matrícula não encontrada.' };
  if (ator && ator.perfil === 'aluno' && matricula.alunoId !== ator.id) {
    return { ok: false, status: 403, erro: 'Você só pode cancelar a própria matrícula.' };
  }
  matricula.status = 'cancelada';
  return { ok: true };
}

function normalizarTurma(body, db) {
  const lista = Array.isArray(body.horarios) ? body.horarios : [];
  return {
    codigo: String(body.codigo || '').trim().toUpperCase(),
    disciplinaId: body.disciplinaId,
    professorId: body.professorId,
    horarios: [...new Set(lista.map(String).filter(Boolean))].sort(),
    vagas: Number(body.vagas),
    sala: String(body.sala || '').trim(),
    semestre: String(body.semestre || '').trim() || (db && db.semestre) || '2026.2',
  };
}

/* Regras da oferta institucional.
   O professor precisa estar ligado à disciplina, dentro da carga máxima
   e sem dois encontros no mesmo dia e turno. */
function validarTurma(db, dados, id) {
  if (!/^[A-Z0-9-]{2,12}$/.test(dados.codigo)) return 'Use um código de turma com letras, números ou hífen.';
  const disciplina = db.disciplinas.find((item) => item.id === dados.disciplinaId);
  const professor = db.professores.find((item) => item.id === dados.professorId);
  if (!disciplina) return 'Escolha a disciplina.';
  if (!professor) return 'Escolha o professor.';
  if (!(professor.disciplinas || []).includes(disciplina.id)) {
    return 'Este professor não está vinculado a esta disciplina.';
  }
  if (!dados.horarios.length || dados.horarios.length > 2) return 'Informe um ou dois horários.';
  if (dados.horarios.some((horario) => !horarioValido(horario))) {
    return 'Horário inválido. O primeiro dígito é o dia (2 a 7) e o segundo é o turno (1 manhã, 2 tarde, 3 noite).';
  }
  if (!Number.isInteger(dados.vagas) || dados.vagas < 1 || dados.vagas > 200) return 'Informe as vagas entre 1 e 200.';
  if (!dados.sala || dados.sala.length > 20) return 'Informe a sala.';
  if (db.turmas.some((turma) => turma.codigo === dados.codigo && turma.id !== id)) {
    return 'Já existe uma turma com este código.';
  }

  const carga = db.turmas.filter((turma) => turma.professorId === professor.id && turma.id !== id).length;
  if (carga + 1 > professor.cargaMaxima) {
    return `${professor.nome} já atingiu a carga máxima de ${professor.cargaMaxima} turmas. Escolha outro professor para equilibrar a alocação.`;
  }

  const outras = db.turmas.filter((turma) => turma.professorId === professor.id && turma.id !== id);
  for (const horario of dados.horarios) {
    const ocupa = outras.find((turma) => turma.horarios.includes(horario));
    if (ocupa) return `${professor.nome} já leciona a turma ${ocupa.codigo} em ${descrever(horario)}.`;
  }

  if (id) {
    const ativas = db.matriculas.filter((item) => item.turmaId === id && item.status === 'ativa');
    if (dados.vagas < ativas.length) {
      return `Há ${ativas.length} alunos matriculados. As vagas não podem ficar abaixo disso.`;
    }
    for (const matricula of ativas) {
      const aluno = db.alunos.find((item) => item.id === matricula.alunoId);
      const ocupados = new Set();
      const outrasMatriculas = db.matriculas.filter((item) => item.alunoId === matricula.alunoId && item.status === 'ativa' && item.turmaId !== id);
      for (const outra of outrasMatriculas) {
        const turma = db.turmas.find((item) => item.id === outra.turmaId);
        if (turma) turma.horarios.forEach((horario) => ocupados.add(horario));
      }
      const choque = dados.horarios.find((horario) => ocupados.has(horario));
      if (choque && aluno) return `O novo horário entra em choque com a grade de ${aluno.nome} (${descrever(choque)}).`;
    }
  }

  return null;
}

function salvarTurma(db, body, id) {
  const dados = normalizarTurma(body, db);
  const erro = validarTurma(db, dados, id);
  if (erro) return { ok: false, erro };
  if (id) {
    const turma = db.turmas.find((item) => item.id === id);
    if (!turma) return { ok: false, erro: 'Turma não encontrada.' };
    Object.assign(turma, dados);
    return { ok: true, turma };
  }
  const turma = { id: novoId(db.turmas, 't'), criadoEm: new Date().toISOString(), ...dados };
  db.turmas.push(turma);
  return { ok: true, turma };
}

function excluirTurma(db, id) {
  if (db.matriculas.some((item) => item.turmaId === id && item.status === 'ativa')) {
    return { ok: false, erro: 'Não é possível excluir: existem alunos matriculados nesta turma.' };
  }
  const existia = db.turmas.some((item) => item.id === id);
  if (!existia) return { ok: false, erro: 'Turma não encontrada.' };
  db.turmas = db.turmas.filter((item) => item.id !== id);
  db.matriculas = db.matriculas.filter((item) => item.turmaId !== id);
  return { ok: true };
}

function normalizarDisciplina(body) {
  const prereqs = Array.isArray(body.prerequisitos) ? body.prerequisitos : [];
  return {
    codigo: String(body.codigo || '').trim().toUpperCase(),
    nome: String(body.nome || '').trim(),
    ementa: String(body.ementa || '').trim(),
    cargaHoraria: Number(body.cargaHoraria),
    creditos: Number(body.creditos),
    prerequisitos: [...new Set(prereqs.map(String))],
  };
}

function salvarDisciplina(db, body, id) {
  const dados = normalizarDisciplina(body);
  if (!/^[A-Z]{2,8}\d{2,4}$/.test(dados.codigo)) return { ok: false, erro: 'O código da disciplina precisa parecer com ALG100.' };
  if (dados.nome.length < 3) return { ok: false, erro: 'Informe o nome da disciplina.' };
  if (!Number.isInteger(dados.cargaHoraria) || dados.cargaHoraria < 10 || dados.cargaHoraria > 200) {
    return { ok: false, erro: 'A carga horária deve ficar entre 10 e 200.' };
  }
  if (!Number.isInteger(dados.creditos) || dados.creditos < 1 || dados.creditos > 12) {
    return { ok: false, erro: 'Os créditos devem ficar entre 1 e 12.' };
  }
  if (db.disciplinas.some((item) => item.codigo === dados.codigo && item.id !== id)) {
    return { ok: false, erro: 'Já existe uma disciplina com este código.' };
  }
  for (const pre of dados.prerequisitos) {
    if (pre === id) return { ok: false, erro: 'A disciplina não pode ser pré-requisito dela mesma.' };
    if (!db.disciplinas.some((item) => item.id === pre)) return { ok: false, erro: 'Pré-requisito inválido.' };
  }
  if (id && criaCiclo(db, id, dados.prerequisitos)) {
    return { ok: false, erro: 'Esse pré-requisito fecharia um ciclo. Ajuste a cadeia antes de salvar.' };
  }
  if (id) {
    const disciplina = db.disciplinas.find((item) => item.id === id);
    if (!disciplina) return { ok: false, erro: 'Disciplina não encontrada.' };
    Object.assign(disciplina, dados);
    return { ok: true, disciplina };
  }
  const disciplina = { id: novoId(db.disciplinas, 'd'), ...dados };
  db.disciplinas.push(disciplina);
  return { ok: true, disciplina };
}

function excluirDisciplina(db, id) {
  const disciplina = db.disciplinas.find((item) => item.id === id);
  if (!disciplina) return { ok: false, erro: 'Disciplina não encontrada.' };
  if (db.turmas.some((item) => item.disciplinaId === id)) {
    return { ok: false, erro: 'Não é possível excluir: ainda existe turma desta disciplina.' };
  }
  const dependente = db.disciplinas.find((item) => (item.prerequisitos || []).includes(id));
  if (dependente) return { ok: false, erro: `Não é possível excluir: ${dependente.codigo} usa esta disciplina como pré-requisito.` };
  if (db.alunos.some((item) => (item.historico || []).includes(id))) {
    return { ok: false, erro: 'Não é possível excluir: a disciplina está no histórico de um aluno.' };
  }
  db.disciplinas = db.disciplinas.filter((item) => item.id !== id);
  db.professores.forEach((professor) => {
    professor.disciplinas = (professor.disciplinas || []).filter((item) => item !== id);
  });
  return { ok: true };
}

function normalizarProfessor(body) {
  const disciplinas = Array.isArray(body.disciplinas) ? body.disciplinas : [];
  return {
    nome: String(body.nome || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    titulacao: String(body.titulacao || '').trim(),
    cargaMaxima: Number(body.cargaMaxima),
    disciplinas: [...new Set(disciplinas.map(String))],
  };
}

function salvarProfessor(db, body, id) {
  const dados = normalizarProfessor(body);
  if (dados.nome.length < 3) return { ok: false, erro: 'Informe o nome do professor.' };
  if (!/^\S+@\S+\.\S+$/.test(dados.email)) return { ok: false, erro: 'Informe um e-mail válido.' };
  if (!dados.titulacao) return { ok: false, erro: 'Informe a titulação.' };
  if (!Number.isInteger(dados.cargaMaxima) || dados.cargaMaxima < 1 || dados.cargaMaxima > 8) {
    return { ok: false, erro: 'A carga máxima deve ficar entre 1 e 8 turmas.' };
  }
  if (!dados.disciplinas.length) return { ok: false, erro: 'Vincule pelo menos uma disciplina.' };
  for (const disciplinaId of dados.disciplinas) {
    if (!db.disciplinas.some((item) => item.id === disciplinaId)) return { ok: false, erro: 'Disciplina vinculada inválida.' };
  }
  if (db.professores.some((item) => item.email === dados.email && item.id !== id)) {
    return { ok: false, erro: 'Já existe um professor com este e-mail.' };
  }
  if (id) {
    const professor = db.professores.find((item) => item.id === id);
    if (!professor) return { ok: false, erro: 'Professor não encontrado.' };
    const turmas = db.turmas.filter((item) => item.professorId === id);
    if (dados.cargaMaxima < turmas.length) {
      return { ok: false, erro: `Este professor já leciona ${turmas.length} turmas. A carga máxima não pode ficar abaixo disso.` };
    }
    for (const turma of turmas) {
      if (!dados.disciplinas.includes(turma.disciplinaId)) {
        return { ok: false, erro: 'O professor ainda leciona uma turma de disciplina que seria removida do vínculo.' };
      }
    }
    Object.assign(professor, dados);
    return { ok: true, professor };
  }
  const professor = { id: novoId(db.professores, 'p'), ...dados };
  db.professores.push(professor);
  return { ok: true, professor };
}

function excluirProfessor(db, id) {
  if (!db.professores.some((item) => item.id === id)) return { ok: false, erro: 'Professor não encontrado.' };
  if (db.turmas.some((item) => item.professorId === id)) {
    return { ok: false, erro: 'Não é possível excluir: o professor ainda está alocado em uma turma.' };
  }
  db.professores = db.professores.filter((item) => item.id !== id);
  return { ok: true };
}

function normalizarAluno(body, db, atual) {
  return {
    nome: String(body.nome || '').trim(),
    matricula: String(body.matricula || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    curso: String(body.curso || (atual && atual.curso) || (db && db.curso) || '').trim(),
    periodo: Number(body.periodo),
    senha: String(body.senha || '').trim(),
    historico: atual ? atual.historico || [] : [],
  };
}

function salvarAluno(db, body, id) {
  const atual = id ? db.alunos.find((item) => item.id === id) : null;
  if (id && !atual) return { ok: false, erro: 'Aluno não encontrado.' };
  const dados = normalizarAluno(body, db, atual);
  if (dados.nome.length < 3) return { ok: false, erro: 'Informe o nome do aluno.' };
  if (!/^\d{6,12}$/.test(dados.matricula)) return { ok: false, erro: 'A matrícula deve ter de 6 a 12 números.' };
  if (!/^\S+@\S+\.\S+$/.test(dados.email)) return { ok: false, erro: 'Informe um e-mail válido.' };
  if (!dados.curso) return { ok: false, erro: 'Informe o curso.' };
  if (!Number.isInteger(dados.periodo) || dados.periodo < 1 || dados.periodo > 12) {
    return { ok: false, erro: 'O período deve ficar entre 1 e 12.' };
  }
  if (!id && dados.senha.length < 4) return { ok: false, erro: 'A senha inicial precisa ter pelo menos 4 caracteres.' };
  if (id && body.senha && dados.senha.length < 4) return { ok: false, erro: 'A nova senha precisa ter pelo menos 4 caracteres.' };
  if (db.alunos.some((item) => item.matricula === dados.matricula && item.id !== id)) {
    return { ok: false, erro: 'Já existe um aluno com esta matrícula.' };
  }
  if (db.alunos.some((item) => item.email === dados.email && item.id !== id)) {
    return { ok: false, erro: 'Já existe um aluno com este e-mail.' };
  }
  if (id) {
    atual.nome = dados.nome;
    atual.matricula = dados.matricula;
    atual.email = dados.email;
    atual.curso = dados.curso;
    atual.periodo = dados.periodo;
    if (body.senha) atual.senha = dados.senha;
    return { ok: true };
  }
  db.alunos.push({
    id: novoId(db.alunos, 'a'),
    nome: dados.nome,
    matricula: dados.matricula,
    email: dados.email,
    senha: dados.senha,
    curso: dados.curso,
    periodo: dados.periodo,
    historico: [],
  });
  return { ok: true };
}

function excluirAluno(db, id) {
  if (!db.alunos.some((item) => item.id === id)) return { ok: false, erro: 'Aluno não encontrado.' };
  if (db.matriculas.some((item) => item.alunoId === id && item.status === 'ativa')) {
    return { ok: false, erro: 'Não é possível excluir: o aluno ainda tem matrícula ativa.' };
  }
  db.alunos = db.alunos.filter((item) => item.id !== id);
  db.matriculas = db.matriculas.filter((item) => item.alunoId !== id);
  return { ok: true };
}

function salvarHistorico(db, alunoId, lista) {
  const aluno = db.alunos.find((item) => item.id === alunoId);
  if (!aluno) return { ok: false, erro: 'Aluno não encontrado.' };
  const ids = [...new Set((lista || []).map(String))];
  for (const id of ids) {
    if (!db.disciplinas.some((item) => item.id === id)) return { ok: false, erro: 'Disciplina inválida no histórico.' };
  }
  aluno.historico = ids;
  return { ok: true };
}

function semSenha(aluno) {
  const copia = { ...aluno };
  delete copia.senha;
  return copia;
}

function simularAluno(db, alunoId) {
  const mapa = {};
  for (const turma of db.turmas) mapa[turma.id] = motivosMatricula(db, alunoId, turma.id);
  return mapa;
}

function estadoPara(db, usuario) {
  const ocupacaoMapa = {};
  for (const turma of db.turmas) ocupacaoMapa[turma.id] = ocupacao(db, turma.id);
  const base = {
    instituicao: db.instituicao,
    curso: db.curso,
    semestre: db.semestre,
    professores: db.professores,
    disciplinas: db.disciplinas,
    turmas: db.turmas,
    ocupacao: ocupacaoMapa,
  };
  if (usuario.perfil === 'aluno') {
    return {
      ...base,
      alunos: db.alunos.filter((aluno) => aluno.id === usuario.id).map(semSenha),
      matriculas: db.matriculas.filter((item) => item.alunoId === usuario.id),
      simulacao: { [usuario.id]: simularAluno(db, usuario.id) },
    };
  }
  const simulacao = {};
  for (const aluno of db.alunos) simulacao[aluno.id] = simularAluno(db, aluno.id);
  return {
    ...base,
    alunos: db.alunos.map(semSenha),
    matriculas: db.matriculas,
    simulacao,
  };
}

function autenticar(db, body) {
  const senha = String(body.senha || '');
  const identificador = String(body.identificador || '').trim();
  if (body.perfil === 'instituicao') {
    const usuario = db.usuariosInst.find((item) => item.login === identificador && item.senha === senha);
    if (!usuario) return { ok: false, erro: 'Usuário ou senha incorretos.' };
    return { ok: true, usuario: { id: usuario.id, nome: usuario.nome, perfil: 'instituicao', cargo: usuario.cargo } };
  }
  const aluno = db.alunos.find((item) => item.matricula === identificador && item.senha === senha);
  if (!aluno) return { ok: false, erro: 'Matrícula ou senha incorretas.' };
  return { ok: true, usuario: { id: aluno.id, nome: aluno.nome, perfil: 'aluno', matricula: aluno.matricula } };
}

function sessao(req, db) {
  const id = req.headers['x-usuario-id'];
  const perfil = req.headers['x-perfil'];
  if (typeof id !== 'string' || typeof perfil !== 'string') return null;
  if (perfil === 'aluno') {
    const aluno = db.alunos.find((item) => item.id === id);
    return aluno ? { id: aluno.id, nome: aluno.nome, perfil: 'aluno' } : null;
  }
  if (perfil === 'instituicao') {
    const usuario = db.usuariosInst.find((item) => item.id === id);
    return usuario ? { id: usuario.id, nome: usuario.nome, perfil: 'instituicao' } : null;
  }
  return null;
}


function exigirUsuario(req, res, next) {
  const usuario = sessao(req, ler());
  if (!usuario) return res.status(401).json({ erro: 'Sessão inválida. Entre de novo.' });
  req.usuario = usuario;
  next();
}

function exigirInstituicao(req, res, next) {
  if (req.usuario.perfil !== 'instituicao') {
    return res.status(403).json({ erro: 'Apenas a secretaria pode fazer esta operação.' });
  }
  next();
}

function pegar(fn) {
  return (req, res) => {
    Promise.resolve(fn(req, res)).catch((erro) => {
      if (!res.headersSent) {
        res.status(erro.status || 500).json({
          erro: erro.status ? erro.message : 'Erro interno ao processar o pedido.',
        });
      }
      if (!erro.status) console.error(erro);
    });
  };
}

async function responder(res, promessa, statusOk) {
  const resultado = await promessa;
  if (!resultado || resultado.ok === false) {
    res.status((resultado && resultado.status) || 400).json({
      erro: (resultado && resultado.erro) || 'Não foi possível concluir.',
    });
    return;
  }
  res.status(statusOk || 200).json({ ok: true });
}

function criarAplicacao() {
  const aplicacao = express();
  aplicacao.use(express.json({ limit: '1mb' }));

  aplicacao.post('/api/login', (req, res) => {
    const resultado = autenticar(ler(), req.body || {});
    if (!resultado.ok) return res.status(401).json({ erro: resultado.erro });
    res.json(resultado.usuario);
  });

  aplicacao.get('/api/estado', exigirUsuario, (req, res) => {
    res.json(estadoPara(ler(), req.usuario));
  });

  aplicacao.post('/api/restaurar', exigirUsuario, exigirInstituicao, pegar(async (req, res) => {
    await restaurarBase();
    res.json({ ok: true });
  }));

  aplicacao.post('/api/matriculas', exigirUsuario, pegar(async (req, res) => {
    const alunoId = req.usuario.perfil === 'aluno' ? req.usuario.id : req.body.alunoId;
    if (!alunoId) return res.status(400).json({ erro: 'Informe o aluno.' });
    await responder(res, alterar((db) => tentarMatricular(db, alunoId, req.body.turmaId)), 201);
  }));

  aplicacao.post('/api/matriculas/:id/cancelar', exigirUsuario, pegar(async (req, res) => {
    await responder(res, alterar((db) => cancelarMatricula(db, req.params.id, req.usuario)));
  }));

  aplicacao.put('/api/alunos/:id/historico', exigirUsuario, exigirInstituicao, pegar(async (req, res) => {
    await responder(res, alterar((db) => salvarHistorico(db, req.params.id, (req.body && req.body.historico) || [])));
  }));

  function rotasCrud(caminho, salvar, excluir) {
    aplicacao.post(caminho, exigirUsuario, exigirInstituicao, pegar(async (req, res) => {
      await responder(res, alterar((db) => salvar(db, req.body || {}, null)), 201);
    }));
    aplicacao.put(`${caminho}/:id`, exigirUsuario, exigirInstituicao, pegar(async (req, res) => {
      await responder(res, alterar((db) => salvar(db, req.body || {}, req.params.id)));
    }));
    aplicacao.delete(`${caminho}/:id`, exigirUsuario, exigirInstituicao, pegar(async (req, res) => {
      await responder(res, alterar((db) => excluir(db, req.params.id)));
    }));
  }

  rotasCrud('/api/turmas', salvarTurma, excluirTurma);
  rotasCrud('/api/disciplinas', salvarDisciplina, excluirDisciplina);
  rotasCrud('/api/professores', salvarProfessor, excluirProfessor);
  rotasCrud('/api/alunos', salvarAluno, excluirAluno);

  aplicacao.use('/api', (req, res) => {
    res.status(404).json({ erro: 'Endereço não encontrado.' });
  });

  if (fs.existsSync(DIST)) {
    aplicacao.use(express.static(DIST, { index: false, maxAge: 0 }));
    aplicacao.use((req, res) => {
      res.sendFile(path.join(DIST, 'index.html'));
    });
  }

  return aplicacao;
}

function main() {
  garantirArquivo();
  const pendencias = problemasDaBase(ler());
  if (pendencias.length) {
    console.log('Atenção: a base tem pendências:');
    pendencias.forEach((item) => console.log(' - ' + item));
  }

  const aplicacao = criarAplicacao();
  const server = aplicacao.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log('');
    console.log('Sistema De Matrículas');
    console.log('Aberto em ' + url);
    console.log('Para encerrar, pressione Ctrl+C');
    console.log('');
    if (process.env.ABRIR !== '0' && process.platform === 'win32') {
      exec(`cmd /c start "" "${url}"`);
    }
  });

  server.on('error', (erro) => {
    if (erro.code === 'EADDRINUSE') {
      console.error(`A porta ${PORT} já está em uso. Feche a outra janela ou rode com outra porta.`);
    } else {
      console.error(erro);
    }
    process.exit(1);
  });
}
if (require.main === module) main();

module.exports = {
  baseInicial,
  problemasDaBase,
  motivosMatricula,
  tentarMatricular,
  cancelarMatricula,
  salvarTurma,
  salvarDisciplina,
  descrever,
};
