import Image from "next/image";
import aboutpic from '../../../public/img/aboutpic.webp';

export default function AboutUS() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#F2F2F2]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
     
        <div className="space-y-6 order-2 md:order-1">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            About Us
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            With decades of experience in logistics, we deliver cargo securely and efficiently across the globe. Whether it's a single parcel or bulk freight, our tailored logistics solutions ensure timely delivery and complete transparency.
          </p>          
        </div>

 
        <div className="order-1 md:order-2 relative rounded-lg overflow-hidden shadow-xl">
          <Image
            src={aboutpic}
            alt="About Us"
            layout="responsive"
            width={600}
            height={400}
            className="object-cover w-full h-full"
            placeholder="blur"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-900/10"></div>
        </div>
      </div>
    </section>
  );
}
