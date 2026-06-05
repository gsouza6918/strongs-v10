import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Interceptar requisições de bots (WhatsApp, Facebook, Twitter, etc) para injetar Open Graph dinâmico
  app.use(async (req, res, next) => {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const botUserAgents = [
      'facebookexternalhit',
      'twitterbot',
      'whatsapp',
      'linkedinbot',
      'telegrambot',
      'discordbot',
    ];

    const isBot = botUserAgents.some(bot => userAgent.includes(bot));

    // A URL compartilhada geralmente é ?id=ID_DA_NOTICIA ou ?page=news-detail&id=ID_DA_NOTICIA
    const newsId = req.query.id as string;

    if (isBot && newsId) {
      try {
        // Buscar a notícia direto do Firebase (Realtime Database -> /news)
        const dbRes = await fetch('https://strongs-v2-51d43-default-rtdb.firebaseio.com/news.json');
        if (dbRes.ok) {
          const newsData = await dbRes.json();
          // newsData pode ser um Array ou Objeto, vamos garantir Array
          const newsItems = Array.isArray(newsData) ? newsData : Object.values(newsData || {});
          const post = newsItems.find((n: any) => n && (n.slug === newsId || n.id === newsId));

          if (post) {
            // Renderizar um HTML estático apenas para o bot com as meta tags preenchidas
            const botHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${post.title} | Strongs Brazil</title>
    <meta name="description" content="${post.subject || post.title}" />
    <meta property="og:title" content="${post.title} | Strongs Brazil" />
    <meta property="og:description" content="${post.subject || post.title}" />
    <meta property="og:url" content="https://strongsbrazil.com/?id=${post.slug || post.id}" />
    <meta property="og:image" content="${post.coverImage}" />
    <meta property="og:image:secure_url" content="${post.coverImage}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${post.title} | Strongs Brazil" />
    <meta name="twitter:description" content="${post.subject || post.title}" />
    <meta name="twitter:image" content="${post.coverImage}" />
</head>
<body>
    <script>window.location.href = "/?id=${post.slug || post.id}";</script>
</body>
</html>
            `;
            return res.send(botHtml);
          }
        }
      } catch (e) {
        console.error("Erro ao buscar notícia pelo bot:", e);
      }
    }
    next();
  });

  // Vite middleware para desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Configuração para servir o bundle compilado em produção
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Correção para o frontend usando histórico do HTML5
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
