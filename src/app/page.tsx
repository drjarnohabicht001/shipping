import Hero from "./components/Hero";
import MainAboutPage from "./components/MainAbout";
import MainServices from "./components/MainServices";
import MainTransportType from "./components/MainTransportType";

export default function Home() {
  return (
    <>
     <Hero />
     <MainAboutPage />
     <MainServices />
     <MainTransportType />
    </>

  );
}
