// openrouter.ts
// Utility to call OpenRouter API from the frontend

export async function enhanceGraphWithLLM(graph: any, file: any, apiKey: string, apiUrl: string, model: string = "openchat/openchat-3.5-0106") {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://legalmind.app"
  }
  console.log(model)
  const data = {
    model,
    messages: [
      { role: "system", content: "You are a legal Knowledge Graph assistant providing information on legal matters and enhancing the current graph. Be helpful, professional, and informative. Output should be only in the graph dictionary(see user content for graph format)." },
      { role: "user", content: JSON.stringify(graph)+JSON.stringify(file) }
    ],
    temperature: 0.3,
    max_tokens: 2000
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error("Failed to call OpenRouter API")
    }
    const result = await response.json()
    // The LLM output is expected to be a JSON graph in the content
    const content = result.choices?.[0]?.message?.content
    console.log(content,'fa')
    return JSON.parse(content)
  } catch (e: any) {
    throw new Error("Error calling OpenRouter API: " + e.message)
  }
}
