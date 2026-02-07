import type { Request, Response } from "express";

interface SSEClient {
  userId: string;
  res: Response;
}

const clients: SSEClient[] = [];

export function addSSEClient(userId: string, res: Response) {
  const client: SSEClient = { userId, res };
  clients.push(client);

  res.on("close", () => {
    const index = clients.indexOf(client);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
}

export function sendUserUpdate(userId: string, data: Record<string, any>) {
  const event = `data: ${JSON.stringify(data)}\n\n`;
  clients
    .filter((c) => c.userId === userId)
    .forEach((c) => {
      try {
        c.res.write(event);
      } catch {
        // Client disconnected, will be cleaned up on close
      }
    });
}
