# Bingo Online

Um aplicativo de bingo online multiplayer em tempo real, onde os jogadores podem criar salas, convidar amigos e jogar bingo juntos.

## Funcionalidades

- Criação de conta e autenticação de usuários
- Criação de salas privadas com código de convite
- Configuração de valor de entrada e número de rodadas
- Cartelas de bingo geradas automaticamente
- Sorteio automático de números
- Marcação automática das cartelas
- Verificação automática de vitória
- Comunicação em tempo real via WebSockets
- Sistema de recompensas virtuais

## Tecnologias Utilizadas

- Next.js 14
- TypeScript
- TailwindCSS
- Prisma (ORM)
- SQLite (Banco de dados)
- Socket.IO (WebSockets)
- NextAuth.js (Autenticação)

## Pré-requisitos

- Node.js 18+
- npm ou yarn

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/bingo-online.git
cd bingo-online
```

2. Instale as dependências:

```bash
npm install
# ou
yarn install
```

3. Configure o banco de dados:

```bash
npx prisma migrate dev
```

4. Execute o aplicativo em modo de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

5. Acesse o aplicativo em `http://localhost:3000`

## Como Jogar

1. Crie uma conta ou faça login
2. Crie uma sala ou entre em uma sala existente usando o código de convite
3. O anfitrião da sala define o valor de entrada e o número de rodadas
4. Quando todos os jogadores estiverem prontos, o anfitrião inicia o jogo
5. Cada jogador recebe uma cartela de bingo aleatória
6. O anfitrião sorteia os números um a um
7. As cartelas são marcadas automaticamente quando um número sorteado coincide
8. Quando um jogador completa uma linha, coluna, diagonal ou toda a cartela, ele clica em "BINGO!"
9. O sistema verifica automaticamente se a vitória é válida
10. O vencedor recebe o prêmio e a próxima rodada começa (se houver)

## Estrutura do Projeto

- `/src/app` - Páginas da aplicação
- `/src/components` - Componentes reutilizáveis
- `/src/services` - Serviços de negócio
- `/src/utils` - Funções utilitárias
- `/src/lib` - Bibliotecas e configurações
- `/prisma` - Modelos de banco de dados e migrações

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## Contato

Seu Nome - [seu-email@exemplo.com](mailto:seu-email@exemplo.com)

Link do Projeto: [https://github.com/seu-usuario/bingo-online](https://github.com/seu-usuario/bingo-online)
