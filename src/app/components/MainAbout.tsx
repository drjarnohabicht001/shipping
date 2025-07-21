import { Button } from "@/Components/Button";
import Image from "next/image";
import { ChevronsRight } from 'lucide-react';
import aboutmainimage from '../../../public/img/aboutmainimg.webp'


export default function MainAboutPage() {
    return (
        <section className="w-full p-8">
            <div className="text-center w-full md:w-[60%] lg:w-[40%] mx-auto mb-16">
                <h2 className="text-xl md:text-2xl text-[#73878B] font-medium mb-4 tracking-wider">
                    ABOUT US
                </h2>
                <h3 className="text-3xl md:text-4xl lg:text-5xl  text-gray-900 mb-6 leading-tight">
                    Connecting the World, One Shipment at a Time
                </h3>
                <p className="text-2xl text-gray-600 leading-relaxed">
                    With decades of experience in logistics, we deliver cargo securely and efficiently across the globe. Whether it's a single parcel or bulk freight, our tailored logistics solutions ensure timely delivery and complete transparency.
                </p>
            </div>

            <div className="w-full relative min-h-[80vh] overflow-hidden"
                style={{ clipPath: 'polygon(50px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50px)' }}
            >

                <div className="w-full h-full absolute -z-20">
                    <Image
                        src={aboutmainimage}
                        alt="about img"
                        fill
                        className="object-cover brightness-[0.4] scale-105"
                        priority
                    />
                </div>

                <div className="absolute inset-0 md:inset-auto md:right-0 h-full w-full md:w-1/2 lg:w-[45%] p-6 md:p-8 lg:p-12
                backdrop-blur-xl bg-white/10 border-l border-white/30
                shadow-2xl shadow-black/30
                transform md:-translate-x-4">
                    <div className="h-full flex flex-col justify-center">
                        <div className="mb-8 lg:mb-12">
                            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                                Driven by Logistics. Powered by People.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-6 border-white text-white rounded-full flex items-center px-6 py-4 text-lg hover:bg-white/10 transition-all"
                            >
                                ABOUT US <ChevronsRight className="ml-2" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
                            <div>
                                <span className="text-5xl sm:text-6xl font-bold text-white block">15+</span>
                                <p className="text-xl font-semibold text-white mt-2">Years of Experience</p>
                                <p className="text-white/80 mt-2 text-lg">
                                    We've built our reputation on reliability, transparency, and innovation.
                                </p>
                            </div>

                            <div>
                                <span className="text-5xl sm:text-6xl font-bold text-white block">3M+</span>
                                <p className="text-xl font-semibold text-white mt-2">Shipments Delivered</p>
                                <p className="text-white/80 mt-2 text-lg">
                                    Our experience spans over a million successful freight movements.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}