export default function Cabecalho({ titulo, texto, acao }) {
  return (
    <div className="text-center mb-4">
      <h1 className="h3 mb-2">{titulo}</h1>
      {texto ? <p className="lede mx-auto mb-0">{texto}</p> : null}
      {acao ? <div className="mt-3">{acao}</div> : null}
    </div>
  );
}
