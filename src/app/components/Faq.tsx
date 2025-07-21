'use client'
import Image from "next/image";
import faqimg from '../../../public/img/faqimg.webp';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { faqs } from "../data/data";
import { Button } from "@/Components/Button";

export default function Faq() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqContainerRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    useEffect(() => {
        if (faqContainerRef.current && imageContainerRef.current) {
            const faqHeight = faqContainerRef.current.offsetHeight;
            imageContainerRef.current.style.height = `${faqHeight}px`;
        }
    }, [openIndex]);

    return (
        <section className="relative  md:py-24 lg:py-32 bg-[#F2F2F2] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-[#FF5824]/20 blur-3xl"></div>
                <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-[#FF5824]/10 blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-12 md:mb-16 lg:mb-20">
                    <span className="inline-block px-4 py-2 text-black text-lg font-medium mb-4">
                        FAQ
                    </span>
                    <h3 className="text-3xl md:text-6xl lg:text-8xl text-gray-600">
                        Got Questions? <br /> We've Got <span className="text-[#FF5824] font-semibold">Answers</span>
                    </h3>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-20">
                    <div className="w-full lg:w-1/2" ref={faqContainerRef}>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200"
                                >
                                    <Button
                                        variant="ghost"
                                        className="w-full flex items-center justify-between p-6 text-left rounded-xl"
                                        onClick={() => toggleFaq(index)}
                                        aria-expanded={openIndex === index}
                                        aria-controls={`faq-${index}`}
                                    >
                                        <h4 className="text-lg md:text-xl font-semibold text-gray-800 pr-4">
                                            {faq.question}
                                        </h4>
                                        {openIndex === index ? (
                                            <ChevronUp className="w-6 h-6 text-[#FF5824] flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-6 h-6 text-gray-500 flex-shrink-0" />
                                        )}
                                    </Button>
                                    <div
                                        id={`faq-${index}`}
                                        className={`px-6 pb-6 pt-4 transition-all duration-300 ${openIndex === index ? 'block' : 'hidden'}`}
                                    >
                                        <p className="text-gray-600">{faq.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className="w-full lg:w-1/2 flex items-center justify-center transition-all duration-300"
                        ref={imageContainerRef}
                    >
                        <div className="relative w-full h-full min-h-[300px] lg:min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
                            <Image
                                src={faqimg}
                                alt="Happy logistics team discussing shipment"
                                fill
                                className="object-cover object-center"
                                quality={90}
                                placeholder="blur"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent flex items-end p-8">
                                <div className="text-white">
                                    <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
                                    <p className="mb-4">Our team is available 24/7 to assist with any inquiries.</p>
                                    <Button
                                        className="rounded-full"
                                        variant="primary"
                                    >
                                        Contact Support
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}