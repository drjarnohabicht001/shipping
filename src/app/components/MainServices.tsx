import React from 'react'
import Image from 'next/image'

const services = [
    {
        title: "International Shipping",
        description: "Seamless freight services across continents. We handle all the complexities so you don’t have to.",
        image: "/svg/international.svg"
    },
    {
        title: "Domestic Delivery",
        description: "Fast and dependable freight coverage across the country — from last-mile delivery to bulk transportation.",
        image: "/svg/delivery.svg"
    },
    {
        title: "Air Freight",
        description: "Ideal for time-sensitive shipments. Priority handling and global air cargo partnerships.",
        image: "/svg/airplane.svg"
    },
    {
        title: "Sea Freight",
        description: "Cost-effective solutions for large and heavy cargo. Full container load (FCL) and less than container load (LCL) options available.",
        image: "/svg/ship.svg"
    },
    {
        title: "Customs Clearance",
        description: "Avoid delays and penalties — our experts manage all documentation and regulations for swift border crossings.",
        image: "/svg/sale.svg"
    },
    {
        title: "Transport Types",
        description: "Various modes of transport tailored to your logistics needs including road, rail, air, and sea solutions.",
        image: "/svg/delivery.svg"
    }
];



export default function MainServices() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-[90%] mx-auto">
      
      <div className="text-start mb-12 md:mb-16 lg:mb-20">
        <p className="text-lg md:text-xl font-medium mb-3">
          <span className="inline-block px-3 py-1">
            OUR SERVICES
          </span>
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-7xl lg:max-w-[50%] text-gray-900">
          Comprehensive <span className='text-[#FF5A24]'>Logistics Services</span>
        </h2>
      </div>

     
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {services.map((service, index) => (
          <div 
            key={index}
            className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#ff5b24a3]"
          >
            
            <div className="p-6 md:p-8">
              <div className="w-22 h-22 rounded-lg flex items-center  justify-center mb-4">
                <Image
                  src={service.image} 
                  alt={service.title}
                  width={50}
                  height={50}
                  className=''
                />
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-[#FF5A24] mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>              
             
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

