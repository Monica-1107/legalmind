import Link from "next/link"
import { Twitter, Linkedin, Facebook } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-navy-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-gold-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-gold-500 transition-colors">
                  Search Laws
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-gold-500 transition-colors">
                  Upload Case
                </Link>
              </li>
              <li>
                <Link href="/graph" className="hover:text-gold-500 transition-colors">
                  Knowledge Graph
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-gold-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gold-500 transition-colors">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-gold-500 transition-colors">
                <Twitter />
              </a>
              <a href="#" className="text-white hover:text-gold-500 transition-colors">
                <Linkedin />
              </a>
              <a href="#" className="text-white hover:text-gold-500 transition-colors">
                <Facebook />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Legal Disclaimer</h3>
            <p className="text-sm">
              The information provided on this website does not, and is not intended to, constitute legal advice. All
              information, content, and materials available on this site are for general informational purposes only.
            </p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p>&copy; 2023 LegalMind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

