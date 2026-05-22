import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Baking your requests..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center p-8 bg-white/50 border border-secondary/50 rounded-2xl shadow-xl">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <h2 className="text-2xl font-serif text-primary mb-2 text-center">{message}</h2>
        <p className="text-sm text-primary/70 text-center max-w-xs">
          We're handling heavy traffic right now. Your patience is appreciated!
        </p>
      </div>
    </div>
  );
}
