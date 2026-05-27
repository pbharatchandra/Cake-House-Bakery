export function Hero({ onOrderClick }: { onOrderClick: () => void }) {
  return (
    <div className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=2000&q=80" 
          alt="Rustic bakery interior" 
          className="w-full h-full object-cover"
        />
        {/* Warm Overlay */}
        <div className="absolute inset-0 bg-[#4A2C2A]/60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-background mb-6 drop-shadow-md pb-2">
          Great Taste In Every Bite.
        </h2>
        <p className="text-lg md:text-xl text-secondary mb-10 font-medium">
          Handcrafted sourdough, delicate pastries, and custom cakes baked fresh daily with stone-milled flour and generations of love.
        </p>
        <button 
          onClick={onOrderClick}
          className="px-8 py-3 bg-accent text-background font-medium text-lg rounded-sm shadow-lg hover:bg-accent/90 transform hover:-translate-y-0.5 transition-all">
          Order for Pickup
        </button>
      </div>
    </div>
  );
}
