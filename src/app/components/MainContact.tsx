import { Button } from "@/Components/Button";
import Image from "next/image";
import contain from '../../../public/img/contain.webp';

export default function ServiceSection() {
    return (
        <section className="relative w-full py-8 h-auto  overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Image
                    src={contain}
                    alt="Fleet background"
                    fill
                    style={{ objectFit: "cover" }}
                    quality={100}
                />
            </div>

            <div className="container mx-auto relative z-10 px-4 py-12 lg:py-0">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-16">
                    <div className="lg:w-1/2 text-white p-4 lg:p-8">
                        <span className="font-bold">
                            OUR SERVICES
                        </span>
                        <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold mt-4 mb-6 leading-tight">
                            Diverse Fleet for Every Freight Need
                        </h2>
                        <Button
                            variant="outline"
                            className="border-white text-white hover:bg-white hover:text-[#FF5A24] transition duration-300 rounded-full px-6"
                        >
                            Learn More
                        </Button>
                    </div>

                    <div className="lg:w-1/2 backdrop-blur p-4 sm:p-6 lg:p-10 rounded-2xl shadow-lg border border-white/80 bg-white/10 mb-8 lg:mb-0">
                        <div className="mb-8 lg:mb-10 lg:text-left">
                            <h3 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                                Get <span className="text-[#FF5A24] underline decoration-4 decoration-white">Your Quote</span>
                            </h3>
                            <p className="text-white/90 text-base sm:text-lg md:text-xl font-medium max-w-md mx-auto lg:mx-0">
                                Complete this form and we'll deliver your personalized quote within 24 hours.
                            </p>
                        </div>

                        <form action="#" method="POST" className="space-y-4 sm:space-y-6">
                            <fieldset className="space-y-4 sm:space-y-6 border-none p-0 m-0">
                                <legend className="sr-only">Quote request information</legend>

                                <div className="relative group">
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 placeholder-white/50 text-white font-medium"
                                        placeholder="Name"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="relative group">
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            required
                                            className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 placeholder-white/50 text-white font-medium"
                                            placeholder="Phone Number"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 placeholder-white/50 text-white font-medium"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <select
                                        id="service"
                                        name="service"
                                        title="Service Needed"
                                        required
                                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 text-white font-medium appearance-none"
                                    >
                                        <option value="" disabled selected className="bg-[#ff5824] text-white/50">Select service...</option>
                                        <option value="residential" className="bg-[#ff5824] text-white">Residential moves</option>
                                        <option value="long-distance" className="bg-[#ff5824] text-white">International moves</option>
                                        <option value="heavy" className="bg-[#ff5824] text-white">Oversized loads</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-5 pointer-events-none">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={4}
                                        required
                                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 placeholder-white/50 text-white font-medium"
                                        placeholder="Describe your shipment needs..."
                                    ></textarea>
                                </div>
                            </fieldset>

                            <Button
                                type="submit"
                                variant="outline"
                                className="mt-2 sm:mt-4 text-black font-bold bg-white hover:bg-[#FF5A24] hover:text-white border-none transition duration-300 rounded-full px-6 py-3"
                            >
                                Request Quote Now
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}