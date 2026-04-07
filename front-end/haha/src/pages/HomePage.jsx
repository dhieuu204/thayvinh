import Header from "../components/Header";
import Banner from "../components/Banner";
import NewArrival from "../components/NewArrival";
import Categories from "../components/Categories";
import Services from "../components/Services";
import ExploreProducts from "../components/ExploreProducts";
import FlashSale from "../components/FlashSale";
import Footer from "../components/Footer";

const HomePage = () => {
  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f] selection:bg-[#0071e3] selection:text-white antialiased"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <Header />
      <Banner />
      <NewArrival />
      <Categories />
      <Services />
      <ExploreProducts />
      <FlashSale />
      <Footer />
    </div>
  );
};

export default HomePage;
