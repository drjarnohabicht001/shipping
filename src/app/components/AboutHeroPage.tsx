import Image from "next/image";
import aboutherobg from '../../../public/img/aboutherobg.webp';

export default function AboutUsPage() {
  return (
    <section className="relative h-[50vh] md:h-[70vh] flex items-center pt-20 p-4 md:p-8">
      <div className="absolute inset-0 z-0">
        <Image
          src={aboutherobg}
          alt="About Us background"
          layout="fill"
          objectFit="cover"
          quality={100}
          placeholder="blur"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 text-white w-full h-full flex flex-col md:flex-row justify-between">
        <div className="md:self-center md:w-1/2 pt-4">
          <h1 className="text-2xl">ABOUT US</h1>
          <p className="text-3xl md:text-5xl font-bold italic leading-tight">
            Driven by Trust and Teamwork
          </p>
        </div>
        <div className="md:absolute md:right-8 md:bottom-8 md:w-1/3 lg:w-1/4">
          <p className="text-base md:text-lg leading-relaxed bg-black/50 p-4 md:p-6 rounded">
            Whether it's a single parcel or bulk freight, our tailored logistics solutions ensure timely delivery and complete transparency.
          </p>
        </div>
      </div>
    </section>
  );
}