import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Mail, MapPin } from "lucide-react";
import logo from "@/assets/vicharmanch-logo.jpeg";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="विचारमंच"
                className="w-16 h-16 rounded-full border-2 border-accent"
              />
              <div>
                <h3 className="font-semibold text-lg">विचारमंच</h3>
                <p className="text-accent text-sm">लातूर</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              अध्यक्षविहीन, विचारकेंद्रित, पारदर्शक चळवळ
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-accent">द्रुत दुवे</h4>
            <ul className="space-y-2">
              {[
                { path: "/about", label: "आमच्याबद्दल" },
                { path: "/ideology", label: "विचारधारा" },
                { path: "/programs", label: "कार्यक्रम" },
                { path: "/quiz", label: "प्रश्नमंजुषा" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-accent">संपर्क</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>बौद्ध नगर, डॉ. बाबासाहेब आंबेडकर चौक, लातूर</span>
              </li>
              <li>
                <a
                  href="mailto:vicharmach1956@gmail.com"
                  className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                >
                  <Mail size={16} />
                  <span>vicharmach1956@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/dr.ambedkar_vicharmanch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                >
                  <Instagram size={16} />
                  <span>@dr.ambedkar_vicharmanch</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Quote */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-accent">प्रेरणा</h4>
            <blockquote className="text-primary-foreground/70 text-sm italic border-l-2 border-accent pl-4">
              "शिक्षित व्हा, संघटित व्हा, संघर्ष करा"
              <footer className="mt-2 text-accent not-italic">
                — डॉ. बाबासाहेब आंबेडकर
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-center md:text-left"
            >
              "विचार जिवंत ठेवण्यासाठी"
            </motion.p>
            <p>© सर्व हक्क राखीव – Aditya</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
