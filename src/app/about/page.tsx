import AboutHeroPage from "../components/AboutHeroPage";
import AboutUs from "../components/AboutUs";
import Footer from "../components/Footer";
import ServiceSection from "../components/MainContact";
import Navbar from "../components/Navbar";
import Testimonials from "../components/Testimonials";
import WhatWeOffer from "../components/WhatWeOffer";


export default function Page() {
  return (
    <>
     <Navbar />    
      <AboutHeroPage />
      <AboutUs />

      <WhatWeOffer />
      <Testimonials />
      <ServiceSection />
       <Footer />
    </>
  );
}
