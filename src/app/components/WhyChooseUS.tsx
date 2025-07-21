import { Button } from "@/Components/Button";
import Image from "next/image";
import whychooseus from '../../../public/img/Whychooseus.webp';

export default function WhyChooseUs() {
    return (
        <section className="relative min-h-screen md:min-h-[800px] lg:min-h-[900px] flex flex-col md:flex-row">
            <div className="order-2 md:order-1 md:w-1/2 relative h-64 md:h-auto">
                <Image
                    src={whychooseus}
                    alt="we are the best in this shipping industry"
                    fill
                    className="object-cover"
                    quality={100}
                />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 lg:py-32 order-1 md:order-2 md:w-1/2 relative z-10">
                <div className="md:ml-auto p-8 md:p-12 lg:p-16">
                    <h3 className="text-lg font-semibold text-[#FF5824] mb-2">WHY CHOOSE US</h3>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Your Trusted Logistics Partner for Global Freight
                    </h2>

                    <p className="text-lg text-gray-600 mb-8">
                        When it comes to shipping, precision and reliability aren't optional—they're essential. Here's why businesses around the world choose us to move what matters:
                    </p>

                    <ul className="space-y-4 mb-10">
                        {[
                            'End-to-End Expertise',
                            'Fast & Transparent Communication',
                            'Flexible Transport Options',
                            'Customs Clearance Made Simple',
                            'Reliability You Can Measure'
                        ].map((item, index) => (
                            <li key={index} className="flex items-start">
                                <svg className="h-6 w-6 text-white bg-[#FF5824] rounded-full p-1 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-lg text-gray-800">{item}</span>
                            </li>
                        ))}
                    </ul>

                    <p className="text-xl font-medium text-gray-900 mb-8">Let's talk about your next shipment</p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            className="bg-[#FF5824] hover:bg-orange-600 rounded-full text-white px-8 py-4 text-lg">
                            CONTACT US
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#FF5824] rounded-full text-[#FF5824] hover:bg-[#FF5824] hover:text-white px-8 py-4 text-lg">
                            GET IN TOUCH
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
