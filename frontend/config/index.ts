interface Config {
  apiUrl: string
  appName: string
  isProduction: boolean
  isDevelopment: boolean
}

const config: Config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  appName: "LegalMind",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
}

export default config

