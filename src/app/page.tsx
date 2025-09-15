import Extra from "./components/Extra";
import Hero from "./components/Hero";
import MainAboutPage from "./components/MainAbout";
import MainServices from "./components/MainServices";
import MainTransportType from "./components/MainTransportType";
import Testimonials from "./components/Testimonials";
import WhyChooseUs from "./components/WhyChooseUS";
import Faq from "./components//Faq";
import ServiceSection from "./components/MainContact";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";



export default function Home() {
  return (
    <>
     <Navbar />    
     <Hero />
     <MainAboutPage />
     <MainServices />
     <MainTransportType />
     <WhyChooseUs />
     <Extra />
     <Testimonials />
     <Faq />
     <ServiceSection />
      <Footer />
    </>

  );
}
