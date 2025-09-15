import { Button } from "@/Components/Button";
import Image from "next/image";
import bg from '../../../public/img/bg.webp';
import { ChevronsRight } from 'lucide-react';
import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative h-screen  w-full overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <Image
                    src={bg}
                    alt="Global freight transportation"
                    fill
                    priority
                    quality={100}
                    className="object-cover object-center"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-[#2E3135]/50" />
            </div>


            <div className="container relative mx-auto flex h-full flex-col justify-center px-6 text-white md:px-12 lg:px-24">
                <div>
                    <h1 className="text-4xl max-w-4xl mb-30 font-bold leading-tight md:text-5xl lg:text-6xl">
                        Your Global Freight Partner — Reliable, Efficient, On Time
                    </h1>

                    <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                        <h3 className="text-lg text-white md:text-xl lg:text-2xl max-w-[600px]">
                            We specialize in domestic and international logistics, offering tailored solutions across land, sea, and air.
                        </h3>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full">
                            <Button
                                variant="primary"
                                className="px-8 py-3 text-lg rounded-full hover:bg-[#2E3135] transition-colors duration-300"
                            >
                                GET A QUOTE
                            </Button>
                            <Link href="/track">
                            <Button
                                variant="outline"
                                className="px-8 py-3 flex items-center  text-lg border-2 border-white text-white rounded-full hover:bg-white hover:text-black transition-colors duration-300"
                            >
                                TRACK SHIPMENT <ChevronsRight />
                            </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}