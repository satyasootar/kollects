import { Link } from "react-router-dom"
import { FaGithub } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/use-auth-store"

export function Navbar() {
  const { user } = useAuthStore()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-18 max-w-350 items-center justify-between px-12">
        <Link
          to="/"
          className="group/logo flex cursor-pointer items-center gap-3"
        >
          <div className="flex items-center justify-center">
            <img
              src="/logo/logo1.png"
              alt="Kollects Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">
            Kollects
          </span>
        </Link>

        <div className="flex items-center gap-8 font-mono text-xs tracking-widest uppercase">
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#stats"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Stats
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground lowercase">
                  {user.name.split(" ")[0]}
                </span>
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto rounded-none border-border px-4 py-2 font-mono text-xs tracking-widest uppercase transition-all hover:bg-foreground hover:text-background"
                  >
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/auth/login"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link to="/auth/register">
                  <Button className="h-auto rounded-none bg-foreground px-5 py-2 font-mono text-xs tracking-widest text-background uppercase transition-colors hover:bg-primary">
                    Get Started →
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <a
            href="https://github.com/satyasootar/kollects"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kollects on GitHub"
            title="View source on GitHub"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <FaGithub className="h-5 w-5" />
          </a>
        </div>
      </div>
    </nav>
  )
}
