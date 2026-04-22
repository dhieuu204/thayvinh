import { useEffect, useState } from "react";
import Header from "../components/Header";
import Banner from "../components/Banner";
import FlashSale from "../components/FlashSale";
import NewArrival from "../components/NewArrival";
import Categories from "../components/Categories";
import Services from "../components/Services";
import CategoryShowcase from "../components/CategoryShowcase";
import ExploreProducts from "../components/ExploreProducts";
import Footer from "../components/Footer";
import { API_URL } from "../lib/api";

const SECTION_MAP = {
  flashSale:        () => <FlashSale />,
  categories:       () => <Categories />,
  newArrival:       () => <NewArrival />,
  categoryShowcase: () => <CategoryShowcase />,
  exploreProducts:  () => <ExploreProducts />,
  services:         () => <Services />,
};

const DEFAULT_SECTIONS = [
  { key: "flashSale",        visible: true, order: 1 },
  { key: "categories",       visible: true, order: 2 },
  { key: "newArrival",       visible: true, order: 3 },
  { key: "categoryShowcase", visible: true, order: 4 },
  { key: "exploreProducts",  visible: true, order: 5 },
  { key: "services",         visible: true, order: 6 },
];

const HomePage = () => {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  useEffect(() => {
    fetch(`${API_URL}/api/settings/homepage-layout`)
      .then((r) => r.json())
      .then((json) => { if (json.data?.length) setSections(json.data); })
      .catch(() => {});
  }, []);

  const sorted = [...sections].sort((a, b) => a.order - b.order).filter((s) => s.visible);

  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f] selection:bg-[#0071e3] selection:text-white antialiased"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Header />
      <Banner />
      {sorted.map((s) => {
        const Component = SECTION_MAP[s.key];
        return Component ? <Component key={s.key} /> : null;
      })}
      <Footer />
    </div>
  );
};

export default HomePage;
