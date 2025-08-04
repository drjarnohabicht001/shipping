import Image from 'next/image'
import contact1 from '../../../public/img/contacts1.webp'
import { Button } from '@/Components/Button'


export default function ContactHero() {
    return (
        <section className="relative h-screen w-full overflow-hidden">
            <div className="absolute inset-0 -z-50">
                <Image
                    src={contact1}
                    alt='Contact page background'
                    fill
                    className="object-cover object-center"
                    priority
                    quality={100}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30"></div>
            </div>

            <div className="container mx-auto h-full flex flex-col justify-center px-4 lg:px-8">
                <div className="max-w-3xl space-y-8">

                    <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                        CONTACT US <span className="text-[#FF5824]">EASILY</span> ONLINE
                    </h1>

                    <h2 className="text-white text-xl md:text-2xl leading-relaxed md:leading-loose">
                        Whether it's a single parcel or bulk freight, our tailored logistics
                        solutions ensure timely delivery and complete transparency.
                    </h2>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4">
                        <Button
                            variant="primary"
                            size="lg"
                            className='rounded-full hover:bg-[#FF5824] hover:scale-105 transition-all duration-300 shadow-lg'
                        >
                            MORE ABOUT US
                        </Button>

                        <div className="flex flex-col group">
                            <p className="text-lg font-medium text-white/80 group-hover:text-white transition-colors">
                                Give us a call
                            </p>
                            <a
                                href="tel:+090023367811"
                                className="text-2xl font-bold text-white hover:text-[#FF5824] transition-colors flex items-center gap-2"
                            >
                                +0900 2336 7811
                            </a>
                        </div>
                    </div>
                </div>
            </div>           
        </section>
    )
}