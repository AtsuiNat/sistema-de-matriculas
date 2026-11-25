import { useEffect } from 'react';

export default function Modal({ titulo, children, fechar, rodape }) {
  useEffect(() => {
    function noTeclado(evento) {
      if (evento.key === 'Escape') fechar();
    }
    window.addEventListener('keydown', noTeclado);
    return () => window.removeEventListener('keydown', noTeclado);
  }, [fechar]);

  return (
    <div className="modal-fundo" onClick={(evento) => { if (evento.target === evento.currentTarget) fechar(); }}>
      <div className="modal-caixa" role="dialog" aria-modal="true">
        <header className="modal-topo"><h2>{titulo}</h2></header>
        <div className="modal-corpo">{children}</div>
        {rodape ? <footer className="modal-rodape">{rodape}</footer> : null}
      </div>
    </div>
  );
}
