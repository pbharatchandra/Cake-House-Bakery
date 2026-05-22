import { MapPin, Clock, Phone, Instagram, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-secondary pt-16 pb-8 border-t-4 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-serif text-2xl mb-6 text-background">Cake House</h3>
            <p className="text-secondary/80 text-sm leading-relaxed max-w-xs mb-6">
              Baking the world a better place, one rustic loaf at a time. Natural ingredients, traditional methods, deeply rooted in our community.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-accent transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-accent transition-colors"><Facebook size={20} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-serif text-lg mb-6 text-background uppercase tracking-wider">Visit Us</h4>
            <ul className="space-y-4 text-sm text-secondary/80">
              <li className="flex items-start">
                <MapPin size={18} className="mr-3 text-accent shrink-0 mt-0.5" />
                <span>123 Baker Street<br />Flour District, CA 90210</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-3 text-accent shrink-0" />
                <span>(555) 867-5309</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif text-lg mb-6 text-background uppercase tracking-wider">Hours</h4>
            <ul className="space-y-3 text-sm text-secondary/80">
              <li className="flex justify-between border-b border-secondary/10 pb-2">
                <span>Tue - Fri</span>
                <span>6:00 AM - 4:00 PM</span>
              </li>
              <li className="flex justify-between border-b border-secondary/10 pb-2">
                <span>Saturday</span>
                <span>7:00 AM - 3:00 PM</span>
              </li>
              <li className="flex justify-between border-b border-secondary/10 pb-2">
                <span>Sunday - Monday</span>
                <span className="text-accent">Closed</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="text-center text-secondary/50 text-xs border-t border-secondary/10 pt-8">
          &copy; {new Date().getFullYear()} Cake House. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
