import AskQuestion from "../components/AskQuestion";
import ContactHero from "../components/ContactHero";
import ContactInfo from "../components/ContactInfo";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";



export default function page() {

    return (
        <>
         <Navbar />    
            <ContactHero />
            <ContactInfo />
            <AskQuestion />
             <Footer />
        </>
    )
}