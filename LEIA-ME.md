# Sistema De Matrículas

Autor: Andrews.

O front-end é React, com componentes, estado e Bootstrap. O back-end é Express. Ele entrega o aplicativo e a API em JSON. Os dados ficam em `data/db.json`. O servidor não monta o HTML.

## Como abrir

1. Instale o Node.js, se ainda não tiver: https://nodejs.org
2. Extraia este ZIP.
3. Dê dois cliques em `iniciar.bat`.
4. O navegador abre em http://localhost:3000
5. Deixe a janela preta aberta. Fechar essa janela desliga o sistema.
6. Se o Windows perguntar, permita o Node em redes privadas.

A senha de todas as contas é `123456`.

| Quem | Entrar com | O que mostra |
| --- | --- | --- |
| Lucas Ferreira | matrícula `20251103` | Aluno do 1º período, sem matrícula |
| João Pedro Lima | matrícula `20240045` | Aluno que já está cursando disciplinas |
| Marina Costa | matrícula `20230198` | Aluna com a grade mais cheia |
| Secretaria | usuário `secretaria` | Visão da instituição |

## O que o sistema faz

- O aluno consulta as turmas, se matricula e cancela.
- A matrícula exige vaga, pré-requisito aprovado e horário livre.
- A secretaria mantém turmas, disciplinas e alunos.
- O professor não passa da carga máxima e não fica em dois encontros no mesmo horário.
- O horário usa dois dígitos: o primeiro é o dia (2 segunda, 3 terça, 4 quarta, 5 quinta, 6 sexta, 7 sábado) e o segundo é o turno (1 manhã, 2 tarde, 3 noite). Assim, 21 é segunda de manhã e 53 é quinta de noite.

## Onde está o código

- `server.js`: rotas do Express e as regras `motivosMatricula` e `validarTurma`.
- `src/components`: uma tela por componente.
- `src/App.jsx`: sessão e troca de telas.
- `dist`: aplicativo já construído, aberto pelo navegador.
- `data/db.json`: alunos, turmas e matrículas.

Na secretaria, em Turmas, o botão **Voltar aos dados iniciais** restaura os alunos e as matrículas desta demonstração.
