import Image from "next/image";
import { Button } from "@/Components/Button";
import contacts4 from '../../../public/img/contacts4.webp';

export default function AskQuestion() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-24">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="rounded-xl overflow-hidden shadow-lg">
                    <Image
                        src={contacts4}
                        alt="Contact Us"
                        className="w-full h-auto object-cover"
                        placeholder="blur"
                    />
                </div>

                <div className="space-y-6">
                    <h4 className="text-2xl md:text-3xl lg:text-6xl font-bold text-gray-900">
                        Ask a Question
                    </h4>
                    <p className="text-gray-600">
                        Have questions, feedback, or need assistance? Fill out the form below and our team will get back to you as soon as possible.
                    </p>

                    <form className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5824] focus:border-transparent outline-none transition"
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5824] focus:border-transparent outline-none transition"
                                required
                            />
                        </div>
                        <textarea
                            name="message"
                            placeholder="Type your message"
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5824] focus:border-transparent outline-none transition"
                            required
                        ></textarea>

                        <Button className="rounded-full">
                            SEND MESSAGE
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}