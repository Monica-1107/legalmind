import Link from "next/link"
import { Github, Twitter, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-gray-400 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-gold-500 mb-4">LegalMind</h3>
            <p className="text-sm">Empowering citizens with AI-driven legal insights and assistance.</p>
            <div className="flex space-x-4 mt-4">
              <Link href="#" className="hover:text-gold-500 transition-colors">
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="hover:text-gold-500 transition-colors">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="hover:text-gold-500 transition-colors">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Document Analysis
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Legal Research
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Hypothetical Scenarios
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Hierarchical Analysis
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Legal Database
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Case Studies
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gold-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} LegalMind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

