import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { services } from '../data/data'



export default function ServicesPage() {
  return (
    <div className="bg-white">
      {/* Video Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/services-video-poster.jpg"
        >
          <source src="https://cargo-trucking.cmsmasters.net/main/wp-content/uploads/sites/3/2025/07/home-3-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="absolute inset-0 bg-black/40 flex items-center">
          <div className="container mx-auto px-6 lg:px-8 text-white">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                Powering Your <span className="text-[#FF5A24]">Supply Chain</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8">
                End-to-end logistics solutions designed for reliability, speed, and cost efficiency.
              </p>
              <Link 
                href="/contact" 
                className="inline-block bg-[#FF5A24] hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our <span className="text-[#FF5A24]">Comprehensive</span> Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From first mile to last mile, across borders and between modes - we deliver customized logistics solutions for businesses of all sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group"
            >
              <div className="h-48 overflow-hidden">
                <Image
                  src={service.photo}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  placeholder="blur"
                />
              </div>
              <div className="p-8">
                <div className="w-20 h-20 rounded-lg bg-[#FF5A24]/10 flex items-center justify-center mb-6 -mt-14 relative z-10">
                  <Image
                    src={service.image}
                    alt={service.title}
                    width={40}
                    height={40}
                    className="text-[#FF5A24]"
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
                <Link 
                  href={`/services#${service.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-[#FF5A24] font-semibold hover:underline flex items-center"
                >
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Services Sections */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Service <span className="text-[#FF5A24]">Details</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our specialized logistics services designed to meet your exact requirements.
          </p>
        </div>

        <div className="space-y-20">
          {services.map((service, index) => (
            <div 
              key={index}
              id={service.title.toLowerCase().replace(/\s+/g, '-')}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`p-10 ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 rounded-lg bg-[#FF5A24]/10 flex items-center justify-center mr-6">
                      <Image
                        src={service.image}
                        alt={service.title}
                        width={32}
                        height={32}
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">
                      {service.title}
                    </h3>
                  </div>
                  
                  <p className="text-lg text-gray-600 mb-6">
                    {service.longDescription}
                  </p>
                  
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">
                      Key Benefits:
                    </h4>
                    <ul className="space-y-3">
                      {service.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="h-6 w-6 text-[#FF5A24] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link 
                    href="/contact" 
                    className="inline-block bg-[#FF5A24] hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                  >
                    Request This Service
                  </Link>
                </div>
                
                <div className={`relative ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <Image
                    src={service.photo}
                    alt={service.title}
                    placeholder="blur"
                    className="w-full h-full object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FF5A24] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to optimize your supply chain?
          </h2>
          <p className="text-xl mb-8">
            Our logistics experts are standing by to design a custom solution for your business.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/contact" 
              className="bg-white text-[#FF5A24] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition duration-300"
            >
              Get Started
            </Link>
            <Link 
              href="/about" 
              className="bg-transparent border-2 border-white hover:bg-white/10 font-bold py-3 px-8 rounded-lg transition duration-300"
            >
              Learn About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}