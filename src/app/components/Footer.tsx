import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react"
import { FooterLogo } from "../../../public/svg/footerlogo"

export default function Footer() {
    return (
        <footer className="bg-[#282A2C] text-white pt-12 pb-6 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto">         
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">     
                    <div className="space-y-4">
                        <div className="mb-4">
                            <FooterLogo />
                        </div>
                        <p className="text-gray-300">
                            Providing reliable moving and freight services since 2010. We make your relocation seamless and stress-free.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                <Facebook  />
                            </a>
                            <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                <Twitter  />
                            </a>
                            <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                <Instagram  />
                            </a>
                            <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                <Linkedin  />
                            </a>
                            <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                <Youtube  />
                            </a>
                        </div>
                    </div>

      
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-gray-600 pb-2">Quick Links</h2>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About us</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Our services</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contacts</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Shop</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Testimonials</a></li>
                        </ul>
                    </div>

           
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-gray-600 pb-2">Our Services</h2>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Residential Moves</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Commercial Relocations</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Long-Distance & International Moves</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Expedited Freight Services</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Heavy Haul & Oversized Loads</a></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-gray-600 pb-2">Contact Us</h2>
                        <address className="not-italic text-gray-300 space-y-2">
                            <p>1234 Street Name, City, State, 12345</p>
                            <p>Email: Support@globalbridgelogistics.eu</p>
                            <p>Phone: (123) 456-7890</p>
                            <p>Fax: (123) 456-7891</p>
                        </address>
                        <div className="pt-2">
                            <button className="bg-white text-[#282A2C] px-4 py-2 rounded hover:bg-gray-200 transition-colors font-medium">
                                Get a Free Quote
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
                    <small className="text-gray-400 mb-4 md:mb-0">
                        &copy; 2025 Company Name. All rights reserved.
                    </small>
                    <div className="flex space-x-6">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Sitemap</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}