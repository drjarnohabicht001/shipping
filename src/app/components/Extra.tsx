import Image from 'next/image'
import consB from '../../../public/img/conB.webp'

const features = [
    {
        title: "Secure Container Sealing",
        description: "Tamper-proof protocols for full cargo protection.",
    },
    {
        title: "Global Port Access",
        description: "Seamless operations across major international shipping hubs.",
    },
    {
        title: "Real-Time Tracking",
        description: "Total visibility from origin to destination.",
    },
    {
        title: "Fully Insured Shipments",
        description: "Your cargo is covered for added peace of mind.",
    }
];

export default function Extra() {
    return (
        <section className="relative min-h-screen">
            <div className="absolute inset-0 -z-10">
                <Image
                    src={consB}
                    alt='we can do the shipment'
                    fill
                    className="object-cover"
                    quality={100}
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <p className="text-3xl font-medium text-orange-400 mb-4">
                        Your Cargo, Handled With Care
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        From delicate goods to oversized containers, we ensure secure loading, transport, and delivery—every time.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-6">
                                <span className="text-white text-2xl font-bold">{index + 1}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-white/80">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}