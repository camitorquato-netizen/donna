#!/usr/bin/env node

/**
 * Script para obter o refresh_token do Google OAuth2.
 * Execute uma vez para configurar a integração com Google Drive.
 *
 * Pré-requisitos:
 * 1. Acesse https://console.cloud.google.com
 * 2. Crie um projeto (ou use existente)
 * 3. Ative a Google Drive API
 * 4. Crie credenciais OAuth 2.0 (tipo "Desktop app")
 * 5. Copie o Client ID e Client Secret
 *
 * Uso:
 *   node scripts/google-auth-setup.mjs <CLIENT_ID> <CLIENT_SECRET>
 *
 * O script vai:
 * 1. Iniciar um servidor local na porta 3333
 * 2. Abrir o navegador para você autorizar
 * 3. Receber o código de autorização automaticamente
 * 4. Trocar por um refresh_token
 * 5. Exibir as variáveis para colocar no .env.local
 */

import { google } from "googleapis";
import http from "http";
import { exec } from "child_process";

const CLIENT_ID = process.argv[2];
const CLIENT_SECRET = process.argv[3];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log("\nUso: node scripts/google-auth-setup.mjs <CLIENT_ID> <CLIENT_SECRET>\n");
  console.log("Obtenha as credenciais em: https://console.cloud.google.com/apis/credentials");
  process.exit(1);
}

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

// Criar servidor HTTP local para receber o callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #c0392b;">Autorização negada</h2>
        <p>Erro: ${error}</p>
        <p>Você pode fechar esta aba.</p>
      </body></html>
    `);
    console.error(`\nErro: Autorização negada (${error})`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2>Aguardando autorização...</h2>
        <p>Retorne ao navegador e autorize o acesso.</p>
      </body></html>
    `);
    return;
  }

  try {
    const { tokens } = await oauth2.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #27ae60;">Autorização concluída!</h2>
        <p>O refresh token foi obtido com sucesso.</p>
        <p>Volte ao terminal para copiar as variáveis de ambiente.</p>
        <p style="color: #888; margin-top: 20px;">Você pode fechar esta aba.</p>
      </body></html>
    `);

    console.log("\n=== Sucesso! Adicione ao seu .env.local: ===\n");
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\n(Opcional) Para salvar numa pasta específica do Drive:");
    console.log("GOOGLE_DRIVE_FOLDER_ID=<id_da_pasta>\n");
  } catch (err) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #c0392b;">Erro ao obter token</h2>
        <p>${err.message}</p>
        <p>Você pode fechar esta aba.</p>
      </body></html>
    `);
    console.error("\nErro ao obter token:", err.message);
  }

  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log("\n=== Google Drive — Setup de Autenticação ===\n");
  console.log(`Servidor local iniciado em http://localhost:${PORT}`);
  console.log("\nAbrindo navegador para autorização...\n");

  // Abrir URL no navegador (macOS)
  const openCmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";

  exec(`${openCmd} "${authUrl}"`, (err) => {
    if (err) {
      console.log("Não foi possível abrir automaticamente. Abra esta URL manualmente:\n");
      console.log(authUrl);
      console.log();
    }
  });
});
