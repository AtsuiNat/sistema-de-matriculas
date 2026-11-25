const ROTAS_ALUNO = [
  ['ofertas', 'Ofertas'],
  ['grade', 'Minha grade'],
];

const ROTAS_INST = [
  ['turmas', 'Turmas'],
  ['disciplinas', 'Disciplinas'],
  ['alunos', 'Alunos'],
];

export default function Barra({ usuario, rota, ir, sair }) {
  const rotas = usuario.perfil === 'aluno' ? ROTAS_ALUNO : ROTAS_INST;
  const atual = rotas.some(([id]) => id === rota) ? rota : rotas[0][0];
  return (
    <header className="barra">
      <div className="container barra-miolo">
        <span className="marca">Sistema De Matrículas</span>
        <nav className="menu">
          {rotas.map(([id, rotulo]) => (
            <button key={id} type="button" className={id === atual ? 'ativo' : ''} onClick={() => ir(id)}>
              {rotulo}
            </button>
          ))}
        </nav>
        <div className="quem">
          <div>
            <strong>{usuario.nome}</strong>
            <small>{usuario.perfil === 'aluno' ? 'Aluno' : 'Secretaria'}</small>
          </div>
          <button type="button" className="btn btn-outline-light btn-sm" onClick={sair}>Sair</button>
        </div>
      </div>
    </header>
  );
}
