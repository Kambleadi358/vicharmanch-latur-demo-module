import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Instagram, Shield } from "lucide-react";
import logo from "@/assets/vicharmanch-logo.jpeg";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { path: "/", label: "मुख्य पृष्ठ" },
  { path: "/about", label: "आमच्याबद्दल" },
  { path: "/ideology", label: "विचारधारा" },
  { path: "/programs", label: "कार्यक्रम" },
  { path: "/quiz", label: "प्रश्नमंजुषा" },
  { path: "/accounts", label: "खाते माहिती" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <img
                src={logo}
                alt="विचारमंच लोगो"
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-accent object-cover"
              />
              <div className="absolute inset-0 rounded-full border-2 border-accent/50" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-primary-foreground font-semibold text-sm leading-tight">
                भारतरत्न डॉ. बाबासाहेब आंबेडकर
              </h1>
              <p className="text-accent text-xs">विचारमंच, लातूर</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-accent"
                    : "text-primary-foreground/80 hover:text-primary-foreground"
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Social & Admin & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/dr.ambedkar_vicharmanch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/80 hover:text-accent transition-colors"
            >
              <Instagram size={20} />
            </a>
            <Link
              to={isAdmin ? "/admin" : "/admin-login"}
              className="text-primary-foreground/80 hover:text-accent transition-colors"
              title={isAdmin ? "Admin Dashboard" : "Admin Login"}
            >
              <Shield size={20} />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-primary-foreground p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-primary border-t border-primary-foreground/10"
          >
            <nav className="flex flex-col py-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-6 py-3 text-base ${
                      location.pathname === link.path
                        ? "text-accent bg-primary-foreground/5"
                        : "text-primary-foreground/80"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
