

import { Star, Quote } from "lucide-react";
import Image from 'next/image';
import { testimonials } from '../data/data';

export default function Testimonials() {
    return (
        <section className="relative py-16 md:py-24 lg:py-32 bg-[#F2F2F2] overflow-hidden">

            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-[#ff5824]/20 blur-3xl"></div>
                <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-[#ff5824]/10 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="mb-16 md:mb-20">
                    <span className="text-black text-sm font-medium ">
                        TESTIMONIALS
                    </span>
                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mt-4">
                        WHAT OUR <br /> <span className="text-[#ff5824] md:text-7xl">CLIENTS</span> SAY
                    </h3>
                </div>



                <div className="flex space-x-6 overflow-x-auto scrollbar-thin scrollbar-thumb-[#ff5824]/50 scrollbar-track-gray-200 py-4">
                    {testimonials.map((testimony, index) => (
                        <div
                            key={index}
                            className="min-w-[300px] group bg-white border border-gray-200 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
                        >

                            <Quote className="w-10 h-10 text-[#ff5824]/30 mb-6 group-hover:text-[#ff5824]/50 transition-colors" />


                            <div className="flex mb-4 text-[#ff5824]">
                                {[...Array(testimony.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-current" />
                                ))}
                            </div>

                            <p className="text-lg text-gray-700 mb-8 italic relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#ff5824]">
                                {testimony.quote}
                            </p>

                            <div className="flex items-center">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-[#ff5824] transition-all">
                                    <Image
                                        src={testimony.image}
                                        alt={testimony.name}
                                        width={48}
                                        height={48}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="ml-4">
                                    <p className="font-bold text-black">{testimony.name}</p>
                                    <span className="text-sm text-gray-600">{testimony.company}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}