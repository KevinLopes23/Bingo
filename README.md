<div align="center">

# 🎱 Bingo Online

**Bingo multiplayer em tempo real com salas privadas, feito com Next.js, Prisma e Socket.IO.**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

## 💡 Sobre

Jogo de bingo online em que cada jogador cria uma conta, entra numa sala por código de convite e recebe cartelas geradas automaticamente. O anfitrião define valor de entrada e número de rodadas, sorteia os números e o sistema confere quem fez bingo, usando um saldo fictício para entradas e prêmios. Ainda em desenvolvimento: o app fica na pasta `bingo-online/` e há ajustes pendentes listados em `Ajustes.txt`.

## ✨ Funcionalidades

- Cadastro e login com NextAuth (credenciais, senha com bcrypt)
- Criação de salas privadas com código de convite
- Valor de entrada e número de rodadas configuráveis
- Cartelas geradas automaticamente e marcação dos números sorteados
- Sorteio de números pelo anfitrião e verificação de bingo
- Saldo virtual do jogador
- Atualizações em tempo real via Socket.IO

## 🛠️ Tecnologias

- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS 4
- Prisma + SQLite
- NextAuth.js
- Socket.IO

## 📌 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/register` | Cria uma conta |
| `GET`/`POST` | `/api/auth/[...nextauth]` | Autenticação (NextAuth) |
| `GET` | `/api/balance` | Consulta o saldo do usuário |
| `POST` | `/api/balance` | Adiciona saldo fictício |
| `GET` | `/api/rooms` | Lista as salas |
| `POST` | `/api/rooms` | Cria uma sala |
| `POST` | `/api/rooms/join` | Entra numa sala pelo código |
| `GET` | `/api/rooms/[id]` | Detalhes da sala |
| `POST` | `/api/rooms/[id]/start` | Inicia a partida |
| `POST` | `/api/rooms/[id]/draw-number` | Sorteia um número |
| `POST` | `/api/rooms/[id]/verify-bingo` | Verifica o bingo de um jogador |
| `GET` | `/api/socket` | Inicializa o servidor Socket.IO (porta 3001) |

## 🚀 Como rodar

Requer Node.js 18+.

```bash
git clone https://github.com/KevinLopes23/Bingo.git
cd Bingo/bingo-online
npm install
npx prisma migrate dev
npm run dev
```

Crie um `.env.local` com `NEXTAUTH_SECRET` e `NEXTAUTH_URL` (variáveis padrão do NextAuth). O app abre em `http://localhost:3000`.

## 👤 Autor

Feito por [Kevin Lopes](https://github.com/KevinLopes23)
