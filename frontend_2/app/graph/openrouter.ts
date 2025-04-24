// openrouter.ts
// Utility to call OpenRouter API from the frontend

export async function enhanceGraphWithLLM(graph: any, apiKey: any, apiUrl: any, query:string,model: any) {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://legalmind.app"
  }
  console.log(model)
  const data = {
    model,
    messages: [
      { role: "system", content: "You are a legal Knowledge Graph assistant providing information on legal matters and enhancing the current graph understanding. Be helpful, professional, and informative." },
      { role: "user", content: query+JSON.stringify(graph) }
    ],
    temperature: 0.3,
    max_tokens: 2000
  }

  try {
    console.log('yayyyyaa')

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
    return content
  } catch (e: any) {
    throw new Error("Error calling OpenRouter API: " + e.message)
  }
}
