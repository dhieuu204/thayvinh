import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../../lib/api";

const FALLBACK_SLIDES = [
  { id: 1, src: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/first-pc.png", alt: "Banner 1", linkUrl: "" },
  { id: 2, src: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20iP17promax_PC.png", alt: "Banner 2", linkUrl: "" },
  { id: 3, src: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20Macbook%20pro_PC.png", alt: "Banner 3", linkUrl: "" },
  { id: 4, src: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20iPadAir_PC.png", alt: "Banner 4", linkUrl: "" },
  { id: 5, src: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20watch11_PC.png", alt: "Banner 5", linkUrl: "" },
  { id: 6, src: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20AirPodpro3_PC.png", alt: "Banner 6", linkUrl: "" },
];

const AUTOPLAY_MS = 4500;

function Arrow({ left, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={left ? "Slide trước" : "Slide sau"}
      className={`absolute top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center
        rounded-full border border-black/[0.08] bg-white/70 text-[#1d1d1f] shadow-md backdrop-blur-sm
        opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-lg
        ${left ? "left-4" : "right-4"}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {left
          ? <polyline points="15 18 9 12 15 6" />
          : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

export default function Banner() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/banners?position=homepage&isActive=true`)
      .then((r) => r.json())
      .then((json) => {
        const data = (json.data || []).filter((b) => b.isActive);
        if (data.length > 0) {
          setSlides(data.map((b, i) => ({ id: b._id || i, src: b.imageUrl, alt: b.title, linkUrl: b.linkUrl })));
          setCurrent(0);
        }
      })
      .catch(() => {});
  }, []);

  const total = slides.length;

  const go = useCallback((idx, direction) => {
    setDir(direction);
    setCurrent((idx + total) % total);
  }, [total]);

  const next = useCallback(() => go(current + 1, 1), [current, go]);
  const prev = useCallback(() => go(current - 1, -1), [current, go]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  const slide = slides[current];

  return (
    <section
      className="group relative w-full select-none overflow-hidden bg-[#f2f2f2]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-full">
        <AnimatePresence initial={false} custom={dir} mode="sync">
          <motion.div
            key={slide.id}
            custom={dir}
            variants={{
              enter: (d) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.42 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) next();
              else if (info.offset.x > 60) prev();
            }}
            style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
          >
            {slide.linkUrl ? (
              <a href={slide.linkUrl}>
                <img src={slide.src} alt={slide.alt} draggable={false} className="w-full h-auto block" />
              </a>
            ) : (
              <img src={slide.src} alt={slide.alt} draggable={false} className="w-full h-auto block" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Ghost image giữ chiều cao */}
        <img src={slide.src} alt="" aria-hidden="true" draggable={false} className="w-full h-auto block opacity-0 pointer-events-none" />
      </div>

      <Arrow left onClick={prev} />
      <Arrow onClick={next} />

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(i, i > current ? 1 : -1)}
            aria-label={`Slide ${i + 1}`}
          >
            <motion.span
              className="block rounded-full bg-[#1d1d1f]"
              animate={{ width: i === current ? 20 : 7, opacity: i === current ? 1 : 0.3 }}
              transition={{ duration: 0.25 }}
              style={{ height: 7 }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
