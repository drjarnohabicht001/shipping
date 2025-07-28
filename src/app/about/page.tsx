import AboutHeroPage from "../components/AboutHeroPage";
import AboutUs from "../components/AboutUs";
import ServiceSection from "../components/MainContact";
import Testimonials from "../components/Testimonials";
import WhatWeOffer from "../components/WhatWeOffer";


export default function Page() {
  return (
    <>
      <AboutHeroPage />
      <AboutUs />

      <WhatWeOffer />
      <Testimonials />
      <ServiceSection />

    </>
  );
}
