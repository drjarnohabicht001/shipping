import Image from "next/image"
import { MapPin, Clock } from "lucide-react"
import contacts2 from '../../../public/img/contacts2.webp'
// import contacts3 from '../../../public/img/contacts3.webp'
// import contacts from '../../../public/img/contacts4.web'

interface LocationProps {
  name: string
  address: string
  hours: string
}

export default function AllLocation({ 
  name, 
  address, 
  hours,
}: LocationProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-8 text-center">Our Locations</h2>
      
      <div className="grid md:grid-cols-3 gap-8 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="md:col-span-1 h-48 md:h-full relative bg-gray-100">           
          <Image 
            src={contacts2}
            alt={`${name} location`}
            fill
            className="object-cover"
          />         
        </div>

        <div className="md:col-span-2 p-6 space-y-6">
          <div>
            <h4 className="text-2xl font-semibold mb-2">{name}</h4>
            <div className="flex items-start gap-3">
              <MapPin className="text-[#FF5824] mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-gray-500">Address:</p>
                <p className="whitespace-pre-line">{address}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="text-[#FF5824] mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-gray-500">Open Hours:</p>
              <p className="whitespace-pre-line">{hours}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
