'use client'
import { Button } from "@/Components/Button";
import { ourServices } from '../data/data';
import Image from "next/image";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function WhatWeOffer() {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F2F2F2] relative">
            <div className="max-w-7xl mx-auto">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <h2 className="text-lg ">
                            WHAT WE OFFER
                        </h2>
                        <p className="text-xl md:text-5xl text-bold text-[#FF5824]">
                            Our Services
                        </p>
                    </div>
                    <Button className="rounded-full bg-[#FF5824] ">
                        VIEW ALL SERVICES
                    </Button>
                </div>


                <div className="flex justify-end gap-4 mb-4">
                    <Button
                        onClick={scrollLeft}
                        className="rounded-full"
                    >
                        <ArrowLeft />
                    </Button>
                    <Button
                        onClick={scrollRight}
                        className="rounded-full"
                    >
                        <ArrowRight />
                    </Button>
                </div>
                <div className="relative">
                    <div
                        ref={containerRef}
                        className="flex gap-6 pb-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                    >
                        {ourServices.map((services, index) => (
                            <div
                                key={index}
                                className="relative flex-shrink-0 w-full sm:w-4/5 md:w-2/3 lg:w-1/2 xl:w-2/5 h-96 snap-start group"
                            >
                                <div className="relative h-full w-full rounded-xl overflow-hidden">
                                    <Image
                                        src={services.image}
                                        alt={services.description}
                                        layout="fill"
                                        objectFit="cover"
                                        className="transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-6">
                                        <h3 className="text-2xl font-bold text-white mb-2 transition-all duration-300 group-hover:mb-4">
                                            {services.name}
                                        </h3>
                                        <div className="text-white/0 group-hover:text-white/90 h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                                            {services.description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}