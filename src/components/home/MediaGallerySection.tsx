import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Images, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const MediaGallerySection = () => {
  const [galleryLink, setGalleryLink] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLink = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "media_gallery_link")
        .maybeSingle();
      if (data) setGalleryLink(data.setting_value);
    };
    fetchLink();
  }, []);

  if (!galleryLink) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 text-accent mb-4">
            <Images size={24} />
            <span className="text-sm font-medium uppercase tracking-wider">मीडिया गॅलरी</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            फोटो आणि व्हिडिओ गॅलरी
          </h2>
          <div className="decorative-line mt-4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          {/* Embedded Google Drive Preview */}
          <div className="rounded-2xl overflow-hidden border-2 border-accent/20 shadow-xl bg-card">
            <iframe
              src={galleryLink.replace("/drive/folders/", "/embeddedfolderview?id=").split("?")[0].replace("/embeddedfolderview?id=", "/embeddedfolderview?id=") + "#grid"}
              className="w-full h-[400px] sm:h-[500px]"
              title="मीडिया गॅलरी"
              style={{ border: "none" }}
            />
          </div>

          <div className="text-center mt-6">
            <a href={galleryLink} target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <Images size={20} />
                संपूर्ण गॅलरी पहा
                <ExternalLink size={16} />
              </motion.button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MediaGallerySection;
