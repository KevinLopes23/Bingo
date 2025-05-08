import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-800 to-blue-600 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-5xl font-bold mb-8 text-center">Bingo Online</h1>
      </div>

      <div className="mb-8 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-6">
        <div className="group rounded-lg border border-transparent px-5 py-4 bg-blue-900 hover:bg-blue-800 transition-colors">
          <h2 className="mb-3 text-2xl font-semibold">
            Crie uma Sala{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-70">
            Crie sua própria sala de Bingo e convide seus amigos para jogar.
          </p>
          <div className="mt-4">
            <Link
              href="/rooms/create"
              className="bg-white text-blue-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Criar Sala
            </Link>
          </div>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 bg-blue-900 hover:bg-blue-800 transition-colors">
          <h2 className="mb-3 text-2xl font-semibold">
            Entre em uma Sala{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-70">
            Entre em uma sala existente usando um código de convite.
          </p>
          <div className="mt-4">
            <Link
              href="/rooms/join"
              className="bg-white text-blue-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Entrar em Sala
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="group rounded-lg border border-transparent px-5 py-4 bg-blue-900 hover:bg-blue-800 transition-colors">
          <h2 className="mb-3 text-2xl font-semibold text-center">
            Como Jogar
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm opacity-80">
            <li>Crie uma conta ou faça login para começar</li>
            <li>Crie uma sala ou entre em uma sala existente com código</li>
            <li>O anfitrião define o valor de entrada e número de rodadas</li>
            <li>Cada jogador recebe uma cartela aleatória</li>
            <li>Números são sorteados automaticamente</li>
            <li>Cartelas são marcadas automaticamente</li>
            <li>
              Clique em "BINGO!" quando completar uma linha, coluna ou toda a
              cartela
            </li>
            <li>O vencedor recebe o prêmio!</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="bg-white text-blue-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="bg-transparent border border-white text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Registrar
        </Link>
      </div>
    </main>
  );
}
