# Project-Management-Application

A modern, responsive web app built with **Next.js** and **TypeScript** for managing projects, boards, lists, and cards.

---

##  Live Demo  
Check it out here: [Live Demo](https://atlas-xi-seven.vercel.app)

---

##  Features

- **Create**, **read**, **update**, and **delete** boards, lists, and cards  
- Built with **Next.js** (React-based framework) and **TypeScript** for enhanced developer experience  
- Leveraging **Tailwind CSS** for sleek, responsive styling  
- Designed with an intuitive UI for efficient project tracking

---

##  Technologies Used

| Technology     | Purpose                             |
|----------------|-------------------------------------|
| Next.js        | Framework for React & SSR           |
| TypeScript     | Type-safe development               |
| Tailwind CSS   | Utility-first CSS styling           |
| ESLint         | Code linting & quality tooling      |
| Vercel         | Deployment platform                 |

---

## 🕒 Realtime Collaboration

This application uses **[Liveblocks](https://liveblocks.io/)** to enable real-time collaboration.  
Multiple users can edit boards, lists, and cards simultaneously, with changes reflected instantly across all connected clients.

**Key Benefits:**
- Live cursors for each participant
- Real-time list/card updates without page reload
- Conflict-free data syncing

### Liveblocks Setup (Development)
1. Create a [Liveblocks](https://liveblocks.io/) account and project.
2. Copy your **API key** from the dashboard.
3. Add it to your `.env.local` file:
   ```env
   LIVEBLOCKS_SECRET_KEY=your_api_key_here

##  Getting Started

### Prerequisites

Ensure you have one of the following installed:

- Node.js (v14 or later) + npm  
- Yarn  
- pnpm  
- bun

### Installation & Running Locally

1. **Clone the repository**  
   ```bash
   git clone https://github.com/tanish435/Project-Management-Application.git
   cd Project-Management-Application


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
