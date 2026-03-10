import { NextRequest, NextResponse } from "next/server";

// Vercel Hobby allows up to 60s; streaming keeps connection alive longer
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "ANTHROPIC_API_KEY não configurada no servidor." } },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Always use streaming to avoid Vercel timeout
    const anthropicBody = { ...body, stream: true };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error(
        `[Anthropic API] status=${response.status} type=${data?.error?.type} message=${data?.error?.message}`
      );
      return NextResponse.json(data, { status: response.status });
    }

    // Pipe the SSE stream directly to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Erro interno do proxy.",
        },
      },
      { status: 500 }
    );
  }
}
