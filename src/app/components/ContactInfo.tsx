import React from 'react'
import { MapPin, Clock, Mail, Phone } from 'lucide-react'
import AllLocation from './AllLocations'

const contactItems = [
  {
    icon: <MapPin className="text-[#FF5824]" size={24} />,
    title: "Address",
    content: "14960 Florence Trail\nApple Valley, MN 55124"
  },
  {
    icon: <Clock className="text-[#FF5824]" size={24} />,
    title: "Open Hours",
    content: "Monday – Sunday\n9am – 7pm EST"
  },
  {
    icon: <Mail className="text-[#FF5824]" size={24} />,
    title: "Email",
    content: "hello@logistics.com",
    link: "mailto:hello@logistics.com"
  },
  {
    icon: <Phone className="text-[#FF5824]" size={24} />,
    title: "Phone",
    content: "+1 (555) 123-4567",
    link: "tel:+15551234567"
  }
]


const addressItem = contactItems.find(item => item.title === "Address")
const hoursItem = contactItems.find(item => item.title === "Open Hours")

const locationData = {
  name: "Apple Valley HQ",
  address: addressItem?.content || "",
  hours: hoursItem?.content || ""
}

export default function ContactInfo() {
  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-3xl md:text-4xl lg:text-8xl font-bold tracking-tight">
              <span className="text-[#FF5824]">Contact</span> Information
            </h3>
            <p className="text-lg text-gray-600 max-w-md">
              We're proud to be a space where the community comes together.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {contactItems.map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <h4 className="font-semibold text-lg">{item.title}</h4>
                </div>
                {item.link ? (
                  <a
                    href={item.link}
                    className="block text-gray-600 hover:text-[#FF5824] transition-colors whitespace-pre-line"
                  >
                    {item.content}
                  </a>
                ) : (
                  <p className="text-gray-600 whitespace-pre-line">{item.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-100 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="mx-auto text-gray-400" size={48} />
            <p className="mt-4 text-gray-500">Interactive map will be displayed here</p>
          </div>
        </div>
      </section>

      <AllLocation
        name={locationData.name}
        address={locationData.address}
        hours={locationData.hours}
      />
    </>
  )
}
