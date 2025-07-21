import { Button } from "@/Components/Button";
import Image from "next/image";
import ship from '../../../public/img/ship.webp'
import heavy from '../../../public/img/heavy.webp'
import cargo from '../../../public/img/cargo.webp'
import pack from '../../../public/img/pack.webp'



const transportModes = [
    {
        id: "01",
        title: "Cargo Planes",
        subtitle: "For urgent, international deliveries",
        description: "When time is critical, air freight is the fastest way to move goods across borders. Our cargo planes offer rapid global transit for high-value, time-sensitive shipments—ensuring your products reach their destination on schedule, anywhere in the world.",
        cta: "Learn more",
        image: ship
    },
    {
        id: "02",
        title: "Container Ships",
        subtitle: "For global sea freight",
        description: "Ideal for bulk goods and long-distance trade, our container ship network connects major ports worldwide. We provide reliable and cost-effective ocean freight solutions, backed by real-time tracking and full customs support.",
        cta: "Learn more",
        image: heavy
    },
    {
        id: "03",
        title: "Heavy Trucks",
        subtitle: "For regional and long-distance land transport",
        description: "Our fleet of heavy-duty trucks ensures smooth domestic and cross-border deliveries. From full truckloads (FTL) to less-than-truckload (LTL) options, we handle everything from industrial cargo to retail distribution with flexibility and speed.",
        cta: "Learn more",
        image: cargo
    },
    {
        id: "04",
        title: "Delivery Vans",
        subtitle: "For fast, last-mile service",
        description: "Speed and precision matter in the final leg of delivery. Our agile delivery vans provide efficient last-mile transport, ideal for eCommerce, urban logistics, and time-sensitive packages—right to your customer’s door.",
        cta: "Learn more",
        image: pack
    }
];




export default function MainTransportType() {

    return (
        <section className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[#2E3135]">
            <div className=" mx-auto mb-12 md:mb-16 lg:mb-20">
                <span className="text-md font-semibold text-white mb-2">TRANSPORT TYPES</span>
                <p className="text-3xl md:text-7xl font-bold text-white">Diverse Fleet for <br /> Every Freight Need</p>
            </div>


            {transportModes.map((transport, index) => (
                <div
                    key={index}
                    className="mx-auto my-8 rounded-xl shadow-lg overflow-hidden px-4 lg:flex items-start even:bg-[#2E3135] odd:bg-[#282A2C]"
                >
                    <div className=" flex items-center justify-center p-4 lg:p-0 lg:mr-16 xl:mr-28  lg:h-full">
                        <span className="text-[#FF5824] text-6xl lg:text-8xl font-bold">
                            {transport.id}
                        </span>
                    </div>

                    <div className="lg:w-5/12 flex flex-col justify-between p-6 sm:p-8 lg:p-12">
                        <div className="text-white">
                            <h4 className="text-2xl text-[#FF5824] sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
                                {transport.title}
                            </h4>
                            <h6 className="text-lg sm:text-xl font-medium mb-8 sm:mb-12 lg:mb-16">
                                {transport.subtitle}
                            </h6>
                            <p className="mb-6 sm:mb-8 leading-relaxed text-white/90">
                                {transport.description}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-fit border-white hover:bg-white hover:text-black text-white px-6 py-3 rounded-full transition-colors"
                        >
                            {transport.cta}
                        </Button>
                    </div>

                    <div className="lg:w-6/12 h-64 sm:h-80 lg:h-[400px]  flex items-center justify-center p-4">
                        <Image
                            src={transport.image}
                            alt={transport.subtitle}
                            width={600}
                            height={400}
                            className="w-full h-full object-contain"
                            priority={index === 0}
                        />
                    </div>
                </div>
            ))}
        </section>
    )
}