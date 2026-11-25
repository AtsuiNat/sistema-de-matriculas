import { Component } from 'react';

/* O React isola um erro de renderização para a tela não ficar em branco. */
export default class LimiteDeErro extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  render() {
    if (this.state.erro) {
      return (
        <main className="container py-5">
          <h1 className="h4">Esta tela encontrou um erro.</h1>
          <p className="text-secondary">{this.state.erro.message}</p>
        </main>
      );
    }
    return this.props.children;
  }
}
