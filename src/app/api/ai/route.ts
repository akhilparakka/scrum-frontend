import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();

    // Extract the provider and URL from query parameters
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing target URL" },
        { status: 400 },
      );
    }

    // Forward the request to OpenAI
    const response = await fetch(decodeURIComponent(targetUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return NextResponse.json(
        { error: "Failed to communicate with OpenAI API" },
        { status: response.status },
      );
    }

    // Check if response is streaming (SSE format)
    const contentType = response.headers.get("content-type") || "";
    if (
      contentType.includes("text/event-stream") ||
      contentType.includes("text/plain")
    ) {
      // Return the streaming response as-is
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Handle regular JSON response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: "AI proxy endpoint is running" },
    { status: 200 },
  );
}
